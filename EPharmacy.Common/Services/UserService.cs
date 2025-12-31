using EPharmacy.Common.Entities;
using EPharmacy.Common.Persistence;

namespace EPharmacy.Common.Services;

public class UserService : BaseService<User>
{
    public UserService(ApplicationDbContext context) : base(context)
    {
    }
}
