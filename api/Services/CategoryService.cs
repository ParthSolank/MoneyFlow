using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;

namespace MoneyFlowApi.Services;

public class CategoryService
{
    private readonly MoneyFlowDbContext _context;
    private readonly UserContext _userContext;
    private readonly AuditLogService _auditLog;

    public CategoryService(MoneyFlowDbContext context, UserContext userContext, AuditLogService auditLog)
    {
        _context = context;
        _userContext = userContext;
        _auditLog = auditLog;
    }

    private IQueryable<Category> GetBaseQuery()
    {
        var query = _context.Categories.Where(c => !c.IsDeleted);
        
        if (_userContext.Role != "Admin")
        {
            query = query.Where(c => c.CompanyId == _userContext.CompanyId || c.CompanyId == null);
        }
        
        return query;
    }

    public async Task<List<Category>> GetAllAsync()
    {
        return await GetBaseQuery()
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<Category?> GetByIdAsync(int id)
    {
        return await GetBaseQuery().FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Category> CreateAsync(Category category)
    {
        category.CreatedAt = DateTime.UtcNow;
        category.UpdatedAt = DateTime.UtcNow;
        
        if (_userContext.Role != "Admin")
        {
            category.CompanyId = _userContext.CompanyId;
        }

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        
        await _auditLog.LogAsync("Create", "Category", $"Created category '{category.Name}'. ID: {category.Id}");
        
        return category;
    }

    public async Task<bool> UpdateAsync(int id, Category updated)
    {
        var existing = await GetBaseQuery().FirstOrDefaultAsync(c => c.Id == id);
        if (existing == null) return false;

        string summary = $"Updated category '{existing.Name}' to '{updated.Name}'";

        existing.Name = updated.Name;
        existing.Type = updated.Type;
        existing.Icon = updated.Icon;
        existing.Color = updated.Color;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditLog.LogAsync("Update", "Category", summary);
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await GetBaseQuery().FirstOrDefaultAsync(c => c.Id == id);
        if (category == null) return false;

        category.IsDeleted = true;
        category.DeletedAt = DateTime.UtcNow;
        _context.Categories.Update(category);
        await _context.SaveChangesAsync();
        
        await _auditLog.LogAsync("Delete", "Category", $"Soft-deleted category '{category.Name}'. ID: {id}");
        return true;
    }
}
