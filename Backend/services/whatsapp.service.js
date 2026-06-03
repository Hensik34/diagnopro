const path = require("path");
const fs = require("fs-extra");
const qrcode = require("qrcode");
const pino = require("pino");
const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const {
  WhatsappSession,
  WhatsappTemplate,
  WhatsappNotificationSetting,
  Branch,
} = require("../models");
const { emitBranchWhatsAppEvent } = require("./realtime.service");
const { WHATSAPP_EVENTS, DELIVERY_STATUS, CONNECTION_STATUS } = require("./whatsapp.constants");

const SESSIONS_ROOT = path.join(__dirname, "..", "uploads", "whatsapp-sessions");
const clients = new Map();
const qrCache = new Map();
const retryAttempts = new Map(); // Track retry attempts to prevent infinite loops

async function waitForQr(branchId, timeoutMs = 15000, intervalMs = 250) {
  const startedAt = Date.now();
  console.log(`[WhatsApp] Waiting for QR (timeout: ${timeoutMs}ms) for branch ${branchId}`);

  while (Date.now() - startedAt < timeoutMs) {
    const cachedQr = qrCache.get(branchId);
    if (cachedQr) {
      console.log(`[WhatsApp] QR obtained for branch ${branchId} after ${Date.now() - startedAt}ms`);
      return cachedQr;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  console.log(`[WhatsApp] QR timeout (${timeoutMs}ms) for branch ${branchId} - no QR generated`);
  return null;
}

function ensureSessionDir(branchId) {
  const dir = path.join(SESSIONS_ROOT, String(branchId));
  fs.ensureDirSync(dir);
  return dir;
}

function sanitizePhoneNumber(phone) {
  if (!phone) return null;
  const raw = String(phone).trim();
  if (!raw) return null;

  const hadPlusPrefix = raw.startsWith("+");
  const cleaned = raw.replace(/[^0-9]/g, "");
  if (!cleaned) return null;

  // India-friendly normalization:
  // - 10-digit local mobile -> prepend 91
  // - 0091 prefix -> strip international trunk prefix
  // - + prefixed numbers keep their country code as entered
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }

  if (cleaned.startsWith("0091") && cleaned.length > 12) {
    return cleaned.slice(2);
  }

  if (hadPlusPrefix) {
    return cleaned.length >= 10 ? cleaned : null;
  }

  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned;
  }

  return cleaned.length >= 10 ? cleaned : null;
}

function toWhatsAppJid(phone) {
  const cleaned = sanitizePhoneNumber(phone);
  if (!cleaned) return null;
  return `${cleaned}@s.whatsapp.net`;
}

async function upsertSessionRecord(branchId, patch = {}, userId = null) {
  const existing = await WhatsappSession.findOne({ where: { branch_id: branchId } });
  if (!existing) {
    return WhatsappSession.create({
      branch_id: branchId,
      ...patch,
      created_by: userId,
      updated_by: userId,
    });
  }

  await existing.update({
    ...patch,
    updated_by: userId || existing.updated_by,
  });
  return existing;
}

function sanitizeSession(session) {
  if (!session) return null;
  return {
    id: session.id,
    branch_id: session.branch_id,
    status: session.status,
    phone_number: session.phone_number,
    wa_jid: session.wa_jid,
    qr_expires_at: session.qr_expires_at,
    last_connected_at: session.last_connected_at,
    last_disconnected_at: session.last_disconnected_at,
    failure_reason: session.failure_reason,
    session_metadata: session.session_metadata || {},
    created_at: session.created_at,
    updated_at: session.updated_at,
  };
}

async function emitStatus(branchId) {
  const session = await WhatsappSession.findOne({ where: { branch_id: branchId } });
  emitBranchWhatsAppEvent(branchId, "whatsapp:status", {
    status: sanitizeSession(session),
  });
}

