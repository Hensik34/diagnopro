import { useState, useEffect, Fragment, useMemo } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  RotateCcw,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';
import { testApi } from '../../api';
import { useTestStore, useAuthStore, useBranchStore } from '../../stores';
import { PERMISSIONS } from '../../utils/permissions';
import type { Test, CreateTestData, CreateTestFieldData, FieldType, ReferenceRule, CriticalRules, TestField } from '../../types';

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
const AGE_UNITS = ['days', 'months', 'years'];

const DEFAULT_TEST_CODES = new Set([
  'CBC-01', 'LFT-01', 'KFT-01', 'LIPID-01', 'PT', 'APTT', 'HBA1C-01', 'MAL-AG-01', 'TP-01', 'HIV-01',
  'HBSAG-01', 'HCV-01', 'CHIK-IGM-01', 'UACR-01', 'TORCH-01', 'HIV-RAPID-01', 'RPR-01', 'TB-XPERT-01',
  'DENGUE-01', 'DENGUE-RAPID', 'DENGNS1-RAPID', 'DENGNS1-01', 'DENGIGG-01', 'HBSAG-RAPID-01', 'HCV-RAPID-01',
  'HB-01', 'AEC-01', 'RETIC-01', 'MP-01', 'PLT-01', 'PGBS-01', 'UREA-01', 'CREAT-01', 'BIL-01', 'SGPT-01',
  'SGOT-01', 'ALP-01', 'CHOL-01', 'TRIG-01', 'HDL-01', 'SPUTUM-RM', 'MANTOUX-01', 'TYPHIDOT-01', 'WIDAL-01',
  'PBS-01', 'ELEC-01', 'STOOL-01', 'BRUC-IGM', 'BRUC-IGG', 'APLA-PRO', 'DBLM-01', 'TRPM-01', 'RUB-IGG',
  'RUB-IGM', 'GTT-01', 'CRP-01', 'FBS-01', 'PPBS-01', 'RBS-01', 'URINE-01'
]);

function isDefaultTest(testCode?: string): boolean {
  if (!testCode) return false;
  return DEFAULT_TEST_CODES.has(testCode.toUpperCase().trim());
}

interface FieldEditorData extends CreateTestFieldData {
  test_field_id?: string;
  _referenceRules: ReferenceRule[];
  _criticalRules: CriticalRules;
}

/**
 * Automatically standardizes test names to the format 'Short Name (Full Name)'
 * if it currently is formatted as 'Full Name (Short Name)'.
 * Retains qualifiers like (Urine), (Serum), (8 AM), etc. as-is.
 */
function formatTestName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  const match = trimmed.match(/^([^(]+)\(([^)]+)\)$/);
  if (!match) return trimmed;

  const partA = match[1].trim();
  const partB = match[2].trim();

  const lowerB = partB.toLowerCase();
  const detailKeywords = [
    'urine', 'serum', 'plasma', 'blood', 'fluid', 'marker', 'screening',
    'confirmation', 'rapid', 'detection', 'analysis', 'test', 'am', 'pm',
    'hour', 'quant', 'qual', 'elisa', 'card', 'culture', 'smear', 'swab',
    'tissue', 'biopsy', 'normal', 'abnormal'
  ];
  const isDetail = detailKeywords.some(keyword => lowerB.includes(keyword));

  if (!isDetail && partB.length < partA.length) {
    return `${partB} (${partA})`;
  }

  return trimmed;
}

