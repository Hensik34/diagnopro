const { Op } = require("sequelize");
const { Test, UserTest, UserTestField, sequelize } = require("./index");

// Get all tests with optional branch-specific overrides
exports.getAllTests = async (branchId = null) => {
  const tests = await Test.findAll({
    order: [["category", "ASC"], ["test_name", "ASC"]],
    raw: true,
  });

  if (!branchId) {
    return tests.map((t) => ({ ...t, has_branch_override: false }));
  }

  const testIds = tests.map((t) => t.id);
  if (testIds.length === 0) return [];

  const overrides = await UserTest.findAll({
    where: { branch_id: branchId, test_id: { [Op.in]: testIds } },
    raw: true,
  });
  const overrideMap = new Map(overrides.map((o) => [o.test_id, o]));

  return tests.map((t) => {
    const ov = overrideMap.get(t.id);
    if (!ov) return { ...t, has_branch_override: false };
    return {
      ...t,
      test_name: ov.test_name ?? t.test_name,
      category: ov.category ?? t.category,
      sample_type: ov.sample_type ?? t.sample_type,
      price: ov.price ?? t.price,
      turnaround_time: ov.turnaround_time ?? t.turnaround_time,
      description: ov.description ?? t.description,
      has_branch_override: true,
    };
  });
};

// Get test by ID with optional branch-specific override
exports.getTestById = async (id, branchId = null) => {
  const test = await Test.findByPk(id, { raw: true });
  if (!test) return null;
  if (!branchId) return { ...test, has_branch_override: false };

  const ov = await UserTest.findOne({
    where: { branch_id: branchId, test_id: id },
    raw: true,
  });
  if (!ov) return { ...test, has_branch_override: false };

  return {
    ...test,
    test_name: ov.test_name ?? test.test_name,
    category: ov.category ?? test.category,
    sample_type: ov.sample_type ?? test.sample_type,
    price: ov.price ?? test.price,
    turnaround_time: ov.turnaround_time ?? test.turnaround_time,
    description: ov.description ?? test.description,
    has_branch_override: true,
  };
};

// Create new test
exports.createTest = async (testData) => {
  return await Test.create(testData);
};

// Update test - admin edits defaults, others edit branch override
exports.updateTest = async (id, testData, branchId = null, userRole = null) => {
  const { test_name, category, sample_type, price, turnaround_time, description } = testData;

  if (userRole === "admin") {
    const [count, [updated]] = await Test.update(
      { test_name, category, sample_type, price, turnaround_time, description },
      { where: { id }, returning: true }
    );
    return updated ? updated.toJSON() : null;
  }

  if (!branchId) {
    throw new Error("branch_id is required for branch overrides");
  }

  const [record] = await UserTest.upsert(
    { branch_id: branchId, test_id: id, test_name, category, sample_type, price, turnaround_time, description },
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
exports.getTestsByCategory = async (category, branchId = null) => {
  const tests = await Test.findAll({
    where: { category },
    order: [["test_name", "ASC"]],
    raw: true,
  });

  if (!branchId) {
    return tests.map((t) => ({ ...t, has_branch_override: false }));
  }

  const testIds = tests.map((t) => t.id);
  if (testIds.length === 0) return [];

  const overrides = await UserTest.findAll({
    where: { branch_id: branchId, test_id: { [Op.in]: testIds } },
    raw: true,
  });
  const overrideMap = new Map(overrides.map((o) => [o.test_id, o]));

  return tests.map((t) => {
    const ov = overrideMap.get(t.id);
    if (!ov) return { ...t, has_branch_override: false };
    return {
      ...t,
      test_name: ov.test_name ?? t.test_name,
      category: ov.category ?? t.category,
      has_branch_override: true,
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

// Reset branch-specific override
exports.resetBranchOverride = async (testId, branchId) => {
  const t = await sequelize.transaction();
  try {
    await UserTest.destroy({ where: { test_id: testId, branch_id: branchId }, transaction: t });
    await UserTestField.destroy({ where: { test_id: testId, branch_id: branchId }, transaction: t });
    await t.commit();
    return true;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};
