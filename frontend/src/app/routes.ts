import { createBrowserRouter } from 'react-router';
// Layout
import { Root } from '../pages/layout';
// Auth
import { Login, Register } from '../pages/auth';
// Dashboard
import { Dashboard, Analytics, DashboardDayDetail } from '../pages/dashboard';
// Reports
import { Reports, CreateReport, ReportEntry, ReportPreview, ReportReview } from '../pages/reports';
// Patients
import { Patients } from '../pages/patients';
// Samples
import { SampleCollection } from '../pages/samples';
// Tests
import { TestManagement } from '../pages/tests';
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
import { B2BDashboard, B2BLabManagement, B2BLabDetail, B2BOrders, B2BOrderDetail, B2BCreateOrder, B2BSettlements } from '../pages/b2b';

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/register',
    Component: Register,
  },
  {
    path: '/onboarding',
    Component: Onboarding,
  },
  {
    path: '/unauthorized',
    Component: Unauthorized,
  },
  // Protected routes
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: 'dashboard/:date', Component: DashboardDayDetail },
      { path: 'reports', Component: Reports },
      { path: 'reports/new', Component: CreateReport },
      { path: 'reports/entry', Component: ReportEntry },
      { path: 'reports/:reportId/entry', Component: ReportEntry },
      { path: 'reports/preview/:id', Component: ReportPreview },
      { path: 'reports/:reportId/invoice', Component: InvoicePage },
      { path: 'reports/review', Component: ReportReview },
      { path: 'patients', Component: Patients },
      { path: 'sample-collection', Component: SampleCollection },
      { path: 'tests', Component: TestManagement },
      { path: 'doctors', Component: DoctorManagement },
      { path: 'doctors/:id', Component: DoctorDetail },
      { path: 'branches', Component: Branches },
      { path: 'users', Component: Users },
      { path: 'inventory', Component: Inventory },
      { path: 'time-tracking', Component: TimeTracking },
      { path: 'working-hours', Component: WorkingHours },
      { path: 'analytics', Component: Analytics },
      { path: 'settings', Component: Settings },
      { path: 'doctor-dashboard', Component: DoctorDashboard },
      { path: 'doctor-reports', Component: DoctorReports },
      { path: 'profile', Component: DoctorProfile },
      // B2B Reference Lab
      { path: 'b2b', Component: B2BDashboard },
      { path: 'b2b/labs', Component: B2BLabManagement },
      { path: 'b2b/labs/:id', Component: B2BLabDetail },
      { path: 'b2b/orders', Component: B2BOrders },
      { path: 'b2b/orders/new', Component: B2BCreateOrder },
      { path: 'b2b/orders/:id', Component: B2BOrderDetail },
      { path: 'b2b/settlements', Component: B2BSettlements },
      { path: '*', Component: NotFound },
    ],
  },
]);