using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;

namespace MoneyFlowApi.Services;

public class LedgerService
{
    private readonly MoneyFlowDbContext _context;
    private readonly UserContext _userContext;
    private readonly AuditLogService _auditLog;

    public LedgerService(MoneyFlowDbContext context, UserContext userContext, AuditLogService auditLog)
    {
        _context = context;
        _userContext = userContext;
        _auditLog = auditLog;
    }

    private IQueryable<Ledger> GetBaseQuery()
    {
        var query = _context.Ledgers.Where(l => !l.IsDeleted);
        
        if (_userContext.CompanyId.HasValue)
        {
            query = query.Where(l => l.CompanyId == _userContext.CompanyId.Value);
        }
        else if (_userContext.Role != "Admin")
        {
            query = query.Where(l => false);
        }
        
        return query;
    }

    // Get all ledgers
    public async Task<List<Ledger>> GetAllAsync() =>
        await GetBaseQuery()
            .OrderBy(l => l.Name)
            .ToListAsync();

    // Get ledger by ID
    public async Task<Ledger?> GetByIdAsync(int id) {
        var ledger = await GetBaseQuery()
            .Include(l => l.Transactions.Where(t => !t.IsDeleted))
            .FirstOrDefaultAsync(l => l.Id == id);

        if (ledger != null && ledger.Transactions != null)
        {
            // Sort transactions after fetch to avoid EF ordering issues
            ledger.Transactions = ledger.Transactions
                .OrderByDescending(t => t.Date)
                .ToList();
        }

        return ledger;
    }

    // Get ledgers by account type (bank/credit)
    public async Task<List<Ledger>> GetByAccountTypeAsync(string accountType) =>
        await GetBaseQuery()
            .Where(l => l.AccountType == accountType)
            .OrderBy(l => l.Name)
            .ToListAsync();

    // Create new ledger
    public async Task<Ledger> CreateAsync(Ledger ledger)
    {
        ledger.CreatedAt = DateTime.UtcNow;
        ledger.UpdatedAt = DateTime.UtcNow;
        ledger.CompanyId = _userContext.CompanyId;
        ledger.InitialBalance = ledger.Balance; // Set initial balance to current balance on creation

        var exists = await GetBaseQuery().AnyAsync(l => l.Name.ToLower() == ledger.Name.ToLower());
        if (exists)
        {
            throw new InvalidOperationException($"An account/ledger with the name '{ledger.Name}' already exists.");
        }
        
        _context.Ledgers.Add(ledger);
        await _context.SaveChangesAsync();
        
        await _auditLog.LogAsync("Create", "Ledger", $"Created ledger '{ledger.Name}' with balance {ledger.Balance}. ID: {ledger.Id}");
        
        return await GetByIdAsync(ledger.Id) ?? ledger;
    }

    // Update ledger
    public async Task<bool> UpdateAsync(int id, Ledger updatedLedger)
    {
        var existing = await GetBaseQuery().FirstOrDefaultAsync(l => l.Id == id);
        if (existing == null)
            return false;

        string summary = $"Updated ledger '{existing.Name}'. Balance: {existing.Balance}->{updatedLedger.Balance}";

        existing.Name = updatedLedger.Name;
        existing.Description = updatedLedger.Description;
        existing.Balance = updatedLedger.Balance;
        existing.InitialBalance = updatedLedger.InitialBalance;
        existing.Icon = updatedLedger.Icon;
        existing.AccountType = updatedLedger.AccountType;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditLog.LogAsync("Update", "Ledger", summary);
        return true;
    }

    // Update ledger balance
    public async Task<bool> UpdateBalanceAsync(int id, decimal newBalance)
    {
        var ledger = await GetBaseQuery().FirstOrDefaultAsync(l => l.Id == id);
        if (ledger == null)
            return false;

        decimal oldBalance = ledger.Balance;
        ledger.Balance = newBalance;
        ledger.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditLog.LogAsync("Update_Balance", "Ledger", $"Balance adjustment for '{ledger.Name}': {oldBalance}->{newBalance}");
        return true;
    }

    // Delete ledger
    public async Task<bool> DeleteAsync(int id)
    {
        var ledger = await GetBaseQuery().FirstOrDefaultAsync(l => l.Id == id);
        if (ledger == null)
            return false;

        ledger.IsDeleted = true;
        ledger.DeletedAt = DateTime.UtcNow;
        _context.Ledgers.Update(ledger);
        await _context.SaveChangesAsync();
        
        await _auditLog.LogAsync("Delete", "Ledger", $"Soft-deleted ledger '{ledger.Name}'. ID: {id}");
        return true;
    }

    // Get total balance across all ledgers
    public async Task<decimal> GetTotalBalanceAsync()
    {
        return await GetBaseQuery().SumAsync(l => l.Balance);
    }

    // Get total balance by account type
    public async Task<decimal> GetTotalBalanceByTypeAsync(string accountType)
    {
        return await GetBaseQuery()
            .Where(l => l.AccountType == accountType)
            .SumAsync(l => l.Balance);
    }
}
