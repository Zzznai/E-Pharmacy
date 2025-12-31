using Microsoft.EntityFrameworkCore;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class CategoryService : BaseService<Category>
{
    public CategoryService(ApplicationDbContext context) : base(context)
    {
    }

    // Ensure deleting a category detaches related products instead of deleting them.
    public new void Delete(Category category)
    {
        if (category == null) return;

        // Load related products and clear the many-to-many link entries.
        Context.Entry(category).Collection(c => c.Products).Load();
        category.Products.Clear();

        Context.Categories.Remove(category);
        Context.SaveChanges();
    }
}
