namespace EPharmacyAPI.Dtos.Categories;

public record CategoryResponse(int Id, string Name, int? ParentCategoryId, List<int> SubcategoryIds);
