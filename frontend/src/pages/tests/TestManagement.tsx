import { useState, useEffect, Fragment,useRef,useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit,
  Eye,
  X,
  Clock,
  Activity,
  Beaker,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  SlidersHorizontal
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTestStore } from '../../stores';
import { useAuthStore } from '../../stores';
import { useBranchStore } from '../../stores';
import { testApi } from '../../api';
import { PERMISSIONS } from '../../utils/permissions';
import type { Test, CreateTestData, TestField, CreateTestFieldData, FieldType, ReferenceRule, CriticalRules, QualitativeBand } from '../../types';

// Common lab measurement units organized by category
const LAB_UNITS: Record<string, string[]> = {
  'Concentration': ['g/dL', 'mg/dL', 'µg/dL', 'ug/dL', 'g/L', 'mg/L', 'µg/L', 'ng/mL', 'pg/mL', 'ng/dL', 'uIU/mL', 'µIU/mL'],
  'Molar': ['mmol/L', 'µmol/L', 'nmol/L', 'pmol/L', 'mEq/L'],
  'Enzyme': ['U/L', 'IU/L', 'mIU/mL', 'IU/mL'],
  'Cell Count': ['cells/µL', 'cells/mm³', 'x10³/µL', 'x10⁶/µL', 'x10⁹/L', 'x10¹²/L', 'million/uL', '/uL'],
  'Percentage & Ratio': ['%', 'ratio', 'index'],
  'Hematology': ['fL', 'pg', 'mm/hr', 'sec'],
  'Volume': ['mL', 'L', 'dL', 'µL'],
  'Other Numeric': ['mm Hg', 'mOsm/kg', 'pH', 'mg/24hr', 'mL/min', '/HPF', '/LPF'],
  'Qualitative': ['Color', 'Appearance', 'Consistency', 'Odor', 'Viscosity', 'Turbidity', 'Presence'],
};

const QUALITATIVE_UNITS = ['Color', 'Appearance', 'Consistency', 'Odor', 'Viscosity', 'Turbidity', 'Presence'];

const QUALITATIVE_DEFAULTS: Record<string, string[]> = {
  'Color': ['Pale Yellow', 'Yellow', 'Dark Yellow', 'Amber', 'Orange', 'Red', 'Brown', 'Colorless', 'Gray-White', 'Straw'],
  'Appearance': ['Clear', 'Slightly Turbid', 'Turbid', 'Cloudy', 'Opaque', 'Translucent'],
  'Consistency': ['Formed', 'Semi-formed', 'Soft', 'Loose', 'Watery', 'Hard'],
  'Odor': ['Normal', 'Foul', 'Fruity', 'Ammonia-like', 'Pungent'],
  'Viscosity': ['Normal', 'High', 'Low', 'Watery', 'Thick'],
  'Turbidity': ['Clear', 'Slightly Turbid', 'Turbid', 'Very Turbid'],
  'Presence': ['Absent', 'Present', 'Nil', 'Trace', '1+', '2+', '3+', '4+'],
};

// Age groups used for reference ranges
const AGE_GROUPS = ['all', 'adult', 'pediatric', 'neonatal', 'infant', 'adolescent', 'elderly'];
const SEX_OPTIONS = ['any', 'male', 'female'];

// ============================================
// Reference Rules Utility Functions
// ============================================

/**
 * Normalizes various backend reference_rules formats into a uniform ReferenceRule[]
 * Handles:
 *  - Array format: [{ age_group, sex, low, high }]
 *  - Simple min/max: { min: 80, max: 100 }
 *  - Gender-keyed: { male: { min, max }, female: { min, max } }
 */
function normalizeReferenceRules(raw: any): ReferenceRule[] {
  if (!raw) return [];

  // Already an array
  if (Array.isArray(raw)) {
    return raw.map(r => ({
      age_group: r.age_group || 'all',
      sex: r.sex || 'any',
      low: r.low ?? r.min ?? null,
      high: r.high ?? r.max ?? null,
      note: r.note,
    }));
  }

  // Object format
  if (typeof raw === 'object') {
    // Check if it's a gender-keyed object like { male: { min, max }, female: { min, max } }
    const keys = Object.keys(raw);
    const genderKeys = keys.filter(k => ['male', 'female'].includes(k));

    if (genderKeys.length > 0) {
      const rules: ReferenceRule[] = [];
      for (const gender of genderKeys) {
        const vals = raw[gender];
        if (vals && typeof vals === 'object') {
          rules.push({
            age_group: 'all',
            sex: gender,
            low: vals.min ?? vals.low ?? null,
            high: vals.max ?? vals.high ?? null,
          });
        }
      }
      return rules;
    }

    // Simple { min, max } object
    if ('min' in raw || 'max' in raw || 'low' in raw || 'high' in raw) {
      return [{
        age_group: 'all',
        sex: 'any',
        low: raw.low ?? raw.min ?? null,
        high: raw.high ?? raw.max ?? null,
      }];
    }
  }

  return [];
}

/**
 * Generates a compact summary string for reference rules
 * e.g., "M: 13–17 | F: 12–15" or "80–100"
 */
function referenceRulesSummary(rules: ReferenceRule[]): string {
  if (!rules || rules.length === 0) return '—';

  // Single rule, generic
  if (rules.length === 1 && rules[0].sex === 'any' && (rules[0].age_group === 'all' || !rules[0].age_group)) {
    const r = rules[0];
    if (r.note) return r.note;
    const lo = r.low != null ? r.low : '—';
    const hi = r.high != null ? r.high : '—';
    return `${lo} – ${hi}`;
  }

  // Multiple rules: group by sex
  const parts: string[] = [];
  for (const r of rules) {
    if (r.note && !r.low && !r.high) {
      parts.push(r.note);
      continue;
    }
    const lo = r.low != null ? r.low : '—';
    const hi = r.high != null ? r.high : '—';
    const sexLabel = r.sex === 'male' ? 'M' : r.sex === 'female' ? 'F' : '';
    const ageLabel = r.age_group && r.age_group !== 'all' ? `${r.age_group}` : '';
    const label = [sexLabel, ageLabel].filter(Boolean).join('/');
    parts.push(label ? `${label}: ${lo}–${hi}` : `${lo}–${hi}`);
  }

  return parts.join(' | ');
}

