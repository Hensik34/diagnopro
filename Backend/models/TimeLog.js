const { Op, fn, col, literal } = require("sequelize");
const { TimeLog, User } = require("./index");

// Clock in
exports.clockIn = async (userId) => {
  return await TimeLog.create({ user_id: userId, clock_in: new Date() });
};

// Clock out
exports.clockOut = async (userId, notes) => {
  const record = await TimeLog.findOne({
    where: { user_id: userId, clock_out: null },
    order: [["clock_in", "DESC"]],
  });
  if (!record) return null;

  record.clock_out = new Date();
  record.total_hours = parseFloat(
    ((record.clock_out - record.clock_in) / 3600000).toFixed(2)
  );
  if (notes) record.notes = notes;
  await record.save();
  return record.toJSON();
};

// Get active (open) session for a user
exports.getActiveSession = async (userId) => {
  return await TimeLog.findOne({
    where: { user_id: userId, clock_out: null },
    order: [["clock_in", "DESC"]],
    raw: true,
  });
};

// Get time logs for a user with date range
exports.getByUser = async (userId, startDate, endDate) => {
  return await TimeLog.findAll({
    where: {
      user_id: userId,
      clock_in: { [Op.gte]: startDate, [Op.lt]: endDate },
    },
    order: [["clock_in", "DESC"]],
    raw: true,
  });
};

// Get all users' time logs (admin)
exports.getAll = async (startDate, endDate, adminId) => {
  return await TimeLog.findAll({
    where: {
      clock_in: { [Op.gte]: startDate, [Op.lt]: endDate },
    },
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
exports.getUserSummary = async (startDate, endDate, adminId) => {
  const { sequelize } = require("./index");
  const [results] = await sequelize.query(
    `SELECT
        u.id as user_id, u.firstname, u.lastname, u.email, u.role,
        COUNT(tl.id) as total_sessions,
        COALESCE(SUM(tl.total_hours), 0) as total_hours,
        MIN(tl.clock_in) as first_clock_in,
        MAX(tl.clock_out) as last_clock_out
     FROM users u
     LEFT JOIN time_logs tl ON u.id = tl.user_id
       AND tl.clock_in >= :startDate AND tl.clock_in < :endDate
     WHERE u.is_active = true AND u.role != 'admin'
       AND (u.created_by = :adminId OR u.id = :adminId)
     GROUP BY u.id, u.firstname, u.lastname, u.email, u.role
     ORDER BY total_hours DESC`,
    { replacements: { startDate, endDate, adminId } }
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
