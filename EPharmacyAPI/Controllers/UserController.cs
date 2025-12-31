using System.Linq;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using EPharmacyAPI.Dtos;
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
    public IActionResult GetAll()
    {
        var users = _userService.GetAll();
        var result = users.Select(u => new UserResponse(u.Id, u.Username, u.FirstName, u.LastName, u.Role.ToString()));
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize]
    public IActionResult GetById(int id)
    {
        var user = _userService.GetById(id);
        if (user == null) return NotFound();

        var callerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var callerId = int.TryParse(callerIdClaim, out var cid) ? cid : -1;
        if (callerId != id && !User.IsInRole("Administrator"))
            return Forbid();

        return Ok(new UserResponse(user.Id, user.Username, user.FirstName, user.LastName, user.Role.ToString()));
    }

    [HttpPost]
    [AllowAnonymous]
    public IActionResult Create([FromBody] CreateUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("Username and password are required.");

        var existing = _userService.GetAll(u => u.Username == dto.Username).FirstOrDefault();
        if (existing != null) return Conflict("Username already taken.");

        var user = new User
        {
            Username = dto.Username,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = UserRoles.Customer
        };
        var hasher = new PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, dto.Password);
        _userService.Save(user);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new UserResponse(user.Id, user.Username, user.FirstName, user.LastName, user.Role.ToString()));
    }

    [HttpPost("create-admin")]
    [Authorize(Roles = "Administrator")]
    public IActionResult AddAdmin([FromBody] CreateUserDto dto)
    {
        if (!User.IsInRole("Administrator")) return Forbid();
        var existing = _userService.GetAll(u => u.Username == dto.Username).FirstOrDefault();
        if (existing != null) return Conflict("Username already taken.");

        var user = new User
        {
            Username = dto.Username,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = UserRoles.Administrator
        };
        var hasher = new PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, dto.Password);
        _userService.Save(user);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new UserResponse(user.Id, user.Username, user.FirstName, user.LastName, user.Role.ToString()));
    }

    [HttpPut("{id}")]
    [Authorize]
    public IActionResult Update(int id, [FromBody] UpdateUserDto dto)
    {
        var user = _userService.GetById(id);
        if (user == null) return NotFound();

        var callerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var callerId = int.TryParse(callerIdClaim, out var cid) ? cid : -1;
        if (callerId != id && !User.IsInRole("Administrator")) return Forbid();

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        _userService.Save(user);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public IActionResult Delete(int id)
    {
        var user = _userService.GetById(id);
        if (user == null) return NotFound();
        _userService.Delete(user);
        return NoContent();
    }

    [HttpPost("{id}/change-password")]
    [Authorize]
    public IActionResult ChangePassword(int id, [FromBody] ChangePasswordDto dto)
    {
        var user = _userService.GetById(id);
        if (user == null) return NotFound();

        var callerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var callerId = int.TryParse(callerIdClaim, out var cid) ? cid : -1;
        if (callerId != id && !User.IsInRole("Administrator")) return Forbid();

        var hasher = new PasswordHasher<User>();
        var verify = hasher.VerifyHashedPassword(user, user.PasswordHash ?? string.Empty, dto.CurrentPassword);
        if (verify != PasswordVerificationResult.Success && !User.IsInRole("Administrator"))
            return Unauthorized();

        user.PasswordHash = hasher.HashPassword(user, dto.NewPassword);
        _userService.Save(user);
        return NoContent();
    }
}