import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { useAuthStore } from '../stores';
import { PERMISSIONS } from '../utils/permissions';
// Layout
import { Root } from '../pages/layout';
// Auth
import { Login, Register, ForgotPassword, VerifyPasscode } from '../pages/auth';
// Dashboard
import { Dashboard, Analytics, DashboardDayDetail } from '../pages/dashboard';
// Reports
import { Reports, CreateReport, ReportEntry, ReportPreview, ReportReview, PublicReportDownload } from '../pages/reports';
// Patients
import { Patients } from '../pages/patients';
// Samples
import { SampleCollection } from '../pages/samples';
// Tests
import { TestManagement, TemplateEditor, PriceListManagement, TestConfiguration } from '../pages/tests';
// Doctors
import { DoctorManagement, DoctorDetail } from '../pages/doctors';
// Branches
import { Branches } from '../pages/branches';
// Users
import { Users } from '../pages/users';
// Inventory
import { Inventory } from '../pages/inventory';
// Time Tracking
import { TimeTracking, WorkingHours } from '../pages/time-tracking';
// Billing
import { InvoicePage } from '../pages/billing';
// Error Pages
import { NotFound, Unauthorized } from '../pages/error-pages';
// Onboarding
import { Onboarding } from '../pages/onboarding';
// Doctor Portal
import { DoctorDashboard, DoctorReports, DoctorProfile } from '../pages/doctor-portal';
// Settings
import { Settings } from '../pages/settings';
// B2B
import { B2BLabManagement, B2BLabDetail } from '../pages/b2b';

// ==========================================
// Route Protection Helper
// ==========================================

/**
 * Wraps a page component with permission check.
 * 
 * Root.tsx guarantees that user is fully loaded before any child renders.
 * This HOC only needs to check the permission — no loading/null guards needed.
 * The `!user` check is kept as a defense-in-depth safety net.
 */
function withPermission(Component: any, requiredPermission: string) {
  const ProtectedComponent = (props: any): React.ReactElement | null => {
    const { can, user } = useAuthStore();

    // Safety net — Root.tsx should prevent this, but just in case
    if (!user) return null;

    // Check permission
    if (!can(requiredPermission)) {
      return React.createElement(Navigate, { to: '/unauthorized', replace: true });
    }

    return React.createElement(Component, props);
  };
  
  ProtectedComponent.displayName = `Protected(${Component.displayName || Component.name || 'Component'})`;
  return ProtectedComponent;
}

/**
 * Guard for doctor-only pages.
 * Redirects non-doctor users to unauthorized page.
 */
function doctorOnly(Component: any) {
  const DoctorComponent = (props: any): React.ReactElement | null => {
    const { user, getBranchRole } = useAuthStore();

    // Safety net — Root.tsx should prevent this, but just in case
    if (!user) return null;

    // Check if user role is doctor
    const role = getBranchRole();
    if (role !== 'doctor') {
      return React.createElement(Navigate, { to: '/unauthorized', replace: true });
    }

    return React.createElement(Component, props);
  };
  
  DoctorComponent.displayName = `DoctorOnly(${Component.displayName || Component.name || 'Component'})`;
  return DoctorComponent;
}

/**
 * Guard for guest-only pages (Login, Register, ForgotPassword).
 * Redirects logged-in users to the dashboard.
 */
function guestOnly(Component: any) {
  const GuestComponent = (props: any): React.ReactElement | null => {
    const { isAuthenticated } = useAuthStore();

    if (isAuthenticated) {
      return React.createElement(Navigate, { to: '/', replace: true });
    }

    return React.createElement(Component, props);
  };
  
  GuestComponent.displayName = `GuestOnly(${Component.displayName || Component.name || 'Component'})`;
  return GuestComponent;
}


export const router = createBrowserRouter([
  // Public/Guest-only routes
  {
    path: '/login',
    Component: guestOnly(Login),
  },
  {
    path: '/verify-passcode',
    Component: guestOnly(VerifyPasscode),
  },
  {
    path: '/register',
    Component: guestOnly(Register),
  },
  {
    path: '/forgot-password',
    Component: guestOnly(ForgotPassword),
  },
  {
    path: '/onboarding',
    Component: Onboarding,
  },
  {
    path: '/unauthorized',
    Component: Unauthorized,
  },
  {
    path: '/public/report/:id/download',
    Component: PublicReportDownload,
  },
  // Protected routes
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: 'dashboard/:date', Component: DashboardDayDetail },
      { path: 'reports', Component: withPermission(Reports, PERMISSIONS.REPORT_READ) },
      { path: 'reports/new', Component: withPermission(CreateReport, PERMISSIONS.REPORT_CREATE) },
      { path: 'reports/entry', Component: withPermission(ReportEntry, PERMISSIONS.REPORT_UPDATE) },
      { path: 'reports/:reportId/entry', Component: withPermission(ReportEntry, PERMISSIONS.REPORT_UPDATE) },
      { path: 'reports/preview/:id', Component: withPermission(ReportPreview, PERMISSIONS.REPORT_READ) },
      { path: 'reports/:reportId/invoice', Component: withPermission(InvoicePage, PERMISSIONS.REPORT_READ) },
      { path: 'reports/review', Component: withPermission(ReportReview, PERMISSIONS.REPORT_REVIEW) },
      { path: 'patients', Component: withPermission(Patients, PERMISSIONS.PATIENT_READ) },
      { path: 'sample-collection', Component: withPermission(SampleCollection, PERMISSIONS.SAMPLE_COLLECT) },
      { path: 'tests', Component: withPermission(TestManagement, PERMISSIONS.TEST_READ) },
      { path: 'doctors', Component: withPermission(DoctorManagement, PERMISSIONS.DOCTOR_READ) },
      { path: 'doctors/:id', Component: withPermission(DoctorDetail, PERMISSIONS.DOCTOR_READ) },
      { path: 'branches', Component: withPermission(Branches, PERMISSIONS.BRANCH_UPDATE) },
      { path: 'users', Component: withPermission(Users, PERMISSIONS.USER_READ) },
      { path: 'inventory', Component: withPermission(Inventory, PERMISSIONS.INVENTORY_READ) },
      { path: 'time-tracking', Component: withPermission(TimeTracking, PERMISSIONS.TIMELOG_TRACK) },
      { path: 'working-hours', Component: withPermission(WorkingHours, PERMISSIONS.TIMELOG_VIEW_ALL) },
      { path: 'analytics', Component: withPermission(Analytics, PERMISSIONS.ANALYTICS_VIEW) },
      { path: 'settings', Component: withPermission(Settings, PERMISSIONS.SETTINGS_VIEW) },
      { path: 'tests/pricing', Component: withPermission(PriceListManagement, PERMISSIONS.SETTINGS_VIEW) },
      { path: 'tests/templates/:testId', Component: withPermission(TemplateEditor, PERMISSIONS.TEST_UPDATE) },
      { path: 'tests/configure/:testId', Component: withPermission(TestConfiguration, PERMISSIONS.TEST_UPDATE) },
      { path: 'doctor-dashboard', Component: DoctorDashboard },
      { path: 'doctor-reports', Component: DoctorReports },
      { path: 'profile', Component: doctorOnly(DoctorProfile) },
      // B2B Partner Labs
      { path: 'b2b', Component: withPermission(B2BLabManagement, PERMISSIONS.B2B_LAB_READ) },
      { path: 'b2b/:id', Component: withPermission(B2BLabDetail, PERMISSIONS.B2B_LAB_READ) },
      { path: '*', Component: NotFound },
    ],
  },
]);