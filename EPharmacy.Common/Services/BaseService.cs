using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class BaseService<T>
    where T : BaseEntity
{
    protected ApplicationDbContext Context { get; }
    protected DbSet<T> Items { get; }

    public BaseService(ApplicationDbContext context)
    {
        Context = context ?? throw new ArgumentNullException(nameof(context));
        Items = Context.Set<T>();
    }

    public async Task<List<T>> GetAllAsync(Expression<Func<T, bool>>? filter = null, string? orderBy = null, bool sortAsc = false, int page = 1, int pageSize = int.MaxValue)
    {
        var query = Items.AsQueryable();
        if (filter != null)
            query = query.Where(filter);

        if (!string.IsNullOrEmpty(orderBy))
        {
            if (sortAsc)
                query = query.OrderBy(e => EF.Property<object>(e, orderBy));
            else
                query = query.OrderByDescending(e => EF.Property<object>(e, orderBy));
        }

        query = query
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

        return await query.ToListAsync();
    }

    public async Task<int> CountAsync(Expression<Func<T, bool>>? filter = null)
    {
        var query = Items.AsQueryable();
        if (filter != null)
            query = query.Where(filter);

        return await query.CountAsync();
    }

    public async Task<T?> GetByIdAsync(int id)
    {
        return await Items.FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task SaveAsync(T item)
    {
        if (item.Id > 0)
            Items.Update(item);
        else
            Items.Add(item);

        await Context.SaveChangesAsync();
    }

    public async Task DeleteAsync(T item)
    {
        Items.Remove(item);
        await Context.SaveChangesAsync();
    }
}
