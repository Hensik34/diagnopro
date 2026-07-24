/**
 * ============================================
 * REPORT SERVICE - Business Logic Layer
 * ============================================
 * 
 * Contains all business logic for report workflow:
 * - Status transitions with validation
 * - Test data management
 * - Commission calculations
 * - Approval/rejection logic
 */

const Report = require('../models/Report');
const { PERMISSIONS } = require('../config/permissions');
const { can } = require('../utils/can');

// ==========================================
// REPORT STATUS WORKFLOW
// ==========================================

/**
 * Valid status values and their display names
 */
const REPORT_STATUS = {
  DRAFT: 'draft',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

/**
 * Status transition rules
 * Key = current status, Value = array of allowed next statuses
 */
const STATUS_TRANSITIONS = {
  [REPORT_STATUS.DRAFT]: [REPORT_STATUS.UNDER_REVIEW],
  [REPORT_STATUS.UNDER_REVIEW]: [REPORT_STATUS.APPROVED, REPORT_STATUS.REJECTED],
  [REPORT_STATUS.APPROVED]: [], // Final state - no transitions allowed
  [REPORT_STATUS.REJECTED]: [REPORT_STATUS.DRAFT, REPORT_STATUS.UNDER_REVIEW], // Can be revised back to draft or re-submitted directly
};

/**
 * Roles allowed to perform status transitions
 */
const TRANSITION_PERMISSIONS = {
  // Draft -> Under Review: technician or staff can submit
  [`${REPORT_STATUS.DRAFT}_to_${REPORT_STATUS.UNDER_REVIEW}`]: [
    PERMISSIONS.REPORT_CREATE,
  ],
  // Under Review -> Approved: doctor or admin can approve
  [`${REPORT_STATUS.UNDER_REVIEW}_to_${REPORT_STATUS.APPROVED}`]: [
    PERMISSIONS.REPORT_APPROVE,
  ],
  // Under Review -> Rejected: doctor or admin can reject
  [`${REPORT_STATUS.UNDER_REVIEW}_to_${REPORT_STATUS.REJECTED}`]: [
    PERMISSIONS.REPORT_APPROVE, // Same permission for reject
  ],
  // Rejected -> Draft: original creator can revise
  [`${REPORT_STATUS.REJECTED}_to_${REPORT_STATUS.DRAFT}`]: [
    PERMISSIONS.REPORT_UPDATE,
  ],
  // Rejected -> Under Review: re-submit after editing
  [`${REPORT_STATUS.REJECTED}_to_${REPORT_STATUS.UNDER_REVIEW}`]: [
    PERMISSIONS.REPORT_CREATE,
  ],
};

// ==========================================
// SERVICE METHODS
// ==========================================

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
 * Check if user has permission to perform a transition
 * @param {string} userRole 
 * @param {string} fromStatus 
 * @param {string} toStatus 
 * @returns {boolean}
 */
function canPerformTransition(userRole, fromStatus, toStatus) {
  const transitionKey = `${fromStatus}_to_${toStatus}`;
  const requiredPermissions = TRANSITION_PERMISSIONS[transitionKey] || [];
  
  // Check if user has any of the required permissions
  return requiredPermissions.some(permission => can(userRole, permission));
}

/**
 * Check if report can be edited based on status
 * @param {string} status 
 * @returns {boolean}
 */
function isEditable(status) {
  return (
    status === REPORT_STATUS.DRAFT ||
    status === REPORT_STATUS.REJECTED ||
    status === REPORT_STATUS.APPROVED
  );
}

/**
 * Validate test data structure
 * @param {Object} testData 
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTestData(testData) {
  const errors = [];
  
  if (!testData || typeof testData !== 'object') {
    errors.push('Test data must be an object');
    return { valid: false, errors };
  }

  // Check for required fields in test parameters
  if (testData.parameters && Array.isArray(testData.parameters)) {
    testData.parameters.forEach((param, index) => {
      if (!param.name) {
        errors.push(`Parameter ${index + 1}: name is required`);
      }
      if (param.value === undefined || param.value === null || param.value === '') {
        // Value can be empty for draft, but flag it
        // errors.push(`Parameter ${index + 1}: value is required`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculate doctor commission based on report amount
 * @param {number} reportAmount 
 * @param {number} commissionPercentage 
 * @returns {number}
 */
function calculateCommission(reportAmount, commissionPercentage) {
  if (!reportAmount || !commissionPercentage) return 0;
  return Math.round((reportAmount * commissionPercentage / 100) * 100) / 100;
}

/**
 * Create a new report with draft status
 * @param {Object} data Report data
 * @param {string} userId User creating the report
 * @param {string} branchId Branch ID
 * @returns {Promise<Object>} Created report
 */
async function createDraftReport(data, userId, branchId) {
  const reportData = {
    ...data,
    status: REPORT_STATUS.DRAFT,
    created_by: userId,
    branch_id: branchId,
    test_data: data.test_data || {},
  };

  // Calculate commission if doctor and amount provided
  if (data.doctor_id && data.report_amount && !data.is_self_report) {
    // Commission will be calculated in the model based on doctor's rate
    reportData.doctor_commission = calculateCommission(
      data.report_amount, 
      data.commission_percentage || 0
    );
  }

  return await Report.createReport(reportData);
}

/**
 * Helper to compute report overall status based on test_approvals
 */
function computeReportStatus(testApprovals = {}, testIds = []) {
  if (!testIds || testIds.length === 0) return REPORT_STATUS.DRAFT;
  const statuses = testIds.map(id => testApprovals[id]?.status || 'pending');
  // A test is "in review" once it's been sent for approval. Both spellings are treated
  // as review since the send/submit flows write 'under_review'.
  const isReview = (s) => s === 'under_review' || s === 'pending_approval';
  if (statuses.every(s => s === 'approved')) return REPORT_STATUS.APPROVED;
  if (statuses.some(isReview) && statuses.every(s => isReview(s) || s === 'approved')) return REPORT_STATUS.UNDER_REVIEW;
  return REPORT_STATUS.DRAFT;
}

/**
 * Submit report for review (draft -> under_review or approved)
 * If user has REPORT_APPROVE permission, auto-approves instead of going to review
 * @param {string} reportId 
 * @param {string} userId 
 * @param {string} userRole 
 * @returns {Promise<Object>}
 */
async function submitForReview(reportId, userId, userRole) {
  const report = await Report.getReportById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }

  if (report.status !== REPORT_STATUS.DRAFT && report.status !== REPORT_STATUS.REJECTED) {
    throw new Error(`Cannot submit report with status '${report.status}'. Only draft or rejected reports can be submitted.`);
  }

  if (!canPerformTransition(userRole, report.status, REPORT_STATUS.UNDER_REVIEW)) {
    throw new Error('You do not have permission to submit this report');
  }

  // Validate test data before submission
  const { valid, errors } = validateTestData(report.test_data);
  if (!valid) {
    throw new Error(`Test data validation failed: ${errors.join(', ')}`);
  }

  const UserModel = require('../models/User');
  const dbUser = await UserModel.findUserById(userId);
  const userCanApprove = can(userRole, PERMISSIONS.REPORT_APPROVE, { can_approve_reports: dbUser?.can_approve_reports });

  let rawTestData = report.test_data || {};
  let parsedTestData = typeof rawTestData === 'string' ? JSON.parse(rawTestData) : { ...rawTestData };
  let testIds = parsedTestData.testIds || (parsedTestData.tests ? parsedTestData.tests.map(t => t.testId || t.id).filter(Boolean) : []);
  let testApprovals = { ...(parsedTestData.test_approvals || {}) };

  const nowStr = new Date().toISOString();
  const userName = dbUser ? `${dbUser.firstname || ''} ${dbUser.lastname || ''}`.trim() : 'User';

  if (userCanApprove) {
    for (const tid of testIds) {
      testApprovals[tid] = {
        status: REPORT_STATUS.APPROVED,
        approved_by: userId,
        approved_at: nowStr,
        approved_by_name: userName,
      };
    }
    parsedTestData.test_approvals = testApprovals;

    return await Report.updateReport(reportId, {
      status: REPORT_STATUS.APPROVED,
      test_data: parsedTestData,
      submitted_at: nowStr,
      submitted_by: userId,
      approved_by: userId,
      approved_at: nowStr,
      reviewed_by: userId,
    });
  }

  for (const tid of testIds) {
    if (!testApprovals[tid] || testApprovals[tid].status !== REPORT_STATUS.APPROVED) {
      testApprovals[tid] = {
        status: REPORT_STATUS.UNDER_REVIEW,
        sent_at: nowStr,
        sent_by: userId,
        sent_by_name: userName,
      };
    }
  }
  parsedTestData.test_approvals = testApprovals;

  return await Report.updateReport(reportId, {
    status: REPORT_STATUS.UNDER_REVIEW,
    test_data: parsedTestData,
    submitted_at: nowStr,
    submitted_by: userId,
  });
}

