namespace EPharmacyAPI.Dtos.Orders;

public class OrderDetailDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = "";
    public string UserUsername { get; set; } = "";
    public DateTime OrderDate { get; set; }
    public string Status { get; set; } = "";
    public decimal TotalPrice { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    
    // Delivery Info
    public string DeliveryAddress { get; set; } = "";
    public string City { get; set; } = "";
    public string Province { get; set; } = "";
    public string PostalCode { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
}
