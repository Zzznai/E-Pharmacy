using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;
using EPharmacy.Common.Services;
using EPharmacyAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger + JWT Bearer
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "E-Pharmacy API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste your JWT token (no need to add 'Bearer' prefix – UI adds it)."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// register persistence (ApplicationDbContext) from common project
builder.Services.AddCommonPersistence(builder.Configuration);

// register services
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<ITokenService, TokenService>();

// configure JWT
var jwt = builder.Configuration.GetSection("Jwt");
var keyValue = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key not configured");
var issuer = jwt["Issuer"] ?? "epharmacy";
var audience = jwt["Audience"] ?? "epharmacy_clients";

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyValue));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = signingKey
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Swagger (choose one style; this is the typical one)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed initial admin user (must be BEFORE app.Run())
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var db = services.GetRequiredService<ApplicationDbContext>();

    if (!db.Users.Any(u => u.Username == "admin"))
    {
        var admin = new User
        {
            Username = "admin",
            FirstName = "Admin",
            LastName = "User",
            Role = UserRoles.Administrator
        };

        var hasher = new PasswordHasher<User>();
        admin.PasswordHash = hasher.HashPassword(admin, "admin");

        db.Users.Add(admin);
        db.SaveChanges();
    }
}

app.Run();
