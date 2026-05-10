const pool = require("../config/db");

/**
 * B2B Lab Model — Partner lab CRUD with credit limit, soft delete, optimistic locking
 */

// ==========================================
// LAB CRUD
// ==========================================

exports.createLab = async (data, client = null) => {
  const db = client || pool;
  const {
    lab_name, lab_code, contact_person, mobile, email, address, city, state, pincode,
    gst_number, commission_type, commission_value, credit_limit, lab_type,
    owner_branch_id, user_id, logo_url, show_processing_lab, custom_footer, created_by
  } = data;

  const result = await db.query(
    `INSERT INTO b2b_labs (
      lab_name, lab_code, contact_person, mobile, email, address, city, state, pincode,
      gst_number, commission_type, commission_value, credit_limit, lab_type,
      owner_branch_id, user_id, logo_url, show_processing_lab, custom_footer, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    RETURNING *`,
    [lab_name, lab_code, contact_person, mobile, email, address, city, state, pincode,
     gst_number, commission_type || 'percentage', commission_value || 0, credit_limit || 0,
     lab_type || 'collection', owner_branch_id, user_id || null, logo_url || null,
     show_processing_lab || false, custom_footer || null, created_by]
  );
  return result.rows[0];
};

exports.getAllLabs = async (ownerBranchId = null) => {
  let query = `SELECT * FROM b2b_labs WHERE is_deleted = false`;
  const params = [];
  if (ownerBranchId) {
    query += ` AND owner_branch_id = $1`;
    params.push(ownerBranchId);
  }
  query += ` ORDER BY created_at DESC`;
  const result = await pool.query(query, params);
  return result.rows;
};

exports.getLabById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM b2b_labs WHERE id = $1 AND is_deleted = false`, [id]
  );
  return result.rows[0] || null;
};

exports.getLabByCode = async (code) => {
  const result = await pool.query(
    `SELECT * FROM b2b_labs WHERE lab_code = $1 AND is_deleted = false`, [code]
  );
  return result.rows[0] || null;
};

exports.getLabByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM b2b_labs WHERE user_id = $1 AND is_deleted = false`, [userId]
  );
  return result.rows[0] || null;
};

exports.updateLab = async (id, data, expectedVersion = null) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const allowedFields = [
    'lab_name', 'contact_person', 'mobile', 'email', 'address', 'city', 'state', 'pincode',
    'gst_number', 'commission_type', 'commission_value', 'credit_limit', 'lab_type',
    'status', 'logo_url', 'show_processing_lab', 'custom_footer', 'user_id'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (fields.length === 0) return exports.getLabById(id);

  fields.push(`version = version + 1`);
  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  let query = `UPDATE b2b_labs SET ${fields.join(', ')} WHERE id = $${idx} AND is_deleted = false`;
  values.push(id);
  idx++;

  // Optimistic locking
  if (expectedVersion != null) {
    query += ` AND version = $${idx}`;
    values.push(expectedVersion);
    idx++;
  }

  query += ` RETURNING *`;
  const result = await pool.query(query, values);

  if (result.rows.length === 0 && expectedVersion != null) {
    throw new Error('CONFLICT: Lab was modified by another user. Please refresh and try again.');
  }

  return result.rows[0] || null;
};

exports.softDeleteLab = async (id) => {
  const result = await pool.query(
    `UPDATE b2b_labs SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, status = 'inactive'
     WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
};

// ==========================================
// CREDIT / BALANCE
// ==========================================

exports.updateBalance = async (labId, amount, client = null) => {
  const db = client || pool;
  const result = await db.query(
    `UPDATE b2b_labs SET current_balance = current_balance + $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND is_deleted = false RETURNING id, current_balance, credit_limit`,
    [amount, labId]
  );
  return result.rows[0] || null;
};

exports.checkCreditLimit = async (labId, additionalAmount = 0) => {
  const result = await pool.query(
    `SELECT current_balance, credit_limit FROM b2b_labs WHERE id = $1 AND is_deleted = false`,
    [labId]
  );
  if (!result.rows[0]) return { allowed: false, reason: 'Lab not found' };

  const { current_balance, credit_limit } = result.rows[0];
  const projectedBalance = parseFloat(current_balance) + parseFloat(additionalAmount);

  if (credit_limit > 0 && projectedBalance > credit_limit) {
    return {
      allowed: false,
      reason: 'Credit limit exceeded',
      current_balance: parseFloat(current_balance),
      credit_limit: parseFloat(credit_limit),
      projected: projectedBalance
    };
  }
  return { allowed: true, current_balance: parseFloat(current_balance), credit_limit: parseFloat(credit_limit) };
};

// ==========================================
// RATE LISTS
// ==========================================

exports.getRateList = async (labId) => {
  const result = await pool.query(
    `SELECT r.*, t.test_name, t.test_code, t.category, t.sample_type
     FROM b2b_rate_lists r
     JOIN tests t ON r.test_id = t.id
     WHERE r.b2b_lab_id = $1 AND r.is_active = true
     ORDER BY t.category, t.test_name`,
    [labId]
  );
  return result.rows;
};

exports.upsertRate = async (labId, testId, collectionPrice, processingPrice) => {
  const result = await pool.query(
    `INSERT INTO b2b_rate_lists (b2b_lab_id, test_id, collection_price, processing_price)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (b2b_lab_id, test_id)
     DO UPDATE SET collection_price = $3, processing_price = $4, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [labId, testId, collectionPrice, processingPrice]
  );
  return result.rows[0];
};

exports.bulkUpsertRates = async (labId, rates) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const results = [];
    for (const rate of rates) {
      const r = await client.query(
        `INSERT INTO b2b_rate_lists (b2b_lab_id, test_id, collection_price, processing_price)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (b2b_lab_id, test_id)
         DO UPDATE SET collection_price = $3, processing_price = $4, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [labId, rate.test_id, rate.collection_price, rate.processing_price]
      );
      results.push(r.rows[0]);
    }
    await client.query("COMMIT");
    return results;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.deleteRate = async (labId, rateId) => {
  const result = await pool.query(
    `DELETE FROM b2b_rate_lists WHERE id = $1 AND b2b_lab_id = $2 RETURNING id`,
    [rateId, labId]
  );
  return result.rows[0] || null;
};

exports.getRate = async (labId, testId) => {
  const result = await pool.query(
    `SELECT * FROM b2b_rate_lists WHERE b2b_lab_id = $1 AND test_id = $2 AND is_active = true`,
    [labId, testId]
  );
  return result.rows[0] || null;
};
