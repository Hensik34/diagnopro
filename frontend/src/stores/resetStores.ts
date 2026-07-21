/**
 * ============================================
 * STORE RESET UTILITY
 * ============================================
 * 
 * Centralized, **synchronous** function to reset all Zustand stores
 * and clear user-scoped localStorage keys on logout.
 * 
 * Why synchronous?
 *   The previous version used a dynamic import (`import('./resetStores').then(...)`)
 *   which was async. This created a race: the user could navigate to `/login` and
 *   log in as a different user *before* the stores were wiped, merging/conflicting
 *   data from two different users.
 * 
 * This module also exposes a lightweight pub/sub (`onLogout` / `offLogout`) so
 * React components with local state (e.g. `branchesFetched` in Root.tsx) can
 * subscribe and reset themselves when logout happens.
 * 
 * This file is kept separate from authStore to avoid circular imports
 * (stores import authStore for permissions; authStore can't import them back).
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

// ==========================================
// Logout Event Subscribers
// ==========================================

type LogoutCallback = () => void;
const logoutListeners = new Set<LogoutCallback>();

/**
 * Register a callback that fires when the user logs out.
 * Use this in React components to reset local state that
 * lives outside Zustand (e.g. `branchesFetched`).
 *
 * @example
 * useEffect(() => {
 *   const handler = () => setMyLocalFlag(false);
 *   onLogout(handler);
 *   return () => offLogout(handler);
 * }, []);
 */
export function onLogout(cb: LogoutCallback): void {
  logoutListeners.add(cb);
}

/** Unsubscribe from logout events. */
export function offLogout(cb: LogoutCallback): void {
  logoutListeners.delete(cb);
}

// ==========================================
// User-scoped localStorage Keys
// ==========================================

/**
 * Keys that belong to a specific user session and must be
 * removed on logout so the next user starts with a clean slate.
 * 
 * Non-user keys (e.g. `diagnopro_sidebar_state`, theming)
 * are intentionally left alone — they are device preferences.
 */
const USER_SCOPED_STORAGE_KEYS = [
  'token',
  'diagnopro_active_branch',
  'onboarding_complete',
  'lastStockReminderDate',
] as const;

// ==========================================
// Core Reset Function
// ==========================================

/**
 * Reset **all** application stores to their initial state and
 * clear user-scoped localStorage.
 * 
 * This is called **synchronously** during logout, *before*
 * navigation to `/login`, guaranteeing that no stale data
 * from User A can leak into User B's session.
 */
export function resetAllStores(): void {
  // 1. Reset every Zustand store
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

  // 2. Clear user-scoped localStorage keys
  USER_SCOPED_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });

  // 3. Notify any component-level subscribers (e.g. Root.tsx)
  logoutListeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error('[resetAllStores] Logout listener error:', err);
    }
  });
}

/**
 * Reset all **data** stores but keep auth and branch stores intact.
 * Used when switching branches — the user stays logged in and keeps
 * their branch list, but all branch-scoped data (reports, patients,
 * tests, settings, etc.) is wiped so it can be re-fetched for the
 * new branch context.
 */
export function resetDataStores(): void {
  useReportStore.getState().reset();
  usePatientStore.getState().reset();
  useSampleStore.getState().reset();
  useTestStore.getState().reset();
  useDoctorStore.getState().reset();
  useBillingStore.getState().reset();
  useSettingsStore.getState().reset();
  useLayoutStore.getState().reset();
  useCollectionTrackingStore.getState().reset();
  useTimeLogStore.getState().reset();
  useB2BStore.getState().reset();
}
