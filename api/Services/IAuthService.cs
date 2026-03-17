using MoneyFlowApi.Models.DTOs;

namespace MoneyFlowApi.Services;

public interface IAuthService
{
    Task<object> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request);
    Task<bool> ActivateAccountAsync(ActivateRequest request);
    Task<bool> SeedMasterAsync();
}
