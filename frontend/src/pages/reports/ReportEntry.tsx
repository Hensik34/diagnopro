import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation, useSearchParams, Link } from "react-router";
import {
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
  FileText,
  Plus,
  User,
  Calendar,
  Microscope,
  Info,
  ChevronRight,
  Search,
  Stethoscope,
  X,
  Loader2,
  Send,
  Lock,
  Sparkles,
  BrainCircuit,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useDoctorStore, useReportStore, usePatientStore, useTestStore, useBranchStore } from "../../stores";
import { useAuthStore } from "../../stores/authStore";
import { reportApi } from "../../api/reports";
import { priceListApi, pricingEngineApi } from "../../api/priceLists";
import { useBillingStore } from "../../stores/billingStore";
import type { AgeUnit, Doctor, Patient, Report, Test, TestField, ReferenceRule, CriticalRules, ReportTestPriceSnapshot } from "../../types";
import { BillingSection } from "../../app/components/reports/BillingSection";
import { formatAge, getAgeMax, normalizeAgeUnit } from "../../utils/age";
import { smartSearchFilter } from "../../utils";

// ============================================
// Reference Rules Utility Functions for Reports
// ============================================

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
            low: (vals as any).low ?? (vals as any).min ?? null,
            high: (vals as any).high ?? (vals as any).max ?? null,
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

interface MatchedRange {
  low: number | null;
  high: number | null;
  note: string;
  isRuleMatched: boolean;
  criticalLow: number | null;
  criticalHigh: number | null;
}



