using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class ProductService : BaseService<Product>
{
    public ProductService(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Product>> GetAllWithDetailsAsync()
    {
        return await Context.Products
            .Include(p => p.Brand)
            .Include(p => p.Categories)
            .Include(p => p.ProductIngredients)
                .ThenInclude(pi => pi.Ingredient)
            .ToListAsync();
    }

    public async Task<Product?> GetWithDetailsAsync(int id)
    {
        return await Context.Products
            .Include(p => p.Brand)
            .Include(p => p.Categories)
            .Include(p => p.ProductIngredients)
                .ThenInclude(pi => pi.Ingredient)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task SaveWithDetailsAsync(Product product, IEnumerable<int> categoryIds, IEnumerable<ProductIngredient> ingredients)
    {
        if (product.Id > 0)
        {
            // For existing products, load collections to clear/update
            await Context.Entry(product).Collection(p => p.Categories).LoadAsync();
            await Context.Entry(product).Collection(p => p.ProductIngredients).LoadAsync();
            
            product.Categories.Clear();
            Context.ProductIngredients.RemoveRange(product.ProductIngredients);
            product.ProductIngredients.Clear();
        }

        var categoryIdsList = categoryIds.ToList();

        // If product is a prescription drug, ensure it's assigned to "Prescription drugs" category
        if (product.IsPrescriptionRequired)
        {
            var prescriptionCategory = await Context.Categories.FirstOrDefaultAsync(c => c.Name == "Prescription drugs");
            if (prescriptionCategory != null && !categoryIdsList.Contains(prescriptionCategory.Id))
            {
                categoryIdsList.Add(prescriptionCategory.Id);
            }
            // Reset quantity for prescription products
            product.AvailableQuantity = 0;
        }

        var categories = await Context.Categories.Where(c => categoryIdsList.Contains(c.Id)).ToListAsync();
        foreach (var cat in categories)
            product.Categories.Add(cat);

        // Add ingredients to the product's collection (EF will handle the FK)
        var ingredientsList = ingredients.ToList();
        foreach (var pi in ingredientsList)
        {
            product.ProductIngredients.Add(pi);
        }

        if (product.Id > 0)
            Context.Products.Update(product);
        else
            Context.Products.Add(product);

        await Context.SaveChangesAsync();
    }

    // Provide cascade delete behavior when removing a product.
    // This hides the base Delete method to perform extra cleanup of
    // related ProductIngredient entries and their Ingredients.
    public new async Task DeleteAsync(Product product)
    {
        if (product == null) return;

        // Find product-ingredient join rows using the shadow FK "ProductId"
        var related = await Context.ProductIngredients
            .Where(pi => EF.Property<int>(pi, "ProductId") == product.Id)
            .ToListAsync();

        foreach (var pi in related)
        {
            if (pi.IngredientId > 0)
            {
                var ingredient = await Context.Ingredients.FirstOrDefaultAsync(i => i.Id == pi.IngredientId);
                if (ingredient != null)
                    Context.Ingredients.Remove(ingredient);
            }

            Context.ProductIngredients.Remove(pi);
        }

        Context.Products.Remove(product);
        await Context.SaveChangesAsync();
    }
}
