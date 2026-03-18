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
        // SECURITY FIX #2: Filter by company — users should only see their own data
        var query = _context.RecurringTransactions
            .Where(rt => !rt.IsDeleted)
            .Include(rt => rt.Ledger)
            .AsQueryable();

        if (_userContext.Role != "Admin")
            query = query.Where(rt => rt.CompanyId == _userContext.CompanyId);

        return Ok(await query.ToListAsync());
    }

    [AuthorizeRight("CORE_RECURRING_VIEW")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<RecurringTransaction>> GetById(int id)
    {
        // SECURITY FIX #2: Scope read to current company
        var query = _context.RecurringTransactions
            .Where(rt => rt.Id == id && !rt.IsDeleted)
            .Include(rt => rt.Ledger)
            .AsQueryable();

        if (_userContext.Role != "Admin")
            query = query.Where(rt => rt.CompanyId == _userContext.CompanyId);

        var rt = await query.FirstOrDefaultAsync();
        if (rt == null) return NotFound();
        return Ok(rt);
    }

    [AuthorizeRight("CORE_RECURRING_CREATE")]
    [HttpPost]
    public async Task<ActionResult<RecurringTransaction>> Create(RecurringTransaction rt)
    {
        rt.CreatedAt = DateTime.UtcNow;
        rt.UpdatedAt = DateTime.UtcNow;
        rt.CompanyId = _userContext.CompanyId;

        if (rt.NextRunDate == default)
            rt.NextRunDate = DateTime.UtcNow;

        _context.RecurringTransactions.Add(rt);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("CREATE", "Recurring", $"Setup recurring: {rt.Description} ({rt.Interval})");
        return CreatedAtAction(nameof(GetById), new { id = rt.Id }, rt);
    }

    [AuthorizeRight("CORE_RECURRING_EDIT")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, RecurringTransaction rt)
    {
        var existing = await _context.RecurringTransactions
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted && r.CompanyId == _userContext.CompanyId);
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
        var rt = await _context.RecurringTransactions
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted && r.CompanyId == _userContext.CompanyId);
        if (rt == null) return NotFound();

        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // CRITICAL FIX #1: Use RecurringTransactionId FK for precise lookup.
            // The old approach used fuzzy description+amount matching which could
            // accidentally soft-delete and reverse completely unrelated transactions.
            var createdTransactions = await _context.Transactions
                .Where(t => t.RecurringTransactionId == rt.Id && !t.IsDeleted)
                .ToListAsync();

            foreach (var txn in createdTransactions)
            {
                txn.IsDeleted = true;
                _context.Transactions.Update(txn);

                decimal reversal = txn.Type == "income" ? -txn.Amount : txn.Amount;
                await _context.Ledgers
                    .Where(l => l.Id == txn.LedgerId)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(l => l.Balance, l => l.Balance + reversal)
                        .SetProperty(l => l.UpdatedAt, DateTime.UtcNow));
            }

            rt.IsDeleted = true;
            rt.UpdatedAt = DateTime.UtcNow;
            _context.RecurringTransactions.Update(rt);

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            await _auditLogService.LogAsync("DELETE", "Recurring",
                $"Stopped recurring ID {id} and reversed {createdTransactions.Count} transactions");
            return NoContent();
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }
}
