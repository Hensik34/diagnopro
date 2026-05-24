const { B2BLab, B2BRateList, Test, sequelize } = require("./index");
const { Op } = require("sequelize");

/**
 * B2B Lab Model — Partner lab CRUD with credit limit, soft delete, optimistic locking
 */

// ==========================================
// LAB CRUD
// ==========================================

exports.createLab = async (data, transaction = null) => {
  return await B2BLab.create(data, { transaction });
};

exports.getAllLabs = async (ownerBranchId = null) => {
  const where = {};
  if (ownerBranchId) where.owner_branch_id = ownerBranchId;
  return await B2BLab.findAll({ where, order: [["created_at", "DESC"]], raw: true });
};

exports.getLabById = async (id) => {
  return await B2BLab.findByPk(id, { raw: true });
};

exports.getLabByCode = async (code) => {
  return await B2BLab.findOne({ where: { lab_code: code }, raw: true });
};

exports.getLabByUserId = async (userId) => {
  return await B2BLab.findOne({ where: { user_id: userId }, raw: true });
};

exports.updateLab = async (id, data, expectedVersion = null) => {
  const allowedFields = [
    "lab_name", "contact_person", "mobile", "email", "address", "city", "state", "pincode",
    "gst_number", "commission_type", "commission_value", "credit_limit", "lab_type",
    "status", "logo_url", "show_processing_lab", "custom_footer", "user_id",
  ];

  const updateObj = {};
  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) updateObj[key] = value;
  }

  if (Object.keys(updateObj).length === 0) return exports.getLabById(id);

  const where = { id, is_deleted: false };
  if (expectedVersion != null) where.version = expectedVersion;

  // Increment version
  updateObj.version = sequelize.literal("version + 1");

  const [count] = await B2BLab.update(updateObj, { where });

  if (count === 0 && expectedVersion != null) {
    throw new Error("CONFLICT: Lab was modified by another user. Please refresh and try again.");
  }

  return await B2BLab.findByPk(id, { raw: true });
};

exports.softDeleteLab = async (id) => {
  const [count] = await B2BLab.update(
    { is_deleted: true, deleted_at: new Date(), status: "inactive" },
    { where: { id } }
  );
  return count ? { id } : null;
};

// ==========================================
// CREDIT / BALANCE
// ==========================================

exports.updateBalance = async (labId, amount, transaction = null) => {
  const [count] = await B2BLab.update(
    { current_balance: sequelize.literal(`current_balance + ${parseFloat(amount)}`) },
    { where: { id: labId, is_deleted: false }, transaction }
  );
  if (!count) return null;
  return await B2BLab.findByPk(labId, {
    attributes: ["id", "current_balance", "credit_limit"],
    raw: true,
    transaction,
  });
};

exports.checkCreditLimit = async (labId, additionalAmount = 0) => {
  const lab = await B2BLab.findByPk(labId, {
    attributes: ["current_balance", "credit_limit"],
    raw: true,
  });
  if (!lab) return { allowed: false, reason: "Lab not found" };

  const currentBalance = parseFloat(lab.current_balance);
  const creditLimit = parseFloat(lab.credit_limit);
  const projected = currentBalance + parseFloat(additionalAmount);

  if (creditLimit > 0 && projected > creditLimit) {
    return {
      allowed: false,
      reason: "Credit limit exceeded",
      current_balance: currentBalance,
      credit_limit: creditLimit,
      projected,
    };
  }
  return { allowed: true, current_balance: currentBalance, credit_limit: creditLimit };
};

// ==========================================
// RATE LISTS
// ==========================================

exports.getRateList = async (labId) => {
  return await B2BRateList.findAll({
    where: { b2b_lab_id: labId, is_active: true },
    include: [{
      model: Test,
      as: "test",
      attributes: ["test_name", "test_code", "category", "sample_type"],
    }],
    order: [[{ model: Test, as: "test" }, "category", "ASC"], [{ model: Test, as: "test" }, "test_name", "ASC"]],
    raw: true,
    nest: true,
  });
};

exports.upsertRate = async (labId, testId, collectionPrice, processingPrice) => {
  const [record] = await B2BRateList.upsert(
    { b2b_lab_id: labId, test_id: testId, collection_price: collectionPrice, processing_price: processingPrice },
    { returning: true }
  );
  return record.toJSON();
};

exports.bulkUpsertRates = async (labId, rates) => {
  const t = await sequelize.transaction();
  try {
    const results = [];
    for (const rate of rates) {
      const [record] = await B2BRateList.upsert(
        { b2b_lab_id: labId, test_id: rate.test_id, collection_price: rate.collection_price, processing_price: rate.processing_price },
        { returning: true, transaction: t }
      );
      results.push(record.toJSON());
    }
    await t.commit();
    return results;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

exports.deleteRate = async (labId, rateId) => {
  const deleted = await B2BRateList.destroy({
    where: { id: rateId, b2b_lab_id: labId },
  });
  return deleted ? { id: rateId } : null;
};

exports.getRate = async (labId, testId) => {
  return await B2BRateList.findOne({
    where: { b2b_lab_id: labId, test_id: testId, is_active: true },
    raw: true,
  });
};
