using System.Threading.Tasks;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Enums;
using EPharmacy.Common.Services;
using EPharmacyAPI.Dtos.Users;
using EPharmacyAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EPharmacyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly UserService _userService;
    private readonly ITokenService _tokenService;

    public record UserResponse(int Id, string Username, string FirstName, string LastName, string Role);

    public UserController(UserService userService, ITokenService tokenService)
    {
        _userService = userService;
        _tokenService = tokenService;
    }

    [HttpGet]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userService.GetAll();
        var result = users.Select(u => new UserResponse(u.Id, u.Username, u.FirstName, u.LastName, u.Role.ToString()));
        return Ok(result);
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var user = await _userService.GetById(userId.Value);

        if (user == null)
        {
            return NotFound();
        }

        return Ok(new UserResponse(
            user.Id,
            user.Username,
            user.FirstName,
            user.LastName,
            user.Role.ToString()
        ));
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _userService.GetById(id);

        if (user == null)
        {
            return NotFound();
        }

        var callerId = GetCurrentUserId();

        if (callerId != id && !User.IsInRole("Administrator"))
        {
            return Forbid();
        }

        return Ok(new UserResponse(
            user.Id,
            user.Username,
            user.FirstName,
            user.LastName,
            user.Role.ToString()
        ));
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        var existing = await _userService.GetByUsername(dto.Username);

        if (existing != null)
        {
            return Conflict("Username already taken.");
        }

        var user = new User
        {
            Username = dto.Username,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = UserRoles.Customer
        };

        var hasher = new PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, dto.Password);

        await _userService.Save(user);

        return CreatedAtAction(
            nameof(GetById),
            new { id = user.Id },
            new UserResponse(user.Id, user.Username, user.FirstName, user.LastName, user.Role.ToString())
        );
    }

    [HttpPost("create-admin")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> AddAdmin([FromBody] CreateUserDto dto)
    {
        if (!User.IsInRole("Administrator"))
        {
            return Forbid();
        }

        var existing = await _userService.GetByUsername(dto.Username);

        if (existing != null)
        {
            return Conflict("Username already taken.");
        }

        var user = new User
        {
            Username = dto.Username,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = UserRoles.Administrator
        };

        var hasher = new PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, dto.Password);

        await _userService.Save(user);

        return CreatedAtAction(
            nameof(GetById),
            new { id = user.Id },
            new UserResponse(user.Id, user.Username, user.FirstName, user.LastName, user.Role.ToString())
        );
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        var user = await _userService.GetById(id);

        if (user == null)
        {
            return NotFound();
        }

        var callerId = GetCurrentUserId();

        if (callerId != id && !User.IsInRole("Administrator"))
        {
            return Forbid();
        }

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;

        await _userService.Save(user);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _userService.GetById(id);

        if (user == null)
        {
            return NotFound();
        }

        await _userService.Delete(user);

        return NoContent();
    }

    [HttpPost("{id}/change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto dto)
    {
        var user = await _userService.GetById(id);

        if (user == null)
        {
            return NotFound();
        }

        var callerId = GetCurrentUserId();

        if (callerId != id && !User.IsInRole("Administrator"))
        {
            return Forbid();
        }

        var hasher = new PasswordHasher<User>();

        string passwordHash = string.Empty;
        if (user.PasswordHash != null)
        {
            passwordHash = user.PasswordHash;
        }

        var verify = hasher.VerifyHashedPassword(user, passwordHash, dto.CurrentPassword);

        if (verify != PasswordVerificationResult.Success && !User.IsInRole("Administrator"))
        {
            return Unauthorized();
        }

        user.PasswordHash = hasher.HashPassword(user, dto.NewPassword);

        await _userService.Save(user);

        return NoContent();
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

        if (claim == null)
        {
            claim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        }

        if (claim == null)
        {
            return null;
        }

        if (int.TryParse(claim.Value, out var id))
        {
            return id;
        }

        return null;
    }
}