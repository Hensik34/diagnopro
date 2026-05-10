import { useState, useEffect, Fragment } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { useTestStore } from '../../stores';
import { useAuthStore } from '../../stores';
import { useBranchStore } from '../../stores';
import { testApi } from '../../api';
import { PERMISSIONS } from '../../utils/permissions';
import type { Test, CreateTestData, TestField, CreateTestFieldData, FieldType } from '../../types';

// Common lab measurement units organized by category
const LAB_UNITS: Record<string, string[]> = {
  'Concentration': ['g/dL', 'mg/dL', 'µg/dL', 'g/L', 'mg/L', 'µg/L', 'ng/mL', 'pg/mL'],
  'Molar': ['mmol/L', 'µmol/L', 'nmol/L', 'pmol/L', 'mEq/L'],
  'Enzyme': ['U/L', 'IU/L', 'mIU/mL', 'IU/mL'],
  'Cell Count': ['cells/µL', 'cells/mm³', 'x10³/µL', 'x10⁶/µL', 'x10⁹/L', 'x10¹²/L'],
  'Percentage & Ratio': ['%', 'ratio', 'index'],
  'Hematology': ['fL', 'pg', 'mm/hr', 'sec'],
  'Volume': ['mL', 'L', 'dL', 'µL'],
  'Other Numeric': ['mm Hg', 'mOsm/kg', 'pH', 'mg/24hr', 'mL/min'],
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

  const { user, can } = useAuthStore();
  const { currentBranchId } = useBranchStore();
  const canEditTest = can(PERMISSIONS.TEST_UPDATE);
  const canDeleteTest = can(PERMISSIONS.TEST_DELETE);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<string | null>(null);

  // Fetch tests on mount or branch change
  useEffect(() => {
    fetchTests(currentBranchId ?? undefined);
  }, [fetchTests, currentBranchId]);

  const filteredTests = tests.filter(test => {
    const matchesSearch = 
      test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.test_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || test.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
      await resetTestToDefault(testId);
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
            onClick={() => fetchTests(currentBranchId ?? undefined)}
            disabled={isLoading}
            className="h-8 px-2.5 flex items-center gap-1.5 bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors text-xs disabled:opacity-50"
            title="Refresh test list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canEditTest && (
            <button 
              onClick={handleAdd}
              className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Test
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Tests</span>
            <Beaker className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{tests.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Configured</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Categories</span>
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{categories.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Test types</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded p-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input 
            type="text"
            placeholder="Search by test name or code..."
            className="w-full h-8 pl-8 pr-3 bg-secondary border-0 rounded text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="h-6 w-px bg-border"></div>

        <select 
          className="h-8 text-xs bg-secondary border-0 rounded px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground text-sm">Loading tests...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredTests.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded">
          <div className="text-muted-foreground text-sm">
            {tests.length === 0 ? 'No tests found. Add your first test to get started.' : 'No tests match your search criteria.'}
          </div>
          {tests.length === 0 && canEditTest && (
            <button
              onClick={handleAdd}
              className="mt-4 h-8 px-3 bg-primary text-white rounded text-sm hover:opacity-90 transition-opacity"
            >
              Add Test
            </button>
          )}
        </div>
      )}

      {/* Test Table */}
      {!isLoading && filteredTests.length > 0 && (
        <div className="bg-card border border-border rounded overflow-hidden">
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
                {filteredTests.map((test) => (
                  <tr 
                    key={test.id} 
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-foreground">{test.test_name}</span>
                          {test.has_user_override && (
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
                          <button 
                            onClick={() => handleEdit(test)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleEdit(test)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEditTest && test.has_user_override && (
                          <button 
                            onClick={() => handleReset(test.id)}
                            disabled={isResetting === test.id}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-blue-500 disabled:opacity-50"
                            title="Reset to Default"
                          >
                            {isResetting === test.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
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

          {/* Footer */}
          <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Showing <span className="text-foreground">{filteredTests.length}</span> of <span className="text-foreground">{tests.length}</span> tests
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
  onClose: () => void;
  onSave: (data: CreateTestData) => Promise<Test | null | void>;
}

function TestModal({ test, categories, readOnly = false, onClose, onSave }: TestModalProps) {
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
  const [fields, setFields] = useState<CreateTestFieldData[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [customUnitMode, setCustomUnitMode] = useState<Set<number>>(new Set());

  // Load existing fields when editing
  useEffect(() => {
    if (test?.id) {
      setLoadingFields(true);
      testApi.getFields(test.id)
        .then(res => {
          setFields(res.data.map((f: TestField) => ({
            field_name: f.field_name,
            unit: f.unit || '',
            min_value: f.min_value ?? undefined,
            max_value: f.max_value ?? undefined,
            input_type: f.input_type || 'number',
            order_index: f.order_index ?? 0,
            field_type: f.field_type || 'input',
            formula: f.formula || '',
            depends_on: f.depends_on || '',
          })));
        })
        .catch(() => {})
        .finally(() => setLoadingFields(false));
    }
  }, [test?.id]);

  // Detect existing custom units when fields are loaded
  useEffect(() => {
    const known = new Set(Object.values(LAB_UNITS).flat());
    const custom = new Set<number>();
    fields.forEach((f, i) => {
      if (f.unit && !known.has(f.unit)) custom.add(i);
    });
    setCustomUnitMode(custom);
  }, [fields.length]);

  const addField = () => {
    setFields(prev => [...prev, {
      field_name: '',
      unit: '',
      min_value: undefined,
      max_value: undefined,
      input_type: 'number',
      order_index: prev.length,
      field_type: 'input',
      formula: '',
      depends_on: '',
    }]);
  };

  const updateField = (index: number, updates: Partial<CreateTestFieldData>) => {
    setFields(prev => prev.map((f, i) => {
      if (i !== index) return f;
      const updated = { ...f, ...updates };
      // Auto-configure for qualitative units
      if (updates.unit !== undefined && QUALITATIVE_UNITS.includes(updates.unit)) {
        updated.input_type = 'text';
        updated.field_type = 'input';
        updated.min_value = undefined;
        updated.max_value = undefined;
        if (!f.formula || !QUALITATIVE_UNITS.includes(f.unit || '')) {
          updated.formula = (QUALITATIVE_DEFAULTS[updates.unit] || []).join(', ');
        }
      }
      return updated;
    }));
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, order_index: i })));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields.map((f, i) => ({ ...f, order_index: i })));
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
          await testApi.setFields(targetId, validFields);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleTypes = ['Blood', 'Urine', 'Stool', 'Saliva', 'Swab', 'CSF', 'Other'];
  const defaultCategories = ['CBC', 'Biochemistry', 'Hormone', 'Immunology', 'Microbiology', 'Serology'];
  const allCategories = [...new Set([...defaultCategories, ...categories.filter(Boolean)])];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
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
                      <th className="px-2 py-1.5 text-left text-muted-foreground text-[10px] uppercase tracking-wider w-40">Unit</th>
                      <th className="px-2 py-1.5 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-20">Type</th>
                      <th className="px-2 py-1.5 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-28">Min</th>
                      <th className="px-2 py-1.5 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-28">Max</th>
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
                            className="w-full h-7 px-2 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="e.g., Hemoglobin"
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
                                    updateField(index, { unit: '' });
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
                            {QUALITATIVE_UNITS.includes(field.unit || '') ? (
                              <span className="text-[10px] text-muted-foreground text-center block py-1">N/A</span>
                            ) : (
                              <input
                                type="number"
                                value={field.min_value ?? ''}
                                onChange={e => updateField(index, { min_value: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full h-7 px-2 bg-secondary border border-border rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Min"
                                step="any"
                              />
                            )}
                        </td>
                        <td className="px-2 py-1.5">
                            {QUALITATIVE_UNITS.includes(field.unit || '') ? (
                              <span className="text-[10px] text-muted-foreground text-center block py-1">N/A</span>
                            ) : (
                              <input
                                type="number"
                                value={field.max_value ?? ''}
                                onChange={e => updateField(index, { max_value: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full h-7 px-2 bg-secondary border border-border rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Max"
                                step="any"
                              />
                            )}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors text-destructive mx-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                      {/* Formula row for calculated fields */}
                      {field.field_type === 'calculated' && (
                        <tr className="bg-primary/5">
                          <td className="px-2 py-1.5"></td>
                          <td colSpan={4} className="px-2 py-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-primary font-medium whitespace-nowrap">Formula:</span>
                              <input
                                type="text"
                                value={field.formula || ''}
                                onChange={e => updateField(index, { formula: e.target.value })}
                                className="flex-1 h-7 px-2 bg-secondary border border-primary/30 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                                placeholder="e.g., TotalCholesterol / HDL"
                              />
                              <span className="text-[10px] text-primary font-medium whitespace-nowrap">Depends on:</span>
                              <input
                                type="text"
                                value={field.depends_on || ''}
                                onChange={e => updateField(index, { depends_on: e.target.value })}
                                className="flex-1 h-7 px-2 bg-secondary border border-primary/30 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                                placeholder='["FieldA","FieldB"]'
                              />
                            </div>
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      )}
                      {/* Options row for qualitative fields (Color, Appearance, etc.) */}
                      {QUALITATIVE_UNITS.includes(field.unit || '') && field.field_type !== 'calculated' && (
                        <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                          <td className="px-2 py-1.5"></td>
                          <td colSpan={4} className="px-2 py-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium whitespace-nowrap">Options:</span>
                              <input
                                type="text"
                                value={field.formula || ''}
                                onChange={e => updateField(index, { formula: e.target.value })}
                                className="flex-1 h-7 px-2 bg-secondary border border-amber-300/50 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                placeholder="Comma-separated options, e.g., Pale Yellow, Yellow, Dark Yellow"
                              />
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
