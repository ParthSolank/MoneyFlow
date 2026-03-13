using Microsoft.EntityFrameworkCore;
using MoneyFlowApi.Data;
using MoneyFlowApi.Models;
using MoneyFlowApi.Models.DTOs;
using System.Data;
using ExcelDataReader;
using CsvHelper;

namespace MoneyFlowApi.Services;

public class TransactionService
{
    private readonly MoneyFlowDbContext _context;
    private readonly UserContext _userContext;
    private readonly AuditLogService _auditLog;

    public TransactionService(MoneyFlowDbContext context, UserContext userContext, AuditLogService auditLog)
    {
        _context = context;
        _userContext = userContext;
        _auditLog = auditLog;
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
        var records = new List<Transaction>();
        stream.Position = 0;

        // Fetch all categories for auto-categorization
        var allCategories = await _context.Categories
            .Where(c => !c.IsDeleted && (c.CompanyId == null || c.CompanyId == _userContext.CompanyId))
            .ToListAsync();

        if (extension == ".csv")
        {
            using var reader = new StreamReader(stream);
            var config = new CsvHelper.Configuration.CsvConfiguration(System.Globalization.CultureInfo.InvariantCulture)
            {
                HeaderValidated = null,
                MissingFieldFound = null,
            };
            using var csv = new CsvHelper.CsvReader(reader, config);
            records = csv.GetRecords<Transaction>().ToList();
        }
        else if (extension == ".xls" || extension == ".xlsx")
        {
            using var reader = ExcelDataReader.ExcelReaderFactory.CreateReader(stream);
            var result = reader.AsDataSet();
            if (result.Tables.Count == 0) throw new InvalidOperationException("File contains no data sheets.");

            var table = result.Tables[0];
            int dateCol = -1, descCol = -1, amountCol = -1, typeCol = -1, categoryCol = -1, paymentMethodCol = -1;
            int withdrawalCol = -1, depositCol = -1;
            int startRow = 0;

            for (int i = 0; i < table.Rows.Count; i++)
            {
                var row = table.Rows[i];
                for (int j = 0; j < table.Columns.Count; j++)
                {
                    var cell = row[j]?.ToString()?.ToLower()?.Trim() ?? "";
                    if (cell == "date") dateCol = j;
                    else if (cell == "description" || cell == "narration") descCol = j;
                    else if (cell == "amount") amountCol = j;
                    else if (cell == "withdrawal amt." || cell == "withdrawal" || cell == "debit" || cell == "dr amount" || cell == "dr.") withdrawalCol = j;
                    else if (cell == "deposit amt." || cell == "deposit" || cell == "credit" || cell == "cr amount" || cell == "cr.") depositCol = j;
                    else if (cell == "type") typeCol = j;
                    else if (cell == "category") categoryCol = j;
                    else if (cell == "paymentmethod" || cell == "payment method") paymentMethodCol = j;
                }
                if (amountCol != -1 || withdrawalCol != -1 || depositCol != -1)
                {
                    startRow = i + 1;
                    break;
                }
            }

            if (amountCol == -1 && withdrawalCol == -1 && depositCol == -1)
                throw new InvalidOperationException("Required column 'Amount' (or Withdrawal/Deposit) is missing.");

            for (int i = startRow; i < table.Rows.Count; i++)
            {
                var row = table.Rows[i];
                string firstCol = row[0]?.ToString()?.ToUpper()?.Trim() ?? "";
                if (firstCol.Contains("STATEMENT SUMMARY") || firstCol.Contains("OPENING BALANCE") || firstCol.Contains("CLOSING BALANCE")) break;

                string dateStr = (dateCol != -1 && row[dateCol] != DBNull.Value) ? row[dateCol]?.ToString()?.Trim() ?? "" : "";
                if (string.IsNullOrWhiteSpace(dateStr) || dateStr.Contains("***")) continue;

                string[] dateFormats = { "dd-MMM-yyyy", "dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd-MM-yyyy", "MM/dd/yy", "dd/MM/yy" };
                bool isDateValid = DateTime.TryParse(dateStr, out DateTime parsedDate) || 
                                   DateTime.TryParseExact(dateStr, dateFormats, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out parsedDate);

                if (dateCol != -1 && !string.IsNullOrWhiteSpace(dateStr) && !isDateValid) continue;

                decimal finalAmount = 0;
                string finalType = "expense";

                if (amountCol != -1 && row[amountCol] != DBNull.Value && decimal.TryParse(row[amountCol].ToString(), out decimal parsedAmt))
                {
                    finalAmount = parsedAmt;
                    finalType = typeCol != -1 && row[typeCol] != DBNull.Value ? (row[typeCol]?.ToString()?.ToLower() ?? "expense") : "expense";
                }
                else if (withdrawalCol != -1 && row[withdrawalCol] != DBNull.Value && decimal.TryParse(row[withdrawalCol].ToString(), out decimal withdrawal))
                {
                    finalAmount = withdrawal;
                    finalType = "expense";
                }
                else if (depositCol != -1 && row[depositCol] != DBNull.Value && decimal.TryParse(row[depositCol].ToString(), out decimal deposit))
                {
                    finalAmount = deposit;
                    finalType = "income";
                }
                else continue;

                // Auto-categorization
                string category = "misc";
                string desc = descCol != -1 && row[descCol] != DBNull.Value ? (row[descCol]?.ToString() ?? "Imported") : "Imported";
                
                var matchedCategory = allCategories.FirstOrDefault(c => 
                    !string.IsNullOrEmpty(c.Keywords) && 
                    c.Keywords.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Any(k => desc.Contains(k.Trim(), StringComparison.OrdinalIgnoreCase)));

                if (matchedCategory != null)
                {
                    category = matchedCategory.Name;
                }
                else if (categoryCol != -1 && row[categoryCol] != DBNull.Value)
                {
                    category = row[categoryCol]?.ToString() ?? "misc";
                }

                records.Add(new Transaction
                {
                    Description = desc,
                    Amount = finalAmount,
                    Date = isDateValid ? parsedDate.ToString("yyyy-MM-dd") : DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    Type = finalType,
                    Category = category,
                    PaymentMethod = paymentMethodCol != -1 && row[paymentMethodCol] != DBNull.Value ? (row[paymentMethodCol]?.ToString()?.ToLower() ?? "bank") : "bank",
                    LedgerId = ledgerId,
                    Currency = "INR"
                });
            }
        }

        int successCount = 0;
        foreach (var req in records)
        {
            try {
                await CreateAsync(req);
                successCount++;
            } catch {
                // Skip if closed FY or other error
            }
        }

        return successCount;
    }
}
