using Microsoft.EntityFrameworkCore;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class CategoryService
{
    private readonly ApplicationDbContext _db;

    public CategoryService(ApplicationDbContext db) => _db = db;

    public async Task<List<Category>> GetAllAsync() => await _db.Categories.ToListAsync();

    public async Task<Category?> GetByIdAsync(int id) => await _db.Categories.FindAsync(id);

    public async Task SaveAsync(Category category)
    {
        if (category.Id == 0)
            _db.Categories.Add(category);
        else
            _db.Categories.Update(category);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Category category)
    {
        await _db.Entry(category).Collection(c => c.Products).LoadAsync();
        await _db.Entry(category).Collection(c => c.Subcategories).LoadAsync();

        category.Products.Clear();

        foreach (var child in category.Subcategories)
            child.ParentCategoryId = null;

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
    }
}
