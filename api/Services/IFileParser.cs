using MoneyFlowApi.Models;

namespace MoneyFlowApi.Services;

public interface IFileParser
{
    string SupportedExtension { get; }
    Task<List<Transaction>> ParseAsync(Stream stream, int? ledgerId, List<Category> allCategories);
}
