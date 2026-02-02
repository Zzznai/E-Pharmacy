using Microsoft.EntityFrameworkCore;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class OrderService
{
    private readonly ApplicationDbContext _db;

    public OrderService(ApplicationDbContext db) => _db = db;

    public async Task<List<Order>> GetAllAsync() =>
        await _db.Orders
            .Include(o => o.User)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

    public async Task<List<Order>> GetByUserIdAsync(int userId) =>
        await _db.Orders
            .Include(o => o.User)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

    public async Task<Order?> GetByIdAsync(int id) =>
        await _db.Orders
            .Include(o => o.User)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

    public async Task SaveAsync(Order order)
    {
        if (order.Id == 0)
            _db.Orders.Add(order);
        else
            _db.Orders.Update(order);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Order order)
    {
        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();
    }
}