async function handleConnectionUpdate(branchId, update, saveCreds, userId = null) {
  const { connection, qr, lastDisconnect } = update;

  if (qr) {
    console.log(`[WhatsApp] QR code generated for branch ${branchId}`);
    const qrImage = await qrcode.toDataURL(qr, { margin: 1, width: 256 });
    qrCache.set(branchId, {
      qr: qrImage,
      expires_at: new Date(Date.now() + 60 * 1000),
    });

    await upsertSessionRecord(branchId, {
      status: CONNECTION_STATUS.QR_READY,
      qr_expires_at: new Date(Date.now() + 60 * 1000),
      failure_reason: null,
    }, userId);

    emitBranchWhatsAppEvent(branchId, "whatsapp:qr", {
      qr: qrImage,
      expires_in: 60,
    });

    await emitStatus(branchId);
  }

  if (connection === "open") {
    console.log(`[WhatsApp] Connected for branch ${branchId}`);
    const instance = clients.get(branchId);
    const jid = instance?.socket?.user?.id || null;
    const phone = jid ? jid.split(":")[0] : null;

    qrCache.delete(branchId);
    retryAttempts.delete(branchId); // Reset retry counter on successful connection

    await upsertSessionRecord(branchId, {
      status: CONNECTION_STATUS.CONNECTED,
      wa_jid: jid,
      phone_number: phone,
      last_connected_at: new Date(),
      failure_reason: null,
      qr_expires_at: null,
    }, userId);

    emitBranchWhatsAppEvent(branchId, "whatsapp:connected", {
      phone_number: phone,
    });

    await emitStatus(branchId);
  }

  if (connection === "close") {
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    const isLoggedOut = statusCode === DisconnectReason.loggedOut;
    const errorMessage = lastDisconnect?.error?.message || lastDisconnect?.error?.toString();
    
    console.log(`[WhatsApp] Disconnected for branch ${branchId}`, {
      statusCode,
      reason: errorMessage,
      isLoggedOut,
    });

    // Only clear session files on logout, not on stream errors
    if (isLoggedOut) {
      console.log(`[WhatsApp] Logged out - clearing session for branch ${branchId}`);
      await clearBranchSessionFiles(branchId);
      clients.delete(branchId);
      qrCache.delete(branchId);
      retryAttempts.delete(branchId);
    } else {
      // For other errors, just clean up the socket and keep credentials
      clients.delete(branchId);
      qrCache.delete(branchId);
    }

    const nextStatus = isLoggedOut
      ? CONNECTION_STATUS.SESSION_EXPIRED
      : CONNECTION_STATUS.DISCONNECTED;

    await upsertSessionRecord(branchId, {
      status: nextStatus,
      last_disconnected_at: new Date(),
      failure_reason: errorMessage || null,
      qr_expires_at: null,
    }, userId);

    emitBranchWhatsAppEvent(branchId, "whatsapp:disconnected", {
      reason: errorMessage || "Connection closed",
      status: nextStatus,
    });

    await emitStatus(branchId);

    // Don't retry if logged out
    if (isLoggedOut) {
      return;
    }

    // Check retry count for other errors
    const attempts = (retryAttempts.get(branchId) || 0) + 1;
    retryAttempts.set(branchId, attempts);
    
    if (attempts > 3) {
      console.error(`[WhatsApp] Max retries (${attempts}) exceeded for branch ${branchId}. Stopping retry attempts.`);
      await upsertSessionRecord(branchId, {
        status: CONNECTION_STATUS.DISCONNECTED,
        failure_reason: 'Connection keeps failing - please generate QR again',
      }, userId);
      return;
    }

    // Longer retry delay for stream errors (515) to let WhatsApp stabilize
    const retryDelayMs = statusCode === 515 ? 5000 : 3000;
    console.log(`[WhatsApp] Retry attempt ${attempts}/3 for branch ${branchId} in ${retryDelayMs}ms`);
    
    setTimeout(() => {
      if (!clients.has(branchId)) {
        connectBranch(branchId, { reconnect: true }).catch((error) => {
          console.error("WhatsApp reconnect failed", { branchId, error: error.message });
        });
      }
    }, retryDelayMs);
  }

  await saveCreds();
}

