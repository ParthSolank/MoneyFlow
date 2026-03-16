using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace MoneyFlowApi.Attributes;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuthorizeRightAttribute : Attribute, IAuthorizationFilter
{
    private readonly string[] _rights;

    public AuthorizeRightAttribute(params string[] rights)
    {
        _rights = rights;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (!user.Identity.IsAuthenticated)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Check if user has ALL required rights (or ANY depending on intent - usually ALL for strict, ANY for loose)
        // User asked for allowRights(["DELETE_USER"]) implying singular or list.
        // Assuming strict: Must have at least one matching right? Or all? Usually one of them if logical OR, or all if logical AND.
        // Let's implement ANY match (Logical OR) for flexibility, or ALL if that's safer.
        // Usually `[Authorize(Roles="A,B")]` means A OR B.
        // So `AuthorizeRight("A", "B")` should likely mean A OR B.
        // Let's implement: User must have at least one of the specified rights.
        
        // Admin role bypasses all individual rights checks
        if (user.IsInRole("Admin") || user.HasClaim(System.Security.Claims.ClaimTypes.Role, "Admin") || user.HasClaim("role", "Admin"))
        {
            return;
        }

        var userRights = user.FindAll("Right").Select(c => c.Value).ToList();
        
        if (!_rights.Any(r => userRights.Contains(r)))
        {
            context.Result = new ForbidResult();
        }
    }
}
