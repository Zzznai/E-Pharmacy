using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class ProductIngredientService : BaseService<ProductIngredient>
{
    public ProductIngredientService(ApplicationDbContext context) : base(context)
    {
    }
}