async function connectBranch(branchId, options = {}) {
  const existing = clients.get(branchId);
  
  // If socket exists and is CONNECTED, reuse it
  if (existing?.socket && existing.socket.user) {
    console.log(`[WhatsApp] Socket already connected for branch ${branchId}`);
    return sanitizeSession(await WhatsappSession.findOne({ where: { branch_id: branchId } }));
  }
  
  // If socket exists but not connected yet, wait for it to connect
  // Don't create a new one - let the existing one finish authenticating
  if (existing?.socket && !existing.socket.user && !existing.isClosing) {
    console.log(`[WhatsApp] Waiting for existing socket to authenticate for branch ${branchId}`);
    return sanitizeSession(await WhatsappSession.findOne({ where: { branch_id: branchId } }));
  }
  
  // Socket is dead/closing, remove it and create new one
  if (existing?.socket) {
    console.log(`[WhatsApp] Closing broken connection for branch ${branchId}`);
    try {
      await existing.socket.end();
    } catch (err) {
      // ignore error
    }
    clients.delete(branchId);
    qrCache.delete(branchId);
  }

  console.log(`[WhatsApp] Initiating new connection for branch ${branchId}...`);
  
  const sessionDir = ensureSessionDir(branchId);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const versionInfo = await fetchLatestBaileysVersion();
  
  if (!versionInfo || !versionInfo.version) {
    throw new Error('Failed to fetch Baileys version information');
  }
  
  const { version } = versionInfo;
  const versionString = Array.isArray(version) ? version.join('.') : String(version);
  console.log(`[WhatsApp] Baileys version: ${versionString}`);

  await upsertSessionRecord(branchId, {
    status: CONNECTION_STATUS.CONNECTING,
    failure_reason: null,
  }, options.userId || null);

  let socket;
  try {
    socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      version,
      syncFullHistory: false,
      logger: pino({ level: "silent" }),
      // Conservative settings to prevent stream errors
      retryRequestDelayMs: 100,
      maxRetries: 3,
      connectionTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      emitOwnEvents: false,
      shouldSyncHistoryMessage: () => false,
      fireInitQueries: false,
      generateHighQualityLinkPreview: false,
      // Disable browser detection to prevent blocking
      browser: ["VisionLab", "Chrome", "4.0"],
      // Don't try to load history
      markOnlineOnConnect: true,
      // Reduce load
      maxMsgsInMemory: 20,
    });
    
    if (!socket) {
      throw new Error('Failed to create WhatsApp socket instance');
    }
  } catch (err) {
    console.error(`[WhatsApp] Socket creation failed for branch ${branchId}:`, err.message);
    await upsertSessionRecord(branchId, {
      status: CONNECTION_STATUS.DISCONNECTED,
      failure_reason: `Socket creation failed: ${err.message}`,
    }, options.userId || null);
    throw err;
  }

  clients.set(branchId, { socket, createdAt: Date.now() });

  // Handle socket errors early
  socket.ev.on("ws.error", (error) => {
    console.error(`[WhatsApp] WebSocket error for branch ${branchId}:`, error?.message);
  });

  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("connection.update", async (update) => {
    try {
      await handleConnectionUpdate(branchId, update, saveCreds, options.userId || null);
    } catch (err) {
      console.error(`[WhatsApp] Connection update error for branch ${branchId}:`, err.message);
    }
  });



  await emitStatus(branchId);
  return sanitizeSession(await WhatsappSession.findOne({ where: { branch_id: branchId } }));
}

async function clearBranchSessionFiles(branchId) {
  const sessionDir = path.join(SESSIONS_ROOT, String(branchId));
  if (await fs.pathExists(sessionDir)) {
    await fs.remove(sessionDir);
  }
}

