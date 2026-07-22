const TimeLog = require("../models/TimeLog");
const CollectionTracking = require("../models/CollectionTracking");
const { User, UserBranch, Branch } = require("../models");
const whatsappService = require("../services/whatsapp.service");
const { emitBranchWhatsAppEvent } = require("../services/realtime.service");
const { verifyBranchLocation } = require("../utils/locationVerify");
const { uploadBase64ToCloudinary } = require("../utils/upload");
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
    
    // 2. Also include creator admin
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
    
    const actionText = action === "in" ? "checked IN 🟢" : "checked OUT 🔴";
    const notesText = notes ? `\n*Notes:* ${notes}` : "";
    const message = `🔔 *Attendance Alert*\n\nStaff *${staffName}* has ${actionText} today (${dateStr}) at *${timeStr}*.\n*Branch:* ${branchName}${notesText}`;

    // 4. Send WhatsApp messages
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

// CHECKIN
exports.clockIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { branch_id, start_km, start_meter_image, latitude, longitude, is_outside, outside_reason } = req.body;

    // Check active session
    const activeSession = await TimeLog.getActiveSession(userId);
    if (activeSession) {
      return res.status(400).json({ 
        error: "You already have an active session. Please checkout first.",
        data: activeSession
      });
    }

    const targetBranchId = req.headers['x-branch-id'] || branch_id || req.user.branch_id || null;
    let locationCheck = { verified: true, bypass: true };
    let outsideMode = !!is_outside;
    
    if (targetBranchId) {
      const branch = await Branch.findByPk(targetBranchId);
      if (branch) {
        locationCheck = verifyBranchLocation(branch, latitude, longitude);
        if (!locationCheck.verified && !locationCheck.bypass) {
          if (!outsideMode && !outside_reason) {
            return res.status(403).json({
              error: locationCheck.message,
              distance_meters: locationCheck.distanceMeters,
              radius: locationCheck.radius,
              allow_outside_request: true,
            });
          }
          outsideMode = true;
        }
      }
    }

    // Mandatory Start Meter Photo (only if user.requires_meter_photo !== false)
    if (req.user?.requires_meter_photo !== false) {
      if (!start_meter_image || !start_meter_image.startsWith("data:image/")) {
        return res.status(400).json({ error: "Start bike meter photo is required to checkin." });
      }
    }

    // Upload start meter photo if provided
    let startMeterUrl = null;
    if (start_meter_image && start_meter_image.startsWith("data:image/")) {
      try {
        startMeterUrl = await uploadBase64ToCloudinary(
          start_meter_image,
          "start_meter",
          targetBranchId || "general",
          "collection-tracking"
        );
      } catch (uploadErr) {
        console.error("Failed to upload start meter photo to Cloudinary:", uploadErr);
        startMeterUrl = start_meter_image;
      }
    }

    const location_meta = {
      clock_in: {
        lat: latitude || null,
        lng: longitude || null,
        verified: locationCheck.verified,
        distance_meters: locationCheck.distanceMeters || 0,
        message: locationCheck.message,
        timestamp: new Date().toISOString(),
      }
    };

    const log = await TimeLog.clockIn(userId, targetBranchId, {
      start_km,
      start_meter_image: startMeterUrl,
      location_meta,
      is_outside: outsideMode,
      outside_reason: outside_reason || (outsideMode ? `Outside Checkin (${locationCheck.distanceMeters || 0}m from lab)` : null),
    });

    // Create CollectionTracking entry
    try {
      await CollectionTracking.create({
        staff_id: userId,
        branch_id: targetBranchId,
        start_km,
        start_meter_image: startMeterUrl,
        date: new Date(),
      });
    } catch (ctErr) {
      console.error("Failed to sync CollectionTracking on clockIn:", ctErr);
    }

    // Emit Realtime event for outside request if pending
    if (outsideMode && targetBranchId) {
      const staffUser = await User.findByPk(userId);
      const staffName = staffUser ? `${staffUser.firstname} ${staffUser.lastname}` : "Staff";
      emitBranchWhatsAppEvent(targetBranchId, "staff:outside_clock_request", {
        id: log.id,
        userId,
        userName: staffName,
        type: "checkin",
        distanceMeters: locationCheck.distanceMeters,
        reason: outside_reason || "Outside Checkin Request",
        timestamp: new Date().toISOString(),
      });
    } else if (log && log.branch_id) {
      sendClockNotification(userId, log.branch_id, "in").catch(console.error);
    }

    res.status(201).json({ 
      message: outsideMode ? "Outside Checkin request submitted for Admin approval" : "Checked in successfully", 
      data: log 
    });
  } catch (err) {
    console.error("Checkin error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CHECKOUT
exports.clockOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notes, end_km, end_meter_image, latitude, longitude, is_outside, outside_reason } = req.body;

    const activeSession = await TimeLog.getActiveSession(userId);
    if (!activeSession) {
      return res.status(400).json({ error: "No active session found to checkout" });
    }

    const targetBranchId = activeSession.branch_id || req.user.branch_id || null;
    let locationCheck = { verified: true, bypass: true };
    let outsideMode = !!is_outside;

    if (targetBranchId) {
      const branch = await Branch.findByPk(targetBranchId);
      if (branch) {
        locationCheck = verifyBranchLocation(branch, latitude, longitude);
        if (!locationCheck.verified && !locationCheck.bypass) {
          if (!outsideMode && !outside_reason) {
            return res.status(403).json({
              error: locationCheck.message,
              distance_meters: locationCheck.distanceMeters,
              radius: locationCheck.radius,
              allow_outside_request: true,
            });
          }
          outsideMode = true;
        }
      }
    }

    // Mandate End Meter Photo Upload (only if user.requires_meter_photo !== false)
    if (req.user?.requires_meter_photo !== false) {
      if (!end_meter_image || !end_meter_image.startsWith("data:image/")) {
        return res.status(400).json({
          error: "End bike meter photo is required to checkout.",
        });
      }
    }

    // Upload end meter photo to Cloudinary if provided
    let endMeterUrl = null;
    if (end_meter_image && end_meter_image.startsWith("data:image/")) {
      try {
        endMeterUrl = await uploadBase64ToCloudinary(
          end_meter_image,
          "end_meter",
          targetBranchId || "general",
          "collection-tracking"
        );
      } catch (uploadErr) {
        console.error("Failed to upload end meter photo to Cloudinary:", uploadErr);
        endMeterUrl = end_meter_image;
      }
    }

    const location_meta = {
      clock_out: {
        lat: latitude || null,
        lng: longitude || null,
        verified: locationCheck.verified,
        distance_meters: locationCheck.distanceMeters || 0,
        message: locationCheck.message,
        timestamp: new Date().toISOString(),
      }
    };

    const log = await TimeLog.clockOut(userId, notes || null, {
      end_km,
      end_meter_image: endMeterUrl,
      location_meta,
      is_outside: outsideMode,
      outside_reason: outside_reason || (outsideMode ? `Outside Checkout (${locationCheck.distanceMeters || 0}m from lab)` : null),
    });

    // Sync CollectionTracking
    try {
      const todayRecords = await CollectionTracking.getTodayByStaff(userId);
      const openRecord = todayRecords.find(r => r.end_km == null) || todayRecords[0];
      if (openRecord) {
        await CollectionTracking.update(openRecord.id, {
          end_km,
          end_meter_image: endMeterUrl,
        });
      }
    } catch (ctErr) {
      console.error("Failed to sync CollectionTracking on clockOut:", ctErr);
    }

    // Emit Realtime socket event if outside mode
    if (outsideMode && targetBranchId) {
      const staffUser = await User.findByPk(userId);
      const staffName = staffUser ? `${staffUser.firstname} ${staffUser.lastname}` : "Staff";
      emitBranchWhatsAppEvent(targetBranchId, "staff:outside_clock_request", {
        id: log.id,
        userId,
        userName: staffName,
        type: "checkout",
        distanceMeters: locationCheck.distanceMeters,
        reason: outside_reason || "Outside Checkout Request",
        timestamp: new Date().toISOString(),
      });
    } else if (log && log.branch_id) {
      sendClockNotification(userId, log.branch_id, "out", notes).catch(console.error);
    }

    res.json({ 
      message: outsideMode ? "Outside Checkout request submitted for Admin approval" : "Checked out successfully", 
      data: log 
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET PENDING APPROVALS (admin)
exports.getPendingApprovals = async (req, res) => {
  try {
    const { branch_id } = req.query;
    const targetBranchId = req.headers['x-branch-id'] || branch_id || null;
    const adminId = req.user.id;

    const pendingLogs = await TimeLog.getPendingApprovals(adminId, targetBranchId);
    res.json({
      message: "Pending checkin/checkout approvals retrieved",
      count: pendingLogs.length,
      data: pendingLogs,
    });
  } catch (err) {
    console.error("Get pending approvals error:", err);
    res.status(500).json({ error: err.message });
  }
};

// APPROVE CLOCK REQUEST (admin)
exports.approveClockRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const updatedLog = await TimeLog.approveClockRequest(id, adminId);
    if (!updatedLog) {
      return res.status(404).json({ error: "Time log request not found" });
    }

    // Notify staff user via Realtime socket event
    if (updatedLog.branch_id) {
      emitBranchWhatsAppEvent(updatedLog.branch_id, "staff:clock_status_update", {
        id: updatedLog.id,
        userId: updatedLog.user_id,
        status: "approved",
        message: "Your outside Checkin/Checkout request has been approved.",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ message: "Checkin/Checkout request approved successfully", data: updatedLog });
  } catch (err) {
    console.error("Approve clock request error:", err);
    res.status(500).json({ error: err.message });
  }
};

// REJECT CLOCK REQUEST (admin)
exports.rejectClockRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_note } = req.body;
    const adminId = req.user.id;

    const updatedLog = await TimeLog.rejectClockRequest(id, adminId, rejection_note);
    if (!updatedLog) {
      return res.status(404).json({ error: "Time log request not found" });
    }

    // Notify staff user via Realtime socket event
    if (updatedLog.branch_id) {
      const isCheckoutPenalty = updatedLog.approval_status === "rejected_with_penalty";
      emitBranchWhatsAppEvent(updatedLog.branch_id, "staff:clock_status_update", {
        id: updatedLog.id,
        userId: updatedLog.user_id,
        status: updatedLog.approval_status,
        message: isCheckoutPenalty 
          ? `Outside Checkout rejected. Checkout completed with 1-hour penalty deduction. Note: ${rejection_note || 'Admin rejection'}`
          : `Outside Checkin rejected by Admin. Note: ${rejection_note || 'Checkin canceled'}`,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ 
      message: updatedLog.approval_status === "rejected_with_penalty"
        ? "Outside Checkout rejected: Checkout completed with 1-hour penalty deduction"
        : "Outside Checkin request rejected and canceled", 
      data: updatedLog 
    });
  } catch (err) {
    console.error("Reject clock request error:", err);
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
    const targetBranchId = req.headers['x-branch-id'] || branch_id || null;
    
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const logs = await TimeLog.getByUser(req.user.id, startDate, endDate, targetBranchId);
    
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

// GET ALL LOGS (admin)
exports.getAllLogs = async (req, res) => {
  try {
    const { start_date, end_date, branch_id } = req.query;
    const targetBranchId = req.headers['x-branch-id'] || branch_id || null;
    const adminId = req.user.id;
    
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const logs = await TimeLog.getAll(startDate, endDate, adminId, targetBranchId);
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

// GET USER SUMMARY (admin)
exports.getUserSummary = async (req, res) => {
  try {
    const { start_date, end_date, branch_id } = req.query;
    const targetBranchId = req.headers['x-branch-id'] || branch_id || null;
    const adminId = req.user.id;
    
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const summary = await TimeLog.getUserSummary(startDate, endDate, adminId, targetBranchId);
    
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
