using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;

namespace MoneyFlowApi.Services;

public class LedgerService
{
    private readonly MoneyFlowDbContext _context;
    private readonly UserContext _userContext;

    public LedgerService(MoneyFlowDbContext context, UserContext userContext)
    {
        _context = context;
        _userContext = userContext;
    }

    private IQueryable<Ledger> GetBaseQuery()
    {
        var query = _context.Ledgers.Where(l => !l.IsDeleted);
        
        // If user is not admin and has a company, filter by it
        // Even admins should probably only see their selected company's ledgers in common UI
        if (_userContext.CompanyId.HasValue)
        {
            query = query.Where(l => l.CompanyId == _userContext.CompanyId.Value);
        }
        else if (_userContext.Role != "Admin")
        {
            // If not admin and no company selected, they shouldn't see anything?
            // Or maybe show nothing.
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
    public async Task<Ledger?> GetByIdAsync(int id) =>
        await GetBaseQuery()
            .FirstOrDefaultAsync(l => l.Id == id);

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
        
        _context.Ledgers.Add(ledger);
        await _context.SaveChangesAsync();
        
        return await GetByIdAsync(ledger.Id) ?? ledger;
    }

    // Update ledger
    public async Task<bool> UpdateAsync(int id, Ledger updatedLedger)
    {
        var existing = await GetBaseQuery().FirstOrDefaultAsync(l => l.Id == id);
        if (existing == null)
            return false;

        existing.Name = updatedLedger.Name;
        existing.Description = updatedLedger.Description;
        existing.Balance = updatedLedger.Balance;
        existing.Icon = updatedLedger.Icon;
        existing.AccountType = updatedLedger.AccountType;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    // Update ledger balance
    public async Task<bool> UpdateBalanceAsync(int id, decimal newBalance)
    {
        var ledger = await GetBaseQuery().FirstOrDefaultAsync(l => l.Id == id);
        if (ledger == null)
            return false;

        ledger.Balance = newBalance;
        ledger.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
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
