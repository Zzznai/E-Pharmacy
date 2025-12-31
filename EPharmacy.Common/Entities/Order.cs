namespace EPharmacy.Common.Entities;

public class Order : BaseEntity
{
    public int UserId { get; set; }
    public DateTime OrderDate { get; set; }
    public OrderStatus Status { get; set; }
    public decimal TotalPrice { get; set; }

    public User? User { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}