using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MoneyFlowApi.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = "User"; // Default role

    // For Rights, we can store as JSON string or a related entity.
    // Simplifying as a list of strings not persisted directly by EF Core without conversion
    // But since EF Core 8 supports primitive collections for some providers (JSON column in SQL Server recommended)
    // We will use a List<string> and configure it in OnModelCreating.
    public List<string> Rights { get; set; } = new();

    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}
