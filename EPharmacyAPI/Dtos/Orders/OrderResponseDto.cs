namespace EPharmacyAPI.Dtos.Orders;

public record OrderResponseDto(int Id, decimal TotalPrice, string Status);
