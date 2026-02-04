using EPharmacy.Common.Enums;

namespace EPharmacy.Common.Entities;

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    public UserRoles Role { get; set; }

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}