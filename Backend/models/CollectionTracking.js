const { Op, literal, fn, col } = require("sequelize");
const { SampleCollectionTracking, User, Branch } = require("./index");

/**
 * Get all collection tracking records with filters
 */
exports.getAll = async (filters = {}) => {
  const where = {};
  if (filters.staff_id) where.staff_id = filters.staff_id;
  if (filters.branch_id) where.branch_id = filters.branch_id;
  if (filters.date) where.date = filters.date;
  if (filters.date_from && filters.date_to) {
    where.date = { [Op.between]: [filters.date_from, filters.date_to] };
  } else if (filters.date_from) {
    where.date = { [Op.gte]: filters.date_from };
  } else if (filters.date_to) {
    where.date = { [Op.lte]: filters.date_to };
  }

  const rows = await SampleCollectionTracking.findAll({
    where,
    include: [
      { model: User, as: "staff", attributes: ["firstname", "lastname", "petrol_price_per_km"] },
      { model: Branch, as: "branch", attributes: ["name"] },
    ],
    order: [["date", "DESC"], ["created_at", "DESC"]],
    raw: true,
    nest: true,
  });

  return rows.map((r) => ({
    ...r,
    staff_firstname: r.staff?.firstname,
    staff_lastname: r.staff?.lastname,
    staff_petrol_price: r.staff?.petrol_price_per_km,
    branch_name: r.branch?.name,
  }));
};

/**
 * Get a single record by id
 */
exports.getById = async (id) => {
  const r = await SampleCollectionTracking.findByPk(id, {
    include: [
      { model: User, as: "staff", attributes: ["firstname", "lastname"] },
      { model: Branch, as: "branch", attributes: ["name"] },
    ],
    raw: true,
    nest: true,
  });
  if (!r) return null;
  return {
    ...r,
    staff_firstname: r.staff?.firstname,
    staff_lastname: r.staff?.lastname,
    branch_name: r.branch?.name,
  };
};

/**
 * Get today's records for a specific staff member
 */
exports.getTodayByStaff = async (staffId) => {
  const today = new Date().toISOString().split("T")[0];
  const rows = await SampleCollectionTracking.findAll({
    where: { staff_id: staffId, date: today },
    include: [
      { model: User, as: "staff", attributes: ["firstname", "lastname"] },
    ],
    order: [["created_at", "DESC"]],
    raw: true,
    nest: true,
  });
  return rows.map((r) => ({
    ...r,
    staff_firstname: r.staff?.firstname,
    staff_lastname: r.staff?.lastname,
  }));
};

/**
 * Create a new tracking record
 */
exports.create = async (data) => {
  const start = data.start_km != null ? Number(data.start_km) : null;
  const end = data.end_km != null ? Number(data.end_km) : null;
  const total_km = (start != null && end != null) ? Math.max(0, end - start) : null;

  return await SampleCollectionTracking.create({
    staff_id: data.staff_id,
    branch_id: data.branch_id || null,
    date: data.date || new Date(),
    start_km: start,
    end_km: end,
    total_km: total_km,
    start_meter_image: data.start_meter_image || null,
    end_meter_image: data.end_meter_image || null,
    bike_image: data.bike_image || null,
    visit_charge: data.visit_charge || 0,
    per_km_rate: data.per_km_rate || 0,
  });
};

/**
 * Update a tracking record
 */
exports.update = async (id, data) => {
  const record = await SampleCollectionTracking.findByPk(id);
  if (!record) return null;

  if (data.start_km !== undefined) record.start_km = data.start_km;
  if (data.end_km !== undefined) record.end_km = data.end_km;
  
  // Calculate/recalculate total_km
  const start = record.start_km != null ? Number(record.start_km) : null;
  const end = record.end_km != null ? Number(record.end_km) : null;
  if (start != null && end != null) {
    record.total_km = Math.max(0, end - start);
  } else {
    record.total_km = null;
  }

  if (data.start_meter_image !== undefined) record.start_meter_image = data.start_meter_image;
  if (data.end_meter_image !== undefined) record.end_meter_image = data.end_meter_image;
  if (data.bike_image !== undefined) record.bike_image = data.bike_image;
  if (data.visit_charge !== undefined) record.visit_charge = data.visit_charge;
  if (data.per_km_rate !== undefined) record.per_km_rate = data.per_km_rate;

  await record.save();
  return record.toJSON();
};

/**
 * Delete a tracking record
 */
exports.delete = async (id) => {
  const deleted = await SampleCollectionTracking.destroy({ where: { id } });
  return deleted ? { id } : null;
};

/**
 * Get salary summary for a staff member over a date range
 */
exports.getSalarySummary = async (staffId, dateFrom, dateTo) => {
  const { sequelize } = require("./index");
  const [result] = await sequelize.query(
    `SELECT
       COUNT(*) AS total_days,
       SUM(GREATEST(0, COALESCE(end_km, 0) - COALESCE(start_km, 0))) AS total_km,
       SUM(GREATEST(0, COALESCE(end_km, 0) - COALESCE(start_km, 0)) * per_km_rate) AS km_payment,
       SUM(visit_charge) AS total_visit_charges,
       SUM(GREATEST(0, COALESCE(end_km, 0) - COALESCE(start_km, 0)) * per_km_rate + visit_charge) AS total_amount
     FROM sample_collection_tracking
     WHERE staff_id = :staffId AND date >= :dateFrom AND date <= :dateTo`,
    { replacements: { staffId, dateFrom, dateTo }, type: sequelize.QueryTypes ? sequelize.QueryTypes.SELECT : 'SELECT' }
  );
  return result || {};
};
