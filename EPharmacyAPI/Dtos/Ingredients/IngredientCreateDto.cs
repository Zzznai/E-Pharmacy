namespace EPharmacyAPI.Dtos.Ingredients;

public class IngredientCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActiveSubstance { get; set; }
}
