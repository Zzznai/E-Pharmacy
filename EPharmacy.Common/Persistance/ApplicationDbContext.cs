using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using EPharmacy.Common.Entities;

namespace EPharmacy.Common.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Brand> Brands { get; set; } = null!;
    public DbSet<Ingredient> Ingredients { get; set; } = null!;
    public DbSet<ProductIngredient> ProductIngredients { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>()
            .HasMany(p => p.Categories)
            .WithMany(c => c.Products);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Brand)
            .WithMany(b => b.Products)
            .HasForeignKey(p => p.BrandId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Category>()
            .HasOne(c => c.ParentCategory)
            .WithMany(c => c.Subcategories)
            .HasForeignKey(c => c.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProductIngredient>()
            .HasOne(pi => pi.Product)
            .WithMany(p => p.ProductIngredients)
            .HasForeignKey("ProductId");

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Product)
            .WithMany(p => p.OrderItems)
            .HasForeignKey("ProductId");

        modelBuilder.Entity<OrderItem>()
            .HasOne<Order>()
            .WithMany(o => o.OrderItems)
            .HasForeignKey("OrderId");
    }
}

public static class PersistenceServiceExtensions
{
    /// <summary>
    /// Registers <see cref="ApplicationDbContext"/> using the provided <see cref="IConfiguration"/>
    /// or falls back to `app.json` located in the library folder.
    /// </summary>
    public static IServiceCollection AddCommonPersistence(this IServiceCollection services, IConfiguration? configuration = null)
    {
        IConfiguration config = configuration ?? new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("app.json", optional: true, reloadOnChange: false)
            .Build();

        var conn = config.GetConnectionString("DefaultConnection") ?? config["ConnectionStrings:DefaultConnection"];

        if (string.IsNullOrWhiteSpace(conn))
            throw new InvalidOperationException("Connection string 'DefaultConnection' not found in configuration or app.json.");

        services.AddDbContext<ApplicationDbContext>(opts => opts.UseSqlServer(conn));
        return services;
    }
}
