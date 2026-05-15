/**
 * ============================================
 * STORE RESET UTILITY
 * ============================================
 * 
 * Centralized function to reset all Zustand stores.
 * Called on logout to prevent data leaks between users.
 * 
 * This is kept separate from authStore to avoid circular imports
 * (stores import authStore for permissions, authStore can't import them back).
 */

import { useReportStore } from './reportStore';
import { usePatientStore } from './patientStore';
import { useSampleStore } from './sampleStore';
import { useTestStore } from './testStore';
import { useDoctorStore } from './doctorStore';
import { useBranchStore } from './branchStore';
import { useBillingStore } from './billingStore';
import { useSettingsStore } from './settingsStore';
import { useLayoutStore } from './layoutStore';
import { useCollectionTrackingStore } from './collectionTrackingStore';
import { useTimeLogStore } from './timeLogStore';
import { useB2BStore } from './b2bStore';

/**
 * Reset all application stores to their initial state.
 * Call this on logout to ensure no data from the previous user
 * persists in memory when a new user logs in.
 */
export function resetAllStores(): void {
  useReportStore.getState().reset();
  usePatientStore.getState().reset();
  useSampleStore.getState().reset();
  useTestStore.getState().reset();
  useDoctorStore.getState().reset();
  useBranchStore.getState().reset();
  useBillingStore.getState().reset();
  useSettingsStore.getState().reset();
  useLayoutStore.getState().reset();
  useCollectionTrackingStore.getState().reset();
  useTimeLogStore.getState().reset();
  useB2BStore.getState().reset();
}
