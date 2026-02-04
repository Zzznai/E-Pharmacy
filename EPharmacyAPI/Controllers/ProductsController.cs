using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using EPharmacyAPI.Dtos.Products;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EPharmacyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ProductService _productService;
    private readonly BrandService _brandService;

    public ProductsController(ProductService productService, BrandService brandService)
    {
        _productService = productService;
        _brandService = brandService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int? categoryId)
    {
        var products = await _productService.Search(search, categoryId);

        return Ok(products.Select(MapToDto));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _productService.GetById(id);

        if (product == null)
        {
            return NotFound();
        }

        return Ok(MapToDto(product));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] ProductCreateFormDto dto)
    {
        var ingredientDtos = ParseIngredients(dto.IngredientsJson);

        if (ingredientDtos == null)
        {
            return BadRequest("Invalid ingredients format.");
        }

        if (dto.BrandId.HasValue)
        {
            var brand = await _brandService.GetById(dto.BrandId.Value);

            if (brand == null)
            {
                return BadRequest("Brand not found.");
            }
        }

        string photoUrl;
        if (dto.ImageUrl != null)
        {
            photoUrl = dto.ImageUrl;
        }
        else
        {
            photoUrl = "";
        }

        string description;
        if (dto.Description != null)
        {
            description = dto.Description;
        }
        else
        {
            description = "";
        }

        var product = new Product
        {
            Name = dto.Name,
            PhotoUrl = photoUrl,
            Price = dto.Price,
            AvailableQuantity = dto.AvailableQuantity,
            Description = description,
            IsPrescriptionRequired = dto.IsPrescriptionRequired,
            BrandId = dto.BrandId
        };

        List<int> categoryIds;
        if (dto.CategoryIds != null)
        {
            categoryIds = dto.CategoryIds;
        }
        else
        {
            categoryIds = new List<int>();
        }

        var productIngredients = ingredientDtos.Select(i => new ProductIngredient { IngredientId = i.IngredientId, Amount = i.Amount, Unit = i.Unit }).ToList();

        await _productService.Save(product, categoryIds.ToHashSet(), productIngredients);

        var saved = await _productService.GetById(product.Id);

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, MapToDto(saved!));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateFormDto dto)
    {
        var product = await _productService.GetById(id);

        if (product == null)
        {
            return NotFound();
        }

        var ingredientDtos = ParseIngredients(dto.IngredientsJson);

        if (ingredientDtos == null)
        {
            return BadRequest("Invalid ingredients format.");
        }

        if (dto.BrandId.HasValue)
        {
            var brand = await _brandService.GetById(dto.BrandId.Value);

            if (brand == null)
            {
                return BadRequest("Brand not found.");
            }
        }

        string updatePhotoUrl;
        if (dto.ImageUrl != null)
        {
            updatePhotoUrl = dto.ImageUrl;
        }
        else
        {
            updatePhotoUrl = "";
        }

        string updateDescription;
        if (dto.Description != null)
        {
            updateDescription = dto.Description;
        }
        else
        {
            updateDescription = "";
        }

        product.Name = dto.Name;
        product.PhotoUrl = updatePhotoUrl;
        product.Price = dto.Price;
        product.AvailableQuantity = dto.AvailableQuantity;
        product.Description = updateDescription;
        product.IsPrescriptionRequired = dto.IsPrescriptionRequired;
        product.BrandId = dto.BrandId;

        List<int> updateCategoryIds;
        if (dto.CategoryIds != null)
        {
            updateCategoryIds = dto.CategoryIds;
        }
        else
        {
            updateCategoryIds = new List<int>();
        }

        var productIngredients = ingredientDtos.Select(i => new ProductIngredient { IngredientId = i.IngredientId, Amount = i.Amount, Unit = i.Unit }).ToList();

        await _productService.Save(product, updateCategoryIds.ToHashSet(), productIngredients);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _productService.GetById(id);

        if (product == null)
        {
            return NotFound();
        }

        await _productService.Delete(product);

        return NoContent();
    }

    [HttpPatch("{id}/quantity")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> SetQuantity(int id, [FromBody] int quantity)
    {
        var product = await _productService.GetById(id);

        if (product == null)
        {
            return NotFound();
        }

        if (product.IsPrescriptionRequired)
        {
            return BadRequest("Cannot set quantity for prescription products.");
        }

        if (quantity < 0)
        {
            return BadRequest("Quantity cannot be negative.");
        }

        product.AvailableQuantity = quantity;

        await _productService.Save(product);

        return NoContent();
    }

    private static ProductResponseDto MapToDto(Product p)
    {
        string? brandName = null;
        if (p.Brand != null)
        {
            brandName = p.Brand.Name;
        }

        var ingredients = new List<IngredientLineResponseDto>();
        foreach (var pi in p.ProductIngredients)
        {
            string ingredientName = "";
            if (pi.Ingredient != null)
            {
                ingredientName = pi.Ingredient.Name;
            }
            ingredients.Add(new IngredientLineResponseDto(pi.IngredientId, ingredientName, pi.Amount, pi.Unit));
        }

        var categoryIds = p.Categories.Select(c => c.Id).ToList();
        return new ProductResponseDto(p.Id, p.Name, p.PhotoUrl, p.Price, p.AvailableQuantity, p.Description, p.IsPrescriptionRequired, p.BrandId, brandName, categoryIds, ingredients);
    }

    private static List<IngredientLineDto>? ParseIngredients(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<IngredientLineDto>();
        }

        try
        {
            var options = new System.Text.Json.JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var result = System.Text.Json.JsonSerializer.Deserialize<List<IngredientLineDto>>(json, options);

            if (result == null)
            {
                return new List<IngredientLineDto>();
            }

            return result;
        }
        catch
        {
            return null;
        }
    }
}
