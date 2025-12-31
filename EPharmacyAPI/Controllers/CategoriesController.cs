using System.Linq;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EPharmacyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly CategoryService _categoryService;

    public CategoriesController(CategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    public record CategoryResponse(int Id, string Name, int? ParentCategoryId, List<int> SubcategoryIds);
    public record CategoryCreateDto(string Name, int? ParentCategoryId = null);
    public record CategoryUpdateDto(string Name, int? ParentCategoryId = null);

    [HttpGet]
    [AllowAnonymous]
    public IActionResult GetAll()
    {
        var items = _categoryService.GetAll();
        var result = items.Select(c => new CategoryResponse(c.Id, c.Name, c.ParentCategoryId, c.Subcategories.Select(s => s.Id).ToList()));
        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public IActionResult GetById(int id)
    {
        var category = _categoryService.GetById(id);
        if (category == null) return NotFound();

        return Ok(new CategoryResponse(category.Id, category.Name, category.ParentCategoryId, category.Subcategories.Select(s => s.Id).ToList()));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public IActionResult Post([FromBody] CategoryCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name is required.");

        if (dto.ParentCategoryId.HasValue && _categoryService.GetById(dto.ParentCategoryId.Value) == null)
            return BadRequest("Parent category not found.");

        var category = new Category { Name = dto.Name, ParentCategoryId = dto.ParentCategoryId };
        _categoryService.Save(category);

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, new CategoryResponse(category.Id, category.Name, category.ParentCategoryId, new List<int>()));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public IActionResult Put(int id, [FromBody] CategoryUpdateDto dto)
    {
        var category = _categoryService.GetById(id);
        if (category == null) return NotFound();

        category.Name = dto.Name;
        category.ParentCategoryId = dto.ParentCategoryId;
        _categoryService.Save(category);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public IActionResult Delete(int id)
    {
        var category = _categoryService.GetById(id);
        if (category == null) return NotFound();

        _categoryService.Delete(category);
        return NoContent();
    }
}
