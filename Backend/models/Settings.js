const { Settings } = require("./index");

/**
 * Settings Model - Branch-specific settings including letterhead and signatures
 */
module.exports = {
  /**
   * Get settings by branch_id
   */
  getByBranchId: async (branchId) => {
    return await Settings.findOne({ where: { branch_id: branchId }, raw: true });
  },

  /**
   * Create or update settings (upsert)
   * Supports clearing fields by passing empty string ""
   * Supports keeping existing fields by passing undefined/null
   */
  upsert: async (data) => {
    const resolveVal = (val) => {
      if (val === undefined || val === null) return undefined; // skip
      if (val === "") return null; // clear
      return val;
    };

    const updateObj = {};
    const fields = [
      "letterhead_url", "owner_signature_url", "owner_signature_label", "owner_signature_description", "header_url", "footer_url",
      "report_margin_top", "report_margin_bottom", "report_margin_left", "report_margin_right",
      "header_safe_area", "footer_safe_area",
      "letterhead_detected_top", "letterhead_detected_bottom", "letterhead_detected_left", "letterhead_detected_right",
      "letterhead_margins_auto",
      "signature_1_url", "signature_1_label", "signature_1_description", "signature_2_url", "signature_2_label", "signature_2_description",
      "signature_3_url", "signature_3_label", "signature_3_description", "signature_4_url", "signature_4_label", "signature_4_description",
      "default_signature_index",
      "sample_id_format", "sample_id_reset_policy", "sample_id_fy_start_month", "sample_id_start_number",
    ];

    for (const field of fields) {
      const resolved = resolveVal(data[field]);
      if (resolved !== undefined) updateObj[field] = resolved;
    }

    // Upsert: find by branch_id, create or update
    const existing = await Settings.findOne({ where: { branch_id: data.branch_id } });
    if (existing) {
      await existing.update(updateObj);
      return existing.toJSON();
    }

    return await Settings.create({ branch_id: data.branch_id, ...updateObj });
  },

  /**
   * Clear a specific field (set to NULL)
   */
  clearField: async (branchId, fieldName) => {
    const allowed = [
      "letterhead_url", "owner_signature_url", "owner_signature_label", "owner_signature_description", "header_url", "footer_url",
      "signature_1_url", "signature_1_label", "signature_1_description",
      "signature_2_url", "signature_2_label", "signature_2_description",
      "signature_3_url", "signature_3_label", "signature_3_description",
      "signature_4_url", "signature_4_label", "signature_4_description",
    ];
    if (!allowed.includes(fieldName)) {
      throw new Error(`Cannot clear field: ${fieldName}`);
    }

    const [count, [updated]] = await Settings.update(
      { [fieldName]: null },
      { where: { branch_id: branchId }, returning: true }
    );
    return updated ? updated.toJSON() : null;
  },

  /**
   * Update only specific fields
   */
  update: async (branchId, updates) => {
    const fieldMap = [
      "letterhead_url", "owner_signature_url", "owner_signature_label", "owner_signature_description", "header_url", "footer_url",
      "report_margin_top", "report_margin_bottom", "report_margin_left", "report_margin_right",
      "header_safe_area", "footer_safe_area",
      "letterhead_detected_top", "letterhead_detected_bottom", "letterhead_detected_left", "letterhead_detected_right",
      "letterhead_margins_auto",
      "signature_1_url", "signature_1_label", "signature_1_description",
      "signature_2_url", "signature_2_label", "signature_2_description",
      "signature_3_url", "signature_3_label", "signature_3_description",
      "signature_4_url", "signature_4_label", "signature_4_description",
      "default_signature_index",
      "sample_id_format", "sample_id_reset_policy", "sample_id_fy_start_month", "sample_id_start_number",
    ];

    const updateObj = {};
    for (const field of fieldMap) {
      if (updates[field] !== undefined) {
        updateObj[field] = updates[field] || null;
      }
    }

    if (Object.keys(updateObj).length === 0) {
      return await Settings.findOne({ where: { branch_id: branchId }, raw: true });
    }

    const [count, [updated]] = await Settings.update(updateObj, {
      where: { branch_id: branchId },
      returning: true,
    });
    return updated ? updated.toJSON() : null;
  },

  /**
   * Delete settings by branch_id
   */
  delete: async (branchId) => {
    const deleted = await Settings.destroy({ where: { branch_id: branchId } });
    return deleted > 0;
  },
};