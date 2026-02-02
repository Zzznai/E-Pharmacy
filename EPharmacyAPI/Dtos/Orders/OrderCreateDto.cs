namespace EPharmacyAPI.Dtos.Orders;

public class OrderCreateDto
{
    public List<OrderItemCreateDto> Items { get; set; } = new();
    public string DeliveryAddress { get; set; } = "";
    public string City { get; set; } = "";
    public string Province { get; set; } = "";
    public string PostalCode { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
}
