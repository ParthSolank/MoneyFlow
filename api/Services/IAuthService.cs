using MoneyFlowApi.Models.DTOs;

namespace MoneyFlowApi.Services;

public interface IAuthService
{
    Task<object> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request);
}
