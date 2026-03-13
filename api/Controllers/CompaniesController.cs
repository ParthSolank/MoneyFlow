using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyFlowApi.Models;
using MoneyFlowApi.Services;
using MoneyFlowApi.Attributes;

namespace MoneyFlowApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly CompanyService _companyService;
    private readonly AuditLogService _auditLogService;

    public CompaniesController(CompanyService companyService, AuditLogService auditLogService)
    {
        _companyService = companyService;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Company>>> GetAll()
    {
        return Ok(await _companyService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Company>> GetById(int id)
    {
        var company = await _companyService.GetByIdAsync(id);
        if (company == null) return NotFound();
        return Ok(company);
    }

    [HttpPost]
    public async Task<ActionResult<Company>> Create([FromBody] Company company)
    {
        var created = await _companyService.CreateAsync(company);
        await _auditLogService.LogAsync("CREATE", "Companies", $"Created company '{created.Name}'.");
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Company company)
    {
        var success = await _companyService.UpdateAsync(id, company);
        if (!success) return NotFound();
        await _auditLogService.LogAsync("UPDATE", "Companies", $"Updated company '{company.Name}'.");
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _companyService.DeleteAsync(id);
        if (!success) return NotFound();
        await _auditLogService.LogAsync("DELETE", "Companies", $"Deleted company with ID {id}.");
        return NoContent();
    }
}
