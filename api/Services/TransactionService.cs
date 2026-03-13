using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;
using MoneyFlowApi.Models.DTOs;
using System.Data;
using ExcelDataReader;
using CsvHelper;

namespace MoneyFlowApi.Services;

    private readonly IEnumerable<IFileParser> _parsers;

    public TransactionService(
        MoneyFlowDbContext context, 
        UserContext userContext, 
        AuditLogService auditLog,
        IEnumerable<IFileParser> parsers)
    {
        _context = context;
        _userContext = userContext;
        _auditLog = auditLog;
        _parsers = parsers;
    }

    private IQueryable<Transaction> GetBaseQuery()
    {
        var query = _context.Transactions.Where(t => !t.IsDeleted);
        
        if (_userContext.CompanyId.HasValue)
        {
            query = query.Where(t => t.CompanyId == _userContext.CompanyId.Value);
        }
        else if (_userContext.Role != "Admin")
        {
            query = query.Where(t => false);
        }
        
        return query;
    }

    private async Task ValidateFinancialYearAsync(string date)
    {
        if (DateTime.TryParse(date, out DateTime parsedDate))
        {
            var closedFy = await _context.FinancialYears
                .Where(fy => !fy.IsDeleted && fy.IsClosed && 
                            parsedDate >= fy.StartDate && parsedDate <= fy.EndDate &&
                            (fy.CompanyId == null || fy.CompanyId == _userContext.CompanyId))
                .AnyAsync();

            if (closedFy)
            {
                throw new InvalidOperationException("This operation is not allowed because the financial year for this date is closed.");
            }
        }
    }

    // Get all transactions with pagination
    public async Task<PagedResult<Transaction>> GetAllAsync(int page = 1, int pageSize = 10)
    {
        var query = GetBaseQuery();
        var totalCount = await query.CountAsync();
        
        var items = await query
            .Include(t => t.Ledger)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Transaction>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    // Get transaction by ID
    public async Task<Transaction?> GetByIdAsync(int id) =>
        await GetBaseQuery()
            .Include(t => t.Ledger)
            .FirstOrDefaultAsync(t => t.Id == id);

    // Get transactions by ledger ID with pagination
    public async Task<PagedResult<Transaction>> GetByLedgerIdAsync(int ledgerId, int page = 1, int pageSize = 10)
    {
        var query = GetBaseQuery().Where(t => t.LedgerId == ledgerId);
        var totalCount = await query.CountAsync();
        
        var items = await query
            .Include(t => t.Ledger)
            .OrderByDescending(t => t.Date)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Transaction>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    // Get transactions by type (income/expense)
    public async Task<List<Transaction>> GetByTypeAsync(string type) =>
        await GetBaseQuery()
            .Include(t => t.Ledger)
            .Where(t => t.Type == type)
            .OrderByDescending(t => t.Date)
            .ToListAsync();

    // Get transactions by payment method
    public async Task<List<Transaction>> GetByPaymentMethodAsync(string paymentMethod) =>
        await GetBaseQuery()
            .Include(t => t.Ledger)
            .Where(t => t.PaymentMethod == paymentMethod)
            .OrderByDescending(t => t.Date)
            .ToListAsync();

    // Get transactions by date range
    public async Task<List<Transaction>> GetByDateRangeAsync(string startDate, string endDate) =>
        await GetBaseQuery()
            .Include(t => t.Ledger)
            .Where(t => string.Compare(t.Date, startDate) >= 0 && 
                       string.Compare(t.Date, endDate) <= 0)
            .OrderByDescending(t => t.Date)
            .ToListAsync();

    private async Task UpdateLedgerBalanceAsync(int? ledgerId, decimal amount, string type, bool apply)
    {
        if (!ledgerId.HasValue) return;

        bool isIncome = type == "income";
        decimal adjustment = isIncome ? amount : -amount;
        if (!apply) adjustment = -adjustment;

        // Perform atomic update in database to prevent race conditions
        await _context.Ledgers
            .Where(l => l.Id == ledgerId.Value)
            .ExecuteUpdateAsync(s => s
                .SetProperty(l => l.Balance, l => l.Balance + adjustment)
                .SetProperty(l => l.UpdatedAt, DateTime.UtcNow));
    }

    // Create new transaction
    public async Task<Transaction> CreateAsync(Transaction transaction)
    {
        if (!_userContext.CompanyId.HasValue && _userContext.Role != "Admin")
            throw new InvalidOperationException("No company context selected.");

        await ValidateFinancialYearAsync(transaction.Date);

        transaction.CreatedAt = DateTime.UtcNow;
        transaction.UpdatedAt = DateTime.UtcNow;
        transaction.CompanyId = transaction.CompanyId ?? _userContext.CompanyId;

        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Validation: Check balance if expense (non-atomic check, but within transaction)
            if (transaction.Type == "expense" && transaction.LedgerId.HasValue)
            {
                var ledger = await _context.Ledgers.FindAsync(transaction.LedgerId.Value);
                if (ledger != null && ledger.AccountType != "credit" && ledger.Balance < transaction.Amount)
                {
                    throw new InvalidOperationException($"Insufficient balance in Ledger '{ledger.Name}'.");
                }
            }

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();
            
            await UpdateLedgerBalanceAsync(transaction.LedgerId, transaction.Amount, transaction.Type, true);

            await _auditLog.LogAsync("Create", "Transaction", $"Created {transaction.Type} of {transaction.Amount}. ID: {transaction.Id}");
            await dbTransaction.CommitAsync();

            return await GetByIdAsync(transaction.Id) ?? transaction;
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    // Specialized create for recurring tasks
    public async Task<Transaction> CreateAsyncForRecurring(Transaction transaction)
    {
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();
        
        await UpdateLedgerBalanceAsync(transaction.LedgerId, transaction.Amount, transaction.Type, true);
        
        await _auditLog.LogAsync("Create_Recurring", "Transaction", $"Automated recurring {transaction.Type} of {transaction.Amount}. ID: {transaction.Id}");
        
        return transaction;
    }

    // Update transaction
    public async Task<bool> UpdateAsync(int id, Transaction updatedTransaction)
    {
        var existing = await GetBaseQuery().FirstOrDefaultAsync(t => t.Id == id);
        if (existing == null)
            return false;

        await ValidateFinancialYearAsync(existing.Date);
        await ValidateFinancialYearAsync(updatedTransaction.Date);

        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Reverse old ledger balance
            await UpdateLedgerBalanceAsync(existing.LedgerId, existing.Amount, existing.Type, false);

            string changeSummary = $"Updated ID: {id}. Amount {existing.Amount}->{updatedTransaction.Amount}";

            // 2. Update fields
            existing.Description = updatedTransaction.Description;
            existing.Amount = updatedTransaction.Amount;
            existing.Date = updatedTransaction.Date;
            existing.Type = updatedTransaction.Type;
            existing.Category = updatedTransaction.Category;
            existing.PaymentMethod = updatedTransaction.PaymentMethod;
            existing.LedgerId = updatedTransaction.LedgerId;
            existing.Currency = updatedTransaction.Currency ?? existing.Currency;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // 3. Apply new ledger balance
            await UpdateLedgerBalanceAsync(existing.LedgerId, existing.Amount, existing.Type, true);

            await _auditLog.LogAsync("Update", "Transaction", changeSummary);
            await dbTransaction.CommitAsync();
            return true;
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    // Delete transaction
    public async Task<bool> DeleteAsync(int id)
    {
        var transaction = await GetBaseQuery().FirstOrDefaultAsync(t => t.Id == id);
        if (transaction == null)
            return false;

        await ValidateFinancialYearAsync(transaction.Date);

        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            transaction.IsDeleted = true;
            transaction.DeletedAt = DateTime.UtcNow;
            _context.Transactions.Update(transaction);

            await _context.SaveChangesAsync();

            // Reverse balance
            await UpdateLedgerBalanceAsync(transaction.LedgerId, transaction.Amount, transaction.Type, false);

            await _auditLog.LogAsync("Delete", "Transaction", $"Soft-deleted ID: {id}");
            await dbTransaction.CommitAsync();
            return true;
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    // Get total income
    public async Task<decimal> GetTotalIncomeAsync(string? startDate = null, string? endDate = null)
    {
        var query = GetBaseQuery().Where(t => t.Type == "income");
        
        if (!string.IsNullOrEmpty(startDate))
            query = query.Where(t => string.Compare(t.Date, startDate) >= 0);
            
        if (!string.IsNullOrEmpty(endDate))
            query = query.Where(t => string.Compare(t.Date, endDate) <= 0);

        return await query.SumAsync(t => t.Amount);
    }

    // Get total expenses
    public async Task<decimal> GetTotalExpensesAsync(string? startDate = null, string? endDate = null)
    {
        var query = GetBaseQuery().Where(t => t.Type == "expense");
        
        if (!string.IsNullOrEmpty(startDate))
            query = query.Where(t => string.Compare(t.Date, startDate) >= 0);
            
        if (!string.IsNullOrEmpty(endDate))
            query = query.Where(t => string.Compare(t.Date, endDate) <= 0);

        return await query.SumAsync(t => t.Amount);
    }

    // Get transactions by category
    public async Task<List<Transaction>> GetByCategoryAsync(string category) =>
        await GetBaseQuery()
            .Include(t => t.Ledger)
            .Where(t => t.Category == category)
            .OrderByDescending(t => t.Date)
            .ToListAsync();

    // Get all unique categories
    public async Task<List<string>> GetAllCategoriesAsync()
    {
        return await GetBaseQuery()
            .Select(t => t.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();
    }

    // Get total balance across ledgers for the current context
    public async Task<decimal> GetTotalBalanceAsync()
    {
        var query = _context.Ledgers.Where(l => !l.IsDeleted);
        if (_userContext.CompanyId.HasValue)
        {
            query = query.Where(l => l.CompanyId == _userContext.CompanyId.Value);
        }
        return await query.SumAsync(l => l.Balance);
    }

    public async Task<int> ImportFromStreamAsync(Stream stream, string extension, int? ledgerId)
    {
        var parser = _parsers.FirstOrDefault(p => 
            p.SupportedExtension.Equals(extension, StringComparison.OrdinalIgnoreCase) || 
            (extension == ".xls" && p.SupportedExtension == ".xlsx"));

        if (parser == null)
            throw new NotSupportedException($"File extension '{extension}' is not supported.");

        // Fetch all categories for auto-categorization
        var allCategories = await _context.Categories
            .Where(c => !c.IsDeleted && (c.CompanyId == null || c.CompanyId == _userContext.CompanyId))
            .ToListAsync();

        var records = await parser.ParseAsync(stream, ledgerId, allCategories);

        if (records.Count == 0) return 0;

        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Set context for all records
            foreach (var record in records)
            {
                record.CreatedAt = DateTime.UtcNow;
                record.UpdatedAt = DateTime.UtcNow;
                record.CompanyId = record.CompanyId ?? _userContext.CompanyId;
            }

            // 1. Bulk insert transactions
            _context.Transactions.AddRange(records);
            await _context.SaveChangesAsync();

            // 2. Batch update ledger balances
            var ledgerGroups = records
                .Where(r => r.LedgerId.HasValue)
                .GroupBy(r => new { r.LedgerId, r.Type });

            foreach (var group in ledgerGroups)
            {
                decimal totalAmount = group.Sum(r => r.Amount);
                await UpdateLedgerBalanceAsync(group.Key.LedgerId, totalAmount, group.Key.Type, true);
            }

            // 3. Single audit log for the whole operation
            await _auditLog.LogAsync("Import", "Transaction", $"Bulk imported {records.Count} transactions via file.");

            await dbTransaction.CommitAsync();
            return records.Count;
        }
        catch (Exception)
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }
}
