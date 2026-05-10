# Frontend Structure Refactor - Developer Guide

## 📁 Overview

The frontend has been reorganized into a **professional, scalable feature-based architecture**. All page components are now organized by feature/domain in the `/src/pages` folder.

## 🎯 Key Benefits

✅ **Feature-Based Organization** - Each feature/domain has its own folder  
✅ **Scalability** - Easy to add new features without cluttering the structure  
✅ **Maintainability** - Clear separation of concerns  
✅ **Team Collaboration** - Everyone knows where to find things  
✅ **Industry Standard** - Similar to enterprise React applications  

## 📂 Folder Structure

```
src/pages/
├── auth/                 # Login, Register
├── dashboard/            # Dashboard, Analytics, Day Details
├── patients/             # Patient Management
├── samples/              # Sample Collection
├── reports/              # Report Creation, Entry, Preview, Review
├── doctors/              # Doctor Management & Details
├── doctor-portal/        # Doctor-specific Features
├── tests/                # Test Management
├── users/                # User Management
├── branches/             # Branch Management
├── inventory/            # Inventory Tracking
├── billing/              # Invoicing
├── time-tracking/        # Time Logs, Working Hours
├── settings/             # System Settings
├── error-pages/          # 404, Unauthorized
├── onboarding/           # First-time Setup
└── layout/               # Root Layout Component
```

## 📥 How to Import

### Old Way (DON'T USE)
```javascript
import { Login } from '../../pages/Login';
import { Dashboard } from '../../pages/Dashboard';
```

### New Way (USE THIS) ✅
```javascript
import { Login, Register } from '../pages/auth';
import { Dashboard, Analytics } from '../pages/dashboard';
import { Patients } from '../pages/patients';
```

## 🔧 Adding a New Feature

### Step 1: Create Folder
```bash
mkdir src/pages/my-feature
```

### Step 2: Create Component
```typescript
// src/pages/my-feature/MyFeature.tsx
export function MyFeature() {
  return <div>My Feature</div>;
}
```

### Step 3: Create Index Export
```typescript
// src/pages/my-feature/index.ts
export { MyFeature } from './MyFeature';
```

### Step 4: Import in Routes
```typescript
// src/app/routes.ts
import { MyFeature } from '../pages/my-feature';
```

### Step 5: Add Route
```typescript
// src/app/routes.ts
{ path: 'my-feature', Component: MyFeature }
```

## 📋 Folder Conventions

### Naming Rules

| Type | Convention | Example |
|------|-----------|---------|
| **Folders** | kebab-case | `auth`, `time-tracking` |
| **Components** | PascalCase | `Login.tsx`, `Dashboard.tsx` |
| **Index Files** | Always `index.ts` | Re-export components |
| **Functions** | camelCase | `handleSubmit()`, `fetchUsers()` |

### Plural vs Singular

- **Plural** for collections: `doctors/`, `patients/`, `reports/`
- **Singular** for single concepts: `settings/`, `onboarding/`
- **Compound** for clarity: `doctor-portal/`, `time-tracking/`

## 🏗️ Index Files (Barrel Exports)

Each folder has an `index.ts` that re-exports all components:

```typescript
// src/pages/auth/index.ts
export { Login } from './Login';
export { Register } from './Register';
```

**Benefits:**
- ✅ Simpler imports: `import { Login } from '../pages/auth'`
- ✅ Hide internal structure
- ✅ Easier refactoring
- ✅ Clear public API

## 🛠️ Working with Pages

### Page Component Structure
```typescript
// src/pages/my-feature/MyFeature.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useMyStore } from '../../stores';
import { myApi } from '../../api';

export function MyFeature() {
  const navigate = useNavigate();
  const { data, isLoading } = useMyStore();

  useEffect(() => {
    // Load data
  }, []);

  return (
    <div>
      {/* Page content */}
    </div>
  );
}
```

### Page-Specific Components
Store page-specific components in `/src/app/components/<feature>/`:

```
src/app/components/
├── auth/
│   ├── LoginForm.tsx
│   └── PasswordReset.tsx
├── dashboard/
│   ├── DashboardChart.tsx
│   └── StatCard.tsx
└── reports/
    ├── ReportTable.tsx
    └── ReportFilter.tsx
```

