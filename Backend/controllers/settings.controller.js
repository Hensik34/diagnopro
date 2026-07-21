const SettingsService = require("../services/settings.service");
const { uploadFileToCloudinary, uploadBase64ToCloudinary, deleteFileFromCloudinary } = require("../utils/upload");

const ALLOWED_SAMPLE_ID_FORMATS = ["numeric", "sm_prefix"];
const ALLOWED_SAMPLE_ID_RESET_POLICIES = ["yearly", "monthly"];

/**
 * Settings Controller - Handle branch settings including letterhead and signatures
 */

// GET SETTINGS BY BRANCH
exports.getSettings = async (req, res) => {
  try {
    // Get branch_id from header, query, body, or user
    const branchId = req.headers['x-branch-id'] || req.query?.branch_id || req.body?.branch_id || req.user?.branch_id;

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
    const branchId = req.headers['x-branch-id'] || req.body?.branch_id || req.query?.branch_id || req.user?.branch_id;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    // Handle file uploads to Cloudinary
    let letterheadUrl;
    if (req.files?.["letterhead"]?.[0]) {
      letterheadUrl = await uploadFileToCloudinary(req.files["letterhead"][0], branchId, "settings");
    } else if (req.file) {
      letterheadUrl = await uploadFileToCloudinary(req.file, branchId, "settings");
    } else {
      letterheadUrl = req.body.letterhead_url !== undefined ? req.body.letterhead_url : undefined;
    }

    let ownerSignatureUrl;
    if (req.files?.["owner_signature"]?.[0]) {
      ownerSignatureUrl = await uploadFileToCloudinary(req.files["owner_signature"][0], branchId, "settings");
    } else {
      ownerSignatureUrl = req.body.owner_signature_url !== undefined ? req.body.owner_signature_url : undefined;
    }

    let headerUrl;
    if (req.files?.["header"]?.[0]) {
      headerUrl = await uploadFileToCloudinary(req.files["header"][0], branchId, "settings");
    } else {
      headerUrl = req.body.header_url !== undefined ? req.body.header_url : undefined;
    }

    let footerUrl;
    if (req.files?.["footer"]?.[0]) {
      footerUrl = await uploadFileToCloudinary(req.files["footer"][0], branchId, "settings");
    } else {
      footerUrl = req.body.footer_url !== undefined ? req.body.footer_url : undefined;
    }

    // If no files uploaded, check for base64 strings
    let finalLetterheadUrl = letterheadUrl;
    let finalOwnerSignatureUrl = ownerSignatureUrl;
    let finalHeaderUrl = headerUrl;
    let finalFooterUrl = footerUrl;

    // Handle base64 letterhead
    if (finalLetterheadUrl === undefined && req.body.letterhead_base64) {
      finalLetterheadUrl = await uploadBase64ToCloudinary(
        req.body.letterhead_base64,
        "letterhead",
        branchId,
        "settings"
      );
    }

    // Handle base64 owner signature
    if (finalOwnerSignatureUrl === undefined && req.body.owner_signature_base64) {
      finalOwnerSignatureUrl = await uploadBase64ToCloudinary(
        req.body.owner_signature_base64,
        "owner_sign",
        branchId,
        "settings"
      );
    }

    if (finalHeaderUrl === undefined && req.body.header_base64) {
      finalHeaderUrl = await uploadBase64ToCloudinary(
        req.body.header_base64,
        "header",
        branchId,
        "settings"
      );
    }

    if (finalFooterUrl === undefined && req.body.footer_base64) {
      finalFooterUrl = await uploadBase64ToCloudinary(
        req.body.footer_base64,
        "footer",
        branchId,
        "settings"
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

    let letterheadMarginsAuto = req.body.letterhead_margins_auto;
    const hasMargins = req.body.report_margin_top !== undefined ||
      req.body.report_margin_bottom !== undefined ||
      req.body.report_margin_left !== undefined ||
      req.body.report_margin_right !== undefined;

    if (letterheadMarginsAuto === undefined) {
      if (hasMargins) {
        const current = await SettingsService.getSettingsByBranch(branchId);
        if (current) {
          const checkChanged = (val, detected) => {
            if (val === undefined || val === null) return false;
            const parsedVal = typeof val === 'string' ? parseInt(val, 10) : val;
            const parsedDet = typeof detected === 'string' ? parseInt(detected, 10) : detected;
            return Number.isInteger(parsedVal) && Number.isInteger(parsedDet) && parsedVal !== parsedDet;
          };

          const topChanged = checkChanged(req.body.report_margin_top, current.letterhead_detected_top);
          const bottomChanged = checkChanged(req.body.report_margin_bottom, current.letterhead_detected_bottom);
          const leftChanged = checkChanged(req.body.report_margin_left, current.letterhead_detected_left);
          const rightChanged = checkChanged(req.body.report_margin_right, current.letterhead_detected_right);

          if (topChanged || bottomChanged || leftChanged || rightChanged) {
            letterheadMarginsAuto = false;
          } else {
            letterheadMarginsAuto = current.letterhead_margins_auto;
          }
        }
      }
    } else {
      letterheadMarginsAuto = letterheadMarginsAuto === "true" || letterheadMarginsAuto === true || letterheadMarginsAuto === 1;
    }

    let finalMarketingPages;
    if (req.body.marketing_pages) {
      try {
        const pages = typeof req.body.marketing_pages === 'string'
          ? JSON.parse(req.body.marketing_pages)
          : req.body.marketing_pages;

        const processedPages = [];
        for (const page of pages) {
          if (page.base64) {
            const uploadedUrl = await uploadBase64ToCloudinary(
              page.base64,
              `marketing_page_${page.id || Date.now()}`,
              branchId,
              "settings"
            );
            page.url = uploadedUrl;
            delete page.base64;
          }
          processedPages.push(page);
        }
        finalMarketingPages = JSON.stringify(processedPages);
      } catch (err) {
        console.error("Error processing marketing pages base64 uploads:", err);
      }
    }

    const settings = await SettingsService.upsertSettings(branchId, {
      letterhead_url: finalLetterheadUrl,
      owner_signature_url: finalOwnerSignatureUrl,
      owner_signature_label: req.body.owner_signature_label !== undefined ? req.body.owner_signature_label : undefined,
      owner_signature_description: req.body.owner_signature_description !== undefined ? req.body.owner_signature_description : undefined,
      header_url: finalHeaderUrl,
      footer_url: finalFooterUrl,
      report_margin_top: req.body.report_margin_top,
      report_margin_bottom: req.body.report_margin_bottom,
      report_margin_left: req.body.report_margin_left,
      report_margin_right: req.body.report_margin_right,
      header_safe_area: req.body.header_safe_area,
      footer_safe_area: req.body.footer_safe_area,
      letterhead_detected_top: req.body.letterhead_detected_top !== undefined ? parseInt(req.body.letterhead_detected_top, 10) : undefined,
      letterhead_detected_bottom: req.body.letterhead_detected_bottom !== undefined ? parseInt(req.body.letterhead_detected_bottom, 10) : undefined,
      letterhead_detected_left: req.body.letterhead_detected_left !== undefined ? parseInt(req.body.letterhead_detected_left, 10) : undefined,
      letterhead_detected_right: req.body.letterhead_detected_right !== undefined ? parseInt(req.body.letterhead_detected_right, 10) : undefined,
      letterhead_margins_auto: letterheadMarginsAuto,
      default_signature_index: req.body.default_signature_index,
      sample_id_format: sampleIdFormat,
      sample_id_reset_policy: sampleIdResetPolicy,
      sample_id_fy_start_month: sampleIdFyStartMonth,
      sample_id_start_number: sampleIdStartNumber,
      marketing_pages: finalMarketingPages,
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
      'marketing_page_url',
    ];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: `Invalid field: ${field}. Allowed: ${allowedFields.join(', ')}` });
    }

    // Try to delete from Cloudinary before clearing DB
    const currentSettings = await SettingsService.getSettingsByBranch(branchId);
    if (currentSettings && currentSettings[field]) {
      await deleteFileFromCloudinary(currentSettings[field]);
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

    // Upload to Cloudinary
    const fileUrl = await uploadFileToCloudinary(req.file, branchId, "settings");

    // Read detected margins and auto flag from body or query
    const detectedTop = req.body.detected_top || req.query.detected_top;
    const detectedBottom = req.body.detected_bottom || req.query.detected_bottom;
    const detectedLeft = req.body.detected_left || req.query.detect_left;
    const detectedRight = req.body.detected_right || req.query.detected_right;
    const marginsAutoReq = req.body.letterhead_margins_auto || req.query.letterhead_margins_auto;

    const currentSettings = await SettingsService.getSettingsByBranch(branchId);

    let marginsAuto = true;
    if (marginsAutoReq !== undefined) {
      marginsAuto = marginsAutoReq === "true" || marginsAutoReq === true || marginsAutoReq === "1";
    } else if (currentSettings) {
      marginsAuto = currentSettings.letterhead_margins_auto !== false;
    }

    const detectedTopVal = detectedTop !== undefined ? parseInt(detectedTop, 10) : undefined;
    const detectedBottomVal = detectedBottom !== undefined ? parseInt(detectedBottom, 10) : undefined;
    const detectedLeftVal = detectedLeft !== undefined ? parseInt(detectedLeft, 10) : undefined;
    const detectedRightVal = detectedRight !== undefined ? parseInt(detectedRight, 10) : undefined;

    const updateData = {
      letterhead_url: fileUrl,
      letterhead_detected_top: detectedTopVal,
      letterhead_detected_bottom: detectedBottomVal,
      letterhead_detected_left: detectedLeftVal,
      letterhead_detected_right: detectedRightVal,
      letterhead_margins_auto: marginsAuto,
      // Default safe areas to 0 on new letterhead uploads
      header_safe_area: 0,
      footer_safe_area: 0,
    };

    if (marginsAuto) {
      if (detectedTopVal !== undefined) updateData.report_margin_top = detectedTopVal;
      if (detectedBottomVal !== undefined) updateData.report_margin_bottom = detectedBottomVal;
      if (detectedLeftVal !== undefined) updateData.report_margin_left = detectedLeftVal;
      if (detectedRightVal !== undefined) updateData.report_margin_right = detectedRightVal;
    }

    const settings = await SettingsService.upsertSettings(branchId, updateData);

    res.json({
      message: "Letterhead uploaded successfully",
      data: settings
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

    // Upload to Cloudinary
    const fileUrl = await uploadFileToCloudinary(req.file, branchId, "settings");

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

    // Upload to Cloudinary
    const fileUrl = await uploadFileToCloudinary(req.file, branchId, "settings");
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
    const { label, description } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID not found in request" });
    }

    if (sigIndex < 1 || sigIndex > 4) {
      return res.status(400).json({ error: "Signature index must be between 1 and 4" });
    }

    const updateData = {};
    if (label !== undefined) updateData[`signature_${sigIndex}_label`] = label || "";
    if (description !== undefined) updateData[`signature_${sigIndex}_description`] = description || "";

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

    // Upload to Cloudinary under doctors subfolder
    const fileUrl = await uploadFileToCloudinary(req.file, branchId, `doctors/${doctorId}`);

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