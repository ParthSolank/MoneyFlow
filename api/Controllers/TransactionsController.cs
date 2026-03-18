using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyFlowApi.Models;
using MoneyFlowApi.Services;
using MoneyFlowApi.Attributes;
using MoneyFlowApi.Data;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using MoneyFlowApi.Models.DTOs;

namespace MoneyFlowApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly TransactionService _transactionService;
    private readonly AuditLogService _auditLogService;
    private readonly MoneyFlowDbContext _context;
    private const int MAX_PAGE_SIZE = 100;

    public TransactionsController(TransactionService transactionService, AuditLogService auditLogService, MoneyFlowDbContext context)
    {
        _transactionService = transactionService;
        _auditLogService = auditLogService;
        _context = context;
    }

    // GET: api/transactions
    [AuthorizeRight("CORE_TRANSACTIONS_VIEW", "CORE_TRANSACTIONS_EDIT", "CORE_TRANSACTIONS_CREATE", "CORE_TRANSACTIONS_DELETE")]
    [HttpGet]
    public async Task<ActionResult<PagedResult<Transaction>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        // Validate pagination input
        if (page < 1)
            return BadRequest(new { message = "Page must be >= 1" });
        if (pageSize < 1 || pageSize > MAX_PAGE_SIZE)
            return BadRequest(new { message = $"PageSize must be between 1 and {MAX_PAGE_SIZE}" });

        var result = await _transactionService.GetAllAsync(page, pageSize);
        return Ok(result);
    }

    // GET: api/transactions/{id}
    [AuthorizeRight("CORE_TRANSACTIONS_VIEW", "CORE_TRANSACTIONS_EDIT", "CORE_TRANSACTIONS_CREATE", "CORE_TRANSACTIONS_DELETE")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Transaction>> GetById(int id)
    {
        var transaction = await _transactionService.GetByIdAsync(id);
        if (transaction == null)
        {
            await _auditLogService.LogAsync("ACCESS_DENIED", "Transactions",
                $"Attempted access to non-existent transaction ID {id}");
            return NotFound(new { message = $"Transaction with ID {id} not found" });
        }

        return Ok(transaction);
    }

    // GET: api/transactions/ledger/{ledgerId}
    [AuthorizeRight("CORE_TRANSACTIONS_VIEW")]
    [HttpGet("ledger/{ledgerId:int}")]
    public async Task<ActionResult<PagedResult<Transaction>>> GetByLedgerId(int ledgerId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        // Validate pagination input
        if (page < 1)
            return BadRequest(new { message = "Page must be >= 1" });
        if (pageSize < 1 || pageSize > 100)
            return BadRequest(new { message = "PageSize must be between 1 and 100" });

        var result = await _transactionService.GetByLedgerIdAsync(ledgerId, page, pageSize);
        return Ok(result);
    }

    // GET: api/transactions/type/{type}
    [AuthorizeRight("CORE_TRANSACTIONS_VIEW")]
    [HttpGet("type/{type}")]
    public async Task<ActionResult<List<Transaction>>> GetByType(string type)
    {
        if (type != "income" && type != "expense")
            return BadRequest(new { message = "Type must be 'income' or 'expense'" });

        var transactions = await _transactionService.GetByTypeAsync(type);
        return Ok(transactions);
    }

    // GET: api/transactions/payment-method/{method}
    [AuthorizeRight("CORE_TRANSACTIONS_VIEW")]
    [HttpGet("payment-method/{method}")]
    public async Task<ActionResult<List<Transaction>>> GetByPaymentMethod(string method)
    {
        if (method != "bank" && method != "credit" && method != "cash")
            return BadRequest(new { message = "Payment method must be 'bank', 'credit', or 'cash'" });

        var transactions = await _transactionService.GetByPaymentMethodAsync(method);
        return Ok(transactions);
    }

    // GET: api/transactions/category/{category}
    [AuthorizeRight("CORE_TRANSACTIONS_VIEW")]
    [HttpGet("category/{category}")]
    public async Task<ActionResult<List<Transaction>>> GetByCategory(string category)
    {
        var transactions = await _transactionService.GetByCategoryAsync(category);
        return Ok(transactions);
    }

    // GET: api/transactions/categories
    [AuthorizeRight("CORE_TRANSACTIONS_VIEW")]
    [HttpGet("categories")]
    public async Task<ActionResult<List<string>>> GetAllCategories()
    {
        var categories = await _transactionService.GetAllCategoriesAsync();
        return Ok(categories);
    }

    // GET: api/transactions/date-range?start={startDate}&end={endDate}
    [AuthorizeRight("CORE_TRANSACTIONS_VIEW")]
    [HttpGet("date-range")]
    public async Task<ActionResult<List<Transaction>>> GetByDateRange(
        [FromQuery] string start,
        [FromQuery] string end)
    {
        if (string.IsNullOrEmpty(start) || string.IsNullOrEmpty(end))
            return BadRequest(new { message = "Both start and end dates are required" });

        // MEDIUM FIX #11: Validate date format before passing to the service.
        // Malformed strings (e.g. "not-a-date") reach the DB layer and cause
        // unhandled exceptions that leak stack traces in error responses.
        if (!DateTime.TryParse(start, out var startDate) || !DateTime.TryParse(end, out var endDate))
            return BadRequest(new { message = "Invalid date format. Use YYYY-MM-DD." });

        if (startDate > endDate)
            return BadRequest(new { message = "Start date must be before or equal to end date." });

        var transactions = await _transactionService.GetByDateRangeAsync(start, end);
        return Ok(transactions);
    }

    // GET: api/transactions/stats/income
    [AuthorizeRight("CORE_TRANSACTIONS_VIEW")]
    [HttpGet("stats/income")]
    public async Task<ActionResult<object>> GetTotalIncome([FromQuery] string? start = null, [FromQuery] string? end = null)
    {
        var total = await _transactionService.GetTotalIncomeAsync(start, end);
        return Ok(new { totalIncome = total });
    }

    // GET: api/transactions/stats/expenses
    [AuthorizeRight("CORE_TRANSACTIONS_VIEW")]
    [HttpGet("stats/expenses")]
    public async Task<ActionResult<object>> GetTotalExpenses([FromQuery] string? start = null, [FromQuery] string? end = null)
    {
        var total = await _transactionService.GetTotalExpensesAsync(start, end);
        return Ok(new { totalExpenses = total });
    }

    // GET: api/transactions/stats/summary
    [AuthorizeRight("CORE_TRANSACTIONS_VIEW")]
    [HttpGet("stats/summary")]
    public async Task<ActionResult<object>> GetSummary([FromQuery] string? start = null, [FromQuery] string? end = null)
    {
        var income = await _transactionService.GetTotalIncomeAsync(start, end);
        var expenses = await _transactionService.GetTotalExpensesAsync(start, end);
        var totalBalance = await _transactionService.GetTotalBalanceAsync();

        return Ok(new
        {
            totalIncome = income,
            totalExpenses = expenses,
            balance = (string.IsNullOrEmpty(start) && string.IsNullOrEmpty(end)) ? totalBalance : (income - expenses),
            totalBalance = totalBalance
        });
    }

    // POST: api/transactions
    [AuthorizeRight("CORE_TRANSACTIONS_CREATE")]
    [HttpPost]
    public async Task<ActionResult<Transaction>> Create([FromBody] Transaction transaction)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Validate ledger exists before creating transaction
        if (transaction.LedgerId.HasValue)
        {
            var ledgerExists = await _context.Ledgers.FindAsync(transaction.LedgerId.Value);
            if (ledgerExists == null)
                return BadRequest(new { message = $"Ledger with ID {transaction.LedgerId} not found" });
        }

        try
        {
            var created = await _transactionService.CreateAsync(transaction);
            await _auditLogService.LogAsync("CREATE", "Transactions", $"Created transaction '{created.Description}' (Amount: {created.Amount}).");
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT: api/transactions/{id}
    [AuthorizeRight("CORE_TRANSACTIONS_EDIT")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Transaction transaction)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var updated = await _transactionService.UpdateAsync(id, transaction);
        if (!updated)
            return NotFound(new { message = $"Transaction with ID {id} not found" });

        await _auditLogService.LogAsync("UPDATE", "Transactions", $"Updated transaction ID {id}.");
        return NoContent();
    }

    // DELETE: api/transactions/{id}
    [AuthorizeRight("CORE_TRANSACTIONS_DELETE")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _transactionService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { message = $"Transaction with ID {id} not found" });

        await _auditLogService.LogAsync("DELETE", "Transactions", $"Deleted transaction ID {id}.");
        return NoContent();
    }

    [HttpPost("import")]
    [AuthorizeRight("CORE_TRANSACTIONS_CREATE")]
    public async Task<IActionResult> ImportCsv(IFormFile file, [FromForm] int? ledgerId)
    {
        // Validate file
        const long MaxFileSize = 10 * 1024 * 1024; // 10 MB
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "File is empty." });
        if (file.Length > MaxFileSize)
            return BadRequest(new { message = $"File size exceeds maximum allowed ({MaxFileSize / 1024 / 1024}MB)." });

        // Validate MIME type AND extension — extension alone can be spoofed by renaming files
        var extension = Path.GetExtension(file.FileName).ToLower();
        var allowedExtensions = new[] { ".csv", ".xlsx" };
        if (!allowedExtensions.Contains(extension))
            return BadRequest(new { message = "Invalid file type. Allowed: CSV (.csv), Excel (.xlsx)" });

        // HIGH FIX #8: Validate actual Content-Type header in addition to extension
        var allowedMimeTypes = new[]
        {
            "text/csv",
            "application/csv",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/octet-stream" // Fallback some browsers send for .xlsx
        };
        if (!allowedMimeTypes.Contains(file.ContentType.ToLower()))
            return BadRequest(new { message = "Invalid file content type. Upload a valid CSV or Excel file." });

        try
        {
            using var memStream = new MemoryStream();
            await file.CopyToAsync(memStream);

            var count = await _transactionService.ImportFromStreamAsync(memStream, extension, ledgerId);

            await _auditLogService.LogAsync("IMPORT", "Transactions", $"Imported {count} transactions via File.");
            return Ok(new { message = $"Successfully imported {count} records." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Failed to import file: {ex.Message}" });
        }
    }

    [HttpGet("{id:int}/pdf")]
    [AuthorizeRight("CORE_TRANSACTIONS_VIEW")]
    public async Task<IActionResult> GeneratePdf(int id)
    {
        var tx = await _transactionService.GetByIdAsync(id);
        if (tx == null) return NotFound("Transaction not found.");

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(14).FontFamily(Fonts.Arial));

                page.Header()
                    .Text("Transaction Receipt")
                    .SemiBold().FontSize(30).FontColor(Colors.Blue.Darken2);

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(x =>
                    {
                        x.Spacing(10);
                        x.Item().Text($"Date: {tx.Date}");
                        x.Item().Text($"Description: {tx.Description}");
                        x.Item().Text($"Amount: Rs {tx.Amount.ToString("N2")}");
                        x.Item().Text($"Category: {tx.Category}");
                        x.Item().Text($"Type: {tx.Type}");
                        x.Item().Text($"Payment Method: {tx.PaymentMethod}");
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Receipt Generated by MoneyFlow Pro");
                    });
            });
        });

        byte[] pdfBytes = document.GeneratePdf();
        await _auditLogService.LogAsync("EXPORT", "Transactions", $"Exported transaction ID {id} to PDF.");
        return File(pdfBytes, "application/pdf", $"Transaction_{id}.pdf");
    }
}
