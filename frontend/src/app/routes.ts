import { createBrowserRouter } from 'react-router';
import { Root } from './pages/Root';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { Patients } from './pages/Patients';
import { Branches } from './pages/Branches';
import { Users } from './pages/Users';
import { TestManagement } from './pages/TestManagement';
import { SampleCollection } from './pages/SampleCollection';
import { CreateReport } from './pages/CreateReport';
import { ReportEntry } from './pages/ReportEntry';
import { ReportPreview } from './pages/ReportPreview';
import { InvoicePage } from './pages/InvoicePage';
import { DoctorManagement } from './pages/DoctorManagement';
import { DoctorDetail } from './pages/DoctorDetail';
import { ReportReview } from './pages/ReportReview';
import { DashboardDayDetail } from './pages/DashboardDayDetail';
import { TimeTracking } from './pages/TimeTracking';
import { WorkingHours } from './pages/WorkingHours';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Onboarding } from './pages/Onboarding';
import Unauthorized from './pages/Unauthorized';
import {
  Inventory,
  Analytics,
  Settings,
  NotFound,
} from './pages/OtherPages';

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
      { path: '*', Component: NotFound },
    ],
  },
]);