const { Op } = require("sequelize");
const { Test, UserTest, UserTestField, sequelize } = require("./index");

// Get all tests with optional branch-specific overrides
exports.getAllTests = async (branchId = null) => {
  const tests = await Test.findAll({
    order: [["category", "ASC"], ["test_name", "ASC"]],
    raw: true,
  });

  if (!branchId) {
    return tests.map((t) => ({ ...t, has_branch_override: false, base_price: t.price }));
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
    if (!ov) return { ...t, has_branch_override: false, base_price: t.price };
    return {
      ...t,
      test_name: ov.test_name ?? t.test_name,
      category: ov.category ?? t.category,
      sample_type: ov.sample_type ?? t.sample_type,
      price: ov.price ?? t.price,
      turnaround_time: ov.turnaround_time ?? t.turnaround_time,
      description: ov.description ?? t.description,
      clinical_significance: ov.clinical_significance ?? t.clinical_significance,
      has_branch_override: true,
      base_price: t.price,
    };
  });
};

// Get test by ID with optional branch-specific override
exports.getTestById = async (id, branchId = null) => {
  const test = await Test.findByPk(id, { raw: true });
  if (!test) return null;
  if (!branchId) return { ...test, has_branch_override: false, base_price: test.price };

  const ov = await UserTest.findOne({
    where: { branch_id: branchId, test_id: id },
    raw: true,
  });
  if (!ov) return { ...test, has_branch_override: false, base_price: test.price };

  return {
    ...test,
    test_name: ov.test_name ?? test.test_name,
    category: ov.category ?? test.category,
    sample_type: ov.sample_type ?? test.sample_type,
    price: ov.price ?? test.price,
    turnaround_time: ov.turnaround_time ?? test.turnaround_time,
    description: ov.description ?? test.description,
    clinical_significance: ov.clinical_significance ?? test.clinical_significance,
    has_branch_override: true,
    base_price: test.price,
  };
};

// Create new test
exports.createTest = async (testData) => {
  return await Test.create(testData);
};

// Update test - admin without branchId edits defaults, otherwise create/update branch override
exports.updateTest = async (id, testData, branchId = null, userRole = null) => {
  const { test_name, category, sample_type, price, turnaround_time, description, clinical_significance } = testData;

  // Only modify the global test when admin AND no branch context
  if (userRole === "admin" && !branchId) {
    const [count, [updated]] = await Test.update(
      { test_name, category, sample_type, price, turnaround_time, description, clinical_significance },
      { where: { id }, returning: true }
    );
    return updated ? updated.toJSON() : null;
  }

  if (!branchId) {
    throw new Error("branch_id is required for branch overrides");
  }

  // Fetch existing branch-specific override to preserve fields like layout_config and clinical_significance
  const existing = await UserTest.findOne({ where: { branch_id: branchId, test_id: id } });

  const updateDataMerged = {
    branch_id: branchId,
    test_id: id,
    test_name,
    category,
    sample_type,
    price,
    turnaround_time,
    description,
    clinical_significance: clinical_significance !== undefined ? clinical_significance : (existing ? existing.clinical_significance : null),
    layout_config: existing ? existing.layout_config : null
  };

  // If creating override for first time, copy global default clinical significance
  if (!existing) {
    const defaultTest = await Test.findByPk(id);
    if (defaultTest && updateDataMerged.clinical_significance === null) {
      updateDataMerged.clinical_significance = defaultTest.clinical_significance;
    }
  }

  // Create or update a branch-specific override (works for admins and non-admins)
  const [record] = await UserTest.upsert(updateDataMerged, { returning: true });
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
      sample_type: ov.sample_type ?? t.sample_type,
      price: ov.price ?? t.price,
      turnaround_time: ov.turnaround_time ?? t.turnaround_time,
      description: ov.description ?? t.description,
      clinical_significance: ov.clinical_significance ?? t.clinical_significance,
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

// Bulk update branch overrides (base prices)
exports.bulkUpdateBranchPrices = async (branchId, updates) => {
  const t = await sequelize.transaction();
  try {
    for (const item of updates) {
      const { test_id, price } = item;
      const existing = await UserTest.findOne({ where: { branch_id: branchId, test_id } });
      if (existing) {
        if (price === null) {
          // Revert to global default by deleting override
          await UserTest.destroy({ where: { branch_id: branchId, test_id }, transaction: t });
        } else {
          await UserTest.update(
            { price: Number(price) },
            { where: { branch_id: branchId, test_id }, transaction: t }
          );
        }
      } else if (price !== null) {
        // Create branch override by fetching global test details first
        const globalTest = await Test.findByPk(test_id);
        if (globalTest) {
          await UserTest.create({
            branch_id: branchId,
            test_id,
            test_name: globalTest.test_name,
            category: globalTest.category,
            sample_type: globalTest.sample_type,
            price: Number(price),
            turnaround_time: globalTest.turnaround_time,
            description: globalTest.description,
            clinical_significance: globalTest.clinical_significance,
          }, { transaction: t });
        }
      }
    }
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
