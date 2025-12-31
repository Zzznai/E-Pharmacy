using System.Text.Json.Serialization;

namespace EPharmacyAPI.Dtos.Products;

public class IngredientLineDto
{
    [JsonPropertyName("ingredientId")]
    public int IngredientId { get; set; }
    
    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
    
    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;
}
