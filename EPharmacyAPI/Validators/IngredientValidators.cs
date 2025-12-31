using FluentValidation;
using EPharmacyAPI.Dtos;

namespace EPharmacyAPI.Validators;

public class IngredientCreateDtoValidator : AbstractValidator<IngredientCreateDto>
{
    public IngredientCreateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ingredient name is required")
            .MaximumLength(100).WithMessage("Ingredient name cannot exceed 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
    }
}

public class IngredientUpdateDtoValidator : AbstractValidator<IngredientUpdateDto>
{
    public IngredientUpdateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ingredient name is required")
            .MaximumLength(100).WithMessage("Ingredient name cannot exceed 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
    }
}
