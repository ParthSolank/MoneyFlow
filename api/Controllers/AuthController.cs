using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.IdentityModel.Tokens;
using MoneyFlowApi.Models.DTOs;
using MoneyFlowApi.Services;

namespace MoneyFlowApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<object>> Register(RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "An error occurred during registration." });
        }
    }

    [HttpPost("activate")]
    public async Task<IActionResult> Activate(ActivateRequest request)
    {
        try
        {
            await _authService.ActivateAccountAsync(request);
            return Ok(new { message = "Account successfully activated! You can now log in." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "An error occurred during activation." });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            SetAccessTokenCookie(response.Token);
            SetRefreshTokenCookie(response.RefreshToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<AuthResponse>> RefreshToken(RefreshTokenRequest? request)
    {
        try
        {
            // Try to get refresh token from cookie first, then from request body
            var refreshToken = Request.Cookies["refreshToken"] ?? request?.RefreshToken;

            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized(new { message = "Refresh token is missing." });

            var response = await _authService.RefreshTokenAsync(new RefreshTokenRequest
            {
                Token = request?.Token ?? Request.Headers["Authorization"].ToString().Replace("Bearer ", ""),
                RefreshToken = refreshToken
            });

            SetAccessTokenCookie(response.Token);
            SetRefreshTokenCookie(response.RefreshToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (SecurityTokenException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("accessToken");
        Response.Cookies.Delete("refreshToken");
        return Ok(new { message = "Logged out successfully" });
    }

    [HttpGet("seed-master")]
    public async Task<IActionResult> SeedMaster()
    {
        try
        {
            var success = await _authService.SeedMasterAsync();
            if (success)
                return Ok(new { message = "Master account 'home finance' created successfully!" });
            else
                return Conflict(new { message = "Master account already exists." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    private void SetAccessTokenCookie(string accessToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Set to true in production
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddMinutes(15)
        };
        Response.Cookies.Append("accessToken", accessToken, cookieOptions);
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Set to true in production
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(7)
        };
        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}
