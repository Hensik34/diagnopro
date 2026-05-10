const pool = require("../config/db");

// ==========================================
// REPORT STATUS CONSTANTS
// ==========================================
const REPORT_STATUS = {
  DRAFT: 'draft',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Get all reports
exports.getAllReports = async (filters = {}) => {
  let query = `
    SELECT r.*, 
           p.name as patient_name, p.phone as patient_phone,
           p.gender as patient_gender, p.age as patient_age, p.email as patient_email,
           d.title as doctor_title, d.name as doctor_name,
           d.firstname as doctor_firstname, d.lastname as doctor_lastname,
           t.firstname as technician_firstname, t.lastname as technician_lastname,
           s.sample_id_code, s.sample_type
    FROM reports r
    LEFT JOIN patients p ON r.patient_id = p.id
    LEFT JOIN doctors d ON r.doctor_id = d.id
    LEFT JOIN users t ON r.technician_id = t.id
    LEFT JOIN samples s ON r.sample_id = s.id
    WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (filters.patient_id) {
    query += ` AND r.patient_id = $${paramIndex}`;
    params.push(filters.patient_id);
    paramIndex++;
  }

  if (filters.status) {
    query += ` AND r.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.branch_id) {
    query += ` AND p.branch_id = $${paramIndex}`;
    params.push(filters.branch_id);
    paramIndex++;
  } else if (filters.branch_ids && filters.branch_ids.length > 0) {
    // Filter by multiple branch IDs (user's branches)
    const placeholders = filters.branch_ids.map((_, i) => `$${paramIndex + i}`).join(', ');
    query += ` AND p.branch_id IN (${placeholders})`;
    params.push(...filters.branch_ids);
    paramIndex += filters.branch_ids.length;
  }

  if (filters.technician_id) {
    query += ` AND r.technician_id = $${paramIndex}`;
    params.push(filters.technician_id);
    paramIndex++;
  }

  query += " ORDER BY r.created_at DESC";

  const result = await pool.query(query, params);
  return result.rows;
};

