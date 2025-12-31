using FluentValidation;
using EPharmacyAPI.Dtos.Products;

namespace EPharmacyAPI.Validators;

public class ProductCreateFormDtoValidator : AbstractValidator<ProductCreateFormDto>
{
    public ProductCreateFormDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required")
            .MaximumLength(200).WithMessage("Product name cannot exceed 200 characters");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0");

        RuleFor(x => x.AvailableQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Available quantity cannot be negative");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters");
    }
}

public class ProductUpdateFormDtoValidator : AbstractValidator<ProductUpdateFormDto>
{
    public ProductUpdateFormDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required")
            .MaximumLength(200).WithMessage("Product name cannot exceed 200 characters");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0");

        RuleFor(x => x.AvailableQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Available quantity cannot be negative");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters");
    }
}

public class IngredientLineDtoValidator : AbstractValidator<IngredientLineDto>
{
    public IngredientLineDtoValidator()
    {
        RuleFor(x => x.IngredientId)
            .GreaterThan(0).WithMessage("Please select a valid ingredient");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than 0");

        RuleFor(x => x.Unit)
            .NotEmpty().WithMessage("Unit is required")
            .MaximumLength(50).WithMessage("Unit cannot exceed 50 characters");
    }
}
