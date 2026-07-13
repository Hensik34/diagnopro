const TimeLog = require("../models/TimeLog");
const { User, UserBranch, Branch } = require("../models");
const whatsappService = require("../services/whatsapp.service");
const { emitBranchWhatsAppEvent } = require("../services/realtime.service");
const { Op } = require("sequelize");

async function sendClockNotification(userId, branchId, action, notes = null) {
  try {
    // 1. Get all admin/tech users assigned to this branch
    const mappings = await UserBranch.findAll({
      where: { branch_id: branchId },
      include: [{
        model: User,
        where: {
          role: { [Op.in]: ["admin", "lab_technician"] },
          is_active: true
        }
      }]
    });
    
    let targetUsers = mappings.map(m => m.User).filter(Boolean);
    
    // 2. Also include the creator admin of the staff user
    const staffUser = await User.findByPk(userId);
    if (staffUser && staffUser.created_by) {
      const creator = await User.findByPk(staffUser.created_by);
      if (creator && creator.is_active && (creator.role === "admin" || creator.role === "lab_technician") && !targetUsers.some(u => u.id === creator.id)) {
        targetUsers.push(creator);
      }
    }

    if (targetUsers.length === 0) return;

    // 3. Format message details
    const branch = await Branch.findByPk(branchId);
    const branchName = branch ? branch.name : "N/A";
    const staffName = staffUser ? `${staffUser.firstname} ${staffUser.lastname}` : "Staff";
    
    // Emit real-time Socket event
    emitBranchWhatsAppEvent(branchId, "staff:clock", {
      userId,
      userName: staffName,
      action,
      timestamp: new Date().toISOString(),
      notes,
    });
    
    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    
    const actionText = action === "in" ? "clocked IN 🟢" : "clocked OUT 🔴";
    const notesText = notes ? `\n*Notes:* ${notes}` : "";
    const message = `🔔 *Attendance Alert*\n\nStaff *${staffName}* has ${actionText} today (${dateStr}) at *${timeStr}*.\n*Branch:* ${branchName}${notesText}`;

    // 4. Send messages
    for (const u of targetUsers) {
      if (u.phone) {
        try {
          await whatsappService.sendMessage({
            branchId,
            to: u.phone,
            message,
          });
        } catch (err) {
          console.error(`[WhatsApp Alert] Failed to send to ${u.phone}:`, err.message);
        }
      }
    }
  } catch (error) {
    console.error("[WhatsApp Alert Error] sendClockNotification failed:", error);
  }
}

// CLOCK IN
exports.clockIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { branch_id } = req.body;

    // Check if user already has an active session
    const activeSession = await TimeLog.getActiveSession(userId);
    if (activeSession) {
      return res.status(400).json({ 
        error: "You already have an active session. Please clock out first.",
        data: activeSession
      });
    }

    const log = await TimeLog.clockIn(userId, branch_id || req.user.branch_id || null);

    // Trigger notification in background
    if (log && log.branch_id) {
      sendClockNotification(userId, log.branch_id, "in").catch(console.error);
    }

    res.status(201).json({ message: "Clocked in successfully", data: log });
  } catch (err) {
    console.error("Clock in error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CLOCK OUT
exports.clockOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notes } = req.body;

    const log = await TimeLog.clockOut(userId, notes || null);
    if (!log) {
      return res.status(400).json({ error: "No active session found to clock out" });
    }

    // Trigger notification in background
    if (log && log.branch_id) {
      sendClockNotification(userId, log.branch_id, "out", notes).catch(console.error);
    }

    res.json({ message: "Clocked out successfully", data: log });
  } catch (err) {
    console.error("Clock out error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ACTIVE SESSION (current user)
exports.getActiveSession = async (req, res) => {
  try {
    const session = await TimeLog.getActiveSession(req.user.id);
    res.json({ data: session });
  } catch (err) {
    console.error("Get active session error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET MY LOGS (current user, with date filtering)
exports.getMyLogs = async (req, res) => {
  try {
    const { start_date, end_date, branch_id } = req.query;
    
    // Default to current month
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const logs = await TimeLog.getByUser(req.user.id, startDate, endDate, branch_id || null);
    
    const totalHours = logs.reduce((sum, log) => sum + (parseFloat(log.total_hours) || 0), 0);

    res.json({
      message: "Time logs retrieved successfully",
      count: logs.length,
      total_hours: Math.round(totalHours * 100) / 100,
      data: logs,
    });
  } catch (err) {
    console.error("Get my logs error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ALL LOGS (admin - team users only)
exports.getAllLogs = async (req, res) => {
  try {
    const { start_date, end_date, branch_id } = req.query;
    const adminId = req.user.id;
    
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const logs = await TimeLog.getAll(startDate, endDate, adminId, branch_id || null);
    res.json({
      message: "All time logs retrieved",
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    console.error("Get all logs error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET USER SUMMARY (admin - team hours per user)
exports.getUserSummary = async (req, res) => {
  try {
    const { start_date, end_date, branch_id } = req.query;
    const adminId = req.user.id;
    
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const summary = await TimeLog.getUserSummary(startDate, endDate, adminId, branch_id || null);
    
    const totalHoursAll = summary.reduce((sum, u) => sum + (parseFloat(u.total_hours) || 0), 0);

    res.json({
      message: "User summary retrieved",
      total_users: summary.length,
      total_hours_all: Math.round(totalHoursAll * 100) / 100,
      data: summary,
    });
  } catch (err) {
    console.error("Get user summary error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET SPECIFIC USER LOGS (admin)
exports.getUserLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { start_date, end_date, branch_id } = req.query;
    
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const logs = await TimeLog.getByUser(userId, startDate, endDate, branch_id || null);
    
    const totalHours = logs.reduce((sum, log) => sum + (parseFloat(log.total_hours) || 0), 0);

    res.json({
      message: "User logs retrieved",
      count: logs.length,
      total_hours: Math.round(totalHours * 100) / 100,
      data: logs,
    });
  } catch (err) {
    console.error("Get user logs error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE LOG (admin)
exports.deleteLog = async (req, res) => {
  try {
    const log = await TimeLog.deleteLog(req.params.id);
    if (!log) {
      return res.status(404).json({ error: "Time log not found" });
    }
    res.json({ message: "Time log deleted", data: log });
  } catch (err) {
    console.error("Delete time log error:", err);
    res.status(500).json({ error: err.message });
  }
};
