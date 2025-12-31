using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class OrderService : BaseService<Order>
{
    public OrderService(ApplicationDbContext context) : base(context)
    {
    }
}
