/**
 * Pages Module - Main Export Index
 * 
 * Organized by feature/domain:
 * - auth: Login, Register
 * - dashboard: Main dashboard, analytics, day details
 * - patients: Patient management
 * - samples: Sample collection
 * - reports: Report creation, review, preview, invoicing
 * - doctors: Doctor management and details
 * - tests: Test management
 * - users: User management
 * - branches: Branch management
 * - inventory: Inventory tracking
 * - billing: Invoicing and payments
 * - time-tracking: Time logs and working hours
 * - settings: System settings
 * - doctor-portal: Doctor-specific features
 * - error-pages: 404, Unauthorized
 * - onboarding: First-time setup
 * - layout: Root layout component
 */

// Auth Pages
export { Login, Register } from './auth';

// Dashboard Pages
export { Dashboard, Analytics, DashboardDayDetail } from './dashboard';

// Patient Pages
export { Patients } from './patients';

// Sample Collection
export { SampleCollection } from './samples';

// Report Pages
export { Reports, CreateReport, ReportEntry, ReportPreview, ReportReview } from './reports';

// Doctor Pages
export { DoctorManagement, DoctorDetail } from './doctors';

// Test Pages
export { TestManagement } from './tests';

// User Pages
export { Users } from './users';

// Branch Pages
export { Branches } from './branches';

// Inventory Pages
export { Inventory } from './inventory';

// Billing Pages
export { InvoicePage } from './billing';

// Time Tracking Pages
export { TimeTracking, WorkingHours } from './time-tracking';

// Settings Pages
export { Settings } from './settings';

// Doctor Portal Pages
export { DoctorDashboard, DoctorReports, DoctorProfile } from './doctor-portal';

// Error Pages
export { NotFound, Unauthorized } from './error-pages';

// Onboarding Pages
export { Onboarding } from './onboarding';

// B2B Partner Labs
export { B2BLabManagement } from './b2b';

// Layout
export { Root } from './layout';
