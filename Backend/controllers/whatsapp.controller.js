const whatsappService = require("../services/whatsapp.service");
const { assertBranchAccess, getAccessibleBranchIds } = require("../services/branchAccess.service");

function getBranchId(req) {
  return req.body?.branch_id || req.query?.branch_id || req.params?.branch_id;
}

exports.connect = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    await assertBranchAccess(req.user, branchId);

    console.log(`[WhatsApp API] Connect request from user ${req.user.id} for branch ${branchId}`);

    const session = await whatsappService.connectBranch(branchId, { userId: req.user.id });
    const qr = await whatsappService.getBranchQr(branchId);

    console.log(`[WhatsApp API] Connect successful for branch ${branchId}`);

    res.json({
      message: "WhatsApp connection initialized",
      data: {
        session,
        qr,
      },
    });
  } catch (error) {
    console.error(`[WhatsApp API] Connect failed:`, error.message, error.stack);
    res.status(error.status || 500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

exports.getQr = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    await assertBranchAccess(req.user, branchId);

    const qr = await whatsappService.getBranchQr(branchId);
    res.json({
      message: "QR fetched successfully",
      data: qr,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    await assertBranchAccess(req.user, branchId);

    const status = await whatsappService.getBranchStatus(branchId);
    res.json({
      message: "Status fetched successfully",
      data: status,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.disconnect = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    await assertBranchAccess(req.user, branchId);

    const session = await whatsappService.disconnectBranch(branchId, req.user.id);
    res.json({
      message: "WhatsApp disconnected",
      data: session,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.listConnections = async (req, res) => {
  try {
    const branchIds = await getAccessibleBranchIds(req.user);
    const rows = await whatsappService.listConnections(branchIds);

    res.json({
      message: "Connections fetched successfully",
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { branch_id, to, message } = req.body;
    await assertBranchAccess(req.user, branch_id);

    if (!to || !message) {
      return res.status(400).json({ error: "to and message are required" });
    }

    const log = await whatsappService.sendMessage({
      branchId: branch_id,
      to,
      message,
      metadata: { source: "manual", actor_user_id: req.user.id },
    });

    res.json({
      message: "Message sent",
      data: log,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.listTemplates = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    await assertBranchAccess(req.user, branchId);

    const templates = await whatsappService.listTemplates(branchId);
    res.json({
      message: "Templates fetched successfully",
      data: templates,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.upsertTemplate = async (req, res) => {
  try {
    const { branch_id, event_key, template_name, template_body, is_enabled } = req.body;
    await assertBranchAccess(req.user, branch_id);

    if (!event_key || !template_name || !template_body) {
      return res.status(400).json({ error: "event_key, template_name and template_body are required" });
    }

    const template = await whatsappService.upsertTemplate({
      branchId: branch_id,
      eventKey: event_key,
      templateName: template_name,
      templateBody: template_body,
      isEnabled: is_enabled,
      userId: req.user.id,
    });

    res.json({
      message: "Template saved successfully",
      data: template,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const eventKey = req.params.event_key;

    await assertBranchAccess(req.user, branchId);
    await whatsappService.deleteTemplate(branchId, eventKey);

    res.json({
      message: "Template removed successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.previewTemplate = async (req, res) => {
  try {
    const { branch_id, event_key, variables } = req.body;
    await assertBranchAccess(req.user, branch_id);

    const preview = await whatsappService.previewTemplate(branch_id, event_key, variables || {});
    res.json({
      message: "Preview generated",
      data: preview,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.getNotificationSettings = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    await assertBranchAccess(req.user, branchId);

    const settings = await whatsappService.listNotificationSettings(branchId);
    res.json({
      message: "Notification settings fetched",
      data: settings,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.upsertNotificationSetting = async (req, res) => {
  try {
    const { branch_id, event_key, is_enabled } = req.body;
    await assertBranchAccess(req.user, branch_id);

    if (!event_key || is_enabled === undefined) {
      return res.status(400).json({ error: "event_key and is_enabled are required" });
    }

    const row = await whatsappService.upsertNotificationSetting({
      branchId: branch_id,
      eventKey: event_key,
      isEnabled: is_enabled,
      userId: req.user.id,
    });

    res.json({
      message: "Notification setting saved",
      data: row,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.getMessageLogs = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const limit = Number(req.query.limit || 50);

    await assertBranchAccess(req.user, branchId);
    const logs = await whatsappService.getMessageLogs(branchId, { limit });

    res.json({
      message: "Message logs fetched",
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
