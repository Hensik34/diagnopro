# Frontend Architecture Review — Stores, APIs & Structure

## Summary

After reviewing all 14 stores, 17 API modules, the route system, and key page components, I've identified **12 issues** across 4 severity levels. The most critical ones cause broken UI on page refresh (the bug you already saw). Several others are time-bombs that will break under specific conditions.

---

## 🔴 Critical — Will Break the App

### 1. `SampleCollection.tsx` — Same Refresh Bug as Dashboard (line 21)

```tsx
const isAdmin = user?.role === 'admin'; // ❌ user is null on refresh
```

On refresh, `user` is null → `isAdmin` is false → StaffView shows instead of AdminView. **Same pattern we just fixed in Dashboard.**

**File:** [SampleCollection.tsx:21](file:///d:/Hensik/task/visionlab/frontend/src/pages/samples/SampleCollection.tsx#L19-L34)

**Fix:** Add the same auth-loading guard:
```tsx
const { user, isLoading: authLoading } = useAuthStore();

if (authLoading || (!user && getAuthToken())) {
  return <LoadingSpinner />;
}

const isAdmin = user?.role === 'admin';
```

---

### 2. `ReportReview.tsx` — Redirect on Refresh (line 42-46)

```tsx
useEffect(() => {
  if (!can(PERMISSIONS.REPORT_REVIEW)) {
    navigate('/unauthorized', { replace: true }); // ❌ fires before user loads
  }
}, [can, navigate]);
```

This is **redundant** — the route already has `withPermission(ReportReview, PERMISSIONS.REPORT_REVIEW)` in `routes.ts` (line 97). But worse, the `useEffect` fires on initial render when `user` is null, causing an immediate redirect even for users who DO have the permission.

**File:** [ReportReview.tsx:42-46](file:///d:/Hensik/task/visionlab/frontend/src/pages/reports/ReportReview.tsx#L42-L46)

**Fix:** Remove this useEffect entirely — `withPermission` already handles it correctly after our fix.

---

### 3. `ProtectedRoute.tsx` `AdminRoute` — Missing User-Null Check (line 134)

```tsx
if (user?.role !== 'admin') { // ❌ when user is null, this is true → redirect
  return <Navigate to="/unauthorized" />;
}
```

`isLoading` check on line 122 helps, but there's a gap: `isLoading` can be `false` while `user` is still null (same issue as `withPermission`). If `AdminRoute` is used anywhere, it will redirect admins on refresh.

**File:** [ProtectedRoute.tsx:134](file:///d:/Hensik/task/visionlab/frontend/src/app/components/auth/ProtectedRoute.tsx#L114-L139)

**Fix:** Add the `(!user && getAuthToken())` guard after the `isLoading` check.

---

### 4. `Root.tsx` — `hasAdminStaffAccess` False on Refresh (line 28)

```tsx
const hasAdminStaffAccess = can('branch:read') || can('patient:read');
```

This is calculated at the top of Root, before `initialize()` completes. While it doesn't cause a redirect, it means the onboarding check (line 57-68) may skip for admin users on refresh, or fire incorrectly since `can()` returns false.

**File:** [Root.tsx:28](file:///d:/Hensik/task/visionlab/frontend/src/pages/layout/Root.tsx#L28)

**Fix:** Already partially mitigated because the onboarding effect checks `!authLoading && branchesFetched`, but the `hasAdminStaffAccess` guard on line 58 (`if (!hasAdminStaffAccess) return;`) means the entire effect is skipped for admins until re-render. This works but is fragile. Consider moving `hasAdminStaffAccess` inside the effect or using `useMemo` with a `user` dependency.

---

## 🟠 High — State Management Issues

### 5. No Store Reset on Logout

When a user logs out, `authStore.logout()` clears auth state, but **none of the other stores are reset**. If User A logs out and User B logs in on the same browser tab:

- `reportStore` still has User A's reports
- `patientStore` still has User A's patients
- `branchStore` still has User A's branches
- `settingsStore` still has User A's settings

**All stores with a `reset()` method:** reportStore, patientStore, sampleStore, testStore, doctorStore, branchStore, billingStore, settingsStore, layoutStore

**Fix:** Create a `resetAllStores()` function called from `authStore.logout()`:

```tsx
// In authStore.ts logout:
logout: () => {
  setAuthToken(null);
  localStorage.removeItem('onboarding_complete');
  set({ user: null, isAuthenticated: false, ... });
  
  // Reset all stores
  useReportStore.getState().reset();
  useBranchStore.getState().reset();
  usePatientStore.getState().reset();
  // ... etc
},
```

---

### 6. Single `isLoading` Flag Causes UI Conflicts

Every store uses a single `isLoading` boolean. If two async actions run concurrently (e.g., `fetchReports` + `approveReport`), the first to finish sets `isLoading: false` while the second is still running.

**Affected stores:** reportStore (most impacted — many concurrent actions), b2bStore, testStore

**Example scenario:**
1. User clicks "Approve" on a report → `isLoading: true`
2. Meanwhile, a background refresh fires `fetchReports` → `isLoading: true`  
3. `approveReport` finishes → `isLoading: false` ← BUG: fetchReports is still loading!

**Fix (recommended for reportStore at minimum):** Use action-specific loading flags:
```tsx
isLoading: false,         // general list loading
isActionLoading: false,   // for mutations (create/update/delete/approve)
actionLoadingId: null,    // which specific item
```

Or use a loading counter: `loadingCount: 0` → increment on start, decrement on finish, `isLoading = loadingCount > 0`.

---

## 🟡 Medium — Potential Issues

### 7. `collectionTrackingStore` Uses `any` Type for Errors

```tsx
} catch (err: any) {   // ❌ every catch block
  set({ error: err.message || '...' });
```

Other stores correctly use `err instanceof Error ? err.message : '...'`. The `any` type circumvents TypeScript safety.

**File:** [collectionTrackingStore.ts](file:///d:/Hensik/task/visionlab/frontend/src/stores/collectionTrackingStore.ts) — all catch blocks

**Fix:** Replace with `} catch (err) { set({ error: err instanceof Error ? err.message : '...' }); }`

---

### 8. `billingStore` — `calculateFinalAmount` Double-Render

```tsx
setBaseAmount: (amount: number) => {
  set({ baseAmount: amount });       // render 1
  get().calculateFinalAmount();      // set() again → render 2
},
```

Every setter triggers two state updates. This can cause flickering in components.

**File:** [billingStore.ts:92-105](file:///d:/Hensik/task/visionlab/frontend/src/stores/billingStore.ts#L92-L105)

**Fix:** Combine into a single `set()`:
```tsx
setBaseAmount: (amount: number) => {
  const { labDiscountType, labDiscountValue, doctorDiscount, totalPaid } = get();
  const finalAmount = computeFinal(amount, labDiscountType, labDiscountValue, doctorDiscount);
  set({ baseAmount: amount, finalAmount, paymentStatus: derivePaymentStatus(totalPaid, finalAmount) });
},
```

---

### 9. `layoutStore` — `Map` Doesn't Trigger Re-renders Properly

```tsx
testLayouts: new Map<string, TestLayout>(),
```

Zustand uses shallow comparison for re-renders. `Map` mutations with `new Map(state.testLayouts).set(...)` work but the selectors for this field won't trigger re-renders reliably since `Map` equality is always `false` (new reference each time).

**File:** [layoutStore.ts:9](file:///d:/Hensik/task/visionlab/frontend/src/stores/layoutStore.ts#L9)

**Fix:** Use a plain object `Record<string, TestLayout>` instead of `Map`.

---

### 10. `b2bStore` — Missing `reset()` Method

Every other store has a `reset()` method, but `b2bStore` doesn't. This means B2B data persists across logouts.

**File:** [b2bStore.ts](file:///d:/Hensik/task/visionlab/frontend/src/stores/b2bStore.ts)

**Fix:** Add:
```tsx
reset: () => set({ labs: [], selectedLab: null, rateList: [], orders: [], selectedOrder: null, dashboard: null, notifications: [], payments: [], ledger: null, auditLog: [], reportVersions: [], isLoading: false, error: null }),
```

---

## 🟢 Low — Code Quality

### 11. API Client `window.location.href` Forces Full Page Reload

```tsx
if (error.response?.status === 401) {
  localStorage.removeItem('token');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'; // ❌ full page reload, loses all state
  }
}
```

This bypasses React Router and forces a full reload. Since `authStore.logout()` exists and handles state cleanup, this is redundant and jarring.

**File:** [client.ts:43-48](file:///d:/Hensik/task/visionlab/frontend/src/api/client.ts#L43-L48)

**Fix:** Call `useAuthStore.getState().logout()` and let the Root layout's redirect handle navigation. Alternatively, keep the current approach but at least call `logout()` first to clean up state.

---

### 12. `timeLogStore` & `collectionTrackingStore` — Missing `reset()` and Missing Initial State Object

These stores define initial values inline rather than in a separate `initialState` object, making reset impossible.

**Files:** 
- [timeLogStore.ts](file:///d:/Hensik/task/visionlab/frontend/src/stores/timeLogStore.ts)
- [collectionTrackingStore.ts](file:///d:/Hensik/task/visionlab/frontend/src/stores/collectionTrackingStore.ts)

**Fix:** Extract initial state into a const, add `reset: () => set(initialState)`.

---

## Priority Order for Fixes

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | SampleCollection refresh bug | 🔴 Critical | 5 min |
| 2 | ReportReview redundant redirect | 🔴 Critical | 2 min |
| 3 | AdminRoute missing null check | 🔴 Critical | 3 min |
| 5 | No store reset on logout | 🟠 High | 15 min |
| 6 | Single isLoading conflicts | 🟠 High | 30 min |
| 4 | Root hasAdminStaffAccess | 🔴 Critical | 5 min |
| 10 | B2B missing reset | 🟡 Medium | 3 min |
| 7 | Collection store `any` types | 🟡 Medium | 5 min |
| 8 | Billing double-render | 🟡 Medium | 10 min |
| 9 | Layout Map type | 🟡 Medium | 10 min |
| 11 | API client full reload | 🟢 Low | 10 min |
| 12 | Missing reset/initialState | 🟢 Low | 5 min |

> [!IMPORTANT]
> Issues #1-3 and #5 should be fixed immediately — they cause visible bugs for users.
> Issue #6 (single isLoading) is the biggest structural improvement but requires more testing.

---

Want me to fix all the Critical and High issues now?
