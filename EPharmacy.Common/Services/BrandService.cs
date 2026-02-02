using Microsoft.EntityFrameworkCore;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class BrandService
{
    private readonly ApplicationDbContext _db;

    public BrandService(ApplicationDbContext db) => _db = db;

    public async Task<List<Brand>> GetAllAsync() => await _db.Brands.ToListAsync();

    public async Task<Brand?> GetByIdAsync(int id) => await _db.Brands.FindAsync(id);

    public async Task SaveAsync(Brand brand)
    {
        if (brand.Id == 0)
            _db.Brands.Add(brand);
        else
            _db.Brands.Update(brand);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Brand brand)
    {
        _db.Brands.Remove(brand);
        await _db.SaveChangesAsync();
    }
}
