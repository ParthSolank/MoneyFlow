# Bug Fixes and Patches - Priority Order

## 🔴 CRITICAL ISSUES (Must Fix Immediately)

### 1. **Goal Service - Soft Delete Bypass (CRITICAL)**
**Files**: `api/Services/GoalService.cs`, `api/Data/MoneyFlowDbContext.cs`
**Impact**: Users see soft-deleted goals; deleted data not hidden
**Root Cause**: `GetAllAsync()` and `GetByIdAsync()` don't respect soft-delete filter; `FindAsync()` bypasses query filters

#### PATCH #1-1: Fix GoalService.cs
```csharp
// GoalService.cs - Lines 18-29
// BEFORE:
public async Task<List<Goal>> GetAllAsync()
{
    return await _context.Goals
        .Include(g => g.Ledger)
        .OrderByDescending(g => g.CreatedAt)
        .ToListAsync();
}

public async Task<Goal?> GetByIdAsync(int id)
{
    return await _context.Goals.FindAsync(id);
}

// AFTER:
public async Task<List<Goal>> GetAllAsync()
{
    return await _context.Goals
        .Where(g => !g.IsDeleted)  // Explicit soft-delete filter
        .Include(g => g.Ledger)
        .OrderByDescending(g => g.CreatedAt)
        .ToListAsync();
}

public async Task<Goal?> GetByIdAsync(int id)
{
    // Use DbSet query instead of FindAsync to respect query filters
    return await _context.Goals
        .Where(g => !g.IsDeleted)
        .FirstOrDefaultAsync(g => g.Id == id);
}
```

#### PATCH #1-2: Fix Goal History to exclude deleted contributions
```csharp
// GoalService.cs - Lines 72-79
// BEFORE:
public async Task<List<GoalContribution>> GetHistoryAsync(int goalId)
{
    return await _context.GoalContributions
        .Include(c => c.Ledger)
        .Where(c => c.GoalId == goalId)
        .OrderByDescending(c => c.ContributionDate)
        .ToListAsync();
}

// AFTER:
public async Task<List<GoalContribution>> GetHistoryAsync(int goalId)
{
    return await _context.GoalContributions
        .Include(c => c.Ledger)
        .Where(c => c.GoalId == goalId && !c.IsDeleted)  // Add soft-delete filter (if GoalContribution has IsDeleted)
        .OrderByDescending(c => c.ContributionDate)
        .ToListAsync();
}
```

---

### 2. **Goal Contribution Race Condition (CRITICAL)**
**File**: `api/Services/GoalService.cs` lines 81-104
**Impact**: Concurrent contributions result in lost data; current amount undershoots actual
**Root Cause**: Non-atomic read-modify-write; missing database transaction

#### PATCH #2: Add Database Transaction to Goal Contribution
```csharp
// GoalService.cs - Lines 81-104
// BEFORE:
public async Task<GoalContribution> AddContributionAsync(int goalId, decimal amount, int? ledgerId, string? notes)
{
    var goal = await _context.Goals.FindAsync(goalId);
    if (goal == null) throw new Exception("Goal not found");

    var contribution = new GoalContribution
    {
        GoalId = goalId,
        Amount = amount,
        LedgerId = ledgerId,
        Notes = notes,
        CompanyId = _userContext.CompanyId ?? 0,
        ContributionDate = DateTime.UtcNow
    };

    _context.GoalContributions.Add(contribution);

    // Update goal current amount
    goal.CurrentAmount += amount;
    goal.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();
    return contribution;
}

// AFTER:
public async Task<GoalContribution> AddContributionAsync(int goalId, decimal amount, int? ledgerId, string? notes)
{
    // Use database transaction to prevent race condition
    using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        // Lock the row for update to prevent concurrent modifications
        var goal = await _context.Goals
            .FromSqlInterpolated($"SELECT * FROM Goals WITH (UPDLOCK, READCOMMITTED) WHERE Id = {goalId}")
            .FirstOrDefaultAsync()
            ?? await _context.Goals.FindAsync(goalId);

        if (goal == null) throw new Exception("Goal not found");

        var contribution = new GoalContribution
        {
            GoalId = goalId,
            Amount = amount,
            LedgerId = ledgerId,
            Notes = notes,
            CompanyId = _userContext.CompanyId ?? 0,
            ContributionDate = DateTime.UtcNow
        };

        _context.GoalContributions.Add(contribution);

        // Use atomic database update instead of in-memory modification
        goal.UpdatedAt = DateTime.UtcNow;
        _context.Goals.Update(goal);

        await _context.SaveChangesAsync();

        // Atomic update to ensure consistency
        await _context.Goals
            .Where(g => g.Id == goalId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(g => g.CurrentAmount, g => g.CurrentAmount + amount)
                .SetProperty(g => g.UpdatedAt, DateTime.UtcNow));

        await transaction.CommitAsync();
        return contribution;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

---

### 3. **AuditLog Query Filter - Null CompanyId Bypass (CRITICAL)**
**File**: `api/Data/MoneyFlowDbContext.cs` lines 120-124
**Impact**: Admins with null CompanyId see NO audit logs; complete audit trail loss
**Root Cause**: Query filter requires `CompanyId != null`, excludes admin users

#### PATCH #3: Fix AuditLog Query Filter
```csharp
// MoneyFlowDbContext.cs - Lines 120-124
// BEFORE:
modelBuilder.Entity<AuditLog>(entity =>
{
    entity.HasQueryFilter(e => _userContext.CompanyId != null && e.CompanyId == _userContext.CompanyId);
});

