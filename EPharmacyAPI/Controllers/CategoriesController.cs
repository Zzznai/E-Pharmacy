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

    public record CategoryResponse(int Id, string Name);
    public record CategoryCreateDto(string Name);
    public record CategoryUpdateDto(string Name);

    [HttpGet]
    [AllowAnonymous]
    public IActionResult GetAll()
    {
        var items = _categoryService.GetAll();
        var result = items.Select(c => new CategoryResponse(c.Id, c.Name));
        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public IActionResult GetById(int id)
    {
        var category = _categoryService.GetById(id);
        if (category == null) return NotFound();

        return Ok(new CategoryResponse(category.Id, category.Name));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public IActionResult Create([FromBody] CategoryCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name is required.");

        var category = new Category { Name = dto.Name };
        _categoryService.Save(category);

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, new CategoryResponse(category.Id, category.Name));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public IActionResult Update(int id, [FromBody] CategoryUpdateDto dto)
    {
        var category = _categoryService.GetById(id);
        if (category == null) return NotFound();

        category.Name = dto.Name;
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
