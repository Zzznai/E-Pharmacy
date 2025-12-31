using System.Collections.Generic;

namespace EPharmacyAPI.Dtos;

public record OrderItemCreateDto(int ProductId, int Quantity);
public record OrderCreateDto(List<OrderItemCreateDto> Items);
public record OrderResponseDto(int Id, decimal TotalPrice, string Status);