/**
 * Approve a report (under_review -> approved)
 * @param {string} reportId 
 * @param {string} userId 
 * @param {string} userRole 
 * @returns {Promise<Object>}
 */
async function approveReport(reportId, userId, userRole) {
  const report = await Report.getReportById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }

  if (report.status !== REPORT_STATUS.UNDER_REVIEW && report.status !== REPORT_STATUS.DRAFT) {
    throw new Error(`Cannot approve report with status '${report.status}'.`);
  }

  const UserModel = require('../models/User');
  const dbUser = await UserModel.findUserById(userId);
  const isApprovedAllowed = can(userRole, PERMISSIONS.REPORT_APPROVE, { can_approve_reports: dbUser?.can_approve_reports });

  if (!isApprovedAllowed) {
    throw new Error('You do not have permission to approve reports');
  }

  const nowStr = new Date().toISOString();
  const userName = dbUser ? `${dbUser.firstname || ''} ${dbUser.lastname || ''}`.trim() : 'User';

  let rawTestData = report.test_data || {};
  let parsedTestData = typeof rawTestData === 'string' ? JSON.parse(rawTestData) : { ...rawTestData };
  let testIds = parsedTestData.testIds || (parsedTestData.tests ? parsedTestData.tests.map(t => t.testId || t.id).filter(Boolean) : []);
  let testApprovals = { ...(parsedTestData.test_approvals || {}) };

  for (const tid of testIds) {
    testApprovals[tid] = {
      status: REPORT_STATUS.APPROVED,
      approved_by: userId,
      approved_at: nowStr,
      approved_by_name: userName,
    };
  }
  parsedTestData.test_approvals = testApprovals;

  return await Report.updateReport(reportId, {
    status: REPORT_STATUS.APPROVED,
    test_data: parsedTestData,
    approved_by: userId,
    approved_at: nowStr,
    reviewed_by: userId,
  });
}

