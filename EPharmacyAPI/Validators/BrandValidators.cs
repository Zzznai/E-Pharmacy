using FluentValidation;
using EPharmacyAPI.Dtos.Brands;

namespace EPharmacyAPI.Validators;

public class BrandCreateDtoValidator : AbstractValidator<BrandCreateDto>
{
    public BrandCreateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Brand name is required")
            .MaximumLength(100).WithMessage("Brand name cannot exceed 100 characters");
    }
}

public class BrandUpdateDtoValidator : AbstractValidator<BrandUpdateDto>
{
    public BrandUpdateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Brand name is required")
            .MaximumLength(100).WithMessage("Brand name cannot exceed 100 characters");
    }
}
