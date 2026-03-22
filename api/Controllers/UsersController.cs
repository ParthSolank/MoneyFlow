using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;
using MoneyFlowApi.Models.DTOs;
using MoneyFlowApi.Services;

namespace MoneyFlowApi.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly MoneyFlowDbContext _context;
    private readonly AuditLogService _auditLogService;

    public UsersController(MoneyFlowDbContext context, AuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserAdminDto>>> GetAll()
    {
        var users = await _context.Users
            .Select(u => new UserAdminDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role,
                Rights = u.Rights,
                Status = "Active", // Mocking status since there isn't a status field
                Joined = u.CreatedAt
            })
            .ToListAsync();
        return Ok(users);
    }

    [HttpPost]
    public async Task<ActionResult<UserAdminDto>> CreateUser(CreateUserRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email || u.Username == request.Username))
        {
            return BadRequest("Username or Email already exists.");
        }

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            Role = request.Role,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Rights = new List<string> { "CORE_TRANSACTIONS_VIEW", "CORE_LEDGERS_VIEW" },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("CREATE", "Users", $"Created user '{user.Username}' (ID: {user.Id}).");

        var dto = new UserAdminDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            Rights = user.Rights,
            Status = "Active",
            Joined = user.CreatedAt
        };

        return CreatedAtAction(nameof(GetAll), new { id = user.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound("User not found.");

        user.Username = request.Username;
        user.Role = request.Role;
        // user.Status = request.Status; // (If added to DB)
        if (request.Rights != null)
        {
            user.Rights = request.Rights;
        }
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("UPDATE", "Users", $"Updated user '{user.Username}' (ID: {user.Id}) details.");
        
        return NoContent();
    }

    [HttpPatch("{id:int}/password")]
    public async Task<IActionResult> ResetPassword(int id, ResetPasswordRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound("User not found.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("UPDATE", "Users", $"Reset password for user '{user.Username}' (ID: {user.Id}).");
        
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound("User not found.");

        user.IsDeleted = true;
        user.DeletedAt = DateTime.UtcNow;
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("DELETE", "Users", $"Deleted user '{user.Username}' (ID: {user.Id}).");

        return NoContent();
    }
}

public class UserAdminDto
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Role { get; set; }
    public required string Status { get; set; }
    public required List<string> Rights { get; set; }
    public DateTime? Joined { get; set; }
}

public class UpdateUserRequest
{
    public required string Username { get; set; }
    public required string Role { get; set; }
    public required string Status { get; set; }
    public required List<string> Rights { get; set; }
}

public class ResetPasswordRequest
{
    public required string NewPassword { get; set; }
}

public class CreateUserRequest
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required string Role { get; set; }
}
