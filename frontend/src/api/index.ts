// Centralized API exports
export { api, setAuthToken, getAuthToken, isAuthenticated } from './client';
export { authApi } from './auth';
export { patientApi } from './patients';
export { reportApi, type ReportsSummary, type ReportsSummaryResponse } from './reports';
export { testApi } from './tests';
export { sampleApi } from './samples';
export { doctorApi } from './doctors';
export { branchApi } from './branches';
export { inventoryApi } from './inventory';
export { collectionTrackingApi } from './collectionTracking';
export { billingApi } from './billing';
export { timeLogApi } from './timeLogs';
export { settingsApi } from './settings';
export { doctorPortalApi } from './doctorPortal';
export { b2bApi } from './b2b';
export type { TimeLog, UserTimeSummary } from './timeLogs';
