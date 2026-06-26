const { DoctorPriceListAssignment, DoctorTestPrice, PriceList, Test, sequelize } = require("./index");

/**
 * Get all assignments with optional filters.
 */
exports.getAllAssignments = async (filters = {}) => {
  const where = {};
  if (filters.doctor_id) where.doctor_id = filters.doctor_id;
  if (filters.branch_id) where.branch_id = filters.branch_id;

  return await DoctorPriceListAssignment.findAll({
    where,
    include: [
      {
        model: PriceList,
        as: "priceList",
        attributes: ["name", "version", "is_active"],
      }
    ],
    raw: true,
    nest: true,
  });
};

/**
 * Get assignment for a doctor at a branch.
 */
exports.getAssignment = async (doctorId, branchId) => {
  return await DoctorPriceListAssignment.findOne({
    where: { doctor_id: doctorId, branch_id: branchId },
    include: [
      {
        model: PriceList,
        as: "priceList",
        attributes: ["name", "version", "is_active", "effective_from", "effective_to"],
      }
    ],
    raw: true,
    nest: true,
  });
};

/**
 * Assign a price list to a doctor at a branch.
 */
exports.assignPriceList = async (doctorId, branchId, priceListId) => {
  const [record] = await DoctorPriceListAssignment.upsert({
    doctor_id: doctorId,
    branch_id: branchId,
    price_list_id: priceListId,
  }, { returning: true });
  return record.toJSON();
};

/**
 * Remove a price list assignment.
 */
exports.removeAssignment = async (doctorId, branchId) => {
  const deleted = await DoctorPriceListAssignment.destroy({
    where: { doctor_id: doctorId, branch_id: branchId }
  });
  return deleted ? { doctor_id: doctorId, branch_id: branchId } : null;
};

/**
 * Get all overrides for a doctor at a branch.
 */
exports.getDoctorOverrides = async (doctorId, branchId) => {
  const overrides = await DoctorTestPrice.findAll({
    where: { doctor_id: doctorId, branch_id: branchId },
    include: [
      {
        model: Test,
        as: "test",
        attributes: ["test_name", "test_code", "category", "price"],
      }
    ],
    raw: true,
    nest: true,
  });

  return overrides.map(o => ({
    id: o.id,
    doctor_id: o.doctor_id,
    test_id: o.test_id,
    price: o.price,
    branch_id: o.branch_id,
    test_name: o.test?.test_name,
    test_code: o.test?.test_code,
    test_category: o.test?.category,
    base_price: o.test?.price,
  }));
};

/**
 * Upsert doctor overrides in bulk.
 */
exports.upsertOverrides = async (doctorId, branchId, overrides) => {
  const transaction = await sequelize.transaction();
  try {
    const results = [];
    for (const ov of overrides) {
      const [record] = await DoctorTestPrice.upsert({
        doctor_id: doctorId,
        branch_id: branchId,
        test_id: ov.test_id,
        price: ov.price,
      }, { transaction, returning: true });
      results.push(record);
    }
    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Delete a doctor override.
 */
exports.deleteOverride = async (doctorId, branchId, testId) => {
  const deleted = await DoctorTestPrice.destroy({
    where: { doctor_id: doctorId, branch_id: branchId, test_id: testId }
  });
  return deleted ? { doctor_id: doctorId, branch_id: branchId, test_id: testId } : null;
};
