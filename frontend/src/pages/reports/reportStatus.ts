import type { Report, TestApprovalStatus } from '../../types';

/**
 * Per-test workflow status for a report, derived from `test_data.test_approvals`.
 * Mirrors the backend `computeReportStatus()` semantics (report.service.js) but exposes
 * per-test detail so the UI can split a single report across the Pending / Review / Approved
 * tabs (a partially-approved report appears in more than one).
 */
export interface ReportTestStatuses {
  /** All testIds belonging to the report (grouped tests, testIds[], else empty). */
  testIds: string[];
  /** Effective status per testId (defaults to 'pending' when no approval record exists). */
  perTest: Record<string, TestApprovalStatus>;
  /** At least one test still needs entry/approval (pending or rejected). */
  hasPending: boolean;
  /** At least one test is awaiting review. */
  hasReview: boolean;
  /** At least one test is approved. */
  hasApproved: boolean;
  /** testIds that are approved. */
  approvedTestIds: string[];
  /** Most recent approval timestamp across approved tests (ISO), or null. */
  lastApprovedAt: string | null;
}

function parseTestData(report: Report): any {
  const raw = report.test_data as any;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

/** Extract the ordered list of testIds for a report from any of the supported shapes. */
export function getReportTestIds(report: Report): string[] {
  const td = parseTestData(report);
  if (Array.isArray(td.testIds) && td.testIds.length > 0) {
    return td.testIds.filter(Boolean);
  }
  if (Array.isArray(td.tests) && td.tests.length > 0) {
    return td.tests.map((t: any) => t.testId || t.id).filter(Boolean);
  }
  return [];
}

export function getReportTestStatuses(report: Report): ReportTestStatuses {
  const td = parseTestData(report);
  const approvals: Record<string, any> = td.test_approvals || {};
  const testIds = getReportTestIds(report);

  const perTest: Record<string, TestApprovalStatus> = {};
  const approvedTestIds: string[] = [];
  let lastApprovedAt: string | null = null;

  // Fallback: a report whose overall status is 'approved' but has no per-test records
  // (older reports approved before per-test tracking) should count every test as approved.
  const overallApproved = report.status === 'approved' || report.status === 'completed';

  for (const tid of testIds) {
    const rec = approvals[tid];
    let status: TestApprovalStatus = (rec?.status as TestApprovalStatus) || (overallApproved ? 'approved' : 'pending');
    perTest[tid] = status;
    if (status === 'approved') {
      approvedTestIds.push(tid);
      const at = rec?.approved_at || report.approved_at;
      if (at && (!lastApprovedAt || new Date(at).getTime() > new Date(lastApprovedAt).getTime())) {
        lastApprovedAt = at;
      }
    }
  }

  const statuses = Object.values(perTest);
  const hasApproved = approvedTestIds.length > 0;
  const hasReview = statuses.some((s) => s === 'under_review' || s === 'pending_approval');
  const hasPending = statuses.some((s) => s === 'pending' || s === 'rejected');

  return { testIds, perTest, hasPending, hasReview, hasApproved, approvedTestIds, lastApprovedAt };
}
