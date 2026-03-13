using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;

namespace MoneyFlowApi.Services;

public class RecurringTransactionWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RecurringTransactionWorker> _logger;

    public RecurringTransactionWorker(IServiceProvider serviceProvider, ILogger<RecurringTransactionWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Processing recurring transactions at {time}", DateTimeOffset.Now);

            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MoneyFlowDbContext>();
                var transactionService = scope.ServiceProvider.GetRequiredService<TransactionService>();

                // We need to bypass the QueryFilter to process all companies
                var recurringToProcess = await context.RecurringTransactions
                    .IgnoreQueryFilters()
                    .Where(rt => rt.IsActive && !rt.IsDeleted && rt.NextRunDate <= DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

                foreach (var rt in recurringToProcess)
                {
                    try
                    {
                        var newTransaction = new Transaction
                        {
                            Description = rt.Description,
                            Amount = rt.Amount,
                            Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                            Type = rt.Type,
                            Category = rt.Category,
                            PaymentMethod = rt.PaymentMethod,
                            LedgerId = rt.LedgerId,
                            CompanyId = rt.CompanyId,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        // Use a "System" user context if required, but here we directly use the TransactionService
                        // However, TransactionService might have logic that depends on the current UserContext
                        // Let's ensure UserContext is stable or handled.
                        
                        await transactionService.CreateAsyncForRecurring(newTransaction);

                        rt.LastRunDate = DateTime.UtcNow;
                        rt.NextRunDate = CalculateNextRunDate(rt);
                        rt.UpdatedAt = DateTime.UtcNow;

                        context.RecurringTransactions.Update(rt);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing recurring transaction {Id}", rt.Id);
                    }
                }

                await context.SaveChangesAsync(stoppingToken);
            }

            // Sleep for 1 hour before next check
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private DateTime CalculateNextRunDate(RecurringTransaction rt)
    {
        var next = DateTime.UtcNow;
        switch (rt.Interval.ToLower())
        {
            case "daily":
                return next.AddDays(1);
            case "weekly":
                return next.AddDays(7);
            case "yearly":
                return next.AddYears(1);
            case "monthly":
            default:
                var targetMonth = next.AddMonths(1);
                // Ensure the day of month is valid
                int daysInMonth = DateTime.DaysInMonth(targetMonth.Year, targetMonth.Month);
                int day = Math.Min(rt.DayOfInterval, daysInMonth);
                return new DateTime(targetMonth.Year, targetMonth.Month, day, next.Hour, next.Minute, next.Second);
        }
    }
}