function normalizeReferenceRules(raw: any): ReferenceRule[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map(r => ({
      age_group: r.age_group || 'all',
      sex: r.sex || 'any',
      low: r.low ?? r.min ?? null,
      high: r.high ?? r.max ?? null,
      age_min: r.age_min != null ? Number(r.age_min) : null,
      age_max: r.age_max != null ? Number(r.age_max) : null,
      age_min_unit: r.age_min_unit || r.age_max_unit || 'years',
      age_max_unit: r.age_max_unit || r.age_min_unit || 'years',
      note: r.note,
    }));
  }

  if (typeof raw === 'object') {
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

function referenceRulesSummary(rules: ReferenceRule[]): string {
  if (!rules || rules.length === 0) return '—';

  // Helper to format unit shorthand
  const unitShorthand = (u?: string | null) => {
    if (!u) return '';
    const lower = u.toLowerCase();
    if (lower.startsWith('day')) return 'd';
    if (lower.startsWith('month')) return 'm';
    if (lower.startsWith('year')) return 'y';
    return '';
  };

  if (rules.length === 1 && rules[0].sex === 'any' && (rules[0].age_group === 'all' || !rules[0].age_group) && rules[0].age_min == null && rules[0].age_max == null) {
    const r = rules[0];
    if (r.note) return r.note;
    const lo = r.low != null ? r.low : '—';
    const hi = r.high != null ? r.high : '—';
    return `${lo} – ${hi}`;
  }

  const parts: string[] = [];
  for (const r of rules) {
    const sexLabel = r.sex === 'male' ? 'M' : r.sex === 'female' ? 'F' : '';
    let ageLabel = '';
    
    if (r.age_min != null || r.age_max != null) {
      const minVal = r.age_min != null ? `${r.age_min}${unitShorthand(r.age_min_unit)}` : '0';
      const maxVal = r.age_max != null ? `${r.age_max}${unitShorthand(r.age_max_unit)}` : '∞';
      ageLabel = `${minVal}-${maxVal}`;
    } else if (r.age_group && r.age_group !== 'all') {
      ageLabel = r.age_group;
    }

    const label = [sexLabel, ageLabel].filter(Boolean).join('/');

    if (r.note && r.low == null && r.high == null) {
      parts.push(label ? `${label}: ${r.note}` : r.note);
      continue;
    }
    const lo = r.low != null ? r.low : '—';
    const hi = r.high != null ? r.high : '—';
    parts.push(label ? `${label}: ${lo}–${hi}` : `${lo}–${hi}`);
  }

  return parts.join(' | ');
}

function defaultRule(): ReferenceRule {
  return {
    age_group: 'all',
    sex: 'any',
    low: null,
    high: null,
    age_min: null,
    age_max: null,
    age_min_unit: 'years',
    age_max_unit: 'years',
    note: ''
  };
}

export function TestConfiguration() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { createTest, updateTest, resetTestToDefault, tests, fetchTests } = useTestStore();
  const { can } = useAuthStore();
  const { currentBranchId } = useBranchStore();

  const isEdit = testId !== 'new';
  const canEdit = can(PERMISSIONS.TEST_UPDATE);

  const [loadingTest, setLoadingTest] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [test, setTest] = useState<Test | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateTestData>({
    test_name: '',
    test_code: '',
    category: '',
    sample_type: '',
    price: undefined,
    turnaround_time: undefined,
    description: '',
  });

  const isDefault = isEdit && isDefaultTest(formData.test_code);

  const [fields, setFields] = useState<FieldEditorData[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [customUnitMode, setCustomUnitMode] = useState<Set<number>>(new Set());
  const [expandedRangeIndex, setExpandedRangeIndex] = useState<number | null>(null);

  // Calculate unique categories from store tests
  const categories = useMemo(() => {
    return [...new Set(tests.map(t => t.category).filter(Boolean))];
  }, [tests]);

  // Load test details if editing
  useEffect(() => {
    if (isEdit && testId) {
      setLoadingTest(true);
      testApi.getById(testId, currentBranchId || undefined)
        .then(res => {
          if (res.data) {
            setTest(res.data);
            setFormData({
              test_name: res.data.test_name || '',
              test_code: res.data.test_code || '',
              category: res.data.category || '',
              sample_type: res.data.sample_type || '',
              price: res.data.price != null ? Number(res.data.price) : undefined,
              turnaround_time: res.data.turnaround_time != null ? Number(res.data.turnaround_time) : undefined,
              description: res.data.description || '',
            });
          }
        })
        .catch(err => console.error('Failed to load test:', err))
        .finally(() => setLoadingTest(false));
    }
  }, [testId, isEdit, currentBranchId]);

  // Load fields when test details are loaded or component mounts for edit
  useEffect(() => {
    if (isEdit && testId) {
      setLoadingFields(true);
      testApi.getFields(testId, currentBranchId || undefined)
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
        .catch(err => console.error('Failed to load fields:', err))
        .finally(() => setLoadingFields(false));
    }
  }, [testId, isEdit, currentBranchId]);

  // Detect custom units when fields load
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
    if (expandedRangeIndex === index) setExpandedRangeIndex(newIndex);
    else if (expandedRangeIndex === newIndex) setExpandedRangeIndex(index);
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formattedName = formatTestName(formData.test_name);
      const updatedFormData = { ...formData, test_name: formattedName };
      
      let savedTest = null;
      if (isEdit && testId) {
        savedTest = await updateTest(testId, updatedFormData);
      } else {
        savedTest = await createTest({ ...updatedFormData, branch_id: currentBranchId! });
      }

      const targetId = isEdit ? testId : (savedTest?.id || null);
      if (targetId) {
        const validFields = fields.filter(f => f.field_name.trim());
        if (validFields.length > 0) {
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
          await testApi.setFields(targetId, fieldsToSave, currentBranchId || undefined);
        }
      }

      // Sync the test store list
      await fetchTests(currentBranchId || undefined);
      toast.success("Test configuration saved successfully");
      navigate('/tests');
    } catch (err: any) {
      console.error('Save test configuration failed:', err);
      toast.error(err.message || "Failed to save test configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!isEdit || !testId) return;
    if (confirm("Are you sure you want to reset this test to default? All branch-specific price and field overrides will be deleted.")) {
      setSaving(true);
      try {
        await resetTestToDefault(testId);
        await fetchTests(currentBranchId || undefined);
        toast.success("Test override reset to default");
        navigate('/tests');
      } catch (err: any) {
        console.error('Reset failed:', err);
        toast.error(err.message || "Failed to reset test to default");
      } finally {
        setSaving(false);
      }
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
    if (formData.sample_type && !list.includes(formData.sample_type)) {
      list.push(formData.sample_type);
    }
    return list;
  }, [formData.sample_type]);

  const defaultCategories = ['CBC', 'Biochemistry', 'Hormone', 'Immunology', 'Microbiology', 'Serology'];
  const allCategories = [...new Set([...defaultCategories, ...categories.filter(Boolean)])];

  if (loadingTest) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading test settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6 max-w-[98%] space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tests')}
            className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-500/10 text-emerald-600 rounded">
                <Sparkles className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-foreground">
                {isEdit ? 'Test Configuration' : 'Add New Test'}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit ? `Configure settings and parameters for ${formData.test_name || 'Test'}` : 'Define basic details and parameters for the new test'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {test?.has_branch_override && isEdit && canEdit && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="h-9 px-3 flex items-center gap-1.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/40 text-yellow-700 dark:text-yellow-400 rounded-md text-xs font-medium transition-colors cursor-pointer"
              title="Reset branch override to default settings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset overrides
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/tests')}
            className="h-9 px-4 bg-secondary border border-border rounded-md text-xs font-semibold hover:bg-accent transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving || !formData.test_name.trim() || !formData.test_code.trim()}
              className="h-9 px-4 bg-primary text-white font-semibold rounded-md text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Settings Box at Top */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
            Basic Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Test Name */}
            <div className="lg:col-span-4">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Test Name *</label>
              <input
                type="text"
                value={formData.test_name}
                onChange={e => setFormData(prev => ({ ...prev, test_name: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., CBC (Complete Blood Count)"
                required
                disabled={!canEdit}
              />
            </div>

            {/* Test Code */}
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Test Code *</label>
              <input
                type="text"
                value={formData.test_code}
                onChange={e => setFormData(prev => ({ ...prev, test_code: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="e.g., CBC-01"
                required
                disabled={!canEdit || isEdit}
              />
            </div>

            {/* Category */}
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-9 px-2.5 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                disabled={!canEdit}
              >
                <option value="">Select...</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sample Type */}
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Sample Type</label>
              <select
                value={formData.sample_type}
                onChange={e => setFormData(prev => ({ ...prev, sample_type: e.target.value }))}
                className="w-full h-9 px-2.5 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                disabled={!canEdit}
              >
                <option value="">Select...</option>
                {sampleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Price (₹) */}
            <div className="lg:col-span-1">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Price (₹)</label>
              <input
                type="number"
                value={formData.price ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0"
                min="0"
                disabled={!canEdit}
              />
            </div>

            {/* TAT (Hours) */}
            <div className="lg:col-span-1">
              <label className="text-xs font-medium text-muted-foreground block mb-1">TAT (Hrs)</label>
              <input
                type="number"
                value={formData.turnaround_time ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, turnaround_time: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="TAT"
                min="0"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full h-16 px-3 py-2 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Brief description of the test..."
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Parameters / Reference Rules Below */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-sm font-semibold text-foreground">
                Parameters / Field Editor
              </h2>
              {canEdit && (
                <button
                  type="button"
                  onClick={addField}
                  className="h-7 px-3 flex items-center gap-1 bg-primary text-white rounded-md text-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Parameter
                </button>
              )}
            </div>

            {loadingFields ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-12 bg-secondary/10 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                No parameters configured. Click "Add Parameter" to define test fields.
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary/40">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider w-8">#</th>
                      <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Parameter Name</th>
                      <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider w-32">Unit</th>
                      <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-24">Field Type</th>
                      <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-24">Input Type</th>
                      <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Reference Ranges</th>
                      <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fields.map((field, index) => (
                      <Fragment key={index}>
                        <tr className="hover:bg-accent/20">
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-0.5">
                              <button type="button" onClick={() => moveField(index, 'up')} disabled={index === 0}
                                className="w-4 h-3 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30">
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => moveField(index, 'down')} disabled={index === fields.length - 1}
                                className="w-4 h-3 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={field.field_name}
                              onChange={e => updateField(index, { field_name: e.target.value })}
                              disabled={!canEdit || isFieldReferenced(field.field_name)}
                              className="w-full h-8 px-2 bg-secondary border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                              placeholder="e.g., Hemoglobin"
                              title={isFieldReferenced(field.field_name) ? "This parameter is referenced in a calculation formula and cannot be renamed." : "Parameter Name"}
                              required
                            />
                          </td>
                          <td className="px-2 py-2">
                            {customUnitMode.has(index) ? (
                              <div className="flex gap-0.5">
                                <input
                                  type="text"
                                  value={field.unit || ''}
                                  onChange={e => updateField(index, { unit: e.target.value })}
                                  className="w-full h-8 px-2 bg-secondary border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                  placeholder="Custom unit"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomUnitMode(prev => { const s = new Set(prev); s.delete(index); return s; });
                                  }}
                                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-secondary border border-border rounded-md hover:bg-accent transition-colors"
                                  title="Switch to dropdown"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
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
                                className="w-full h-8 px-1.5 bg-secondary border border-border rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
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
                          <td className="px-2 py-2">
                            <select
                              value={field.field_type || 'input'}
                              onChange={e => updateField(index, { field_type: e.target.value as FieldType })}
                              className="w-full h-8 px-1 bg-secondary border border-border rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                              disabled={isDefault}
                            >
                              <option value="input">Input</option>
                              <option value="calculated">Calc</option>
                              <option value="flag">Flag</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={field.input_type || 'number'}
                              onChange={e => {
                                const val = e.target.value;
                                updateField(index, {
                                  input_type: val,
                                  options: val === 'select' ? 'Negative,Positive' : '',
                                });
                              }}
                              disabled={!canEdit}
                              className="w-full h-8 px-1 bg-secondary border border-border rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="number">Number</option>
                              <option value="text">Text</option>
                              <option value="select">Selection</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => setExpandedRangeIndex(expandedRangeIndex === index ? null : index)}
                              className="flex items-center gap-1 w-full text-left group"
                            >
                              <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ${expandedRangeIndex === index ? 'rotate-90' : ''}`} />
                              <span className="text-[11px] text-foreground truncate font-medium">
                                {field._referenceRules.length > 0 ? (
                                  referenceRulesSummary(field._referenceRules)
                                ) : (field.min_value != null || field.max_value != null) ? (
                                  `${field.min_value ?? '—'} – ${field.max_value ?? '—'}`
                                ) : (
                                  <span className="text-muted-foreground italic">Click to configure</span>
                                )}
                              </span>
                            </button>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeField(index)}
                              disabled={!canEdit || isFieldReferenced(field.field_name)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-destructive/10 transition-colors text-destructive mx-auto disabled:opacity-40 disabled:cursor-not-allowed"
                              title={isFieldReferenced(field.field_name) ? "This parameter is referenced in a calculation formula and cannot be deleted." : "Delete parameter"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Reference Range Editor */}
                        {expandedRangeIndex === index && (
                          <tr className="bg-gradient-to-r from-emerald-50/20 to-blue-50/20 dark:from-emerald-950/10 dark:to-blue-950/10">
                            <td></td>
                            <td colSpan={6} className="px-3 py-3">
                              <ReferenceRangeEditor
                                rules={field._referenceRules}
                                onAddRule={() => addReferenceRule(index)}
                                onUpdateRule={(ri, updates) => updateReferenceRule(index, ri, updates)}
                                onRemoveRule={(ri) => removeReferenceRule(index, ri)}
                                readOnly={!canEdit}
                              />
                            </td>
                          </tr>
                        )}

                        {/* Formula Row for calculated fields */}
                        {field.field_type === 'calculated' && (
                          <tr className="bg-primary/5">
                            <td></td>
                            <td colSpan={4} className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-primary font-semibold whitespace-nowrap">Formula:</span>
                                <input
                                  type="text"
                                  value={field.formula || ''}
                                  onChange={e => updateField(index, { formula: e.target.value })}
                                  placeholder="e.g. Hemoglobin * 3"
                                  className="flex-1 h-7 px-2 bg-background border border-border rounded text-xs font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                                  disabled={isDefault}
                                />
                                <span className="text-[10px] text-primary font-semibold whitespace-nowrap">Depends on:</span>
                                <input
                                  type="text"
                                  value={field.depends_on || ''}
                                  onChange={e => updateField(index, { depends_on: e.target.value })}
                                  placeholder="e.g. Hemoglobin"
                                  className="flex-1 h-7 px-2 bg-background border border-border rounded text-xs font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                                  disabled={isDefault}
                                />
                              </div>
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        )}

                        {/* Options Row for selection fields */}
                        {field.input_type === 'select' && (
                          <tr className="bg-amber-50/10 dark:bg-amber-950/10">
                            <td></td>
                            <td colSpan={4} className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold whitespace-nowrap">Dropdown Options:</span>
                                <input
                                  type="text"
                                  value={field.options || ''}
                                  onChange={e => updateField(index, { options: e.target.value })}
                                  placeholder="Comma separated options, e.g. Negative,Positive"
                                  className="flex-1 h-7 px-2 bg-background border border-border rounded text-xs"
                                />
                              </div>
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
          </div>
        </div>
      </form>
    </div>
  );
}

interface ReferenceRangeEditorProps {
  rules: ReferenceRule[];
  onAddRule: () => void;
  onUpdateRule: (ruleIndex: number, updates: Partial<ReferenceRule>) => void;
  onRemoveRule: (ruleIndex: number) => void;
  readOnly?: boolean;
}

function ReferenceRangeEditor({
  rules,
  onAddRule,
  onUpdateRule,
  onRemoveRule,
  readOnly = false,
}: ReferenceRangeEditorProps) {
  return (
    <div className="space-y-4">
      {/* Reference Rules */}
      <div className="bg-background border border-border rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-1.5">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            Reference Ranges (Matching Rules)
          </span>
          {!readOnly && (
            <button
              type="button"
              onClick={onAddRule}
              className="h-6 px-2 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add Match Rule
            </button>
          )}
        </div>

        {rules.length === 0 ? (
          <div className="text-[11px] text-muted-foreground py-2 text-center">
            No rules set. Default ranges will apply. {!readOnly && 'Click "Add Match Rule" to specify custom criteria.'}
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule, ri) => {
              const isNumericMode = rule.age_min != null || rule.age_max != null;

              return (
                <div
                  key={ri}
                  className="flex flex-wrap items-center gap-3 bg-secondary/20 border border-border rounded-lg p-2.5 relative group/rule"
                >
                  {/* Sex Selection */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground mb-1 font-medium">Sex</span>
                    <select
                      value={rule.sex || 'any'}
                      onChange={e => onUpdateRule(ri, { sex: e.target.value })}
                      disabled={readOnly}
                      className="h-8 px-2.5 bg-background border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer min-w-[80px]"
                    >
                      {SEX_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground mb-1 font-medium">Age Limit Type</span>
                    <select
                      value={isNumericMode ? 'range' : 'group'}
                      onChange={e => {
                        const isRange = e.target.value === 'range';
                        if (isRange) {
                          onUpdateRule(ri, {
                            age_min: 0,
                            age_min_unit: 'years',
                            age_max: 120,
                            age_max_unit: 'years',
                            age_group: 'all'
                          });
                        } else {
                          onUpdateRule(ri, {
                            age_min: null,
                            age_max: null,
                            age_min_unit: null,
                            age_max_unit: null,
                            age_group: 'all'
                          });
                        }
                      }}
                      disabled={readOnly}
                      className="h-8 px-2.5 bg-background border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer min-w-[120px]"
                    >
                      <option value="group">Age Group</option>
                      <option value="range">Numeric Limits</option>
                    </select>
                  </div>

                  {/* Conditional inputs */}
                  {isNumericMode ? (
                    <>
                      {/* Min age limit */}
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground mb-1 font-medium">Min Age</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={rule.age_min ?? ''}
                            onChange={e => onUpdateRule(ri, { age_min: e.target.value !== '' ? Number(e.target.value) : 0 })}
                            disabled={readOnly}
                            className="h-8 w-14 px-2 bg-background border border-border rounded-md text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="0"
                            min="0"
                          />
                          <select
                            value={rule.age_min_unit || 'years'}
                            onChange={e => onUpdateRule(ri, { age_min_unit: e.target.value })}
                            disabled={readOnly}
                            className="h-8 px-1.5 bg-background border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer min-w-[70px]"
                          >
                            {AGE_UNITS.map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <span className="text-muted-foreground text-xs mt-4">—</span>

                      {/* Max age limit */}
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground mb-1 font-medium">Max Age</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={rule.age_max ?? ''}
                            onChange={e => onUpdateRule(ri, { age_max: e.target.value !== '' ? Number(e.target.value) : 100 })}
                            disabled={readOnly}
                            className="h-8 w-14 px-2 bg-background border border-border rounded-md text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="100"
                            min="0"
                          />
                          <select
                            value={rule.age_max_unit || 'years'}
                            onChange={e => onUpdateRule(ri, { age_max_unit: e.target.value })}
                            disabled={readOnly}
                            className="h-8 px-1.5 bg-background border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer min-w-[70px]"
                          >
                            {AGE_UNITS.map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground mb-1 font-medium">Age Group Label</span>
                      <select
                        value={rule.age_group || 'all'}
                        onChange={e => onUpdateRule(ri, { age_group: e.target.value })}
                        disabled={readOnly}
                        className="h-8 px-2.5 bg-background border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer min-w-[100px]"
                      >
                        {AGE_GROUPS.map(ag => (
                          <option key={ag} value={ag}>{ag.charAt(0).toUpperCase() + ag.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Low Value */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground mb-1 font-medium">Min Ref Value</span>
                    <input
                      type="number"
                      value={rule.low ?? ''}
                      onChange={e => onUpdateRule(ri, { low: e.target.value !== '' ? Number(e.target.value) : null })}
                      disabled={readOnly}
                      className="h-8 w-24 px-2.5 bg-background border border-border rounded-md text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="Low"
                      step="any"
                    />
                  </div>

                  <span className="text-muted-foreground text-xs mt-4">—</span>

                  {/* High Value */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground mb-1 font-medium">Max Ref Value</span>
                    <input
                      type="number"
                      value={rule.high ?? ''}
                      onChange={e => onUpdateRule(ri, { high: e.target.value !== '' ? Number(e.target.value) : null })}
                      disabled={readOnly}
                      className="h-8 w-24 px-2.5 bg-background border border-border rounded-md text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="High"
                      step="any"
                    />
                  </div>

                  {/* Notes / Text Range */}
                  <div className="flex flex-col flex-1 min-w-[120px]">
                    <span className="text-[10px] text-muted-foreground mb-1 font-medium">Text Range / Custom Note</span>
                    <input
                      type="text"
                      value={rule.note || ''}
                      onChange={e => onUpdateRule(ri, { note: e.target.value })}
                      disabled={readOnly}
                      className="h-8 px-3 bg-background border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="e.g., Negative <0.8 or Normal"
                    />
                  </div>

                  {/* Delete Rule */}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => onRemoveRule(ri)}
                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive mt-4 transition-colors cursor-pointer"
                      title="Remove match rule"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
