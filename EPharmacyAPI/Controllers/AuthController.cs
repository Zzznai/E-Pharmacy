using System.Threading.Tasks;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using EPharmacyAPI.Dtos.Auth;
using EPharmacyAPI.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EPharmacyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserService _userService;
    private readonly ITokenService _tokenService;

    public AuthController(UserService userService, ITokenService tokenService)
    {
        _userService = userService;
        _tokenService = tokenService;
    }

    [HttpPost("token")]
    public async Task<IActionResult> GetToken([FromBody] UserLoginDto dto)
    {
        var user = await _userService.GetByUsername(dto.Username);

        if (user == null)
        {
            return Unauthorized();
        }

        var hasher = new PasswordHasher<User>();

        string passwordHash = string.Empty;
        if (user.PasswordHash != null)
        {
            passwordHash = user.PasswordHash;
        }

        var verify = hasher.VerifyHashedPassword(user, passwordHash, dto.Password);

        if (verify != PasswordVerificationResult.Success)
        {
            return Unauthorized();
        }

        var token = _tokenService.CreateToken(user);

        return Ok(new AuthResponseDto
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            Role = user.Role.ToString(),
            UserId = user.Id
        });
    }
}
