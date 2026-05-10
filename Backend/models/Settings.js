const pool = require("../config/db");

/**
 * Settings Model - Branch-specific settings including letterhead and signatures
 */
const Settings = {
  /**
   * Get settings by branch_id
   * @param {string} branchId - The branch ID
   * @returns {Promise<Object|null>} - Settings object or null
   */
  getByBranchId: async (branchId) => {
    try {
      const result = await pool.query(
        `SELECT * FROM settings WHERE branch_id = $1`,
        [branchId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error in Settings.getByBranchId:", error);
      throw error;
    }
  },

  /**
   * Create or update settings (upsert)
   * Supports clearing fields by passing empty string ""
   * Supports keeping existing fields by passing undefined/null
   * @param {Object} data - Settings data
   * @param {string} data.branch_id - Branch ID
   * @param {string} [data.letterhead_url] - Letterhead URL ("" to clear)
   * @param {string} [data.owner_signature_url] - Owner signature URL ("" to clear)
   * @returns {Promise<Object>} - Created/updated settings
   */
  upsert: async (data) => {
    try {
      // Resolve each field:
      // - undefined/null → keep existing value (for UPDATE) or NULL (for INSERT)
      // - "" (empty string) → explicitly clear to NULL
      // - any other string → set to that value
      const resolveVal = (val) => {
        if (val === undefined || val === null) return { provided: false, value: null };
        if (val === "") return { provided: true, value: null }; // clear
        return { provided: true, value: val };
      };

      const letterhead = resolveVal(data.letterhead_url);
      const ownerSig = resolveVal(data.owner_signature_url);
      const header = resolveVal(data.header_url);
      const footer = resolveVal(data.footer_url);
      const marginTop = resolveVal(data.report_margin_top);
      const marginBottom = resolveVal(data.report_margin_bottom);
      const marginLeft = resolveVal(data.report_margin_left);
      const marginRight = resolveVal(data.report_margin_right);
      const sig1Url = resolveVal(data.signature_1_url);
      const sig1Label = resolveVal(data.signature_1_label);
      const sig2Url = resolveVal(data.signature_2_url);
      const sig2Label = resolveVal(data.signature_2_label);
      const sig3Url = resolveVal(data.signature_3_url);
      const sig3Label = resolveVal(data.signature_3_label);
      const sig4Url = resolveVal(data.signature_4_url);
      const sig4Label = resolveVal(data.signature_4_label);
      const defaultSigIdx = resolveVal(data.default_signature_index);

      const result = await pool.query(
        `INSERT INTO settings (
          branch_id, letterhead_url, owner_signature_url, header_url, footer_url,
          report_margin_top, report_margin_bottom, report_margin_left, report_margin_right,
          signature_1_url, signature_1_label, signature_2_url, signature_2_label,
          signature_3_url, signature_3_label, signature_4_url, signature_4_label,
          default_signature_index
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (branch_id) 
         DO UPDATE SET 
           letterhead_url = CASE WHEN $19 THEN $2 ELSE settings.letterhead_url END,
           owner_signature_url = CASE WHEN $20 THEN $3 ELSE settings.owner_signature_url END,
           header_url = CASE WHEN $21 THEN $4 ELSE settings.header_url END,
           footer_url = CASE WHEN $22 THEN $5 ELSE settings.footer_url END,
           report_margin_top = CASE WHEN $23 THEN $6 ELSE settings.report_margin_top END,
           report_margin_bottom = CASE WHEN $24 THEN $7 ELSE settings.report_margin_bottom END,
           report_margin_left = CASE WHEN $25 THEN $8 ELSE settings.report_margin_left END,
           report_margin_right = CASE WHEN $26 THEN $9 ELSE settings.report_margin_right END,
           signature_1_url = CASE WHEN $27 THEN $10 ELSE settings.signature_1_url END,
           signature_1_label = CASE WHEN $28 THEN $11 ELSE settings.signature_1_label END,
           signature_2_url = CASE WHEN $29 THEN $12 ELSE settings.signature_2_url END,
           signature_2_label = CASE WHEN $30 THEN $13 ELSE settings.signature_2_label END,
           signature_3_url = CASE WHEN $31 THEN $14 ELSE settings.signature_3_url END,
           signature_3_label = CASE WHEN $32 THEN $15 ELSE settings.signature_3_label END,
           signature_4_url = CASE WHEN $33 THEN $16 ELSE settings.signature_4_url END,
           signature_4_label = CASE WHEN $34 THEN $17 ELSE settings.signature_4_label END,
           default_signature_index = CASE WHEN $35 THEN $18 ELSE settings.default_signature_index END,
           updated_at = NOW()
         RETURNING *`,
        [
          data.branch_id,
          letterhead.value,
          ownerSig.value,
          header.value,
          footer.value,
          marginTop.value,
          marginBottom.value,
          marginLeft.value,
          marginRight.value,
          sig1Url.value,
          sig1Label.value,
          sig2Url.value,
          sig2Label.value,
          sig3Url.value,
          sig3Label.value,
          sig4Url.value,
          sig4Label.value,
          defaultSigIdx.value,
          letterhead.provided,
          ownerSig.provided,
          header.provided,
          footer.provided,
          marginTop.provided,
          marginBottom.provided,
          marginLeft.provided,
          marginRight.provided,
          sig1Url.provided,
          sig1Label.provided,
          sig2Url.provided,
          sig2Label.provided,
          sig3Url.provided,
          sig3Label.provided,
          sig4Url.provided,
          sig4Label.provided,
          defaultSigIdx.provided,
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in Settings.upsert:", error);
      throw error;
    }
  },

  /**
   * Clear a specific field (set to NULL)
   * @param {string} branchId - Branch ID
   * @param {string} fieldName - Column name to clear
   * @returns {Promise<Object>} - Updated settings
   */
  clearField: async (branchId, fieldName) => {
    // Whitelist of clearable fields to prevent SQL injection
    const allowed = [
      'letterhead_url', 'owner_signature_url', 'header_url', 'footer_url',
      'signature_1_url', 'signature_1_label',
      'signature_2_url', 'signature_2_label',
      'signature_3_url', 'signature_3_label',
      'signature_4_url', 'signature_4_label',
    ];
    if (!allowed.includes(fieldName)) {
      throw new Error(`Cannot clear field: ${fieldName}`);
    }

    try {
      const result = await pool.query(
        `UPDATE settings SET ${fieldName} = NULL, updated_at = NOW() WHERE branch_id = $1 RETURNING *`,
        [branchId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error in Settings.clearField:", error);
      throw error;
    }
  },

  /**
   * Update only specific fields
   * @param {string} branchId - Branch ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Updated settings
   */
  update: async (branchId, updates) => {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      const fieldMap = [
        'letterhead_url', 'owner_signature_url', 'header_url', 'footer_url',
        'report_margin_top', 'report_margin_bottom', 'report_margin_left', 'report_margin_right',
        'signature_1_url', 'signature_1_label',
        'signature_2_url', 'signature_2_label',
        'signature_3_url', 'signature_3_label',
        'signature_4_url', 'signature_4_label',
        'default_signature_index',
      ];

      for (const field of fieldMap) {
        if (updates[field] !== undefined) {
          fields.push(`${field} = $${paramIndex++}`);
          values.push(updates[field] || null);
        }
      }

      if (fields.length === 0) {
        return Settings.getByBranchId(branchId);
      }

      fields.push(`updated_at = NOW()`);
      values.push(branchId);

      const query = `
        UPDATE settings 
        SET ${fields.join(", ")}
        WHERE branch_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error in Settings.update:", error);
      throw error;
    }
  },

  /**
   * Delete settings by branch_id
   * @param {string} branchId - Branch ID
   * @returns {Promise<boolean>} - Success status
   */
  delete: async (branchId) => {
    try {
      const result = await pool.query(
        `DELETE FROM settings WHERE branch_id = $1 RETURNING id`,
        [branchId]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error in Settings.delete:", error);
      throw error;
    }
  }
};

module.exports = Settings;