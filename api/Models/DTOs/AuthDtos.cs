
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
