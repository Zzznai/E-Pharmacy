using System.Linq;
using System.Threading.Tasks;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using EPharmacyAPI.Dtos.Ingredients;
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

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var items = await _ingredientService.GetAllAsync();
        return Ok(items.Select(i => new IngredientResponse(i.Id, i.Name, i.Description, i.IsActiveSubstance)));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var ingredient = await _ingredientService.GetByIdAsync(id);
        if (ingredient == null) return NotFound();

        return Ok(new IngredientResponse(ingredient.Id, ingredient.Name, ingredient.Description, ingredient.IsActiveSubstance));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Post([FromBody] IngredientCreateDto dto)
    {
        var ingredient = new Ingredient
        {
            Name = dto.Name,
            Description = dto.Description,
            IsActiveSubstance = dto.IsActiveSubstance
        };

        await _ingredientService.SaveAsync(ingredient);
        return CreatedAtAction(nameof(GetById), new { id = ingredient.Id }, new IngredientResponse(ingredient.Id, ingredient.Name, ingredient.Description, ingredient.IsActiveSubstance));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Put(int id, [FromBody] IngredientUpdateDto dto)
    {
        var ingredient = await _ingredientService.GetByIdAsync(id);
        if (ingredient == null) return NotFound();

        ingredient.Name = dto.Name;
        ingredient.Description = dto.Description;
        ingredient.IsActiveSubstance = dto.IsActiveSubstance;

        await _ingredientService.SaveAsync(ingredient);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var ingredient = await _ingredientService.GetByIdAsync(id);
        if (ingredient == null) return NotFound();

        await _ingredientService.DeleteAsync(ingredient);
        return NoContent();
    }
}
