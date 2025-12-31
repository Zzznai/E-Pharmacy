namespace EPharmacyAPI.Dtos.Orders;

public class OrderListDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = "";
    public string UserUsername { get; set; } = "";
    public DateTime OrderDate { get; set; }
    public string Status { get; set; } = "";
    public decimal TotalPrice { get; set; }
    public int ItemCount { get; set; }
    public string City { get; set; } = "";
    public string Province { get; set; } = "";
}
