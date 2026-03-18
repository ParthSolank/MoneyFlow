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
    private readonly ILogger<AuthService> _logger;

    public AuthService(MoneyFlowDbContext context, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
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
            Role = "User",
            IsActive = false,
            ActivationKey = activationKey,
            // MEDIUM FIX #9: Use PermissionSets — single source of truth
            Rights = new List<string>(PermissionSets.DefaultUser),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        // Send activation email (handle properly - don't fire-and-forget)
        try
        {
            await SendActivationEmailAsync(request.Email, activationKey);
        }
        catch (Exception ex)
        {
            // Log safely — never log the full SMTP credentials
            _logger.LogWarning("Email sending failed for {Email}: {ExType}", request.Email, ex.GetType().Name);
        }

        return new { message = "Registration successful. Please check your email to activate your account.", email = request.Email };
    }

    private string GenerateActivationKey()
    {
        // HIGH FIX: Use rejection sampling to eliminate modulo bias.
        // Simple b % chars.Length on a 256-range byte causes the first 8 chars to appear
        // slightly more often, making keys marginally more guessable.
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        using var rng = RandomNumberGenerator.Create();
        var result = new StringBuilder(8);
        byte[] data = new byte[1];
        // Maximum unbiased value: largest multiple of chars.Length that fits in a byte
        int maxUnbiased = (256 / chars.Length) * chars.Length;

        while (result.Length < 8)
        {
            rng.GetBytes(data);
            if (data[0] < maxUnbiased) // Reject values that would cause bias
                result.Append(chars[data[0] % chars.Length]);
        }
        return result.ToString();
    }

    private async Task SendActivationEmailAsync(string toEmail, string activationKey)
    {
        try
        {
            // Get configuration from appsettings.json
            var senderEmail = _configuration["EmailSettings:SenderEmail"];
            var senderPassword = _configuration["EmailSettings:Password"];
            var smtpServer = _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
            var smtpPort = int.TryParse(_configuration["EmailSettings:SmtpPort"], out int port) ? port : 587;

            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
            {
                Console.WriteLine("Email settings not configured in appsettings.json under 'EmailSettings'. Email cannot be sent.");
                return;
            }

            using var client = new SmtpClient(smtpServer, smtpPort);
            client.EnableSsl = true;
            client.UseDefaultCredentials = false;
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
            // Log safely — never log full SMTP credentials from exception messages
            _logger.LogError("Failed to send activation email: {ExType}", ex.GetType().Name);
        }
    }

    public async Task<bool> ActivateAccountAsync(ActivateRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);

        if (user == null)
            throw new ArgumentException("Invalid email or activation key.");

        if (user.IsActive)
            throw new ArgumentException("Invalid email or activation key.");

        // HIGH FIX: Use constant-time comparison to prevent timing attacks.
        // Plain string != short-circuits at the first differing character, leaking
        // timing information attackers can use to guess keys character by character.
        var storedKeyBytes = System.Text.Encoding.UTF8.GetBytes(user.ActivationKey ?? string.Empty);
        var providedKeyBytes = System.Text.Encoding.UTF8.GetBytes(request.ActivationKey ?? string.Empty);
        if (!System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(storedKeyBytes, providedKeyBytes))
            throw new ArgumentException("Invalid email or activation key.");

        // Activate
        user.IsActive = true;
        user.ActivationKey = null; // Clear the key once used
        user.UpdatedAt = DateTime.UtcNow;

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ResendActivationEmailAsync(ResendActivationRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);

        // Don't reveal if the user exists or is already active to prevent user enumeration
        if (user == null || user.IsActive)
        {
            // Return success anyway to prevent account enumeration
            return true;
        }

        // Generate new activation key
        var newActivationKey = GenerateActivationKey();
        user.ActivationKey = newActivationKey;
        user.UpdatedAt = DateTime.UtcNow;

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        // Send activation email with new key
        try
        {
            await SendActivationEmailAsync(request.Email, newActivationKey);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Email resend failed for {Email}: {ExType}", request.Email, ex.GetType().Name);
        }

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
            // Don't reveal account activation status to prevent user enumeration
            throw new UnauthorizedAccessException("Invalid email or password.");
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
        var issuer = _configuration["JwtSettings:Issuer"] ?? "MoneyFlowPro";
        var audience = _configuration["JwtSettings:Audience"] ?? "MoneyFlowProUsers";
        var secret = _configuration["JwtSettings:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ValidateLifetime = false // Only lifetime is disabled - we're checking expired tokens during refresh flow
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

    public async Task<bool> SeedMasterAsync()
    {
        // Read master credentials from environment variables
        var masterEmail = _configuration["MASTER_EMAIL"];
        var masterUsername = _configuration["MASTER_USERNAME"];
        var masterPassword = _configuration["MASTER_PASSWORD"];

        // Only seed if environment variables are provided
        if (string.IsNullOrEmpty(masterEmail) || string.IsNullOrEmpty(masterUsername) || string.IsNullOrEmpty(masterPassword))
        {
            Console.WriteLine("Master credentials not configured in environment variables. Skipping master user seeding.");
            return false;
        }

        var masterUser = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Username == masterUsername);
        if (masterUser != null)
        {
            if (masterUser.Email != masterEmail)
            {
                masterUser.Email = masterEmail;
                masterUser.UpdatedAt = DateTime.UtcNow;
                _context.Users.Update(masterUser);
                await _context.SaveChangesAsync();
                return true;
            }
            return false;
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(masterPassword);

        var newMasterUser = new User
        {
            Username = masterUsername,
            Email = masterEmail,
            PasswordHash = passwordHash,
            Role = "Admin",
            IsActive = true,
            // MEDIUM FIX #9: Use PermissionSets — single source of truth
            Rights = new List<string>(PermissionSets.Admin),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(newMasterUser);
        await _context.SaveChangesAsync();

        return true;
    }
}
