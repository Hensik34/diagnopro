const { Op } = require("sequelize");
const { TimeLog, User } = require("./index");

// Clock in / Checkin
exports.clockIn = async (userId, branchId, options = {}) => {
  const { start_km, start_meter_image, location_meta, is_outside, outside_reason } = options;
  const now = new Date();
  
  return await TimeLog.create({
    user_id: userId,
    clock_in: now,
    requested_clock_in: now,
    branch_id: branchId,
    start_km: start_km != null ? parseFloat(start_km) : null,
    start_meter_image: start_meter_image || null,
    location_meta: location_meta || {},
    is_outside: !!is_outside,
    outside_reason: outside_reason || null,
    approval_status: is_outside ? "pending" : "approved",
  });
};

// Clock out / Checkout
exports.clockOut = async (userId, notes, options = {}) => {
  const { end_km, end_meter_image, location_meta, is_outside, outside_reason } = options;
  
  const record = await TimeLog.findOne({
    where: { 
      user_id: userId, 
      clock_out: null,
      approval_status: { [Op.ne]: "rejected" }
    },
    order: [["clock_in", "DESC"]],
  });
  
  if (!record) return null;

  const now = new Date();
  record.clock_out = now;
  record.requested_clock_out = now;
  
  const rawHours = parseFloat(((record.clock_out - record.clock_in) / 3600000).toFixed(2));
  const penalty = parseFloat(record.penalty_hours || 0);
  record.total_hours = Math.max(0, parseFloat((rawHours - penalty).toFixed(2)));

  if (notes) record.notes = notes;

  if (end_km != null) {
    record.end_km = parseFloat(end_km);
    if (record.start_km != null) {
      record.total_km = Math.max(0, parseFloat(record.end_km) - parseFloat(record.start_km));
    }
  }

  if (end_meter_image) {
    record.end_meter_image = end_meter_image;
  }

  if (is_outside) {
    record.is_outside = true;
    record.outside_reason = outside_reason || null;
    record.approval_status = "pending";
  }

  if (location_meta) {
    const existingMeta = record.location_meta || {};
    record.location_meta = {
      ...existingMeta,
      clock_out: location_meta.clock_out || location_meta,
    };
  }

  await record.save();
  return record.toJSON();
};

// Get active (open) session for a user
exports.getActiveSession = async (userId) => {
  return await TimeLog.findOne({
    where: { 
      user_id: userId, 
      clock_out: null,
      approval_status: { [Op.ne]: "rejected" }
    },
    order: [["clock_in", "DESC"]],
    raw: true,
  });
};

// Get pending outside checkin/checkout approvals
exports.getPendingApprovals = async (adminId, branchId) => {
  const where = {
    approval_status: "pending",
  };
  if (branchId) {
    where.branch_id = branchId;
  }

  return await TimeLog.findAll({
    where,
    include: [{
      model: User,
      as: "user",
      attributes: ["id", "firstname", "lastname", "email", "role"],
      where: {
        [Op.or]: [{ created_by: adminId }, { id: adminId }],
      },
    }],
    order: [["clock_in", "DESC"]],
    raw: true,
    nest: true,
  });
};

// Approve a checkin/checkout request
exports.approveClockRequest = async (id, adminId) => {
  const record = await TimeLog.findByPk(id);
  if (!record) return null;

  record.approval_status = "approved";
  record.approved_by = adminId;
  record.approved_at = new Date();
  
  await record.save();
  return record.toJSON();
};

// Reject a checkin/checkout request
exports.rejectClockRequest = async (id, adminId, rejectionNote) => {
  const record = await TimeLog.findByPk(id);
  if (!record) return null;

  record.approved_by = adminId;
  record.approved_at = new Date();
  record.rejection_note = rejectionNote || "Outside checkin/checkout rejected by admin";

  if (!record.clock_out) {
    // Checkin rejection: shift canceled/rejected
    record.approval_status = "rejected";
  } else {
    // Checkout rejection: complete checkout with 1-hour penalty deduction
    record.approval_status = "rejected_with_penalty";
    record.penalty_hours = 1.0;

    const startTime = record.requested_clock_in || record.clock_in;
    const endTime = record.requested_clock_out || record.clock_out || new Date();
    const rawHours = parseFloat(((endTime - startTime) / 3600000).toFixed(2));
    record.total_hours = Math.max(0, parseFloat((rawHours - 1.0).toFixed(2)));
  }

  await record.save();
  return record.toJSON();
};

// Get time logs for a user with date range
exports.getByUser = async (userId, startDate, endDate, branchId) => {
  const where = {
    user_id: userId,
    clock_in: { [Op.gte]: startDate, [Op.lt]: endDate },
    approval_status: { [Op.ne]: "rejected" }
  };
  if (branchId) {
    where.branch_id = branchId;
  }
  return await TimeLog.findAll({
    where,
    order: [["clock_in", "DESC"]],
    raw: true,
  });
};

// Get all users' time logs (admin)
exports.getAll = async (startDate, endDate, adminId, branchId) => {
  const where = {
    clock_in: { [Op.gte]: startDate, [Op.lt]: endDate },
    approval_status: { [Op.ne]: "rejected" }
  };
  if (branchId) {
    where.branch_id = branchId;
  }
  return await TimeLog.findAll({
    where,
    include: [{
      model: User,
      as: "user",
      attributes: ["firstname", "lastname", "email", "role"],
      where: {
        [Op.or]: [{ created_by: adminId }, { id: adminId }],
      },
    }],
    order: [["clock_in", "DESC"]],
    raw: true,
    nest: true,
  });
};

// Get summary of hours per user
exports.getUserSummary = async (startDate, endDate, adminId, branchId) => {
  const { sequelize } = require("./index");
  let branchJoin = "";
  let branchFilter = "";
  const replacements = { startDate, endDate, adminId };
  if (branchId) {
    branchJoin = "INNER JOIN user_branches ub ON u.id = ub.user_id AND ub.branch_id = :branchId";
    branchFilter = "AND tl.branch_id = :branchId";
    replacements.branchId = branchId;
  }
  
  const [results] = await sequelize.query(
    `SELECT
        u.id as user_id, u.firstname, u.lastname, u.email, u.role, u.petrol_price_per_km,
        COUNT(tl.id) as total_sessions,
        COALESCE(SUM(tl.total_hours), 0) as total_hours,
        COALESCE(SUM(tl.total_km), 0) as total_km,
        COALESCE(SUM(tl.penalty_hours), 0) as total_penalty_hours,
        MIN(tl.clock_in) as first_clock_in,
        MAX(tl.clock_out) as last_clock_out
     FROM users u
     ${branchJoin}
     LEFT JOIN time_logs tl ON u.id = tl.user_id
       AND tl.clock_in >= :startDate AND tl.clock_in < :endDate 
       AND tl.approval_status != 'rejected' ${branchFilter}
     WHERE u.is_active = true AND u.role != 'admin'
       AND (u.created_by = :adminId OR u.id = :adminId)
     GROUP BY u.id, u.firstname, u.lastname, u.email, u.role, u.petrol_price_per_km
     ORDER BY total_hours DESC`,
    { replacements }
  );
  return results;
};

// Delete a time log
exports.deleteLog = async (id) => {
  const record = await TimeLog.findByPk(id);
  if (!record) return null;
  await record.destroy();
  return record.toJSON();
};
