using Microsoft.EntityFrameworkCore;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class OrderService
{
    private readonly ApplicationDbContext _db;

    public OrderService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<Order>> GetAll()
    {
        var orders = _db.Orders.Include(o => o.User).Include(o => o.OrderItems).ThenInclude(oi => oi.Product);
        return await orders.OrderByDescending(o => o.OrderDate).ToListAsync();
    }

    public async Task<List<Order>> GetByUserId(int userId)
    {
        var orders = _db.Orders.Include(o => o.User).Include(o => o.OrderItems).ThenInclude(oi => oi.Product);
        return await orders.Where(o => o.UserId == userId).OrderByDescending(o => o.OrderDate).ToListAsync();
    }

    public async Task<Order?> GetById(int id)
    {
        var orders = _db.Orders.Include(o => o.User).Include(o => o.OrderItems).ThenInclude(oi => oi.Product);
        return await orders.FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task Save(Order order)
    {
        if (order.Id == 0)
        {
            _db.Orders.Add(order);
        }
        else
        {
            _db.Orders.Update(order);
        }

        await _db.SaveChangesAsync();
    }

    public async Task Delete(Order order)
    {
        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();
    }
}
