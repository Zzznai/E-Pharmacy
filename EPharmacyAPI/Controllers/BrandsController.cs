using System.Linq;
using System.Threading.Tasks;
using EPharmacy.Common.Entities;
using EPharmacy.Common.Services;
using EPharmacyAPI.Dtos.Brands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EPharmacyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly BrandService _brandService;

    public BrandsController(BrandService brandService)
    {
        _brandService = brandService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var items = await _brandService.GetAllAsync();
        return Ok(items.Select(b => new BrandResponse(b.Id, b.Name)));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var brand = await _brandService.GetByIdAsync(id);
        if (brand == null) return NotFound();
        return Ok(new BrandResponse(brand.Id, brand.Name));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Post([FromBody] BrandCreateDto dto)
    {
        var brand = new Brand { Name = dto.Name };
        await _brandService.SaveAsync(brand);
        return CreatedAtAction(nameof(GetById), new { id = brand.Id }, new BrandResponse(brand.Id, brand.Name));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Put(int id, [FromBody] BrandUpdateDto dto)
    {
        var brand = await _brandService.GetByIdAsync(id);
        if (brand == null) return NotFound();
        brand.Name = dto.Name;
        await _brandService.SaveAsync(brand);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var brand = await _brandService.GetByIdAsync(id);
        if (brand == null) return NotFound();
        await _brandService.DeleteAsync(brand);
        return NoContent();
    }
}
