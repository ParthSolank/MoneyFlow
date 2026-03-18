
using System.ComponentModel.DataAnnotations;

namespace MoneyFlowApi.Models.DTOs;

public class RegisterRequest
{
    [Required]
    public required string Username { get; set; }

    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [MinLength(6)]
    public required string Password { get; set; }
}

public class LoginRequest
{
    [Required]
    public required string Email { get; set; }

    [Required]
    public required string Password { get; set; }
}

public class AuthResponse
{
    public required string Token { get; set; }
    public required string RefreshToken { get; set; }
    public DateTime Expiration { get; set; }
    public required UserDto User { get; set; }

    // Convenience flat accessors used by AuthController response projection.
    // These delegate to the nested User DTO to avoid duplicating state.
    public int UserId => User.Id;
    public string Username => User.Username;
    public string Email => User.Email;
    public string Role => User.Role;
    public List<string> Rights => User.Rights;
    public int? CompanyId { get; set; } // populated by the controller if needed
}

public class UserDto
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Role { get; set; }
    public required List<string> Rights { get; set; }
}

public class RefreshTokenRequest
{
    public string? Token { get; set; }
    public string? RefreshToken { get; set; }
}

public class ActivateRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    public required string ActivationKey { get; set; }
}

public class ResendActivationRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }
}
