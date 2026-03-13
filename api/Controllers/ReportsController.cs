using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyFlowApi.Services;

namespace MoneyFlowApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly ReportingService _reportingService;

    public ReportsController(ReportingService reportingService)
    {
        _reportingService = reportingService;
    }

    [HttpGet("monthly-statement")]
    public async Task<IActionResult> DownloadMonthlyStatement([FromQuery] int month, [FromQuery] int year)
    {
        if (month < 1 || month > 12 || year < 2000) return BadRequest("Invalid period");

        var pdfBytes = await _reportingService.GenerateMonthlyStatementAsync(month, year);
        string fileName = $"Statement_{year}_{month:D2}.pdf";
        
        return File(pdfBytes, "application/pdf", fileName);
    }
}
