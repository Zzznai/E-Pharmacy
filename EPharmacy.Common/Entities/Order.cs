using EPharmacy.Common.Enums;

namespace EPharmacy.Common.Entities;

public class Order : BaseEntity
{
    public int UserId { get; set; }
    public DateTime OrderDate { get; set; }
    public OrderStatus Status { get; set; }
    public decimal TotalPrice { get; set; }

    public string DeliveryAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    public User User { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}