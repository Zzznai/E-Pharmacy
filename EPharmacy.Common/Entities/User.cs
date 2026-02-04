using EPharmacy.Common.Enums;

namespace EPharmacy.Common.Entities;

public class User : BaseEntity
{
    public string Username { get; set; }
    public string PasswordHash { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }

    public UserRoles Role { get; set; }

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}