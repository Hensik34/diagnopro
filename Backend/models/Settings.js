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
      "letterhead_url", "owner_signature_url", "header_url", "footer_url",
      "report_margin_top", "report_margin_bottom", "report_margin_left", "report_margin_right",
      "signature_1_url", "signature_1_label", "signature_2_url", "signature_2_label",
      "signature_3_url", "signature_3_label", "signature_4_url", "signature_4_label",
      "default_signature_index",
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
      "letterhead_url", "owner_signature_url", "header_url", "footer_url",
      "signature_1_url", "signature_1_label",
      "signature_2_url", "signature_2_label",
      "signature_3_url", "signature_3_label",
      "signature_4_url", "signature_4_label",
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
      "letterhead_url", "owner_signature_url", "header_url", "footer_url",
      "report_margin_top", "report_margin_bottom", "report_margin_left", "report_margin_right",
      "signature_1_url", "signature_1_label",
      "signature_2_url", "signature_2_label",
      "signature_3_url", "signature_3_label",
      "signature_4_url", "signature_4_label",
      "default_signature_index",
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