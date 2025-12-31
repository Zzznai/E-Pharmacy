namespace EPharmacyAPI.Dtos;

public record BrandResponse(int Id, string Name);

public class BrandCreateDto
{
    public string Name { get; set; } = string.Empty;
}

public class BrandUpdateDto
{
    public string Name { get; set; } = string.Empty;
}
