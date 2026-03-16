using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoneyFlowApi.Models;

public class GoalContribution
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int GoalId { get; set; }

    [ForeignKey("GoalId")]
    public Goal? Goal { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    [Column(TypeName = "decimal(18, 2)")]
    public decimal Amount { get; set; }

    [Required]
    public DateTime ContributionDate { get; set; } = DateTime.UtcNow;

    public int? LedgerId { get; set; }

    [ForeignKey("LedgerId")]
    public Ledger? Ledger { get; set; }

    [Required]
    public int CompanyId { get; set; }

    public string? Notes { get; set; }
}
