const multer = require("multer");
const path = require("path");
const { uploadBuffer, uploadBase64, deleteAsset, getPublicIdFromUrl } = require("../config/cloudinary");

// Cloudinary base folder for all branch uploads
const CLOUDINARY_BASE_FOLDER = "visionlab/branches";

/**
 * Build Cloudinary folder path for a branch
 * @param {string} branchId - Branch UUID
 * @param {string} subFolder - Subfolder (e.g., 'settings', 'doctors/123', 'collection-tracking')
 * @returns {string} Full Cloudinary folder path
 */
const buildCloudinaryFolder = (branchId, subFolder = "") => {
  let folder = `${CLOUDINARY_BASE_FOLDER}/${branchId}`;
  if (subFolder) {
    folder = `${folder}/${subFolder}`;
  }
  return folder;
};

/**
 * Memory storage engine - files are stored in buffer for Cloudinary upload
 */
const memoryStorage = multer.memoryStorage();

/**
 * File filter for image uploads
 */
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedMimeTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed"), false);
  }
};

/**
 * Create Multer instance with memory storage
 * @param {number} maxFileSize - Max file size in bytes (default 5MB)
 */
const createMulterUpload = (subFolder, maxFileSize = 5 * 1024 * 1024) => {
  return multer({
    storage: memoryStorage,
    limits: {
      fileSize: maxFileSize,
    },
    fileFilter: imageFileFilter,
  });
};

/**
 * Upload a multer file (from memory) to Cloudinary
 * @param {object} file - Multer file object (with buffer)
 * @param {string} branchId - Branch UUID
 * @param {string} subFolder - Subfolder path
 * @returns {Promise<string>} Cloudinary secure URL
 */
const uploadFileToCloudinary = async (file, branchId, subFolder = "settings") => {
  if (!file || !file.buffer) {
    throw new Error("No file buffer available for upload");
  }

  const folder = buildCloudinaryFolder(branchId, subFolder);
  const fieldname = file.fieldname || "file";
  const timestamp = Date.now();
  const publicId = `${fieldname}_${timestamp}`;

  const result = await uploadBuffer(file.buffer, folder, publicId);
  return result.secure_url;
};

/**
 * Upload a base64 image to Cloudinary under a branch folder
 * @param {string} base64String - Full data URI
 * @param {string} prefix - Filename prefix
 * @param {string} branchId - Branch UUID
 * @param {string} subFolder - Subfolder path (default: 'settings')
 * @returns {Promise<string>} Cloudinary secure URL
 */
const uploadBase64ToCloudinary = async (base64String, prefix, branchId, subFolder = "settings") => {
  const folder = buildCloudinaryFolder(branchId, subFolder);
  return uploadBase64(base64String, folder, prefix);
};

/**
 * Delete a file from Cloudinary by its URL
 * @param {string} url - Cloudinary URL
 * @returns {Promise<object|null>} Deletion result
 */
const deleteFileFromCloudinary = async (url) => {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return null;
  return deleteAsset(publicId);
};

// Pre-configured upload middleware (same interface as before, routes unchanged)

// Letterhead upload (single file)
const letterheadUpload = createMulterUpload("settings").single("letterhead");

// Owner signature upload (single file)
const ownerSignatureUpload = createMulterUpload("settings").single("owner_signature");

// Doctor signature upload (single file) - requires doctorId in params
const doctorSignatureUpload = (req, res, next) => {
  const doctorId = req.params.doctorId || req.body.doctorId;

  if (!doctorId) {
    return res.status(400).json({ error: "Doctor ID is required" });
  }

  const upload = createMulterUpload(`doctors/${doctorId}`).single("signature");
  upload(req, res, next);
};

// Combined settings upload (multiple fields)
const settingsUpload = createMulterUpload("settings").fields([
  { name: "letterhead", maxCount: 1 },
  { name: "owner_signature", maxCount: 1 },
  { name: "header", maxCount: 1 },
  { name: "footer", maxCount: 1 },
]);

module.exports = {
  createMulterUpload,
  letterheadUpload,
  ownerSignatureUpload,
  doctorSignatureUpload,
  settingsUpload,
  uploadFileToCloudinary,
  uploadBase64ToCloudinary,
  deleteFileFromCloudinary,
  buildCloudinaryFolder,
  CLOUDINARY_BASE_FOLDER,
};