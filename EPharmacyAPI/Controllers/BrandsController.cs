using System.Linq;
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
    public IActionResult GetAll()
    {
        var items = _brandService.GetAll();
        return Ok(items.Select(b => new BrandResponse(b.Id, b.Name)));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public IActionResult GetById(int id)
    {
        var brand = _brandService.GetById(id);
        if (brand == null) return NotFound();
        return Ok(new BrandResponse(brand.Id, brand.Name));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public IActionResult Post([FromBody] BrandCreateDto dto)
    {
        var brand = new Brand { Name = dto.Name };
        _brandService.Save(brand);
        return CreatedAtAction(nameof(GetById), new { id = brand.Id }, new BrandResponse(brand.Id, brand.Name));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public IActionResult Put(int id, [FromBody] BrandUpdateDto dto)
    {
        var brand = _brandService.GetById(id);
        if (brand == null) return NotFound();
        brand.Name = dto.Name;
        _brandService.Save(brand);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public IActionResult Delete(int id)
    {
        var brand = _brandService.GetById(id);
        if (brand == null) return NotFound();
        _brandService.Delete(brand);
        return NoContent();
    }
}
