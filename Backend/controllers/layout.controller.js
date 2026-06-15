const { UserTest, Test } = require("../models");
const TestFieldHelper = require("../models/TestField");

// GET TEST LAYOUT CONFIGURATION
exports.getTestLayout = async (req, res) => {
  try {
    const { testId } = req.params;
    const branchId = req.query?.branch_id || req.body?.branch_id || req.user?.branch_id;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    // Get the master test to verify it exists and get its default name
    const test = await Test.findByPk(testId);
    
    // Get the branch test override if it exists
    const userTest = await UserTest.findOne({
      where: { test_id: testId, branch_id: branchId }
    });

    const testName = userTest?.test_name || test?.test_name;
    if (!testName) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Fetch the branch fields / merged fields
    const fields = await TestFieldHelper.getFieldsByTestId(testId, branchId);

    // Get layout config
    let layoutConfig = userTest?.layout_config || null;

    // Reconciliation logic:
    // If layoutConfig exists, check if there are any new fields or deleted fields.
    if (layoutConfig && Array.isArray(layoutConfig.parameterSettings)) {
      const fieldMap = new Map(fields.map(f => [f.id, f]));
      const configFieldIds = new Set(layoutConfig.parameterSettings.map(s => s.fieldId));

      // 1. Filter out parameter settings for fields that no longer exist in DB
      let parameterSettings = layoutConfig.parameterSettings.filter(s => fieldMap.has(s.fieldId));

      // 2. Add any fields that exist in the test fields but are missing from layout config
      const newSettings = [];
      let maxPosition = parameterSettings.reduce((max, s) => Math.max(max, s.position || 0), 0);

      for (const field of fields) {
        if (!configFieldIds.has(field.id)) {
          maxPosition += 1;
          newSettings.push({
            fieldId: field.id,
            fieldName: field.field_name,
            position: maxPosition,
            visible: true,
            group: field.section_group || ""
          });
        }
      }

      if (newSettings.length > 0) {
        parameterSettings = [...parameterSettings, ...newSettings];
        layoutConfig = {
          ...layoutConfig,
          parameterSettings
        };
      }
    }

    res.json({
      testId,
      testName,
      layoutConfig,
      fields,
      hasBranchOverride: !!userTest,
      clinical_significance: userTest?.clinical_significance || test?.clinical_significance || '',
      updated_at: userTest?.updated_at || test?.updated_at || new Date().toISOString()
    });

  } catch (err) {
    console.error("Get test layout error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE TEST LAYOUT CONFIGURATION
exports.updateTestLayout = async (req, res) => {
  try {
    const { testId } = req.params;
    const branchId = req.query?.branch_id || req.body?.branch_id || req.user?.branch_id;
    const { layoutConfig, clinical_significance, updated_at } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    if (!layoutConfig) {
      return res.status(400).json({ error: "layoutConfig is required" });
    }

    // Get current UserTest if it exists
    let userTest = await UserTest.findOne({
      where: { test_id: testId, branch_id: branchId }
    });

    // Optimistic locking check:
    if (userTest && updated_at) {
      const dbTime = new Date(userTest.updated_at).getTime();
      const reqTime = new Date(updated_at).getTime();
      if (dbTime !== reqTime) {
        return res.status(409).json({
          error: "Conflict: The layout has been modified by another user. Please reload and try again."
        });
      }
    }

    // Validate layoutConfig structure if needed
    if (layoutConfig.parameterSettings && Array.isArray(layoutConfig.parameterSettings)) {
      // Ensure positions are unique
      const positions = layoutConfig.parameterSettings.map(s => s.position);
      const uniquePositions = new Set(positions);
      if (positions.length !== uniquePositions.size) {
        return res.status(400).json({ error: "Each parameter must have a unique position" });
      }
    }

    let record;
    if (userTest) {
      userTest.layout_config = layoutConfig;
      userTest.clinical_significance = clinical_significance;
      userTest.updated_at = new Date();
      await userTest.save();
      record = userTest;
    } else {
      // Master test is copied to branch override if it doesn't exist
      const test = await Test.findByPk(testId);
      if (!test) {
        return res.status(404).json({ error: "Master test not found" });
      }

      record = await UserTest.create({
        branch_id: branchId,
        test_id: testId,
        test_name: test.test_name,
        category: test.category,
        sample_type: test.sample_type,
        price: test.price,
        turnaround_time: test.turnaround_time,
        description: test.description,
        layout_config: layoutConfig,
        clinical_significance: clinical_significance,
        updated_at: new Date()
      });
    }

    res.json({
      message: "Layout configuration saved successfully",
      data: {
        testId: record.test_id,
        layoutConfig: record.layout_config,
        updated_at: record.updated_at
      }
    });

  } catch (err) {
    console.error("Update test layout error:", err);
    res.status(500).json({ error: err.message });
  }
};
