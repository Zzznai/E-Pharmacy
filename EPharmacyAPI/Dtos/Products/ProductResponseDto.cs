namespace EPharmacyAPI.Dtos.Products;

public record ProductResponseDto(
    int Id, 
    string Name, 
    string PhotoUrl, 
    decimal Price, 
    int AvailableQuantity, 
    string Description, 
    bool IsPrescriptionRequired, 
    int? BrandId, 
    string? BrandName, 
    List<int> CategoryIds, 
    List<IngredientLineResponseDto> Ingredients
);