async function disconnectBranch(branchId, userId = null) {
  const instance = clients.get(branchId);
  if (instance?.socket) {
    try {
      await instance.socket.logout();
    } catch (err) {
      // ignore logout errors, cleanup still needed
    }
  }

  clients.delete(branchId);
  qrCache.delete(branchId);
  await clearBranchSessionFiles(branchId);

  await upsertSessionRecord(branchId, {
    status: CONNECTION_STATUS.DISCONNECTED,
    qr_expires_at: null,
    wa_jid: null,
    phone_number: null,
    last_disconnected_at: new Date(),
  }, userId);

  emitBranchWhatsAppEvent(branchId, "whatsapp:disconnected", {
    reason: "Disconnected by user",
    status: CONNECTION_STATUS.DISCONNECTED,
  });

  return sanitizeSession(await WhatsappSession.findOne({ where: { branch_id: branchId } }));
}

async function getBranchStatus(branchId) {
  const session = await WhatsappSession.findOne({ where: { branch_id: branchId } });
  const cachedQr = qrCache.get(branchId) || null;

  return {
    session: sanitizeSession(session),
    qr: cachedQr,
  };
}

async function getBranchQr(branchId) {
  const cachedQr = qrCache.get(branchId);
  if (cachedQr) {
    console.log(`[WhatsApp] Returning cached QR for branch ${branchId}`);
    return cachedQr;
  }

  const session = await WhatsappSession.findOne({ where: { branch_id: branchId } });
  
  // If already connected, no QR needed
  if (session?.status === CONNECTION_STATUS.CONNECTED) {
    console.log(`[WhatsApp] Branch ${branchId} already connected, no QR`);
    return null;
  }

  console.log(`[WhatsApp] Waiting for QR for branch ${branchId}...`);
  await connectBranch(branchId, { reconnect: false });
  return waitForQr(branchId);
}

async function listConnections(branchIds = []) {
  const where = branchIds.length > 0 ? { branch_id: branchIds } : {};
  const rows = await WhatsappSession.findAll({
    where,
    include: [{ model: Branch, as: "branch", attributes: ["id", "name", "location"] }],
    order: [["updated_at", "DESC"]],
  });

  return rows.map((row) => ({
    ...sanitizeSession(row),
    branch: row.branch,
  }));
}

async function ensureConnected(branchId) {
  const instance = clients.get(branchId);
  const session = await WhatsappSession.findOne({ where: { branch_id: branchId } });

  if (!instance?.socket || session?.status !== CONNECTION_STATUS.CONNECTED) {
    const error = new Error("WhatsApp is not connected for this branch");
    error.status = 409;
    throw error;
  }

  return { instance, session };
}

async function sendMessage({ branchId, to, message, metadata = {}, templateId = null, eventKey = null, recipientName = null }) {
  const { instance, session } = await ensureConnected(branchId);

  const jid = toWhatsAppJid(to);
  if (!jid) {
    const err = new Error("Invalid recipient phone number");
    err.status = 400;
    throw err;
  }

  try {
    const response = await instance.socket.sendMessage(jid, { text: message });
    return { success: true, wa_message_id: response?.key?.id || null };
  } catch (error) {
    throw error;
  }
}

function applyTemplate(template, variables = {}) {
  let text = template || "";
  for (const [key, value] of Object.entries(variables)) {
    const safeValue = value == null ? "" : String(value);
    text = text.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), safeValue);
  }
  return text;
}

async function resolveTemplate(branchId, eventKey) {
  const branchTemplate = await WhatsappTemplate.findOne({
    where: { branch_id: branchId, event_key: eventKey },
  });

  if (branchTemplate) return branchTemplate;

  return WhatsappTemplate.findOne({ where: { branch_id: null, event_key: eventKey } });
}

async function isNotificationEnabled(branchId, eventKey) {
  const setting = await WhatsappNotificationSetting.findOne({
    where: { branch_id: branchId, event_key: eventKey },
  });
  if (!setting) return true;
  return !!setting.is_enabled;
}

async function sendWorkflowNotification({
  branchId,
  eventKey,
  to,
  variables = {},
  metadata = {},
  recipientName = null,
}) {
  if (!(await isNotificationEnabled(branchId, eventKey))) {
    return { skipped: true, reason: "Notification disabled" };
  }

  const template = await resolveTemplate(branchId, eventKey);
  if (!template || !template.is_enabled) {
    return { skipped: true, reason: "Template unavailable or disabled" };
  }

  const message = applyTemplate(template.template_body, variables);
  const log = await sendMessage({
    branchId,
    to,
    message,
    metadata,
    templateId: template.id,
    eventKey,
    recipientName,
  });

  return { skipped: false, log };
}

