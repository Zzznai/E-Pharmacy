using System.Linq;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using EPharmacyAPI.Dtos;
using EPharmacyAPI.Services;
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
    private readonly ICloudinaryService _cloudinaryService;

    public ProductsController(
        ProductService productService, 
        CategoryService categoryService, 
        IngredientService ingredientService, 
        BrandService brandService,
        ICloudinaryService cloudinaryService)
    {
        _productService = productService;
        _categoryService = categoryService;
        _ingredientService = ingredientService;
        _brandService = brandService;
        _cloudinaryService = cloudinaryService;
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
            p.AvailableQuantity,
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
            product.AvailableQuantity,
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
    public async Task<IActionResult> Create([FromForm] ProductCreateFormDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name is required.");
        if (dto.Price <= 0) return BadRequest("Price must be greater than zero.");
        
        // Validate prescription products
        if (dto.IsPrescriptionRequired)
        {
            if (dto.AvailableQuantity != 0) return BadRequest("Prescription products cannot have available quantity.");
        }
        else
        {
            if (dto.AvailableQuantity < 0) return BadRequest("Available quantity cannot be negative.");
        }

        var categoryIds = dto.CategoryIds ?? new List<int>();
        
        // Parse ingredients from JSON string
        var ingredientDtos = new List<IngredientLineDto>();
        if (!string.IsNullOrWhiteSpace(dto.IngredientsJson))
        {
            try
            {
                var options = new System.Text.Json.JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                };
                ingredientDtos = System.Text.Json.JsonSerializer.Deserialize<List<IngredientLineDto>>(dto.IngredientsJson, options) ?? new List<IngredientLineDto>();
            }
            catch
            {
                return BadRequest("Invalid ingredients JSON format.");
            }
        }

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

        // Upload image to Cloudinary if provided
        string? photoUrl = null;
        if (dto.Image != null && dto.Image.Length > 0)
        {
            var uploadResult = await _cloudinaryService.UploadImageAsync(dto.Image);
            if (uploadResult == null)
                return BadRequest("Failed to upload image.");
            photoUrl = uploadResult;
        }

        var product = new Product
        {
            Name = dto.Name,
            PhotoUrl = photoUrl,
            Price = dto.Price,
            AvailableQuantity = dto.AvailableQuantity,
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
            product.AvailableQuantity,
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
    public async Task<IActionResult> Update(int id, [FromForm] ProductUpdateFormDto dto)
    {
        var product = _productService.GetWithDetails(id);
        if (product == null) return NotFound();

        // Validate prescription products
        if (dto.IsPrescriptionRequired)
        {
            if (dto.AvailableQuantity != 0) return BadRequest("Prescription products cannot have available quantity.");
        }
        else
        {
            if (dto.AvailableQuantity < 0) return BadRequest("Available quantity cannot be negative.");
        }
        if (dto.Price <= 0) return BadRequest("Price must be greater than zero.");

        // Parse ingredients from JSON string
        var ingredientDtos = new List<IngredientLineDto>();
        if (!string.IsNullOrWhiteSpace(dto.IngredientsJson))
        {
            try
            {
                var options = new System.Text.Json.JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                };
                ingredientDtos = System.Text.Json.JsonSerializer.Deserialize<List<IngredientLineDto>>(dto.IngredientsJson, options) ?? new List<IngredientLineDto>();
            }
            catch
            {
                return BadRequest("Invalid ingredients JSON format.");
            }
        }

        var categoryIds = dto.CategoryIds ?? new List<int>();

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

        // Handle image update
        if (dto.RemoveImage && !string.IsNullOrEmpty(product.PhotoUrl))
        {
            // Delete existing image from Cloudinary
            await _cloudinaryService.DeleteImageAsync(_cloudinaryService.GetPublicIdFromUrl(product.PhotoUrl));
            product.PhotoUrl = null;
        }
        else if (dto.Image != null && dto.Image.Length > 0)
        {
            // Delete existing image if present
            if (!string.IsNullOrEmpty(product.PhotoUrl))
            {
                await _cloudinaryService.DeleteImageAsync(_cloudinaryService.GetPublicIdFromUrl(product.PhotoUrl));
            }
            // Upload new image
            var uploadResult = await _cloudinaryService.UploadImageAsync(dto.Image);
            if (uploadResult == null)
                return BadRequest("Failed to upload image.");
            product.PhotoUrl = uploadResult;
        }

        product.Name = dto.Name;
        product.Price = dto.Price;
        product.AvailableQuantity = dto.AvailableQuantity;
        product.Description = dto.Description;
        product.IsPrescriptionRequired = dto.IsPrescriptionRequired;

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
    public async Task<IActionResult> Delete(int id)
    {
        var product = _productService.GetById(id);
        if (product == null) return NotFound();

        // Delete image from Cloudinary if exists
        if (!string.IsNullOrEmpty(product.PhotoUrl))
        {
            await _cloudinaryService.DeleteImageAsync(_cloudinaryService.GetPublicIdFromUrl(product.PhotoUrl));
        }

        _productService.Delete(product);
        return NoContent();
    }

    [HttpPatch("{id}/quantity")]
    [Authorize(Roles = "Administrator")]
    public IActionResult SetQuantity(int id, [FromBody] int availableQuantity)
    {
        var product = _productService.GetById(id);
        if (product == null) return NotFound();
        
        if (product.IsPrescriptionRequired) 
            return BadRequest("Cannot set quantity for prescription products.");
        
        if (availableQuantity < 0) return BadRequest("Quantity cannot be negative.");

        product.AvailableQuantity = availableQuantity;
        _productService.Save(product);
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
