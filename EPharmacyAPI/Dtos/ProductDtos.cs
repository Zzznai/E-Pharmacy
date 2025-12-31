using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace EPharmacyAPI.Dtos;

public record IngredientLineDto(int IngredientId, decimal Amount, string Unit);
public record IngredientLineResponseDto(int IngredientId, string Name, decimal Amount, string Unit);

public record ProductResponseDto(int Id, string Name, string PhotoUrl, decimal Price, int AvailableQuantity, string Description, bool IsPrescriptionRequired, int? BrandId, string? BrandName, List<int> CategoryIds, List<IngredientLineResponseDto> Ingredients);
public record ProductCreateDto(string Name, string PhotoUrl, decimal Price, int AvailableQuantity, string Description, bool IsPrescriptionRequired, int? BrandId, List<int>? CategoryIds, List<IngredientLineDto>? Ingredients);
public record ProductUpdateDto(string Name, string PhotoUrl, decimal Price, int AvailableQuantity, string Description, bool IsPrescriptionRequired, int? BrandId, List<int>? CategoryIds, List<IngredientLineDto>? Ingredients);

// Form DTOs for file upload
public class ProductCreateFormDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int AvailableQuantity { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsPrescriptionRequired { get; set; }
    public int? BrandId { get; set; }
    public List<int>? CategoryIds { get; set; }
    public string? IngredientsJson { get; set; } // JSON string of List<IngredientLineDto>
    public IFormFile? Image { get; set; }
}

public class ProductUpdateFormDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int AvailableQuantity { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsPrescriptionRequired { get; set; }
    public int? BrandId { get; set; }
    public List<int>? CategoryIds { get; set; }
    public string? IngredientsJson { get; set; } // JSON string of List<IngredientLineDto>
    public IFormFile? Image { get; set; }
    public bool RemoveImage { get; set; } // Flag to remove existing image
}
