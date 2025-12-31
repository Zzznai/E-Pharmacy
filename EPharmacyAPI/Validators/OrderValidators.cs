using FluentValidation;
using EPharmacyAPI.Dtos;
using EPharmacy.Common.Entities;

namespace EPharmacyAPI.Validators;

public class OrderCreateDtoValidator : AbstractValidator<OrderCreateDto>
{
    public OrderCreateDtoValidator()
    {
        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Order must contain at least one item");

        RuleForEach(x => x.Items).SetValidator(new OrderItemCreateDtoValidator());

        RuleFor(x => x.DeliveryAddress)
            .NotEmpty().WithMessage("Delivery address is required")
            .MaximumLength(200).WithMessage("Delivery address cannot exceed 200 characters");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required")
            .MaximumLength(100).WithMessage("City cannot exceed 100 characters");

        RuleFor(x => x.Province)
            .NotEmpty().WithMessage("Province is required")
            .MaximumLength(100).WithMessage("Province cannot exceed 100 characters");

        RuleFor(x => x.PostalCode)
            .NotEmpty().WithMessage("Postal code is required")
            .MaximumLength(20).WithMessage("Postal code cannot exceed 20 characters");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Phone number is required")
            .MaximumLength(20).WithMessage("Phone number cannot exceed 20 characters");
    }
}

public class OrderItemCreateDtoValidator : AbstractValidator<OrderItemCreateDto>
{
    public OrderItemCreateDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage("Please select a valid product");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be at least 1");
    }
}

public class UpdateOrderStatusDtoValidator : AbstractValidator<UpdateOrderStatusDto>
{
    public UpdateOrderStatusDtoValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required")
            .Must(BeValidStatus).WithMessage("Invalid order status. Valid statuses are: Pending, Processing, Shipped, Delivered, Cancelled");
    }

    private bool BeValidStatus(string status)
    {
        return Enum.TryParse<OrderStatus>(status, true, out _);
    }
}
