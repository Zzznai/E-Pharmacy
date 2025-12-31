using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class BrandService : BaseService<Brand>
{
    public BrandService(ApplicationDbContext context) : base(context)
    {
    }
}
