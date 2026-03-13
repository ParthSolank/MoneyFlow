using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyFlowApi.Models;
using MoneyFlowApi.Services;
using MoneyFlowApi.Attributes;
 
namespace MoneyFlowApi.Controllers;
 
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly CategoryService _categoryService;
    private readonly AuditLogService _auditLogService;
 
    public CategoriesController(CategoryService categoryService, AuditLogService auditLogService)
    {
        _categoryService = categoryService;
        _auditLogService = auditLogService;
    }

    [AuthorizeRight("CORE_CATEGORIES_VIEW", "CORE_CATEGORIES_EDIT", "CORE_CATEGORIES_CREATE", "CORE_CATEGORIES_DELETE")]
    [HttpGet]
    public async Task<ActionResult<List<Category>>> GetAll()
    {
        return Ok(await _categoryService.GetAllAsync());
    }
 
    [AuthorizeRight("CORE_CATEGORIES_VIEW", "CORE_CATEGORIES_EDIT", "CORE_CATEGORIES_CREATE", "CORE_CATEGORIES_DELETE")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Category>> GetById(int id)
    {
        var category = await _categoryService.GetByIdAsync(id);
        if (category == null) return NotFound();
        return Ok(category);
    }
 
    [AuthorizeRight("CORE_CATEGORIES_CREATE")]
    [HttpPost]
    public async Task<ActionResult<Category>> Create(Category category)
    {
        var created = await _categoryService.CreateAsync(category);
        await _auditLogService.LogAsync("CREATE", "Categories", $"Created category '{created.Name}' ({created.Type})");
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
 
    [AuthorizeRight("CORE_CATEGORIES_EDIT")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Category category)
    {
        var updated = await _categoryService.UpdateAsync(id, category);
        if (!updated) return NotFound();
        await _auditLogService.LogAsync("UPDATE", "Categories", $"Updated category ID {id}");
        return NoContent();
    }
 
    [AuthorizeRight("CORE_CATEGORIES_DELETE")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _categoryService.DeleteAsync(id);
        if (!deleted) return NotFound();
        await _auditLogService.LogAsync("DELETE", "Categories", $"Deleted category ID {id}");
        return NoContent();
    }
}
