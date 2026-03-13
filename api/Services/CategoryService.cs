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
            .Include(c => c.SubCategories)
            .Where(c => c.ParentId == null) // Get top level categories
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

    public async Task SeedDefaultCategoriesAsync(int? companyId = null)
    {
        var targetCompanyId = companyId ?? _userContext.CompanyId;
        if (targetCompanyId == null) return;

        // Check if categories already exist for this company
        if (await _context.Categories.AnyAsync(c => c.CompanyId == targetCompanyId)) return;

        var categories = new List<(string Name, string Type, string Icon, string Color, string[] Subs)>
        {
            // INCOME
            ("Salary Income", "income", "Briefcase", "#3b82f6", new[] { "Monthly Salary", "Overtime Payment", "Bonus / Incentive", "Allowance" }),
            ("FD Income", "income", "Bank", "#10b981", new[] { "Interest" }),
            ("Share Income", "income", "TrendingUp", "#059669", new[] { "Profit from Shares", "Dividend" }),
            ("Mutual Fund Income", "income", "PieChart", "#047857", new[] { "MF Profit (Redeem)", "MF Dividend" }),

            // EXPENSE
            ("Food", "expense", "Utensils", "#ef4444", new[] { "Groceries", "Tiffin / Lunch", "Tea / Snacks" }),
            ("Travel", "expense", "Car", "#f59e0b", new[] { "Petrol", "Bus / Auto / Cab", "Office Travel" }),
            ("Home", "expense", "Home", "#8b5cf6", new[] { "Rent", "Electricity", "Gas", "Water", "Internet" }),
            ("Bills", "expense", "Smartphone", "#ec4899", new[] { "Mobile Recharge", "Subscriptions" }),
            ("Personal", "expense", "User", "#6366f1", new[] { "Clothes", "Grooming" }),
            ("Health", "expense", "HeartPulse", "#f43f5e", new[] { "Medicines", "Doctor" }),
            ("Investment Expenses", "expense", "Coins", "#64748b", new[] { "Share Brokerage", "MF Expense Ratio", "Exit Load" }),
            ("Tax", "expense", "Receipt", "#dc2626", new[] { "FD Tax", "Share Tax", "MF Tax" }),
            ("Other", "expense", "MoreHorizontal", "#94a3b8", new[] { "Family", "Gifts", "Emergency" })
        };

        foreach (var cat in categories)
        {
            var parent = new Category
            {
                Name = cat.Name,
                Type = cat.Type,
                Icon = cat.Icon,
                Color = cat.Color,
                CompanyId = targetCompanyId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Categories.Add(parent);
            await _context.SaveChangesAsync();

            foreach (var subName in cat.Subs)
            {
                var sub = new Category
                {
                    Name = subName,
                    Type = cat.Type,
                    Icon = cat.Icon,
                    Color = cat.Color,
                    ParentId = parent.Id,
                    CompanyId = targetCompanyId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Categories.Add(sub);
            }
        }

        await _context.SaveChangesAsync();
        await _auditLog.LogAsync("SEED", "Category", $"Seeded default categories for company ID {targetCompanyId}");
    }
}
