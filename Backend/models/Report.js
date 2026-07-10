const { Op, fn, col } = require("sequelize");
const { Report, Patient, Doctor, User, Sample, Settings, B2BLab } = require("./index");

function stableStringify(value) {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function areValuesEquivalent(currentVal, newVal) {
  if (currentVal == null && newVal == null) return true;

  if (
    currentVal !== null &&
    currentVal !== undefined &&
    newVal !== null &&
    newVal !== undefined &&
    !Number.isNaN(Number(currentVal)) &&
    !Number.isNaN(Number(newVal)) &&
    `${currentVal}`.trim() !== "" &&
    `${newVal}`.trim() !== ""
  ) {
    return Number(currentVal) === Number(newVal);
  }

  if (
    (typeof currentVal === "object" && currentVal !== null) ||
    (typeof newVal === "object" && newVal !== null)
  ) {
    return stableStringify(currentVal) === stableStringify(newVal);
  }

  return currentVal === newVal;
}

// ==========================================
// REPORT STATUS CONSTANTS
// ==========================================
const REPORT_STATUS = {
  DRAFT: "draft",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// Get all reports
exports.getAllReports = async (filters = {}) => {
  const where = {};
  const include = [
    { model: Patient, as: "patient", attributes: ["name", "phone", "gender", "age", "age_unit", "email", "branch_id"] },
    { model: Doctor, as: "doctor", attributes: ["title", "name", "firstname", "lastname"] },
    { model: User, as: "technician", attributes: ["firstname", "lastname"] },
    { model: Sample, as: "sample", attributes: ["sample_id_code", "sample_type"] },
    { model: B2BLab, as: "b2bLab", attributes: ["lab_name"], required: false },
  ];

  if (filters.patient_id) where.patient_id = filters.patient_id;
  if (filters.status) where.status = filters.status;
  if (filters.technician_id) where.technician_id = filters.technician_id;

  // Branch filtering via patient
  if (filters.branch_id) {
    include[0].where = { branch_id: filters.branch_id };
    include[0].required = true;
  } else if (filters.branch_ids && filters.branch_ids.length > 0) {
    include[0].where = { branch_id: { [Op.in]: filters.branch_ids } };
    include[0].required = true;
  }

  const rows = await Report.findAll({
    where,
    include,
    order: [["created_at", "DESC"]],
    raw: true,
    nest: true,
  });

  // Flatten nested includes to match old field names
  return rows.map((r) => ({
    ...r,
    patient_name: r.patient?.name,
    patient_phone: r.patient?.phone,
    patient_gender: r.patient?.gender,
    patient_age: r.patient?.age,
    patient_age_unit: r.patient?.age_unit,
    patient_email: r.patient?.email,
    doctor_title: r.doctor?.title,
    doctor_name: r.doctor ? r.doctor.name : r.referring_doctor_name,
    doctor_firstname: r.doctor?.firstname,
    doctor_lastname: r.doctor?.lastname,
    technician_firstname: r.technician?.firstname,
    technician_lastname: r.technician?.lastname,
    sample_id_code: r.sample?.sample_id_code,
    sample_type: r.sample?.sample_type,
    b2b_lab_name: r.b2bLab?.lab_name,
  }));
};

// Get report by ID
exports.getReportById = async (id) => {
  const row = await Report.findByPk(id, {
    include: [
      { model: Patient, as: "patient", attributes: ["name", "phone", "email", "gender", "age", "age_unit", "branch_id"] },
      { model: Doctor, as: "doctor", attributes: ["title", "name", "firstname", "lastname", "phone", "email", "signature_url"] },
      { model: User, as: "technician", attributes: ["firstname", "lastname"] },
      { model: Sample, as: "sample", attributes: ["sample_id_code", "sample_type"] },
      { model: User, as: "approvedByUser", attributes: ["firstname", "lastname"] },
      { model: User, as: "submittedByUser", attributes: ["firstname", "lastname"] },
      { model: User, as: "rejectedByUser", attributes: ["firstname", "lastname"] },
      { model: B2BLab, as: "b2bLab", attributes: ["lab_name"], required: false },
    ],
    raw: true,
    nest: true,
  });

  if (!row) return null;

  // Get settings for patient's branch
  let settings = null;
  if (row.patient?.branch_id) {
    settings = await Settings.findOne({
      where: { branch_id: row.patient.branch_id },
      raw: true,
    });
  }

  return {
    ...row,
    patient_name: row.patient?.name,
    patient_phone: row.patient?.phone,
    patient_email: row.patient?.email,
    patient_gender: row.patient?.gender,
    patient_age: row.patient?.age,
    patient_age_unit: row.patient?.age_unit,
    doctor_title: row.doctor?.title,
    doctor_name: row.doctor ? row.doctor.name : row.referring_doctor_name,
    doctor_firstname: row.doctor?.firstname,
    doctor_lastname: row.doctor?.lastname,
    doctor_phone: row.doctor?.phone,
    doctor_email: row.doctor?.email,
    doctor_signature_url: row.doctor?.signature_url,
    technician_firstname: row.technician?.firstname,
    technician_lastname: row.technician?.lastname,
    sample_id_code: row.sample?.sample_id_code,
    sample_type: row.sample?.sample_type,
    letterhead_url: settings?.letterhead_url,
    header_url: settings?.header_url,
    footer_url: settings?.footer_url,
    attach_marketing_pages: row.attach_marketing_pages || false,
    marketing_pages: (() => {
      try {
        return settings?.marketing_pages ? JSON.parse(settings.marketing_pages) : [];
      } catch (e) {
        return [];
      }
    })(),
    report_margin_top: settings?.report_margin_top,
    report_margin_bottom: settings?.report_margin_bottom,
    report_margin_left: settings?.report_margin_left,
    report_margin_right: settings?.report_margin_right,
    header_safe_area: settings?.header_safe_area,
    footer_safe_area: settings?.footer_safe_area,
    owner_signature_url: settings?.owner_signature_url || null,
    owner_signature_label: settings?.owner_signature_label || null,
    owner_signature_description: settings?.owner_signature_description || null,
    pathology_signature_url: (() => {
      if (!settings) return null;
      const idx = settings.default_signature_index;
      if (idx === 1) return settings.signature_1_url || null;
      if (idx === 2) return settings.signature_2_url || null;
      if (idx === 3) return settings.signature_3_url || null;
      if (idx === 4) return settings.signature_4_url || null;
      for (let i = 1; i <= 4; i++) {
        if (settings[`signature_${i}_url`]) return settings[`signature_${i}_url`];
      }
      return null;
    })(),
    pathology_signature_label: (() => {
      if (!settings) return null;
      const idx = settings.default_signature_index;
      if (idx === 1) return settings.signature_1_label || null;
      if (idx === 2) return settings.signature_2_label || null;
      if (idx === 3) return settings.signature_3_label || null;
      if (idx === 4) return settings.signature_4_label || null;
      for (let i = 1; i <= 4; i++) {
        if (settings[`signature_${i}_url`]) return settings[`signature_${i}_label`] || null;
      }
      return null;
    })(),
    pathology_signature_description: (() => {
      if (!settings) return null;
      const idx = settings.default_signature_index;
      if (idx === 1) return settings.signature_1_description || null;
      if (idx === 2) return settings.signature_2_description || null;
      if (idx === 3) return settings.signature_3_description || null;
      if (idx === 4) return settings.signature_4_description || null;
      for (let i = 1; i <= 4; i++) {
        if (settings[`signature_${i}_url`]) return settings[`signature_${i}_description`] || null;
      }
      return null;
    })(),

    approved_by_firstname: row.approvedByUser?.firstname,
    approved_by_lastname: row.approvedByUser?.lastname,
    submitted_by_firstname: row.submittedByUser?.firstname,
    submitted_by_lastname: row.submittedByUser?.lastname,
    rejected_by_firstname: row.rejectedByUser?.firstname,
    rejected_by_lastname: row.rejectedByUser?.lastname,
    b2b_lab_name: row.b2bLab?.lab_name,
  };
};

// Create new report
exports.createReport = async (reportData) => {
  const {
    patient_id, doctor_id, referring_doctor_name, report_type, sample_id, clinical_notes, technician_id,
    status = "draft", report_amount = 0, is_self_report = false,
    test_data = {}, findings = "", recommendations = "", branch_id,
    delivery_preferences = {}, base_amount, lab_discount_type = "percent",
    lab_discount_value = 0, doctor_discount = 0, final_amount,
    b2b_lab_id = null, b2b_charge = 0,
    price_list_id = null, attach_marketing_pages,
  } = reportData;

  const parsedB2bCharge = parseFloat(b2b_charge) || 0;

  // Calculate doctor commission
  let doctor_commission = 0;
  if (doctor_id && !is_self_report && report_amount > 0) {
    const doctor = await Doctor.findByPk(doctor_id, { attributes: ["commission_percentage"], raw: true });
    if (doctor) {
      const commissionPercent = parseFloat(doctor.commission_percentage) || 0;
      const commissionBase = Math.max(0, report_amount - parsedB2bCharge);
      doctor_commission = (commissionBase * commissionPercent) / 100;
      if (doctor_discount > 0) {
        doctor_commission = Math.max(0, doctor_commission - doctor_discount);
      }
    }
  }

  const computedBase = base_amount != null ? base_amount : report_amount;
  const computedFinal = final_amount != null ? final_amount : computedBase;

  return await Report.create({
    patient_id, doctor_id, referring_doctor_name, report_type, sample_id, clinical_notes,
    technician_id, status, report_amount, doctor_commission, is_self_report,
    test_data, findings, recommendations, delivery_preferences,
    base_amount: computedBase, lab_discount_type, lab_discount_value,
    doctor_discount, final_amount: computedFinal, payment_status: "pending",
    b2b_lab_id: b2b_lab_id || null, b2b_charge: parsedB2bCharge, branch_id,
    price_list_id,
    price_locked: ["under_review", "approved"].includes(status),
    attach_marketing_pages: attach_marketing_pages !== undefined ? attach_marketing_pages : (is_self_report ? true : false),
  });
};

// Update report
exports.updateReport = async (id, reportData) => {
  const allowedFields = [
    "findings", "recommendations", "clinical_notes", "technician_id",
    "test_data", "status", "reviewed_by", "approved_by",
    "approved_at", "submitted_by", "submitted_at", "rejected_by", "rejected_at",
    "rejection_reason", "doctor_id", "referring_doctor_name", "report_type", "report_amount", "is_self_report",
    "delivery_preferences", "base_amount", "lab_discount_type", "lab_discount_value",
    "doctor_discount", "final_amount", "payment_status", "doctor_commission",
    "b2b_lab_id", "b2b_charge", "price_list_id", "price_locked", "attach_marketing_pages",
  ];

  const updateObj = {};
  for (const [key, value] of Object.entries(reportData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updateObj[key] = value;
    }
  }

  // Get current report to perform lock check & commission calculations
  const current = await Report.findByPk(id, { raw: true });

  if (current) {
    for (const key of Object.keys(updateObj)) {
      if (areValuesEquivalent(current[key], updateObj[key])) {
        delete updateObj[key];
      }
    }

    if (Object.keys(updateObj).length === 0) {
      return exports.getReportById(id);
    }

    // If report is locked, prevent modifying any pricing-related fields
    if (current.price_locked) {
      // Allow pricing changes when tests are being added/removed (test_data is changing)
      const isTestListChange = updateObj.test_data !== undefined;
      if (isTestListChange) {
        // Keep price locked after this update completes
        updateObj.price_locked = true;
      } else {
        const pricingFields = ["report_amount", "base_amount", "lab_discount_type", "lab_discount_value", "doctor_discount", "final_amount", "price_list_id"];
        const changingPricingFields = Object.keys(updateObj).filter(key => {
          if (!pricingFields.includes(key)) return false;
          const currentVal = current[key];
          const newVal = updateObj[key];
          if (currentVal === newVal) return false;
          
          // Handle numeric comparisons (strings vs numbers from database decimal/float types)
          if (currentVal !== null && currentVal !== undefined && newVal !== null && newVal !== undefined) {
            if (!isNaN(Number(currentVal)) && !isNaN(Number(newVal))) {
              return Number(currentVal) !== Number(newVal);
            }
          }
          return currentVal !== newVal;
        });
        if (changingPricingFields.length > 0) {
          throw new Error(`Cannot modify prices — report is locked (status: ${current.status})`);
        }
      }
    }

    // Automatically manage price_locked when status is changing
    if (updateObj.status !== undefined) {
      if (["under_review", "approved"].includes(updateObj.status)) {
        updateObj.price_locked = true;
      } else if (["draft", "rejected"].includes(updateObj.status)) {
        updateObj.price_locked = false;
      }
    }

    // Keep approved reports approved during edits.
    // Status only changes when an explicit status update is requested.

    // Keep doctor commission consistent when billing/B2B/doctor fields change.
    const affectsCommission = ["doctor_id", "is_self_report", "report_amount", "b2b_charge", "doctor_discount"]
      .some((k) => Object.prototype.hasOwnProperty.call(updateObj, k));

    if (affectsCommission) {
      const doctorId = updateObj.doctor_id !== undefined ? updateObj.doctor_id : current.doctor_id;
      const isSelf = updateObj.is_self_report !== undefined ? updateObj.is_self_report : current.is_self_report;
      const reportAmount = parseFloat(updateObj.report_amount ?? current.report_amount ?? 0) || 0;
      const b2bCharge = parseFloat(updateObj.b2b_charge ?? current.b2b_charge ?? 0) || 0;
      const doctorDiscount = parseFloat(updateObj.doctor_discount ?? current.doctor_discount ?? 0) || 0;

      let doctorCommission = 0;
      if (doctorId && !isSelf && reportAmount > 0) {
        const doctor = await Doctor.findByPk(doctorId, { attributes: ["commission_percentage"], raw: true });
        if (doctor) {
          const commissionPercent = parseFloat(doctor.commission_percentage) || 0;
          const commissionBase = Math.max(0, reportAmount - b2bCharge);
          const originalCommission = (commissionBase * commissionPercent) / 100;
          doctorCommission = Math.max(0, originalCommission - doctorDiscount);
        }
      }

      updateObj.doctor_commission = doctorCommission;
    }
  }

  if (Object.keys(updateObj).length === 0) return exports.getReportById(id);

  const [count, [updated]] = await Report.update(updateObj, {
    where: { id },
    returning: true,
  });
  return updated ? updated.toJSON() : null;
};

// Update report status
exports.updateReportStatus = async (id, status, userId) => {
  const updateObj = { status };
  if (["processing", "completed"].includes(status)) updateObj.reviewed_by = userId;

  if (["under_review", "approved"].includes(status)) {
    updateObj.price_locked = true;
  } else if (["draft", "rejected"].includes(status)) {
    updateObj.price_locked = false;
  }

  const [count, [updated]] = await Report.update(updateObj, {
    where: { id },
    returning: true,
  });
  return updated ? updated.toJSON() : null;
};

// Assign technician
exports.assignTechnician = async (id, technicianId) => {
  const [count, [updated]] = await Report.update(
    { technician_id: technicianId },
    { where: { id }, returning: true }
  );
  return updated ? updated.toJSON() : null;
};

// Approve report
exports.approveReport = async (id, approvedBy) => {
  const [count, [updated]] = await Report.update(
    { status: "approved", approved_by: approvedBy, price_locked: true },
    { where: { id }, returning: true }
  );
  return updated ? updated.toJSON() : null;
};

// Get reports by patient
exports.getReportsByPatient = async (patientId) => {
  const rows = await Report.findAll({
    where: { patient_id: patientId },
    include: [
      { model: Doctor, as: "doctor", attributes: ["firstname", "lastname"] },
      { model: User, as: "technician", attributes: ["firstname", "lastname"] },
    ],
    order: [["created_at", "DESC"]],
    raw: true,
    nest: true,
  });

  return rows.map((r) => ({
    ...r,
    doctor_firstname: r.doctor?.firstname,
    doctor_lastname: r.doctor?.lastname,
    technician_firstname: r.technician?.firstname,
    technician_lastname: r.technician?.lastname,
  }));
};

// Delete report
exports.deleteReport = async (id) => {
  const deleted = await Report.destroy({ where: { id } });
  return deleted ? { id } : null;
};