/**
 * Reject a report (under_review -> rejected)
 * @param {string} reportId 
 * @param {string} userId 
 * @param {string} userRole 
 * @param {string} reason Rejection reason
 * @returns {Promise<Object>}
 */
async function rejectReport(reportId, userId, userRole, reason) {
  const report = await Report.getReportById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }

  if (report.status !== REPORT_STATUS.UNDER_REVIEW) {
    throw new Error(`Cannot reject report with status '${report.status}'. Only reports under review can be rejected.`);
  }

  const UserModel = require('../models/User');
  const dbUser = await UserModel.findUserById(userId);
  const isApprovedAllowed = can(userRole, PERMISSIONS.REPORT_APPROVE, { can_approve_reports: dbUser?.can_approve_reports });

  if (!isApprovedAllowed) {
    throw new Error('You do not have permission to reject reports');
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error('Rejection reason is required');
  }

  const nowStr = new Date().toISOString();
  const userName = dbUser ? `${dbUser.firstname || ''} ${dbUser.lastname || ''}`.trim() : 'User';

  let rawTestData = report.test_data || {};
  let parsedTestData = typeof rawTestData === 'string' ? JSON.parse(rawTestData) : { ...rawTestData };
  let testIds = parsedTestData.testIds || (parsedTestData.tests ? parsedTestData.tests.map(t => t.testId || t.id).filter(Boolean) : []);
  let testApprovals = { ...(parsedTestData.test_approvals || {}) };

  for (const tid of testIds) {
    if (testApprovals[tid]?.status === REPORT_STATUS.UNDER_REVIEW) {
      testApprovals[tid] = {
        status: REPORT_STATUS.REJECTED,
        rejected_by: userId,
        rejected_at: nowStr,
        rejected_by_name: userName,
        reason: reason.trim(),
      };
    }
  }
  parsedTestData.test_approvals = testApprovals;

  return await Report.updateReport(reportId, {
    status: REPORT_STATUS.REJECTED,
    test_data: parsedTestData,
    rejected_by: userId,
    rejected_at: nowStr,
    rejection_reason: reason.trim(),
    reviewed_by: userId,
  });
}

/**
 * Approve a single test inside a report
 */
