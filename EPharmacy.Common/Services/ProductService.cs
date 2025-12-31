using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class ProductService : BaseService<Product>
{
    public ProductService(ApplicationDbContext context) : base(context)
    {
    }

    public List<Product> GetAllWithDetails()
    {
        return Context.Products
            .Include(p => p.Brand)
            .Include(p => p.Categories)
            .Include(p => p.ProductIngredients)
                .ThenInclude(pi => pi.Ingredient)
            .ToList();
    }

    public Product? GetWithDetails(int id)
    {
        return Context.Products
            .Include(p => p.Brand)
            .Include(p => p.Categories)
            .Include(p => p.ProductIngredients)
                .ThenInclude(pi => pi.Ingredient)
            .FirstOrDefault(p => p.Id == id);
    }

    public void SaveWithDetails(Product product, IEnumerable<int> categoryIds, IEnumerable<ProductIngredient> ingredients)
    {
        if (product.Id > 0)
        {
            // For existing products, load collections to clear/update
            Context.Entry(product).Collection(p => p.Categories).Load();
            Context.Entry(product).Collection(p => p.ProductIngredients).Load();
            
            product.Categories.Clear();
            Context.ProductIngredients.RemoveRange(product.ProductIngredients);
        }

        var categoryIdsList = categoryIds.ToList();

        // If product is a prescription drug, ensure it's assigned to "Prescription drugs" category
        if (product.IsPrescriptionRequired)
        {
            var prescriptionCategory = Context.Categories.FirstOrDefault(c => c.Name == "Prescription drugs");
            if (prescriptionCategory != null && !categoryIdsList.Contains(prescriptionCategory.Id))
            {
                categoryIdsList.Add(prescriptionCategory.Id);
            }
            // Reset quantity for prescription products
            product.AvailableQuantity = 0;
        }

        var categories = Context.Categories.Where(c => categoryIdsList.Contains(c.Id)).ToList();
        foreach (var cat in categories)
            product.Categories.Add(cat);

        foreach (var pi in ingredients)
            Context.ProductIngredients.Add(pi);

        if (product.Id > 0)
            Context.Products.Update(product);
        else
            Context.Products.Add(product);

        Context.SaveChanges();
    }

    // Provide cascade delete behavior when removing a product.
    // This hides the base Delete method to perform extra cleanup of
    // related ProductIngredient entries and their Ingredients.
    public new void Delete(Product product)
    {
        if (product == null) return;

        // Find product-ingredient join rows using the shadow FK "ProductId"
        var related = Context.ProductIngredients
            .Where(pi => EF.Property<int>(pi, "ProductId") == product.Id)
            .ToList();

        foreach (var pi in related)
        {
            if (pi.IngredientId > 0)
            {
                var ingredient = Context.Ingredients.FirstOrDefault(i => i.Id == pi.IngredientId);
                if (ingredient != null)
                    Context.Ingredients.Remove(ingredient);
            }

            Context.ProductIngredients.Remove(pi);
        }

        Context.Products.Remove(product);
        Context.SaveChanges();
    }
}
