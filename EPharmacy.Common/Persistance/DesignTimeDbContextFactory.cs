using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace EPharmacy.Common.Persistence;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var basePath = Directory.GetCurrentDirectory();

        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("app.json", optional: true)
            .Build();

        var conn = configuration.GetConnectionString("Default") ?? configuration["ConnectionStrings:DefaultConnection"];
        if (string.IsNullOrWhiteSpace(conn))
            throw new InvalidOperationException("Connection string 'DefaultConnection' not found in appsettings.json, app.json, or environment variables.");

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlServer(conn);

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
