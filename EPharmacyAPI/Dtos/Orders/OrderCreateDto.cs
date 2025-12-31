namespace EPharmacyAPI.Dtos.Orders;

public record OrderCreateDto(
    List<OrderItemCreateDto> Items,
    string DeliveryAddress,
    string City,
    string Province,
    string PostalCode,
    string PhoneNumber
);