async function listTemplates(branchId) {
  const defaults = await WhatsappTemplate.findAll({
    where: { branch_id: null },
    order: [["event_key", "ASC"]],
  });

  const branchSpecific = await WhatsappTemplate.findAll({
    where: { branch_id: branchId },
    order: [["event_key", "ASC"]],
  });

  const byEvent = new Map(defaults.map((template) => [template.event_key, template]));
  for (const template of branchSpecific) {
    byEvent.set(template.event_key, template);
  }

  return Array.from(byEvent.values());
}

async function upsertTemplate({ branchId, eventKey, templateName, templateBody, isEnabled, userId }) {
  const existing = await WhatsappTemplate.findOne({
    where: { branch_id: branchId, event_key: eventKey },
  });

  if (!existing) {
    return WhatsappTemplate.create({
      branch_id: branchId,
      event_key: eventKey,
      template_name: templateName,
      template_body: templateBody,
      is_enabled: isEnabled !== undefined ? !!isEnabled : true,
      is_system: false,
      created_by: userId,
      updated_by: userId,
    });
  }

  await existing.update({
    template_name: templateName !== undefined ? templateName : existing.template_name,
    template_body: templateBody !== undefined ? templateBody : existing.template_body,
    is_enabled: isEnabled !== undefined ? !!isEnabled : existing.is_enabled,
    updated_by: userId,
  });

  return existing;
}

async function deleteTemplate(branchId, eventKey) {
  return WhatsappTemplate.destroy({ where: { branch_id: branchId, event_key: eventKey } });
}

async function previewTemplate(branchId, eventKey, variables = {}) {
  const template = await resolveTemplate(branchId, eventKey);
  if (!template) {
    const err = new Error("Template not found");
    err.status = 404;
    throw err;
  }

  return {
    event_key: eventKey,
    template_name: template.template_name,
    preview: applyTemplate(template.template_body, variables),
  };
}

async function listNotificationSettings(branchId) {
  const rows = await WhatsappNotificationSetting.findAll({
    where: { branch_id: branchId },
    order: [["event_key", "ASC"]],
  });

  const map = {};
  for (const eventKey of Object.values(WHATSAPP_EVENTS)) {
    map[eventKey] = true;
  }

  for (const row of rows) {
    map[row.event_key] = !!row.is_enabled;
  }

  return map;
}

async function upsertNotificationSetting({ branchId, eventKey, isEnabled, userId }) {
  const existing = await WhatsappNotificationSetting.findOne({
    where: { branch_id: branchId, event_key: eventKey },
  });

  if (!existing) {
    return WhatsappNotificationSetting.create({
      branch_id: branchId,
      event_key: eventKey,
      is_enabled: !!isEnabled,
      created_by: userId,
      updated_by: userId,
    });
  }

  await existing.update({ is_enabled: !!isEnabled, updated_by: userId });
  return existing;
}

async function restoreAllSessions() {
  await fs.ensureDir(SESSIONS_ROOT);

  const rows = await WhatsappSession.findAll({
    where: { status: CONNECTION_STATUS.CONNECTED },
    attributes: ["branch_id"],
    raw: true,
  });

  for (const row of rows) {
    connectBranch(row.branch_id, { reconnect: true }).catch((error) => {
      console.error("Failed to restore WhatsApp session", {
        branchId: row.branch_id,
        error: error.message,
      });
    });
  }
}



module.exports = {
  connectBranch,
  disconnectBranch,
  getBranchStatus,
  getBranchQr,
  listConnections,
  sendMessage,
  sendWorkflowNotification,
  listTemplates,
  upsertTemplate,
  deleteTemplate,
  previewTemplate,
  listNotificationSettings,
  upsertNotificationSetting,
  restoreAllSessions,
  WHATSAPP_EVENTS,
  DELIVERY_STATUS,
  CONNECTION_STATUS,
};
