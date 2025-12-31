using Microsoft.AspNetCore.Http;

namespace EPharmacyAPI.Dtos.Products;

public class ProductCreateFormDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int AvailableQuantity { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsPrescriptionRequired { get; set; }
    public int? BrandId { get; set; }
    public List<int>? CategoryIds { get; set; }
    public string? IngredientsJson { get; set; }
    public IFormFile? Image { get; set; }
}
