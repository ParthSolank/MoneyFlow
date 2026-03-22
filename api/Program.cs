using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MoneyFlowApi.Data;
using MoneyFlowApi.Services;
using MoneyFlowApi.Models;
using BCrypt.Net;
using QuestPDF.Infrastructure;

QuestPDF.Settings.License = LicenseType.Community;
System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

var builder = WebApplication.CreateBuilder(args);

// Add SQL Server DbContext
builder.Services.AddDbContext<MoneyFlowDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add services to the container
builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<TransactionService>();
builder.Services.AddScoped<LedgerService>();
builder.Services.AddScoped<AuditLogService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<CompanyService>();
builder.Services.AddScoped<FinancialYearService>();
builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<BudgetService>();
builder.Services.AddScoped<GoalService>();
builder.Services.AddScoped<ReportingService>();
builder.Services.AddScoped<UserContext>();

// File Parsers
builder.Services.AddScoped<IFileParser, CsvFileParser>();
builder.Services.AddScoped<IFileParser, ExcelFileParser>();

// Add Background Service for recurring transactions
builder.Services.AddHostedService<RecurringTransactionWorker>();

// Add controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Configure JWT Authentication
var secretKey = builder.Configuration["JwtSettings:Secret"] ?? builder.Configuration["JWT_SECRET"];

if (string.IsNullOrEmpty(secretKey) || secretKey.Length < 32)
{
    throw new InvalidOperationException("FATAL: JWT Secret is not configured or too short (min 32 characters). Set 'JwtSettings:Secret' or 'JWT_SECRET' environment variable.");
}

var key = Encoding.ASCII.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = builder.Environment.IsProduction();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "MoneyFlowPro",
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JwtSettings:Audience"] ?? "MoneyFlowProUsers",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Add CORS policy for Next.js frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            var frontendUrl = builder.Configuration["FRONTEND_URL"] ?? "https://moneyflow-live.vercel.app";
            var origins = frontendUrl.Split(',', StringSplitOptions.RemoveEmptyEntries);
            
            policy.WithOrigins(origins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

// Add Swagger/OpenAPI with JWT Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() 
    { 
        Title = "MoneyFlow Pro API", 
        Version = "v1",
        Description = "RESTful API for MoneyFlow Pro - Personal Finance Management Application (SQL Server Backend)"
    });

    // Add JWT Definition
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. \r\n\r\n Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer 12345abcdef\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "MoneyFlow Pro API v1");
        c.RoutePrefix = string.Empty; // Swagger UI at root
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Global Exception Handler
app.UseMiddleware<MoneyFlowApi.Middleware.GlobalExceptionHandlerMiddleware>();

// Enable CORS
app.UseCors("AllowNextJs");

// Enable Authentication (Must be before Authorization)
app.UseAuthentication();
app.UseAuthorization();

// User context middleware after auth
app.UseMiddleware<MoneyFlowApi.Middleware.UserContextMiddleware>();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new 
{ 
    status = "healthy", 
    timestamp = DateTime.UtcNow,
    service = "MoneyFlow Pro API",
    database = "SQL Server"
}));

Console.WriteLine("🚀 MoneyFlow Pro API is starting...");
Console.WriteLine("📊 Swagger UI available at: http://127.0.0.1:5039 or https://localhost:7228");
Console.WriteLine("💡 Run 'dotnet ef database update' to create/update the database");

// Seed Database with initial user
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<MoneyFlowDbContext>();
        
        // Ensure database is created and all migrations are applied
        // This is better for production than EnsureCreated() as it supports schema evolution
        context.Database.Migrate(); 


        // Use environment variables for admin credentials with fallbacks
        var adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL") ?? "admin@demo.com";
        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "password123";

        // Full Core Rights List for Admin
        var adminRights = new List<string> 
        { 
            "CORE_DASHBOARD_VIEW", "CORE_DASHBOARD_CREATE", "CORE_DASHBOARD_EDIT", "CORE_DASHBOARD_DELETE",
            "CORE_TRANSACTIONS_VIEW", "CORE_TRANSACTIONS_CREATE", "CORE_TRANSACTIONS_EDIT", "CORE_TRANSACTIONS_DELETE",
            "CORE_LEDGERS_VIEW", "CORE_LEDGERS_CREATE", "CORE_LEDGERS_EDIT", "CORE_LEDGERS_DELETE",
            "CORE_CATEGORIES_VIEW", "CORE_CATEGORIES_CREATE", "CORE_CATEGORIES_EDIT", "CORE_CATEGORIES_DELETE",
            "CORE_BUDGETS_VIEW", "CORE_BUDGETS_CREATE", "CORE_BUDGETS_EDIT", "CORE_BUDGETS_DELETE",
            "CORE_GOALS_VIEW", "CORE_GOALS_CREATE", "CORE_GOALS_EDIT", "CORE_GOALS_DELETE",
            "CORE_RECURRING_VIEW", "CORE_RECURRING_CREATE", "CORE_RECURRING_EDIT", "CORE_RECURRING_DELETE"
        };

        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
        
        if (adminUser == null)
        {
            context.Users.Add(new User
            {
                Username = "admin",
                Email = adminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                Role = "Admin",
                IsActive = true,
                Rights = adminRights,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
            Console.WriteLine($"✅ Seeded new admin: {adminEmail}");
        }
        else
        {
            // Ensure permissions and role are refreshed on startup if user is present
            // EF Core tracks the entity from FirstOrDefaultAsync, so just updating props is enough
            adminUser.Role = "Admin";
            adminUser.IsActive = true;
            adminUser.Rights = adminRights;
            adminUser.UpdatedAt = DateTime.UtcNow;
            
            await context.SaveChangesAsync();
            Console.WriteLine($"✅ Verified admin access for: {adminEmail}");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

app.Run();
