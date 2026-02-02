using System.Security.Claims;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using EPharmacyAPI.Dtos.Orders;
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

    [HttpGet("top-products")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> GetTopProducts([FromQuery] int count = 5)
    {
        var orders = await _orderService.GetAllAsync();

        var topProducts = orders
            .SelectMany(o => o.OrderItems)
            .Where(oi => oi.Product != null)
            .GroupBy(oi => new { oi.ProductId, oi.Product!.Name })
            .Select(g => new
            {
                g.Key.ProductId,
                ProductName = g.Key.Name,
                TotalQuantity = g.Sum(x => x.Quantity),
                TotalRevenue = g.Sum(x => x.Quantity * x.UnitPrice)
            })
            .OrderByDescending(x => x.TotalQuantity)
            .Take(count);

        return Ok(topProducts);
    }

    [HttpGet]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> GetAll()
    {
        var orders = await _orderService.GetAllAsync();

        return Ok(orders.OrderByDescending(o => o.OrderDate).Select(MapToListDto));
    }

    [HttpGet("my-orders")]
    [Authorize]
    public async Task<IActionResult> GetMyOrders()
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var orders = await _orderService.GetByUserIdAsync(userId.Value);

        return Ok(orders.Select(MapToListDto));
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _orderService.GetByIdAsync(id);

        if (order == null)
        {
            return NotFound();
        }

        if (!IsAdmin() && GetUserId() != order.UserId)
        {
            return Forbid();
        }

        string userName = "";
        string userUsername = "";

        if (order.User != null)
        {
            userName = order.User.FirstName + " " + order.User.LastName;
            userUsername = order.User.Username;
        }

        var items = new List<OrderItemDto>();

        foreach (var oi in order.OrderItems)
        {
            string productName = "";

            if (oi.Product != null)
            {
                productName = oi.Product.Name;
            }

            items.Add(new OrderItemDto
            {
                Id = oi.Id,
                ProductId = oi.ProductId,
                ProductName = productName,
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPrice,
                LineTotal = oi.Quantity * oi.UnitPrice
            });
        }

        return Ok(new OrderDetailDto
        {
            Id = order.Id,
            UserId = order.UserId,
            UserName = userName,
            UserUsername = userUsername,
            OrderDate = order.OrderDate,
            Status = order.Status.ToString(),
            TotalPrice = order.TotalPrice,
            DeliveryAddress = order.DeliveryAddress,
            City = order.City,
            Province = order.Province,
            PostalCode = order.PostalCode,
            PhoneNumber = order.PhoneNumber,
            Items = items
        });
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var order = await _orderService.GetByIdAsync(id);

        if (order == null)
        {
            return NotFound();
        }

        if (!Enum.TryParse<OrderStatus>(dto.Status, true, out var newStatus))
        {
            return BadRequest("Invalid status value.");
        }

        if (newStatus == OrderStatus.Cancelled && order.Status != OrderStatus.Cancelled)
        {
            foreach (var item in order.OrderItems)
            {
                if (item.Product != null)
                {
                    item.Product.AvailableQuantity += item.Quantity;
                }
            }
        }

        order.Status = newStatus;

        await _orderService.SaveAsync(order);

        return Ok(new { message = "Order status updated", status = order.Status.ToString() });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _orderService.GetByIdAsync(id);

        if (order == null)
        {
            return NotFound();
        }

        await _orderService.DeleteAsync(order);

        return NoContent();
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] OrderCreateDto dto)
    {
        if (IsAdmin())
        {
            return Forbid();
        }

        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var orderItems = new List<OrderItem>();
        decimal total = 0;

        foreach (var item in dto.Items)
        {
            var product = await _productService.GetByIdAsync(item.ProductId);

            if (product == null)
            {
                return NotFound($"Product {item.ProductId} not found.");
            }

            if (product.IsPrescriptionRequired)
            {
                return BadRequest("Prescription products cannot be ordered online.");
            }

            if (product.AvailableQuantity < item.Quantity)
            {
                return BadRequest($"Insufficient stock for {product.Name}.");
            }

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price
            });

            total += product.Price * item.Quantity;
            product.AvailableQuantity -= item.Quantity;

            await _productService.SaveAsync(product);
        }

        var order = new Order
        {
            UserId = userId.Value,
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

        await _orderService.SaveAsync(order);

        return Ok(new OrderResponseDto(order.Id, order.TotalPrice, order.Status.ToString()));
    }

    private int? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);

        if (claim == null)
        {
            return null;
        }

        if (int.TryParse(claim.Value, out var id))
        {
            return id;
        }

        return null;
    }

    private bool IsAdmin()
    {
        return User.IsInRole("Administrator");
    }

    private static OrderListDto MapToListDto(Order o)
    {
        string userName = "";
        string userUsername = "";

        if (o.User != null)
        {
            userName = o.User.FirstName + " " + o.User.LastName;
            userUsername = o.User.Username;
        }

        return new OrderListDto
        {
            Id = o.Id,
            UserId = o.UserId,
            UserName = userName,
            UserUsername = userUsername,
            OrderDate = o.OrderDate,
            Status = o.Status.ToString(),
            TotalPrice = o.TotalPrice,
            ItemCount = o.OrderItems.Count,
            City = o.City,
            Province = o.Province
        };
    }
}
