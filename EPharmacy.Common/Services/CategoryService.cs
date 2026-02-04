using Microsoft.EntityFrameworkCore;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class CategoryService
{
    private readonly ApplicationDbContext _db;

    public CategoryService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<Category>> GetAll()
    {
        return await _db.Categories.ToListAsync();
    }

    public async Task<Category?> GetById(int id)
    {
        return await _db.Categories.FindAsync(id);
    }

    public async Task Save(Category category)
    {
        if (category.Id == 0)
        {
            _db.Categories.Add(category);
        }
        else
        {
            _db.Categories.Update(category);
        }

        await _db.SaveChangesAsync();
    }

    public async Task Delete(Category category)
    {
        await _db.Entry(category).Collection(c => c.Products).LoadAsync();

        category.Products.Clear();

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
    }
}
