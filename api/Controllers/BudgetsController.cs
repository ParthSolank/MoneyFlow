using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyFlowApi.Models;
using MoneyFlowApi.Services;
using MoneyFlowApi.Attributes;
 
namespace MoneyFlowApi.Controllers;
 
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BudgetsController : ControllerBase
{
    private readonly BudgetService _budgetService;
    private readonly AuditLogService _auditLogService;
 
    public BudgetsController(BudgetService budgetService, AuditLogService auditLogService)
    {
        _budgetService = budgetService;
        _auditLogService = auditLogService;
    }
 
    [AuthorizeRight("CORE_BUDGETS_VIEW", "CORE_BUDGETS_EDIT", "CORE_BUDGETS_CREATE", "CORE_BUDGETS_DELETE")]
    [HttpGet]
    public async Task<ActionResult<List<Budget>>> GetAll([FromQuery] int? month, [FromQuery] int? year)
    {
        return Ok(await _budgetService.GetAllAsync(month, year));
    }
 
    [AuthorizeRight("CORE_BUDGETS_VIEW", "CORE_BUDGETS_EDIT", "CORE_BUDGETS_CREATE", "CORE_BUDGETS_DELETE")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Budget>> GetById(int id)
    {
        var budget = await _budgetService.GetByIdAsync(id);
        if (budget == null) return NotFound();
        return Ok(budget);
    }
 
    [AuthorizeRight("CORE_BUDGETS_VIEW")]
    [HttpGet("status")]
    public async Task<ActionResult> GetStatus([FromQuery] int month, [FromQuery] int year)
    {
        if (month < 1 || month > 12 || year < 2000) return BadRequest("Invalid month or year");
        return Ok(await _budgetService.GetBudgetStatusAsync(month, year));
    }
 
    [AuthorizeRight("CORE_BUDGETS_CREATE")]
    [HttpPost]
    public async Task<ActionResult<Budget>> Create(Budget budget)
    {
        var created = await _budgetService.CreateAsync(budget);
        await _auditLogService.LogAsync("CREATE", "Budgets", $"Set budget for month {created.Month}/{created.Year}");
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
 
    [AuthorizeRight("CORE_BUDGETS_EDIT")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Budget budget)
    {
        var updated = await _budgetService.UpdateAsync(id, budget);
        if (!updated) return NotFound();
        await _auditLogService.LogAsync("UPDATE", "Budgets", $"Updated budget ID {id}");
        return NoContent();
    }
 
    [AuthorizeRight("CORE_BUDGETS_DELETE")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _budgetService.DeleteAsync(id);
        if (!deleted) return NotFound();
        await _auditLogService.LogAsync("DELETE", "Budgets", $"Deleted budget ID {id}");
        return NoContent();
    }
}
