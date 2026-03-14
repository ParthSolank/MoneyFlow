using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

var optionsBuilder = new DbContextOptionsBuilder<MoneyFlowDbContext>();
optionsBuilder.UseSqlServer(connectionString);

using var context = new MoneyFlowDbContext(optionsBuilder.Options);

var users = await context.Users.Where(u => u.Role == "User").ToListAsync();

var defaultRights = new List<string> 
{ 
    "CORE_DASHBOARD_VIEW", "CORE_DASHBOARD_CREATE", "CORE_DASHBOARD_EDIT", "CORE_DASHBOARD_DELETE",
    "CORE_TRANSACTIONS_VIEW", "CORE_TRANSACTIONS_CREATE", "CORE_TRANSACTIONS_EDIT", "CORE_TRANSACTIONS_DELETE",
    "CORE_LEDGERS_VIEW", "CORE_LEDGERS_CREATE", "CORE_LEDGERS_EDIT", "CORE_LEDGERS_DELETE",
    "CORE_CATEGORIES_VIEW", "CORE_CATEGORIES_CREATE", "CORE_CATEGORIES_EDIT", "CORE_CATEGORIES_DELETE",
    "CORE_BUDGETS_VIEW", "CORE_BUDGETS_CREATE", "CORE_BUDGETS_EDIT", "CORE_BUDGETS_DELETE",
    "CORE_GOALS_VIEW",
    "CORE_RECURRING_VIEW"
};

foreach (var user in users)
{
    user.Rights = defaultRights;
    context.Users.Update(user);
}

await context.SaveChangesAsync();
Console.WriteLine($"Successfully updated {users.Count} users with default permissions.");
