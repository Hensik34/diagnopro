const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Base upload directory
const UPLOAD_BASE = path.join(__dirname, "..", "uploads", "branches");

/**
 * Ensure directory exists, create if not
 * @param {string} dirPath - Directory path to check/create
 */
const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Storage engine for branch-based file uploads
 * @param {string} subFolder - Subfolder path (e.g., 'settings', 'doctors/123')
 * @returns {Multer.StorageEngine} - Configured storage engine
 */
const createStorage = (subFolder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        // Get branch_id from query params first, then user context, then params
        const branchId = req.query?.branch_id || req.user?.branch_id || req.params?.branchId;
        
        if (!branchId) {
          return cb(new Error("Branch ID is required for file uploads"), null);
        }

        // Build directory path
        let dirPath = path.join(UPLOAD_BASE, branchId);
        
        if (subFolder) {
          // Handle dynamic subfolders like 'doctors/123'
          dirPath = path.join(UPLOAD_BASE, branchId, subFolder);
        }

        // Ensure directory exists
        ensureDirectory(dirPath);

        cb(null, dirPath);
      } catch (error) {
        cb(error, null);
      }
    },
    filename: (req, file, cb) => {
      try {
        // Generate timestamp-based filename
        const timestamp = Date.now();
        const fieldname = file.fieldname || "file";
        const ext = path.extname(file.originalname).toLowerCase();
        
        // Use .png for images if no extension
        const extension = ext || ".png";
        const filename = `${fieldname}_${timestamp}${extension}`;

        cb(null, filename);
      } catch (error) {
        cb(error, null);
      }
    }
  });
};

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
 * Create Multer instance for settings uploads
 * @param {string} subFolder - Subfolder path
 * @param {number} maxFileSize - Max file size in bytes (default 5MB)
 */
const createMulterUpload = (subFolder, maxFileSize = 5 * 1024 * 1024) => {
  const storage = createStorage(subFolder);
  
  return multer({
    storage,
    limits: {
      fileSize: maxFileSize
    },
    fileFilter: imageFileFilter
  });
};

// Pre-configured upload middleware

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
  { name: "footer", maxCount: 1 }
]);

module.exports = {
  ensureDirectory,
  createStorage,
  createMulterUpload,
  letterheadUpload,
  ownerSignatureUpload,
  doctorSignatureUpload,
  settingsUpload,
  UPLOAD_BASE
};