const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { assertBranchAccess } = require("./branchAccess.service");

let ioInstance = null;

function getRoomName(branchId) {
  return `branch:${branchId}`;
}

function initRealtime(server) {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: process.env.NODE_ENV === "production"
        ? (process.env.CLIENT_URL || "http://localhost:5173")
        : true,
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("AUTH_TOKEN_MISSING"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error("AUTH_FAILED"));
    }
  });

  ioInstance.on("connection", (socket) => {
    socket.on("whatsapp:subscribe", async (payload = {}, ack = () => {}) => {
      try {
        const branchId = payload.branch_id;
        await assertBranchAccess(socket.data.user, branchId);
        socket.join(getRoomName(branchId));
        ack({ ok: true, branch_id: branchId });
      } catch (error) {
        ack({ ok: false, error: error.message || "Subscription failed" });
      }
    });

    socket.on("whatsapp:unsubscribe", (payload = {}, ack = () => {}) => {
      const branchId = payload.branch_id;
      if (branchId) {
        socket.leave(getRoomName(branchId));
      }
      ack({ ok: true });
    });
  });

  return ioInstance;
}

function emitBranchWhatsAppEvent(branchId, event, payload = {}) {
  if (!ioInstance || !branchId) return;
  ioInstance.to(getRoomName(branchId)).emit(event, {
    branch_id: branchId,
    ...payload,
  });
}

function getIO() {
  return ioInstance;
}

module.exports = {
  initRealtime,
  emitBranchWhatsAppEvent,
  getIO,
};
