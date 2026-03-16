using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyFlowApi.Models;
using MoneyFlowApi.Services;

namespace MoneyFlowApi.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
    private readonly AuditLogService _auditLogService;

    public AuditController(AuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<ActionResult<List<AuditLog>>> GetAll()
    {
        var logs = await _auditLogService.GetAllLogsAsync();
        return Ok(logs);
    }
}
