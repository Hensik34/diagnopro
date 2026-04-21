const TimeLog = require("../models/TimeLog");

// CLOCK IN
exports.clockIn = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user already has an active session
    const activeSession = await TimeLog.getActiveSession(userId);
    if (activeSession) {
      return res.status(400).json({ 
        error: "You already have an active session. Please clock out first.",
        data: activeSession
      });
    }

    const log = await TimeLog.clockIn(userId);
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
    const { start_date, end_date } = req.query;
    
    // Default to current month
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const logs = await TimeLog.getByUser(req.user.id, startDate, endDate);
    
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
    const { start_date, end_date } = req.query;
    const adminId = req.user.id;
    
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const logs = await TimeLog.getAll(startDate, endDate, adminId);
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
    const { start_date, end_date } = req.query;
    const adminId = req.user.id;
    
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const summary = await TimeLog.getUserSummary(startDate, endDate, adminId);
    
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
    const { start_date, end_date } = req.query;
    
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const logs = await TimeLog.getByUser(userId, startDate, endDate);
    
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
