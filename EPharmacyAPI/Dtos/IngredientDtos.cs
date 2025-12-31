namespace EPharmacyAPI.Dtos;

public record IngredientResponse(int Id, string Name, string Description, bool IsActiveSubstance);

public class IngredientCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActiveSubstance { get; set; }
}

public class IngredientUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActiveSubstance { get; set; }
}
