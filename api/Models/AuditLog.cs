using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoneyFlowApi.Models;

[Table("AuditLogs")]
public class AuditLog
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Username { get; set; }

    [Required]
    [MaxLength(50)]
    public string Action { get; set; } // e.g., "CREATE", "UPDATE", "DELETE"

    [Required]
    [MaxLength(100)]
    public string Module { get; set; } // e.g., "Transactions", "Ledgers", "Users", "Rights"

    [Required]
    public string Details { get; set; } = string.Empty;

    public int? CompanyId { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