async function approveTest(reportId, testId, userId, userRole) {
  const report = await Report.getReportById(reportId);
  if (!report) throw new Error('Report not found');

  const UserModel = require('../models/User');
  const dbUser = await UserModel.findUserById(userId);
  const isApprovedAllowed = can(userRole, PERMISSIONS.REPORT_APPROVE, { can_approve_reports: dbUser?.can_approve_reports });

  if (!isApprovedAllowed) {
    throw new Error('You do not have permission to approve tests');
  }

  let rawTestData = report.test_data || {};
  let parsedTestData = typeof rawTestData === 'string' ? JSON.parse(rawTestData) : { ...rawTestData };
  let testIds = parsedTestData.testIds || (parsedTestData.tests ? parsedTestData.tests.map(t => t.testId || t.id).filter(Boolean) : []);
  
  if (!testIds.includes(testId)) {
    throw new Error('Test ID not found in report');
  }

  let testApprovals = { ...(parsedTestData.test_approvals || {}) };
  const userName = dbUser ? `${dbUser.firstname || ''} ${dbUser.lastname || ''}`.trim() : 'User';

  testApprovals[testId] = {
    status: REPORT_STATUS.APPROVED,
    approved_by: userId,
    approved_at: new Date().toISOString(),
    approved_by_name: userName,
  };

  parsedTestData.test_approvals = testApprovals;
  const newReportStatus = computeReportStatus(testApprovals, testIds);

  const updatePayload = {
    test_data: parsedTestData,
    status: newReportStatus,
  };

  if (newReportStatus === REPORT_STATUS.APPROVED) {
    updatePayload.approved_by = userId;
    updatePayload.approved_at = new Date().toISOString();
    updatePayload.reviewed_by = userId;
  }

  return await Report.updateReport(reportId, updatePayload);
}

/**
 * Reject a single test inside a report
 */
async function rejectTest(reportId, testId, userId, userRole, reason) {
  const report = await Report.getReportById(reportId);
  if (!report) throw new Error('Report not found');

  if (!reason || reason.trim().length === 0) {
    throw new Error('Rejection reason is required');
  }

  const UserModel = require('../models/User');
  const dbUser = await UserModel.findUserById(userId);
  const isApprovedAllowed = can(userRole, PERMISSIONS.REPORT_APPROVE, { can_approve_reports: dbUser?.can_approve_reports });

  if (!isApprovedAllowed) {
    throw new Error('You do not have permission to reject tests');
  }

  let rawTestData = report.test_data || {};
  let parsedTestData = typeof rawTestData === 'string' ? JSON.parse(rawTestData) : { ...rawTestData };
  let testIds = parsedTestData.testIds || (parsedTestData.tests ? parsedTestData.tests.map(t => t.testId || t.id).filter(Boolean) : []);

  if (!testIds.includes(testId)) {
    throw new Error('Test ID not found in report');
  }

  let testApprovals = { ...(parsedTestData.test_approvals || {}) };
  const userName = dbUser ? `${dbUser.firstname || ''} ${dbUser.lastname || ''}`.trim() : 'User';

  testApprovals[testId] = {
    status: REPORT_STATUS.REJECTED,
    rejected_by: userId,
    rejected_at: new Date().toISOString(),
    rejected_by_name: userName,
    reason: reason.trim(),
  };

  parsedTestData.test_approvals = testApprovals;
  const newReportStatus = computeReportStatus(testApprovals, testIds);

  return await Report.updateReport(reportId, {
    test_data: parsedTestData,
    status: newReportStatus,
    rejection_reason: `Test rejected: ${reason.trim()}`,
  });
}

/**
 * Send a single test for approval
 */
async function sendTestForApproval(reportId, testId, userId) {
  const report = await Report.getReportById(reportId);
  if (!report) throw new Error('Report not found');

  const UserModel = require('../models/User');
  const dbUser = await UserModel.findUserById(userId);

  let rawTestData = report.test_data || {};
  let parsedTestData = typeof rawTestData === 'string' ? JSON.parse(rawTestData) : { ...rawTestData };
  let testIds = parsedTestData.testIds || (parsedTestData.tests ? parsedTestData.tests.map(t => t.testId || t.id).filter(Boolean) : []);

  if (!testIds.includes(testId)) {
    throw new Error('Test ID not found in report');
  }

  let testApprovals = { ...(parsedTestData.test_approvals || {}) };
  const userName = dbUser ? `${dbUser.firstname || ''} ${dbUser.lastname || ''}`.trim() : 'User';

  testApprovals[testId] = {
    status: REPORT_STATUS.UNDER_REVIEW,
    sent_at: new Date().toISOString(),
    sent_by: userId,
    sent_by_name: userName,
  };

  parsedTestData.test_approvals = testApprovals;
  const newReportStatus = computeReportStatus(testApprovals, testIds);

  return await Report.updateReport(reportId, {
    test_data: parsedTestData,
    status: newReportStatus,
    submitted_at: new Date().toISOString(),
    submitted_by: userId,
  });
}

