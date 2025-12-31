using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EPharmacy.Common.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace EPharmacyAPI.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string CreateToken(User user)
    {
        var jwt = _config.GetSection("Jwt");
        var key = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured");
        var issuer = jwt["Issuer"] ?? "epharmacy";
        var audience = jwt["Audience"] ?? "epharmacy_clients";
        var expiresMinutes = int.TryParse(jwt["ExpiresMinutes"], out var m) ? m : 60;

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim("firstName", user.FirstName ?? string.Empty),
            new Claim("lastName", user.LastName ?? string.Empty),
            new Claim("role", user.Role.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var signingKey = new SymmetricSecurityKey(keyBytes);
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
