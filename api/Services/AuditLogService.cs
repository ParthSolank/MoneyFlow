using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;
using System.Security.Claims;

namespace MoneyFlowApi.Services;

public class AuditLogService
{
    private readonly MoneyFlowDbContext _context;
    private readonly UserContext _userContext;

    public AuditLogService(MoneyFlowDbContext context, UserContext userContext)
    {
        _context = context;
        _userContext = userContext;
    }

    public async Task LogAsync(string action, string module, string details)
    {
        var log = new AuditLog
        {
            UserId = _userContext.UserId ?? 0,
            Username = _userContext.UserId.HasValue ? _context.Users.Find(_userContext.UserId)?.Username ?? "System" : "System",
            Action = action,
            Module = module,
            Details = details,
            CompanyId = _userContext.CompanyId,
            Timestamp = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    private IQueryable<AuditLog> GetBaseQuery()
    {
        var query = _context.AuditLogs.AsQueryable();

        if (_userContext.Role != "Admin")
        {
            if (_userContext.CompanyId.HasValue)
            {
                query = query.Where(a => a.CompanyId == _userContext.CompanyId.Value);
            }
            else
            {
                query = query.Where(a => false);
            }
        }

        return query;
    }

    public async Task<List<AuditLog>> GetAllLogsAsync()
    {
        return await GetBaseQuery()
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();
    }
}
