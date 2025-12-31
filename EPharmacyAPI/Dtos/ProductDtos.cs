using System.Collections.Generic;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;

namespace EPharmacyAPI.Dtos;

public class IngredientLineDto
{
    [JsonPropertyName("ingredientId")]
    public int IngredientId { get; set; }
    
    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
    
    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;
}

public class IngredientLineResponseDto
{
    [JsonPropertyName("ingredientId")]
    public int IngredientId { get; set; }
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
    
    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;
    
    public IngredientLineResponseDto() { }
    
    public IngredientLineResponseDto(int ingredientId, string name, decimal amount, string unit)
    {
        IngredientId = ingredientId;
        Name = name;
        Amount = amount;
        Unit = unit;
    }
}

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
