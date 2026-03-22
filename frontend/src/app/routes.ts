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
import { DoctorManagement } from './pages/DoctorManagement';
import { DoctorDetail } from './pages/DoctorDetail';
import {
  Inventory,
  Analytics,
  Settings,
  NotFound,
} from './pages/OtherPages';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: 'reports', Component: Reports },
      { path: 'reports/new', Component: CreateReport },
      { path: 'reports/:id/entry', Component: ReportEntry },
      { path: 'reports/:id/preview', Component: ReportPreview },
      { path: 'patients', Component: Patients },
      { path: 'sample-collection', Component: SampleCollection },
      { path: 'tests', Component: TestManagement },
      { path: 'doctors', Component: DoctorManagement },
      { path: 'doctors/:id', Component: DoctorDetail },
      { path: 'branches', Component: Branches },
      { path: 'users', Component: Users },
      { path: 'inventory', Component: Inventory },
      { path: 'analytics', Component: Analytics },
      { path: 'settings', Component: Settings },
      { path: '*', Component: NotFound },
    ],
  },
]);