### Shared Components
Reusable components go in `/src/components/`:

```
src/components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Modal.tsx
├── forms/
│   ├── FormField.tsx
│   └── FormSubmit.tsx
└── tables/
    └── DataTable.tsx
```

## 📚 Related Files

| File | Purpose | Location |
|------|---------|----------|
| **Routes** | Router config, import all pages | `src/app/routes.ts` ✓ Updated |
| **Stores** | Zustand state management | `src/stores/` |
| **API** | Backend communication | `src/api/` |
| **Types** | TypeScript interfaces | `src/types/` |
| **Utils** | Utility functions | `src/utils/` |

## 🚀 Quick Checklist for New Features

- [ ] Create folder: `src/pages/feature-name/`
- [ ] Create component: `Feature.tsx`
- [ ] Create index: `index.ts`
- [ ] Update routes: `src/app/routes.ts`
- [ ] Test imports work
- [ ] Test navigation works
- [ ] Add API calls if needed
- [ ] Add store if needed
- [ ] Add types if needed

## 🧪 Testing the Structure

### Run Development Server
```bash
npm run dev
```

### Check for Import Errors
Look in browser console for any import errors or 404s.

### Test All Routes
- [ ] Login: `/login`
- [ ] Dashboard: `/`
- [ ] Patients: `/patients`
- [ ] Reports: `/reports`
- [ ] Doctors: `/doctors`
- [ ] Tests: `/tests`
- [ ] Users: `/users`
- [ ] Settings: `/settings`
- [ ] 404: `/nonexistent`

## 📖 File Organization Timeline

| Phase | Status | Details |
|-------|--------|---------|
| **Phase 1** | ✅ DONE | Created new folder structure |
| **Phase 2** | ✅ DONE | Copied all page files |
| **Phase 3** | ✅ DONE | Created barrel exports (index.ts) |
| **Phase 4** | ✅ DONE | Updated routes.ts |
| **Phase 5** | ⏳ NEXT | Run and test application |
| **Phase 6** | ⏳ NEXT | Update team documentation |
| **Phase 7** | ⏳ NEXT | Delete old app/pages folder (after backup) |

## 🔍 Migration Validation

### Files Moved
- ✅ 24 page files reorganized into 17 feature folders
- ✅ All index.ts files created
- ✅ All imports updated in routes.ts

### Structure Verified
```
✅ auth/              - Login, Register
✅ dashboard/         - Dashboard, Analytics, DayDetail
✅ patients/          - Patients
✅ samples/           - SampleCollection
✅ reports/           - Reports, CreateReport, ReportEntry, ReportPreview, ReportReview
✅ doctors/           - DoctorManagement, DoctorDetail
✅ doctor-portal/     - DoctorDashboard, DoctorReports, DoctorProfile
✅ tests/             - TestManagement
✅ users/             - Users
✅ branches/          - Branches
✅ inventory/         - Inventory
✅ billing/           - InvoicePage
✅ time-tracking/     - TimeTracking, WorkingHours
✅ settings/          - Settings
✅ error-pages/       - NotFound, Unauthorized
✅ onboarding/        - Onboarding
✅ layout/            - Root
```

## ❓ FAQ

### Q: Can I still use the old app/pages folder?
**A:** Yes, it's still there as a backup. After testing the new structure, you can delete it.

### Q: Do I need to update every import?
**A:** Only imports that explicitly reference the old `./pages/` path need updating. Most app already uses dynamic imports.

### Q: How do I share code between features?
**A:** Use `/src/components/` for shared UI components, or `/src/utils/` for utilities.

### Q: What if I need a sub-page?
**A:** Create a subfolder or file within the feature folder:
```
src/pages/reports/
├── Reports.tsx
├── CreateReport.tsx
├── preview/
│   └── ReportPreview.tsx
└── index.ts
```

## 📞 Support

- **Questions?** Check this guide first
- **Issues?** Check browser console for import errors
- **Suggestions?** Update this guide for future developers

---

**Last Updated:** May 7, 2026  
**Structure Version:** 2.0 (Feature-Based)
