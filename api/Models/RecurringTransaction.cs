using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoneyFlowApi.Models;

[Table("RecurringTransactions")]
public class RecurringTransaction
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = string.Empty; // "income" or "expense"

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string PaymentMethod { get; set; } = string.Empty;

    public int? LedgerId { get; set; }

    [ForeignKey("LedgerId")]
    public Ledger? Ledger { get; set; }

    [Required]
    public string Interval { get; set; } = "monthly"; // "daily", "weekly", "monthly", "yearly"

    [Required]
    public int DayOfInterval { get; set; } = 1; // e.g., 1st of month, 1 for Monday (weekly)

    public DateTime NextRunDate { get; set; }

    public DateTime? LastRunDate { get; set; }

    public bool IsActive { get; set; } = true;

    public int? CompanyId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;
}
