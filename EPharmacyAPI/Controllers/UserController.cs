using System.Linq;
using System.Threading.Tasks;
using EPharmacy.Common.Entities;
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
        var users = await _userService.GetAllAsync();
        var result = users.Select(u => new UserResponse(u.Id, u.Username, u.FirstName, u.LastName, u.Role.ToString()));
        return Ok(result);
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        
        if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var user = await _userService.GetByIdAsync(userId);
        if (user == null) return NotFound();

        return Ok(new UserResponse(user.Id, user.Username, user.FirstName, user.LastName, user.Role.ToString()));
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null) return NotFound();

        var callerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var callerId = int.TryParse(callerIdClaim, out var cid) ? cid : -1;
        if (callerId != id && !User.IsInRole("Administrator"))
            return Forbid();

        return Ok(new UserResponse(user.Id, user.Username, user.FirstName, user.LastName, user.Role.ToString()));
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("Username and password are required.");

        var existing = (await _userService.GetAllAsync(u => u.Username == dto.Username)).FirstOrDefault();
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
        await _userService.SaveAsync(user);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new UserResponse(user.Id, user.Username, user.FirstName, user.LastName, user.Role.ToString()));
    }

    [HttpPost("create-admin")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> AddAdmin([FromBody] CreateUserDto dto)
    {
        if (!User.IsInRole("Administrator")) return Forbid();
        var existing = (await _userService.GetAllAsync(u => u.Username == dto.Username)).FirstOrDefault();
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
        await _userService.SaveAsync(user);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new UserResponse(user.Id, user.Username, user.FirstName, user.LastName, user.Role.ToString()));
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null) return NotFound();

        var callerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var callerId = int.TryParse(callerIdClaim, out var cid) ? cid : -1;
        if (callerId != id && !User.IsInRole("Administrator")) return Forbid();

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        await _userService.SaveAsync(user);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null) return NotFound();
        await _userService.DeleteAsync(user);
        return NoContent();
    }

    [HttpPost("{id}/change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto dto)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null) return NotFound();

        var callerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var callerId = int.TryParse(callerIdClaim, out var cid) ? cid : -1;
        if (callerId != id && !User.IsInRole("Administrator")) return Forbid();

        var hasher = new PasswordHasher<User>();
        var verify = hasher.VerifyHashedPassword(user, user.PasswordHash ?? string.Empty, dto.CurrentPassword);
        if (verify != PasswordVerificationResult.Success && !User.IsInRole("Administrator"))
            return Unauthorized();

        user.PasswordHash = hasher.HashPassword(user, dto.NewPassword);
        await _userService.SaveAsync(user);
        return NoContent();
    }
}