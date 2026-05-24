const { Op } = require("sequelize");
const { Test, UserTest, TestField, UserTestField, sequelize } = require("./index");

// Get all tests for a branch with optional user-specific overrides
exports.getAllTests = async (branchId, userId = null) => {
  const tests = await Test.findAll({
    where: branchId ? { branch_id: branchId } : {},
    order: [["category", "ASC"], ["test_name", "ASC"]],
    raw: true,
  });

  if (!userId) return tests;

  // Get user overrides
  const testIds = tests.map((t) => t.id);
  const overrides = await UserTest.findAll({
    where: { user_id: userId, test_id: { [Op.in]: testIds } },
    raw: true,
  });
  const overrideMap = new Map(overrides.map((o) => [o.test_id, o]));

  return tests.map((t) => {
    const ov = overrideMap.get(t.id);
    if (!ov) return { ...t, has_user_override: false };
    return {
      ...t,
      test_name: ov.test_name || t.test_name,
      category: ov.category || t.category,
      sample_type: ov.sample_type || t.sample_type,
      price: ov.price || t.price,
      turnaround_time: ov.turnaround_time || t.turnaround_time,
      description: ov.description || t.description,
      has_user_override: true,
    };
  });
};

// Get test by ID with optional user-specific override
exports.getTestById = async (id, userId = null) => {
  const test = await Test.findByPk(id, { raw: true });
  if (!test || !userId) return test;

  const ov = await UserTest.findOne({
    where: { user_id: userId, test_id: id },
    raw: true,
  });
  if (!ov) return { ...test, has_user_override: false };

  return {
    ...test,
    test_name: ov.test_name || test.test_name,
    category: ov.category || test.category,
    sample_type: ov.sample_type || test.sample_type,
    price: ov.price || test.price,
    turnaround_time: ov.turnaround_time || test.turnaround_time,
    description: ov.description || test.description,
    has_user_override: true,
  };
};

// Create new test
exports.createTest = async (testData) => {
  return await Test.create(testData);
};

// Update test - supports user-specific override
exports.updateTest = async (id, testData, userId = null, userRole = null) => {
  const { test_name, category, sample_type, price, turnaround_time, description } = testData;

  if (!userId || userRole === "admin") {
    const [count, [updated]] = await Test.update(
      { test_name, category, sample_type, price, turnaround_time, description },
      { where: { id }, returning: true }
    );
    return updated ? updated.toJSON() : null;
  }

  // Non-admin: upsert user override
  const [record] = await UserTest.upsert(
    { user_id: userId, test_id: id, test_name, category, sample_type, price, turnaround_time, description },
    { returning: true }
  );
  return record.toJSON();
};

// Delete test
exports.deleteTest = async (id) => {
  const deleted = await Test.destroy({ where: { id } });
  return deleted ? { id } : null;
};

// Get tests by category
exports.getTestsByCategory = async (category, branchId, userId = null) => {
  const tests = await Test.findAll({
    where: branchId ? { category, branch_id: branchId } : { category },
    order: [["test_name", "ASC"]],
    raw: true,
  });

  if (!userId) return tests;

  const testIds = tests.map((t) => t.id);
  const overrides = await UserTest.findAll({
    where: { user_id: userId, test_id: { [Op.in]: testIds } },
    raw: true,
  });
  const overrideMap = new Map(overrides.map((o) => [o.test_id, o]));

  return tests.map((t) => {
    const ov = overrideMap.get(t.id);
    if (!ov) return { ...t, has_user_override: false };
    return {
      ...t,
      test_name: ov.test_name || t.test_name,
      category: ov.category || t.category,
      has_user_override: true,
    };
  });
};

// Get tests for a sample (via sample_tests)
exports.getTestsForSample = async (sampleId) => {
  const { SampleTest } = require("./index");
  return await SampleTest.findAll({
    where: { sample_id: sampleId },
    include: [{ model: Test, attributes: ["test_name", "test_code", "category"] }],
    order: [["created_at", "DESC"]],
    raw: true,
    nest: true,
  });
};

// Add test to sample
exports.addTestToSample = async (sampleId, testId) => {
  const { SampleTest } = require("./index");
  const [record, created] = await SampleTest.findOrCreate({
    where: { sample_id: sampleId, test_id: testId },
    defaults: { sample_id: sampleId, test_id: testId },
  });
  return record;
};

// Update test result
exports.updateTestResult = async (sampleTestId, resultData) => {
  const { SampleTest } = require("./index");
  const [count, [updated]] = await SampleTest.update(
    { ...resultData, status: "completed" },
    { where: { id: sampleTestId }, returning: true }
  );
  return updated ? updated.toJSON() : null;
};

// Clone all default tests from source branch to target branch
exports.cloneTestsForBranch = async (sourceBranchId, targetBranchId) => {
  const t = await sequelize.transaction();
  try {
    const sourceTests = await Test.findAll({
      where: { branch_id: sourceBranchId },
      raw: true,
      transaction: t,
    });

    for (const test of sourceTests) {
      const existing = await Test.findOne({
        where: { test_code: test.test_code, branch_id: targetBranchId },
        transaction: t,
      });
      if (existing) continue;

      const newTest = await Test.create(
        { ...test, id: undefined, branch_id: targetBranchId, created_at: undefined, updated_at: undefined },
        { transaction: t }
      );

      const fields = await TestField.findAll({
        where: { test_id: test.id },
        order: [["order_index", "ASC"]],
        raw: true,
        transaction: t,
      });

      for (const field of fields) {
        await TestField.create(
          { ...field, id: undefined, test_id: newTest.id, created_at: undefined, updated_at: undefined },
          { transaction: t }
        );
      }
    }

    await t.commit();
    return true;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

// Reset user-specific override
exports.resetUserOverride = async (testId, userId) => {
  const t = await sequelize.transaction();
  try {
    await UserTest.destroy({ where: { test_id: testId, user_id: userId }, transaction: t });
    await UserTestField.destroy({ where: { test_id: testId, user_id: userId }, transaction: t });
    await t.commit();
    return true;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};
