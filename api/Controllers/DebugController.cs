using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyFlowApi.Models;
using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;

namespace MoneyFlowApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DebugController : ControllerBase
{
    private readonly UserContext _userContext;
    private readonly MoneyFlowDbContext _context;

    public DebugController(UserContext userContext, MoneyFlowDbContext context)
    {
        _userContext = userContext;
        _context = context;
    }

    [HttpGet("context")]
    public async Task<IActionResult> GetContext()
    {
        var ledgersCount = await _context.Ledgers.CountAsync();
        var transactionsCount = await _context.Transactions.CountAsync();
        
        // Try without filters
        var totalLedgersRaw = await _context.Ledgers.IgnoreQueryFilters().CountAsync();
        var totalTransactionsRaw = await _context.Transactions.IgnoreQueryFilters().CountAsync();

        return Ok(new
        {
            userContext = _userContext,
            filtered = new { ledgers = ledgersCount, transactions = transactionsCount },
            raw = new { ledgers = totalLedgersRaw, transactions = totalTransactionsRaw }
        });
    }
}
