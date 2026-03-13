using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;

namespace MoneyFlowApi.Services;

public class FinancialYearService
{
    private readonly MoneyFlowDbContext _context;
    private readonly UserContext _userContext;

    public FinancialYearService(MoneyFlowDbContext context, UserContext userContext)
    {
        _context = context;
        _userContext = userContext;
    }

    private IQueryable<FinancialYear> GetBaseQuery()
    {
        var query = _context.FinancialYears.Where(f => !f.IsDeleted);

        if (_userContext.Role != "Admin")
        {
            if (_userContext.CompanyId.HasValue)
            {
                // Show FYs for the specific company OR global ones (CompanyId is null)
                query = query.Where(f => f.CompanyId == _userContext.CompanyId.Value || f.CompanyId == null);
            }
            else
            {
                // If not admin and no company, technically they shouldn't see anything, 
                // but let's allow global ones for now.
                query = query.Where(f => f.CompanyId == null);
            }
        }
        
        return query;
    }

    public async Task<List<FinancialYear>> GetAllAsync() =>
        await GetBaseQuery()
            .OrderByDescending(f => f.StartDate)
            .ToListAsync();

    public async Task<FinancialYear?> GetByIdAsync(int id) =>
        await GetBaseQuery()
            .FirstOrDefaultAsync(f => f.Id == id);

    public async Task<FinancialYear> CreateAsync(FinancialYear fy)
    {
        fy.CompanyId = _userContext.CompanyId;
        fy.CreatedAt = DateTime.UtcNow;
        fy.UpdatedAt = DateTime.UtcNow;
        fy.IsDeleted = false;

        _context.FinancialYears.Add(fy);
        await _context.SaveChangesAsync();

        return fy;
    }

    public async Task<bool> UpdateAsync(int id, FinancialYear updated)
    {
        var existing = await GetBaseQuery().FirstOrDefaultAsync(f => f.Id == id);
        if (existing == null) return false;

        existing.Name = updated.Name;
        existing.StartDate = updated.StartDate;
        existing.EndDate = updated.EndDate;
        existing.IsActive = updated.IsActive;
        existing.Description = updated.Description;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await GetBaseQuery().FirstOrDefaultAsync(f => f.Id == id);
        if (existing == null) return false;

        existing.IsDeleted = true;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }
}