function getPatientReferenceRange(
  field: {
    reference_rules?: any;
    min_value?: number | null;
    max_value?: number | null;
    critical_rules?: any
  },
  patient: Patient | null
): MatchedRange {
  let criticalLow: number | null = null;
  let criticalHigh: number | null = null;
  if (field.critical_rules) {
    criticalLow = field.critical_rules.low ?? null;
    criticalHigh = field.critical_rules.high ?? null;
  }

  // If there are qualitative bands, build their summary note
  if (field.reference_rules && typeof field.reference_rules === 'object' && !Array.isArray(field.reference_rules) && 'qualitative_bands' in field.reference_rules) {
    const bands = field.reference_rules.qualitative_bands || [];
    const bandsSummary = bands.map((b: any) => {
      let opStr = '';
      if (b.operator === 'lt') opStr = `<${b.value ?? ''}`;
      else if (b.operator === 'lte') opStr = `≤${b.value ?? ''}`;
      else if (b.operator === 'gt') opStr = `>${b.value ?? ''}`;
      else if (b.operator === 'gte') opStr = `≥${b.value ?? ''}`;
      else if (b.operator === 'eq') opStr = `=${b.value ?? ''}`;
      else if (b.operator === 'range') opStr = `${b.min ?? ''}–${b.max ?? ''}`;
      return `${b.label} ${opStr}`;
    }).join(' | ');
    return {
      low: null,
      high: null,
      note: bandsSummary,
      isRuleMatched: true,
      criticalLow,
      criticalHigh,
    };
  }

  const rules = normalizeReferenceRules(field.reference_rules);

  const fallbackRange: MatchedRange = {
    low: field.min_value != null ? Number(field.min_value) : null,
    high: field.max_value != null ? Number(field.max_value) : null,
    note: '',
    isRuleMatched: false,
    criticalLow,
    criticalHigh,
  };

  if (!patient || rules.length === 0) {
    return fallbackRange;
  }

  // Calculate patient age in years
  let ageInYears = patient.age ?? 0;
  const ageUnit = patient.age_unit ? patient.age_unit.toLowerCase() : 'years';
  if (ageUnit === 'months') {
    ageInYears = ageInYears / 12;
  } else if (ageUnit === 'days') {
    ageInYears = ageInYears / 365.25;
  }

  // Determine age group
  let ageGroup = 'adult';
  if (ageInYears <= 0.08) {
    ageGroup = 'neonatal';
  } else if (ageInYears <= 1) {
    ageGroup = 'infant';
  } else if (ageInYears <= 12) {
    ageGroup = 'pediatric';
  } else if (ageInYears < 18) {
    ageGroup = 'adolescent';
  } else if (ageInYears >= 65) {
    ageGroup = 'elderly';
  }

  const patientSex = patient.gender ? patient.gender.toLowerCase() : 'any';

  // Find compatible rules and score them
  let bestRule: any = null;
  let bestScore = -1;

  for (const rule of rules) {
    let isCompatible = true;
    let score = 0;

    // Check gender compatibility
    const ruleSex = rule.sex ? rule.sex.toLowerCase() : 'any';
    if (ruleSex !== 'any' && ruleSex !== 'all' && ruleSex !== patientSex) {
      isCompatible = false;
    } else if (ruleSex === patientSex) {
      score += 10;
    } else {
      score += 1;
    }

    // Check age compatibility
    if (isCompatible) {
      if (rule.age_min != null || rule.age_max != null) {
        if (rule.age_min != null && ageInYears < rule.age_min) {
          isCompatible = false;
        }
        if (rule.age_max != null && ageInYears > rule.age_max) {
          isCompatible = false;
        }
        if (isCompatible) {
          score += 20;
        }
      } else {
        const ruleAgeGroup = rule.age_group ? rule.age_group.toLowerCase() : 'all';
        if (ruleAgeGroup !== 'all' && ruleAgeGroup !== 'any' && ruleAgeGroup !== ageGroup) {
          isCompatible = false;
        } else if (ruleAgeGroup === ageGroup) {
          score += 10;
        } else {
          score += 1;
        }
      }
    }

    if (isCompatible && score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  if (bestRule) {
    return {
      low: bestRule.low ?? null,
      high: bestRule.high ?? null,
      note: bestRule.note || '',
      isRuleMatched: true,
      criticalLow,
      criticalHigh,
    };
  }

  return fallbackRange;
}

function formatReferenceRange(range: MatchedRange): string {
  if (range.note) return range.note;
  if (range.low == null && range.high == null) return '-';
  const lo = range.low != null ? range.low : '—';
  const hi = range.high != null ? range.high : '—';
  return `${lo} - ${hi}`;
}

export function ReportEntry() {
  const { reportId: rawReportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  // Get initial data from navigation state (from CreateReport page)
  const initialData = location.state as {
    patient?: Patient;
    testName?: string;
    reportAmount?: number;
  } | null;

  // Stores
  const { doctors, fetchDoctors, isLoading: doctorsLoading } = useDoctorStore();
  const {
    selectedReport,
    fetchReportById,
    updateReport,
    submitReport,
    setSelectedReport,
    isLoading: reportLoading,
    error: reportError
  } = useReportStore();
  const { fetchPatientById, updatePatient } = usePatientStore();
  const { currentBranchId, fetchBranches } = useBranchStore();
  const { can } = useAuthStore();
  const { tests, testFields, fetchTests, fetchTestFields, fetchTestFieldsMulti } = useTestStore();
  const canAutoApprove = can('report:approve');
  const { loadFromReport, reset: resetBilling, saveBilling, setBaseAmount, baseAmount } = useBillingStore();
  const reportId = rawReportId && rawReportId !== 'undefined' && rawReportId !== 'null' ? rawReportId : undefined;

  useEffect(() => {
    if (!currentBranchId) {
      fetchBranches();
    }
  }, [currentBranchId, fetchBranches]);

  useEffect(() => {
    if (rawReportId === 'undefined' || rawReportId === 'null') {
      navigate('/reports', { replace: true });
    }
  }, [rawReportId, navigate]);

  // Dynamic test parameters derived from testFields (memoized to prevent re-render loops)
  const dynamicParams = useMemo(() =>
    [...testFields]
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((field) => ({
        id: field.id,
        test_id: field.test_id,
        name: field.field_name,
        unit: field.unit || '',
        min: field.min_value != null ? Number(field.min_value) : 0,
        max: field.max_value != null ? Number(field.max_value) : 0,
        step: field.input_type === 'number' ? 0.1 : 1,
        input_type: field.input_type || 'number',
        options: field.options || '',
        field_type: (field.field_type || 'input') as 'input' | 'calculated' | 'flag',
        formula: field.formula || '',
        depends_on: field.depends_on || '',
        section_group: field.section_group || '',
        reference_rules: field.reference_rules,
        critical_rules: field.critical_rules,
        is_mandatory: field.is_mandatory !== false,
      })),
    [testFields]
  );

  // Group parameters by test for multi-test section rendering
  // Parse test_data if it is a JSON string
  const parsedTestData = useMemo(() => {
    if (!selectedReport?.test_data) return null;
    if (typeof selectedReport.test_data === 'string') {
      try {
        return JSON.parse(selectedReport.test_data);
      } catch {
        return null;
      }
    }
    return selectedReport.test_data;
  }, [selectedReport]);

  // Group parameters by test for multi-test section rendering
  const testSections = useMemo(() => {
    const testIds = parsedTestData?.testIds || [];
    const grouped = new Map<string, typeof dynamicParams>();

    for (const param of dynamicParams) {
      const list = grouped.get(param.test_id) || [];
      list.push(param);
      grouped.set(param.test_id, list);
    }

    // Build ordered sections: preserve the order from testIds
    const sections: { testId: string; testName: string; testCode: string; params: typeof dynamicParams }[] = [];
    const orderedIds = testIds.length > 0 ? testIds : [...grouped.keys()];

    for (const tid of orderedIds) {
      const params = grouped.get(tid);
      if (!params || params.length === 0) continue;
      const masterTest = tests.find(t => t.id === tid);
      sections.push({
        testId: tid,
        testName: masterTest?.test_name || `Test ${tid.slice(0, 8)}`,
        testCode: masterTest?.test_code || '',
        params,
      });
    }
    return sections;
  }, [dynamicParams, parsedTestData, tests]);

  // Safe formula evaluator: builds a scope of field values by name, then evaluates the expression
  const evaluateFormula = useCallback((formula: string, currentValues: Record<string, string>): number | null => {
    if (!formula) return null;
    try {
      // Build a name→value map from all dynamicParams
      const scope: Record<string, number> = {};
      for (const param of dynamicParams) {
        const raw = currentValues[param.id];
        if (raw !== undefined && raw !== '') {
          const num = parseFloat(raw);
          if (!isNaN(num)) {
            scope[param.name] = num;
            // Also add alias without parenthetical suffix, e.g. "HCT (PCV)" → "HCT"
            const baseName = param.name.replace(/\s*\(.*\)\s*$/, '').trim();
            if (baseName && baseName !== param.name && !(baseName in scope)) {
              scope[baseName] = num;
            }
          }
        }
      }

      // Replace field names in formula with their numeric values
      // Sort by name length descending to avoid partial replacement
      const sortedNames = Object.keys(scope).sort((a, b) => b.length - a.length);
      let expression = formula;
      for (const name of sortedNames) {
        // Escape special regex chars in the name and replace
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        expression = expression.replace(new RegExp(escaped, 'g'), String(scope[name]));
      }

      // Only allow safe characters: digits, operators, parens, dots, spaces
      if (!/^[\d\s+\-*/().]+$/.test(expression)) {
        return null;
      }

      // Evaluate using Function (safe since we've sanitized the expression)
      const result = new Function(`"use strict"; return (${expression});`)();
      if (typeof result === 'number' && isFinite(result)) {
        return Math.round(result * 100) / 100; // Round to 2 decimal places
      }
      return null;
    } catch {
      return null;
    }
  }, [dynamicParams]);

  // Patient & Doctor state
  const [patient, setPatient] = useState<Patient | null>(initialData?.patient || null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isSelfReport, setIsSelfReport] = useState(true);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [isCustomDoctor, setIsCustomDoctor] = useState(false);
  const [customDoctorName, setCustomDoctorName] = useState("");
  const doctorSearchRef = useRef<HTMLDivElement>(null);
  const doctorSearchInputRef = useRef<HTMLInputElement>(null);
  const [activeDoctorIndex, setActiveDoctorIndex] = useState(0);

  // Test search and selection state
  const [testSearch, setTestSearch] = useState("");
  const [showTestDropdown, setShowTestDropdown] = useState(false);
  const [activeTestIndex, setActiveTestIndex] = useState(0);
  const testSearchRef = useRef<HTMLDivElement>(null);

  // Test parameters state
  const [testName, setTestName] = useState(initialData?.testName || "Complete Blood Count (CBC)");
  const [reportAmount, setReportAmount] = useState(initialData?.reportAmount || 0);

  // Initialize billing from initialData if creating a new report entry
  useEffect(() => {
    if (initialData?.reportAmount && !reportId) {
      loadFromReport({ base_amount: initialData.reportAmount, report_amount: initialData.reportAmount });
    }
    return () => {
      resetBilling();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [values, setValues] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, "low" | "high" | "normal" | "critical" | "empty">>({});
  const [technicianNotes, setTechnicianNotes] = useState("");

  // AI Interpretation state
  const [aiInterpretation, setAiInterpretation] = useState<{
    summary: string;
    keyFindings: string;
    clinicalIndications: string;
    recommendation: string;
  } | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiResult, setShowAiResult] = useState(true);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [reportStatus, setReportStatus] = useState<string>("draft");
  const [isEditable, setIsEditable] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showNotesSection, setShowNotesSection] = useState(false);
  const [showAiSection, setShowAiSection] = useState(false);
  const [activeTextareaId, setActiveTextareaId] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>({});

  // Fetch report data when reportId is provided
  useEffect(() => {
    if (reportId) {
      setLoadingReport(true);
      fetchReportById(reportId).finally(() => setLoadingReport(false));
    }
  }, [reportId, fetchReportById]);

  // Fetch tests list on mount for looking up test IDs
  useEffect(() => {
    if (currentBranchId) {
      fetchTests(currentBranchId);
    }
  }, [fetchTests, currentBranchId]);

  // Fetch test fields when report loads (use testIds from test_data, or look up by name)
  useEffect(() => {
    if (!selectedReport) return;

    const testIds = parsedTestData?.testIds;
    if (testIds && testIds.length > 1) {
      // Fetch fields for all selected tests
      fetchTestFieldsMulti(testIds);
    } else if (testIds && testIds.length === 1) {
      fetchTestFields(testIds[0]);
    } else if (selectedReport.report_type && tests.length > 0) {
      // Fallback: look up tests by name
      const testNames = selectedReport.report_type.split(',').map(n => n.trim());
      const matchedIds = tests
        .filter(t => testNames.includes(t.test_name))
        .map(t => t.id);
      if (matchedIds.length > 1) {
        fetchTestFieldsMulti(matchedIds);
      } else if (matchedIds.length === 1) {
        fetchTestFields(matchedIds[0]);
      }
    }
  }, [selectedReport, parsedTestData, tests, fetchTestFields, fetchTestFieldsMulti, currentBranchId]);

  // Track whether we've already populated values from the report (to avoid overwriting user input)
  const hasPopulatedValues = useRef(false);
  // Track whether billing has been loaded from the report (to avoid overwriting user's discount changes)
  const hasBillingLoaded = useRef(false);
  const originalSnapshotRef = useRef<ReportTestPriceSnapshot[]>([]);

  // Reset the populated flag and form state when reportId changes (navigating to a different report)
  useEffect(() => {
    hasPopulatedValues.current = false;
    hasBillingLoaded.current = false;
    originalSnapshotRef.current = [];
    setSelectedReport(null); // Clear stale report data before fetching new one
    setValues({});
    setStatuses({});
    setTechnicianNotes('');
    setLastSaved(null);
    setReportStatus('draft');
    resetBilling();
    useTestStore.setState({ testFields: [] }); // Clear stale fields in the store to avoid race conditions
  }, [reportId]);

  // Populate form data when selectedReport changes
  useEffect(() => {
    if (selectedReport && reportId && selectedReport.id === reportId) {
      // Set patient data
      if (selectedReport.patient_name) {
        setPatient({
          id: selectedReport.patient_id,
          name: selectedReport.patient_name || '',
          phone: selectedReport.patient_phone || '',
          gender: selectedReport.patient_gender || '',
          age: selectedReport.patient_age,
          age_unit: normalizeAgeUnit(selectedReport.patient_age_unit),
          address: '',
          branch_id: '',
          created_by: '',
          created_at: '',
          updated_at: '',
        });
      }

      // Set report status
      setReportStatus(selectedReport.status);
      setIsEditable(true);

      // Set test name and amount
      if (selectedReport.report_type) setTestName(selectedReport.report_type);
      if (selectedReport.report_amount) setReportAmount(selectedReport.report_amount);
      if (selectedReport.clinical_notes) setTechnicianNotes(selectedReport.clinical_notes);

      // Set doctor selection
      if (selectedReport.doctor_id) {
        setIsSelfReport(false);
        setIsCustomDoctor(false);
        const doctor = doctors.find(d => d.id === selectedReport.doctor_id);
        if (doctor) {
          setSelectedDoctor(doctor);
          setDoctorSearch(`${doctor.title || 'Dr'}. ${doctor.name}`);
        }
      } else if (selectedReport.referring_doctor_name) {
        setIsSelfReport(false);
        setIsCustomDoctor(true);
        setSelectedDoctor(null);
        setCustomDoctorName(selectedReport.referring_doctor_name);
        setDoctorSearch(selectedReport.referring_doctor_name);
      } else {
        setIsSelfReport(selectedReport.is_self_report ?? true);
        setIsCustomDoctor(false);
        setSelectedDoctor(null);
        setCustomDoctorName("");
        setDoctorSearch("");
      }

      // Load billing data from the report ONCE (avoid overwriting user's discount changes)
      if (!hasBillingLoaded.current) {
        loadFromReport(selectedReport);
        hasBillingLoaded.current = true;
        originalSnapshotRef.current = selectedReport.pricing_snapshot || [];
      }
    }
  }, [selectedReport, reportId, doctors, loadFromReport]);

  // Populate test values from report's test_data ONCE when dynamic params arrive
  useEffect(() => {
    if (hasPopulatedValues.current) return;
    if (!selectedReport || dynamicParams.length === 0) return;
    // Guard: only populate when selectedReport matches the current URL reportId
    if (selectedReport.id !== reportId) return;

    const existingValues: Record<string, string> = {};

    // Initialize select fields with default values first
    dynamicParams.forEach((param) => {
      if (param.input_type === 'select') {
        const defaultValue = param.options ? param.options.split(',')[0].trim() : "Negative";
        existingValues[param.id] = defaultValue;
      }
    });

    // Collect all saved parameters — support both grouped (tests[]) and legacy flat (parameters[])
    const allSavedParams: { name: string; value: string | number | null }[] = [];
    const testData = parsedTestData;
    if (testData?.tests?.length) {
      for (const group of testData.tests) {
        for (const p of group.parameters) {
          allSavedParams.push(p);
        }
      }
    } else if (testData?.parameters?.length) {
      for (const p of testData.parameters) {
        allSavedParams.push(p);
      }
    }

    allSavedParams.forEach((param) => {
      const matchedParam = dynamicParams.find(p => p.name === param.name);
      // Only populate fields that have actual values (skip null/undefined/empty)
      if (matchedParam && param.value != null && param.value !== '') {
        existingValues[matchedParam.id] = param.value.toString();
      }
    });

    // Set values (this includes the initialized select fields, so status computation runs correctly)
    setValues(existingValues);
    hasPopulatedValues.current = true;
  }, [selectedReport, parsedTestData, dynamicParams, reportId]);

  // Fetch doctors on mount
  useEffect(() => {
    fetchDoctors(currentBranchId ? { branch_id: currentBranchId } : undefined);
  }, [fetchDoctors, currentBranchId]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (doctorSearchRef.current && !doctorSearchRef.current.contains(event.target as Node)) {
        setShowDoctorDropdown(false);
      }
      if (testSearchRef.current && !testSearchRef.current.contains(event.target as Node)) {
        setShowTestDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter doctors based on search
  const filteredDoctors = useMemo(() => {
    if (!doctorSearch) return doctors.slice(0, 10);
    const searchLower = doctorSearch.toLowerCase();
    return doctors.filter((d) => {
      const fullName = `${d.title || 'Dr'}. ${d.name}`.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        (d.phone || '').toLowerCase().includes(searchLower) ||
        (d.specialization || '').toLowerCase().includes(searchLower)
      );
    }).slice(0, 10);
  }, [doctors, doctorSearch]);

  useEffect(() => {
    if (!showDoctorDropdown || filteredDoctors.length === 0) {
      setActiveDoctorIndex(0);
      return;
    }
    setActiveDoctorIndex((currentIndex) => Math.min(currentIndex, filteredDoctors.length - 1));
  }, [filteredDoctors, showDoctorDropdown]);

  // Helper to re-resolve prices for standalone tests while preserving existing package pricing snapshots
  const resolvePricingForTestIds = async (newTestIds: string[], overrideDoctorId?: string | null) => {
    if (!selectedReport) return { amount: 0, snapshot: [] };

    // Get original snapshot
    const origSnapshot = originalSnapshotRef.current;

    // Identify which test IDs are standalone (either not in original snapshot, or in original snapshot as standalone)
    const standaloneTestIds = newTestIds.filter(tid => {
      // Find if this test was standalone in the original snapshot
      const wasInOrig = origSnapshot.some(item => item.test_id === tid);
      const wasStandaloneInOrig = origSnapshot.some(item => item.test_id === tid && !item.package_id);
      return !wasInOrig || wasStandaloneInOrig;
    });

    let resolvedSnapshot: ReportTestPriceSnapshot[] = [];
    let standaloneAmount = 0;

    const resolvedDoctorId = overrideDoctorId !== undefined ? overrideDoctorId : (selectedDoctor?.id || null);

    if (standaloneTestIds.length > 0) {
      try {
        const res = await pricingEngineApi.resolve({
          testIds: standaloneTestIds,
          branchId: selectedReport.branch_id,
          doctorId: resolvedDoctorId,
          reportPriceListId: selectedReport.price_list_id || null,
        });
        if (res) {
          resolvedSnapshot = Object.entries(res).map(([testId, item]) => {
            const t = tests.find(x => x.id === testId);
            return {
              ...item,
              test_id: testId,
              package_id: null,
              test_name: t?.test_name || item.test_name,
              test_code: t?.test_code || item.test_code,
              test_category: t?.category || item.test_category,
            };
          });
          standaloneAmount = resolvedSnapshot.reduce((sum, item) => sum + (Number(item.applied_price) || 0), 0);
        }
      } catch (e) {
        console.error("Failed to resolve pricing for standalone tests:", e);
        // Fallback using master test prices
        standaloneAmount = standaloneTestIds.reduce((sum, tid) => {
          const t = tests.find(x => x.id === tid);
          return sum + (Number(t?.price) || 0);
        }, 0);
      }
    }

    // Keep all package items from the original snapshot
    const packageItems = origSnapshot.filter(item => item.package_id);
    const packageAmount = packageItems.reduce((sum, item) => sum + (Number(item.applied_price) || 0), 0);

    // Combine packages and standalone resolved tests
    const finalSnapshot = [...packageItems, ...resolvedSnapshot];
    const totalAmount = packageAmount + standaloneAmount;

    return {
      amount: totalAmount,
      snapshot: finalSnapshot
    };
  };

  // Handle doctor selection
  const handleSelectDoctor = async (doctor: Doctor | null) => {
    if (!selectedReport) return;

    let nextDoctorId: string | null = null;
    if (doctor) {
      setSelectedDoctor(doctor);
      setIsSelfReport(false);
      setIsCustomDoctor(false);
      setDoctorSearch(`${doctor.title || 'Dr'}. ${doctor.name}`);
      nextDoctorId = doctor.id;
    } else {
      // Self selected
      setSelectedDoctor(null);
      setIsSelfReport(true);
      setIsCustomDoctor(false);
      setDoctorSearch("");
    }
    setShowDoctorDropdown(false);
    setActiveDoctorIndex(0);

    // Re-resolve pricing for all tests based on new doctor selection
    const currentTestIds = parsedTestData?.testIds || [];
    if (currentTestIds.length > 0) {
      const { amount: newAmount, snapshot: resolvedSnapshot } = await resolvePricingForTestIds(currentTestIds, nextDoctorId);
      
      if (resolvedSnapshot.length > 0) {
        const updatedReport = {
          ...selectedReport,
          doctor_id: nextDoctorId || undefined,
          referring_doctor_name: undefined,
          report_amount: newAmount,
          pricing_snapshot: resolvedSnapshot,
        };
        setSelectedReport(updatedReport);
        setReportAmount(newAmount);
        setBaseAmount(newAmount);
      }
    }
  };

  const handleCreateCustomDoctor = async (name: string) => {
    if (!selectedReport) return;

    setIsCustomDoctor(true);
    setSelectedDoctor(null);
    setIsSelfReport(false);
    const capitalizedName = name.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    setCustomDoctorName(capitalizedName);
    setDoctorSearch(capitalizedName);
    setShowDoctorDropdown(false);
    setActiveDoctorIndex(0);

    // Re-resolve pricing with doctorId = null (default pricing)
    const currentTestIds = parsedTestData?.testIds || [];
    if (currentTestIds.length > 0) {
      const { amount: newAmount, snapshot: resolvedSnapshot } = await resolvePricingForTestIds(currentTestIds, null);
      
      if (resolvedSnapshot.length > 0) {
        const updatedReport = {
          ...selectedReport,
          doctor_id: undefined,
          referring_doctor_name: capitalizedName,
          report_amount: newAmount,
          pricing_snapshot: resolvedSnapshot,
        };
        setSelectedReport(updatedReport);
        setReportAmount(newAmount);
        setBaseAmount(newAmount);
      }
    }
  };

  const handleDoctorSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!showDoctorDropdown) {
        setShowDoctorDropdown(true);
        return;
      }
      if (filteredDoctors.length > 0) {
        setActiveDoctorIndex((currentIndex) => (currentIndex + 1) % filteredDoctors.length);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!showDoctorDropdown) {
        setShowDoctorDropdown(true);
        return;
      }
      if (filteredDoctors.length > 0) {
        setActiveDoctorIndex((currentIndex) =>
          currentIndex === 0 ? filteredDoctors.length - 1 : currentIndex - 1
        );
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (filteredDoctors.length > 0) {
        const doctorToSelect = filteredDoctors[activeDoctorIndex] ?? filteredDoctors[0];
        if (doctorToSelect) {
          handleSelectDoctor(doctorToSelect);
        }
        return;
      }

      if (doctorSearch.trim()) {
        handleCreateCustomDoctor(doctorSearch);
      }
      return;
    }

    if (event.key === 'Escape') {
      setShowDoctorDropdown(false);
    }
  };

  // Filter tests based on search
  const filteredTests = useMemo(() => {
    const selectedTestIds = parsedTestData?.testIds || [];
    const unselected = tests.filter(t => !selectedTestIds.includes(t.id));
    if (!testSearch.trim()) {
      return unselected.slice(0, 15);
    }
    return smartSearchFilter(unselected, testSearch, [
      { field: t => t.test_name, weight: 1.0 },
      { field: t => t.category, weight: 0.6 }
    ]).slice(0, 15);
  }, [tests, parsedTestData, testSearch]);

  const handleAddTest = async (test: Test) => {
    if (!selectedReport) return;

    const currentTestIds = parsedTestData?.testIds || [];
    if (currentTestIds.includes(test.id)) return;

    const newTestIds = [...currentTestIds, test.id];
    
    // Find all test names for these testIds
    const matchedTests = newTestIds.map(id => tests.find(t => t.id === id)).filter(Boolean) as Test[];
    const newReportType = matchedTests.map(t => t.test_name).join(', ');

    const { amount: newAmount, snapshot: resolvedSnapshot } = await resolvePricingForTestIds(newTestIds);

    const updatedTestData = {
      ...parsedTestData,
      testIds: newTestIds,
      testName: newReportType,
      testType: matchedTests.map(t => t.category || 'General').join(', '),
    };

    const updatedReport = {
      ...selectedReport,
      report_type: newReportType,
      report_amount: newAmount,
      test_data: updatedTestData,
      pricing_snapshot: resolvedSnapshot.length > 0 ? resolvedSnapshot : selectedReport.pricing_snapshot,
    };

    setSelectedReport(updatedReport);
    setTestName(newReportType);
    setReportAmount(newAmount);
    setBaseAmount(newAmount);
    setTestSearch("");
    setShowTestDropdown(false);
    setActiveTestIndex(0);
    setReportStatus("draft");
  };

  const handleRemoveTest = async (testId: string) => {
    if (!selectedReport) return;

    const currentTestIds = parsedTestData?.testIds || [];
    const newTestIds = currentTestIds.filter(id => id !== testId);
    if (newTestIds.length === 0) {
      toast.error("A report must have at least one test.");
      return;
    }

    const matchedTests = newTestIds.map(id => tests.find(t => t.id === id)).filter(Boolean) as Test[];
    const newReportType = matchedTests.map(t => t.test_name).join(', ');

    const { amount: newAmount, snapshot: resolvedSnapshot } = await resolvePricingForTestIds(newTestIds);

    const updatedTestData = {
      ...parsedTestData,
      testIds: newTestIds,
      testName: newReportType,
      testType: matchedTests.map(t => t.category || 'General').join(', '),
    };

    const updatedReport = {
      ...selectedReport,
      report_type: newReportType,
      report_amount: newAmount,
      test_data: updatedTestData,
      pricing_snapshot: resolvedSnapshot.length > 0 ? resolvedSnapshot : selectedReport.pricing_snapshot,
    };

    setSelectedReport(updatedReport);
    setTestName(newReportType);
    setReportAmount(newAmount);
    setBaseAmount(newAmount);
    setReportStatus("draft");
  };

  const handleTestSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!showTestDropdown) {
        setShowTestDropdown(true);
        return;
      }
      if (filteredTests.length > 0) {
        setActiveTestIndex((currentIndex) => (currentIndex + 1) % filteredTests.length);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!showTestDropdown) {
        setShowTestDropdown(true);
        return;
      }
      if (filteredTests.length > 0) {
        setActiveTestIndex((currentIndex) =>
          currentIndex === 0 ? filteredTests.length - 1 : currentIndex - 1
        );
      }
      return;
    }

    if (event.key === 'Enter') {
      if (filteredTests.length > 0) {
        event.preventDefault();
        const testToSelect = filteredTests[activeTestIndex] ?? filteredTests[0];
        if (testToSelect) {
          handleAddTest(testToSelect);
        }
      }
      return;
    }

    if (event.key === 'Escape') {
      setShowTestDropdown(false);
    }
  };

  const handleValueChange = (id: string, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [id]: value };

      // Auto-calculate derived fields whose dependencies may have changed
      const changedParam = dynamicParams.find(p => p.id === id);
      if (changedParam) {
        const calculatedFields = dynamicParams.filter(p => p.field_type === 'calculated' && p.formula);
        for (const calc of calculatedFields) {
          // Check if the changed field is one of this calculated field's dependencies
          let dependsOnNames: string[] = [];
          try {
            dependsOnNames = calc.depends_on ? JSON.parse(calc.depends_on) : [];
          } catch {
            // If depends_on isn't valid JSON, try to detect from formula
            dependsOnNames = dynamicParams
              .filter(p => p.field_type !== 'calculated' && calc.formula.includes(p.name))
              .map(p => p.name);
          }

          if (dependsOnNames.includes(changedParam.name) || dependsOnNames.length === 0) {
            const result = evaluateFormula(calc.formula, next);
            if (result !== null) {
              next[calc.id] = result.toString();
            }
          }
        }
      }

      return next;
    });
    setReportStatus("draft");
  };

  useEffect(() => {
    const newStatuses: Record<string, "low" | "high" | "normal" | "critical" | "empty"> = {};

    dynamicParams.forEach((param) => {
      const valStr = values[param.id];
      if (!valStr || valStr === "") {
        newStatuses[param.id] = "empty";
        return;
      }

      // Qualitative Select (Case 1)
      if (param.input_type === 'select') {
        if (valStr && valStr.toLowerCase() === 'positive') {
          newStatuses[param.id] = "critical";
        } else {
          newStatuses[param.id] = "normal";
        }
        return;
      }

      // Text fields don't have numeric ranges — any non-empty value is "normal"
      if (param.input_type === 'text') {
        newStatuses[param.id] = "normal";
        return;
      }

      const val = parseFloat(valStr);
      if (isNaN(val)) {
        newStatuses[param.id] = "empty";
        return;
      }

      // Resolve reference range for the patient
      const range = getPatientReferenceRange(param, patient);

      // Check critical thresholds first
      if (range.criticalLow != null && val <= range.criticalLow) {
        newStatuses[param.id] = "critical";
      } else if (range.criticalHigh != null && val >= range.criticalHigh) {
        newStatuses[param.id] = "critical";
      } else if (range.low != null && val < range.low) {
        newStatuses[param.id] = "low";
      } else if (range.high != null && val > range.high) {
        newStatuses[param.id] = "high";
      } else {
        newStatuses[param.id] = "normal";
      }
    });

    setStatuses(newStatuses);
  }, [values, dynamicParams, patient]);

  const getStatusBadge = (
    status: "low" | "high" | "normal" | "critical" | "empty" | undefined,
  ) => {
    const styles = {
      low: {
        bg: "var(--info)",
        text: "var(--info-foreground)",
      },
      high: {
        bg: "var(--destructive)",
        text: "var(--destructive-foreground)",
      },
      critical: {
        bg: "#c62828",
        text: "#ffffff",
      },
      normal: {
        bg: "var(--success)",
        text: "var(--success-foreground)",
      },
    };

    if (!status || status === "empty") {
      return (
        <span className="text-muted-foreground text-xs">-</span>
      );
    }

    const style = styles[status];
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium ${status === 'critical' ? 'animate-pulse font-bold' : ''}`}
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {status}
      </span>
    );
  };

  const getInputClass = (
    status: "low" | "high" | "normal" | "critical" | "empty" | undefined,
  ) => {
    const base =
      "w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 transition-colors text-right tabular-nums";

    if (status === "low") {
      return `${base} border-info bg-info/5 text-foreground focus:border-info focus:ring-info`;
    } else if (status === "high") {
      return `${base} border-destructive bg-destructive/5 text-foreground focus:border-destructive focus:ring-destructive`;
    } else if (status === "critical") {
      return `${base} border-red-600 bg-red-500/10 text-red-700 dark:text-red-400 font-bold focus:border-red-600 focus:ring-red-600`;
    } else if (status === "normal") {
      return `${base} border-success bg-success/5 text-foreground focus:border-success focus:ring-success`;
    } else {
      return `${base} border-border focus:border-primary focus:ring-primary`;
    }
  };

  const abnormalCount = Object.values(statuses).filter(
    (s) => s === "low" || s === "high" || s === "critical",
  ).length;

  const requiredParams = useMemo(() => {
    const nonCalculated = dynamicParams.filter((param) => param.field_type !== 'calculated' && param.is_mandatory !== false);
    return nonCalculated.length > 0 ? nonCalculated : dynamicParams;
  }, [dynamicParams]);

  const allRequiredFilled = true;

  const sectionCompletion = useMemo(() => {
    const progress: Record<string, { filled: number; total: number; done: boolean }> = {};

    for (const section of testSections) {
      const completableParams = section.params.filter((param) => param.field_type !== 'calculated' && param.is_mandatory !== false);
      const sourceParams = completableParams.length > 0 ? completableParams : section.params;
      const filled = sourceParams.filter((param) => {
        const value = values[param.id];
        return value !== undefined && value !== null && String(value).trim() !== '';
      }).length;

      progress[section.testId] = {
        filled,
        total: sourceParams.length,
        done: sourceParams.length > 0 && filled === sourceParams.length,
      };
    }

    return progress;
  }, [testSections, values]);

  const totalParameterCount = useMemo(
    () => Object.values(sectionCompletion).reduce((sum, section) => sum + section.total, 0),
    [sectionCompletion]
  );

  const hasQuickNavigation = testSections.length > 1;
  const tableHeaderStickyTopClass = hasQuickNavigation ? 'top-[6.6rem]' : 'top-[3.8rem]';

  const sectionLayoutKey = useMemo(
    () => `${totalParameterCount <= 40 ? 'expand-all' : 'guided'}:${testSections.map((section) => section.testId).join('|')}`,
    [totalParameterCount, testSections]
  );

  useEffect(() => {
    if (testSections.length === 0) {
      setExpandedSections({});
      return;
    }

    const expandAll = totalParameterCount <= 40;
    setExpandedSections(() => {
      const next: Record<string, boolean> = {};
      testSections.forEach((section, index) => {
        next[section.testId] = expandAll || index === 0;
      });
      return next;
    });
  }, [sectionLayoutKey, testSections, totalParameterCount]);

  const editableFieldOrder = useMemo(
    () => testSections.flatMap((section) =>
      section.params
        .filter((param) => param.field_type !== 'calculated')
        .map((param) => param.id)
    ),
    [testSections]
  );

  const fieldTabOrder = useMemo(() => {
    const map: Record<string, number> = {};
    editableFieldOrder.forEach((fieldId, index) => {
      map[fieldId] = index + 1;
    });
    return map;
  }, [editableFieldOrder]);

  const fieldSectionMap = useMemo(() => {
    const map: Record<string, string> = {};
    testSections.forEach((section) => {
      section.params.forEach((param) => {
        map[param.id] = section.testId;
      });
    });
    return map;
  }, [testSections]);

  const focusParameterField = useCallback((fieldId: string) => {
    const sectionId = fieldSectionMap[fieldId];

    if (sectionId && !expandedSections[sectionId]) {
      setExpandedSections((prev) => ({ ...prev, [sectionId]: true }));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const input = inputRefs.current[fieldId];
          input?.focus();
          if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
            input.select();
          }
          input?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
      });
      return;
    }

    const input = inputRefs.current[fieldId];
    input?.focus();
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      input.select();
    }
    input?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [expandedSections, fieldSectionMap]);

  const moveParameterFocus = useCallback((fieldId: string, direction: 1 | -1) => {
    const currentIndex = editableFieldOrder.indexOf(fieldId);
    if (currentIndex === -1) return;

    const nextFieldId = editableFieldOrder[currentIndex + direction];
    if (!nextFieldId) return;

    focusParameterField(nextFieldId);
  }, [editableFieldOrder, focusParameterField]);

  const handleParameterKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, fieldId: string, inputType: string) => {
    if (inputType === 'textarea') {
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      moveParameterFocus(fieldId, event.shiftKey ? -1 : 1);
      return;
    }

    if (inputType === 'select') {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveParameterFocus(fieldId, 1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveParameterFocus(fieldId, -1);
      return;
    }

    if (inputType !== 'text' && event.key === 'ArrowRight') {
      event.preventDefault();
      moveParameterFocus(fieldId, 1);
      return;
    }

    if (inputType !== 'text' && event.key === 'ArrowLeft') {
      event.preventDefault();
      moveParameterFocus(fieldId, -1);
    }
  }, [moveParameterFocus]);

  const handleScrollToSection = useCallback((testId: string) => {
    setExpandedSections((prev) => ({ ...prev, [testId]: true }));
    requestAnimationFrame(() => {
      sectionRefs.current[testId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const toggleSection = useCallback((testId: string) => {
    setExpandedSections((prev) => ({ ...prev, [testId]: !prev[testId] }));
  }, []);

  // Build test_data object for saving — grouped by test
  const buildTestData = () => {
    const testIds = selectedReport?.test_data?.testIds;

    // Build grouped structure: each test gets its own parameter list
    const groupedTests = testSections.map(section => ({
      testId: section.testId,
      testName: section.testName,
      parameters: section.params.map(param => {
        const localStatus = statuses[param.id];
        const mappedStatus = localStatus === 'empty' ? undefined : localStatus as 'normal' | 'high' | 'low' | 'critical' | undefined;
        const rawValue = values[param.id];
        
        // If select type, default to first option if not entered
        // If select type, default to Negative if not entered
        const finalRawValue = (rawValue === undefined || rawValue === '') && param.input_type === 'select'
          ? (param.options ? param.options.split(',')[0].trim() : 'Negative')
          : rawValue;

        const value = finalRawValue !== undefined && finalRawValue !== ''
          ? ((param.input_type === 'text' || param.input_type === 'select' || param.input_type === 'textarea') ? finalRawValue : parseFloat(finalRawValue))
          : null;

        const resolvedRange = getPatientReferenceRange(param, patient);

        return {
          name: param.name,
          value,
          unit: param.unit,
          referenceRange: formatReferenceRange(resolvedRange),
          status: mappedStatus,
          fieldType: param.field_type,
          group: param.section_group || undefined,
        };
      }),
    }));

    // Also build flat parameters list for backward compatibility
    const allParameters = groupedTests.flatMap(g => g.parameters);

    return {
      testName,
      testType: selectedReport?.test_data?.testType || 'General',
      testIds,
      tests: groupedTests,
      parameters: allParameters,
      remarks: technicianNotes
    };
  };

  const saveCurrentReportData = async () => {
    if (!reportId) {
      toast.error("No report ID available. Please create a report first.");
      return false;
    }

    const testData = buildTestData();

    if (patient) {
      await updatePatient(patient.id, {
        name: patient.name,
        phone: patient.phone,
        gender: patient.gender,
        age: patient.age,
        age_unit: patient.age != null ? normalizeAgeUnit(patient.age_unit) : undefined,
      });
    }

    const result = await updateReport(reportId, {
      clinical_notes: technicianNotes,
      doctor_id: isCustomDoctor ? null : selectedDoctor?.id,
      referring_doctor_name: isCustomDoctor ? customDoctorName : null,
      is_self_report: isCustomDoctor ? false : isSelfReport,
      test_data: testData,
      report_type: testName,
      report_amount: reportAmount,
      base_amount: baseAmount,
      final_amount: reportAmount,
      pricing_items: selectedReport?.pricing_snapshot || [],
    });

    if (!result) {
      toast.error(reportError || "Failed to save report data. Please try again.");
      return false;
    }

    await saveBilling(reportId);
    setLastSaved(new Date());
    return true;
  };

  // Save draft functionality - saves to backend
  const handleSaveDraft = async () => {
    if (!reportId) {
      toast.error("No report ID available. Please create a report first.");
      return;
    }

    if (!isEditable) {
      toast.error("This report is no longer editable.");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveCurrentReportData();
      if (saved) {
        navigate('/reports');
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Submit for review - changes status to under_review
  const handleSubmitForReview = async () => {
    if (!reportId) {
      toast.error("No report ID available.");
      return;
    }

    if (!allRequiredFilled) {
      toast.error("Please fill all required test values before submitting for review.");
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await saveCurrentReportData();
      if (!saved) {
        setIsSubmitting(false);
        return;
      }

      // Then submit for review
      const submitResult = await submitReport(reportId);

      if (submitResult) {
        const newStatus = submitResult.status || (canAutoApprove ? 'approved' : 'under_review');
        setReportStatus(newStatus);
        setIsEditable(false);
        toast.success(canAutoApprove ? "Report approved successfully!" : "Report submitted for review successfully!");
        navigate('/reports');
      } else {
        toast.error(reportError || "Failed to submit report for review.");
      }
    } catch (error) {
      console.error("Failed to submit for review:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate AI interpretation
  const handleGenerateInterpretation = async () => {
    if (!reportId) {
      setAiError("Please save the report first before generating interpretation.");
      setShowAiSection(true);
      return;
    }

    // Check if there are filled values
    const filledValues = Object.values(values).filter(v => v !== undefined && v !== '');
    if (filledValues.length === 0) {
      setAiError("Please enter test values before generating interpretation.");
      setShowAiSection(true);
      return;
    }

    // Save current data first so backend has latest values
    setIsGeneratingAI(true);
    setAiError(null);
    try {
      const testData = buildTestData();
      await updateReport(reportId, {
        clinical_notes: technicianNotes,
        doctor_id: isCustomDoctor ? null : selectedDoctor?.id,
        referring_doctor_name: isCustomDoctor ? customDoctorName : null,
        is_self_report: isCustomDoctor ? false : isSelfReport,
        test_data: testData,
        report_type: testName,
        report_amount: reportAmount,
      });

      const response = await reportApi.generateInterpretation(reportId);
      if (response.data) {
        setAiInterpretation(response.data);
        setShowAiSection(true);
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to generate interpretation. Please try again.");
      setShowAiSection(true);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditable) handleSaveDraft();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isEditable) handleSubmitForReview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportId, values, selectedDoctor, isSelfReport, isEditable]);

  // Preview report (navigate to preview page)
  const handlePreview = async () => {
    if (!patient) {
      toast.error("No patient data available.");
      return;
    }

    if (!allRequiredFilled) {
      toast.error("Please fill all required test values before preview.");
      return;
    }

    if (reportId) {
      try {
        const saved = await saveCurrentReportData();
        if (!saved) return;
      } catch (error) {
        console.error("Failed to save before preview:", error);
        toast.error("Failed to save before preview. Please try again.");
        return;
      }
    }

    const parameters = dynamicParams.map(p => {
      const resolvedRange = getPatientReferenceRange(p, patient);
      const isAbnormal = statuses[p.id] === 'low' || statuses[p.id] === 'high' || statuses[p.id] === 'critical';
      return {
        name: p.name,
        result: values[p.id] || '',
        unit: p.unit,
        refRange: formatReferenceRange(resolvedRange),
        isAbnormal,
        status: statuses[p.id] || 'empty'
      };
    });

    // Calculate age from date of birth
    const calculateAge = (dob: string | undefined) => {
      if (!dob) return 0;
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const reportData = {
      lab: {
        name: 'DiagnoPro Diagnostics',
        address: '123 Healthcare Avenue, Medical District',
        city: 'New York, NY 10001',
        phone: '+1 (555) 123-4567',
        email: 'lab@DiagnoPro.com',
        license: 'LAB-NY-2024-001234',
      },
      report: {
        id: reportId || `REP-${Date.now()}`,
        date: format(new Date(), "MMMM d, yyyy"),
        time: format(new Date(), "hh:mm a"),
        status: reportStatus,
      },
      patient: {
        name: patient.name,
        id: patient.id.slice(0, 8),
        age: formatAge(patient.age, patient.age_unit) || 'N/A',
 gender: patient.gender || 'Unknown',
        referringDoctor: isSelfReport 
          ? 'Self' 
          : isCustomDoctor 
            ? (customDoctorName.toLowerCase().startsWith('dr') ? customDoctorName : `Dr. ${customDoctorName}`)
            : `${selectedDoctor?.title || 'Dr'}. ${selectedDoctor?.name}`,
        sampleId: `SMP-${Date.now()}`,
        collectionDate: format(new Date(), "MMMM d, yyyy"),
        collectionTime: format(new Date(), "hh:mm a"),
        reportedDate: format(new Date(), "MMMM d, yyyy"),
      },
      test: {
        name: testName,
        category: selectedReport?.test_data?.testType || "General"
      },
      parameters,
      technician: {
        name: 'Lab Technician',
        signature: 'L. Tech',
      },
      pathologist: {
        name: 'Dr. Pathologist',
        title: 'Consultant Pathologist',
        license: 'MD-NY-45678',
        signature: 'Pathologist',
      },
    };

    navigate(`/reports/preview/${reportId || patient.id}`, {
      state: { reportData }
    });
  };

  // Loading state
  if (loadingReport) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading report...</span>
      </div>
    );
  }
  return (
    <div className="space-y-2 w-full px-2 sm:px-3 pb-3">
      {/* Non-editable warning banner */}
      {!isEditable && (
        <div className="bg-warning/10 border border-warning/20 rounded p-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-warning" />
          <span className="text-sm text-warning">
            This report is in <strong>{reportStatus}</strong> status and cannot be edited.
            {reportStatus === 'under_review' && ' It is awaiting approval from a doctor.'}
            {reportStatus === 'approved' && ' The report has been approved and finalized.'}
          </span>
        </div>
      )}

      {/* Rejection reason banner */}
      {reportStatus === 'rejected' && selectedReport?.rejection_reason && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
          <div>
            <span className="text-sm font-medium text-destructive">Report Rejected</span>
            <p className="text-sm text-destructive/80 mt-1">{selectedReport.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* Header / Actions */}
      <div className="sticky top-12 z-30 bg-background/95 backdrop-blur py-1.5 border-b border-border/70 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-foreground text-base leading-none mb-0.5 truncate">
              Report Entry
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground leading-none">
              <span className="tabular-nums">
                {reportId ? `#${reportId.slice(0, 8)}` : '#NEW'}
              </span>
              <span className="w-1 h-1 bg-border rounded-full"></span>
              <span
                className="flex items-center gap-1"
                style={{
                  color: reportStatus === "draft" ? "var(--warning)" :
                    reportStatus === "under_review" ? "var(--info)" :
                      reportStatus === "approved" ? "var(--success)" :
                        reportStatus === "rejected" ? "var(--destructive)" : "var(--muted-foreground)"
                }}
              >
                {reportStatus === "draft" && <><Clock className="w-3 h-3" /> Draft</>}
                {reportStatus === "under_review" && <><Clock className="w-3 h-3" /> Under Review</>}
                {reportStatus === "approved" && <><CheckCircle className="w-3 h-3" /> Approved</>}
                {reportStatus === "rejected" && <><AlertCircle className="w-3 h-3" /> Rejected</>}
              </span>
              {abnormalCount > 0 && (
                <>
                  <span className="w-1 h-1 bg-border rounded-full"></span>
                  <span
                    className="flex items-center gap-1"
                    style={{ color: "var(--destructive)" }}
                  >
                    <AlertCircle className="w-3 h-3" />{" "}
                    {abnormalCount} Abnormal
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {isEditable && (
            <>
              {reportId && (
                <button
                  onClick={() => navigate('/reports')}
                  className="h-7 px-2.5 flex items-center gap-1.5 bg-card border border-border rounded hover:bg-accent transition-colors text-[11px]"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveDraft}
                disabled={isSaving || !reportId}
                className="h-7 px-2.5 flex items-center gap-1.5 bg-card border border-border rounded hover:bg-accent transition-colors text-[11px] disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {isEditMode ? 'Update' : 'Save Draft'}
                <span className="text-muted-foreground ml-1">
                  Ctrl+S
                </span>
              </button>

              {reportStatus === 'draft' && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={isSubmitting || !reportId || Object.keys(values).length === 0}
                  className="h-7 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-[11px] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {canAutoApprove ? 'Submit & Approve' : 'Submit for Review'}
                </button>
              )}
            </>
          )}

          {allRequiredFilled && (
            <button
              onClick={handlePreview}
              disabled={!patient}
              className="h-7 px-2.5 flex items-center gap-1.5 bg-success text-white rounded hover:opacity-90 transition-opacity text-[11px] disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              Preview
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="bg-card border border-border rounded px-2.5 py-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground leading-none">
            <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" />{reportId ? `#${reportId.slice(0, 8)}` : '#NEW'}</span>
            <span className="inline-flex items-center gap-1"><Microscope className="w-3 h-3" />{testName}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(), "MMM dd HH:mm")}</span>
            {!isSelfReport && (selectedDoctor?.name || customDoctorName) && (
              <span className="inline-flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                {selectedDoctor ? `Dr. ${selectedDoctor.name}` : (customDoctorName.toLowerCase().startsWith('dr') ? customDoctorName : `Dr. ${customDoctorName}`)}
              </span>
            )}
          </div>

          {patient ? (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(220px,2.1fr)_minmax(110px,0.9fr)_minmax(170px,1.2fr)_minmax(170px,1.2fr)_minmax(240px,1.8fr)] gap-1.5 text-[11px] items-center">
              <div className="flex items-center gap-1.5 min-w-0">
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">Patient</label>
                <input
                  type="text"
                  value={patient.name}
                  onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                  disabled={!isEditable}
                  className="w-full h-8 px-2 border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">Gender</label>
                <select
                  value={patient.gender || ''}
                  onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
                  disabled={!isEditable}
                  className="w-full h-8 px-2 border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">Age</label>
                <div className="grid grid-cols-[minmax(0,1fr)_82px] gap-1 w-full">
                  <input
                    type="number"
                    min={0}
                    max={getAgeMax(patient.age_unit)}
                    value={patient.age ?? ''}
                    onChange={(e) => setPatient({ ...patient, age: e.target.value ? Number(e.target.value) : undefined as any })}
                    disabled={!isEditable}
                    className="w-full h-8 px-2 border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary tabular-nums disabled:opacity-60"
                  />
                  <select
                    value={normalizeAgeUnit(patient.age_unit)}
                    onChange={(e) => setPatient({ ...patient, age_unit: e.target.value as AgeUnit })}
                    disabled={!isEditable}
                    className="w-full h-8 px-2 border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  >
                    <option value="years">Years</option>
                    <option value="months">Months</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">Contact</label>
                <input
                  type="tel"
                  value={patient.phone || ''}
                  onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                  disabled={!isEditable}
                  className="w-full h-8 px-2 border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary tabular-nums disabled:opacity-60"
                />
              </div>
              <div className="flex flex-col gap-1 min-w-0 w-full" ref={doctorSearchRef}>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">Doctor</label>
                </div>
                <div className="relative w-full">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <input
                    ref={doctorSearchInputRef}
                    type="text"
                    placeholder="Search doctor by name or mobile..."
                    className="w-full h-8 pl-7 pr-8 bg-background border border-border rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                    value={doctorSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDoctorSearch(val);
                      setShowDoctorDropdown(true);
                      setActiveDoctorIndex(0);
                      if (isCustomDoctor) {
                        setCustomDoctorName(val);
                      }
                    }}
                    onFocus={() => isEditable && setShowDoctorDropdown(true)}
                    onKeyDown={handleDoctorSearchKeyDown}
                    disabled={!isEditable}
                  />
                  {(selectedDoctor || isCustomDoctor || (doctorSearch && doctorSearch !== "Self (No Doctor)")) && isEditable && (
                    <button
                      type="button"
                      onClick={() => handleSelectDoctor(null)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors focus:outline-none"
                      title="Clear referring doctor"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {showDoctorDropdown && isEditable && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg max-h-56 overflow-y-auto z-50">
                      {/* Option for Self (No Doctor) */}
                      {(!doctorSearch || 'self'.includes(doctorSearch.toLowerCase())) && (
                        <button
                          type="button"
                          onClick={() => handleSelectDoctor(null)}
                          className="w-full px-3 py-2 text-left hover:bg-accent transition-colors border-b border-border text-[11px] text-muted-foreground"
                        >
                          Self (No Doctor)
                        </button>
                      )}
                      {doctorsLoading ? (
                        <div className="px-3 py-3 text-center">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
                        </div>
                      ) : filteredDoctors.length > 0 ? (
                        <>
                          {filteredDoctors.map((doc, index) => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => handleSelectDoctor(doc)}
                              onMouseEnter={() => setActiveDoctorIndex(index)}
                              className={`w-full px-3 py-2 text-left transition-colors border-b border-border last:border-0 text-[11px] ${
                                index === activeDoctorIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                              }`}
                            >
                              <div className="font-medium text-foreground">
                                {doc.title || 'Dr'}. {doc.name}
                              </div>
                              {doc.specialization || doc.phone ? (
                                <div className="text-[9px] text-muted-foreground mt-0.5">
                                  {doc.specialization} {doc.specialization && doc.phone ? '•' : ''} {doc.phone}
                                </div>
                              ) : null}
                            </button>
                          ))}
                          {doctorSearch.trim() && !filteredDoctors.some(d => `${d.title || 'Dr'}. ${d.name}`.toLowerCase() === doctorSearch.toLowerCase().trim()) && (
                            <button
                              type="button"
                              onClick={() => handleCreateCustomDoctor(doctorSearch)}
                              className="w-full px-3 py-2 text-left hover:bg-accent transition-colors border-t border-border flex items-center gap-2 text-primary text-[11px]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="font-medium">
                                Use Custom Doctor: "{doctorSearch}"
                              </span>
                            </button>
                          )}
                        </>
                      ) : (
                        doctorSearch.trim() && (
                          <button
                            type="button"
                            onClick={() => handleCreateCustomDoctor(doctorSearch)}
                            className="w-full px-3 py-3 text-center hover:bg-accent transition-colors flex flex-col items-center gap-1 text-primary text-[11px]"
                          >
                            <Plus className="w-4 h-4" />
                            <div>
                              <div className="font-medium">No doctor found</div>
                              <div className="text-[9px] text-muted-foreground mt-0.5">
                                Click to use custom doctor: "{doctorSearch}"
                              </div>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No patient selected</div>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-2">
          {/* Manage Tests Section */}
          {isEditable && (
            <div className="bg-card border border-border rounded px-2.5 py-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Selected Tests</label>
                <span className="text-[10px] text-muted-foreground">Add or remove tests for this report</span>
              </div>
              
              <div className="flex flex-wrap gap-1.5 items-center">
                {/* Render selected tests as badges */}
                {(parsedTestData?.testIds || []).map((tid: string) => {
                  const masterTest = tests.find(t => t.id === tid);
                  const testDisplayName = masterTest?.test_name || `Test ${tid.slice(0, 8)}`;
                  const testDisplayCode = masterTest?.test_code || '';
                  return (
                    <div 
                      key={tid} 
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded text-xs text-foreground font-medium animate-fade-in"
                    >
                      <span>{testDisplayName}</span>
                      {testDisplayCode && <span className="text-[10px] text-muted-foreground uppercase font-semibold">({testDisplayCode})</span>}
                      <button
                        type="button"
                        onClick={() => handleRemoveTest(tid)}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove test"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Search input to add more tests */}
                <div className="relative flex-1 min-w-[200px]" ref={testSearchRef}>
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={testSearch}
                    onChange={(e) => {
                      setTestSearch(e.target.value);
                      setShowTestDropdown(true);
                    }}
                    onFocus={() => setShowTestDropdown(true)}
                    onKeyDown={handleTestSearchKeyDown}
                    className="w-full h-8 pl-8 pr-3 bg-background border border-border rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Search and add more tests..."
                  />

                  {showTestDropdown && filteredTests.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded shadow-lg max-h-56 overflow-y-auto">
                      {filteredTests.map((test, index) => (
                        <button
                          key={test.id}
                          onClick={() => handleAddTest(test)}
                          className={`w-full px-2.5 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between ${
                            index === activeTestIndex ? 'bg-accent/50' : ''
                          }`}
                        >
                          <div>
                            <div className="text-xs text-foreground font-medium">{test.test_name}</div>
                            <div className="text-[10px] text-muted-foreground">{test.category || 'General'}</div>
                          </div>
                          <div className="text-xs text-primary font-semibold">
                            ₹{test.price}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── TEST PARAMETERS: Full-width primary focus ─── */}
          <div className="space-y-2">
            {/* Last saved indicator */}
            <div className="flex justify-end">
              <span className="text-[10px] text-muted-foreground">
                {lastSaved ? `Last saved: ${format(lastSaved, "HH:mm")}` : 'Not saved yet'}
              </span>
            </div>

            {testSections.length === 0 ? (
              <div className="bg-card border border-border rounded p-8 text-center text-muted-foreground text-xs">
                No test parameters configured. Please configure fields for your tests in Test Management.
              </div>
            ) : (
              <>
                {hasQuickNavigation && (
                  <div className="sticky top-[3.8rem] z-20 bg-background/95 backdrop-blur py-1">
                    <div className="bg-card border border-border rounded px-2 py-1.5 overflow-x-auto">
                      <div className="flex gap-1.5 min-w-max text-[11px] leading-none">
                        {testSections.map((section) => {
                          const completion = sectionCompletion[section.testId] || { filled: 0, total: 0, done: false };
                          return (
                            <button
                              key={section.testId}
                              onClick={() => handleScrollToSection(section.testId)}
                              className={`h-7 px-2.5 rounded border transition-colors whitespace-nowrap ${completion.done
                                ? 'border-success/40 bg-success/10 text-success'
                                : 'border-border bg-background text-foreground hover:bg-accent'
                                }`}
                            >
                              <span className="font-medium">{section.testCode || section.testName}</span>
                              <span className="text-muted-foreground ml-1">({completion.filled}/{completion.total})</span>
                              {completion.done && <span className="ml-1">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {testSections.map((section) => {
                  const completion = sectionCompletion[section.testId] || { filled: 0, total: 0, done: false };
                  const isExpanded = expandedSections[section.testId] ?? true;

                  return (
                    <div
                      key={section.testId}
                      ref={(node) => {
                        sectionRefs.current[section.testId] = node;
                      }}
                      className="bg-card border border-border rounded overflow-hidden scroll-mt-28"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSection(section.testId)}
                        className="w-full px-3 py-2 border-b border-border bg-primary/5 flex items-center gap-2 text-left hover:bg-primary/10 transition-colors"
                        aria-expanded={isExpanded}
                      >
                        <ChevronDownIcon className={`w-3.5 h-3.5 text-primary transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                        <Microscope className="w-3.5 h-3.5 text-primary" />
                        <span className="text-sm text-foreground font-semibold truncate">{section.testName}</span>
                        {section.testCode && <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{section.testCode}</span>}
                        <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                          {completion.filled}/{completion.total}
                        </span>
                        {completion.done && <span className="text-[11px] font-semibold text-success">Complete</span>}
                      </button>

                      {isExpanded && (
                        <>
                          <div className="bg-secondary/40 grid grid-cols-[45%_25%_20%_10%] gap-0 px-2 py-1 border-b border-border text-[10px] md:text-[11px]">
                            <div className="text-left text-muted-foreground uppercase tracking-wider font-semibold">Parameter</div>
                            <div className="px-2 py-1 text-right text-muted-foreground uppercase tracking-wider font-semibold">Result</div>
                            <div className="px-2 py-1 text-left text-muted-foreground uppercase tracking-wider font-semibold">Reference Range</div>
                            <div className="text-center text-muted-foreground uppercase tracking-wider font-semibold">Flag</div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-[10px] md:text-[11px]">
                              <colgroup>
                                <col className="w-[45%]" />
                                <col className="w-[25%]" />
                                <col className="w-[20%]" />
                                <col className="w-[10%]" />
                              </colgroup>
                              <tbody className="divide-y divide-border/70">
                                {section.params.map((param) => {
                                  return (
                                    <tr key={param.id} className="hover:bg-accent/20 transition-colors">
                                      <td className="px-2 py-1 align-middle text-foreground">
                                        <div className="leading-tight break-words">{param.name}</div>
                                        <div className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                                          <span>{param.unit || '-'}</span>
                                          {param.field_type === 'calculated' && (
                                            <span className="inline-flex items-center rounded bg-primary/10 px-1 py-0.5 text-primary">calc</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-2 py-1 align-middle">
                                        {param.input_type === 'select' ? (
                                          <select
                                            ref={(node) => {
                                              inputRefs.current[param.id] = node;
                                            }}
                                            className={`${getInputClass(statuses[param.id])} h-7 text-[11px]${param.field_type === 'calculated' ? ' bg-primary/5 cursor-not-allowed' : ''} !text-left bg-background !py-0`}
                                            value={values[param.id] || (param.options ? param.options.split(',')[0] : "Negative")}
                                            onChange={(e) => handleValueChange(param.id, e.target.value)}
                                            onKeyDown={(event) => handleParameterKeyDown(event, param.id, param.input_type)}
                                            tabIndex={param.field_type === 'calculated' ? -1 : fieldTabOrder[param.id]}
                                            disabled={!isEditable}
                                          >
                                            {param.options ? (
                                              param.options.split(',').map((opt: string) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                              ))
                                            ) : (
                                              <>
                                                <option value="Negative">Negative</option>
                                                <option value="Positive">Positive</option>
                                              </>
                                            )}
                                          </select>
                                        ) : param.input_type === 'textarea' ? (
                                          <div className="relative py-1">
                                            <textarea
                                              ref={(node) => {
                                                inputRefs.current[param.id] = node;
                                              }}
                                              className={`${getInputClass(statuses[param.id])} min-h-[4rem] py-1 px-2 text-[11px] w-full resize-y font-normal bg-background`}
                                              placeholder="Enter description..."
                                              value={values[param.id] || ""}
                                              onChange={(e) => handleValueChange(param.id, e.target.value)}
                                              onFocus={() => setActiveTextareaId(param.id)}
                                              onBlur={() => {
                                                setTimeout(() => {
                                                  setActiveTextareaId(null);
                                                }, 150);
                                              }}
                                              tabIndex={fieldTabOrder[param.id]}
                                              disabled={!isEditable}
                                            />
                                            {param.options && activeTextareaId === param.id && (
                                              (() => {
                                                const currentVal = values[param.id] || '';
                                                const lastPart = currentVal.split(/,\s*/).pop()?.trim() || '';
                                                const filteredOpts = param.options.split(',').filter(opt =>
                                                  !lastPart || opt.toLowerCase().includes(lastPart.toLowerCase())
                                                );

                                                if (filteredOpts.length === 0) return null;

                                                return (
                                                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border rounded shadow-lg max-h-48 overflow-y-auto p-1 divide-y divide-border/30 flex flex-col">
                                                    {filteredOpts.map((opt: string) => (
                                                      <button
                                                        key={opt}
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                          e.preventDefault();
                                                          const trimmed = currentVal.trim();
                                                          if (!trimmed) {
                                                            handleValueChange(param.id, opt + ', ');
                                                          } else {
                                                            const parts = currentVal.split(/,\s*/);
                                                            const last = parts[parts.length - 1] || '';
                                                            if (last && opt.toLowerCase().includes(last.toLowerCase())) {
                                                              parts.pop();
                                                              parts.push(opt);
                                                              handleValueChange(param.id, parts.join(', ') + ', ');
                                                            } else {
                                                              if (currentVal.endsWith(', ')) {
                                                                handleValueChange(param.id, currentVal + opt + ', ');
                                                              } else if (currentVal.endsWith(',')) {
                                                                handleValueChange(param.id, currentVal + ' ' + opt + ', ');
                                                              } else {
                                                                handleValueChange(param.id, currentVal + ', ' + opt + ', ');
                                                              }
                                                            }
                                                          }
                                                        }}
                                                        className="w-full text-left px-2.5 py-1.5 hover:bg-accent text-[11px] font-normal text-foreground transition-colors rounded whitespace-normal"
                                                      >
                                                        {opt}
                                                      </button>
                                                    ))}
                                                  </div>
                                                );
                                              })()
                                            )}
                                          </div>
                                        ) : (
                                          <input
                                            ref={(node) => {
                                              inputRefs.current[param.id] = node;
                                            }}
                                            type={param.input_type === 'text' ? 'text' : 'number'}
                                            step={param.step}
                                            className={`${getInputClass(statuses[param.id])} h-7 text-[11px]${param.field_type === 'calculated' ? ' bg-primary/5 cursor-not-allowed' : ''}`}
                                            placeholder={param.field_type === 'calculated' ? 'Auto' : ''}
                                            value={values[param.id] || ""}
                                            onChange={(e) => handleValueChange(param.id, e.target.value)}
                                            onKeyDown={(event) => handleParameterKeyDown(event, param.id, param.input_type)}
                                            onFocus={(event) => event.currentTarget.select()}
                                            tabIndex={param.field_type === 'calculated' ? -1 : fieldTabOrder[param.id]}
                                            disabled={!isEditable}
                                            readOnly={param.field_type === 'calculated'}
                                          />
                                        )}
                                      </td>
                                      <td className="px-2 py-1 align-middle text-left text-muted-foreground tabular-nums text-[10px] md:text-[11px] leading-tight">
                                        {formatReferenceRange(getPatientReferenceRange(param, patient))}
                                      </td>
                                      <td className="px-2 py-1 align-middle text-center">{getStatusBadge(statuses[param.id])}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </>

                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* Status legend */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground justify-end">
              <div className="flex items-center gap-1">
                <span className="text-info font-semibold">↓</span> Low
              </div>
              <div className="flex items-center gap-1">
                <span className="text-success font-semibold">✓</span> Normal
              </div>
              <div className="flex items-center gap-1">
                <span className="text-destructive font-semibold">↑</span> High
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-red-700 dark:text-red-400">!!</span> Critical
              </div>
            </div>

            {/* Technician Notes - Compact */}
            <div className="bg-card border border-border rounded overflow-hidden">
              <button
                type="button"
                onClick={() => setShowNotesSection((prev) => !prev)}
                className="w-full px-3 py-2 flex items-center justify-between bg-secondary/30 hover:bg-accent transition-colors text-left"
                aria-expanded={showNotesSection}
              >
                <span className="text-xs text-foreground font-semibold flex items-center gap-1.5">
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showNotesSection ? 'rotate-90' : ''}`} />
                  Technician Notes
                </span>
                {technicianNotes.trim() && <span className="text-[10px] text-muted-foreground">Filled</span>}
              </button>
              {showNotesSection && (
                <textarea
                  className="w-full border-0 rounded-b p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary min-h-[64px] bg-background disabled:opacity-50 disabled:cursor-not-allowed resize-y"
                  placeholder="Add notes..."
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  disabled={!isEditable}
                ></textarea>
              )}
            </div>

            {/* AI Clinical Significance Section */}
            <div className="bg-card border border-border rounded overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between gap-2 bg-secondary/30">
                <button
                  type="button"
                  onClick={() => setShowAiSection((prev) => !prev)}
                  className="flex items-center gap-1.5 text-left"
                  aria-expanded={showAiSection}
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAiSection ? 'rotate-90' : ''}`} />
                  <h4 className="text-xs text-foreground flex items-center gap-1.5 font-semibold">
                    <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                    AI Clinical Significance
                  </h4>
                </button>
                <button
                  onClick={handleGenerateInterpretation}
                  disabled={isGeneratingAI || !reportId || Object.values(values).filter(v => v).length === 0}
                  className="h-7 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-[11px] disabled:opacity-50"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {isGeneratingAI ? 'Generating...' : aiInterpretation ? 'Regenerate' : 'Generate'}
                </button>
              </div>

              {showAiSection && (
                <div className="p-3 space-y-2">
                  {aiError && (
                    <div className="p-2 bg-destructive/10 border border-destructive/20 rounded flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0" />
                      <span className="text-[11px] text-destructive">{aiError}</span>
                    </div>
                  )}

                  {aiInterpretation ? (
                    <div className="space-y-2">
                      {aiInterpretation.summary && (
                        <div className="p-2 bg-primary/5 border border-primary/10 rounded">
                          <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-0.5">Summary</p>
                          <p className="text-[11px] text-foreground leading-relaxed">{aiInterpretation.summary}</p>
                        </div>
                      )}

                      {aiInterpretation.keyFindings && (
                        <div className="p-2 bg-warning/5 border border-warning/10 rounded">
                          <p className="text-[10px] text-warning font-semibold uppercase tracking-wider mb-0.5">Key Findings</p>
                          <p className="text-[11px] text-foreground leading-relaxed">{aiInterpretation.keyFindings}</p>
                        </div>
                      )}

                      {aiInterpretation.clinicalIndications && (
                        <div className="p-2 bg-info/5 border border-info/10 rounded">
                          <p className="text-[10px] text-info font-semibold uppercase tracking-wider mb-0.5">Possible Clinical Indications</p>
                          <p className="text-[11px] text-foreground leading-relaxed">{aiInterpretation.clinicalIndications}</p>
                        </div>
                      )}

                      {aiInterpretation.recommendation && (
                        <div className="p-2 bg-success/5 border border-success/10 rounded">
                          <p className="text-[10px] text-success font-semibold uppercase tracking-wider mb-0.5">Recommendation</p>
                          <p className="text-[11px] text-foreground leading-relaxed">{aiInterpretation.recommendation}</p>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          const text = [
                            aiInterpretation.summary && `Summary: ${aiInterpretation.summary}`,
                            aiInterpretation.keyFindings && `Key Findings: ${aiInterpretation.keyFindings}`,
                            aiInterpretation.clinicalIndications && `Clinical Indications: ${aiInterpretation.clinicalIndications}`,
                            aiInterpretation.recommendation && `Recommendation: ${aiInterpretation.recommendation}`,
                          ].filter(Boolean).join('\n');
                          setTechnicianNotes(prev => prev ? `${prev}\n\n--- AI Interpretation ---\n${text}` : text);
                          setShowNotesSection(true);
                        }}
                        className="w-full h-7 flex items-center justify-center gap-1.5 bg-secondary border border-border rounded hover:bg-accent transition-colors text-[11px] text-muted-foreground"
                      >
                        <FileText className="w-3 h-3" />
                        Copy to Notes
                      </button>
                    </div>
                  ) : !isGeneratingAI ? (
                    <p className="text-[11px] text-muted-foreground text-center py-3">
                      Enter test values and click "Generate" to get AI-powered clinical interpretation.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}