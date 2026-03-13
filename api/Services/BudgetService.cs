using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;

namespace MoneyFlowApi.Services;

public class BudgetService
{
    private readonly MoneyFlowDbContext _context;
    private readonly UserContext _userContext;

    public BudgetService(MoneyFlowDbContext context, UserContext userContext)
    {
        _context = context;
        _userContext = userContext;
    }

    private IQueryable<Budget> GetBaseQuery()
    {
        var query = _context.Budgets.Where(b => !b.IsDeleted);
        
        if (_userContext.Role != "Admin")
        {
            query = query.Where(b => b.CompanyId == _userContext.CompanyId);
        }
        
        return query;
    }

    public async Task<List<Budget>> GetAllAsync(int? month = null, int? year = null)
    {
        var query = GetBaseQuery().Include(b => b.Category).AsQueryable();
        
        if (month.HasValue) query = query.Where(b => b.Month == month.Value);
        if (year.HasValue) query = query.Where(b => b.Year == year.Value);

        return await query.OrderByDescending(b => b.Year).ThenByDescending(b => b.Month).ToListAsync();
    }

    public async Task<Budget?> GetByIdAsync(int id)
    {
        return await GetBaseQuery().Include(b => b.Category).FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Budget> CreateAsync(Budget budget)
    {
        budget.CreatedAt = DateTime.UtcNow;
        budget.UpdatedAt = DateTime.UtcNow;
        budget.CompanyId = _userContext.CompanyId;

        _context.Budgets.Add(budget);
        await _context.SaveChangesAsync();
        return await GetByIdAsync(budget.Id) ?? budget;
    }

    public async Task<bool> UpdateAsync(int id, Budget updated)
    {
        var existing = await GetBaseQuery().FirstOrDefaultAsync(b => b.Id == id);
        if (existing == null) return false;

        existing.Amount = updated.Amount;
        existing.Month = updated.Month;
        existing.Year = updated.Year;
        existing.CategoryId = updated.CategoryId;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var budget = await GetBaseQuery().FirstOrDefaultAsync(b => b.Id == id);
        if (budget == null) return false;

        budget.IsDeleted = true;
        budget.DeletedAt = DateTime.UtcNow;
        _context.Budgets.Update(budget);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<object> GetBudgetStatusAsync(int month, int year)
    {
        var budgets = await GetBaseQuery()
            .Include(b => b.Category)
            .Where(b => b.Month == month && b.Year == year)
            .ToListAsync();

        var startDate = new DateTime(year, month, 1).ToString("yyyy-MM-dd");
        var endDate = new DateTime(year, month, DateTime.DaysInMonth(year, month)).ToString("yyyy-MM-dd");

        var transactionQuery = _context.Transactions.Where(t => !t.IsDeleted && t.Type == "expense");
        if (_userContext.Role != "Admin")
        {
            transactionQuery = transactionQuery.Where(t => t.CompanyId == _userContext.CompanyId);
        }

        var expenses = await transactionQuery
            .Where(t => string.Compare(t.Date, startDate) >= 0 && string.Compare(t.Date, endDate) <= 0)
            .GroupBy(t => t.Category)
            .Select(g => new { CategoryName = g.Key, Spent = g.Sum(t => t.Amount) })
            .ToListAsync();

        var status = budgets.Select(b => new
        {
            b.Id,
            CategoryName = b.Category?.Name ?? "Unknown",
            b.Amount,
            Spent = expenses.FirstOrDefault(e => e.CategoryName == b.Category?.Name)?.Spent ?? 0,
            Remaining = b.Amount - (expenses.FirstOrDefault(e => e.CategoryName == b.Category?.Name)?.Spent ?? 0),
            PercentUsed = b.Amount > 0 ? (expenses.FirstOrDefault(e => e.CategoryName == b.Category?.Name)?.Spent ?? 0) / b.Amount * 100 : 0
        }).ToList();

        return status;
    }
}
