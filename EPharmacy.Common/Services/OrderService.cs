using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EPharmacy.Common.Services;

public class OrderService : BaseService<Order>
{
    public OrderService(ApplicationDbContext context) : base(context)
    {
    }

    public new async Task<List<Order>> GetAllAsync(Expression<System.Func<Order, bool>>? filter = null, string? orderBy = null, bool sortAsc = false, int page = 1, int pageSize = int.MaxValue)
    {
        var query = Items
            .Include(o => o.User)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .AsQueryable();

        if (filter != null)
            query = query.Where(filter);

        return await query.OrderByDescending(o => o.OrderDate).ToListAsync();
    }

    public new async Task<Order?> GetByIdAsync(int id)
    {
        return await Items
            .Include(o => o.User)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id);
    }
}
