using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class OrderItemService : BaseService<OrderItem>
{
    public OrderItemService(ApplicationDbContext context) : base(context)
    {
    }
}
