// ==========================================
// Centralized Store Exports
// ==========================================

// Auth Store & RBAC
export {
  useAuthStore,
  useUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  // RBAC Permission Hooks
  useCan,
  useCanAny,
  useCanAll,
  useUserRole,
  // Re-exported from permissions
  PERMISSIONS,
} from './authStore';

// Patient Store
export {
  usePatientStore,
  usePatients,
  useSelectedPatient,
  usePatientLoading,
  usePatientError
} from './patientStore';

// Report Store
export {
  useReportStore,
  useReports,
  useSelectedReport,
  useReportLoading,
  useReportError,
  useReportsByStatus,
  usePendingReports
} from './reportStore';

// Test Store
export {
  useTestStore,
  useTests,
  useSampleTests,
  useSelectedTest,
  useTestLoading,
  useTestError,
  useTestsByCategory,
  useTestCategories
} from './testStore';

// Sample Store
export {
  useSampleStore,
  useSamples,
  useSelectedSample,
  useSampleLoading,
  useSampleError,
  usePendingSamples,
  useProcessingSamples
} from './sampleStore';

// Branch Store
export {
  useBranchStore,
  useBranches,
  useSelectedBranch,
  useCurrentBranchId,
  useCurrentBranch,
  useBranchLoading,
  useBranchError
} from './branchStore';

// Doctor Store
export {
  useDoctorStore,
  useDoctors,
  useSelectedDoctor,
  useDoctorLoading,
  useDoctorError
} from './doctorStore';

// Collection Tracking Store
export {
  useCollectionTrackingStore,
  useCollectionRecords,
  useTodayRecords,
  useMyRecords,
  useCollectionLoading,
  useCollectionError,
} from './collectionTrackingStore';

// Billing Store
export { useBillingStore } from './billingStore';

// Time Log Store
export {
  useTimeLogStore,
  useActiveSession,
  useTimeLogLoading,
  useTimeLogError,
} from './timeLogStore';

// Settings Store
export {
  useSettingsStore,
} from './settingsStore';

// B2B Store
export {
  useB2BStore,
  useB2BLabs,
  useB2BSelectedLab,
  useB2BOrders,
  useB2BSelectedOrder,
  useB2BDashboard,
  useB2BNotifications,
  useB2BLoading,
  useB2BError,
  useUnreadB2BNotifications,
} from './b2bStore';
