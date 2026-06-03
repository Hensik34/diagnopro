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
const { sequelize, Settings } = require('../models');
const { PERMISSIONS } = require('../config/permissions');
const { can } = require('../utils/can');

const SAMPLE_ID_FORMATS = {
  NUMERIC: 'numeric',
  SM_PREFIX: 'sm_prefix',
};

const SAMPLE_ID_RESET_POLICIES = {
  YEARLY: 'yearly',
  MONTHLY: 'monthly',
};

const DEFAULT_SAMPLE_ID_CONFIG = {
  sample_id_format: SAMPLE_ID_FORMATS.NUMERIC,
  sample_id_reset_policy: SAMPLE_ID_RESET_POLICIES.YEARLY,
  sample_id_fy_start_month: 3,
  sample_id_start_number: 1001,
};

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

function getClampedStartMonth(value) {
  const month = Number(value);
  if (!Number.isInteger(month) || month < 1 || month > 12) return DEFAULT_SAMPLE_ID_CONFIG.sample_id_fy_start_month;
  return month;
}

function getStartNumber(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_SAMPLE_ID_CONFIG.sample_id_start_number;
  return parsed;
}

async function getSampleIdConfig(branchId) {
  if (!branchId) {
    return { ...DEFAULT_SAMPLE_ID_CONFIG };
  }

  const settings = await Settings.findOne({
    where: { branch_id: branchId },
    raw: true,
  });

  if (!settings) {
    return { ...DEFAULT_SAMPLE_ID_CONFIG };
  }

  const requestedFormat = settings.sample_id_format;
  const requestedReset = settings.sample_id_reset_policy;

  const sample_id_format = Object.values(SAMPLE_ID_FORMATS).includes(requestedFormat)
    ? requestedFormat
    : DEFAULT_SAMPLE_ID_CONFIG.sample_id_format;

  const sample_id_reset_policy = Object.values(SAMPLE_ID_RESET_POLICIES).includes(requestedReset)
    ? requestedReset
    : DEFAULT_SAMPLE_ID_CONFIG.sample_id_reset_policy;

  return {
    sample_id_format,
    sample_id_reset_policy,
    sample_id_fy_start_month: getClampedStartMonth(settings.sample_id_fy_start_month),
    sample_id_start_number: getStartNumber(settings.sample_id_start_number),
  };
}

function getPeriodRange(now, config) {
  if (config.sample_id_reset_policy === SAMPLE_ID_RESET_POLICIES.MONTHLY) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const periodKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    return { start, end, periodKey };
  }

  const startMonthIndex = config.sample_id_fy_start_month - 1;
  const fyStartYear = now.getMonth() >= startMonthIndex ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(fyStartYear, startMonthIndex, 1);
  const end = new Date(fyStartYear + 1, startMonthIndex, 1);
  return { start, end, periodKey: `FY-${fyStartYear}` };
}

function formatSampleId(number, format) {
  if (format === SAMPLE_ID_FORMATS.SM_PREFIX) {
    return `SM-${number}`;
  }
  return String(number);
}

function getSampleIdPattern(format) {
  if (format === SAMPLE_ID_FORMATS.SM_PREFIX) {
    return '^SM-[0-9]+$';
  }
  return '^[0-9]+$';
}

function getExtractionSql(format) {
  if (format === SAMPLE_ID_FORMATS.SM_PREFIX) {
    return "CAST(SUBSTRING(sample_id_code FROM 4) AS BIGINT)";
  }
  return 'CAST(sample_id_code AS BIGINT)';
}

async function getMaxNumberInPeriod({ start, end, format, transaction }) {
  const pattern = getSampleIdPattern(format);
  const extractionSql = getExtractionSql(format);

  const [rows] = await sequelize.query(
    `SELECT MAX(${extractionSql}) AS max_number
     FROM samples
     WHERE created_at >= :startAt
       AND created_at < :endAt
       AND sample_id_code ~ :pattern`,
    {
      replacements: {
        startAt: start,
        endAt: end,
        pattern,
      },
      transaction,
    }
  );

  const rawMax = rows?.[0]?.max_number;
  return rawMax == null ? null : Number(rawMax);
}

async function sampleIdExists(sampleIdCode, transaction) {
  const [rows] = await sequelize.query(
    'SELECT 1 FROM samples WHERE sample_id_code = :sampleIdCode LIMIT 1',
    {
      replacements: { sampleIdCode },
      transaction,
    }
  );
  return rows.length > 0;
}

/**
 * Generate unique sample ID using branch settings.
 * Predefined formats only:
 * - numeric: 1001
 * - sm_prefix: SM-1001
 * Reset policy:
 * - yearly (financial year based on configured start month, default March)
 * - monthly
 */
async function generateSampleId(branchId) {
  const config = await getSampleIdConfig(branchId);
  const now = new Date();
  const { start, end, periodKey } = getPeriodRange(now, config);

  return sequelize.transaction(async (transaction) => {
    const lockScope = branchId || 'global';
    const lockKey = `sample_id:${lockScope}:${config.sample_id_format}:${periodKey}`;

    await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:lockKey))', {
      replacements: { lockKey },
      transaction,
    });

    const maxInPeriod = await getMaxNumberInPeriod({
      start,
      end,
      format: config.sample_id_format,
      transaction,
    });

    let nextNumber = Math.max(config.sample_id_start_number, (maxInPeriod || 0) + 1);
    let candidate = formatSampleId(nextNumber, config.sample_id_format);

    while (await sampleIdExists(candidate, transaction)) {
      nextNumber += 1;
      candidate = formatSampleId(nextNumber, config.sample_id_format);
    }

    return candidate;
  });
}

/**
 * Peek at next sample ID without incrementing counter
 * Used for preview/display purposes only
 * @returns {Promise<string>}
 */
async function peekNextSampleId(branchId) {
  const config = await getSampleIdConfig(branchId);
  const { start, end } = getPeriodRange(new Date(), config);

  const maxInPeriod = await getMaxNumberInPeriod({
    start,
    end,
    format: config.sample_id_format,
  });

  let nextNumber = Math.max(config.sample_id_start_number, (maxInPeriod || 0) + 1);
  let preview = formatSampleId(nextNumber, config.sample_id_format);

  while (await sampleIdExists(preview)) {
    nextNumber += 1;
    preview = formatSampleId(nextNumber, config.sample_id_format);
  }

  return preview;
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
  SAMPLE_ID_FORMATS,
  SAMPLE_ID_RESET_POLICIES,
  DEFAULT_SAMPLE_ID_CONFIG,
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
