namespace MoneyFlowApi.Models;

/// <summary>
/// MEDIUM FIX #9: Single source of truth for permission strings.
/// Previously, permission lists were hardcoded in 3+ places:
///   - AuthService.cs (RegisterAsync)
///   - AuthService.cs (SeedMasterAsync)
///   - UsersController.cs (CreateUser)
/// Any new permission added in one place was silently missed in others.
/// </summary>
public static class PermissionSets
{
    /// <summary>Core permissions granted to every standard user on registration.</summary>
    public static readonly List<string> DefaultUser = new()
    {
        "CORE_DASHBOARD_VIEW", "CORE_DASHBOARD_CREATE", "CORE_DASHBOARD_EDIT", "CORE_DASHBOARD_DELETE",
        "CORE_TRANSACTIONS_VIEW", "CORE_TRANSACTIONS_CREATE", "CORE_TRANSACTIONS_EDIT", "CORE_TRANSACTIONS_DELETE",
        "CORE_LEDGERS_VIEW", "CORE_LEDGERS_CREATE", "CORE_LEDGERS_EDIT", "CORE_LEDGERS_DELETE",
        "CORE_CATEGORIES_VIEW", "CORE_CATEGORIES_CREATE", "CORE_CATEGORIES_EDIT", "CORE_CATEGORIES_DELETE",
        "CORE_BUDGETS_VIEW", "CORE_BUDGETS_CREATE", "CORE_BUDGETS_EDIT", "CORE_BUDGETS_DELETE",
        "CORE_GOALS_VIEW", "CORE_GOALS_CREATE", "CORE_GOALS_EDIT", "CORE_GOALS_DELETE",
        "CORE_RECURRING_VIEW", "CORE_RECURRING_CREATE", "CORE_RECURRING_EDIT", "CORE_RECURRING_DELETE"
    };

    /// <summary>Minimal read-only permissions for Admin-created users needing tighter control.</summary>
    public static readonly List<string> ReadOnly = new()
    {
        "CORE_DASHBOARD_VIEW",
        "CORE_TRANSACTIONS_VIEW",
        "CORE_LEDGERS_VIEW"
    };

    /// <summary>All permissions including admin-level access. Assigned to the master Admin user.</summary>
    public static readonly List<string> Admin = new()
    {
        "CORE_DASHBOARD_VIEW", "CORE_DASHBOARD_CREATE", "CORE_DASHBOARD_EDIT", "CORE_DASHBOARD_DELETE",
        "CORE_TRANSACTIONS_VIEW", "CORE_TRANSACTIONS_CREATE", "CORE_TRANSACTIONS_EDIT", "CORE_TRANSACTIONS_DELETE",
        "CORE_LEDGERS_VIEW", "CORE_LEDGERS_CREATE", "CORE_LEDGERS_EDIT", "CORE_LEDGERS_DELETE",
        "CORE_CATEGORIES_VIEW", "CORE_CATEGORIES_CREATE", "CORE_CATEGORIES_EDIT", "CORE_CATEGORIES_DELETE",
        "CORE_BUDGETS_VIEW", "CORE_BUDGETS_CREATE", "CORE_BUDGETS_EDIT", "CORE_BUDGETS_DELETE",
        "CORE_GOALS_VIEW", "CORE_GOALS_CREATE", "CORE_GOALS_EDIT", "CORE_GOALS_DELETE",
        "CORE_RECURRING_VIEW", "CORE_RECURRING_CREATE", "CORE_RECURRING_EDIT", "CORE_RECURRING_DELETE",
        "ADMIN_USER_MANAGEMENT_VIEW", "ADMIN_USER_MANAGEMENT_CREATE", "ADMIN_USER_MANAGEMENT_EDIT", "ADMIN_USER_MANAGEMENT_DELETE",
        "ADMIN_ACCESS_CONTROL_VIEW", "ADMIN_ACCESS_CONTROL_EDIT",
        "ADMIN_SYSTEM_AUDIT_VIEW",
        "ADMIN_MASTERS_VIEW", "ADMIN_MASTERS_CREATE", "ADMIN_MASTERS_EDIT"
    };
}