// AFTER:
modelBuilder.Entity<AuditLog>(entity =>
{
    entity.HasQueryFilter(e =>
        (_userContext.Role == "Admin" && _userContext.CompanyId == null) ||  // Admin sees all audit logs
        (_userContext.CompanyId != null && e.CompanyId == _userContext.CompanyId));  // Company users see their company's logs
});
```

---

### 4. **RecurringTransaction Background Worker - Missing UserContext (CRITICAL)**
**File**: `api/Services/RecurringTransactionWorker.cs` lines 53-57
**Impact**: Recurring transactions created without proper CompanyId/user context; data integrity loss
**Root Cause**: Background service has null UserContext; CreateAsyncForRecurring() relies on context

#### PATCH #4: Fix Recurring Transaction Worker Context
```csharp
// RecurringTransactionWorker.cs (around line 53-57)
// BEFORE:
Task.Run(async () =>
{
    var txs = recurring.Where(r => shouldProcess).ToList();
    foreach (var rt in txs)
    {
        await transactionService.CreateAsyncForRecurring(rt.Description, rt.Amount, rt.AccountId, rt.Type, rt.Description);
    }
});

// AFTER:
Task.Run(async () =>
{
    var txs = recurring.Where(r => shouldProcess).ToList();
    foreach (var rt in txs)
    {
        // Create transaction WITH company context from recurring transaction itself
        var transaction = new Transaction
        {
            Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Description = rt.Description,
            Amount = rt.Amount,
            Type = rt.Type,
            LedgerId = rt.LedgerId,
            Category = rt.Category ?? "Recurring",
            CompanyId = rt.CompanyId,  // Use source recurring transaction's company
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        _context.Transactions.Add(transaction);

        // Update ledger balance atomically
        await _context.Ledgers
            .Where(l => l.Id == rt.LedgerId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(l => l.Balance, l => l.Balance + (rt.Type == "income" ? rt.Amount : -rt.Amount)));

        await _context.SaveChangesAsync();
    }
});
```

---

### 5. **Recurring Transaction Delete - No Balance Reversal (CRITICAL)**
**File**: `api/Controllers/RecurringTransactionsController.cs` lines 87-95
**Impact**: Deleting recurring rule doesn't reverse created transactions; ledger balance corrupted
**Root Cause**: Soft-delete only marks recurring transaction deleted, doesn't affect already-created transactions

#### PATCH #5: Reverse Transactions on Recurring Delete
```csharp
// RecurringTransactionsController.cs - Add to Delete action
// BEFORE:
[HttpDelete("{id:int}")]
public async Task<IActionResult> Delete(int id)
{
    var rt = await _context.RecurringTransactions.FindAsync(id);
    if (rt == null) return NotFound("Recurring transaction not found");

    rt.IsDeleted = true;
    _context.RecurringTransactions.Update(rt);
    await _context.SaveChangesAsync();

    await _auditLogService.LogAsync("DELETE", "RecurringTransactions", $"Deleted recurring transaction ID {id}");
    return NoContent();
}

// AFTER:
[HttpDelete("{id:int}")]
public async Task<IActionResult> Delete(int id)
{
    var rt = await _context.RecurringTransactions.FindAsync(id);
    if (rt == null) return NotFound("Recurring transaction not found");

    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
        // Find all transactions created by this recurring rule that haven't been manually deleted
        var createdTransactions = await _context.Transactions
            .Where(t => t.Description.Contains(rt.Description) &&
                       t.CompanyId == rt.CompanyId &&
                       t.LedgerId == rt.LedgerId &&
                       t.Amount == rt.Amount &&
                       !t.IsDeleted)
            .ToListAsync();

        // Reverse each transaction on the ledger
        foreach (var txn in createdTransactions)
        {
            // Soft delete the transaction
            txn.IsDeleted = true;
            _context.Transactions.Update(txn);

            // Reverse the ledger balance impact
            decimal reversal = txn.Type == "income" ? -txn.Amount : txn.Amount;
            await _context.Ledgers
                .Where(l => l.Id == txn.LedgerId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(l => l.Balance, l => l.Balance + reversal)
                    .SetProperty(l => l.UpdatedAt, DateTime.UtcNow));
        }

        // Mark recurring transaction as deleted
        rt.IsDeleted = true;
        _context.RecurringTransactions.Update(rt);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        await _auditLogService.LogAsync("DELETE", "RecurringTransactions",
            $"Deleted recurring transaction ID {id} and reversed {createdTransactions.Count} created transactions");
        return NoContent();
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

---

## 🔴 HIGH SEVERITY ISSUES

### 6. **GoalsController - Missing Authorization Rights (HIGH)**
**File**: `api/Controllers/GoalsController.cs` lines 23-60
**Impact**: Permission bypass; any authenticated user can CRUD all goals
**Root Cause**: No `[AuthorizeRight]` attribute on individual actions

#### PATCH #6: Add Authorization Attributes
```csharp
// GoalsController.cs
// BEFORE:
[HttpGet]
public async Task<ActionResult<List<Goal>>> GetAll()

[HttpGet("{id:int}")]
public async Task<ActionResult<Goal>> GetById(int id)

[HttpPut("{id:int}")]
public async Task<IActionResult> Update(int id, Goal goal)

[HttpDelete("{id:int}")]
public async Task<IActionResult> Delete(int id)

// AFTER:
[HttpGet]
[AuthorizeRight("view_goals")]  // Add this line
public async Task<ActionResult<List<Goal>>> GetAll()

[HttpGet("{id:int}")]
[AuthorizeRight("view_goals")]  // Add this line
public async Task<ActionResult<Goal>> GetById(int id)

[HttpPut("{id:int}")]
[AuthorizeRight("edit_goals")]  // Add this line
public async Task<IActionResult> Update(int id, Goal goal)

[HttpDelete("{id:int}")]
[AuthorizeRight("delete_goals")]  // Add this line
public async Task<IActionResult> Delete(int id)
```

---

### 7. **RecurringTransactionsController - Missing Authorization (HIGH)**
**File**: `api/Controllers/RecurringTransactionsController.cs` lines 44-95
**Impact**: Permission bypass; any authenticated user manages all recurring transactions
**Root Cause**: Only class-level `[Authorize]`; no per-action rights

#### PATCH #7: Add Authorization to Recurring Transactions
```csharp
// RecurringTransactionsController.cs
// BEFORE:
[HttpPost]
public async Task<ActionResult<RecurringTransactionDto>> Create([FromBody] CreateRecurringTransactionRequest request)

[HttpPut("{id:int}")]
public async Task<IActionResult> Update(int id, [FromBody] UpdateRecurringTransactionRequest request)

[HttpDelete("{id:int}")]
public async Task<IActionResult> Delete(int id)

// AFTER:
[HttpPost]
[AuthorizeRight("create_recurring")]  // Add this
public async Task<ActionResult<RecurringTransactionDto>> Create([FromBody] CreateRecurringTransactionRequest request)

[HttpPut("{id:int}")]
[AuthorizeRight("edit_recurring")]  // Add this
public async Task<IActionResult> Update(int id, [FromBody] UpdateRecurringTransactionRequest request)

[HttpDelete("{id:int}")]
[AuthorizeRight("delete_recurring")]  // Add this
public async Task<IActionResult> Delete(int id)
```

---

### 8. **Transaction Date String Comparison - Locale Dependency Issue (HIGH)**
**File**: `api/Services/TransactionService.cs` lines 132-138
**Impact**: Date filtering broken for non-ISO formats; incorrect results possible
**Root Cause**: Using `string.Compare()` instead of proper DateTime comparison

#### PATCH #8: Fix Date Comparison
```csharp
// TransactionService.cs - Lines 132-138
// BEFORE:
public async Task<List<Transaction>> GetByDateRangeAsync(string startDate, string endDate) =>
    await GetBaseQuery()
        .Include(t => t.Ledger)
        .Where(t => string.Compare(t.Date, startDate) >= 0 &&
                   string.Compare(t.Date, endDate) <= 0)
        .OrderByDescending(t => t.Date)
        .ToListAsync();

// AFTER:
public async Task<List<Transaction>> GetByDateRangeAsync(string startDate, string endDate)
{
    // Validate date format
    if (!DateTime.TryParseExact(startDate, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out _))
        throw new ArgumentException($"Invalid start date format: {startDate}. Use yyyy-MM-dd");
    if (!DateTime.TryParseExact(endDate, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out _))
        throw new ArgumentException($"Invalid end date format: {endDate}. Use yyyy-MM-dd");

    return await GetBaseQuery()
        .Include(t => t.Ledger)
        .Where(t => string.CompareTo(t.Date, startDate) >= 0 &&
                   string.CompareTo(t.Date, endDate) <= 0)  // Explicit string comparison (ISO format safe)
        .OrderByDescending(t => t.Date)
        .ToListAsync();
}
```

---

### 9. **ReportingService - Missing Company Context Filter (HIGH)**
**File**: `api/Services/ReportingService.cs` lines 26-30
**Impact**: Admin can see all companies' transactions; financial data leak
**Root Cause**: `GetMonthlyStatementAsync()` missing CompanyId filter

#### PATCH #9: Add Company Filter to Reports
```csharp
// ReportingService.cs - Lines 26-30
// BEFORE:
var transactions = await _context.Transactions
    .Include(t => t.Ledger)
    .Where(t => !t.IsDeleted && string.Compare(t.Date, startDateStr) >= 0 && string.Compare(t.Date, endDateStr) <= 0)
    .OrderBy(t => t.Date)
    .ToListAsync();

// AFTER:
var transactions = await _context.Transactions
    .Include(t => t.Ledger)
    .Where(t => !t.IsDeleted &&
               t.CompanyId == _userContext.CompanyId &&  // Add company filter
               string.Compare(t.Date, startDateStr) >= 0 &&
               string.Compare(t.Date, endDateStr) <= 0)
    .OrderBy(t => t.Date)
    .ToListAsync();
```

Also apply the same fix to `GetSmartInsightsAsync()` line 136-142:
```csharp
// BEFORE:
var currentTransactions = await _context.Transactions
    .Where(t => !t.IsDeleted && string.Compare(t.Date, currentMonthStart) >= 0 && t.Type == "expense")
    .ToListAsync();

var prevTransactions = await _context.Transactions
    .Where(t => !t.IsDeleted && string.Compare(t.Date, prevMonthStart) >= 0 && string.Compare(t.Date, prevMonthEnd) <= 0 && t.Type == "expense")
    .ToListAsync();

// AFTER:
var currentTransactions = await _context.Transactions
    .Where(t => !t.IsDeleted && t.CompanyId == _userContext.CompanyId &&  // Add filter
               string.Compare(t.Date, currentMonthStart) >= 0 && t.Type == "expense")
    .ToListAsync();

var prevTransactions = await _context.Transactions
    .Where(t => !t.IsDeleted && t.CompanyId == _userContext.CompanyId &&  // Add filter
               string.Compare(t.Date, prevMonthStart) >= 0 && string.Compare(t.Date, prevMonthEnd) <= 0 && t.Type == "expense")
    .ToListAsync();
```

---

### 10. **Missing Validation: Negative Amounts (HIGH)**
**File**: `api/Models/Transaction.cs` line 18-19
**Impact**: Invalid financial records; negative transactions without explanation
**Root Cause**: No validation on Amount property

#### PATCH #10: Add Amount Validation
```csharp
// Models/Transaction.cs
// BEFORE:
public decimal Amount { get; set; }

// AFTER:
[Range(0.01, decimal.MaxValue, ErrorMessage = "Amount must be greater than 0")]
public decimal Amount { get; set; }
```

Also apply to `Budget.cs`:
```csharp
// Models/Budget.cs
[Range(0.01, decimal.MaxValue, ErrorMessage = "Budget amount must be greater than 0")]
public decimal Amount { get; set; }
```

And `Goal.cs`:
```csharp
// Models/Goal.cs
[Range(0.01, decimal.MaxValue, ErrorMessage = "Target amount must be greater than 0")]
public decimal TargetAmount { get; set; }
```

---

### 11. **File Upload - Missing Size Validation (HIGH)**
**File**: `api/Controllers/TransactionsController.cs` lines 200-202
**Impact**: Memory exhaustion; DoS vulnerability with large files
**Root Cause**: Only checks empty, not max size

#### PATCH #11: Add File Size Validation
```csharp
// TransactionsController.cs - In Import method
// BEFORE:
if (file == null || file.Length == 0)
    return BadRequest("File is empty.");

// AFTER:
const long MaxFileSize = 10 * 1024 * 1024; // 10 MB
if (file == null || file.Length == 0)
    return BadRequest("File is empty.");
if (file.Length > MaxFileSize)
    return BadRequest($"File size exceeds maximum allowed ({MaxFileSize / 1024 / 1024}MB).");

// Validate MIME type
var allowedMimeTypes = new[] { "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
if (!allowedMimeTypes.Contains(file.ContentType))
    return BadRequest($"Invalid file type. Allowed: CSV, Excel");
```

---

## 🟡 MEDIUM SEVERITY ISSUES

### 12. **Budget Status Calculation - Inefficient Query (MEDIUM)**
**File**: `api/Services/BudgetService.cs` lines 115-123
**Impact**: O(n²) performance; slow budget status retrieval
**Root Cause**: Calls `FirstOrDefault()` 3 times per budget instead of dictionary lookup

#### PATCH #12: Optimize Budget Status Query
```csharp
// BudgetService.cs - Lines 115-123
// BEFORE:
Spent = expenses.FirstOrDefault(e => e.CategoryName == b.Category?.Name)?.Spent ?? 0,
Remaining = b.Amount - (expenses.FirstOrDefault(...)?.Spent ?? 0),
PercentUsed = ... (expenses.FirstOrDefault(...)?.Spent ?? 0) ...

// AFTER:
// Build a lookup dictionary instead of repeated searches
var expenseDict = expenses.ToDictionary(e => e.CategoryName, e => e.Spent);
var spent = expenseDict.ContainsKey(b.Category?.Name ?? "") ? expenseDict[b.Category.Name] : 0;

return new BudgetStatus
{
    Id = b.Id,
    Category = b.Category?.Name,
    Amount = b.Amount,
    Spent = spent,
    Remaining = b.Amount - spent,
    PercentUsed = b.Amount > 0 ? (spent / b.Amount * 100) : 0
};
```

---

### 13. **Category N+1 Seeding Query (MEDIUM)**
**File**: `api/Services/CategoryService.cs` lines 138-156
**Impact**: 13 database save operations for seed data
**Root Cause**: Saves after each parent category

#### PATCH #13: Batch Insert Categories
```csharp
// CategoryService.cs - Replace SeedAsync method
// BEFORE:
foreach (var cat in defaultCategories)
{
    var parent = new Category { ... };
    _context.Categories.Add(parent);
    await _context.SaveChangesAsync();  // <-- Saves 13 times!

    foreach (var subName in cat.Subs)
    {
        // ...add subcategory...
    }
}

// AFTER:
var allCategories = new List<Category>();

foreach (var cat in defaultCategories)
{
    var parent = new Category { ... };
    allCategories.Add(parent);

    foreach (var subName in cat.Subs)
    {
        var sub = new Category { ... };
        allCategories.Add(sub);
    }
}

// Save all at once
_context.Categories.AddRange(allCategories);
await _context.SaveChangesAsync();  // Single save!
```

---

### 14. **Hardcoded Email Credentials (MEDIUM - Security)**
**File**: `api/Services/AuthService.cs` line 88
**Impact**: Real email exposed in source code
**Root Cause**: Hardcoded string instead of configuration

#### PATCH #14: Move Email to Config
```csharp
// AuthService.cs - Line 88
// BEFORE:
var senderEmail = "solankiparth2126@gmail.com";

// AFTER:
// In constructor:
private readonly IConfiguration _configuration;
public AuthService(/* ... */, IConfiguration configuration)
{
    _configuration = configuration;
}

// In method:
var senderEmail = _configuration["EmailSettings:SenderEmail"]
    ?? throw new InvalidOperationException("EmailSettings:SenderEmail not configured");

// In appsettings.json:
{
  "EmailSettings": {
    "SenderEmail": "noreply@yourapp.com",
    "SenderPassword": "${SMTP_PASSWORD}",  // Use env var in production
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587
  }
}
```

---

### 15. **Weak Activation Key (6 digits - 900,000 combinations) (MEDIUM)**
**File**: `api/Services/AuthService.cs` lines 71-78
**Impact**: Brute-forceable in hours
**Root Cause**: Only 6 numeric digits

#### PATCH #15: Stronger Activation Key
```csharp
// AuthService.cs
// BEFORE:
string activationCode = new Random().Next(100000, 999999).ToString();

// AFTER:
string activationCode = GenerateSecureActivationCode();

private string GenerateSecureActivationCode()
{
    // Generate 8-character alphanumeric code (62^8 = 218 trillion combinations)
    const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    using var rng = new System.Security.Cryptography.RNGCryptoServiceProvider();
    byte[] data = new byte[8];
    rng.GetBytes(data);

    var result = new StringBuilder(8);
    foreach (byte b in data)
    {
        result.Append(chars[b % chars.Length]);
    }
    return result.ToString();
}
```

---

## 🟡 MEDIUM-LOW SEVERITY (Edge Cases)

### 16. **Pagination Input Not Validated (MEDIUM)**
**File**: `api/Controllers/TransactionsController.cs` lines 30, 51
**Impact**: Invalid input causes LINQ errors
**Root Cause**: No bounds checking

#### PATCH #16: Validate Pagination
```csharp
// Add to controller
private ActionResult<T> ValidatePaginationInput(int page, int pageSize)
{
    if (page < 1)
        return BadRequest("Page must be >= 1");
    if (pageSize < 1 || pageSize > 100)
        return BadRequest("PageSize must be between 1 and 100");
    return default!;
}

// In GetAll method:
[HttpGet]
public async Task<ActionResult<PagedResult<TransactionDto>>> GetAll(int page = 1, int pageSize = 10)
{
    var validation = ValidatePaginationInput(page, pageSize);
    if (validation.Result != null) return validation.Result;

    // ... rest of method
}
```

---

### 17. **Missing NotFound Logging (MEDIUM)**
**File**: `api/Controllers/TransactionsController.cs` lines 39-46
**Impact**: No audit trail for access attempts
**Root Cause**: Silent NotFound responses

#### PATCH #17: Log NotFound Attempts
```csharp
// TransactionsController.cs
// BEFORE:
var transaction = await _transactionService.GetByIdAsync(id);
if (transaction == null) return NotFound();

// AFTER:
var transaction = await _transactionService.GetByIdAsync(id);
if (transaction == null)
{
    await _auditLogService.LogAsync("ACCESS_DENIED", "Transactions",
        $"Attempted access to non-existent transaction ID {id}");
    return NotFound();
}
```

---

### 18. **Goal Deadline - No Past Date Validation (MEDIUM)**
**File**: `api/Models/Goal.cs` line 26
**Impact**: Users set goals with past deadlines; confusing UX
**Root Cause**: No validation

#### PATCH #18: Validate Goal Deadline
```csharp
// Models/Goal.cs
// BEFORE:
public DateTime? Deadline { get; set; }

// AFTER:
private DateTime? _deadline;
public DateTime? Deadline
{
    get => _deadline;
    set => _deadline = value;
}

// In controller validation or service:
if (goal.Deadline.HasValue && goal.Deadline.Value <= DateTime.UtcNow)
    return BadRequest("Deadline must be in the future");
```

---

## 📋 TESTING CHECKLIST

After applying patches, test:

- [ ] **Soft Delete**: Create goal → Delete → Verify it doesn't appear in GET All
- [ ] **Race Condition**: Make 10 concurrent goal contributions → Verify correct sum
- [ ] **Audit Logs**: Filter by Admin user with null CompanyId → Should see logs
- [ ] **Recurring Delete**: Create recurring → Delete → Verify ledger balances unchanged
- [ ] **Authorization**: Try accessing Goals API with user missing `view_goals` right → Should get 403
- [ ] **Date Range**: Query transactions with various date formats → Should work or throw clear error
- [ ] **Reporting**: Create transactions in two companies → Each company should only see their own in reports
- [ ] **File Upload**: Try uploading 50MB file → Should reject with size error
- [ ] **Negative Amounts**: Try creating transaction with -100 → Should validate and reject

---

## ⚡ DEPLOYMENT ORDER

1. **Phase 1 (Immediate)**: Patches #1-5 (Soft deletes, race conditions, security)
2. **Phase 2 (Same sprint)**: Patches #6-11 (Authorization, validation)
3. **Phase 3 (Next sprint)**: Patches #12-18 (Optimization, hardening)

---

## 🔗 Related Issues

- Query filter inconsistencies across soft-delete entities
- Missing authorization rights definitions in database
- Date/DateTime handling inconsistency (strings vs DateTime objects)
- No database transaction implementation for multi-step operations
