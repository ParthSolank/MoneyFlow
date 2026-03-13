using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;

namespace MoneyFlowApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly MoneyFlowDbContext _context;
    private readonly UserContext _userContext;

    public StatsController(MoneyFlowDbContext context, UserContext userContext)
    {
        _context = context;
        _userContext = userContext;
    }

    [HttpGet("summary")]
    public async Task<ActionResult> GetSummary([FromQuery] string? startDate, [FromQuery] string? endDate)
    {
        var currentMonth = DateTime.UtcNow.ToString("yyyy-MM");
        
        // Use provided dates if available, otherwise fallback to current month
        string start = startDate ?? $"{DateTime.UtcNow.Year}-{DateTime.UtcNow.Month:D2}-01";
        string end = endDate ?? DateTime.UtcNow.ToString("yyyy-MM-dd");

        var transactions = await _context.Transactions
            .Where(t => string.Compare(t.Date, start) >= 0 && string.Compare(t.Date, end) <= 0)
            .ToListAsync();

        var totalBalance = await _context.Ledgers.SumAsync(l => l.Balance);
        var totalIncome = transactions.Where(t => t.Type == "income").Sum(t => t.Amount);
        var totalExpenses = transactions.Where(t => t.Type == "expense").Sum(t => t.Amount);

        return Ok(new
        {
            TotalBalance = totalBalance, // for UI 'Total Balance'
            Balance = totalBalance,      // fallback
            TotalIncome = totalIncome,   // for UI 'Monthly Income'
            TotalExpenses = totalExpenses // for UI 'Monthly Expenses'
        });
    }

    [HttpGet("monthly-trends")]
    public async Task<ActionResult> GetMonthlyTrends()
    {
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        string startDate = new DateTime(sixMonthsAgo.Year, sixMonthsAgo.Month, 1).ToString("yyyy-MM-dd");

        var transactions = await _context.Transactions
            .Where(t => string.Compare(t.Date, startDate) >= 0)
            .ToListAsync();

        var trends = transactions
            .GroupBy(t => t.Date.Substring(0, 7)) // YYYY-MM
            .Select(g => new
            {
                Month = g.Key,
                Income = g.Where(t => t.Type == "income").Sum(t => t.Amount),
                Expense = g.Where(t => t.Type == "expense").Sum(t => t.Amount),
                Savings = g.Where(t => t.Type == "income").Sum(t => t.Amount) - g.Where(t => t.Type == "expense").Sum(t => t.Amount)
            })
            .OrderBy(x => x.Month)
            .ToList();

        return Ok(trends);
    }

    [HttpGet("category-breakdown")]
    public async Task<ActionResult> GetCategoryBreakdown([FromQuery] string type = "expense")
    {
        var currentMonth = DateTime.UtcNow.ToString("yyyy-MM");
        
        var breakdown = await _context.Transactions
            .Where(t => t.Type == type && t.Date.StartsWith(currentMonth))
            .GroupBy(t => t.Category)
            .Select(g => new
            {
                Category = g.Key,
                Amount = g.Sum(t => t.Amount),
                Count = g.Count()
            })
            .OrderByDescending(x => x.Amount)
            .ToListAsync();

        return Ok(breakdown);
    }

    [HttpGet("wealth-distribution")]
    public async Task<ActionResult> GetWealthDistribution()
    {
        var distribution = await _context.Ledgers
            .GroupBy(l => l.AccountType)
            .Select(g => new
            {
                Type = g.Key,
                Balance = g.Sum(l => l.Balance)
            })
            .ToListAsync();

        return Ok(distribution);
    }
}
