namespace EPharmacyAPI.Dtos.Products;

public record ProductCreateDto(
    string Name, 
    string PhotoUrl, 
    decimal Price, 
    int AvailableQuantity, 
    string Description, 
    bool IsPrescriptionRequired, 
    int? BrandId, 
    List<int>? CategoryIds, 
    List<IngredientLineDto>? Ingredients
);