/**
 * Build a default "empty" reference rule
 */
function defaultRule(): ReferenceRule {
  return { age_group: 'all', sex: 'any', low: null, high: null };
}

// ============================================
// Extended field data type (with reference rules for the editor)
// ============================================
interface FieldEditorData extends CreateTestFieldData {
  test_field_id?: string;
  _referenceRules: ReferenceRule[];
  _criticalRules: CriticalRules;
}

export function TestManagement() {
  const {
    tests,
    isLoading,
    error,
    fetchTests,
    createTest,
    updateTest,
    deleteTest,
    resetTestToDefault
  } = useTestStore();

  const navigate = useNavigate();
  const { user, can } = useAuthStore();
  const { currentBranchId } = useBranchStore();
  const canEditTest = can(PERMISSIONS.TEST_UPDATE);
  const canDeleteTest = can(PERMISSIONS.TEST_DELETE);

  const [searchTerm, setSearchTerm] = useState(() => {
    return sessionStorage.getItem('test_mgmt_search') || '';
  });
  const [categoryFilter, setCategoryFilter] = useState(() => {
    return sessionStorage.getItem('test_mgmt_category') || 'all';
  });
  const [sortBy, setSortBy] = useState(() => {
    return sessionStorage.getItem('test_mgmt_sort') || 'name-asc';
  });
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<string | null>(null);

  // Pagination State for Tests Catalog
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Package states
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') === 'packages') ? 'packages' : 'tests';

  const setActiveTab = (tab: 'tests' | 'packages') => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'tests') {
          next.delete('tab');
        } else {
          next.set('tab', tab);
        }
        return next;
      },
      { replace: true }
    );
  };

  const prevTabRef = useRef<'tests' | 'packages'>(activeTab);
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      setCategoryFilter('all');
      setSearchTerm('');
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);

  // Reset page when search or tab settings change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, sortBy, activeTab]);

  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [isDeletingPackage, setIsDeletingPackage] = useState<string | null>(null);

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('test_mgmt_search', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    sessionStorage.setItem('test_mgmt_category', categoryFilter);
  }, [categoryFilter]);

  useEffect(() => {
    sessionStorage.setItem('test_mgmt_sort', sortBy);
  }, [sortBy]);

  // Reset search and filter states when leaving the tests module
  useEffect(() => {
    return () => {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/tests')) {
        sessionStorage.removeItem('test_mgmt_search');
        sessionStorage.removeItem('test_mgmt_category');
        sessionStorage.removeItem('test_mgmt_sort');
      }
    };
  }, []);

  // Fetch tests on mount or branch change
  useEffect(() => {
    fetchTests(currentBranchId ?? undefined);
  }, [fetchTests, currentBranchId]);

  // Fetch packages list helper
  const fetchPackagesList = async () => {
    if (!currentBranchId) return;
    setPackagesLoading(true);
    try {
      const res = await testApi.getPackages(currentBranchId);
      setPackages(res.data);
    } catch (err) {
      console.error("Failed to fetch packages:", err);
    } finally {
      setPackagesLoading(false);
    }
  };

  // Fetch packages on mount or branch change
  useEffect(() => {
    if (currentBranchId) {
      fetchPackagesList();
    }
  }, [currentBranchId]);

  const handleAddPackage = () => {
    setSelectedPackage(null);
    setShowPackageModal(true);
  };

  const handleEditPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowPackageModal(true);
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;
    setIsDeletingPackage(id);
    try {
      await testApi.deletePackage(id);
      await fetchPackagesList();
    } catch (err) {
      console.error("Delete package failed:", err);
    } finally {
      setIsDeletingPackage(null);
    }
  };

  const handleSavePackage = async (data: any) => {
    if (selectedPackage) {
      await testApi.updatePackage(selectedPackage.id, data, currentBranchId || undefined);
    } else {
      await testApi.createPackage({ ...data, branch_id: currentBranchId! });
    }
    await fetchPackagesList();
  };

  const getTestNamesForPackage = (testIds: string[] | null) => {
    if (!testIds || !Array.isArray(testIds)) return '—';
    const names = testIds.map(id => tests.find(t => t.id === id)?.test_name).filter(Boolean);
    return names.length > 0 ? names.join(', ') : '—';
  };

  const filteredTests = [...tests]
    .filter(test => {
      const matchesSearch = 
        test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.test_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || test.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.test_name.localeCompare(b.test_name);
      }
      if (sortBy === 'name-desc') {
        return b.test_name.localeCompare(a.test_name);
      }
      if (sortBy === 'price-asc') {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === 'price-desc') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortBy === 'category-asc') {
        const catA = a.category || '';
        const catB = b.category || '';
        return catA.localeCompare(catB);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const paginatedTests = filteredTests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getCategoryBadge = (category?: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      'CBC': { bg: '#ef4444', text: '#ffffff' },
      'Biochemistry': { bg: '#3b82f6', text: '#ffffff' },
      'Hormone': { bg: '#8b5cf6', text: '#ffffff' },
      'Immunology': { bg: '#10b981', text: '#ffffff' },
      'Microbiology': { bg: '#f59e0b', text: '#ffffff' },
      'Serology': { bg: '#ec4899', text: '#ffffff' },
      'default': { bg: '#6b7280', text: '#ffffff' },
    };

    const style = styles[category || ''] || styles['default'];
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {category || 'Other'}
      </span>
    );
  };

  // Get unique categories
  const categories = [...new Set(tests.map(t => t.category).filter(Boolean))];
  const packageCategories = [...new Set(packages.map(p => p.category).filter(Boolean))];

  const filteredPackages = [...packages]
    .filter(pkg => {
      const matchSearch = (pkg.package_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (pkg.package_code || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'all' || pkg.category === categoryFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return (a.package_name || '').localeCompare(b.package_name || '');
      if (sortBy === 'name-desc') return (b.package_name || '').localeCompare(a.package_name || '');
      if (sortBy === 'price-asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (sortBy === 'price-desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
      return 0;
    });
  
  // Calculate stats

  const handleEdit = (test: Test) => {
    setSelectedTest(test);
    setShowTestModal(true);
  };

  const handleAdd = () => {
    setSelectedTest(null);
    setShowTestModal(true);
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    
    setIsDeleting(testId);
    try {
      await deleteTest(testId);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleReset = async (testId: string) => {
    if (!confirm('Reset this test to default? Your customizations will be removed.')) return;
    
    setIsResetting(testId);
    try {
      const success = await resetTestToDefault(testId);
      // Always refresh the test list to get accurate has_branch_override flags
      await fetchTests(currentBranchId ?? undefined);
    } catch (err) {
      console.error('Reset failed:', err);
      // Refresh anyway to sync the UI state
      await fetchTests(currentBranchId ?? undefined);
    } finally {
      setIsResetting(null);
    }
  };

  // Format turnaround time
  const formatTAT = (hours?: number) => {
    if (!hours) return '-';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Test Management</h1>
          <p className="text-muted-foreground text-xs">
            Configure laboratory tests and pricing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => activeTab === 'tests' ? fetchTests(currentBranchId ?? undefined) : fetchPackagesList()}
            disabled={isLoading || packagesLoading}
            className="h-8 px-2.5 flex items-center gap-1.5 bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors text-xs disabled:opacity-50"
            title={activeTab === 'tests' ? "Refresh test list" : "Refresh package list"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading || packagesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canEditTest && (
            <button 
              onClick={() => activeTab === 'tests' ? handleAdd() : handleAddPackage()}
              className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {activeTab === 'tests' ? 'Add Test' : 'Add Package'}
            </button>
          )}
        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
              {activeTab === 'tests' ? 'Total Tests' : 'Total Packages'}
            </span>
            <Beaker className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">
            {activeTab === 'tests' ? tests.length : packages.length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Configured</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Categories</span>
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">
            {activeTab === 'tests' ? categories.length : packageCategories.length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {activeTab === 'tests' ? 'Test types' : 'Package categories'}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded p-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input 
            type="text"
            placeholder={activeTab === 'tests' ? "Search by test name or code..." : "Search by package name or code..."}
            className="w-full h-8 pl-8 pr-8 bg-secondary border-0 rounded text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-border text-muted-foreground transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        
        <div className="hidden sm:block h-6 w-px bg-border"></div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Category</label>
          <select 
            className="h-8 text-xs bg-secondary border-0 rounded px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {(activeTab === 'tests' ? categories : packageCategories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="hidden sm:block h-6 w-px bg-border"></div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Sort By</label>
          <select 
            className="h-8 text-xs bg-secondary border-0 rounded px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Alphabetical (A to Z)</option>
            <option value="name-desc">Alphabetical (Z to A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            {activeTab === 'tests' && <option value="category-asc">Category</option>}
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {((activeTab === 'tests' && isLoading) || (activeTab === 'packages' && packagesLoading)) && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground text-sm">
            {activeTab === 'tests' ? 'Loading tests...' : 'Loading packages...'}
          </span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !packagesLoading && !error && (activeTab === 'tests' ? filteredTests.length === 0 : filteredPackages.length === 0) && (
        <div className="text-center py-12 bg-card border border-border rounded">
          <div className="text-muted-foreground text-sm">
            {activeTab === 'tests' 
              ? (tests.length === 0 ? 'No tests found. Add your first test to get started.' : 'No tests match your search criteria.')
              : (packages.length === 0 ? 'No packages found. Add your first package to get started.' : 'No packages match your search criteria.')
            }
          </div>
          {activeTab === 'tests' && tests.length === 0 && canEditTest && (
            <button
              onClick={handleAdd}
              className="mt-4 h-8 px-3 bg-primary text-white rounded text-sm hover:opacity-90 transition-opacity"
            >
              Add Test
            </button>
          )}
          {activeTab === 'packages' && packages.length === 0 && canEditTest && (
            <button
              onClick={handleAddPackage}
              className="mt-4 h-8 px-3 bg-primary text-white rounded text-sm hover:opacity-90 transition-opacity"
            >
              Add Package
            </button>
          )}
        </div>
      )}

      {/* Test Table */}
      {!isLoading && activeTab === 'tests' && filteredTests.length > 0 && (
        <div className="bg-card border border-border rounded overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30 sticky top-0 z-10">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Test Name</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Code</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Category</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Sample</th>
                  <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Price</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">TAT</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedTests.map((test) => (
                  <tr 
                    key={test.id} 
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-foreground">{test.test_name}</span>
                          {test.has_branch_override && (
                            <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 leading-none">
                              Customized
                            </span>
                          )}
                        </div>
                        {test.description && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{test.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs text-muted-foreground tabular-nums">{test.test_code}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {getCategoryBadge(test.category)}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                      {test.sample_type || '-'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-xs text-foreground tabular-nums">
                        {test.price ? `₹${test.price}` : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTAT(test.turnaround_time)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {canEditTest ? (
                          <>
                            <button 
                              onClick={() => handleEdit(test)}
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => navigate(`/tests/templates/${test.id}`)}
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-cyan-600"
                              title="Configure Layout"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => handleEdit(test)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteTest && (
                          <button 
                            onClick={() => handleDelete(test.id)}
                            disabled={isDeleting === test.id}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-destructive disabled:opacity-50"
                            title="Delete"
                          >
                            {isDeleting === test.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-3 py-2 bg-secondary/10 select-none">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{Math.min(filteredTests.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
                <span className="font-semibold text-foreground">{Math.min(filteredTests.length, currentPage * itemsPerPage)}</span> of{' '}
                <span className="font-semibold text-foreground">{filteredTests.length}</span> tests
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1 border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                    return (
                      <div key={p} className="flex items-center">
                        {showEllipsis && <span className="text-xs text-muted-foreground px-1.5 font-medium">...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`px-2 py-0.5 text-xs font-semibold rounded border min-w-[24px] text-center transition-colors ${
                            currentPage === p
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border bg-background hover:bg-muted text-foreground'
                          }`}
                        >
                          {p}
                        </button>
                      </div>
                    );
                  })}

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1 border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1 border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Packages Table */}
      {!packagesLoading && activeTab === 'packages' && filteredPackages.length > 0 && (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30 sticky top-0 z-10">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Package Name</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Code</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Category</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Tests Included</th>
                  <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Price</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-foreground font-medium">{pkg.package_name}</span>
                          {pkg.has_branch_override && (
                            <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 leading-none">
                              Customized
                            </span>
                          )}
                        </div>
                        {pkg.description && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[300px]">{pkg.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs text-muted-foreground tabular-nums">{pkg.package_code}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {getCategoryBadge(pkg.category)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground max-w-xs truncate">
                      {getTestNamesForPackage(pkg.test_ids)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-xs text-foreground tabular-nums">
                        {pkg.price ? `₹${pkg.price}` : '₹0'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {canEditTest ? (
                          <button 
                            onClick={() => handleEditPackage(pkg)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleEditPackage(pkg)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* If it's a branch-specific package, or if user is admin, allow delete */}
                        {canDeleteTest && (pkg.branch_id || user?.role === 'admin') && (
                          <button 
                            onClick={() => handleDeletePackage(pkg.id)}
                            disabled={isDeletingPackage === pkg.id}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-destructive disabled:opacity-50"
                            title={pkg.branch_id && !pkg.has_branch_override ? "Delete Custom Package" : "Reset / Delete Override"}
                          >
                            {isDeletingPackage === pkg.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Showing <span className="text-foreground">{filteredPackages.length}</span> of <span className="text-foreground">{packages.length}</span> packages
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Test Modal */}
      {showTestModal && (
        <TestModal
          test={selectedTest}
          categories={categories}
          readOnly={!canEditTest}
          branchId={currentBranchId || undefined}
          onClose={() => {
            setShowTestModal(false);
            setSelectedTest(null);
          }}
          onSave={async (data) => {
            let result = null;
            if (selectedTest) {
              result = await updateTest(selectedTest.id, data);
            } else {
              result = await createTest({ ...data, branch_id: currentBranchId! });
            }
            setShowTestModal(false);
            setSelectedTest(null);
            return result;
          }}
          onReset={selectedTest ? () => handleReset(selectedTest.id) : undefined}
        />
      )}

      {/* Add/Edit Package Modal */}
      {showPackageModal && (
        <PackageModal
          pkg={selectedPackage}
          tests={tests}
          readOnly={!canEditTest}
          onClose={() => {
            setShowPackageModal(false);
            setSelectedPackage(null);
          }}
          onSave={handleSavePackage}
        />
      )}
    </div>
  );
}

// Test Modal Component
interface TestModalProps {
  test: Test | null;
  categories: (string | undefined)[];
  readOnly?: boolean;
  branchId?: string;
  onClose: () => void;
  onSave: (data: CreateTestData) => Promise<Test | null | void>;
  onReset?: () => Promise<void>;
}

function TestModal({ test, categories, readOnly = false, branchId, onClose, onSave, onReset }: TestModalProps) {
  const [formData, setFormData] = useState<CreateTestData>({
    test_name: test?.test_name || '',
    test_code: test?.test_code || '',
    category: test?.category || '',
    sample_type: test?.sample_type || '',
    price: test?.price,
    turnaround_time: test?.turnaround_time,
    description: test?.description || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field editor state
  const [fields, setFields] = useState<FieldEditorData[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [customUnitMode, setCustomUnitMode] = useState<Set<number>>(new Set());
  const [expandedRangeIndex, setExpandedRangeIndex] = useState<number | null>(null);

  // Load existing fields when editing
  useEffect(() => {
    if (test?.id) {
      setLoadingFields(true);
      testApi.getFields(test.id, branchId)
        .then(res => {
          setFields(res.data.map((f: TestField) => {
            return {
              test_field_id: f.id,
              field_name: f.field_name,
              unit: f.unit || '',
              min_value: f.min_value ?? undefined,
              max_value: f.max_value ?? undefined,
              input_type: f.input_type || 'number',
              options: f.options || '',
              order_index: f.order_index ?? 0,
              field_type: f.field_type || 'input',
              formula: f.formula || '',
              depends_on: f.depends_on || '',
              section_group: f.section_group || '',
              _referenceRules: normalizeReferenceRules(f.reference_rules),
              _criticalRules: f.critical_rules || { low: null, high: null }
            };
          }));
        })
        .catch(() => {})
        .finally(() => setLoadingFields(false));
    }
  }, [test?.id, branchId]);

  // Detect existing custom units when fields are loaded
  useEffect(() => {
    const known = new Set(Object.values(LAB_UNITS).flat());
    const custom = new Set<number>();
    fields.forEach((f, i) => {
      if (f.unit && !known.has(f.unit)) custom.add(i);
    });
    setCustomUnitMode(custom);
  }, [fields.length]);

  const isFieldReferenced = (fieldName: string) => {
    if (!fieldName || !fieldName.trim()) return false;
    const nameTrimmed = fieldName.trim();
    return fields.some(f => {
      if (f.field_type !== 'calculated') return false;
      const deps = (f.depends_on || '').split(',').map(d => d.trim());
      if (deps.includes(nameTrimmed)) return true;
      if ((f.formula || '').includes(nameTrimmed)) return true;
      return false;
    });
  };

  const addField = () => {
    setFields(prev => [...prev, {
      field_name: '',
      unit: '',
      min_value: undefined,
      max_value: undefined,
      input_type: 'number',
      options: '',
      order_index: prev.length,
      field_type: 'input',
      formula: '',
      depends_on: '',
      section_group: '',
      _referenceRules: [],
      _criticalRules: { low: null, high: null }
    }]);
  };

  const updateField = (index: number, updates: Partial<FieldEditorData>) => {
    setFields(prev => prev.map((f, i) => {
      if (i !== index) return f;
      const updated = { ...f, ...updates };
      // Auto-configure for qualitative units
      if (updates.unit !== undefined && QUALITATIVE_UNITS.includes(updates.unit)) {
        updated.input_type = 'text';
        updated.field_type = 'input';
        updated.min_value = undefined;
        updated.max_value = undefined;
        updated._referenceRules = [];
        updated._criticalRules = { low: null, high: null };
        if (!f.formula || !QUALITATIVE_UNITS.includes(f.unit || '')) {
          updated.formula = (QUALITATIVE_DEFAULTS[updates.unit] || []).join(', ');
        }
      }
      return updated;
    }));
  };



  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, order_index: i })));
    if (expandedRangeIndex === index) setExpandedRangeIndex(null);
    else if (expandedRangeIndex !== null && expandedRangeIndex > index) {
      setExpandedRangeIndex(expandedRangeIndex - 1);
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields.map((f, i) => ({ ...f, order_index: i })));
    // Track expanded row
    if (expandedRangeIndex === index) setExpandedRangeIndex(newIndex);
    else if (expandedRangeIndex === newIndex) setExpandedRangeIndex(index);
  };

  // Reference rule management
  const addReferenceRule = (fieldIndex: number) => {
    setFields(prev => prev.map((f, i) => {
      if (i !== fieldIndex) return f;
      return { ...f, _referenceRules: [...f._referenceRules, defaultRule()] };
    }));
  };

  const updateReferenceRule = (fieldIndex: number, ruleIndex: number, updates: Partial<ReferenceRule>) => {
    setFields(prev => prev.map((f, i) => {
      if (i !== fieldIndex) return f;
      const newRules = f._referenceRules.map((r, ri) =>
        ri === ruleIndex ? { ...r, ...updates } : r
      );
      return { ...f, _referenceRules: newRules };
    }));
  };

  const removeReferenceRule = (fieldIndex: number, ruleIndex: number) => {
    setFields(prev => prev.map((f, i) => {
      if (i !== fieldIndex) return f;
      return { ...f, _referenceRules: f._referenceRules.filter((_, ri) => ri !== ruleIndex) };
    }));
  };

  const updateCriticalRules = (fieldIndex: number, updates: Partial<CriticalRules>) => {
    setFields(prev => prev.map((f, i) => {
      if (i !== fieldIndex) return f;
      return { ...f, _criticalRules: { ...f._criticalRules, ...updates } };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await onSave(formData);

      // Save fields — use existing test ID or ID from newly created test
      const targetId = test?.id || (result && typeof result === 'object' && 'id' in result ? result.id : null);
      if (targetId) {
        const validFields = fields.filter(f => f.field_name.trim());
        if (validFields.length > 0) {
          // Convert FieldEditorData to CreateTestFieldData with reference_rules
          const fieldsToSave: CreateTestFieldData[] = validFields.map(f => {
            let refRules: any = null;
            let critRules: any = null;
            let finalOptions = null;
            
            if (f.input_type === 'select') {
              refRules = f._referenceRules.length > 0 ? f._referenceRules : null;
              critRules = null;
              finalOptions = 'Negative,Positive';
            } else {
              refRules = f._referenceRules.length > 0 ? f._referenceRules : null;
              critRules = (f._criticalRules.low != null || f._criticalRules.high != null)
                ? f._criticalRules : null;
              finalOptions = null;
            }

            return {
              test_field_id: f.test_field_id,
              field_name: f.field_name,
              unit: f.unit,
              min_value: f.min_value,
              max_value: f.max_value,
              input_type: f.input_type || 'number',
              options: finalOptions,
              order_index: f.order_index,
              field_type: f.field_type,
              formula: f.formula,
              depends_on: f.depends_on,
              section_group: f.section_group,
              reference_rules: refRules,
              critical_rules: critRules,
            };
          });
          await testApi.setFields(targetId, fieldsToSave, branchId);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultSampleTypes = [
    'Blood', 'Serum', 'Plasma', 'Urine', 'Stool', 'Saliva', 'Swab', 
    'CSF', 'Semen', 'Sputum', 'Biopsy', 'Pleural Fluid', 
    'Ascitic Fluid', 'Joint Fluid', 'Fluoride Blood', 'EDTA Blood', 
    'Citrated Plasma (Blue Top)', 'Other'
  ];
  const sampleTypes = useMemo(() => {
    const list = [...defaultSampleTypes];
    if (test?.sample_type && !list.includes(test.sample_type)) {
      list.push(test.sample_type);
    }
    return list;
  }, [test?.sample_type]);
  const defaultCategories = ['CBC', 'Biochemistry', 'Hormone', 'Immunology', 'Microbiology', 'Serology'];
  const allCategories = [...new Set([...defaultCategories, ...categories.filter(Boolean)])];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-20">
          <h2 className="text-foreground text-sm font-medium">
            {readOnly ? 'View Test Details' : test ? 'Edit Test' : 'Add New Test'}
          </h2>
          <button 
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <fieldset disabled={readOnly} className={readOnly ? 'opacity-80' : ''}>
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Test Name *</label>
              <input 
                type="text"
                value={formData.test_name}
                onChange={e => setFormData(prev => ({ ...prev, test_name: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., Complete Blood Count (CBC)"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Test Code *</label>
              <input 
                type="text"
                value={formData.test_code}
                onChange={e => setFormData(prev => ({ ...prev, test_code: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., CBC-01"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select category...</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sample & Pricing */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Sample Type</label>
              <select 
                value={formData.sample_type}
                onChange={e => setFormData(prev => ({ ...prev, sample_type: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select...</option>
                {sampleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Price (₹)</label>
              <input 
                type="number"
                value={formData.price || ''}
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">TAT (hours)</label>
              <input 
                type="number"
                value={formData.turnaround_time || ''}
                onChange={e => setFormData(prev => ({ ...prev, turnaround_time: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., 24"
                min="0"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full h-20 px-3 py-2 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Brief description of the test..."
            />
          </div>

          {/* Test Parameters / Fields Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">
                Test Parameters {fields.length > 0 && <span className="text-foreground">({fields.length})</span>}
              </label>
              <button
                type="button"
                onClick={addField}
                className="h-6 px-2 flex items-center gap-1 bg-primary text-white rounded text-[10px] hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3 h-3" />
                Add Parameter
              </button>
            </div>

            {loadingFields ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-4 bg-secondary/30 border border-border rounded text-muted-foreground text-xs">
                No parameters configured. Click "Add Parameter" to define test fields.
              </div>
            ) : (
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary/30">
                    <tr className="border-b border-border">
                      <th className="px-2 py-1.5 text-left text-muted-foreground text-[10px] uppercase tracking-wider w-8">#</th>
                      <th className="px-2 py-1.5 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Name</th>
                      <th className="px-2 py-1.5 text-left text-muted-foreground text-[10px] uppercase tracking-wider w-32">Unit</th>
                      <th className="px-2 py-1.5 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-24">Field Type</th>
                      <th className="px-2 py-1.5 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-24">Input Type</th>
                      <th className="px-2 py-1.5 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Reference Ranges</th>
                      <th className="px-2 py-1.5 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fields.map((field, index) => (
                      <Fragment key={index}>
                      <tr className="hover:bg-accent/30">
                        <td className="px-2 py-1.5">
                          <div className="flex flex-col gap-0.5">
                            <button type="button" onClick={() => moveField(index, 'up')} disabled={index === 0}
                              className="w-4 h-3 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30">
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button type="button" onClick={() => moveField(index, 'down')} disabled={index === fields.length - 1}
                              className="w-4 h-3 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30">
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={field.field_name}
                            onChange={e => updateField(index, { field_name: e.target.value })}
                            disabled={readOnly || isFieldReferenced(field.field_name)}
                            className="w-full h-7 px-2 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="e.g., Hemoglobin"
                            title={isFieldReferenced(field.field_name) ? "This parameter is referenced in a calculation formula and cannot be renamed." : "Parameter Name"}
                            required
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          {customUnitMode.has(index) ? (
                            <div className="flex gap-0.5">
                              <input
                                type="text"
                                value={field.unit || ''}
                                onChange={e => updateField(index, { unit: e.target.value })}
                                className="w-full h-7 px-2 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Custom unit"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomUnitMode(prev => { const s = new Set(prev); s.delete(index); return s; });
                                }}
                                className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-secondary border border-border rounded hover:bg-accent transition-colors"
                                title="Switch to dropdown"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <select
                              value={field.unit || ''}
                              onChange={e => {
                                if (e.target.value === '__custom__') {
                                  setCustomUnitMode(prev => new Set([...prev, index]));
                                } else {
                                  updateField(index, { unit: e.target.value });
                                }
                              }}
                              className="w-full h-7 px-1 bg-secondary border border-border rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">Select unit</option>
                              {field.unit && !Object.values(LAB_UNITS).flat().includes(field.unit) && (
                                <option value={field.unit}>{field.unit}</option>
                              )}
                              {Object.entries(LAB_UNITS).map(([group, units]) => (
                                <optgroup key={group} label={group}>
                                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </optgroup>
                              ))}
                              <option value="__custom__">Other (custom)...</option>
                            </select>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={field.field_type || 'input'}
                            onChange={e => updateField(index, { field_type: e.target.value as FieldType })}
                            className="w-full h-7 px-1 bg-secondary border border-border rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="input">Input</option>
                            <option value="calculated">Calc</option>
                            <option value="flag">Flag</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={field.input_type || 'number'}
                            onChange={e => {
                              const val = e.target.value;
                              updateField(index, {
                                input_type: val,
                                options: val === 'select' ? 'Negative,Positive' : '',
                              });
                            }}
                            disabled={readOnly}
                            className="w-full h-7 px-1 bg-secondary border border-border rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="number">Number</option>
                            <option value="text">Text</option>
                            <option value="select">Selection</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => setExpandedRangeIndex(expandedRangeIndex === index ? null : index)}
                            className="flex items-center gap-1.5 w-full text-left group"
                          >
                            <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform flex-shrink-0 ${expandedRangeIndex === index ? 'rotate-90' : ''}`} />
                            <span className="text-[11px] text-foreground truncate">
                              {field._referenceRules.length > 0 ? (
                                referenceRulesSummary(field._referenceRules)
                              ) : (field.min_value != null || field.max_value != null) ? (
                                `${field.min_value ?? '—'} – ${field.max_value ?? '—'}`
                              ) : (
                                <span className="text-muted-foreground">Click to add</span>
                              )}
                            </span>
                            {field._criticalRules && (field._criticalRules.low != null || field._criticalRules.high != null) ? (
                              <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" title="Has critical thresholds" />
                            ) : null}
                          </button>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeField(index)}
                            disabled={readOnly || isFieldReferenced(field.field_name)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors text-destructive mx-auto disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isFieldReferenced(field.field_name) ? "This parameter is referenced in a calculation formula and cannot be deleted." : "Delete"}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Reference Range Editor */}
                      {expandedRangeIndex === index && (
                        <tr className="bg-gradient-to-r from-emerald-50/50 to-blue-50/50 dark:from-emerald-950/20 dark:to-blue-950/20">
                          <td className="px-2 py-2"></td>
                          <td colSpan={6} className="px-2 py-2">
                            <ReferenceRangeEditor
                              rules={field._referenceRules}
                              criticalRules={field._criticalRules}
                              onAddRule={() => addReferenceRule(index)}
                              onUpdateRule={(ri, updates) => updateReferenceRule(index, ri, updates)}
                              onRemoveRule={(ri) => removeReferenceRule(index, ri)}
                              onUpdateCritical={(updates) => updateCriticalRules(index, updates)}
                              readOnly={readOnly}
                            />
                          </td>
                        </tr>
                      )}

                      {/* Formula row for calculated fields - READ ONLY */}
                      {field.field_type === 'calculated' && (
                        <tr className="bg-primary/5">
                          <td className="px-2 py-1.5"></td>
                          <td colSpan={4} className="px-2 py-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-primary font-medium whitespace-nowrap">Formula:</span>
                              <div className="flex-1 h-7 px-2 bg-gray-100 dark:bg-gray-800 border border-primary/20 rounded text-xs flex items-center font-mono text-gray-600 dark:text-gray-400">
                                {field.formula || '(No formula set)'}
                              </div>
                              <span className="text-[10px] text-primary font-medium whitespace-nowrap">Depends on:</span>
                              <div className="flex-1 h-7 px-2 bg-gray-100 dark:bg-gray-800 border border-primary/20 rounded text-xs flex items-center font-mono text-gray-600 dark:text-gray-400">
                                {field.depends_on || '(Not specified)'}
                              </div>
                            </div>
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      )}
                      {/* Options row for qualitative fields - READ ONLY */}
                      {QUALITATIVE_UNITS.includes(field.unit || '') && field.field_type !== 'calculated' && (
                        <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                          <td className="px-2 py-1.5"></td>
                          <td colSpan={4} className="px-2 py-1.5">
                            <div>
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium whitespace-nowrap">Options:</span>
                            </div>
                            {field.formula && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {field.formula.split(',').map((opt, i) => (
                                  <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                    {opt.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                            {!field.formula && (
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">No options defined</p>
                            )}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!test && fields.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Parameters will be saved after the test is created. You&apos;ll need to edit the test to finalize them.
              </p>
            )}
          </div>
          </fieldset>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            {test?.has_branch_override && onReset && !readOnly && (
              <button 
                type="button"
                onClick={async () => {
                  if (confirm("Are you sure you want to reset this test to default? All branch-specific price and field overrides will be deleted.")) {
                    setIsSubmitting(true);
                    await onReset();
                    setIsSubmitting(false);
                    onClose();
                  }
                }}
                disabled={isSubmitting}
                className="h-9 px-3 mr-auto flex items-center gap-1.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/40 text-yellow-700 dark:text-yellow-400 rounded text-sm transition-colors"
                title="Reset to default settings"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Default
              </button>
            )}
            <button 
              type="button"
              onClick={onClose}
              className="h-9 px-4 bg-secondary border border-border rounded text-sm hover:bg-accent transition-colors"
            >
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly && (
              <button 
                type="submit"
                disabled={isSubmitting || !formData.test_name.trim() || !formData.test_code.trim()}
                className="h-9 px-4 bg-primary text-white rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {test ? 'Save Changes' : 'Create Test'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Reference Range Editor Component
// ============================================

interface ReferenceRangeEditorProps {
  rules: ReferenceRule[];
  criticalRules: CriticalRules;
  onAddRule: () => void;
  onUpdateRule: (ruleIndex: number, updates: Partial<ReferenceRule>) => void;
  onRemoveRule: (ruleIndex: number) => void;
  onUpdateCritical: (updates: Partial<CriticalRules>) => void;
  readOnly?: boolean;
}

function ReferenceRangeEditor({
  rules,
  criticalRules,
  onAddRule,
  onUpdateRule,
  onRemoveRule,
  onUpdateCritical,
  readOnly = false,
}: ReferenceRangeEditorProps) {
  return (
    <div className="space-y-3">
      {/* Reference Rules Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">
            Reference Ranges
          </span>
          {!readOnly && (
            <button
              type="button"
              onClick={onAddRule}
              className="h-5 px-1.5 flex items-center gap-0.5 bg-emerald-600 text-white rounded text-[9px] hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
              Add Range
            </button>
          )}
        </div>

        {rules.length === 0 ? (
          <div className="text-[10px] text-muted-foreground py-1.5 px-2 bg-secondary/50 rounded border border-border">
            No reference ranges defined. {!readOnly && 'Click "Add Range" to add one.'}
          </div>
        ) : (
          <div className="space-y-1">
            {rules.map((rule, ri) => (
              <div
                key={ri}
                className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800/40 rounded px-2 py-1.5"
              >
                {/* Age Group */}
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground mb-0.5">Age Group</span>
                  <select
                    value={rule.age_group || 'all'}
                    onChange={e => onUpdateRule(ri, { age_group: e.target.value })}
                    disabled={readOnly}
                    className="h-6 px-1 bg-secondary border border-border rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-[80px]"
                  >
                    {AGE_GROUPS.map(ag => (
                      <option key={ag} value={ag}>{ag.charAt(0).toUpperCase() + ag.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Sex */}
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground mb-0.5">Sex</span>
                  <select
                    value={rule.sex || 'any'}
                    onChange={e => onUpdateRule(ri, { sex: e.target.value })}
                    disabled={readOnly}
                    className="h-6 px-1 bg-secondary border border-border rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-[70px]"
                  >
                    {SEX_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Low */}
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground mb-0.5">Low</span>
                  <input
                    type="number"
                    value={rule.low ?? ''}
                    onChange={e => onUpdateRule(ri, { low: e.target.value ? Number(e.target.value) : null })}
                    disabled={readOnly}
                    className="h-6 w-20 px-1.5 bg-secondary border border-border rounded text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums"
                    placeholder="Min"
                    step="any"
                  />
                </div>

                {/* Range indicator */}
                <span className="text-muted-foreground text-xs mt-3">–</span>

                {/* High */}
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground mb-0.5">High</span>
                  <input
                    type="number"
                    value={rule.high ?? ''}
                    onChange={e => onUpdateRule(ri, { high: e.target.value ? Number(e.target.value) : null })}
                    disabled={readOnly}
                    className="h-6 w-20 px-1.5 bg-secondary border border-border rounded text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums"
                    placeholder="Max"
                    step="any"
                  />
                </div>

                {/* Text Range / Note */}
                <div className="flex flex-col flex-grow min-w-[150px]">
                  <span className="text-[9px] text-muted-foreground mb-0.5">Text Range / Note</span>
                  <input
                    type="text"
                    value={rule.note || ''}
                    onChange={e => onUpdateRule(ri, { note: e.target.value })}
                    disabled={readOnly}
                    className="h-6 px-2 bg-secondary border border-border rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g., Negative <0.8 or Normal"
                  />
                </div>

                {/* Delete rule */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onRemoveRule(ri)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-500 mt-3 ml-auto"
                    title="Remove this range"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Critical Thresholds Section */}
      <div>
        <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider flex items-center gap-1 mb-1.5">
          <AlertTriangle className="w-3 h-3" />
          Critical Thresholds
        </span>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800/40 rounded px-2 py-1.5">
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground mb-0.5">Critical Low</span>
            <input
              type="number"
              value={criticalRules.low ?? ''}
              onChange={e => onUpdateCritical({ low: e.target.value ? Number(e.target.value) : null })}
              disabled={readOnly}
              className="h-6 w-24 px-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-red-500 tabular-nums"
              placeholder="Critical min"
              step="any"
            />
          </div>
          <span className="text-muted-foreground text-xs mt-3">–</span>
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground mb-0.5">Critical High</span>
            <input
              type="number"
              value={criticalRules.high ?? ''}
              onChange={e => onUpdateCritical({ high: e.target.value ? Number(e.target.value) : null })}
              disabled={readOnly}
              className="h-6 w-24 px-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-red-500 tabular-nums"
              placeholder="Critical max"
              step="any"
            />
          </div>
          <div className="text-[9px] text-muted-foreground ml-2 mt-3 italic">
            Values outside this range trigger immediate alerts
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Package Modal Component
// ============================================
interface PackageModalProps {
  pkg: any | null;
  tests: Test[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  readOnly?: boolean;
}

function PackageModal({ pkg, tests, onClose, onSave, readOnly = false }: PackageModalProps) {
  const [packageName, setPackageName] = useState(pkg?.package_name || '');
  const [packageCode, setPackageCode] = useState(pkg?.package_code || '');
  const [category, setCategory] = useState(pkg?.category || '');
  const [description, setDescription] = useState(pkg?.description || '');
  const [price, setPrice] = useState<number | string>(pkg?.price != null ? Number(pkg.price) : '');
  const [isActive, setIsActive] = useState(pkg?.is_active !== false);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(pkg?.test_ids || []);

  const [testSearch, setTestSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredTests = useMemo(() => {
    return tests.filter(
      t => !selectedTestIds.includes(t.id) &&
      (t.test_name.toLowerCase().includes(testSearch.toLowerCase()) ||
       t.test_code.toLowerCase().includes(testSearch.toLowerCase()))
    ).slice(0, 10);
  }, [tests, selectedTestIds, testSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim() || !packageCode.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        package_name: packageName,
        package_code: packageCode,
        category,
        description,
        price: price ? Number(price) : 0,
        is_active: isActive,
        test_ids: selectedTestIds
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-20">
          <h2 className="text-foreground text-sm font-medium">
            {readOnly ? 'View Package Details' : pkg ? 'Edit Package' : 'Add New Package'}
          </h2>
          <button type="button" onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <fieldset disabled={readOnly} className={readOnly ? 'opacity-80' : ''}>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Package Name *</label>
                <input 
                  type="text"
                  value={packageName}
                  onChange={e => setPackageName(e.target.value)}
                  className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., General Wellness Profile"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Package Code *</label>
                <input 
                  type="text"
                  value={packageCode}
                  onChange={e => setPackageCode(e.target.value)}
                  disabled={!!pkg}
                  className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  placeholder="e.g., PKG-WELL-01"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Category</label>
                <input 
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., Wellness"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Price (₹) *</label>
                <input 
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div className="flex items-center mt-6">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Active & Available
                </label>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs text-muted-foreground block mb-1">Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full h-16 px-3 py-2 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder="Details about what health checkup this package offers..."
              />
            </div>

            {/* Test Selection */}
            <div className="mt-4">
              <label className="text-xs text-muted-foreground block mb-1">Include Lab Tests ({selectedTestIds.length})</label>
              {!readOnly && (
                <div className="relative mb-2" ref={dropdownRef}>
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                  <input 
                    type="text"
                    placeholder="Search tests by name or code to add..."
                    className="w-full h-8 pl-8 pr-3 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    value={testSearch}
                    onChange={e => { setTestSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                  />
                  {showDropdown && testSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg max-h-48 overflow-auto z-30">
                      {filteredTests.length > 0 ? (
                        filteredTests.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedTestIds([...selectedTestIds, t.id]);
                              setTestSearch('');
                              setShowDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-accent text-xs border-b border-border last:border-0"
                          >
                            <span className="font-semibold text-foreground">{t.test_code}</span> — {t.test_name}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                          No matching tests found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Tests Tags */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-border bg-secondary/10 rounded">
                {selectedTestIds.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground italic px-1">No tests selected yet.</span>
                ) : (
                  selectedTestIds.map(tid => {
                    const test = tests.find(t => t.id === tid);
                    if (!test) return null;
                    return (
                      <span key={tid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary border border-primary/20">
                        <span>{test.test_code}</span>
                        {!readOnly && (
                          <button 
                            type="button"
                            onClick={() => setSelectedTestIds(selectedTestIds.filter(id => id !== tid))}
                            className="p-0.5 hover:bg-primary/20 rounded-full transition-colors text-primary"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </fieldset>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button 
              type="button"
              onClick={onClose}
              className="h-9 px-4 bg-secondary border border-border rounded text-sm hover:bg-accent transition-colors"
            >
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly && (
              <button 
                type="submit"
                disabled={isSubmitting || !packageName.trim() || !packageCode.trim() || selectedTestIds.length === 0}
                className="h-9 px-4 bg-primary text-white rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {pkg ? 'Save Changes' : 'Create Package'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}


