using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyFlowApi.Models;
using MoneyFlowApi.Services;
using MoneyFlowApi.Attributes;

namespace MoneyFlowApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FinancialYearsController : ControllerBase
{
    private readonly FinancialYearService _fyService;
    private readonly AuditLogService _auditLogService;

    public FinancialYearsController(FinancialYearService fyService, AuditLogService auditLogService)
    {
        _fyService = fyService;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<ActionResult<List<FinancialYear>>> GetAll()
    {
        return Ok(await _fyService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<FinancialYear>> GetById(int id)
    {
        var fy = await _fyService.GetByIdAsync(id);
        if (fy == null) return NotFound();
        return Ok(fy);
    }

    [HttpPost]
    public async Task<ActionResult<FinancialYear>> Create([FromBody] FinancialYear fy)
    {
        var created = await _fyService.CreateAsync(fy);
        await _auditLogService.LogAsync("CREATE", "FinancialYears", $"Created FY '{created.Name}'.");
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] FinancialYear fy)
    {
        var success = await _fyService.UpdateAsync(id, fy);
        if (!success) return NotFound();
        await _auditLogService.LogAsync("UPDATE", "FinancialYears", $"Updated FY '{fy.Name}'.");
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _fyService.DeleteAsync(id);
        if (!success) return NotFound();
        await _auditLogService.LogAsync("DELETE", "FinancialYears", $"Deleted FY ID {id}.");
        return NoContent();
    }
}
