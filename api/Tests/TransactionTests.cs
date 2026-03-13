using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;
using MoneyFlowApi.Services;
using Moq;
using Xunit;

namespace MoneyFlowApi.Tests;

public class TransactionTests
{
    [Fact]
    public async Task CreateAsync_ShouldUpdateLedgerBalanceAtomics()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MoneyFlowDbContext>()
            .UseInMemoryDatabase(databaseName: "TransactionTestDb_Balance")
            .Options;

        using var context = new MoneyFlowDbContext(options);
        
        var ledger = new Ledger { Id = 1, Name = "Test Wallet", Balance = 1000, AccountType = "bank" };
        context.Ledgers.Add(ledger);
        await context.SaveChangesAsync();

        var userContext = new UserContext { UserId = 1, CompanyId = 1, Role = "User" };
        var auditLogMock = new Mock<AuditLogService>(context, userContext);
        
        var service = new TransactionService(context, userContext, auditLogMock.Object, Enumerable.Empty<IFileParser>());

        var transaction = new Transaction
        {
            Description = "Coffee",
            Amount = 50,
            Type = "expense",
            Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            LedgerId = 1,
            Category = "Food"
        };

        // Act
        await service.CreateAsync(transaction);

        // Assert
        var updatedLedger = await context.Ledgers.FindAsync(1);
        Assert.Equal(950, updatedLedger.Balance);
    }
}
