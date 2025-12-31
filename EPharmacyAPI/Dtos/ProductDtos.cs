using System.Collections.Generic;

namespace EPharmacyAPI.Dtos;

public record IngredientLineDto(int IngredientId, decimal Amount, string Unit);
public record IngredientLineResponseDto(int IngredientId, string Name, decimal Amount, string Unit);

public record ProductResponseDto(int Id, string Name, string PhotoUrl, decimal Price, int AvailableQuantity, string Description, bool IsPrescriptionRequired, int? BrandId, string? BrandName, List<int> CategoryIds, List<IngredientLineResponseDto> Ingredients);
public record ProductCreateDto(string Name, string PhotoUrl, decimal Price, int AvailableQuantity, string Description, bool IsPrescriptionRequired, int? BrandId, List<int>? CategoryIds, List<IngredientLineDto>? Ingredients);
public record ProductUpdateDto(string Name, string PhotoUrl, decimal Price, int AvailableQuantity, string Description, bool IsPrescriptionRequired, int? BrandId, List<int>? CategoryIds, List<IngredientLineDto>? Ingredients);
