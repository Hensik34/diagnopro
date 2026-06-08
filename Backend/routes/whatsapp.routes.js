const express = require("express");
const multer = require("multer");
const router = express.Router();
const whatsappController = require("../controllers/whatsapp.controller");
const { authorize, PERMISSIONS } = require("../middlewere/authorize");

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit for PDFs
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF and common document formats
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  },
});

router.get("/connections", authorize(PERMISSIONS.SETTINGS_READ), whatsappController.listConnections);
router.post("/connect", authorize(PERMISSIONS.SETTINGS_UPDATE), whatsappController.connect);
router.get("/qr", authorize(PERMISSIONS.SETTINGS_READ), whatsappController.getQr);
router.get("/status", authorize(PERMISSIONS.SETTINGS_READ), whatsappController.getStatus);
router.post("/disconnect", authorize(PERMISSIONS.SETTINGS_UPDATE), whatsappController.disconnect);
router.post("/send", authorize(PERMISSIONS.SETTINGS_UPDATE), whatsappController.sendMessage);
// NOTE: multer.single('file') must come AFTER authorize but processes multipart data
router.post("/send-with-file", authorize(PERMISSIONS.SETTINGS_UPDATE), upload.single('file'), whatsappController.sendMessageWithFile);

router.get("/templates", authorize(PERMISSIONS.SETTINGS_READ), whatsappController.listTemplates);
router.post("/templates", authorize(PERMISSIONS.SETTINGS_UPDATE), whatsappController.upsertTemplate);
router.delete("/templates/:event_key", authorize(PERMISSIONS.SETTINGS_UPDATE), whatsappController.deleteTemplate);
router.post("/templates/preview", authorize(PERMISSIONS.SETTINGS_READ), whatsappController.previewTemplate);

router.get("/notification-settings", authorize(PERMISSIONS.SETTINGS_READ), whatsappController.getNotificationSettings);
router.post("/notification-settings", authorize(PERMISSIONS.SETTINGS_UPDATE), whatsappController.upsertNotificationSetting);



module.exports = router;
