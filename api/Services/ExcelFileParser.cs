using ExcelDataReader;
using MoneyFlowApi.Models;
using System.Data;

namespace MoneyFlowApi.Services;

public class ExcelFileParser : IFileParser
{
    public string SupportedExtension => ".xlsx"; // Handles .xls and .xlsx via ExcelReaderFactory

    public async Task<List<Transaction>> ParseAsync(Stream stream, int? ledgerId, List<Category> allCategories)
    {
        var records = new List<Transaction>();
        stream.Position = 0;

        using var reader = ExcelReaderFactory.CreateReader(stream);
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
                else if (cell == "description" || cell == "narration" || cell == "remark") descCol = j;
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
            string desc = descCol != -1 && row[descCol] != DBNull.Value ? (row[descCol]?.ToString() ?? "Imported") : "Imported";
            string lowerDesc = desc.ToLower();
            if (firstCol.Contains("STATEMENT SUMMARY") || firstCol.Contains("OPENING BALANCE") || firstCol.Contains("CLOSING BALANCE") ||
                lowerDesc.Contains("opening balance") || lowerDesc.Contains("brought forward") || lowerDesc.Contains("b/f") || lowerDesc.Contains("b/d")) continue;

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

            // Auto-categorization using the desc variable defined at the top of the loop
            string category = "misc";
            
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

        return records;
    }
}
