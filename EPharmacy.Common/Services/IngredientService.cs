using Microsoft.EntityFrameworkCore;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class IngredientService
{
    private readonly ApplicationDbContext _db;

    public IngredientService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<Ingredient>> GetAll()
    {
        return await _db.Ingredients.ToListAsync();
    }

    public async Task<Ingredient?> GetById(int id)
    {
        return await _db.Ingredients.FindAsync(id);
    }

    public async Task Save(Ingredient ingredient)
    {
        if (ingredient.Id == 0)
        {
            _db.Ingredients.Add(ingredient);
        }
        else
        {
            _db.Ingredients.Update(ingredient);
        }

        await _db.SaveChangesAsync();
    }

    public async Task Delete(Ingredient ingredient)
    {
        _db.Ingredients.Remove(ingredient);
        await _db.SaveChangesAsync();
    }
}
