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
