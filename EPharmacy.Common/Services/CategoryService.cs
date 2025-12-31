using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class CategoryService : BaseService<Category>
{
    public CategoryService(ApplicationDbContext context) : base(context)
    {
    }
}
