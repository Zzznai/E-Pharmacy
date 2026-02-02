using Microsoft.EntityFrameworkCore;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class ProductService
{
    private readonly ApplicationDbContext _db;

    public ProductService(ApplicationDbContext db) => _db = db;

    public async Task<List<Product>> GetAllAsync() =>
        await _db.Products
            .Include(p => p.Brand)
            .Include(p => p.Categories)
            .Include(p => p.ProductIngredients).ThenInclude(pi => pi.Ingredient)
            .ToListAsync();

    public async Task<Product?> GetByIdAsync(int id) =>
        await _db.Products
            .Include(p => p.Brand)
            .Include(p => p.Categories)
            .Include(p => p.ProductIngredients).ThenInclude(pi => pi.Ingredient)
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task SaveAsync(Product product, IEnumerable<int>? categoryIds = null, IEnumerable<ProductIngredient>? ingredients = null)
    {
        if (product.Id > 0)
        {
            await _db.Entry(product).Collection(p => p.Categories).LoadAsync();
            await _db.Entry(product).Collection(p => p.ProductIngredients).LoadAsync();
            product.Categories.Clear();
            _db.ProductIngredients.RemoveRange(product.ProductIngredients);
        }

        if (categoryIds != null)
        {
            var ids = categoryIds.ToList();
            
            if (product.IsPrescriptionRequired)
            {
                var rxCat = await _db.Categories.FirstOrDefaultAsync(c => c.Name == "Prescription drugs");
                if (rxCat != null && !ids.Contains(rxCat.Id))
                    ids.Add(rxCat.Id);
                product.AvailableQuantity = 0;
            }

            var categories = await _db.Categories.Where(c => ids.Contains(c.Id)).ToListAsync();
            foreach (var cat in categories)
                product.Categories.Add(cat);
        }

        if (ingredients != null)
        {
            foreach (var pi in ingredients)
                product.ProductIngredients.Add(pi);
        }

        if (product.Id == 0)
            _db.Products.Add(product);
        else
            _db.Products.Update(product);

        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Product product)
    {
        var related = await _db.ProductIngredients
            .Where(pi => EF.Property<int>(pi, "ProductId") == product.Id)
            .ToListAsync();

        foreach (var pi in related)
        {
            if (pi.IngredientId > 0)
            {
                var ingredient = await _db.Ingredients.FindAsync(pi.IngredientId);
                if (ingredient != null)
                    _db.Ingredients.Remove(ingredient);
            }
            _db.ProductIngredients.Remove(pi);
        }

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
    }
}
