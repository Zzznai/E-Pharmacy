namespace EPharmacyAPI.Dtos.Categories;

public class CategoryUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public int? ParentCategoryId { get; set; }
}
