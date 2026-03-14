using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Net;
using System.Net.Mail;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;
using MoneyFlowApi.Models.DTOs;

namespace MoneyFlowApi.Services;

public class AuthService : IAuthService
{
    private readonly MoneyFlowDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(MoneyFlowDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<object> RegisterAsync(RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email || u.Username == request.Username))
        {
            throw new ArgumentException("User with this email or username already exists."); // In production, throw generic or custom exception
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var activationKey = GenerateActivationKey();

        var newUser = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = passwordHash,
            Role = "User", // HARDCODED DEFAULT
            IsActive = false,
            ActivationKey = activationKey,
            Rights = new List<string> 
            { 
                "CORE_DASHBOARD_VIEW",
                "CORE_TRANSACTIONS_VIEW", "CORE_TRANSACTIONS_CREATE", "CORE_TRANSACTIONS_EDIT",
                "CORE_LEDGERS_VIEW", "CORE_LEDGERS_CREATE",
                "CORE_CATEGORIES_VIEW",
                "CORE_BUDGETS_VIEW",
                "CORE_GOALS_VIEW",
                "CORE_RECURRING_VIEW"
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();
        
        // Log to console for easy local testing when SMTP is not configured
        Console.WriteLine($"\n[MoneyFlow Security] -> Activation Key for {request.Email} is: {activationKey}\n");

        _ = SendActivationEmailAsync(request.Email, activationKey);

        return new { message = "Registration successful. Please check your email to activate your account.", email = request.Email };
    }

    private string GenerateActivationKey()
    {
        return new Random().Next(100000, 999999).ToString();
    }

    private async Task SendActivationEmailAsync(string toEmail, string activationKey)
    {
        try
        {
            using var client = new SmtpClient("smtp.gmail.com", 587);
            client.EnableSsl = true;
            client.UseDefaultCredentials = false;
            
            var senderEmail = "solankiparth2126@gmail.com";
            // Get password from appsettings.json or Environment Variables
            var senderPassword = _configuration["EmailSettings:Password"]; 
            
            if (string.IsNullOrEmpty(senderPassword))
            {
                Console.WriteLine("SMTP Password is not configured in appsettings.json under 'EmailSettings:Password'. Email cannot be sent.");
                return;
            }

            client.Credentials = new NetworkCredential(senderEmail, senderPassword);

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, "MoneyFlow Pro Admin"),
                Subject = "Activate your Account - MoneyFlow Pro",
                Body = $@"
                    <h2>Welcome to MoneyFlow Pro!</h2>
                    <p>Thank you for registering. To activate your account and start managing your finances, please use the following 6-digit activation key:</p>
                    <h1 style='color: #4f46e5; letter-spacing: 5px;'>{activationKey}</h1>
                    <p>Enter this key on the activation page to continue.</p>
                ",
                IsBodyHtml = true
            };
            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage);
            Console.WriteLine($"Sent activation email to {toEmail} successfully.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send activation email: {ex.Message}");
        }
    }

    public async Task<bool> ActivateAccountAsync(ActivateRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);
        
        if (user == null)
            throw new ArgumentException("User not found.");
            
        if (user.IsActive)
            throw new ArgumentException("Account is already active.");

        if (user.ActivationKey != request.ActivationKey)
            throw new ArgumentException("Invalid activation key.");

        // Activate
        user.IsActive = true;
        user.ActivationKey = null; // Clear the key once used
        user.UpdatedAt = DateTime.UtcNow;

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);
        
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Account not activated. Please verify your email first.");
        }

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var principal = GetPrincipalFromExpiredToken(request.Token);
        if (principal == null)
            throw new UnauthorizedAccessException("Invalid token");

        var userIdClaim = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            throw new UnauthorizedAccessException("Invalid token claims");

        var user = await _context.Users.FindAsync(userId);
        if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        return await GenerateAuthResponseAsync(user);
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var secretKey = _configuration["JwtSettings:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
        var key = Encoding.ASCII.GetBytes(secretKey);
        
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        // Add rights as claims
        if (user.Rights != null)
        {
            foreach (var right in user.Rights)
            {
                claims.Add(new Claim("Right", right));
            }
        }

        var issuer = _configuration["JwtSettings:Issuer"] ?? "MoneyFlowPro";
        var audience = _configuration["JwtSettings:Audience"] ?? "MoneyFlowProUsers";

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = issuer,
            Audience = audience,
            Expires = DateTime.UtcNow.AddMinutes(15), // Short-lived access token
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var jwtToken = tokenHandler.WriteToken(token);

        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return new AuthResponse
        {
            Token = jwtToken,
            RefreshToken = refreshToken,
            Expiration = tokenDescriptor.Expires.Value,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                Rights = user.Rights ?? new List<string>()
            }
        };
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string? token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false, 
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured"))),
            ValidateLifetime = false // Here we are checking expired token, so allow expired
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                throw new SecurityTokenException("Invalid token");
            }    

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
