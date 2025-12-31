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

        if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
        {
            throw new ArgumentException("Cloudinary configuration is missing. Please check appsettings.json");
        }

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
        _cloudinary.Api.Secure = true;
    }

    public async Task<string?> UploadImageAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return null;
        }

        // Validate file type
        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
        {
            return null;
        }

        // Max file size: 10MB
        if (file.Length > 10 * 1024 * 1024)
        {
            return null;
        }

        await using var stream = file.OpenReadStream();
        
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "epharmacy/products",
            Transformation = new Transformation()
                .Width(800)
                .Height(800)
                .Crop("limit")
                .Quality("auto")
                .FetchFormat("auto")
        };

        var result = await _cloudinary.UploadAsync(uploadParams);
        
        if (result.Error != null)
            return null;
            
        return result.SecureUrl?.ToString();
    }

    public async Task<bool> DeleteImageAsync(string publicId)
    {
        if (string.IsNullOrEmpty(publicId))
        {
            return false;
        }

        var deleteParams = new DeletionParams(publicId);
        var result = await _cloudinary.DestroyAsync(deleteParams);
        return result.Result == "ok";
    }

    public string GetPublicIdFromUrl(string url)
    {
        if (string.IsNullOrEmpty(url))
            return string.Empty;

        try
        {
            // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
            var uri = new Uri(url);
            var path = uri.AbsolutePath;
            
            // Find the upload/ part and get everything after it
            var uploadIndex = path.IndexOf("/upload/");
            if (uploadIndex == -1) return string.Empty;
            
            var afterUpload = path.Substring(uploadIndex + 8); // 8 = length of "/upload/"
            
            // Remove version if present (starts with v followed by digits)
            if (afterUpload.StartsWith("v") && afterUpload.Length > 1)
            {
                var slashIndex = afterUpload.IndexOf('/');
                if (slashIndex > 0)
                {
                    afterUpload = afterUpload.Substring(slashIndex + 1);
                }
            }
            
            // Remove file extension
            var lastDotIndex = afterUpload.LastIndexOf('.');
            if (lastDotIndex > 0)
            {
                afterUpload = afterUpload.Substring(0, lastDotIndex);
            }
            
            return afterUpload;
        }
        catch
        {
            return string.Empty;
        }
    }
}
