namespace MoneyFlowApi.Models;

public class UserContext
{
    public int? UserId { get; set; }
    public int? CompanyId { get; set; }
    public string Role { get; set; } = string.Empty;
}
