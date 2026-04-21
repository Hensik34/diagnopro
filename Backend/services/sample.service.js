/**
 * ============================================
 * SAMPLE SERVICE - Business Logic Layer
 * ============================================
 * 
 * Contains all business logic for sample collection workflow:
 * - Status transitions with validation
 * - Sample ID generation
 * - Workflow tracking
 */

const Sample = require('../models/Sample');
const { PERMISSIONS } = require('../config/permissions');
const { can } = require('../utils/can');

// ==========================================
// SAMPLE STATUS WORKFLOW
// ==========================================

/**
 * Valid status values
 */
const SAMPLE_STATUS = {
  PENDING: 'pending',
  COLLECTED: 'collected',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
};

/**
 * Status transition rules
 */
const STATUS_TRANSITIONS = {
  [SAMPLE_STATUS.PENDING]: [SAMPLE_STATUS.COLLECTED, SAMPLE_STATUS.REJECTED],
  [SAMPLE_STATUS.COLLECTED]: [SAMPLE_STATUS.PROCESSING, SAMPLE_STATUS.REJECTED],
  [SAMPLE_STATUS.PROCESSING]: [SAMPLE_STATUS.COMPLETED, SAMPLE_STATUS.REJECTED],
  [SAMPLE_STATUS.COMPLETED]: [], // Final state
  [SAMPLE_STATUS.REJECTED]: [SAMPLE_STATUS.PENDING], // Can be re-collected
};

/**
 * Sample types supported
 */
const SAMPLE_TYPES = [
  'blood',
  'urine',
  'stool',
  'sputum',
  'swab',
  'tissue',
  'csf',
  'other',
];

// ==========================================
// SERVICE METHODS
// ==========================================

/**
 * Generate unique sample ID using monthly-reset counter
 * Format: SM-YYMM-1001, SM-YYMM-1002, ... (resets each month)
 * This INCREMENTS the counter - only call when actually saving
 * @returns {Promise<string>}
 */
async function generateSampleId() {
  const pool = require('../config/db');
  const result = await pool.query('SELECT generate_sample_id() as sample_id');
  return result.rows[0].sample_id;
}

/**
 * Peek at next sample ID without incrementing counter
 * Used for preview/display purposes only
 * @returns {Promise<string>}
 */
async function peekNextSampleId() {
  const pool = require('../config/db');
  const currentYm = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const yy = currentYm.slice(2, 4);
  const mm = currentYm.slice(5, 7);
  
  const result = await pool.query(
    'SELECT last_number FROM sample_id_counter WHERE year_month = $1',
    [currentYm]
  );
  
  // If no row exists for this month, next will be 1001
  const nextNum = result.rows.length > 0 ? result.rows[0].last_number + 1 : 1001;
  return `SM-${yy}${mm}-${nextNum}`;
}

/**
 * Check if a status transition is valid
 * @param {string} currentStatus 
 * @param {string} newStatus 
 * @returns {boolean}
 */
