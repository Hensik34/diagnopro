const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder path (e.g., 'visionlab/branches/{branchId}/settings')
 * @param {string} publicId - Public ID for the file (without extension)
 * @returns {Promise<object>} Cloudinary upload result
 */
async function uploadBuffer(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload a base64 image string to Cloudinary
 * @param {string} base64String - Full data URI (e.g., 'data:image/png;base64,...')
 * @param {string} folder - Cloudinary folder path
 * @param {string} prefix - Filename prefix (e.g., 'letterhead', 'start')
 * @returns {Promise<string>} Cloudinary secure URL
 */
async function uploadBase64(base64String, folder, prefix) {
  if (!base64String || !base64String.startsWith("data:image/")) {
    return null;
  }

  const publicId = `${prefix}_${Date.now()}`;

  const result = await cloudinary.uploader.upload(base64String, {
    folder,
    public_id: publicId,
    resource_type: "image",
    overwrite: true,
  });

  return result.secure_url;
}

/**
 * Delete an asset from Cloudinary by its public ID
 * @param {string} publicId - The public ID of the asset
 * @returns {Promise<object>} Cloudinary deletion result
 */
async function deleteAsset(publicId) {
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
    return null;
  }
}

/**
 * Extract public ID from a Cloudinary URL
 * @param {string} url - Cloudinary secure URL
 * @returns {string|null} Public ID or null
 */
function getPublicIdFromUrl(url) {
  if (!url || !url.includes("cloudinary")) return null;

  try {
    // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{public_id}.{ext}
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    const pathAfterUpload = parts[1];
    // Remove version prefix (v1234567890/) if present
    const withoutVersion = pathAfterUpload.replace(/^v\d+\//, "");
    // Remove file extension
    const publicId = withoutVersion.replace(/\.[^/.]+$/, "");
    return publicId;
  } catch (error) {
    return null;
  }
}

module.exports = {
  cloudinary,
  uploadBuffer,
  uploadBase64,
  deleteAsset,
  getPublicIdFromUrl,
};
