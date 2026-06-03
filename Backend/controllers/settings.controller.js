const SettingsService = require("../services/settings.service");
const path = require("path");

const ALLOWED_SAMPLE_ID_FORMATS = ["numeric", "sm_prefix"];
const ALLOWED_SAMPLE_ID_RESET_POLICIES = ["yearly", "monthly"];

/**
 * Settings Controller - Handle branch settings including letterhead and signatures
 */

// GET SETTINGS BY BRANCH
exports.getSettings = async (req, res) => {
  try {
    // Get branch_id from query, body, or user
    const branchId = req.query?.branch_id || req.body?.branch_id || req.user?.branch_id;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    const settings = await SettingsService.getSettingsByBranch(branchId);

    res.json({
      message: "Settings retrieved successfully",
      data: settings || { branch_id: branchId }
    });
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE OR UPDATE SETTINGS
exports.upsertSettings = async (req, res) => {
  try {
    const branchId = req.body?.branch_id || req.query?.branch_id || req.user?.branch_id;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    // Handle file uploads
    const letterheadUrl = req.file?.path 
      ? `/uploads/branches/${branchId}/settings/${path.basename(req.file.path)}`
      : (req.body.letterhead_url !== undefined ? req.body.letterhead_url : undefined);

    const ownerSignatureUrl = req.files?.["owner_signature"]?.[0]?.path
      ? `/uploads/branches/${branchId}/settings/${path.basename(req.files["owner_signature"][0].path)}`
      : (req.body.owner_signature_url !== undefined ? req.body.owner_signature_url : undefined);

    const headerUrl = req.files?.["header"]?.[0]?.path
      ? `/uploads/branches/${branchId}/settings/${path.basename(req.files["header"][0].path)}`
      : (req.body.header_url !== undefined ? req.body.header_url : undefined);

    const footerUrl = req.files?.["footer"]?.[0]?.path
      ? `/uploads/branches/${branchId}/settings/${path.basename(req.files["footer"][0].path)}`
      : (req.body.footer_url !== undefined ? req.body.footer_url : undefined);

    // If no files uploaded, check for base64 strings
    let finalLetterheadUrl = letterheadUrl;
    let finalOwnerSignatureUrl = ownerSignatureUrl;
    let finalHeaderUrl = headerUrl;
    let finalFooterUrl = footerUrl;

    // Handle base64 letterhead
    if (finalLetterheadUrl === undefined && req.body.letterhead_base64) {
      finalLetterheadUrl = await saveBase64Image(
        req.body.letterhead_base64, 
        "letterhead", 
        branchId
      );
    }

    // Handle base64 owner signature
    if (finalOwnerSignatureUrl === undefined && req.body.owner_signature_base64) {
      finalOwnerSignatureUrl = await saveBase64Image(
        req.body.owner_signature_base64, 
        "owner_sign", 
        branchId
      );
    }

    if (finalHeaderUrl === undefined && req.body.header_base64) {
      finalHeaderUrl = await saveBase64Image(
        req.body.header_base64, 
        "header", 
        branchId
      );
    }

    if (finalFooterUrl === undefined && req.body.footer_base64) {
      finalFooterUrl = await saveBase64Image(
        req.body.footer_base64, 
        "footer", 
        branchId
      );
    }

    const sampleIdFormat = req.body.sample_id_format;
    if (sampleIdFormat !== undefined && !ALLOWED_SAMPLE_ID_FORMATS.includes(sampleIdFormat)) {
      return res.status(400).json({
        error: `Invalid sample_id_format. Allowed values: ${ALLOWED_SAMPLE_ID_FORMATS.join(", ")}`,
      });
    }

    const sampleIdResetPolicy = req.body.sample_id_reset_policy;
    if (sampleIdResetPolicy !== undefined && !ALLOWED_SAMPLE_ID_RESET_POLICIES.includes(sampleIdResetPolicy)) {
      return res.status(400).json({
        error: `Invalid sample_id_reset_policy. Allowed values: ${ALLOWED_SAMPLE_ID_RESET_POLICIES.join(", ")}`,
      });
    }

    const sampleIdFyStartMonthRaw = req.body.sample_id_fy_start_month;
    let sampleIdFyStartMonth;
    if (sampleIdFyStartMonthRaw !== undefined) {
      sampleIdFyStartMonth = Number(sampleIdFyStartMonthRaw);
      if (!Number.isInteger(sampleIdFyStartMonth) || sampleIdFyStartMonth < 1 || sampleIdFyStartMonth > 12) {
        return res.status(400).json({ error: "sample_id_fy_start_month must be an integer between 1 and 12" });
      }
    }

    const sampleIdStartNumberRaw = req.body.sample_id_start_number;
    let sampleIdStartNumber;
    if (sampleIdStartNumberRaw !== undefined) {
      sampleIdStartNumber = Number(sampleIdStartNumberRaw);
      if (!Number.isInteger(sampleIdStartNumber) || sampleIdStartNumber < 1) {
        return res.status(400).json({ error: "sample_id_start_number must be a positive integer" });
      }
    }

    const settings = await SettingsService.upsertSettings(branchId, {
      letterhead_url: finalLetterheadUrl,
      owner_signature_url: finalOwnerSignatureUrl,
      header_url: finalHeaderUrl,
      footer_url: finalFooterUrl,
      report_margin_top: req.body.report_margin_top,
      report_margin_bottom: req.body.report_margin_bottom,
      report_margin_left: req.body.report_margin_left,
      report_margin_right: req.body.report_margin_right,
      header_safe_area: req.body.header_safe_area,
      footer_safe_area: req.body.footer_safe_area,
      default_signature_index: req.body.default_signature_index,
      sample_id_format: sampleIdFormat,
      sample_id_reset_policy: sampleIdResetPolicy,
      sample_id_fy_start_month: sampleIdFyStartMonth,
      sample_id_start_number: sampleIdStartNumber,
    });

    res.json({
      message: "Settings saved successfully",
      data: settings
    });
  } catch (err) {
    console.error("Upsert settings error:", err);
    res.status(500).json({ error: err.message });
  }
};

// REMOVE/CLEAR AN IMAGE FIELD
exports.removeImage = async (req, res) => {
  try {
    const branchId = req.query?.branch_id || req.body?.branch_id || req.user?.branch_id;
    const { field } = req.params;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    // Validate field name
    const allowedFields = [
      'letterhead_url', 'header_url', 'footer_url', 'owner_signature_url',
      'signature_1_url', 'signature_2_url', 'signature_3_url', 'signature_4_url',
    ];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: `Invalid field: ${field}. Allowed: ${allowedFields.join(', ')}` });
    }

    // When removing a signature URL, also clear its label
    const settings = await SettingsService.removeImage(branchId, field);

    // If removing a signature_N_url, also clear signature_N_label
    if (field.match(/^signature_\d_url$/)) {
      const labelField = field.replace('_url', '_label');
      await SettingsService.removeImage(branchId, labelField);
    }

    res.json({
      message: `${field.replace('_url', '').replace('_', ' ')} removed successfully`,
      data: settings
    });
  } catch (err) {
    console.error("Remove image error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPLOAD LETTERHEAD
exports.uploadLetterhead = async (req, res) => {
  try {
    const branchId = req.query?.branch_id || req.body?.branch_id || req.user?.branch_id;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Build the relative URL for the uploaded file
    const fileUrl = `/uploads/branches/${branchId}/settings/${req.file.filename}`;

    const settings = await SettingsService.upsertSettings(branchId, {
      letterhead_url: fileUrl
    });

    res.json({
      message: "Letterhead uploaded successfully",
      data: {
        ...settings,
        letterhead_url: fileUrl
      }
    });
  } catch (err) {
    console.error("Upload letterhead error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPLOAD OWNER SIGNATURE (legacy — kept for backward compat)
exports.uploadOwnerSignature = async (req, res) => {
  try {
    const branchId = req.query?.branch_id || req.body?.branch_id || req.user?.branch_id;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Build the relative URL for the uploaded file
    const fileUrl = `/uploads/branches/${branchId}/settings/${req.file.filename}`;

    const settings = await SettingsService.upsertSettings(branchId, {
      owner_signature_url: fileUrl
    });

    res.json({
      message: "Owner signature uploaded successfully",
      data: {
        ...settings,
        owner_signature_url: fileUrl
      }
    });
  } catch (err) {
    console.error("Upload owner signature error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPLOAD LAB SIGNATURE (1-4)
exports.uploadLabSignature = async (req, res) => {
  try {
    const branchId = req.query?.branch_id || req.body?.branch_id || req.user?.branch_id;
    const { index } = req.params;
    const sigIndex = parseInt(index);

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    if (sigIndex < 1 || sigIndex > 4) {
      return res.status(400).json({ error: "Signature index must be between 1 and 4" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `/uploads/branches/${branchId}/settings/${req.file.filename}`;
    const label = req.body.label || req.query.label || null;

    const updateData = {};
    updateData[`signature_${sigIndex}_url`] = fileUrl;
    if (label) {
      updateData[`signature_${sigIndex}_label`] = label;
    }

    const settings = await SettingsService.upsertSettings(branchId, updateData);

    res.json({
      message: `Signature ${sigIndex} uploaded successfully`,
      data: settings,
    });
  } catch (err) {
    console.error("Upload lab signature error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE SIGNATURE LABEL
exports.updateSignatureLabel = async (req, res) => {
  try {
    const branchId = req.query?.branch_id || req.body?.branch_id || req.user?.branch_id;
    const { index } = req.params;
    const sigIndex = parseInt(index);
    const { label } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    if (sigIndex < 1 || sigIndex > 4) {
      return res.status(400).json({ error: "Signature index must be between 1 and 4" });
    }

    const updateData = {};
    updateData[`signature_${sigIndex}_label`] = label || "";

    const settings = await SettingsService.upsertSettings(branchId, updateData);

    res.json({
      message: `Signature ${sigIndex} label updated successfully`,
      data: settings,
    });
  } catch (err) {
    console.error("Update signature label error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE DEFAULT SIGNATURE INDEX
exports.updateDefaultSignature = async (req, res) => {
  try {
    const branchId = req.query?.branch_id || req.body?.branch_id || req.user?.branch_id;
    const { index } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    const sigIndex = parseInt(index);
    if (sigIndex < 1 || sigIndex > 4) {
      return res.status(400).json({ error: "Default signature index must be between 1 and 4" });
    }

    const settings = await SettingsService.upsertSettings(branchId, {
      default_signature_index: sigIndex,
    });

    res.json({
      message: "Default signature updated successfully",
      data: settings,
    });
  } catch (err) {
    console.error("Update default signature error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPLOAD DOCTOR SIGNATURE
exports.uploadDoctorSignature = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const branchId = req.query?.branch_id || req.body?.branch_id || req.user?.branch_id;

    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Build the relative URL for the uploaded file
    const fileUrl = `/uploads/branches/${branchId}/doctors/${doctorId}/${req.file.filename}`;

    const doctor = await SettingsService.updateDoctorSignature(doctorId, fileUrl);

    res.json({
      message: "Doctor signature uploaded successfully",
      data: doctor
    });
  } catch (err) {
    console.error("Upload doctor signature error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Helper function to save base64 images
async function saveBase64Image(base64String, prefix, branchId) {
  const fs = require("fs");
  const crypto = require("crypto");
  
  const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 image format");
  }

  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  
  // Ensure directory exists
  const dirPath = path.join(__dirname, "..", "uploads", "branches", branchId, "settings");
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filename = `${prefix}_${crypto.randomUUID()}.${ext}`;
  const filePath = path.join(dirPath, filename);
  
  fs.writeFileSync(filePath, buffer);

  return `/uploads/branches/${branchId}/settings/${filename}`;
}