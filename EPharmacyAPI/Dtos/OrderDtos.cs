using System.Collections.Generic;

namespace EPharmacyAPI.Dtos;

public record OrderItemCreateDto(int ProductId, int Quantity);
public record OrderCreateDto(
    List<OrderItemCreateDto> Items,
    string DeliveryAddress,
    string City,
    string Province,
    string PostalCode,
    string PhoneNumber
);
public record OrderResponseDto(int Id, decimal TotalPrice, string Status);

// Admin DTOs
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

public class OrderItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public record UpdateOrderStatusDto(string Status);
