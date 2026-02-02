using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace EPharmacyAPI.Services;

public interface ICloudinaryService
{
    Task<string?> UploadImageAsync(IFormFile file);
    Task<bool> DeleteImageAsync(string publicId);
    string GetPublicIdFromUrl(string url);
}

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IConfiguration configuration)
    {
        var cloudName = configuration["Cloudinary:CloudName"];
        var apiKey = configuration["Cloudinary:ApiKey"];
        var apiSecret = configuration["Cloudinary:ApiSecret"];

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
    }

    public async Task<string?> UploadImageAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return null;

        var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "epharmacy/products"
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error != null)
            return null;

        return result.SecureUrl.ToString();
    }

    public async Task<bool> DeleteImageAsync(string publicId)
    {
        if (string.IsNullOrEmpty(publicId))
            return false;

        var deleteParams = new DeletionParams(publicId);
        var result = await _cloudinary.DestroyAsync(deleteParams);

        return result.Result == "ok";
    }

    public string GetPublicIdFromUrl(string url)
    {
        if (string.IsNullOrEmpty(url))
            return string.Empty;

        var uri = new Uri(url);
        var path = uri.AbsolutePath;

        var uploadIndex = path.IndexOf("/upload/");
        if (uploadIndex == -1)
            return string.Empty;

        var afterUpload = path.Substring(uploadIndex + 8);

        var slashIndex = afterUpload.IndexOf('/');
        if (slashIndex > 0)
            afterUpload = afterUpload.Substring(slashIndex + 1);

        var dotIndex = afterUpload.LastIndexOf('.');
        if (dotIndex > 0)
            afterUpload = afterUpload.Substring(0, dotIndex);

        return afterUpload;
    }
}
