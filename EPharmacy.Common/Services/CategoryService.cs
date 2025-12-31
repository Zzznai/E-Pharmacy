using Microsoft.EntityFrameworkCore;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class CategoryService : BaseService<Category>
{
    public CategoryService(ApplicationDbContext context) : base(context)
    {
    }

    // Ensure deleting a category detaches related products and re-parents children.
    public new void Delete(Category category)
    {
        if (category == null) return;

        Context.Entry(category).Collection(c => c.Products).Load();
        Context.Entry(category).Collection(c => c.Subcategories).Load();

        // Detach products
        category.Products.Clear();

        // Re-parent children to null (orphan)
        foreach (var child in category.Subcategories)
        {
            child.ParentCategoryId = null;
            Context.Categories.Update(child);
        }

        Context.Categories.Remove(category);
        Context.SaveChanges();
    }
}
