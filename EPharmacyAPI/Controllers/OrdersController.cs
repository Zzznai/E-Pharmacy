using System.Linq;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using EPharmacyAPI.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EPharmacyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly OrderService _orderService;
    private readonly ProductService _productService;

    public OrdersController(OrderService orderService, ProductService productService)
    {
        _orderService = orderService;
        _productService = productService;
    }

    [HttpPost]
    [Authorize]
    public IActionResult Create([FromBody] OrderCreateDto dto)
    {
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
        if (string.Equals(role, UserRoles.Administrator.ToString(), StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

        if (dto.Items == null || dto.Items.Count == 0) return BadRequest("At least one item is required.");

        var orderItems = new List<OrderItem>();
        decimal total = 0m;

        foreach (var item in dto.Items)
        {
            if (item.Quantity <= 0) return BadRequest("Quantity must be greater than zero.");

            var product = _productService.GetById(item.ProductId);
            if (product == null) return NotFound($"Product {item.ProductId} not found.");
            if (product.IsPrescriptionRequired) return BadRequest("Prescription products cannot be ordered online.");

            var lineTotal = product.Price * item.Quantity;
            total += lineTotal;

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price
            });
        }

        var order = new Order
        {
            UserId = userId,
            OrderDate = DateTime.UtcNow,
            Status = OrderStatus.Pending,
            TotalPrice = total,
            OrderItems = orderItems
        };

        _orderService.Save(order);

        return Ok(new OrderResponseDto(order.Id, order.TotalPrice, order.Status.ToString()));
    }
}
