using System.Linq;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using EPharmacyAPI.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EPharmacyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ProductService _productService;
    private readonly CategoryService _categoryService;
    private readonly IngredientService _ingredientService;
    private readonly BrandService _brandService;

    public ProductsController(ProductService productService, CategoryService categoryService, IngredientService ingredientService, BrandService brandService)
    {
        _productService = productService;
        _categoryService = categoryService;
        _ingredientService = ingredientService;
        _brandService = brandService;
    }

    [HttpGet]
    [AllowAnonymous]
    public IActionResult GetAll()
    {
        var products = _productService.GetAllWithDetails();
        var result = products.Select(p => new ProductResponseDto(
            p.Id,
            p.Name,
            p.PhotoUrl,
            p.Price,
            p.Description,
            p.IsPrescriptionRequired,
            p.BrandId,
            p.Brand?.Name,
            p.Categories.Select(c => c.Id).ToList(),
            p.ProductIngredients.Select(pi => new IngredientLineResponseDto(pi.IngredientId, pi.Ingredient?.Name ?? string.Empty, pi.Amount, pi.Unit)).ToList()
        ));
        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public IActionResult GetById(int id)
    {
        var product = _productService.GetWithDetails(id);
        if (product == null) return NotFound();

        return Ok(new ProductResponseDto(
            product.Id,
            product.Name,
            product.PhotoUrl,
            product.Price,
            product.Description,
            product.IsPrescriptionRequired,
            product.BrandId,
            product.Brand?.Name,
            product.Categories.Select(c => c.Id).ToList(),
            product.ProductIngredients.Select(pi => new IngredientLineResponseDto(pi.IngredientId, pi.Ingredient?.Name ?? string.Empty, pi.Amount, pi.Unit)).ToList()
        ));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public IActionResult Create([FromBody] ProductCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name is required.");

        var categoryIds = dto.CategoryIds ?? new List<int>();
        var ingredientDtos = dto.Ingredients ?? new List<IngredientLineDto>();

        // validate categories exist
        var categories = _categoryService.GetAll(c => categoryIds.Contains(c.Id));
        if (categories.Count != categoryIds.Count)
            return BadRequest("One or more categories were not found.");

        // expand to include all parent categories
        var expandedCategoryIds = ExpandCategoryIdsWithAncestors(categoryIds);

        // validate ingredients exist
        var ingredientIds = ingredientDtos.Select(i => i.IngredientId).ToList();
        var foundIngredients = _ingredientService.GetAll(i => ingredientIds.Contains(i.Id));
        if (foundIngredients.Count != ingredientIds.Count)
            return BadRequest("One or more ingredients were not found.");

        // validate brand if provided
        if (dto.BrandId.HasValue && _brandService.GetById(dto.BrandId.Value) == null)
            return BadRequest("Brand not found.");

        var product = new Product
        {
            Name = dto.Name,
            PhotoUrl = dto.PhotoUrl,
            Price = dto.Price,
            Description = dto.Description,
            IsPrescriptionRequired = dto.IsPrescriptionRequired,
            BrandId = dto.BrandId
        };

        var productIngredients = ingredientDtos.Select(i => new ProductIngredient
        {
            IngredientId = i.IngredientId,
            Amount = i.Amount,
            Unit = i.Unit
        }).ToList();

        _productService.SaveWithDetails(product, expandedCategoryIds, productIngredients);

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, new ProductResponseDto(
            product.Id,
            product.Name,
            product.PhotoUrl,
            product.Price,
            product.Description,
            product.IsPrescriptionRequired,
            product.BrandId,
            dto.BrandId.HasValue ? _brandService.GetById(dto.BrandId.Value)?.Name : null,
            expandedCategoryIds.ToList(),
            productIngredients.Select(pi => new IngredientLineResponseDto(pi.IngredientId, foundIngredients.First(f => f.Id == pi.IngredientId).Name, pi.Amount, pi.Unit)).ToList()
        ));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public IActionResult Update(int id, [FromBody] ProductUpdateDto dto)
    {
        var product = _productService.GetWithDetails(id);
        if (product == null) return NotFound();

        product.Name = dto.Name;
        product.PhotoUrl = dto.PhotoUrl;
        product.Price = dto.Price;
        product.Description = dto.Description;
        product.IsPrescriptionRequired = dto.IsPrescriptionRequired;

        var categoryIds = dto.CategoryIds ?? new List<int>();
        var ingredientDtos = dto.Ingredients ?? new List<IngredientLineDto>();

        var categories = _categoryService.GetAll(c => categoryIds.Contains(c.Id));
        if (categories.Count != categoryIds.Count)
            return BadRequest("One or more categories were not found.");

        // expand to include all parent categories
        var expandedCategoryIds = ExpandCategoryIdsWithAncestors(categoryIds);

        var ingredientIds = ingredientDtos.Select(i => i.IngredientId).ToList();
        var foundIngredients = _ingredientService.GetAll(i => ingredientIds.Contains(i.Id));
        if (foundIngredients.Count != ingredientIds.Count)
            return BadRequest("One or more ingredients were not found.");

        if (dto.BrandId.HasValue && _brandService.GetById(dto.BrandId.Value) == null)
            return BadRequest("Brand not found.");

        var productIngredients = ingredientDtos.Select(i => new ProductIngredient
        {
            IngredientId = i.IngredientId,
            Amount = i.Amount,
            Unit = i.Unit
        }).ToList();

        product.BrandId = dto.BrandId;

        _productService.SaveWithDetails(product, expandedCategoryIds, productIngredients);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public IActionResult Delete(int id)
    {
        var product = _productService.GetById(id);
        if (product == null) return NotFound();

        _productService.Delete(product);
        return NoContent();
    }

    private HashSet<int> ExpandCategoryIdsWithAncestors(IEnumerable<int> categoryIds)
    {
        var expanded = new HashSet<int>(categoryIds);
        foreach (var cid in categoryIds)
        {
            var current = _categoryService.GetById(cid);
            while (current?.ParentCategoryId is int parentId)
            {
                if (!expanded.Add(parentId))
                    break; // already visited, prevent infinite loops
                current = _categoryService.GetById(parentId);
            }
        }
        return expanded;
    }
}
