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
            .Where(t => string.Compare(t.Date, startDateStr) >= 0 && string.Compare(t.Date, endDateStr) <= 0)
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
}
