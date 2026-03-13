using CsvHelper;
using MoneyFlowApi.Models;
using System.Globalization;

namespace MoneyFlowApi.Services;

public class CsvFileParser : IFileParser
{
    public string SupportedExtension => ".csv";

    public async Task<List<Transaction>> ParseAsync(Stream stream, int? ledgerId, List<Category> allCategories)
    {
        stream.Position = 0;
        using var reader = new StreamReader(stream);
        var config = new CsvHelper.Configuration.CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HeaderValidated = null,
            MissingFieldFound = null,
        };
        using var csv = new CsvReader(reader, config);
        
        // Use ToList to force enumeration while the stream is open
        var csvRecords = csv.GetRecords<dynamic>().ToList();
        var transactions = new List<Transaction>();

        foreach (var row in csvRecords)
        {
            var dict = (IDictionary<string, object>)row;
            
            // Try to find columns
            string desc = "";
            decimal amount = 0;
            string type = "expense";
            string date = DateTime.UtcNow.ToString("yyyy-MM-dd");

            foreach (var key in dict.Keys)
            {
                var lowerKey = key.ToLower();
                var val = dict[key]?.ToString() ?? "";

                if (lowerKey.Contains("date")) date = val;
                else if (lowerKey.Contains("desc") || lowerKey.Contains("narration") || lowerKey.Contains("remark")) desc = val;
                else if (lowerKey.Contains("amount")) decimal.TryParse(val, out amount);
                else if (lowerKey.Contains("withdrawal") || lowerKey.Contains("debit")) { if(decimal.TryParse(val, out var a) && a > 0) { amount = a; type = "expense"; } }
                else if (lowerKey.Contains("deposit") || lowerKey.Contains("credit")) { if(decimal.TryParse(val, out var a) && a > 0) { amount = a; type = "income"; } }
            }

            if (string.IsNullOrEmpty(desc) && amount == 0) continue;

            // Auto-categorization logic
            string category = "misc";
            var matchedCategory = allCategories.FirstOrDefault(c => 
                !string.IsNullOrEmpty(c.Keywords) && 
                c.Keywords.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Any(k => desc.Contains(k.Trim(), StringComparison.OrdinalIgnoreCase)));

            if (matchedCategory != null)
            {
                category = matchedCategory.Name;
            }

            transactions.Add(new Transaction
            {
                Description = desc,
                Amount = amount,
                Date = date,
                Type = type,
                Category = category,
                LedgerId = ledgerId,
                Currency = "INR",
                PaymentMethod = "bank"
            });
        }

        return transactions;
    }
}
