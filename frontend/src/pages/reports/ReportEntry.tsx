import React, { useState, useEffect, useRef, useMemo, useCallback, Fragment } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useLocation, useSearchParams, Link } from "react-router";
import {
  Save,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
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
  History,
  Check,
  Edit2,
  Printer,
  Star,
  RefreshCw,
  Paperclip,
  Upload,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useDoctorStore, useReportStore, usePatientStore, useTestStore, useBranchStore } from "../../stores";
import { useAuthStore } from "../../stores/authStore";
import { useB2BStore } from "../../stores/b2bStore";
import { reportApi } from "../../api/reports";
import { priceListApi, pricingEngineApi } from "../../api/priceLists";
import { sampleApi } from "../../api/samples";
import { SampleBarcodeModal } from "../../app/components/reports/SampleBarcodeModal";
import { SampleReceptionModal } from "../../app/components/reports/SampleReceptionModal";
import { useBillingStore } from "../../stores/billingStore";
import type { AgeUnit, Doctor, Patient, Report, Test, TestField, ReferenceRule, CriticalRules, ReportTestPriceSnapshot, ReportAttachment } from "../../types";
import { fileToAttachmentPages } from "../../utils/attachments";
import { BillingSection } from "../../app/components/reports/BillingSection";
import { SmartSelectInput } from "../../app/components/reports/SmartSelectInput";
import { formatAge, getAgeMax, normalizeAgeUnit } from "../../utils/age";
import { smartSearchFilter } from "../../utils";
import { SUM_100_GROUPS, isQualitativeValueHigh, isMicroscopicRangeHigh } from "./reportSpecialCases";
import { CustomConfirmModal } from "../../app/components/ui/CustomConfirmModal";
import { PatientInfoHeader } from "../../app/components/reports/PatientInfoHeader";
import { HistoryTrendPanel } from "../../app/components/reports/HistoryTrendPanel";

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
      age_min: r.age_min != null ? Number(r.age_min) : null,
      age_max: r.age_max != null ? Number(r.age_max) : null,
      age_min_unit: r.age_min_unit || r.age_max_unit || 'years',
      age_max_unit: r.age_max_unit || r.age_min_unit || 'years',
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
function convertAge(age: number, fromUnit: string, toUnit: string): number {
  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();
  if (from === to) return age;

  // Convert to days first
  let ageInDays = age;
  if (from === 'years' || from === 'year' || from === 'y') {
    ageInDays = age * 365.25;
  } else if (from === 'months' || from === 'month' || from === 'm') {
    ageInDays = age * 30.4375;
  }

  // Convert from days to target unit
  if (to === 'years' || to === 'year' || to === 'y') {
    return ageInDays / 365.25;
  } else if (to === 'months' || to === 'month' || to === 'm') {
    return ageInDays / 30.4375;
  }
  return ageInDays;
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
        if (rule.age_min != null) {
          const ruleMinUnit = (rule.age_min_unit || 'years').toLowerCase();
          const patientAgeInMinUnit = convertAge(patient.age ?? 0, patient.age_unit || 'years', ruleMinUnit);
          if (patientAgeInMinUnit < rule.age_min) {
            isCompatible = false;
          }
        }
        if (isCompatible && rule.age_max != null) {
          const ruleMaxUnit = (rule.age_max_unit || 'years').toLowerCase();
          const patientAgeInMaxUnit = convertAge(patient.age ?? 0, patient.age_unit || 'years', ruleMaxUnit);
          if (patientAgeInMaxUnit > rule.age_max) {
            isCompatible = false;
          }
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
  if (range.low != null || range.high != null) {
    const lo = range.low != null ? range.low : '—';
    const hi = range.high != null ? range.high : '—';
    return `${lo} - ${hi}`;
  }
  return range.note || '-';
}

function isCbcTest(testName?: string, testCode?: string): boolean {
  const name = (testName || '').toLowerCase();
  const code = (testCode || '').toLowerCase();
  return (
    code === 'cbc' ||
    code.includes('cbc') ||
    name.includes('complete blood count') ||
    name.includes('cbc')
  );
}

function isWorkflowEditable(status?: string): boolean {
  return status === 'draft' || status === 'rejected' || status === 'approved';
}

function stableSerialize(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(obj[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function sameNumberish(a: unknown, b: unknown): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  const aNum = Number(a);
  const bNum = Number(b);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return aNum === bNum;
  }
  return false;
}

export function ReportEntry() {
  const { reportId: rawReportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  // Barcode & Sample Reception Modal State
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isSampleReceptionModalOpen, setIsSampleReceptionModalOpen] = useState(false);
  const hasPromptedReceptionRef = useRef<string | null>(null);

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
    approveTest,
    rejectTest,
    sendTestForApproval,
    sendAllTestsForApproval,
    setSelectedReport,
    isLoading: reportLoading,
    error: reportError
  } = useReportStore();
  const { fetchPatientById, updatePatient } = usePatientStore();
  const { currentBranchId, fetchBranches } = useBranchStore();
  const { can, user, staffList, fetchStaffList } = useAuthStore();
  const { labs: b2bLabs, fetchLabs: fetchB2BLabs } = useB2BStore();
  const { tests, testFields, fetchTests, fetchTestFields, fetchTestFieldsMulti } = useTestStore();
  const canAutoApprove = can('report:approve');
  const canRemoveTest = can('report:remove_test');
  // Trend graphs in patient history are a lab-tech/admin diagnostic tool
  const canViewHistoryTrends = user?.role === 'admin' || user?.role === 'lab_technician';
  const {
    loadFromReport,
    reset: resetBilling,
    saveBilling,
    setBaseAmount,
    baseAmount,
    labDiscountType,
    labDiscountValue,
    doctorDiscount,
    finalAmount,
    pricingSnapshot,
  } = useBillingStore();
  const reportId = rawReportId && rawReportId !== 'undefined' && rawReportId !== 'null' ? rawReportId : undefined;

  useEffect(() => {
    if (!currentBranchId) {
      fetchBranches();
    }
  }, [currentBranchId, fetchBranches]);

  useEffect(() => {
    fetchStaffList();
    fetchB2BLabs();
  }, [fetchStaffList, fetchB2BLabs]);

  useEffect(() => {
    if (rawReportId === 'undefined' || rawReportId === 'null') {
      navigate('/app/reports', { replace: true });
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
    let data: any;
    if (typeof selectedReport.test_data === 'string') {
      try {
        data = JSON.parse(selectedReport.test_data);
      } catch {
        return null;
      }
    } else {
      data = selectedReport.test_data;
    }
    if (!data) return null;

    // Ensure testIds is always present — reconstruct from fallback sources if missing
    if (!data.testIds || !Array.isArray(data.testIds) || data.testIds.length === 0) {
      // Try extracting from grouped tests array
      if (data.tests && Array.isArray(data.tests) && data.tests.length > 0) {
        const idsFromTests = data.tests
          .map((t: any) => t.testId || t.id)
          .filter(Boolean) as string[];
        if (idsFromTests.length > 0) {
          data = { ...data, testIds: idsFromTests };
        }
      }
      // Fallback: match by report_type names against the tests store
      if ((!data.testIds || data.testIds.length === 0) && selectedReport.report_type && tests.length > 0) {
        const testNames = selectedReport.report_type.split(',').map((n: string) => n.trim().toLowerCase());
        const matchedIds = tests
          .filter(t => testNames.includes(t.test_name.toLowerCase()))
          .map(t => t.id);
        if (matchedIds.length > 0) {
          data = { ...data, testIds: matchedIds };
        }
      }
    }
    return data;
  }, [selectedReport, tests]);

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

    const cbcSections = sections.filter((s) => isCbcTest(s.testName, s.testCode));
    const otherSections = sections.filter((s) => !isCbcTest(s.testName, s.testCode));
    return [...cbcSections, ...otherSections];
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
            // Standard clinical shorthand aliases
            const nameLower = param.name.toLowerCase();
            if (nameLower.includes("hematocrit")) {
              scope["Hct"] = num;
              scope["HCT"] = num;
            }
            if (nameLower.includes("hemoglobin")) {
              scope["Hb"] = num;
              scope["HB"] = num;
            }
            if (nameLower.includes("rbc count")) {
              scope["RBC"] = num;
            }
            if (nameLower.includes("total wbc count")) {
              scope["WBC"] = num;
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
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [isB2B, setIsB2B] = useState<boolean>(false);
  const [selectedB2BLabId, setSelectedB2BLabId] = useState<string>("");
  const [b2bCharge, setB2bCharge] = useState<string>("");

  // Previous values state for inline comparison
  const [previousValues, setPreviousValues] = useState<Record<string, { value: number | string; date: string }>>({});
  const hasPreviousData = Object.keys(previousValues).length > 0;

  // Active Test & Navigation
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const activeSection = testSections.find(s => s.testId === activeTestId) || testSections[0];

  // Modals state
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'confirm' | 'alert' | 'warning' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
  });
  const [testIdToRemove, setTestIdToRemove] = useState<string | null>(null);
  const [historyReports, setHistoryReports] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Auto-select first test when testSections load
  useEffect(() => {
    if (testSections.length > 0 && !activeTestId) {
      setActiveTestId(testSections[0].testId);
    } else if (testSections.length > 0 && activeTestId) {
      const exists = testSections.some(s => s.testId === activeTestId);
      if (!exists) {
        setActiveTestId(testSections[0].testId);
      }
    }
  }, [testSections, activeTestId]);

  // Fetch previous values for inline comparison (same-test-only)
  useEffect(() => {
    if (!patient?.id || testSections.length === 0) {
      setPreviousValues({});
      return;
    }

    const fetchPreviousValues = async () => {
      try {
        const res = await reportApi.getByPatient(patient.id);
        if (res && res.data) {
          // Filter to only completed/approved/under-review reports (non-draft)
          // Also sort them descending by created_at date
          const otherReports = res.data
            .filter(r => r.id !== reportId && r.status !== 'draft')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          if (otherReports.length === 0) {
            setPreviousValues({});
            return;
          }

          const currentTestIds = new Set(testSections.map(s => s.testId));
          const prevMap: Record<string, { value: number | string; date: string }> = {};

          for (const report of otherReports) {
            const td = typeof report.test_data === 'string'
              ? JSON.parse(report.test_data)
              : report.test_data;

            if (!td || !td.tests) continue;

            for (const testGroup of td.tests) {
              const tid = testGroup.testId || testGroup.id;
              if (!tid || !currentTestIds.has(tid)) continue; // SAME TEST ONLY

              if (testGroup.parameters) {
                for (const param of testGroup.parameters) {
                  const key = `${tid}::${param.name}`;
                  if (prevMap[key]) continue; // already have the most recent value
                  if (param.value == null || param.value === '') continue;

                  prevMap[key] = {
                    value: param.value,
                    date: report.created_at
                  };
                }
              }
            }
          }

          setPreviousValues(prevMap);
        }
      } catch (e) {
        console.error("Failed to fetch patient reports for comparison:", e);
      }
    };

    fetchPreviousValues();
  }, [patient?.id, testSections, reportId]);

  const [doctorSearch, setDoctorSearch] = useState("");
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [referringDoctorName, setReferringDoctorName] = useState("");
  const doctorSearchRef = useRef<HTMLDivElement>(null);
  const doctorSearchInputRef = useRef<HTMLInputElement>(null);
  const isClearingDoctorRef = useRef(false);
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
  const [manualFlags, setManualFlags] = useState<Record<string, boolean>>({});
  const [technicianNotes, setTechnicianNotes] = useState("");

  // Report attachments (PDF/image pages, e.g. B2B partner-lab reports)
  const [attachments, setAttachments] = useState<ReportAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const handleAttachmentFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!reportId) {
      toast.error("Save the report before adding attachments.");
      return;
    }
    setUploadingAttachment(true);
    try {
      for (const file of Array.from(files)) {
        const { sourceType, pages } = await fileToAttachmentPages(file);
        if (pages.length === 0) continue;
        const uploaded = await reportApi.uploadAttachments(reportId, {
          name: file.name,
          sourceType,
          pages,
        });
        setAttachments((prev) => [...prev, ...uploaded]);
      }
      toast.success("Attachment added. Remember to save the report.");
    } catch (e) {
      console.error("Failed to add attachment:", e);
      toast.error("Failed to add attachment. Please try again.");
    } finally {
      setUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    }
  };

  // Remove all pages that came from the same uploaded file (grouped by name + sourceType)
  const handleRemoveAttachmentGroup = async (group: ReportAttachment[]) => {
    const urls = new Set(group.map((a) => a.url));
    setAttachments((prev) => prev.filter((a) => !urls.has(a.url)));
    if (reportId) {
      for (const a of group) {
        try {
          await reportApi.deleteAttachment(reportId, a.url);
        } catch (e) {
          console.error("Failed to delete attachment asset:", e);
        }
      }
    }
  };

  // Group attachment pages by their source file for display
  const attachmentGroups = useMemo(() => {
    const groups: { key: string; name: string; sourceType: string; pages: ReportAttachment[] }[] = [];
    for (const att of attachments) {
      const key = `${att.name}::${att.sourceType}::${att.totalPages}`;
      let group = groups.find((g) => g.key === key);
      if (!group) {
        group = { key, name: att.name, sourceType: att.sourceType, pages: [] };
        groups.push(group);
      }
      group.pages.push(att);
    }
    return groups;
  }, [attachments]);

  const renderAttachmentsCard = () => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm space-y-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-primary" />
          Attachments {attachments.length > 0 && (
            <span className="text-[10px] font-semibold text-slate-500">({attachments.length} page{attachments.length > 1 ? 's' : ''})</span>
          )}
        </h3>
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
        Attach a PDF or images (e.g. a B2B partner-lab report). They are added as pages after your tests and before marketing pages.
      </p>

      <input
        ref={attachmentInputRef}
        type="file"
        accept="application/pdf,image/*"
        multiple
        className="hidden"
        onChange={(e) => handleAttachmentFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => attachmentInputRef.current?.click()}
        disabled={uploadingAttachment || !reportId || !isEditable}
        className="w-full h-8 flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-[11px] font-bold text-blue-600 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
      >
        {uploadingAttachment ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
        ) : (
          <><Upload className="w-3.5 h-3.5" /> Add PDF / Image</>
        )}
      </button>

      {attachmentGroups.length > 0 && (
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5">
          {attachmentGroups.map((group) => (
            <div
              key={group.key}
              className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40"
            >
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate" title={group.name}>{group.name}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wide">
                  {group.sourceType} · {group.pages.length} page{group.pages.length > 1 ? 's' : ''}
                </p>
              </div>
              {isEditable && (
                <button
                  type="button"
                  onClick={() => handleRemoveAttachmentGroup(group.pages)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer flex-shrink-0"
                  title="Remove attachment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
  const [activeSubTab, setActiveSubTab] = useState<'results' | 'notes'>('results');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showNotesSection, setShowNotesSection] = useState(false);
  const [showAiSection, setShowAiSection] = useState(false);
  const [activeTextareaId, setActiveTextareaId] = useState<string | null>(null);
  const [textareaCoords, setTextareaCoords] = useState({ top: 0, left: 0 });
  const [textareaAlignLeft, setTextareaAlignLeft] = useState(false);
  const [textareaAlignBottom, setTextareaAlignBottom] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>({});
  const isHoveringTextareaDropdown = useRef(false);

  // Test-specific remarks/notes state & popover positioning
  const [testRemarks, setTestRemarks] = useState<Record<string, string>>({});
  const [activeRemarksFocus, setActiveRemarksFocus] = useState<boolean>(false);
  const [remarksCoords, setRemarksCoords] = useState({ top: 0, left: 0 });
  const [remarksAlignLeft, setRemarksAlignLeft] = useState(false);
  const [remarksAlignBottom, setRemarksAlignBottom] = useState(false);
  const [remarksMaxHeight, setRemarksMaxHeight] = useState(300);
  const remarksTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isHoveringRemarksDropdown = useRef(false);

  const REMARK_OPTIONS = useMemo(() => [
    "Blood sample was collected in a non-fasting state.",
    "Patient had a heavy breakfast before sample collection.",
    "Patient had a light breakfast before sample collection.",
    "Patient consumed tea before sample collection.",
    "Patient consumed coffee before sample collection.",
    "Patient consumed milk before sample collection.",
    "Patient consumed juice before sample collection.",
    "Patient consumed food and tea before sample collection.",
    "Patient had a meal before sample collection.",
    "Fasting status not confirmed.",
    "Patient consumed snacks before sample collection.",
    "Patient consumed food within the last 2–4 hours before sample collection"
  ], []);

  const handleTestRemarksChange = (val: string) => {
    if (activeSection?.testId) {
      setTestRemarks(prev => ({ ...prev, [activeSection.testId]: val }));
    }
  };

  // Custom reference ranges state & inline editing state
  const [customReferenceRanges, setCustomReferenceRanges] = useState<Record<string, string>>({});
  const [editingRangeId, setEditingRangeId] = useState<string | null>(null);
  const [tempRangeValue, setTempRangeValue] = useState<string>('');

  const handleSaveReferenceRange = (paramId: string) => {
    setCustomReferenceRanges(prev => ({
      ...prev,
      [paramId]: tempRangeValue.trim()
    }));
    setEditingRangeId(null);
  };

  const parseCustomReferenceRange = (rangeStr: string): { low: number | null; high: number | null } => {
    const result: { low: number | null; high: number | null } = { low: null, high: null };
    if (!rangeStr) return result;

    const cleaned = rangeStr.replace(/\s+/g, '').replace(/–/g, '-').replace(/—/g, '-');

    if (cleaned.startsWith('<')) {
      const val = parseFloat(cleaned.substring(1));
      if (!isNaN(val)) result.high = val;
      return result;
    }

    if (cleaned.startsWith('>')) {
      const val = parseFloat(cleaned.substring(1));
      if (!isNaN(val)) result.low = val;
      return result;
    }

    const parts = cleaned.split('-');
    if (parts.length === 2) {
      const lowVal = parseFloat(parts[0]);
      const highVal = parseFloat(parts[1]);
      if (!isNaN(lowVal)) result.low = lowVal;
      if (!isNaN(highVal)) result.high = highVal;
    }

    return result;
  };

  useEffect(() => {
    const updatePosition = () => {
      if (activeRemarksFocus && remarksTextareaRef.current) {
        const rect = remarksTextareaRef.current.getBoundingClientRect();
        const dropdownWidth = 240; // width of w-60 is 240px
        
        const currentVal = (activeSection?.testId ? testRemarks[activeSection.testId] : '') || '';
        const lastPart = currentVal.split(/,\s*/).pop()?.trim() || '';
        const filteredOpts = REMARK_OPTIONS.filter(opt =>
          !lastPart || opt.toLowerCase().includes(lastPart.toLowerCase())
        );
        const expectedHeight = filteredOpts.length * 32 + 12;

        let showLeft = false;
        const spaceOnRight = window.innerWidth - rect.right;
        if (spaceOnRight < dropdownWidth && rect.left > dropdownWidth) {
          showLeft = true;
        }
        setRemarksAlignLeft(showLeft);

        const spaceBelow = window.innerHeight - rect.top - 16;
        const spaceAbove = rect.bottom - 16;

        // Open upwards if space below is less than expected height and space above is larger
        const showBottom = spaceBelow < expectedHeight && spaceAbove > spaceBelow;
        setRemarksAlignBottom(showBottom);

        const maxHt = Math.min(showBottom ? spaceAbove : spaceBelow, 300);
        setRemarksMaxHeight(maxHt);

        const dropdownHeight = Math.min(expectedHeight, maxHt);

        const leftCoord = showLeft
          ? rect.left - dropdownWidth - 14
          : rect.right + 14;

        const topCoord = showBottom
          ? rect.bottom - dropdownHeight
          : rect.top;

        setRemarksCoords({ top: topCoord, left: leftCoord });
      }
    };

    updatePosition();
    if (activeRemarksFocus) {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [activeRemarksFocus, testRemarks, activeSection, REMARK_OPTIONS]);

  useEffect(() => {
    setActiveSubTab('results');
  }, [activeTestId]);

  useEffect(() => {
    const updatePosition = () => {
      if (activeTextareaId) {
        const textareaEl = inputRefs.current[activeTextareaId];
        if (textareaEl) {
          const rect = textareaEl.getBoundingClientRect();
          const dropdownWidth = 208; // width of w-52 is 13rem = 208px
          const param = dynamicParams.find(p => p.id === activeTextareaId);
          if (!param) return;
          const currentVal = values[activeTextareaId] || '';
          const lastPart = currentVal.split(/,\s*/).pop()?.trim() || '';
          const filteredOpts = param.options.split(',').filter(opt =>
            !lastPart || opt.toLowerCase().includes(lastPart.toLowerCase())
          );
          const dropdownHeight = Math.min(filteredOpts.length * 32 + 12, window.innerHeight * 0.8);

          let showLeft = false;
          const spaceOnRight = window.innerWidth - rect.right;
          if (spaceOnRight < dropdownWidth && rect.left > dropdownWidth) {
            showLeft = true;
          }
          setTextareaAlignLeft(showLeft);

          let showBottom = false;
          const spaceBelow = window.innerHeight - rect.bottom;
          if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
            showBottom = true;
          }
          setTextareaAlignBottom(showBottom);

          // Calculate viewport absolute placement coords for fixed position rendering
          const leftCoord = showLeft
            ? rect.left - dropdownWidth - 14
            : rect.right + 14;

          const topCoord = showBottom
            ? rect.bottom - dropdownHeight
            : rect.top;

          setTextareaCoords({ top: topCoord, left: leftCoord });
        }
      }
    };

    updatePosition();
    if (activeTextareaId) {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [activeTextareaId, values, dynamicParams]);

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

  // Track the report ID we've populated values for (to avoid overwriting user input)
  const populatedReportIdRef = useRef<string | null>(null);
  const loadedDoctorReportIdRef = useRef<string | null>(null);
  // Track whether billing has been loaded from the report (to avoid overwriting user's discount changes)
  const hasBillingLoaded = useRef(false);
  const originalSnapshotRef = useRef<ReportTestPriceSnapshot[]>([]);

  // Reset the populated flag and form state when reportId changes (navigating to a different report)
  useEffect(() => {
    populatedReportIdRef.current = null;
    loadedDoctorReportIdRef.current = null;
    hasBillingLoaded.current = false;
    originalSnapshotRef.current = [];
    setSelectedReport(null); // Clear stale report data before fetching new one
    setValues({});
    setStatuses({});
    setManualFlags({});
    setTechnicianNotes('');
    setAttachments([]);
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
      setIsEditable(isWorkflowEditable(selectedReport.status));

      // Set test name and amount
      if (selectedReport.report_type) setTestName(selectedReport.report_type);
      if (selectedReport.report_amount) setReportAmount(selectedReport.report_amount);
      if (selectedReport.clinical_notes) setTechnicianNotes(selectedReport.clinical_notes);
      setSelectedStaffId(
        selectedReport.staff_id ||
          ((user?.role === 'staff' || user?.role === 'lab_technician') ? user.id : '')
      );
      setIsB2B(!!selectedReport.b2b_lab_id);
      setSelectedB2BLabId(selectedReport.b2b_lab_id || "");
      setB2bCharge(selectedReport.b2b_charge ? String(selectedReport.b2b_charge) : "");

      // Set doctor selection (only if not loaded yet or if we have new async doctor details)
      const hasLoadedBefore = loadedDoctorReportIdRef.current === selectedReport.id;
      if (!hasLoadedBefore) {
        if (selectedReport.doctor_id) {
          const doctor = doctors.find(d => d.id === selectedReport.doctor_id);
          if (doctor) {
            setSelectedDoctor(doctor);
            setDoctorSearch(`${doctor.title || 'Dr'}. ${doctor.name}`);
            setReferringDoctorName("");
            loadedDoctorReportIdRef.current = selectedReport.id;
          } else if (selectedReport.doctor_name) {
            // Fallback if doctors list is still loading (don't lock loadedDoctorReportIdRef yet, so we can retry when doctors load)
            setDoctorSearch(`${selectedReport.doctor_title || 'Dr'}. ${selectedReport.doctor_name}`);
            setReferringDoctorName("");
          }
        } else if (selectedReport.referring_doctor_name) {
          setSelectedDoctor(null);
          setReferringDoctorName(selectedReport.referring_doctor_name);
          setDoctorSearch(selectedReport.referring_doctor_name);
          loadedDoctorReportIdRef.current = selectedReport.id;
        } else if (selectedReport.is_self_report) {
          setSelectedDoctor(null);
          setReferringDoctorName("");
          setDoctorSearch("Self (No Doctor)");
          loadedDoctorReportIdRef.current = selectedReport.id;
        } else {
          setSelectedDoctor(null);
          setReferringDoctorName("");
          setDoctorSearch("");
          loadedDoctorReportIdRef.current = selectedReport.id;
        }
      }

      // Load billing data from the report ONCE (avoid overwriting user's discount changes)
      if (!hasBillingLoaded.current) {
        loadFromReport(selectedReport);
        hasBillingLoaded.current = true;
        originalSnapshotRef.current = selectedReport.pricing_snapshot || [];
      }

      // Auto-prompt sample reception modal if pending on initial entry (never for approved reports)
      if (
        selectedReport.status !== 'approved' &&
        selectedReport.sample_status !== 'received' &&
        hasPromptedReceptionRef.current !== selectedReport.id
      ) {
        setIsSampleReceptionModalOpen(true);
        hasPromptedReceptionRef.current = selectedReport.id;
      } else if (hasPromptedReceptionRef.current !== selectedReport.id) {
        hasPromptedReceptionRef.current = selectedReport.id;
      }
    }
  }, [selectedReport, reportId, doctors, loadFromReport, user]);

  // Populate test values from report's test_data ONCE when dynamic params arrive
  useEffect(() => {
    if (populatedReportIdRef.current === reportId) return;
    if (!selectedReport || dynamicParams.length === 0) return;
    // Guard: only populate when selectedReport matches the current URL reportId
    if (selectedReport.id !== reportId) return;

    // Verify dynamicParams match the expected testIds to avoid loading stale fields
    const testIdsInParams = new Set(dynamicParams.map(p => p.test_id));
    const expectedTestIds = parsedTestData?.testIds || [];
    if (expectedTestIds.length > 0) {
      const allMatched = expectedTestIds.every((id: string) => testIdsInParams.has(id));
      if (!allMatched) {
        // The dynamicParams are still stale (don't match the new report's tests yet)
        return;
      }
    }

    const existingValues: Record<string, string> = {};

    // Initialize fields with default values first
    dynamicParams.forEach((param) => {
      if (param.options && param.options.trim() !== '') {
        if (param.input_type === 'select' && param.is_mandatory !== false && param.name.toLowerCase() !== 'remark') {
          const defaultValue = param.options.split(',')[0].trim();
          existingValues[param.id] = defaultValue;
        } else if (param.input_type === 'text' || param.input_type === 'number' || param.input_type === 'textarea') {
          if (!param.options.includes(',')) {
            existingValues[param.id] = param.options.trim();
          }
        }
      }
    });

    // Populate saved values — prefer grouped (tests[]) with testId scoping to prevent cross-test value swaps
    const testData = parsedTestData;
    const initialCustomRanges: Record<string, string> = {};
    const initialManualFlags: Record<string, boolean> = {};

    // Load any previously saved attachments
    if (Array.isArray(testData?.attachments)) {
      setAttachments(testData.attachments);
    }

    if (testData?.tests?.length) {
      // Grouped format: match by BOTH testId AND parameter name to avoid cross-test collisions
      const initialRemarks: Record<string, string> = {};
      for (const group of testData.tests) {
        const groupTestId = group.testId;
        if (group.remarks) {
          initialRemarks[groupTestId] = group.remarks;
        } else if (group.notes) {
          initialRemarks[groupTestId] = group.notes;
        }
        for (const p of group.parameters) {
          // Find the dynamic param that belongs to this specific test AND has the matching name
          const matchedParam = groupTestId
            ? dynamicParams.find(dp => dp.test_id === groupTestId && dp.name === p.name)
            : dynamicParams.find(dp => dp.name === p.name);
          if (matchedParam) {
            if (p.value !== null && p.value !== undefined && p.value !== '') {
              // Backward-compatibility: if the stored value is exactly the option lists string, treat it as empty
              if (matchedParam.input_type === 'textarea' && p.value.toString().trim() === matchedParam.options?.trim()) {
                // skip
              } else {
                existingValues[matchedParam.id] = p.value.toString();
              }
            }
            if (p.referenceRange !== undefined && p.referenceRange !== null && p.referenceRange !== '') {
              initialCustomRanges[matchedParam.id] = p.referenceRange;
            }
            if (p.manualFlag === 'high') {
              initialManualFlags[matchedParam.id] = true;
            }
          }
        }
      }
      setTestRemarks(initialRemarks);
      setCustomReferenceRanges(initialCustomRanges);
      setManualFlags(initialManualFlags);
    } else if (testData?.parameters?.length) {
      // Legacy flat format (no testId available): fall back to name-only matching
      for (const p of testData.parameters) {
        const matchedParam = dynamicParams.find(dp => dp.name === p.name);
        if (matchedParam) {
          if (p.value !== null && p.value !== undefined && p.value !== '') {
            // Backward-compatibility: if the stored value is exactly the option lists string, treat it as empty
            if (matchedParam.input_type === 'textarea' && p.value.toString().trim() === matchedParam.options?.trim()) {
              // skip
            } else {
              existingValues[matchedParam.id] = p.value.toString();
            }
          }
          if (p.referenceRange !== undefined && p.referenceRange !== null && p.referenceRange !== '') {
            initialCustomRanges[matchedParam.id] = p.referenceRange;
          }
          if (p.manualFlag === 'high') {
            initialManualFlags[matchedParam.id] = true;
          }
        }
      }
      setCustomReferenceRanges(initialCustomRanges);
      setManualFlags(initialManualFlags);
    }

    // Set values (this includes the initialized select fields, so status computation runs correctly)
    setValues(existingValues);
    populatedReportIdRef.current = reportId;
  }, [selectedReport, parsedTestData, dynamicParams, reportId]);

  // Initialize default values for newly added test fields/parameters (on add test) without page refresh
  useEffect(() => {
    if (dynamicParams.length === 0) return;

    setValues((prevValues) => {
      let hasChanges = false;
      const updatedValues = { ...prevValues };

      dynamicParams.forEach((param) => {
        if (updatedValues[param.id] === undefined) {
          hasChanges = true;
          let defaultValue = '';
          if (param.options && param.options.trim() !== '') {
            if (param.input_type === 'select' && param.is_mandatory !== false && param.name.toLowerCase() !== 'remark') {
              defaultValue = param.options.split(',')[0].trim();
            } else if (param.input_type === 'text' || param.input_type === 'number' || param.input_type === 'textarea') {
              if (!param.options.includes(',')) {
                defaultValue = param.options.trim();
              }
            }
          }
          updatedValues[param.id] = defaultValue;
        }
      });

      return hasChanges ? updatedValues : prevValues;
    });
  }, [dynamicParams]);

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

  const doctorDropdownOptions = useMemo(() => {
    const options: ({ type: 'self' } | { type: 'doctor'; data: Doctor })[] = [];
    const isSelfVisible = !doctorSearch || 'self'.includes(doctorSearch.toLowerCase());
    if (isSelfVisible) {
      options.push({ type: 'self' as const });
    }
    filteredDoctors.forEach(doc => {
      options.push({ type: 'doctor' as const, data: doc });
    });
    return options;
  }, [doctorSearch, filteredDoctors]);

  useEffect(() => {
    if (!showDoctorDropdown || doctorDropdownOptions.length === 0) {
      setActiveDoctorIndex(0);
      return;
    }
    setActiveDoctorIndex((currentIndex) => Math.min(currentIndex, doctorDropdownOptions.length - 1));
  }, [doctorDropdownOptions, showDoctorDropdown]);

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

  // Handle doctor selection from dropdown list
  const handleSelectDoctor = async (doctor: Doctor) => {
    if (!selectedReport) return;

    setSelectedDoctor(doctor);
    setReferringDoctorName("");
    setDoctorSearch(`${doctor.title || 'Dr'}. ${doctor.name}`);
    setShowDoctorDropdown(false);
    setActiveDoctorIndex(0);

    // Re-resolve pricing for all tests based on new doctor selection
    const currentTestIds = parsedTestData?.testIds || [];
    let newAmount = reportAmount;
    let resolvedSnapshot = selectedReport.pricing_snapshot || [];

    if (currentTestIds.length > 0) {
      const res = await resolvePricingForTestIds(currentTestIds, doctor.id);
      newAmount = res.amount;
      resolvedSnapshot = res.snapshot;
    }

    const updatedReport = {
      ...selectedReport,
      doctor_id: doctor.id,
      referring_doctor_name: undefined,
      is_self_report: false,
      report_amount: newAmount,
      pricing_snapshot: resolvedSnapshot,
    };
    setSelectedReport(updatedReport);
    setReportAmount(newAmount);
    setBaseAmount(newAmount);
  };

  // Handle clearing the doctor field
  const handleClearDoctor = async () => {
    if (!selectedReport) return;

    isClearingDoctorRef.current = true;
    setSelectedDoctor(null);
    setReferringDoctorName("");
    setDoctorSearch("");
    setShowDoctorDropdown(true);
    setActiveDoctorIndex(0);

    // Re-resolve pricing with doctorId = null (default pricing)
    const currentTestIds = parsedTestData?.testIds || [];
    let newAmount = reportAmount;
    let resolvedSnapshot = selectedReport.pricing_snapshot || [];

    if (currentTestIds.length > 0) {
      const res = await resolvePricingForTestIds(currentTestIds, null);
      newAmount = res.amount;
      resolvedSnapshot = res.snapshot;
    }

    const updatedReport = {
      ...selectedReport,
      doctor_id: undefined,
      referring_doctor_name: undefined,
      is_self_report: true,
      report_amount: newAmount,
      pricing_snapshot: resolvedSnapshot,
    };
    setSelectedReport(updatedReport);
    setReportAmount(newAmount);
    setBaseAmount(newAmount);

    setTimeout(() => {
      doctorSearchInputRef.current?.focus();
      isClearingDoctorRef.current = false;
    }, 50);
  };

  // Handle selecting Self
  const handleSelectSelf = async () => {
    if (!selectedReport) return;

    setSelectedDoctor(null);
    setReferringDoctorName("");
    setDoctorSearch("Self (No Doctor)");
    setShowDoctorDropdown(false);
    setActiveDoctorIndex(0);

    // Re-resolve pricing with doctorId = null (default pricing)
    const currentTestIds = parsedTestData?.testIds || [];
    let newAmount = reportAmount;
    let resolvedSnapshot = selectedReport.pricing_snapshot || [];

    if (currentTestIds.length > 0) {
      const res = await resolvePricingForTestIds(currentTestIds, null);
      newAmount = res.amount;
      resolvedSnapshot = res.snapshot;
    }

    const updatedReport = {
      ...selectedReport,
      doctor_id: undefined,
      referring_doctor_name: undefined,
      is_self_report: true,
      report_amount: newAmount,
      pricing_snapshot: resolvedSnapshot,
    };
    setSelectedReport(updatedReport);
    setReportAmount(newAmount);
    setBaseAmount(newAmount);
  };

  // Handle blur on doctor search — if text was typed but no doctor selected, use as referring_doctor_name
  const handleDoctorBlur = () => {
    // Small delay to allow dropdown clicks to register first
    setTimeout(() => {
      if (isClearingDoctorRef.current) return;
      const trimmed = doctorSearch.trim();
      const isSelf = trimmed.toLowerCase() === 'self' || trimmed === 'Self (No Doctor)';
      if (!selectedDoctor && trimmed && !isSelf) {
        // Capitalize each word
        const capitalizedName = trimmed
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setReferringDoctorName(capitalizedName);
        setDoctorSearch(capitalizedName);
      } else if (!selectedDoctor && (isSelf || !trimmed)) {
        setReferringDoctorName("");
        setDoctorSearch("Self (No Doctor)");
      }
      setShowDoctorDropdown(false);
    }, 200);
  };

  const handleDoctorSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      if (!showDoctorDropdown) {
        setShowDoctorDropdown(true);
        return;
      }
      if (doctorDropdownOptions.length > 0) {
        setActiveDoctorIndex((currentIndex) => (currentIndex + 1) % doctorDropdownOptions.length);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      if (!showDoctorDropdown) {
        setShowDoctorDropdown(true);
        return;
      }
      if (doctorDropdownOptions.length > 0) {
        setActiveDoctorIndex((currentIndex) =>
          currentIndex === 0 ? doctorDropdownOptions.length - 1 : currentIndex - 1
        );
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      if (doctorDropdownOptions.length > 0 && showDoctorDropdown) {
        const opt = doctorDropdownOptions[activeDoctorIndex] ?? doctorDropdownOptions[0];
        if (opt) {
          if (opt.type === 'self') {
            handleSelectSelf();
          } else {
            handleSelectDoctor(opt.data);
          }
        }
        return;
      }

      // Just close dropdown — the typed text will be used as referring_doctor_name on blur
      if (doctorSearch.trim()) {
        const capitalizedName = doctorSearch.trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setReferringDoctorName(capitalizedName);
        setDoctorSearch(capitalizedName);
        setShowDoctorDropdown(false);
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
    const unselected = tests.filter((t) => !selectedTestIds.includes(t.id));
    if (!testSearch.trim()) {
      return unselected.slice(0, 15);
    }
    return smartSearchFilter(unselected, testSearch, [
      { field: (t: Test) => t.test_name, weight: 1.0 },
      { field: (t: Test) => t.test_code, weight: 0.9 },
      { field: (t: Test) => t.category, weight: 0.6 },
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

    if (reportId) {
      try {
        const success = await updateReport(reportId, {
          report_type: newReportType,
          report_amount: newAmount,
          base_amount: newAmount,
          final_amount: newAmount,
          test_data: updatedTestData,
          pricing_items: resolvedSnapshot.length > 0 ? resolvedSnapshot : selectedReport.pricing_snapshot,
        });
        if (success) {
          toast.success("Test added successfully.");
          await fetchReportById(reportId);
        } else {
          toast.error("Failed to update test list in database.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error saving updated test list to server.");
      }
    }
  };

  const handleRemoveTest = async (testId: string) => {
    if (!selectedReport) return;
    if (!canRemoveTest) {
      toast.error("You do not have permission to remove tests from a report.");
      return;
    }

    const currentTestIds: string[] = Array.isArray(parsedTestData?.testIds)
      ? (parsedTestData.testIds as string[])
      : [];
    const newTestIds: string[] = currentTestIds.filter((id) => id !== testId);
    if (newTestIds.length === 0) {
      toast.error("A report must have at least one test.");
      return;
    }

    const matchedTests: Test[] = newTestIds.map((id) => {
      const found = tests.find(t => t.id === id);
      if (found) return found;
      // Fallback: try to find in existing parsedTestData.tests
      const existing = (parsedTestData?.tests || []).find((t: any) => (t.testId || t.id) === id);
      if (existing) {
        return {
          id,
          test_name: existing.testName || existing.test_name || `Test ${id.slice(0, 8)}`,
          category: existing.testType || existing.category || 'General',
        } as unknown as Test;
      }
      return {
        id,
        test_name: `Test ${id.slice(0, 8)}`,
        category: 'General',
      } as unknown as Test;
    });
    const newReportType = matchedTests.map((t) => t.test_name).join(', ');

    const { amount: newAmount, snapshot: resolvedSnapshot } = await resolvePricingForTestIds(newTestIds);

    const updatedTestData = {
      ...parsedTestData,
      testIds: newTestIds,
      testName: newReportType,
      testType: matchedTests.map((t) => t.category || 'General').join(', '),
      tests: (parsedTestData?.tests || []).filter((t: any) => newTestIds.includes(t.testId || t.id)),
      parameters: (parsedTestData?.parameters || []).filter((p: any) => {
        const paramTestId = dynamicParams.find(dp => dp.name === p.name)?.test_id;
        return paramTestId ? newTestIds.includes(paramTestId) : true;
      })
    };

    const updatedReport = {
      ...selectedReport,
      report_type: newReportType,
      report_amount: newAmount,
      test_data: updatedTestData,
      pricing_snapshot: resolvedSnapshot.length > 0 ? resolvedSnapshot : selectedReport.pricing_snapshot,
    };

    if (activeTestId === testId) {
      if (newTestIds.length > 0) {
        setActiveTestId(newTestIds[0]);
      } else {
        setActiveTestId(null);
      }
    }

    setSelectedReport(updatedReport);
    setTestName(newReportType);
    setReportAmount(newAmount);
    setBaseAmount(newAmount);

    if (reportId) {
      try {
        const success = await updateReport(reportId, {
          report_type: newReportType,
          report_amount: newAmount,
          base_amount: newAmount,
          final_amount: newAmount,
          test_data: updatedTestData,
          pricing_items: resolvedSnapshot.length > 0 ? resolvedSnapshot : selectedReport.pricing_snapshot,
        });
        if (success) {
          toast.success("Test removed successfully.");
          await fetchReportById(reportId);
        } else {
          toast.error("Failed to update test list in database.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error saving updated test list to server.");
      }
    }
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
        const isMicroscopic = isMicroscopicRangeHigh(param.name, valStr);
        const testCode = tests.find(t => t.id === param.test_id)?.test_code;
        if (isQualitativeValueHigh(valStr, param.name, param.options, testCode, selectedReport?.report_type)) {
          newStatuses[param.id] = "high";
        } else if (isMicroscopic) {
          newStatuses[param.id] = "high";
        } else {
          newStatuses[param.id] = "normal";
        }
        return;
      }

      // Text fields don't have numeric ranges — flag high microscopic text ranges
      if (param.input_type === 'text') {
        if (isMicroscopicRangeHigh(param.name, valStr)) {
          newStatuses[param.id] = "high";
        } else {
          newStatuses[param.id] = "normal";
        }
        return;
      }

      const val = parseFloat(valStr);
      if (isNaN(val)) {
        newStatuses[param.id] = "empty";
        return;
      }

      // Resolve reference range for the patient (respecting custom overrides)
      const range = customReferenceRanges[param.id] !== undefined
        ? parseCustomReferenceRange(customReferenceRanges[param.id])
        : getPatientReferenceRange(param, patient);

      // Check thresholds
      if (range.low != null && val < range.low) {
        newStatuses[param.id] = "low";
      } else if (range.high != null && val > range.high) {
        newStatuses[param.id] = "high";
      } else {
        newStatuses[param.id] = "normal";
      }
    });

    // Apply manual high flags — override auto-computed status
    for (const [paramId, isManualHigh] of Object.entries(manualFlags)) {
      if (isManualHigh && newStatuses[paramId] !== undefined) {
        newStatuses[paramId] = "high";
      }
    }

    setStatuses(newStatuses);
  }, [values, dynamicParams, patient, tests, selectedReport, customReferenceRanges, manualFlags]);

  const getStatusBadge = (
    status: "low" | "high" | "normal" | "critical" | "empty" | undefined,
  ) => {
    const styles = {
      low: {
        bg: "var(--success)",
        text: "var(--success-foreground)",
      },
      high: {
        bg: "var(--destructive)",
        text: "var(--destructive-foreground)",
      },
      critical: {
        bg: "var(--destructive)",
        text: "var(--destructive-foreground)",
      },
      normal: {
        bg: "var(--info)",
        text: "var(--info-foreground)",
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
      "w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 transition-colors text-left tabular-nums";

    if (status === "low") {
      return `${base} border-success bg-success/5 text-foreground focus:border-success focus:ring-success`;
    } else if (status === "high") {
      return `${base} border-destructive bg-destructive/5 text-foreground focus:border-destructive focus:ring-destructive`;
    } else if (status === "critical") {
      return `${base} border-destructive bg-destructive/5 text-foreground focus:border-destructive focus:ring-destructive`;
    } else if (status === "normal") {
      return `${base} border-info bg-info/5 text-foreground focus:border-info focus:ring-info`;
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

  // Build a map: paramId → groupLabel, and compute the running sum per group.
  const sumValidation = useMemo(() => {
    const paramToGroup: Record<string, string> = {};
    const groupSums: Record<string, { sum: number; hasAnyValue: boolean; paramIds: string[] }> = {};

    for (const group of SUM_100_GROUPS) {
      const lowerNames = group.paramNames.map(n => n.toLowerCase());
      const matchingParams = dynamicParams.filter(
        p => p.unit === '%' && p.input_type === 'number' && p.field_type !== 'calculated' && lowerNames.includes(p.name.toLowerCase())
      );

      if (matchingParams.length === 0) continue;

      let sum = 0;
      let hasAnyValue = false;
      const paramIds: string[] = [];

      for (const mp of matchingParams) {
        paramToGroup[mp.id] = group.label;
        paramIds.push(mp.id);
        const raw = values[mp.id];
        if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
          const num = parseFloat(String(raw));
          if (!isNaN(num)) {
            sum += num;
            hasAnyValue = true;
          }
        }
      }

      groupSums[group.label] = { sum: Math.round(sum * 100) / 100, hasAnyValue, paramIds };
    }

    return { paramToGroup, groupSums };
  }, [dynamicParams, values]);

  // Helper: check if a param belongs to a sum-100 group that is currently invalid
  const isParamInInvalidSumGroup = useCallback((paramId: string) => {
    const groupLabel = sumValidation.paramToGroup[paramId];
    if (!groupLabel) return false;
    const group = sumValidation.groupSums[groupLabel];
    if (!group || !group.hasAnyValue) return false;
    return group.sum !== 100;
  }, [sumValidation]);

  // Helper: check if a field outside the invalid sum-100 group should be blocked
  const isFieldBlockedBySum100 = useCallback((paramId: string) => {
    for (const [groupLabel, groupInfo] of Object.entries(sumValidation.groupSums)) {
      if (groupInfo.hasAnyValue && groupInfo.sum !== 100) {
        if (!groupInfo.paramIds.includes(paramId)) {
          return true;
        }
      }
    }
    return false;
  }, [sumValidation]);

  const hasAnyInvalidSumGroup = useMemo(() => {
    return Object.values(sumValidation.groupSums).some(
      group => group.hasAnyValue && group.sum !== 100
    );
  }, [sumValidation]);

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
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      moveParameterFocus(fieldId, event.shiftKey ? -1 : 1);
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
      remarks: testRemarks[section.testId] || '',
      parameters: section.params.map(param => {
        const localStatus = statuses[param.id];
        const mappedStatus = localStatus === 'empty' ? undefined : localStatus as 'normal' | 'high' | 'low' | 'critical' | undefined;
        const rawValue = values[param.id];

        const value = rawValue !== undefined && rawValue !== ''
          ? ((param.input_type === 'text' || param.input_type === 'select' || param.input_type === 'textarea') ? rawValue : parseFloat(rawValue))
          : null;

        const resolvedRange = getPatientReferenceRange(param, patient);

        return {
          name: param.name,
          value,
          unit: param.unit,
          referenceRange: customReferenceRanges[param.id] !== undefined
            ? customReferenceRanges[param.id]
            : formatReferenceRange(resolvedRange),
          status: mappedStatus,
          fieldType: param.field_type,
          group: param.section_group || undefined,
          manualFlag: manualFlags[param.id] ? 'high' : undefined,
        };
      }),
    }));

    // Also build flat parameters list for backward compatibility
    const allParameters = groupedTests.flatMap(g => g.parameters);

    let existingApprovals = {};
    try {
      const rawTd = selectedReport?.test_data;
      const parsedTd = typeof rawTd === 'string' ? JSON.parse(rawTd) : (rawTd || {});
      existingApprovals = parsedTd.test_approvals || {};
    } catch (e) {
      existingApprovals = {};
    }

    return {
      testName,
      testType: selectedReport?.test_data?.testType || 'General',
      testIds,
      tests: groupedTests,
      parameters: allParameters,
      remarks: technicianNotes,
      test_approvals: existingApprovals,
      testRemarks,
      attachments,
    };
  };

  const approvedHasChanges = useMemo(() => {
    if (reportStatus !== 'approved' || !selectedReport) {
      return false;
    }

    const currentDoctorId = selectedDoctor?.id || null;
    const currentStaffId = selectedStaffId || null;
    const currentRefDoctor = !selectedDoctor && referringDoctorName ? referringDoctorName : null;
    const currentIsSelfReport = !selectedDoctor && !referringDoctorName;
    const currentTestData = buildTestData();

    const patientChanged = !!patient && (
      patient.name !== (selectedReport.patient_name || '') ||
      (patient.phone || '') !== (selectedReport.patient_phone || '') ||
      (patient.gender || '') !== (selectedReport.patient_gender || '') ||
      !sameNumberish(patient.age, selectedReport.patient_age) ||
      normalizeAgeUnit(patient.age_unit) !== normalizeAgeUnit(selectedReport.patient_age_unit)
    );

    const reportChanged =
      technicianNotes !== (selectedReport.clinical_notes || '') ||
      currentDoctorId !== (selectedReport.doctor_id || null) ||
      currentStaffId !== (selectedReport.staff_id || null) ||
      currentRefDoctor !== (selectedReport.referring_doctor_name || null) ||
      currentIsSelfReport !== !!selectedReport.is_self_report ||
      testName !== (selectedReport.report_type || '') ||
      !sameNumberish(reportAmount, selectedReport.report_amount) ||
      !sameNumberish(baseAmount, selectedReport.base_amount) ||
      (labDiscountType || 'percent') !== (selectedReport.lab_discount_type || 'percent') ||
      !sameNumberish(labDiscountValue, selectedReport.lab_discount_value) ||
      !sameNumberish(doctorDiscount, selectedReport.doctor_discount) ||
      !sameNumberish(finalAmount, selectedReport.final_amount) ||
      stableSerialize(currentTestData) !== stableSerialize(selectedReport.test_data || {}) ||
      stableSerialize(pricingSnapshot || []) !== stableSerialize(selectedReport.pricing_snapshot || []);

    return patientChanged || reportChanged;
  }, [
    reportStatus,
    selectedReport,
    selectedDoctor,
    selectedStaffId,
    referringDoctorName,
    technicianNotes,
    testName,
    reportAmount,
    baseAmount,
    labDiscountType,
    labDiscountValue,
    doctorDiscount,
    finalAmount,
    pricingSnapshot,
    patient,
    values,
    statuses,
    dynamicParams,
    testSections,
    testRemarks,
    customReferenceRanges,
    attachments,
  ]);

  const saveCurrentReportData = async () => {
    if (!reportId) {
      toast.error("No report ID available. Please create a report first.");
      return false;
    }

    if (reportStatus === 'approved' && !approvedHasChanges) {
      return true;
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
      doctor_id: selectedDoctor?.id || null,
      staff_id: selectedStaffId || null,
      referring_doctor_name: !selectedDoctor && referringDoctorName ? referringDoctorName : null,
      is_self_report: !selectedDoctor && !referringDoctorName,
      test_data: testData,
      report_type: testName,
      report_amount: reportAmount,
      base_amount: baseAmount,
      final_amount: reportAmount,
      pricing_items: selectedReport?.pricing_snapshot || [],
      b2b_lab_id: isB2B && selectedB2BLabId ? selectedB2BLabId : null,
      b2b_charge: isB2B && b2bCharge ? parseFloat(b2bCharge) : 0,
    });

    if (!result) {
      toast.error(reportError || "Failed to save report data. Please try again.");
      return false;
    }

    await saveBilling(reportId);
    setLastSaved(new Date());
    return true;
  };

  const handleMarkSampleReceived = async (status: 'received' | 'partial' | 'pending' = 'received') => {
    if (!selectedReport) return;
    try {
      if (selectedReport.sample_id) {
        await sampleApi.update(selectedReport.sample_id, { status: status === 'received' ? 'received' : 'processing' });
      }
      if (reportId) {
        await updateReport(reportId, { sample_status: status });
      }
      // Update selectedReport inside the reportStore instantly
      useReportStore.setState((state) => ({
        selectedReport: state.selectedReport 
          ? { ...state.selectedReport, sample_status: status } 
          : null,
        // Also update in the list of reports if they are there
        reports: state.reports.map((r) => 
          r.id === selectedReport.id ? { ...r, sample_status: status } : r
        )
      }));
      toast.success(
        status === 'received' 
          ? "All samples marked as received!" 
          : status === 'partial' 
          ? "Partial sample reception saved." 
          : "Sample status updated to pending."
      );
    } catch (err) {
      console.error('Failed to mark sample as received:', err);
      toast.error("Failed to mark sample as received");
    }
  };

  const handleSavePatientDetails = async () => {
    if (!patient) return;
    try {
      const updatedPat = await updatePatient(patient.id, {
        name: patient.name,
        phone: patient.phone,
        gender: patient.gender,
        age: patient.age,
        age_unit: patient.age != null ? normalizeAgeUnit(patient.age_unit) : undefined,
      });

      if (!updatedPat) {
        toast.error("Failed to update patient details");
        return;
      }

      if (reportId) {
        const result = await updateReport(reportId, {
          doctor_id: selectedDoctor?.id || null,
          staff_id: selectedStaffId || null,
          referring_doctor_name: !selectedDoctor && referringDoctorName ? referringDoctorName : null,
          is_self_report: !selectedDoctor && !referringDoctorName,
          b2b_lab_id: isB2B && selectedB2BLabId ? selectedB2BLabId : null,
          b2b_charge: isB2B && b2bCharge ? parseFloat(b2bCharge) : 0,
        });

        if (!result) {
          toast.error("Failed to update doctor details on report");
          return;
        }

        const refreshedReport = await fetchReportById(reportId);
        if (refreshedReport && refreshedReport.patient_name) {
          setPatient({
            id: refreshedReport.patient_id,
            name: refreshedReport.patient_name || '',
            phone: refreshedReport.patient_phone || '',
            gender: refreshedReport.patient_gender || '',
            age: refreshedReport.patient_age,
            age_unit: normalizeAgeUnit(refreshedReport.patient_age_unit),
            address: '',
            branch_id: '',
            created_by: '',
            created_at: '',
            updated_at: '',
          });
        }
      }

      toast.success("Patient details saved successfully");
      setShowEditPatientModal(false);
    } catch (err) {
      toast.error("An error occurred while saving patient details");
      console.error(err);
    }
  };

  const handleConfirmRemoveTest = (testId: string, testName: string) => {
    if (!canRemoveTest) {
      toast.error("You do not have permission to remove tests from a report.");
      return;
    }
    setTestIdToRemove(testId);
    setConfirmModal({
      isOpen: true,
      title: 'Remove Test',
      message: `Are you sure you want to remove "${testName}"?\n\nAny unsaved results entered for this test will be lost.`,
      type: 'danger',
    });
  };

  // Save draft functionality - saves to backend and goes ahead to next test
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
      if (reportStatus === 'approved' && !approvedHasChanges) {
        toast.info("No changes to update.");
        return;
      }
      const saved = await saveCurrentReportData();
      if (saved) {
        toast.success(reportStatus === 'approved' ? "Report updated successfully" : "Draft saved successfully");
        
        // Go ahead to next test if available
        const currentIndex = testSections.findIndex(s => s.testId === activeTestId);
        if (currentIndex < testSections.length - 1) {
          setActiveTestId(testSections[currentIndex + 1].testId);
        } else {
          toast.info("Saved! You are at the last test.");
        }
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save and exit functionality - saves to backend and returns to reports list
  const handleSaveAndExit = async () => {
    if (!isEditable || !reportId) {
      navigate('/app/reports');
      return;
    }

    setIsSaving(true);
    try {
      if (reportStatus === 'approved' && !approvedHasChanges) {
        navigate('/app/reports');
        return;
      }
      const saved = await saveCurrentReportData();
      if (saved) {
        toast.success(reportStatus === 'approved' ? "Report updated successfully" : "Draft saved successfully");
        navigate('/app/reports');
      }
    } catch (error) {
      console.error("Failed to save draft on exit:", error);
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
        navigate('/app/reports');
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

  const handleApproveCurrentTest = async () => {
    if (!reportId || !activeSection) return;
    setIsSubmitting(true);
    try {
      await saveCurrentReportData();
      const res = await approveTest(reportId, activeSection.testId);
      if (res) {
        toast.success(`${activeSection.testName} approved successfully!`);
        await fetchReportById(reportId);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to approve test");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCurrentTestForApproval = async () => {
    if (!reportId || !activeSection) return;
    setIsSubmitting(true);
    try {
      await saveCurrentReportData();
      const res = await sendTestForApproval(reportId, activeSection.testId);
      if (res) {
        toast.success(`${activeSection.testName} sent for approval!`);
        await fetchReportById(reportId);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to send test for approval");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAllForApproval = async () => {
    if (!reportId) return;
    setIsSubmitting(true);
    try {
      await saveCurrentReportData();
      const res = await sendAllTestsForApproval(reportId);
      if (res) {
        toast.success("All tests sent for approval!");
        await fetchReportById(reportId);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to send tests for approval");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshReport = async () => {
    if (!reportId) return;
    try {
      await fetchReportById(reportId);
      toast.success("Report refreshed");
    } catch (e) {
      toast.error("Failed to refresh report");
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
        doctor_id: selectedDoctor?.id || null,
        referring_doctor_name: !selectedDoctor && referringDoctorName ? referringDoctorName : null,
        is_self_report: !selectedDoctor && !referringDoctorName,
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

  const handleSaveDraftRef = useRef(handleSaveDraft);
  handleSaveDraftRef.current = handleSaveDraft;

  const handleSaveAndExitRef = useRef(handleSaveAndExit);
  handleSaveAndExitRef.current = handleSaveAndExit;

  const handleSubmitForReviewRef = useRef(handleSubmitForReview);
  handleSubmitForReviewRef.current = handleSubmitForReview;

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditable) handleSaveDraftRef.current();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isEditable) handleSubmitForReviewRef.current();
      }
      if (e.key === 'F10') {
        e.preventDefault();
        if (isEditable) handleSaveDraftRef.current();
      }
      if (e.key === 'Escape') {
        // Guard: check if any modals or dropdowns are active/open
        if (
          showEditPatientModal ||
          showAddTestModal ||
          showHistoryModal ||
          confirmModal.isOpen ||
          showDoctorDropdown ||
          showTestDropdown
        ) {
          return;
        }

        e.preventDefault();
        handleSaveAndExitRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showEditPatientModal,
    showAddTestModal,
    showHistoryModal,
    confirmModal,
    showDoctorDropdown,
    showTestDropdown,
  ]);

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
        refRange: customReferenceRanges[p.id] !== undefined
          ? customReferenceRanges[p.id]
          : formatReferenceRange(resolvedRange),
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
        referringDoctor: selectedDoctor
          ? `${selectedDoctor.title || 'Dr'}. ${selectedDoctor.name}`
          : referringDoctorName
            ? (referringDoctorName.toLowerCase().startsWith('dr') ? referringDoctorName : `Dr. ${referringDoctorName}`)
            : 'Self',
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

    navigate(`/app/reports/preview/${reportId || patient.id}`, {
      state: { reportData }
    });
  };

  const handlePrevTest = () => {
    const currentIndex = testSections.findIndex(s => s.testId === activeTestId);
    if (currentIndex > 0) {
      setActiveTestId(testSections[currentIndex - 1].testId);
    }
  };

  const handleNextTest = () => {
    const currentIndex = testSections.findIndex(s => s.testId === activeTestId);
    if (currentIndex < testSections.length - 1) {
      setActiveTestId(testSections[currentIndex + 1].testId);
    }
  };



  const handleOpenHistory = async () => {
    if (!patient) return;
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await reportApi.getByPatient(patient.id);
      if (res && res.data) {
        const filtered = res.data.filter(r => r.id !== reportId);
        setHistoryReports(filtered);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load patient history.");
    } finally {
      setHistoryLoading(false);
    }
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

  // Calculate initials for the avatar badge
  const patientInitials = patient?.name
    ? patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PT';

  // Format collection date
  const formattedCollectionDate = selectedReport?.created_at
    ? format(new Date(selectedReport.created_at), "dd MMM yyyy, hh:mm a")
    : format(new Date(), "dd MMM yyyy, hh:mm a");

  // Get active test section (defined above)

  // Helper to compute summary counts
  const summaryCounts = {
    total: testSections.length,
    completed: Object.values(sectionCompletion).filter(c => c.done).length,
    inProgress: Object.values(sectionCompletion).filter(c => c.filled > 0 && !c.done).length,
    pending: Object.values(sectionCompletion).filter(c => c.filled === 0).length,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-76px)] overflow-hidden space-y-2.5 w-full px-1.5 sm:px-2 pb-1.5 bg-slate-50/50 dark:bg-slate-950/20">
      {/* Non-editable warning banner */}
      {!isEditable && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-warning" />
          <span className="text-sm text-warning">
            This report is in <strong>{reportStatus}</strong> status and cannot be edited.
            {reportStatus === 'under_review' && ' It is awaiting approval from a doctor.'}
          </span>
        </div>
      )}

      {/* Rejection reason banner */}
      {reportStatus === 'rejected' && selectedReport?.rejection_reason && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
          <div>
            <span className="text-sm font-medium text-destructive">Report Rejected</span>
            <p className="text-sm text-destructive/80 mt-1">{selectedReport.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* Compact Patient Header (60px) */}
      <PatientInfoHeader
        patient={patient}
        selectedReport={selectedReport}
        selectedDoctor={selectedDoctor}
        referringDoctorName={referringDoctorName}
        formattedCollectionDate={formattedCollectionDate}
        isEditable={isEditable}
        onBack={handleSaveAndExit}
        onEditPatient={() => setShowEditPatientModal(true)}
        onAddTest={() => setShowAddTestModal(true)}
        onOpenHistory={handleOpenHistory}
        patientInitials={patientInitials}
        formatAge={formatAge}
        onMarkSampleReceived={() => setIsSampleReceptionModalOpen(true)}
        onPrintSampleBarcodes={() => setIsBarcodeModalOpen(true)}
      />

      {/* Three Column Workbench Grid */}
      <div className="flex-1 h-0 min-h-0 grid grid-cols-1 lg:grid-cols-[16%_61%_21%] gap-3 items-stretch overflow-hidden">
        {/* Left Column: Plain list of tests */}
        <div className="hidden lg:flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm h-full flex-col overflow-hidden">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1 flex-shrink-0">Tests</h3>
          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
            {testSections.map((section) => {
              const isActive = section.testId === activeTestId;
              const approval = (parsedTestData?.test_approvals || {})[section.testId];
              return (
                <div
                  key={section.testId}
                  onClick={() => setActiveTestId(section.testId)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      approval?.status === 'approved'
                        ? 'bg-emerald-500'
                        : approval?.status === 'under_review' || approval?.status === 'pending_approval'
                        ? 'bg-amber-500'
                        : approval?.status === 'rejected'
                        ? 'bg-rose-500'
                        : isActive ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                    }`} />
                    <span className="truncate">{section.testName}</span>
                  </div>
                  {approval?.status === 'approved' && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold ml-1">✓</span>
                  )}
                  {approval?.status === 'rejected' && (
                    <span className="text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold ml-1">✗</span>
                  )}
                  {isEditable && canRemoveTest && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmRemoveTest(section.testId, section.testName);
                      }}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex-shrink-0 cursor-pointer ml-1"
                      title="Remove test"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            {testSections.length === 0 && (
              <p className="text-xs text-muted-foreground p-2 italic text-center">No tests selected</p>
            )}
          </div>
        </div>

        {/* Center Column: Parameter entry table */}
        <div className="h-full flex flex-col overflow-hidden gap-2">
          {/* Mobile/Tablet Test Selector */}
          {testSections.length > 0 && (
            <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1.5 px-1 flex-shrink-0 scrollbar-none">
              {testSections.map((section) => {
                const isActive = section.testId === activeTestId;
                return (
                  <div
                    key={section.testId}
                    onClick={() => setActiveTestId(section.testId)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border cursor-pointer transition-all ${isActive
                        ? 'bg-primary border-primary text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <span>{section.testName}</span>
                    {isEditable && canRemoveTest && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmRemoveTest(section.testId, section.testName);
                        }}
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${isActive
                            ? 'hover:bg-white/20 text-white/80 hover:text-white'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeSection ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm h-full flex flex-col min-h-0">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Microscope className="w-4 h-4 text-primary flex-shrink-0" />
                  <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{activeSection.testName}</h2>
                  {activeSection.testCode && (
                    <span className="text-[10px] font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                      {activeSection.testCode}
                    </span>
                  )}
                  {(() => {
                    const approval = (parsedTestData?.test_approvals || {})[activeSection.testId];
                    if (approval?.status === 'approved') return <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold flex-shrink-0">Approved</span>;
                    if (approval?.status === 'under_review' || approval?.status === 'pending_approval') return <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold flex-shrink-0">In Review</span>;
                    if (approval?.status === 'rejected') return <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold flex-shrink-0">Rejected</span>;
                    return null;
                  })()}
                </div>



                {/* Mobile/Tablet Sub-Tab Switcher */}
                <div className="lg:hidden flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-white dark:bg-slate-950 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('results')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${activeSubTab === 'results'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                  >
                    Results
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('notes')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${activeSubTab === 'notes'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                  >
                    Notes & AI
                  </button>
                </div>

                {/* Status legend */}
                <div className="hidden sm:flex items-center gap-4 text-[10px] text-slate-600 dark:text-slate-500 justify-end px-1 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-info font-bold">↓</span> Low
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-success font-bold">✓</span> Normal
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-destructive font-bold">↑</span> High
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 overflow-x-auto">
                {activeSubTab === 'results' ? (
                  <table className={`w-full table-fixed text-[11px] md:text-[12px] border-collapse ${hasPreviousData ? 'min-w-[680px]' : 'min-w-[500px]'} lg:min-w-0`}>
                    {hasPreviousData ? (
                      <colgroup>
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "22%" }} />
                        <col style={{ width: "10%" }} />
                      </colgroup>
                    ) : (
                      <colgroup>
                        <col style={{ width: "28%" }} />
                        <col style={{ width: "28%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "24%" }} />
                        <col style={{ width: "10%" }} />
                      </colgroup>
                    )}
                    <thead className="bg-slate-50/70 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-slate-800 dark:text-slate-100 font-bold uppercase tracking-wider text-[15px]">Parameter</th>
                        {hasPreviousData && (
                          <th className="px-3 py-2.5 text-center text-slate-800 dark:text-slate-100 font-bold uppercase tracking-wider text-[15px]" title="Previous History">
                            <History className="w-4 h-4 mx-auto text-slate-500" />
                          </th>
                        )}
                        <th className="px-3 py-2.5 text-left text-slate-800 dark:text-slate-100 font-bold uppercase tracking-wider text-[15px]">Result</th>
                        <th className="px-3 py-2.5 text-left text-slate-800 dark:text-slate-100 font-bold uppercase tracking-wider text-[15px]">Unit</th>
                        <th className="px-3 py-2.5 text-left text-slate-800 dark:text-slate-100 font-bold uppercase tracking-wider text-[15px]">Reference Range</th>
                        <th className="px-3 py-2.5 text-center text-slate-800 dark:text-slate-100 font-bold uppercase tracking-wider text-[15px]">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-background">
                      {(() => {
                        const renderedSumAlerts = new Set<string>();
                        return activeSection.params.map((param, paramIndex) => {
                          const groupLabel = sumValidation.paramToGroup[param.id];
                          const groupInfo = groupLabel ? sumValidation.groupSums[groupLabel] : null;
                          const isInInvalidGroup = isParamInInvalidSumGroup(param.id);

                          let showSumAlert = false;
                          if (groupLabel && groupInfo && !renderedSumAlerts.has(groupLabel)) {
                            const remainingGroupParams = activeSection.params.slice(paramIndex + 1).filter(
                              p => sumValidation.paramToGroup[p.id] === groupLabel
                            );
                            if (remainingGroupParams.length === 0) {
                              showSumAlert = true;
                              renderedSumAlerts.add(groupLabel);
                            }
                          }

                          return (
                            <Fragment key={param.id}>
                              <tr className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${isInInvalidGroup ? 'bg-amber-500/5' : ''}`}>
                                <td className="px-3 py-1 align-middle text-slate-800 dark:text-slate-200">
                                  <div className="font-bold text-sm leading-tight break-words flex flex-wrap items-center gap-1.5">
                                    <span>{param.name}</span>
                                    {param.field_type === 'calculated' && (
                                      <span className="inline-flex items-center rounded bg-primary/10 px-1 py-0.5 text-[8px] font-bold text-primary uppercase tracking-wide">calc</span>
                                    )}
                                    {isInInvalidGroup && (
                                      <span className="inline-flex items-center rounded bg-amber-500/15 px-1 py-0.5 text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Σ≠100</span>
                                    )}
                                  </div>
                                </td>
                                {hasPreviousData && (
                                  <td className="px-3 py-1 align-middle text-center text-slate-600 dark:text-slate-400 text-xs">
                                    {(() => {
                                      const key = `${activeSection.testId}::${param.name}`;
                                      const prev = previousValues[key];
                                      if (!prev) return <span className="text-slate-300">—</span>;

                                      const currentVal = parseFloat(values[param.id]);
                                      const prevVal = parseFloat(String(prev.value));

                                      if (isNaN(prevVal)) {
                                        // Non-numeric previous value
                                        return (
                                          <span
                                            className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold cursor-default"
                                            title={`Previous: ${prev.value} (${format(new Date(prev.date), 'dd MMM yyyy')})`}
                                          >
                                            {prev.value}
                                          </span>
                                        );
                                      }

                                      const diff = isNaN(currentVal) ? null : currentVal - prevVal;
                                      const arrow = diff === null ? '' : diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
                                      const arrowColor = diff === null ? '' : diff > 0 ? 'text-emerald-500 font-bold' : diff < 0 ? 'text-rose-500 font-bold' : 'text-slate-400';

                                      return (
                                        <span
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold cursor-default"
                                          title={`Previous: ${prev.value} on ${format(new Date(prev.date), 'dd MMM yyyy')}${diff !== null ? `\nChange: ${diff > 0 ? '+' : ''}${Math.round(diff * 100) / 100}` : ''}`}
                                        >
                                          <span>{prev.value}</span>
                                          {arrow && <span className={`${arrowColor} font-bold text-xs`}>{arrow}</span>}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                )}
                                <td className="px-3 py-1 align-middle">
                                  {param.input_type === 'select' ? (
                                    <SmartSelectInput
                                      ref={(node) => {
                                        inputRefs.current[param.id] = node;
                                      }}
                                      className={`${getInputClass(statuses[param.id])} h-8 text-xs${param.field_type === 'calculated' ? ' bg-primary/5 cursor-not-allowed' : ''}${isInInvalidGroup ? ' !ring-1 !ring-amber-500 !border-amber-500' : ''}${isFieldBlockedBySum100(param.id) ? ' opacity-40 bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed' : ''} !text-left bg-background !py-0`}
                                      value={values[param.id] !== undefined && values[param.id] !== null ? values[param.id] : (param.is_mandatory !== false && param.name.toLowerCase() !== 'remark' ? (param.options ? param.options.split(',')[0].trim() : "Negative") : "")}
                                      onChange={(val) => handleValueChange(param.id, val)}
                                      onKeyDown={(event) => handleParameterKeyDown(event, param.id, param.input_type)}
                                      tabIndex={param.field_type === 'calculated' || isFieldBlockedBySum100(param.id) ? -1 : fieldTabOrder[param.id]}
                                      disabled={!isEditable || isFieldBlockedBySum100(param.id)}
                                      options={param.options ? param.options.split(',').map((opt: string) => opt.trim()) : ["Negative", "Positive"]}
                                    />
                                  ) : param.input_type === 'textarea' ? (
                                    <div className="relative py-1">
                                      <textarea
                                        ref={(node) => {
                                          inputRefs.current[param.id] = node;
                                        }}
                                        className={`${getInputClass(statuses[param.id])} min-h-[4rem] py-1 px-2 text-xs w-full resize-y font-normal bg-background${isFieldBlockedBySum100(param.id) ? ' opacity-40 bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed' : ''}`}
                                        placeholder="Enter description..."
                                        value={values[param.id] || ""}
                                        onChange={(e) => handleValueChange(param.id, e.target.value)}
                                        onFocus={() => setActiveTextareaId(param.id)}
                                        onBlur={() => {
                                          setTimeout(() => {
                                            if (!isHoveringTextareaDropdown.current) {
                                              setActiveTextareaId(prev => prev === param.id ? null : prev);
                                            }
                                          }, 150);
                                        }}
                                        onKeyDown={(event) => handleParameterKeyDown(event, param.id, param.input_type)}
                                        tabIndex={isFieldBlockedBySum100(param.id) ? -1 : fieldTabOrder[param.id]}
                                        disabled={!isEditable || isFieldBlockedBySum100(param.id)}
                                      />
                                      {param.options && activeTextareaId === param.id && (
                                        (() => {
                                          const currentVal = values[param.id] || '';
                                          const lastPart = currentVal.split(/,\s*/).pop()?.trim() || '';
                                          const filteredOpts = param.options.split(',').filter(opt =>
                                            !lastPart || opt.toLowerCase().includes(lastPart.toLowerCase())
                                          );

                                          if (filteredOpts.length === 0) return null;

                                          return createPortal(
                                            <div
                                              onMouseEnter={() => { isHoveringTextareaDropdown.current = true; }}
                                              onMouseLeave={() => {
                                                isHoveringTextareaDropdown.current = false;
                                                if (document.activeElement !== inputRefs.current[param.id]) {
                                                  setActiveTextareaId(null);
                                                }
                                              }}
                                              className="fixed z-[9999] w-52 max-h-[80vh] overflow-y-auto rounded-lg border border-neutral-800 bg-[#1E1B18] text-white shadow-xl pointer-events-auto"
                                              style={{
                                                top: textareaCoords.top,
                                                left: textareaCoords.left,
                                              }}
                                            >
                                              {/* Popover Arrow */}
                                              {textareaAlignLeft ? (
                                                <div className={`absolute left-full w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-[#1E1B18] ${textareaAlignBottom ? 'bottom-2.5' : 'top-2.5'}`} />
                                              ) : (
                                                <div className={`absolute right-full w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-[#1E1B18] ${textareaAlignBottom ? 'bottom-2.5' : 'top-2.5'}`} />
                                              )}

                                              <ul className="py-1.5 px-1.5 space-y-0.5">
                                                {filteredOpts.map((opt: string) => (
                                                  <li
                                                    key={opt}
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
                                                      setTimeout(() => {
                                                        const textareaEl = inputRefs.current[param.id];
                                                        if (textareaEl) {
                                                          textareaEl.focus();
                                                        }
                                                      }, 0);
                                                    }}
                                                    className="px-3 py-2 cursor-pointer text-left text-xs leading-tight select-none transition-colors rounded-md text-neutral-300 hover:bg-neutral-800 hover:text-white hover:font-semibold"
                                                  >
                                                    {opt}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>,
                                            document.body
                                          ) as any;
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
                                      className={`${getInputClass(statuses[param.id])} h-8 text-xs${param.field_type === 'calculated' ? ' bg-primary/5 cursor-not-allowed' : ''}${isInInvalidGroup ? ' !ring-1 !ring-amber-500 !border-amber-500' : ''}${isFieldBlockedBySum100(param.id) ? ' opacity-40 bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed' : ''}`}
                                      placeholder={param.field_type === 'calculated' ? 'Auto' : ''}
                                      value={values[param.id] || ""}
                                      onChange={(e) => handleValueChange(param.id, e.target.value)}
                                      onKeyDown={(event) => handleParameterKeyDown(event, param.id, param.input_type)}
                                      onFocus={(event) => event.currentTarget.select()}
                                      tabIndex={param.field_type === 'calculated' || isFieldBlockedBySum100(param.id) ? -1 : fieldTabOrder[param.id]}
                                      disabled={!isEditable || isFieldBlockedBySum100(param.id)}
                                      readOnly={param.field_type === 'calculated'}
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-1 align-middle text-left text-slate-600 dark:text-slate-400 font-bold text-xs">
                                  {param.unit || '-'}
                                </td>
                                {editingRangeId === param.id ? (
                                  <td className="px-3 py-1 align-middle text-left text-slate-600 dark:text-slate-400 font-bold text-xs break-words min-w-[110px] md:min-w-[140px]">
                                    <div className="flex items-center gap-0.5 md:gap-1 w-full">
                                      <input
                                        type="text"
                                        className="flex-1 min-w-0 h-7 px-1.5 text-xs bg-background border border-primary rounded-md focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-slate-800 dark:text-slate-200"
                                        value={tempRangeValue}
                                        onChange={(e) => setTempRangeValue(e.target.value)}
                                        onBlur={() => setEditingRangeId(null)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveReferenceRange(param.id);
                                          } else if (e.key === 'Escape') {
                                            setEditingRangeId(null);
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSaveReferenceRange(param.id)}
                                        className="p-0.5 md:p-1 rounded-md text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex-shrink-0"
                                        title="Save"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => setEditingRangeId(null)}
                                        className="p-0.5 md:p-1 rounded-md text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex-shrink-0"
                                        title="Cancel"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                ) : (
                                  <td className="px-3 py-1 align-middle text-left text-slate-600 dark:text-slate-400 font-bold text-xs break-words min-w-[140px]">
                                    <div 
                                      className={`group flex items-center justify-between w-full h-full min-h-[1.75rem] gap-1.5 ${isEditable ? 'cursor-pointer hover:text-primary dark:hover:text-primary' : ''}`}
                                      onClick={() => {
                                        if (isEditable) {
                                          setEditingRangeId(param.id);
                                          setTempRangeValue(customReferenceRanges[param.id] !== undefined ? customReferenceRanges[param.id] : formatReferenceRange(getPatientReferenceRange(param, patient)));
                                        }
                                      }}
                                    >
                                      <span className="truncate pr-1 text-left flex-grow min-w-0 select-none">
                                        {(customReferenceRanges[param.id] !== undefined ? customReferenceRanges[param.id] : formatReferenceRange(getPatientReferenceRange(param, patient))) || '\u00A0'}
                                      </span>
                                      {isEditable && (
                                        <Edit2 className="w-3.5 h-3.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all flex-shrink-0 ml-1.5 cursor-pointer" />
                                      )}
                                    </div>
                                  </td>
                                )}
                                <td className="px-3 py-1 align-middle text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {getStatusBadge(statuses[param.id])}
                                    {isEditable && (
                                      <button
                                        type="button"
                                        title={manualFlags[param.id] ? 'Remove manual High flag' : 'Mark as High'}
                                        onClick={() => {
                                          setManualFlags(prev => {
                                            const next = { ...prev };
                                            if (next[param.id]) {
                                              delete next[param.id];
                                            } else {
                                              next[param.id] = true;
                                            }
                                            return next;
                                          });
                                        }}
                                        className={`p-0.5 rounded transition-all cursor-pointer ${
                                          manualFlags[param.id]
                                            ? 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                                            : 'text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400'
                                        }`}
                                      >
                                        <Star 
                                          className={`w-3.5 h-3.5 ${manualFlags[param.id] ? 'fill-current' : ''}`} 
                                          strokeWidth={2.5}
                                        />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {showSumAlert && groupInfo && groupInfo.hasAnyValue && groupInfo.sum !== 100 && (
                                <tr>
                                  <td colSpan={hasPreviousData ? 6 : 5} className="px-0 py-0">
                                    <div className="mx-3 my-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
                                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                      <span className="text-xs font-medium">
                                        {groupLabel} total is <strong className="font-bold">{groupInfo.sum}%</strong> — must equal <strong className="font-bold">100%</strong>.
                                        {groupInfo.sum < 100
                                          ? ` Add ${Math.round((100 - groupInfo.sum) * 100) / 100}% more.`
                                          : ` Remove ${Math.round((groupInfo.sum - 100) * 100) / 100}%.`}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 space-y-4 h-full flex flex-col">
                    {/* Primary Actions for Mobile/Tablet */}
                    <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                      <button
                        onClick={handlePreview}
                        disabled={!patient || Object.keys(values).length === 0}
                        className="w-full h-9 flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-xs font-bold text-blue-600 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        Preview Report ({selectedReport?.preview_count || 0})
                      </button>

                      {(reportStatus === 'draft' || reportStatus === 'rejected') && (
                        <button
                          onClick={handleSubmitForReview}
                          disabled={isSubmitting || !reportId || Object.keys(values).length === 0 || hasAnyInvalidSumGroup}
                          className="w-full h-9 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {reportStatus === 'rejected'
                            ? (canAutoApprove ? 'Re-Approve Report' : 'Resubmit for Review')
                            : (canAutoApprove ? 'Approve Report' : 'Submit for Review')}
                        </button>
                      )}
                    </div>

                                {/* Report Notes Card */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm space-y-1.5 flex flex-col flex-1 min-h-[160px]">
                                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-shrink-0">
                                    Notes: {activeSection?.testName || 'Test'}
                                  </h3>
                                  <textarea
                                    ref={remarksTextareaRef}
                                    className="w-full flex-1 min-h-[100px] border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background dark:bg-slate-950 resize-none"
                                    placeholder="Add test remarks (e.g., non-fasting status)..."
                                    value={activeSection?.testId ? (testRemarks[activeSection.testId] || '') : ''}
                                    onChange={(e) => handleTestRemarksChange(e.target.value)}
                                    onFocus={() => setActiveRemarksFocus(true)}
                                    onBlur={() => {
                                      setTimeout(() => {
                                        if (!isHoveringRemarksDropdown.current) {
                                          setActiveRemarksFocus(false);
                                        }
                                      }, 150);
                                    }}
                                    disabled={!isEditable}
                                  />
                                </div>

                    {/* Attachments Card */}
                    {renderAttachmentsCard()}

                    {/* AI Clinical Significance Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowAiSection((prev) => !prev)}
                        className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 text-left border-b border-slate-100 dark:border-slate-800"
                        aria-expanded={showAiSection}
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                          AI Interpretation
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showAiSection ? 'rotate-90' : ''}`} />
                      </button>

                      {showAiSection && (
                        <div className="p-3 space-y-3">
                          <button
                            onClick={handleGenerateInterpretation}
                            disabled={isGeneratingAI || !reportId || Object.values(values).filter(v => v).length === 0}
                            className="w-full h-8 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {isGeneratingAI ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                Generate Interpretation
                              </>
                            )}
                          </button>

                          {aiInterpretation ? (
                            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                              {aiInterpretation.summary && (
                                <div className="p-2 bg-primary/5 border border-primary/10 rounded-lg">
                                  <p className="text-[9px] text-primary font-bold uppercase tracking-wider mb-0.5">Summary</p>
                                  <p className="text-[11px] text-foreground leading-relaxed">{aiInterpretation.summary}</p>
                                </div>
                              )}
                              {aiInterpretation.keyFindings && (
                                <div className="p-2 bg-warning/5 border border-warning/10 rounded-lg">
                                  <p className="text-[9px] text-warning font-bold uppercase tracking-wider mb-0.5">Key Findings</p>
                                  <p className="text-[11px] text-foreground leading-relaxed">{aiInterpretation.keyFindings}</p>
                                </div>
                              )}
                              {aiInterpretation.clinicalIndications && (
                                <div className="p-2 bg-info/5 border border-info/10 rounded-lg">
                                  <p className="text-[9px] text-info font-bold uppercase tracking-wider mb-0.5">Clinical Indications</p>
                                  <p className="text-[11px] text-foreground leading-relaxed">{aiInterpretation.clinicalIndications}</p>
                                </div>
                              )}
                              {aiInterpretation.recommendation && (
                                <div className="p-2 bg-success/5 border border-success/10 rounded-lg">
                                  <p className="text-[9px] text-success font-bold uppercase tracking-wider mb-0.5">Recommendation</p>
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
                                }}
                                className="w-full h-7 flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg hover:bg-slate-100 transition-colors text-[10px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                              >
                                <FileText className="w-3 h-3" />
                                Copy to Notes
                              </button>
                            </div>
                          ) : !isGeneratingAI ? (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-2">
                              Enter values and click "Generate" to receive AI Clinical insights.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-xs shadow-sm h-full flex items-center justify-center">
              No active test parameter selected. Please choose a test.
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions, Notes, AIInterpretation */}
        <div className="hidden lg:flex h-full flex-col gap-3 overflow-hidden flex-shrink-0">

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm space-y-2 flex-shrink-0">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 px-0.5">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handleRefreshReport}
                className="w-full h-9 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Report
              </button>

              <button
                onClick={handleSaveDraft}
                disabled={isSaving || !reportId}
                className="w-full h-9 flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-xs font-bold text-blue-600 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                {reportStatus === 'approved'
                  ? 'Update Report'
                  : 'Save as Draft'}
              </button>

              <button
                onClick={handlePreview}
                disabled={!patient || Object.keys(values).length === 0}
                className="w-full h-9 flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-xs font-bold text-blue-600 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Preview Report ({selectedReport?.preview_count || 0})
              </button>

              {reportId && isEditable && (
                canAutoApprove ? (
                  <button
                    onClick={handleApproveCurrentTest}
                    disabled={isSubmitting || !activeSection}
                    className="w-full h-9 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Single Test
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleSendCurrentTestForApproval}
                      disabled={isSubmitting || !activeSection}
                      className="w-full h-9 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Test
                    </button>
                    <button
                      onClick={handleSendAllForApproval}
                      disabled={isSubmitting}
                      className="w-full h-9 flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send All
                    </button>
                  </div>
                )
              )}

              {(reportStatus === 'draft' || reportStatus === 'rejected') && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={isSubmitting || !reportId || Object.keys(values).length === 0 || hasAnyInvalidSumGroup}
                  className="w-full h-9 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                  title={hasAnyInvalidSumGroup ? "Resolve sum to 100% validation errors first" : undefined}
                >
                  <CheckCircle className="w-4 h-4" />
                  {reportStatus === 'rejected'
                    ? (canAutoApprove ? 'Re-Approve Full Report' : 'Resubmit Full Report')
                    : (canAutoApprove ? 'Approve Full Report' : 'Submit Full Report')}
                </button>
              )}
            </div>
          </div>

          {/* Attachments Card */}
          {renderAttachmentsCard()}

          {/* Report Notes Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm space-y-1.5 flex flex-col flex-1 min-h-0 overflow-hidden">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-shrink-0">
              Notes: {activeSection?.testName || 'Test'}
            </h3>
            <textarea
              ref={remarksTextareaRef}
              className="w-full flex-1 min-h-[50px] border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background dark:bg-slate-950 resize-none"
              placeholder="Add test remarks (e.g., non-fasting status)..."
              value={activeSection?.testId ? (testRemarks[activeSection.testId] || '') : ''}
              onChange={(e) => handleTestRemarksChange(e.target.value)}
              onFocus={() => setActiveRemarksFocus(true)}
              onBlur={() => {
                setTimeout(() => {
                  if (!isHoveringRemarksDropdown.current) {
                    setActiveRemarksFocus(false);
                  }
                }, 150);
              }}
              disabled={!isEditable}
            />
          </div>

          {/* AI Clinical Significance Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowAiSection((prev) => !prev)}
              className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 text-left border-b border-slate-100 dark:border-slate-800"
              aria-expanded={showAiSection}
            >
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                AI Interpretation
              </span>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showAiSection ? 'rotate-90' : ''}`} />
            </button>

            {showAiSection && (
              <div className="p-3 space-y-3">
                <button
                  onClick={handleGenerateInterpretation}
                  disabled={isGeneratingAI || !reportId || Object.values(values).filter(v => v).length === 0}
                  className="w-full h-8 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {isGeneratingAI ? 'Generating...' : aiInterpretation ? 'Regenerate' : 'Generate AI Report'}
                </button>

                {aiError && (
                  <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0" />
                    <span className="text-[10px] text-destructive leading-tight">{aiError}</span>
                  </div>
                )}

                {aiInterpretation ? (
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {aiInterpretation.summary && (
                      <div className="p-2 bg-primary/5 border border-primary/10 rounded-lg">
                        <p className="text-[9px] text-primary font-bold uppercase tracking-wider mb-0.5">Summary</p>
                        <p className="text-[11px] text-foreground leading-relaxed">{aiInterpretation.summary}</p>
                      </div>
                    )}
                    {aiInterpretation.keyFindings && (
                      <div className="p-2 bg-warning/5 border border-warning/10 rounded-lg">
                        <p className="text-[9px] text-warning font-bold uppercase tracking-wider mb-0.5">Key Findings</p>
                        <p className="text-[11px] text-foreground leading-relaxed">{aiInterpretation.keyFindings}</p>
                      </div>
                    )}
                    {aiInterpretation.clinicalIndications && (
                      <div className="p-2 bg-info/5 border border-info/10 rounded-lg">
                        <p className="text-[9px] text-info font-bold uppercase tracking-wider mb-0.5">Clinical Indications</p>
                        <p className="text-[11px] text-foreground leading-relaxed">{aiInterpretation.clinicalIndications}</p>
                      </div>
                    )}
                    {aiInterpretation.recommendation && (
                      <div className="p-2 bg-success/5 border border-success/10 rounded-lg">
                        <p className="text-[9px] text-success font-bold uppercase tracking-wider mb-0.5">Recommendation</p>
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
                      }}
                      className="w-full h-7 flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg hover:bg-slate-100 transition-colors text-[10px] font-bold text-slate-600 dark:text-slate-300"
                    >
                      <FileText className="w-3 h-3" />
                      Copy to Notes
                    </button>
                  </div>
                ) : !isGeneratingAI ? (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-2">
                    Enter values and click "Generate" to receive AI Clinical insights.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Edit Patient Modal */}
      {showEditPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-visible animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
              <h3 className="text-sm font-bold text-foreground">Edit Patient Details</h3>
              <button
                onClick={() => setShowEditPatientModal(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-visible">
              {patient && (
                <div className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Patient Name</label>
                    <input
                      type="text"
                      value={patient.name}
                      onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                      className="w-full h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Age</label>
                      <input
                        type="number"
                        min={0}
                        max={getAgeMax(patient.age_unit)}
                        value={patient.age ?? ''}
                        onChange={(e) => setPatient({ ...patient, age: e.target.value ? Number(e.target.value) : undefined as any })}
                        className="w-full h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Age Unit</label>
                      <select
                        value={normalizeAgeUnit(patient.age_unit)}
                        onChange={(e) => setPatient({ ...patient, age_unit: e.target.value as AgeUnit })}
                        className="w-full h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      >
                        <option value="years">Years</option>
                        <option value="months">Months</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Gender</label>
                      <select
                        value={patient.gender || ''}
                        onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
                        className="w-full h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={patient.phone || ''}
                        onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                        className="w-full h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Sample Collected By (Staff)</label>
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="w-full h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select staff (optional)</option>
                      {staffList.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.firstname} {staff.lastname} ({staff.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Doctor selection block */}
                  <div className="relative mt-4" ref={doctorSearchRef}>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Referring Doctor</label>
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        ref={doctorSearchInputRef}
                        type="text"
                        placeholder="Search doctor by name or mobile..."
                        className="w-full h-9 pl-9 pr-8 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={doctorSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDoctorSearch(val);
                          if (selectedDoctor) {
                            setSelectedDoctor(null);
                            setReferringDoctorName("");
                          }
                          setShowDoctorDropdown(true);
                          setActiveDoctorIndex(0);
                        }}
                        onFocus={() => isEditable && setShowDoctorDropdown(true)}
                        onBlur={handleDoctorBlur}
                        onKeyDown={handleDoctorSearchKeyDown}
                      />
                      {doctorSearch && isEditable && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleClearDoctor}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors focus:outline-none"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {showDoctorDropdown && isEditable && doctorDropdownOptions.length > 0 && (
                        <div
                          onMouseDown={(e) => e.preventDefault()}
                          className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto z-50"
                        >
                          {doctorDropdownOptions.map((opt, index) => {
                            const isActive = index === activeDoctorIndex;
                            if (opt.type === 'self') {
                              return (
                                <button
                                  key="self-option"
                                  type="button"
                                  onClick={handleSelectSelf}
                                  onMouseEnter={() => setActiveDoctorIndex(index)}
                                  className={`w-full px-3 py-2 text-left transition-colors border-b border-border text-xs ${isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent text-muted-foreground'
                                    }`}
                                >
                                  Self (No Doctor)
                                </button>
                              );
                            } else {
                              const doc = opt.data;
                              return (
                                <button
                                  key={doc.id}
                                  type="button"
                                  onClick={() => handleSelectDoctor(doc)}
                                  onMouseEnter={() => setActiveDoctorIndex(index)}
                                  className={`w-full px-3 py-2 text-left transition-colors border-b border-border last:border-0 text-xs ${isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent'
                                    }`}
                                >
                                  <div className="font-semibold text-foreground">
                                    {doc.title || 'Dr'}. {doc.name}
                                  </div>
                                  {doc.specialization || doc.phone ? (
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                      {doc.specialization} {doc.specialization && doc.phone ? '•' : ''} {doc.phone}
                                    </div>
                                  ) : null}
                                </button>
                              );
                            }
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* B2B Partner Lab Settings */}
                  <div className="border-t border-border pt-4 mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block">B2B Partner Lab</label>
                        <span className="text-[10px] text-muted-foreground">Assign to B2B lab for this report</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsB2B(!isB2B);
                          if (!isB2B) {
                            // If switching on, try to select first active lab if none selected
                            const activeLabs = b2bLabs.filter(l => l.status === 'active');
                            if (activeLabs.length > 0 && !selectedB2BLabId) {
                              setSelectedB2BLabId(activeLabs[0].id);
                            }
                          } else {
                            setSelectedB2BLabId("");
                            setB2bCharge("");
                          }
                        }}
                        className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                          isB2B ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                            isB2B ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {isB2B && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">Select B2B Lab</label>
                          <select
                            value={selectedB2BLabId}
                            onChange={(e) => setSelectedB2BLabId(e.target.value)}
                            className="w-full h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                          >
                            <option value="">Select B2B lab</option>
                            {b2bLabs
                              .filter((l) => l.status === "active")
                              .map((lab) => (
                                <option key={lab.id} value={lab.id}>
                                  {lab.lab_name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">B2B Charge (₹)</label>
                          <input
                            type="number"
                            value={b2bCharge}
                            onChange={(e) => setB2bCharge(e.target.value)}
                            placeholder="0.00"
                            className="w-full h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
              <button
                type="button"
                onClick={handleSavePatientDetails}
                className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Test Modal */}
      {showAddTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-visible animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
              <h3 className="text-sm font-bold text-foreground">Manage Tests</h3>
              <button
                onClick={() => setShowAddTestModal(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-left overflow-visible">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-muted-foreground">Selected Tests</label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 border border-border rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
                  {(parsedTestData?.testIds || []).map((tid: string) => {
                    const masterTest = tests.find(t => t.id === tid);
                    const testDisplayName = masterTest?.test_name || `Test ${tid.slice(0, 8)}`;
                    const testDisplayCode = masterTest?.test_code || '';
                    return (
                      <div
                        key={tid}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-lg text-xs text-foreground font-medium"
                      >
                        <span>{testDisplayName}</span>
                        {testDisplayCode && <span className="text-[10px] text-muted-foreground uppercase font-semibold">({testDisplayCode})</span>}
                        {canRemoveTest && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTest(tid)}
                            className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remove test"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {(parsedTestData?.testIds || []).length === 0 && (
                    <span className="text-xs text-muted-foreground p-1">No tests selected yet.</span>
                  )}
                </div>
              </div>

              <div className="relative" ref={testSearchRef}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Add New Test</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={testSearch}
                    onChange={(e) => {
                      setTestSearch(e.target.value);
                      setShowTestDropdown(true);
                    }}
                    onFocus={() => setShowTestDropdown(true)}
                    onKeyDown={handleTestSearchKeyDown}
                    className="w-full h-9 pl-9 pr-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Search by test name, code or category..."
                  />
                  {showTestDropdown && filteredTests.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredTests.map((test, index) => (
                        <button
                          key={test.id}
                          onClick={() => handleAddTest(test)}
                          className={`w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between text-xs border-b border-border/50 last:border-0 ${index === activeTestIndex ? 'bg-accent/50' : ''
                            }`}
                        >
                          <div>
                            <div className="font-semibold text-foreground">{test.test_name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {test.test_code && <span className="uppercase font-semibold mr-1.5">{test.test_code}</span>}
                              {test.category || 'General'}
                            </div>
                          </div>
                          <div className="font-semibold text-primary">
                            ₹{test.price}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end px-4 py-3 border-t border-border bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowAddTestModal(false)}
                className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Test History panel — grouped by test, with trend sparklines for repeated tests */}
      <HistoryTrendPanel
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        loading={historyLoading}
        reports={historyReports}
        patientName={patient?.name}
        canViewTrends={canViewHistoryTrends}
      />
      {/* Custom Confirm Modal for Test Removal */}
      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={() => {
          if (testIdToRemove) {
            handleRemoveTest(testIdToRemove);
          }
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setTestIdToRemove(null);
        }}
        onCancel={() => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setTestIdToRemove(null);
        }}
      />

      {/* Sample Barcode Printer Modal */}
      <SampleBarcodeModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        report={selectedReport}
      />

      {/* Sample Reception Confirmation Modal */}
      <SampleReceptionModal
        isOpen={isSampleReceptionModalOpen}
        onClose={() => setIsSampleReceptionModalOpen(false)}
        report={selectedReport}
        onConfirmReception={handleMarkSampleReceived}
        onOpenBarcodes={() => setIsBarcodeModalOpen(true)}
      />

      {/* Test specific remarks/notes suggestions portal */}
      {activeRemarksFocus && activeSection?.testId && (
        (() => {
          const currentVal = testRemarks[activeSection.testId] || '';
          const lastPart = currentVal.split(/,\s*/).pop()?.trim() || '';
          const filteredOpts = REMARK_OPTIONS.filter(opt =>
            !lastPart || opt.toLowerCase().includes(lastPart.toLowerCase())
          );

          if (filteredOpts.length === 0) return null;

          return createPortal(
            <div
              onMouseEnter={() => { isHoveringRemarksDropdown.current = true; }}
              onMouseLeave={() => {
                isHoveringRemarksDropdown.current = false;
                if (document.activeElement !== remarksTextareaRef.current) {
                  setActiveRemarksFocus(false);
                }
              }}
              className="fixed z-[9999] w-60 overflow-y-auto rounded-lg border border-neutral-800 bg-[#1E1B18] text-white shadow-xl pointer-events-auto"
              style={{
                top: remarksCoords.top,
                left: remarksCoords.left,
                maxHeight: `${remarksMaxHeight}px`
              }}
            >
              {/* Popover Arrow */}
              {remarksAlignLeft ? (
                <div className={`absolute left-full w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-[#1E1B18] ${remarksAlignBottom ? 'bottom-2.5' : 'top-2.5'}`} />
              ) : (
                <div className={`absolute right-full w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-[#1E1B18] ${remarksAlignBottom ? 'bottom-2.5' : 'top-2.5'}`} />
              )}

              <ul className="py-1.5 px-1.5 space-y-0.5">
                {filteredOpts.map((opt: string) => (
                  <li
                    key={opt}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const trimmed = currentVal.trim();
                      let newVal = '';
                      if (!trimmed) {
                        newVal = opt + ', ';
                      } else {
                        const parts = currentVal.split(/,\s*/);
                        const last = parts[parts.length - 1] || '';
                        if (last && opt.toLowerCase().includes(last.toLowerCase())) {
                          parts.pop();
                          parts.push(opt);
                          newVal = parts.join(', ') + ', ';
                        } else {
                          if (currentVal.endsWith(', ')) {
                            newVal = currentVal + opt + ', ';
                          } else if (currentVal.endsWith(',')) {
                            newVal = currentVal + ' ' + opt + ', ';
                          } else {
                            newVal = currentVal + ', ' + opt + ', ';
                          }
                        }
                      }
                      handleTestRemarksChange(newVal);
                      setTimeout(() => {
                        remarksTextareaRef.current?.focus();
                      }, 0);
                    }}
                    className="px-3 py-2 cursor-pointer text-left text-xs leading-tight select-none transition-colors rounded-md text-neutral-300 hover:bg-neutral-800 hover:text-white hover:font-semibold"
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            </div>,
            document.body
          ) as any;
        })()
      )}
    </div>
  );
}