/**
 * Send all tests for approval
 */
async function sendAllTestsForApproval(reportId, userId) {
  const report = await Report.getReportById(reportId);
  if (!report) throw new Error('Report not found');

  const UserModel = require('../models/User');
  const dbUser = await UserModel.findUserById(userId);

  let rawTestData = report.test_data || {};
  let parsedTestData = typeof rawTestData === 'string' ? JSON.parse(rawTestData) : { ...rawTestData };
  let testIds = parsedTestData.testIds || (parsedTestData.tests ? parsedTestData.tests.map(t => t.testId || t.id).filter(Boolean) : []);

  let testApprovals = { ...(parsedTestData.test_approvals || {}) };
  const userName = dbUser ? `${dbUser.firstname || ''} ${dbUser.lastname || ''}`.trim() : 'User';
  const nowStr = new Date().toISOString();

  for (const tid of testIds) {
    if (!testApprovals[tid] || testApprovals[tid].status !== REPORT_STATUS.APPROVED) {
      testApprovals[tid] = {
        status: REPORT_STATUS.UNDER_REVIEW,
        sent_at: nowStr,
        sent_by: userId,
        sent_by_name: userName,
      };
    }
  }

  parsedTestData.test_approvals = testApprovals;
  const newReportStatus = computeReportStatus(testApprovals, testIds);

  return await Report.updateReport(reportId, {
    test_data: parsedTestData,
    status: newReportStatus,
    submitted_at: nowStr,
    submitted_by: userId,
  });
}

/**
 * Update test data for a report
 * Only allowed for draft/rejected reports
 * @param {string} reportId 
 * @param {Object} testData 
 * @param {string} userRole 
 * @returns {Promise<Object>}
 */
async function updateTestData(reportId, testData, userRole) {
  const report = await Report.getReportById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }

  if (!isEditable(report.status)) {
    throw new Error(`Cannot edit report with status '${report.status}'. Only draft or rejected reports can be edited.`);
  }

  if (!can(userRole, PERMISSIONS.REPORT_UPDATE)) {
    throw new Error('You do not have permission to update reports');
  }

  return await Report.updateReport(reportId, {
    test_data: testData,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Get all reports with workflow status summary
 * @param {Object} filters 
 * @returns {Promise<Object>}
 */
async function getReportsWithSummary(filters = {}) {
  const reports = await Report.getAllReports(filters);
  
  // Calculate summary counts
  const summary = {
    total: reports.length,
    draft: reports.filter(r => r.status === REPORT_STATUS.DRAFT).length,
    under_review: reports.filter(r => r.status === REPORT_STATUS.UNDER_REVIEW).length,
    approved: reports.filter(r => r.status === REPORT_STATUS.APPROVED).length,
    rejected: reports.filter(r => r.status === REPORT_STATUS.REJECTED).length,
  };

  return { reports, summary };
}

/**
 * Revise a rejected report (rejected -> draft)
 * @param {string} reportId 
 * @param {string} userId 
 * @param {string} userRole 
 * @returns {Promise<Object>}
 */
async function reviseReport(reportId, userId, userRole) {
  const report = await Report.getReportById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }

  if (report.status !== REPORT_STATUS.REJECTED) {
    throw new Error(`Cannot revise report with status '${report.status}'. Only rejected reports can be revised.`);
  }

  if (!canPerformTransition(userRole, report.status, REPORT_STATUS.DRAFT)) {
    throw new Error('You do not have permission to revise this report');
  }

  return await Report.updateReport(reportId, {
    status: REPORT_STATUS.DRAFT,
    // Clear rejection fields
    rejected_by: null,
    rejected_at: null,
    rejection_reason: null,
    // Clear submission fields
    submitted_by: null,
    submitted_at: null,
  });
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  // Constants
  REPORT_STATUS,
  STATUS_TRANSITIONS,
  
  // Validation
  isValidTransition,
  canPerformTransition,
  isEditable,
  validateTestData,
  calculateCommission,
  computeReportStatus,
  
  // Core operations
  createDraftReport,
  submitForReview,
  approveReport,
  rejectReport,
  updateTestData,
  reviseReport,
  getReportsWithSummary,

  // Per-test approval operations
  approveTest,
  rejectTest,
  sendTestForApproval,
  sendAllTestsForApproval,
};