// Get report by ID
exports.getReportById = async (id) => {
  const result = await pool.query(
    `SELECT r.*, 
            p.name as patient_name, p.phone as patient_phone,
            p.gender as patient_gender, p.age as patient_age,
            d.title as doctor_title, d.name as doctor_name,
            d.firstname as doctor_firstname, d.lastname as doctor_lastname,
            d.phone as doctor_phone, d.email as doctor_email,
            d.signature_url as doctor_signature_url,
            t.firstname as technician_firstname, t.lastname as technician_lastname,
            s.sample_id_code, s.sample_type,
            st.letterhead_url, st.owner_signature_url,
            approved_user.firstname as approved_by_firstname, approved_user.lastname as approved_by_lastname,
            submitted_user.firstname as submitted_by_firstname, submitted_user.lastname as submitted_by_lastname,
            rejected_user.firstname as rejected_by_firstname, rejected_user.lastname as rejected_by_lastname
     FROM reports r
     LEFT JOIN patients p ON r.patient_id = p.id
     LEFT JOIN doctors d ON r.doctor_id = d.id
     LEFT JOIN users t ON r.technician_id = t.id
     LEFT JOIN samples s ON r.sample_id = s.id
     LEFT JOIN settings st ON p.branch_id = st.branch_id
     LEFT JOIN users approved_user ON r.approved_by = approved_user.id
     LEFT JOIN users submitted_user ON r.submitted_by = submitted_user.id
     LEFT JOIN users rejected_user ON r.rejected_by = rejected_user.id
     WHERE r.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Create new report (status: draft by default)
exports.createReport = async (reportData) => {
  const { 
    patient_id, 
    doctor_id, 
    report_type, 
    sample_id, 
    clinical_notes, 
    technician_id, 
    status = 'draft',
    report_amount = 0,
    is_self_report = false,
    test_data = {},
    findings = '',
    recommendations = '',
    branch_id,
    delivery_preferences = {},
    base_amount,
    lab_discount_type = 'percent',
    lab_discount_value = 0,
    doctor_discount = 0,
    final_amount
  } = reportData;
  
  // Calculate doctor commission if doctor is assigned and not self-report
  let doctor_commission = 0;
  if (doctor_id && !is_self_report && report_amount > 0) {
    // Get doctor's commission percentage
    const doctorResult = await pool.query(
      'SELECT commission_percentage FROM doctors WHERE id = $1',
      [doctor_id]
    );
    if (doctorResult.rows[0]) {
      const commissionPercent = parseFloat(doctorResult.rows[0].commission_percentage) || 0;
      doctor_commission = (report_amount * commissionPercent) / 100;
      // Deduct doctor discount from commission
      if (doctor_discount > 0) {
        doctor_commission = Math.max(0, doctor_commission - doctor_discount);
      }
    }
  }
  
  // Calculate billing amounts
  const computedBase = base_amount != null ? base_amount : report_amount;
  const computedFinal = final_amount != null ? final_amount : computedBase;

  const result = await pool.query(
    `INSERT INTO reports (
      patient_id, doctor_id, report_type, sample_id, clinical_notes, 
      technician_id, status, report_amount, doctor_commission, is_self_report,
      test_data, findings, recommendations, delivery_preferences,
      base_amount, lab_discount_type, lab_discount_value, doctor_discount, final_amount, payment_status
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'pending')
     RETURNING *`,
    [
      patient_id, doctor_id, report_type, sample_id, clinical_notes, 
      technician_id, status, report_amount, doctor_commission, is_self_report,
      JSON.stringify(test_data), findings, recommendations, JSON.stringify(delivery_preferences),
      computedBase, lab_discount_type, lab_discount_value, doctor_discount, computedFinal
    ]
  );
  
  return result.rows[0];
};

// Update report (flexible update for any fields)
exports.updateReport = async (id, reportData) => {
  const allowedFields = [
    'findings', 'recommendations', 'clinical_notes', 'technician_id',
    'test_data', 'status', 'reviewed_by', 'approved_by',
    'approved_at', 'submitted_by', 'submitted_at', 'rejected_by', 'rejected_at',
    'rejection_reason', 'doctor_id', 'report_type', 'report_amount', 'is_self_report',
    'delivery_preferences',
    'base_amount', 'lab_discount_type', 'lab_discount_value', 'doctor_discount',
    'final_amount', 'payment_status', 'doctor_commission'
  ];
  
  const updates = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(reportData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      // Handle JSON fields
      if (key === 'test_data' || key === 'delivery_preferences') {
        updates.push(`${key} = $${paramIndex}`);
        values.push(JSON.stringify(value));
      } else {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    // No valid fields to update
    return exports.getReportById(id);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE reports 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

// Update report status (workflow: Created → Collected → Processing → Completed → Approved)
exports.updateReportStatus = async (id, status, userId) => {
  const result = await pool.query(
    `UPDATE reports 
     SET status = $1,
         reviewed_by = CASE WHEN $1 IN ('processing', 'completed') THEN $2 ELSE reviewed_by END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [status, userId, id]
  );
  
  return result.rows[0] || null;
};

// Assign technician to report
exports.assignTechnician = async (id, technicianId) => {
  const result = await pool.query(
    `UPDATE reports 
     SET technician_id = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [technicianId, id]
  );
  
  return result.rows[0] || null;
};

// Approve report
exports.approveReport = async (id, approvedBy) => {
  const result = await pool.query(
    `UPDATE reports 
     SET status = 'approved',
         approved_by = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [approvedBy, id]
  );
  
  return result.rows[0] || null;
};

// Get reports by patient
exports.getReportsByPatient = async (patientId) => {
  const result = await pool.query(
    `SELECT r.*, 
            d.firstname as doctor_firstname, d.lastname as doctor_lastname,
            t.firstname as technician_firstname, t.lastname as technician_lastname
     FROM reports r
     LEFT JOIN doctors d ON r.doctor_id = d.id
     LEFT JOIN users t ON r.technician_id = t.id
     WHERE r.patient_id = $1 
     ORDER BY r.created_at DESC`,
    [patientId]
  );
  
  return result.rows;
};

// Delete report
exports.deleteReport = async (id) => {
  const result = await pool.query(
    "DELETE FROM reports WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};
