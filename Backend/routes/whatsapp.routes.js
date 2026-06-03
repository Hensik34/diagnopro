const express = require("express");
const router = express.Router();
const whatsappController = require("../controllers/whatsapp.controller");
const { authorize, PERMISSIONS } = require("../middlewere/authorize");

router.get("/connections", authorize(PERMISSIONS.SETTINGS_READ), whatsappController.listConnections);
router.post("/connect", authorize(PERMISSIONS.SETTINGS_UPDATE), whatsappController.connect);
router.get("/qr", authorize(PERMISSIONS.SETTINGS_READ), whatsappController.getQr);
router.get("/status", authorize(PERMISSIONS.SETTINGS_READ), whatsappController.getStatus);
router.post("/disconnect", authorize(PERMISSIONS.SETTINGS_UPDATE), whatsappController.disconnect);
router.post("/send", authorize(PERMISSIONS.SETTINGS_UPDATE), whatsappController.sendMessage);

router.get("/templates", authorize(PERMISSIONS.SETTINGS_READ), whatsappController.listTemplates);
router.post("/templates", authorize(PERMISSIONS.SETTINGS_UPDATE), whatsappController.upsertTemplate);
router.delete("/templates/:event_key", authorize(PERMISSIONS.SETTINGS_UPDATE), whatsappController.deleteTemplate);
router.post("/templates/preview", authorize(PERMISSIONS.SETTINGS_READ), whatsappController.previewTemplate);

router.get("/notification-settings", authorize(PERMISSIONS.SETTINGS_READ), whatsappController.getNotificationSettings);
router.post("/notification-settings", authorize(PERMISSIONS.SETTINGS_UPDATE), whatsappController.upsertNotificationSetting);



module.exports = router;
