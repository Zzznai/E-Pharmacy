using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EPharmacy.Common.Services;

public class OrderService : BaseService<Order>
{
    public OrderService(ApplicationDbContext context) : base(context)
    {
    }

    public new List<Order> GetAll()
    {
        return Items
            .Include(o => o.User)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .OrderByDescending(o => o.OrderDate)
            .ToList();
    }

    public new Order? GetById(int id)
    {
        return Items
            .Include(o => o.User)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefault(o => o.Id == id);
    }
}
