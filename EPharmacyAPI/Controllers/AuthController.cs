using System.Linq;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using EPharmacyAPI.Dtos;
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
    public IActionResult GetToken([FromBody] UserLoginDto dto)
    {
        var users = _userService.GetAll(u => u.Username == dto.Username);
        var user = users.FirstOrDefault();
        if (user == null)
            return Unauthorized();

        // verify hashed password
        var hasher = new PasswordHasher<User>();
        var verify = hasher.VerifyHashedPassword(user, user.PasswordHash ?? string.Empty, dto.Password);
        if (verify != PasswordVerificationResult.Success)
            return Unauthorized();

        var token = _tokenService.CreateToken(user);
        return Ok(new AuthResponseDto { Token = token, ExpiresAt = DateTime.UtcNow.AddHours(1) });
    }
}
