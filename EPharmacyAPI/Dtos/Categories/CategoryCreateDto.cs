namespace EPharmacyAPI.Dtos.Categories;

public class CategoryCreateDto
{
    public string Name { get; set; } = string.Empty;
    public int? ParentCategoryId { get; set; }
}
