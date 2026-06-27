const Test = require("../models/Test");
const TestField = require("../models/TestField");
const TestPackage = require("../models/TestPackage");

// GET ALL TESTS
exports.getTests = async (req, res) => {
  try {
    const { category, branch_id } = req.query;

    if (!branch_id) {
      return res.status(400).json({ error: "branch_id is required" });
    }

    let tests;
    if (category) {
      tests = await Test.getTestsByCategory(category, branch_id);
    } else {
      tests = await Test.getAllTests(branch_id);
    }

    res.json({
      message: "Tests retrieved successfully",
      count: tests.length,
      data: tests
    });
  } catch (err) {
    console.error("Get tests error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET TEST BY ID
exports.getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_id } = req.query;

    const test = await Test.getTestById(id, branch_id || null);

    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    res.json({
      message: "Test retrieved successfully",
      data: test
    });
  } catch (err) {
    console.error("Get test error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE TEST
exports.createTest = async (req, res) => {
  try {
    const { test_name, test_code, category, sample_type, price, turnaround_time, description } = req.body;

    // Validation
    if (!test_name || !test_code) {
      return res.status(400).json({ 
        error: "test_name and test_code are required" 
      });
    }

    const test = await Test.createTest({
      test_name,
      test_code,
      category,
      sample_type,
      price,
      turnaround_time,
      description
    });

    res.status(201).json({
      message: "Test created successfully",
      data: test
    });
  } catch (err) {
    console.error("Create test error:", err);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ error: "Test code already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

// UPDATE TEST
exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { test_name, category, sample_type, price, turnaround_time, description, clinical_significance } = req.body || {};
    const branchId = req.body?.branch_id || req.query?.branch_id || null;
    const userRole = req.user?.role; // Get user's role

    const test = await Test.updateTest(id, {
      test_name,
      category,
      sample_type,
      price,
      turnaround_time,
      description,
      clinical_significance
    }, branchId, userRole); // Pass role for permission check

    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    res.json({
      message: "Test updated successfully",
      data: test
    });
  } catch (err) {
    console.error("Update test error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE TEST
exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Test.deleteTest(id);

    if (!result) {
      return res.status(404).json({ error: "Test not found" });
    }

    res.json({
      message: "Test deleted successfully",
      data: result
    });
  } catch (err) {
    console.error("Delete test error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET TESTS FOR A SAMPLE
exports.getTestsForSample = async (req, res) => {
  try {
    const { sampleId } = req.params;

    const tests = await Test.getTestsForSample(sampleId);

    res.json({
      message: "Sample tests retrieved successfully",
      count: tests.length,
      data: tests
    });
  } catch (err) {
    console.error("Get sample tests error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ADD TEST TO SAMPLE
exports.addTestToSample = async (req, res) => {
  try {
    const { sampleId } = req.params;
    const { test_id } = req.body;

    if (!test_id) {
      return res.status(400).json({ error: "test_id is required" });
    }

    const result = await Test.addTestToSample(sampleId, test_id);

    if (!result) {
      return res.status(400).json({ error: "Test already added to sample or invalid IDs" });
    }

    res.status(201).json({
      message: "Test added to sample successfully",
      data: result
    });
  } catch (err) {
    console.error("Add test to sample error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE TEST RESULT
exports.updateTestResult = async (req, res) => {
  try {
    const { sampleTestId } = req.params;
    const { result, result_unit, reference_range } = req.body;
    const performed_by = req.user.id;

    const testResult = await Test.updateTestResult(sampleTestId, {
      result,
      result_unit,
      reference_range,
      performed_by
    });

    if (!testResult) {
      return res.status(404).json({ error: "Sample test not found" });
    }

    res.json({
      message: "Test result updated successfully",
      data: testResult
    });
  } catch (err) {
    console.error("Update test result error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// TEST FIELDS (Dynamic Parameters)
// ==========================================

// GET FIELDS FOR A TEST
exports.getTestFields = async (req, res) => {
  try {
    const { testId } = req.params;
    const branchId = req.query.branch_id || null;
    const fields = await TestField.getFieldsByTestId(testId, branchId);
    res.json({ message: "Test fields retrieved", data: fields });
  } catch (err) {
    console.error("Get test fields error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET FIELDS FOR MULTIPLE TESTS
exports.getMultiTestFields = async (req, res) => {
  try {
    const { testIds, branch_id } = req.body;
    
    if (!Array.isArray(testIds) || testIds.length === 0) {
      return res.status(400).json({ error: "testIds must be a non-empty array" });
    }
    const fields = await TestField.getFieldsByTestIds(testIds, branch_id || null);
    res.json({ message: "Test fields retrieved", data: fields });
  } catch (err) {
    console.error("Get multi test fields error:", err);
    res.status(500).json({ error: err.message });
  }
};

// SET (REPLACE) ALL FIELDS FOR A TEST
exports.setTestFields = async (req, res) => {
  try {
    const { testId } = req.params;
    const { fields } = req.body || {};
    const branchId = req.body?.branch_id || req.query?.branch_id || null;
    const userRole = req.user?.role; // Get user's role

    if (!Array.isArray(fields)) {
      return res.status(400).json({ error: "fields must be an array" });
    }

    for (const f of fields) {
      if (!f.field_name || !f.field_name.trim()) {
        return res.status(400).json({ error: "Each field must have a field_name" });
      }
    }

    const result = await TestField.setFieldsForTest(testId, fields, branchId, userRole); // Pass role
    res.json({ message: "Test fields saved", data: result });
  } catch (err) {
    console.error("Set test fields error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE A SINGLE FIELD
exports.deleteTestField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const result = await TestField.deleteField(fieldId);
    if (!result) {
      return res.status(404).json({ error: "Field not found" });
    }
    res.json({ message: "Field deleted" });
  } catch (err) {
    console.error("Delete test field error:", err);
    res.status(500).json({ error: err.message });
  }
};

// RESET BRANCH TEST OVERRIDE (revert to default)
exports.resetTestOverride = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.query?.branch_id || req.body?.branch_id || null;

    if (!branchId) {
      return res.status(400).json({ error: "branch_id is required" });
    }

    await Test.resetBranchOverride(id, branchId);

    // Return merged test data after reset
    const test = await Test.getTestById(id, branchId);

    res.json({
      message: "Test reset to default successfully",
      data: test
    });
  } catch (err) {
    console.error("Reset test override error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ALL PACKAGES
exports.getPackages = async (req, res) => {
  try {
    const branchId = req.query.branch_id || null;
    if (!branchId) {
      return res.status(400).json({ error: "branch_id is required" });
    }
    const packages = await TestPackage.getAllPackages(branchId);
    res.json({
      message: "Packages retrieved successfully",
      count: packages.length,
      data: packages
    });
  } catch (err) {
    console.error("Get packages error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET PACKAGE BY ID
exports.getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await TestPackage.getPackageById(id);
    if (!pkg) {
      return res.status(404).json({ error: "Package not found" });
    }
    res.json({
      message: "Package retrieved successfully",
      data: pkg
    });
  } catch (err) {
    console.error("Get package by ID error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE PACKAGE
exports.createPackage = async (req, res) => {
  try {
    const { package_name, package_code, category, description, price, is_active, branch_id, test_ids } = req.body;
    if (!package_name || !package_code) {
      return res.status(400).json({ error: "package_name and package_code are required" });
    }
    const pkg = await TestPackage.createPackage({
      package_name,
      package_code,
      category,
      description,
      price,
      is_active,
      branch_id,
      test_ids
    });
    res.status(201).json({
      message: "Package created successfully",
      data: pkg
    });
  } catch (err) {
    console.error("Create package error:", err);
    if (err.code === '23505') {
      return res.status(400).json({ error: "Package code already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

// UPDATE PACKAGE
exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.body?.branch_id || req.query?.branch_id || null;
    const userRole = req.user?.role;
    const pkg = await TestPackage.updatePackage(id, req.body, branchId, userRole);
    if (!pkg) {
      return res.status(404).json({ error: "Package not found" });
    }
    res.json({
      message: "Package updated successfully",
      data: pkg
    });
  } catch (err) {
    console.error("Update package error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE PACKAGE
exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await TestPackage.deletePackage(id);
    if (!pkg) {
      return res.status(404).json({ error: "Package not found" });
    }
    res.json({
      message: "Package deleted successfully",
      data: pkg
    });
  } catch (err) {
    console.error("Delete package error:", err);
    res.status(500).json({ error: err.message });
  }
};

// BULK UPDATE BRANCH PRICES
exports.bulkUpdateBranchPrices = async (req, res) => {
  try {
    const { branch_id, updates } = req.body;
    if (!branch_id || !Array.isArray(updates)) {
      return res.status(400).json({ error: "branch_id and updates array are required" });
    }
    await Test.bulkUpdateBranchPrices(branch_id, updates);
    res.json({
      message: "Branch default prices updated successfully"
    });
  } catch (err) {
    console.error("Bulk update branch prices error:", err);
    res.status(500).json({ error: err.message });
  }
};
