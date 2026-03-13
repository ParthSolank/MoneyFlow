using MoneyFlowApi.Models;
using System.Security.Claims;

namespace MoneyFlowApi.Middleware;

public class UserContextMiddleware
{
    private readonly RequestDelegate _next;

    public UserContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, UserContext userContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            // Try standard and common claim types for UserId
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier) ?? 
                             context.User.FindFirst("nameid") ??
                             context.User.FindFirst("sub");

            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                userContext.UserId = userId;
            }

            // Try standard and common claim types for Role
            var roleClaim = context.User.FindFirst(ClaimTypes.Role) ??
                           context.User.FindFirst("role") ??
                           context.User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role");

            if (roleClaim != null)
            {
                userContext.Role = roleClaim.Value;
            }

            if (context.Request.Headers.TryGetValue("X-Company-Id", out var companyIdStr))
            {
                if (int.TryParse(companyIdStr, out int companyId) && companyId > 0)
                {
                    // SECURITY: Verify that this user has access to this company
                    // Admins bypass this check
                    if (userContext.Role == "Admin")
                    {
                        userContext.CompanyId = companyId;
                    }
                    else
                    {
                        var dbContext = context.RequestServices.GetRequiredService<MoneyFlowApi.Data.MoneyFlowDbContext>();
                        var hasAccess = dbContext.Companies.Any(c => c.Id == companyId && c.OwnerUserId == userContext.UserId);
                        
                        if (hasAccess)
                        {
                            userContext.CompanyId = companyId;
                        }
                        else
                        {
                            // Optional: Log unauthorized access attempt
                            var logger = context.RequestServices.GetRequiredService<ILogger<UserContextMiddleware>>();
                            logger.LogWarning("Unauthorized access attempt to Company {CompanyId} by User {UserId}", companyId, userContext.UserId);
                            // userContext.CompanyId remains null, query filters will return empty
                        }
                    }
                }
            }
        }

        await _next(context);
    }
}
