using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Models;

namespace MoneyFlowApi.Data;

public class MoneyFlowDbContext : DbContext
{
    private readonly UserContext _userContext;

    public MoneyFlowDbContext(DbContextOptions<MoneyFlowDbContext> options, UserContext userContext)
        : base(options)
    {
        _userContext = userContext;
    }

    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<Ledger> Ledgers { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<Company> Companies { get; set; }
    public DbSet<FinancialYear> FinancialYears { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Budget> Budgets { get; set; }
    public DbSet<RecurringTransaction> RecurringTransactions { get; set; }
    public DbSet<Goal> Goals { get; set; }
    public DbSet<GoalContribution> GoalContributions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Decimal Precision for financial amounts
        foreach (var property in modelBuilder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetPrecision(18);
            property.SetScale(2);
        }

        // Configure RecurringTransaction entity
        modelBuilder.Entity<RecurringTransaction>(entity =>
        {
            entity.HasQueryFilter(e => !e.IsDeleted && 
                (_userContext.CompanyId != null && e.CompanyId == _userContext.CompanyId));
        });

        // Configure Company entity
        modelBuilder.Entity<Company>(entity =>
        {
            entity.HasIndex(e => e.OwnerUserId);
            entity.HasQueryFilter(e => !e.IsDeleted && e.OwnerUserId == _userContext.UserId);
        });

        // Configure FinancialYear entity
        modelBuilder.Entity<FinancialYear>(entity =>
        {
            entity.HasQueryFilter(e => !e.IsDeleted && 
                (e.CompanyId == null || e.CompanyId == _userContext.CompanyId));
        });

        // Configure Transaction entity
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasIndex(e => e.Date);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.PaymentMethod);
            entity.HasIndex(e => e.LedgerId);
            entity.HasIndex(e => e.CompanyId);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");
            
            entity.HasQueryFilter(e => !e.IsDeleted && 
                (_userContext.CompanyId != null && e.CompanyId == _userContext.CompanyId));
        });

        // Configure Ledger entity
        modelBuilder.Entity<Ledger>(entity =>
        {
            entity.HasIndex(e => e.AccountType);
            entity.HasIndex(e => e.CompanyId);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Configure one-to-many relationship
            entity.HasMany(l => l.Transactions)
                .WithOne(t => t.Ledger)
                .HasForeignKey(t => t.LedgerId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasQueryFilter(e => !e.IsDeleted && 
                (_userContext.CompanyId != null && e.CompanyId == _userContext.CompanyId));
        });

        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Username).IsUnique();

            // Store Rights as JSON string in database
            entity.Property(e => e.Rights)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions)null) ?? new List<string>()
                );

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure AuditLog entity
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasQueryFilter(e => _userContext.CompanyId != null && e.CompanyId == _userContext.CompanyId);
        });

        // Configure Category entity
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasQueryFilter(e => !e.IsDeleted && 
                (e.CompanyId == null || (_userContext.CompanyId != null && e.CompanyId == _userContext.CompanyId)));
        });

        // Configure Budget entity
        modelBuilder.Entity<Budget>(entity =>
        {
            entity.HasQueryFilter(e => !e.IsDeleted && 
                (_userContext.CompanyId != null && e.CompanyId == _userContext.CompanyId));
        });

        // Configure Goal entity
        modelBuilder.Entity<Goal>(entity =>
        {
            entity.HasQueryFilter(e => !e.IsDeleted && 
                (_userContext.CompanyId != null && e.CompanyId == _userContext.CompanyId));
        });

        modelBuilder.Entity<GoalContribution>(entity =>
        {
            entity.HasQueryFilter(e => 
                (_userContext.CompanyId != null && e.CompanyId == _userContext.CompanyId));
        });
    }
}
