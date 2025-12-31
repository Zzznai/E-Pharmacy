using System.Linq;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EPharmacyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IngredientsController : ControllerBase
{
    private readonly IngredientService _ingredientService;

    public IngredientsController(IngredientService ingredientService)
    {
        _ingredientService = ingredientService;
    }

    public record IngredientResponse(int Id, string Name, string Description, bool IsActiveSubstance);
    public record IngredientCreateDto(string Name, string Description, bool IsActiveSubstance);
    public record IngredientUpdateDto(string Name, string Description, bool IsActiveSubstance);

    [HttpGet("{id}")]
    [AllowAnonymous]
    public IActionResult GetById(int id)
    {
        var ingredient = _ingredientService.GetById(id);
        if (ingredient == null) return NotFound();

        return Ok(new IngredientResponse(ingredient.Id, ingredient.Name, ingredient.Description, ingredient.IsActiveSubstance));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public IActionResult Post([FromBody] IngredientCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name is required.");

        var ingredient = new Ingredient
        {
            Name = dto.Name,
            Description = dto.Description,
            IsActiveSubstance = dto.IsActiveSubstance
        };

        _ingredientService.Save(ingredient);
        return CreatedAtAction(nameof(GetById), new { id = ingredient.Id }, new IngredientResponse(ingredient.Id, ingredient.Name, ingredient.Description, ingredient.IsActiveSubstance));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public IActionResult Update(int id, [FromBody] IngredientUpdateDto dto)
    {
        var ingredient = _ingredientService.GetById(id);
        if (ingredient == null) return NotFound();

        ingredient.Name = dto.Name;
        ingredient.Description = dto.Description;
        ingredient.IsActiveSubstance = dto.IsActiveSubstance;

        _ingredientService.Save(ingredient);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public IActionResult Delete(int id)
    {
        var ingredient = _ingredientService.GetById(id);
        if (ingredient == null) return NotFound();

        _ingredientService.Delete(ingredient);
        return NoContent();
    }
}
