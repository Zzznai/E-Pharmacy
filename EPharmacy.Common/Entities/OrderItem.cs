namespace EPharmacy.Common.Entities;

public class OrderItem : BaseEntity
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    public Order? Order { get; set; }
    public Product? Product { get; set; }
}