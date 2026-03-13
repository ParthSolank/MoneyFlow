using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;

namespace MoneyFlowApi.Services;

public class CompanyService
{
    private readonly MoneyFlowDbContext _context;
    private readonly UserContext _userContext;
    private readonly AuditLogService _auditLog;

    public CompanyService(MoneyFlowDbContext context, UserContext userContext, AuditLogService auditLog)
    {
        _context = context;
        _userContext = userContext;
        _auditLog = auditLog;
    }

    private IQueryable<Company> GetBaseQuery()
    {
        var query = _context.Companies.Where(c => !c.IsDeleted);
        
        // Normal users only see companies they own
        if (_userContext.Role != "Admin")
        {
            query = query.Where(c => c.OwnerUserId == _userContext.UserId);
        }
        
        return query;
    }

    public async Task<List<Company>> GetAllAsync() =>
        await GetBaseQuery()
            .OrderBy(c => c.Name)
            .ToListAsync();

    public async Task<Company?> GetByIdAsync(int id) =>
        await GetBaseQuery()
            .FirstOrDefaultAsync(c => c.Id == id);

    public async Task<Company> CreateAsync(Company company)
    {
        company.CreatedAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;
        company.IsDeleted = false;
        company.OwnerUserId = _userContext.UserId;

        _context.Companies.Add(company);
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync("Create", "Company", $"Created company '{company.Name}'. ID: {company.Id}");
        
        return company;
    }

    public async Task<bool> UpdateAsync(int id, Company updated)
    {
        var existing = await GetBaseQuery().FirstOrDefaultAsync(c => c.Id == id);
        if (existing == null) return false;

        string summary = $"Updated company '{existing.Name}'";

        existing.Name = updated.Name;
        existing.Description = updated.Description;
        existing.PanNumber = updated.PanNumber;
        existing.GstNumber = updated.GstNumber;
        existing.Address = updated.Address;
        existing.ContactEmail = updated.ContactEmail;
        existing.ContactPhone = updated.ContactPhone;
        existing.IsActive = updated.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditLog.LogAsync("Update", "Company", summary);
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await GetBaseQuery().FirstOrDefaultAsync(c => c.Id == id);
        if (existing == null) return false;

        existing.IsDeleted = true;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditLog.LogAsync("Delete", "Company", $"Soft-deleted company '{existing.Name}'. ID: {id}");
        return true;
    }
}
