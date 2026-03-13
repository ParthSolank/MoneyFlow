using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyFlowApi.Models;
using MoneyFlowApi.Services;
using MoneyFlowApi.Attributes;

namespace MoneyFlowApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LedgersController : ControllerBase
{
    private readonly LedgerService _ledgerService;
    private readonly AuditLogService _auditLogService;

    public LedgersController(LedgerService ledgerService, AuditLogService auditLogService)
    {
        _ledgerService = ledgerService;
        _auditLogService = auditLogService;
    }

    // GET: api/ledgers
    [AuthorizeRight("CORE_LEDGERS_VIEW", "CORE_LEDGERS_EDIT", "CORE_LEDGERS_CREATE", "CORE_LEDGERS_DELETE")]
    [HttpGet]
    public async Task<ActionResult<List<Ledger>>> GetAll()
    {
        var ledgers = await _ledgerService.GetAllAsync();
        return Ok(ledgers);
    }

    // GET: api/ledgers/{id}
    [AuthorizeRight("CORE_LEDGERS_VIEW", "CORE_LEDGERS_EDIT", "CORE_LEDGERS_CREATE", "CORE_LEDGERS_DELETE")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Ledger>> GetById(int id)
    {
        var ledger = await _ledgerService.GetByIdAsync(id);
        if (ledger == null)
            return NotFound(new { message = $"Ledger with ID {id} not found" });

        return Ok(ledger);
    }

    // GET: api/ledgers/type/{accountType}
    [HttpGet("type/{accountType}")]
    public async Task<ActionResult<List<Ledger>>> GetByAccountType(string accountType)
    {
        if (accountType != "bank" && accountType != "credit")
            return BadRequest(new { message = "Account type must be 'bank' or 'credit'" });

        var ledgers = await _ledgerService.GetByAccountTypeAsync(accountType);
        return Ok(ledgers);
    }

    // GET: api/ledgers/stats/total-balance
    [HttpGet("stats/total-balance")]
    public async Task<ActionResult<object>> GetTotalBalance()
    {
        var total = await _ledgerService.GetTotalBalanceAsync();
        return Ok(new { totalBalance = total });
    }

    // GET: api/ledgers/stats/balance-by-type/{accountType}
    [HttpGet("stats/balance-by-type/{accountType}")]
    public async Task<ActionResult<object>> GetTotalBalanceByType(string accountType)
    {
        if (accountType != "bank" && accountType != "credit")
            return BadRequest(new { message = "Account type must be 'bank' or 'credit'" });

        var total = await _ledgerService.GetTotalBalanceByTypeAsync(accountType);
        return Ok(new { accountType = accountType, totalBalance = total });
    }

    // GET: api/ledgers/stats/summary
    [HttpGet("stats/summary")]
    public async Task<ActionResult<object>> GetSummary()
    {
        var totalBalance = await _ledgerService.GetTotalBalanceAsync();
        var bankBalance = await _ledgerService.GetTotalBalanceByTypeAsync("bank");
        var creditBalance = await _ledgerService.GetTotalBalanceByTypeAsync("credit");

        return Ok(new
        {
            totalBalance = totalBalance,
            bankBalance = bankBalance,
            creditBalance = creditBalance
        });
    }

    // POST: api/ledgers
    [AuthorizeRight("CORE_LEDGERS_CREATE")]
    [HttpPost]
    public async Task<ActionResult<Ledger>> Create([FromBody] Ledger ledger)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var created = await _ledgerService.CreateAsync(ledger);
        await _auditLogService.LogAsync("CREATE", "Ledgers", $"Created ledger '{created.Name}' (Balance: {created.Balance}).");
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // PUT: api/ledgers/{id}
    [AuthorizeRight("CORE_LEDGERS_EDIT")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Ledger ledger)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var updated = await _ledgerService.UpdateAsync(id, ledger);
        if (!updated)
            return NotFound(new { message = $"Ledger with ID {id} not found" });

        await _auditLogService.LogAsync("UPDATE", "Ledgers", $"Updated ledger '{ledger.Name}' (ID: {id}).");
        return NoContent();
    }

    // PATCH: api/ledgers/{id}/balance
    [AuthorizeRight("CORE_LEDGERS_EDIT")]
    [HttpPatch("{id:int}/balance")]
    public async Task<IActionResult> UpdateBalance(int id, [FromBody] UpdateBalanceRequest request)
    {
        var updated = await _ledgerService.UpdateBalanceAsync(id, request.Balance);
        if (!updated)
            return NotFound(new { message = $"Ledger with ID {id} not found" });

        await _auditLogService.LogAsync("UPDATE", "Ledgers", $"Updated balance for ledger ID {id} to {request.Balance}.");
        return NoContent();
    }

    // DELETE: api/ledgers/{id}
    [AuthorizeRight("CORE_LEDGERS_DELETE")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _ledgerService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { message = $"Ledger with ID {id} not found" });

        await _auditLogService.LogAsync("DELETE", "Ledgers", $"Deleted ledger ID {id}.");
        return NoContent();
    }
}

// Request model for balance updates
public class UpdateBalanceRequest
{
    public decimal Balance { get; set; }
}
