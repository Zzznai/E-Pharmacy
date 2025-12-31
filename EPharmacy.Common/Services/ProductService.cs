using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class ProductService : BaseService<Product>
{
    public ProductService(ApplicationDbContext context) : base(context)
    {
    }
}
