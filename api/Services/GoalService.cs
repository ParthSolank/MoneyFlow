using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;

namespace MoneyFlowApi.Services;

public class GoalService
{
    private readonly MoneyFlowDbContext _context;
    private readonly UserContext _userContext;

    public GoalService(MoneyFlowDbContext context, UserContext userContext)
    {
        _context = context;
        _userContext = userContext;
    }

    public async Task<List<Goal>> GetAllAsync()
    {
        return await _context.Goals
            .Where(g => !g.IsDeleted && g.CompanyId == _userContext.CompanyId)
            .Include(g => g.Ledger)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();
    }

    public async Task<Goal?> GetByIdAsync(int id)
    {
        return await _context.Goals
            .Where(g => !g.IsDeleted && g.CompanyId == _userContext.CompanyId && g.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<Goal> CreateAsync(Goal goal)
    {
        goal.CompanyId = _userContext.CompanyId ?? 0;
        goal.CreatedAt = DateTime.UtcNow;
        goal.UpdatedAt = DateTime.UtcNow;

        _context.Goals.Add(goal);
        await _context.SaveChangesAsync();
        return goal;
    }

    public async Task<bool> UpdateAsync(int id, Goal goal)
    {
        var existing = await _context.Goals
            .Where(g => !g.IsDeleted && g.Id == id)
            .FirstOrDefaultAsync();
        if (existing == null) return false;

        existing.Title = goal.Title;
        existing.Description = goal.Description;
        existing.TargetAmount = goal.TargetAmount;
        existing.CurrentAmount = goal.CurrentAmount;
        existing.Deadline = goal.Deadline;
        existing.Category = goal.Category;
        existing.Color = goal.Color;
        existing.LedgerId = goal.LedgerId;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var goal = await _context.Goals
            .Where(g => !g.IsDeleted && g.Id == id)
            .FirstOrDefaultAsync();
        if (goal == null) return false;

        goal.IsDeleted = true;
        goal.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<GoalContribution>> GetHistoryAsync(int goalId)
    {
        return await _context.GoalContributions
            .Include(c => c.Ledger)
            .Where(c => c.GoalId == goalId)
            .OrderByDescending(c => c.ContributionDate)
            .ToListAsync();
    }

    public async Task<GoalContribution> AddContributionAsync(int goalId, decimal amount, int? ledgerId, string? notes)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var goal = await _context.Goals
                .Where(g => !g.IsDeleted && g.Id == goalId && g.CompanyId == _userContext.CompanyId)
                .FirstOrDefaultAsync();
            if (goal == null) throw new Exception("Goal not found");

            var contribution = new GoalContribution
            {
                GoalId = goalId,
                Amount = amount,
                LedgerId = ledgerId,
                Notes = notes,
                CompanyId = _userContext.CompanyId ?? 0,
                ContributionDate = DateTime.UtcNow
            };

            _context.GoalContributions.Add(contribution);
            await _context.SaveChangesAsync();

            // Use ONLY atomic database update - don't do separate in-memory update
            // This ensures the update is truly atomic even with concurrent requests
            await _context.Goals
                .Where(g => g.Id == goalId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(g => g.CurrentAmount, g => g.CurrentAmount + amount)
                    .SetProperty(g => g.UpdatedAt, DateTime.UtcNow));

            await transaction.CommitAsync();
            return contribution;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
