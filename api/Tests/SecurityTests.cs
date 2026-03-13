using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;
using MoneyFlowApi.Models.DTOs;
using MoneyFlowApi.Services;
using Moq;
using Xunit;
using Microsoft.Extensions.Configuration;

namespace MoneyFlowApi.Tests;

public class SecurityTests
{
    [Fact]
    public async Task RegisterAsync_ShouldHardcodeUserRole_EvenIfRoleProvidedInRequest()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MoneyFlowDbContext>()
            .UseInMemoryDatabase(databaseName: "SecurityTestDb_Registration")
            .Options;

        using var context = new MoneyFlowDbContext(options);
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["JwtSettings:Secret"]).Returns("LongEnoughSecretForTestingPurpose123!");
        
        var authService = new AuthService(context, configMock.Object);

        var request = new RegisterRequest
        {
            Username = "attacker",
            Email = "attacker@evil.com",
            Password = "Password123!"
            // Note: Role/Rights removed from DTO, but even if using reflection or old DTO:
        };

        // Act
        var response = await authService.RegisterAsync(request);

        // Assert
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == "attacker@evil.com");
        Assert.NotNull(user);
        Assert.Equal("User", user.Role); // Should be User, not Admin
        Assert.DoesNotContain("ADMIN_RIGHT", user.Rights);
    }
}
