using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoneyFlowApi.Models;

public class Goal
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    [Column(TypeName = "decimal(18, 2)")]
    public decimal TargetAmount { get; set; }

    [Required]
    [Column(TypeName = "decimal(18, 2)")]
    public decimal CurrentAmount { get; set; }

    public DateTime? Deadline { get; set; }

    public string? Category { get; set; }

    public string? Color { get; set; } = "#4f46e5"; // Default purple
    
    public int? LedgerId { get; set; }
    
    [ForeignKey("LedgerId")]
    public Ledger? Ledger { get; set; }

    [Required]
    public int CompanyId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}
