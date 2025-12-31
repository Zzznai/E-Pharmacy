namespace EPharmacy.Common.Entities;

public class ProductIngredient : BaseEntity
{
    public int IngredientId { get; set; }
    public decimal Amount { get; set; }
    public string Unit { get; set; } = string.Empty;

    public Product? Product { get; set; }
    public Ingredient? Ingredient { get; set; }
}