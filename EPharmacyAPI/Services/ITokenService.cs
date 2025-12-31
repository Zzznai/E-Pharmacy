using EPharmacy.Common.Entities;

namespace EPharmacyAPI.Services;

public interface ITokenService
{
    string CreateToken(User user);
}
