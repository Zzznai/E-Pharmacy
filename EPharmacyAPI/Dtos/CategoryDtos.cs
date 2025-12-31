namespace EPharmacyAPI.Dtos;

public record CategoryResponse(int Id, string Name, int? ParentCategoryId, List<int> SubcategoryIds);

public class CategoryCreateDto
{
    public string Name { get; set; } = string.Empty;
    public int? ParentCategoryId { get; set; }
}

public class CategoryUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public int? ParentCategoryId { get; set; }
}
