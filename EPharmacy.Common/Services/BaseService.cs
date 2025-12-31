using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
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

    public List<T> GetAll(Expression<Func<T, bool>>? filter = null, string? orderBy = null, bool sortAsc = false, int page = 1, int pageSize = int.MaxValue)
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

        return query.ToList();
    }

    public int Count(Expression<Func<T, bool>>? filter = null)
    {
        var query = Items.AsQueryable();
        if (filter != null)
            query = query.Where(filter);

        return query.Count();
    }

    public T? GetById(int id)
    {
        return Items.FirstOrDefault(u => u.Id == id);
    }

    public void Save(T item)
    {
        if (item.Id > 0)
            Items.Update(item);
        else
            Items.Add(item);

        Context.SaveChanges();
    }

    public void Delete(T item)
    {
        Items.Remove(item);
        Context.SaveChanges();
    }
}
