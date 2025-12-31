using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class IngredientService : BaseService<Ingredient>
{
    public IngredientService(ApplicationDbContext context) : base(context)
    {
    }
}
