using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;
using MoneyFlowApi.Attributes;
using MoneyFlowApi.Services;

namespace MoneyFlowApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RecurringTransactionsController : ControllerBase
{
    private readonly MoneyFlowDbContext _context;
    private readonly UserContext _userContext;
    private readonly AuditLogService _auditLogService;

    public RecurringTransactionsController(MoneyFlowDbContext context, UserContext userContext, AuditLogService auditLogService)
    {
        _context = context;
        _userContext = userContext;
        _auditLogService = auditLogService;
    }

    [AuthorizeRight("CORE_RECURRING_VIEW")]
    [HttpGet]
    public async Task<ActionResult<List<RecurringTransaction>>> GetAll()
    {
        return await _context.RecurringTransactions.Include(rt => rt.Ledger).ToListAsync();
    }

    [AuthorizeRight("CORE_RECURRING_VIEW")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<RecurringTransaction>> GetById(int id)
    {
        var rt = await _context.RecurringTransactions.Include(rt => rt.Ledger).FirstOrDefaultAsync(x => x.Id == id);
        if (rt == null) return NotFound();
        return rt;
    }

    [AuthorizeRight("CORE_RECURRING_CREATE")]
    [HttpPost]
    public async Task<ActionResult<RecurringTransaction>> Create(RecurringTransaction rt)
    {
        rt.CreatedAt = DateTime.UtcNow;
        rt.UpdatedAt = DateTime.UtcNow;
        rt.CompanyId = _userContext.CompanyId;
        
        // Initial NextRunDate logic
        if (rt.NextRunDate == default)
        {
            rt.NextRunDate = DateTime.UtcNow;
        }

        _context.RecurringTransactions.Add(rt);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("CREATE", "Recurring", $"Setup recurring: {rt.Description} ({rt.Interval})");
        return CreatedAtAction(nameof(GetById), new { id = rt.Id }, rt);
    }

    [AuthorizeRight("CORE_RECURRING_EDIT")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, RecurringTransaction rt)
    {
        var existing = await _context.RecurringTransactions.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Description = rt.Description;
        existing.Amount = rt.Amount;
        existing.Type = rt.Type;
        existing.Category = rt.Category;
        existing.PaymentMethod = rt.PaymentMethod;
        existing.LedgerId = rt.LedgerId;
        existing.Interval = rt.Interval;
        existing.DayOfInterval = rt.DayOfInterval;
        existing.IsActive = rt.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("UPDATE", "Recurring", $"Updated recurring ID {id}");
        return NoContent();
    }

    [AuthorizeRight("CORE_RECURRING_DELETE")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var rt = await _context.RecurringTransactions.FindAsync(id);
        if (rt == null) return NotFound();

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Find all transactions created by this recurring rule that haven't been manually deleted
            var createdTransactions = await _context.Transactions
                .Where(t => t.Description.Contains(rt.Description) &&
                           t.CompanyId == rt.CompanyId &&
                           t.LedgerId == rt.LedgerId &&
                           t.Amount == rt.Amount &&
                           !t.IsDeleted)
                .ToListAsync();

            // Reverse each transaction on the ledger
            foreach (var txn in createdTransactions)
            {
                // Soft delete the transaction
                txn.IsDeleted = true;
                _context.Transactions.Update(txn);

                // Reverse the ledger balance impact
                decimal reversal = txn.Type == "income" ? -txn.Amount : txn.Amount;
                await _context.Ledgers
                    .Where(l => l.Id == txn.LedgerId)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(l => l.Balance, l => l.Balance + reversal)
                        .SetProperty(l => l.UpdatedAt, DateTime.UtcNow));
            }

            // Mark recurring transaction as deleted
            rt.IsDeleted = true;
            rt.UpdatedAt = DateTime.UtcNow;
            _context.RecurringTransactions.Update(rt);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            await _auditLogService.LogAsync("DELETE", "Recurring",
                $"Stopped/Deleted recurring ID {id} and reversed {createdTransactions.Count} created transactions");
            return NoContent();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
