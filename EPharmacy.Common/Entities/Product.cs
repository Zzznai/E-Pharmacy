namespace EPharmacy.Common.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;

    public int BrandId { get; set; }
    public decimal Price { get; set; }
    public int AvailableQuantity { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsPrescriptionRequired { get; set; }

    public Brand Brand { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<ProductIngredient> ProductIngredients { get; set; } = new List<ProductIngredient>();
}