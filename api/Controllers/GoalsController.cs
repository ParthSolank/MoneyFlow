using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyFlowApi.Models;
using MoneyFlowApi.Services;
using MoneyFlowApi.Attributes;

namespace MoneyFlowApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GoalsController : ControllerBase
{
    private readonly GoalService _goalService;
    private readonly AuditLogService _auditLogService;

    public GoalsController(GoalService goalService, AuditLogService auditLogService)
    {
        _goalService = goalService;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    // CRITICAL FIX #3: Was "view_goals" — must match CORE_GOALS_VIEW convention
    [AuthorizeRight("CORE_GOALS_VIEW")]
    public async Task<ActionResult<List<Goal>>> GetAll()
    {
        return Ok(await _goalService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    [AuthorizeRight("CORE_GOALS_VIEW")]
    public async Task<ActionResult<Goal>> GetById(int id)
    {
        var goal = await _goalService.GetByIdAsync(id);
        if (goal == null) return NotFound();
        return Ok(goal);
    }

    [HttpPost]
    [AuthorizeRight("CORE_GOALS_CREATE")]
    public async Task<ActionResult<Goal>> Create(Goal goal)
    {
        if (goal.Deadline.HasValue && goal.Deadline.Value <= DateTime.UtcNow)
            return BadRequest(new { message = "Deadline must be in the future" });

        var created = await _goalService.CreateAsync(goal);
        await _auditLogService.LogAsync("CREATE", "Goals", $"Created saving goal: {created.Title}");
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [AuthorizeRight("CORE_GOALS_EDIT")]
    public async Task<IActionResult> Update(int id, Goal goal)
    {
        if (goal.Deadline.HasValue && goal.Deadline.Value <= DateTime.UtcNow)
            return BadRequest(new { message = "Deadline must be in the future" });

        var updated = await _goalService.UpdateAsync(id, goal);
        if (!updated) return NotFound();
        await _auditLogService.LogAsync("UPDATE", "Goals", $"Updated saving goal ID {id}");
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [AuthorizeRight("CORE_GOALS_DELETE")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _goalService.DeleteAsync(id);
        if (!deleted) return NotFound();
        await _auditLogService.LogAsync("DELETE", "Goals", $"Deleted saving goal ID {id}");
        return NoContent();
    }

    [HttpGet("{id:int}/history")]
    [AuthorizeRight("CORE_GOALS_VIEW")]
    public async Task<ActionResult<List<GoalContribution>>> GetHistory(int id)
    {
        return Ok(await _goalService.GetHistoryAsync(id));
    }

    [HttpPost("{id:int}/contributions")]
    [AuthorizeRight("CORE_GOALS_CREATE")]
    public async Task<ActionResult<GoalContribution>> AddContribution(int id, [FromBody] ContributionRequest request)
    {
        var contribution = await _goalService.AddContributionAsync(id, request.Amount, request.LedgerId, request.Notes);
        await _auditLogService.LogAsync("CREATE", "Goals", $"Added contribution of {request.Amount} to goal ID {id}");
        return Ok(contribution);
    }

    public class ContributionRequest
    {
        public decimal Amount { get; set; }
        public int? LedgerId { get; set; }
        public string? Notes { get; set; }
    }
}
