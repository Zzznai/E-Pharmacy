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
    private readonly UserService _userService;

    public OrdersController(OrderService orderService, ProductService productService, UserService userService)
    {
        _orderService = orderService;
        _productService = productService;
        _userService = userService;
    }

    // Admin: Get top selling products
    [HttpGet("top-products")]
    [Authorize(Roles = "Administrator")]
    public IActionResult GetTopProducts([FromQuery] int count = 5)
    {
        var orders = _orderService.GetAll();
        var productCounts = orders
            .Where(o => o.OrderItems != null)
            .SelectMany(o => o.OrderItems!)
            .GroupBy(oi => new { oi.ProductId, oi.Product?.Name })
            .Select(g => new {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.Name ?? "Unknown",
                OrderCount = g.Count(),
                TotalQuantity = g.Sum(x => x.Quantity),
                TotalRevenue = g.Sum(x => x.Quantity * x.UnitPrice)
            })
            .OrderByDescending(x => x.TotalQuantity)
            .Take(count)
            .ToList();

        return Ok(productCounts);
    }

    // Admin: Get all orders
    [HttpGet]
    [Authorize(Roles = "Administrator")]
    public IActionResult GetAll()
    {
        var orders = _orderService.GetAll();
        var result = orders.Select(o => new OrderListDto
        {
            Id = o.Id,
            UserId = o.UserId,
            UserName = o.User?.FirstName + " " + o.User?.LastName,
            UserUsername = o.User?.Username ?? "",
            OrderDate = o.OrderDate,
            Status = o.Status.ToString(),
            TotalPrice = o.TotalPrice,
            ItemCount = o.OrderItems?.Count ?? 0,
            City = o.City,
            Province = o.Province
        }).OrderByDescending(o => o.OrderDate).ToList();

        return Ok(result);
    }

    // Customer: Get my orders
    [HttpGet("my-orders")]
    [Authorize]
    public IActionResult GetMyOrders()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        
        if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var orders = _orderService.GetAll(o => o.UserId == userId);
        var result = orders.Select(o => new OrderListDto
        {
            Id = o.Id,
            UserId = o.UserId,
            UserName = o.User?.FirstName + " " + o.User?.LastName,
            UserUsername = o.User?.Username ?? "",
            OrderDate = o.OrderDate,
            Status = o.Status.ToString(),
            TotalPrice = o.TotalPrice,
            ItemCount = o.OrderItems?.Count ?? 0,
            City = o.City,
            Province = o.Province
        }).OrderByDescending(o => o.OrderDate).ToList();

        return Ok(result);
    }

    // Admin: Get order details
    [HttpGet("{id}")]
    [Authorize]
    public IActionResult GetById(int id)
    {
        var order = _orderService.GetById(id);
        if (order == null) return NotFound();

        // Check if user is admin or owns this order
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        
        if (!string.Equals(role, UserRoles.Administrator.ToString(), StringComparison.OrdinalIgnoreCase))
        {
            if (!int.TryParse(userIdClaim, out var userId) || order.UserId != userId)
                return Forbid();
        }

        var result = new OrderDetailDto
        {
            Id = order.Id,
            UserId = order.UserId,
            UserName = order.User?.FirstName + " " + order.User?.LastName,
            UserUsername = order.User?.Username ?? "",
            OrderDate = order.OrderDate,
            Status = order.Status.ToString(),
            TotalPrice = order.TotalPrice,
            DeliveryAddress = order.DeliveryAddress,
            City = order.City,
            Province = order.Province,
            PostalCode = order.PostalCode,
            PhoneNumber = order.PhoneNumber,
            Items = order.OrderItems?.Select(oi => new OrderItemDto
            {
                Id = oi.Id,
                ProductId = oi.ProductId,
                ProductName = oi.Product?.Name ?? "Unknown",
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPrice,
                LineTotal = oi.Quantity * oi.UnitPrice
            }).ToList() ?? new List<OrderItemDto>()
        };

        return Ok(result);
    }

    // Admin: Update order status
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Administrator")]
    public IActionResult UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var order = _orderService.GetById(id);
        if (order == null) return NotFound();

        if (!Enum.TryParse<OrderStatus>(dto.Status, true, out var newStatus))
            return BadRequest("Invalid status value.");

        order.Status = newStatus;
        _orderService.Save(order);

        return Ok(new { message = "Order status updated successfully", status = order.Status.ToString() });
    }

    // Admin: Delete order
    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public IActionResult Delete(int id)
    {
        var order = _orderService.GetById(id);
        if (order == null) return NotFound();

        _orderService.Delete(order);
        return Ok(new { message = "Order deleted successfully" });
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
            DeliveryAddress = dto.DeliveryAddress ?? "",
            City = dto.City ?? "",
            Province = dto.Province ?? "",
            PostalCode = dto.PostalCode ?? "",
            PhoneNumber = dto.PhoneNumber ?? "",
            OrderItems = orderItems
        };

        _orderService.Save(order);

        return Ok(new OrderResponseDto(order.Id, order.TotalPrice, order.Status.ToString()));
    }
}