function isValidTransition(currentStatus, newStatus) {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Create a new sample
 * @param {Object} data Sample data
 * @param {string} userId User creating the sample
 * @param {string} branchId Branch ID
 * @returns {Promise<Object>}
 */
async function createSample(data, userId, branchId) {
  // Validate sample type
  if (!SAMPLE_TYPES.includes(data.sample_type)) {
    throw new Error(`Invalid sample type. Must be one of: ${SAMPLE_TYPES.join(', ')}`);
  }

  // Generate sample ID if not provided
  const sampleIdCode = data.sample_id_code || await generateSampleId(branchId);

  const sampleData = {
    patient_id: data.patient_id,
    sample_type: data.sample_type,
    sample_id_code: sampleIdCode,
    collection_date: data.collection_date || new Date().toISOString(),
    collected_by: userId,
    branch_id: branchId,
    notes: data.notes || '',
    status: SAMPLE_STATUS.PENDING,
  };

  return await Sample.createSample(sampleData);
}

/**
 * Collect a sample (pending -> collected)
 * @param {string} sampleId 
 * @param {string} userId 
 * @param {Object} collectionData 
 * @returns {Promise<Object>}
 */
async function collectSample(sampleId, userId, collectionData = {}) {
  const sample = await Sample.getSampleById(sampleId);
  
  if (!sample) {
    throw new Error('Sample not found');
  }

  if (sample.status !== SAMPLE_STATUS.PENDING) {
    throw new Error(`Cannot collect sample with status '${sample.status}'`);
  }

  return await Sample.updateSample(sampleId, {
    status: SAMPLE_STATUS.COLLECTED,
    collected_by: userId,
    collection_date: new Date().toISOString(),
    ...collectionData,
  });
}

/**
 * Start processing a sample (collected -> processing)
 * @param {string} sampleId 
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
async function startProcessing(sampleId, userId) {
  const sample = await Sample.getSampleById(sampleId);
  
  if (!sample) {
    throw new Error('Sample not found');
  }

  if (!isValidTransition(sample.status, SAMPLE_STATUS.PROCESSING)) {
    throw new Error(`Cannot start processing sample with status '${sample.status}'`);
  }

  return await Sample.updateSample(sampleId, {
    status: SAMPLE_STATUS.PROCESSING,
  });
}

/**
 * Complete sample processing (processing -> completed)
 * @param {string} sampleId 
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
async function completeSample(sampleId, userId) {
  const sample = await Sample.getSampleById(sampleId);
  
  if (!sample) {
    throw new Error('Sample not found');
  }

  if (!isValidTransition(sample.status, SAMPLE_STATUS.COMPLETED)) {
    throw new Error(`Cannot complete sample with status '${sample.status}'`);
  }

  return await Sample.updateSample(sampleId, {
    status: SAMPLE_STATUS.COMPLETED,
  });
}

/**
 * Reject a sample
 * @param {string} sampleId 
 * @param {string} userId 
 * @param {string} reason 
 * @returns {Promise<Object>}
 */
async function rejectSample(sampleId, userId, reason) {
  const sample = await Sample.getSampleById(sampleId);
  
  if (!sample) {
    throw new Error('Sample not found');
  }

  if (sample.status === SAMPLE_STATUS.COMPLETED) {
    throw new Error('Cannot reject a completed sample');
  }

  return await Sample.updateSample(sampleId, {
    status: SAMPLE_STATUS.REJECTED,
    notes: reason ? `Rejected: ${reason}` : sample.notes,
  });
}

/**
 * Update sample status with validation
 * @param {string} sampleId 
 * @param {string} newStatus 
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
async function updateSampleStatus(sampleId, newStatus, userId) {
  const sample = await Sample.getSampleById(sampleId);
  
  if (!sample) {
    throw new Error('Sample not found');
  }

  if (!isValidTransition(sample.status, newStatus)) {
    throw new Error(
      `Invalid status transition from '${sample.status}' to '${newStatus}'. ` +
      `Allowed transitions: ${STATUS_TRANSITIONS[sample.status]?.join(', ') || 'none'}`
    );
  }

  return await Sample.updateSample(sampleId, { status: newStatus });
}

/**
 * Get samples with workflow summary
 * @param {Object} filters 
 * @returns {Promise<Object>}
 */
async function getSamplesWithSummary(filters = {}) {
  const samples = await Sample.getSamples(filters);
  
  const summary = {
    total: samples.length,
    pending: samples.filter(s => s.status === SAMPLE_STATUS.PENDING).length,
    collected: samples.filter(s => s.status === SAMPLE_STATUS.COLLECTED).length,
    processing: samples.filter(s => s.status === SAMPLE_STATUS.PROCESSING).length,
    completed: samples.filter(s => s.status === SAMPLE_STATUS.COMPLETED).length,
    rejected: samples.filter(s => s.status === SAMPLE_STATUS.REJECTED).length,
  };

  return { samples, summary };
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  // Constants
  SAMPLE_STATUS,
  SAMPLE_TYPES,
  STATUS_TRANSITIONS,
  
  // Utils
  generateSampleId,
  peekNextSampleId,
  isValidTransition,
  
  // Core operations
  createSample,
  collectSample,
  startProcessing,
  completeSample,
  rejectSample,
  updateSampleStatus,
  getSamplesWithSummary,
};
