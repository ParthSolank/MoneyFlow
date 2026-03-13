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
        var records = csv.GetRecords<Transaction>().ToList();
        
        foreach(var record in records)
        {
            record.LedgerId = ledgerId;
            record.Currency = "INR";
            // Map categories if needed, similar to Excel parser
        }

        return records;
    }
}
