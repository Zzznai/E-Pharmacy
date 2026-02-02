using System.Linq;
using System.Threading.Tasks;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using EPharmacyAPI.Dtos.Categories;
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

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var items = await _categoryService.GetAllAsync();

        var result = items.Select(c => new CategoryResponse(
            c.Id,
            c.Name,
            c.ParentCategoryId,
            c.Subcategories.Select(s => s.Id).ToList()
        ));

        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await _categoryService.GetByIdAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        return Ok(new CategoryResponse(
            category.Id,
            category.Name,
            category.ParentCategoryId,
            category.Subcategories.Select(s => s.Id).ToList()
        ));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Post([FromBody] CategoryCreateDto dto)
    {
        if (dto.ParentCategoryId.HasValue)
        {
            var parent = await _categoryService.GetByIdAsync(dto.ParentCategoryId.Value);

            if (parent == null)
            {
                return BadRequest("Parent category not found.");
            }
        }

        var category = new Category
        {
            Name = dto.Name,
            ParentCategoryId = dto.ParentCategoryId
        };

        await _categoryService.SaveAsync(category);

        return CreatedAtAction(
            nameof(GetById),
            new { id = category.Id },
            new CategoryResponse(category.Id, category.Name, category.ParentCategoryId, new List<int>())
        );
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Put(int id, [FromBody] CategoryUpdateDto dto)
    {
        var category = await _categoryService.GetByIdAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        category.Name = dto.Name;
        category.ParentCategoryId = dto.ParentCategoryId;

        await _categoryService.SaveAsync(category);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _categoryService.GetByIdAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        await _categoryService.DeleteAsync(category);

        return NoContent();
    }
}
