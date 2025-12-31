using System.Text.Json.Serialization;

namespace EPharmacyAPI.Dtos.Products;

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
