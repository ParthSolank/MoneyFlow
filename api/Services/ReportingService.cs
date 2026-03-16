using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;

namespace MoneyFlowApi.Services;

public class ReportingService
{
    private readonly MoneyFlowDbContext _context;
    private readonly UserContext _userContext;

    public ReportingService(MoneyFlowDbContext context, UserContext _userContext)
    {
        _context = context;
        this._userContext = _userContext;
    }

    public async Task<byte[]> GenerateMonthlyStatementAsync(int month, int year)
    {
        string startDateStr = new DateTime(year, month, 1).ToString("yyyy-MM-dd");
        string endDateStr = new DateTime(year, month, DateTime.DaysInMonth(year, month)).ToString("yyyy-MM-dd");

        var transactions = await _context.Transactions
            .Include(t => t.Ledger)
            .Where(t => !t.IsDeleted &&
                       t.CompanyId == _userContext.CompanyId &&
                       string.Compare(t.Date, startDateStr) >= 0 &&
                       string.Compare(t.Date, endDateStr) <= 0)
            .OrderBy(t => t.Date)
            .ToListAsync();

        var company = await _context.Companies.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == _userContext.CompanyId);

        var totalIncome = transactions.Where(t => t.Type == "income").Sum(t => t.Amount);
        var totalExpense = transactions.Where(t => t.Type == "expense").Sum(t => t.Amount);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                
                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text($"{company?.Name ?? "MoneyFlow"} Statement")
                            .FontSize(24).Bold().FontColor(Colors.Indigo.Medium);
                        col.Item().Text($"Period: {new DateTime(year, month, 1):MMMM yyyy}");
                    });

                    row.ConstantItem(100).AlignRight().Text($"{DateTime.UtcNow:dd-MMM-yyyy}");
                });

                page.Content().PaddingVertical(20).Column(col =>
                {
                    // Summary Cards
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Background(Colors.Grey.Lighten4).Padding(10).Column(c =>
                        {
                            c.Item().Text("Total Income").FontSize(10);
                            c.Item().Text($"₹{totalIncome:N2}").FontSize(16).Bold().FontColor(Colors.Green.Darken2);
                        });
                        row.ConstantItem(10);
                        row.RelativeItem().Background(Colors.Grey.Lighten4).Padding(10).Column(c =>
                        {
                            c.Item().Text("Total Expense").FontSize(10);
                            c.Item().Text($"₹{totalExpense:N2}").FontSize(16).Bold().FontColor(Colors.Red.Darken2);
                        });
                        row.ConstantItem(10);
                        row.RelativeItem().Background(Colors.Grey.Lighten4).Padding(10).Column(c =>
                        {
                            c.Item().Text("Net Flow").FontSize(10);
                            c.Item().Text($"₹{(totalIncome - totalExpense):N2}").FontSize(16).Bold().FontColor(Colors.Indigo.Darken2);
                        });
                    });

                    col.Item().PaddingTop(20).Text("Transaction Details").FontSize(14).Bold();

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(80); // Date
                            columns.RelativeColumn(); // Description
                            columns.ConstantColumn(80); // Category
                            columns.ConstantColumn(100); // Amount
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(CellStyle).Text("Date");
                            header.Cell().Element(CellStyle).Text("Description");
                            header.Cell().Element(CellStyle).Text("Category");
                            header.Cell().Element(CellStyle).AlignRight().Text("Amount");

                            static IContainer CellStyle(IContainer container) => container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                        });

                        foreach (var tx in transactions)
                        {
                            table.Cell().Element(RowStyle).Text(tx.Date);
                            table.Cell().Element(RowStyle).Text(tx.Description);
                            table.Cell().Element(RowStyle).Text(tx.Category);
                            table.Cell().Element(RowStyle).AlignRight().Text($"₹{tx.Amount:N2}").FontColor(tx.Type == "income" ? Colors.Green.Medium : Colors.Red.Medium);

                            static IContainer RowStyle(IContainer container) => container.PaddingVertical(5).BorderBottom(1, Unit.Point).BorderColor(Colors.Grey.Lighten3);
                        }
                    });
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }
    public async Task<List<SmartInsight>> GetSmartInsightsAsync()
    {
        var now = DateTime.UtcNow;
        var currentMonthStart = new DateTime(now.Year, now.Month, 1).ToString("yyyy-MM-dd");
        var prevMonth = now.AddMonths(-1);
        var prevMonthStart = new DateTime(prevMonth.Year, prevMonth.Month, 1).ToString("yyyy-MM-dd");
        var prevMonthEnd = new DateTime(now.Year, now.Month, 1).AddDays(-1).ToString("yyyy-MM-dd");

        var currentTransactions = await _context.Transactions
            .Where(t => !t.IsDeleted && t.CompanyId == _userContext.CompanyId &&
                       string.Compare(t.Date, currentMonthStart) >= 0 && t.Type == "expense")
            .ToListAsync();

        var prevTransactions = await _context.Transactions
            .Where(t => !t.IsDeleted && t.CompanyId == _userContext.CompanyId &&
                       string.Compare(t.Date, prevMonthStart) >= 0 && string.Compare(t.Date, prevMonthEnd) <= 0 && t.Type == "expense")
            .ToListAsync();

        var insights = new List<SmartInsight>();

        // 1. Overall Trend
        var currentTotal = currentTransactions.Sum(t => t.Amount);
        var prevTotal = prevTransactions.Sum(t => t.Amount);

        if (prevTotal > 0)
        {
            var diff = ((currentTotal - prevTotal) / prevTotal) * 100;
            if (diff > 10)
            {
                insights.Add(new SmartInsight 
                { 
                    Type = "warning", 
                    Title = "Spending Alert", 
                    Message = $"Your spending is up {diff:N0}% compared to last month. Consider reviewing your top categories."
                });
            }
            else if (diff < -10)
            {
                insights.Add(new SmartInsight 
                { 
                    Type = "success", 
                    Title = "Great Progress!", 
                    Message = $"You've spent {Math.Abs(diff):N0}% less than last month. Keep it up!"
                });
            }
        }

        // 2. Category Analysis
        var currentByCat = currentTransactions.GroupBy(t => t.Category).Select(g => new { Category = g.Key, Amount = g.Sum(t => t.Amount) });
        var prevByCat = prevTransactions.GroupBy(t => t.Category).Select(g => new { Category = g.Key, Amount = g.Sum(t => t.Amount) });

        foreach (var cur in currentByCat)
        {
            var prev = prevByCat.FirstOrDefault(p => p.Category == cur.Category);
            if (prev != null && prev.Amount > 0)
            {
                var diff = ((cur.Amount - prev.Amount) / prev.Amount) * 100;
                if (diff > 20)
                {
                    insights.Add(new SmartInsight 
                    { 
                        Type = "info", 
                        Title = $"{cur.Category} Check", 
                        Message = $"You've spent ₹{(cur.Amount - prev.Amount):N0} more on {cur.Category} than last month."
                    });
                }
            }
        }

        // 3. Goal Analysis
        var goals = await _context.Goals.Where(g => !g.IsDeleted && g.CurrentAmount < g.TargetAmount).ToListAsync();
        foreach (var goal in goals)
        {
            var remaining = goal.TargetAmount - goal.CurrentAmount;
            if (goal.Deadline.HasValue)
            {
                var daysLeft = (goal.Deadline.Value - DateTime.UtcNow).TotalDays;
                if (daysLeft > 0.1) // Avoid division by very small numbers
                {
                    var neededPerDay = remaining / (decimal)daysLeft;
                    insights.Add(new SmartInsight
                    {
                        Type = "goal",
                        Title = goal.Title,
                        Message = $"You need to save ₹{neededPerDay:N0} daily to reach your target by {goal.Deadline.Value:dd MMM}."
                    });
                }
            }
        }

        return insights;
    }
}

public class SmartInsight
{
    public string Type { get; set; } = string.Empty; // success, warning, info, goal
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
