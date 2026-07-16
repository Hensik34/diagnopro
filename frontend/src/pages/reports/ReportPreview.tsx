import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Download,
  FileImage,
  GripVertical,
  Loader2,
  Printer,
  RotateCcw,
  Send,
  SlidersHorizontal,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { PatientInfoHeader } from '../../app/components/reports/PatientInfoHeader';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import * as pdfjsLib from 'pdfjs-dist';
import { ShareReportModal } from '../../app/components/WhatsAppModal';
import { reportApi } from '../../api/reports';
import {
  ImprovedPatientBox,
  InvestigationTableHeader,
  InvestigationTableRow,
  ReportLayoutConfig,
  SectionGroupHeader,
  TestSectionBlock,
  FormattedClinicalSignificance,
} from '../../app/components/ImprovedReportLayout';
import { useAuthStore, useDoctorStore, useSettingsStore, useB2BStore } from '../../stores';
import { useBranchStore } from '../../stores/branchStore';
import { useReportStore } from '../../stores/reportStore';
import { useTestStore } from '../../stores/testStore';
import { formatAge } from '../../utils/age';
import {
  computeReportPages,
  optimizeTestOrder,
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  PAGE_GAP_PX,
  type Parameter,
  type TestSection,
  type TestChunk,
  type PageItem,
} from '../../utils/reportPagination';

const C = {
  brand: '#0D47A1',
  brandLight: '#E8F0FE',
  text: '#212121',
  secondary: '#546E7A',
  muted: '#90A4AE',
  borderLight: '#E0E0E0',
  remarkBg: '#FFF8E1',
  remarkBorder: '#FFB300',
  high: '#C62828',
  low: '#2E7D32',
  white: '#FFFFFF',
  sectionTitle: '#37474F',
} as const;

const printStyles = `
@media print {
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; }
  .no-print { display: none !important; }
  .report-viewer-shell {
    padding: 0 !important;
    background: #fff !important;
    display: block !important;
    height: auto !important;
    overflow: visible !important;
  }
  .report-workbench {
    display: block !important;
    height: auto !important;
    overflow: visible !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .report-viewer-container {
    display: block !important;
    height: auto !important;
    overflow: visible !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    background: transparent !important;
  }
  .report-print-wrapper {
    height: auto !important;
    position: static !important;
    transform: none !important;
    display: block !important;
  }
  .report-print-container {
    position: static !important;
    transform: none !important;
    display: block !important;
    width: auto !important;
  }
  .report-page {
    width: 210mm !important;
    height: 297mm !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: none !important;
    break-after: page;
    page-break-after: always;
    page-break-inside: avoid !important;
    position: relative !important;
  }
  .report-page:last-child { break-after: auto; page-break-after: auto; }
}
`;



type ReportData = {
  lab: {
    name: string;
    address: string;
    city: string;
  };
  report: {
    id: string;
    date: string;
    time: string;
  };
  patient: {
    name: string;
    id: string;
    age: string;
    gender: string;
    referringDoctor: string;
    sampleId: string;
    collectionDate: string;
    reportedDate: string;
  };
  testSections: TestSection[];
  parameters: Parameter[];
  technician: {
    name: string;
  };
};

type SafeZones = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};



function isCbcTest(testName?: string): boolean {
  const name = (testName || '').toLowerCase();
  return name.includes('complete blood count') || name.includes('cbc');
}

function isPeripheralSmearParam(paramName?: string): boolean {
  const name = (paramName || '').toLowerCase().trim();
  return name === 'peripheral smear examination' || name.includes('peripheral smear');
}

function isPeripheralSmearGroup(groupName?: string): boolean {
  const group = (groupName || '').toLowerCase().trim();
  return group === 'peripheral smear examination' || group.includes('peripheral smear');
}

function extractPeripheralSmear(params: Parameter[]): { cleaned: Parameter[]; text: string | null } {
  const cleaned: Parameter[] = [];
  const smearLines: string[] = [];

  for (const p of params) {
    const inSmearGroup = isPeripheralSmearGroup(p.group);
    const isSmearParam = isPeripheralSmearParam(p.name);
    const belongsToSmear = inSmearGroup || isSmearParam;

    if (!belongsToSmear) {
      cleaned.push(p);
      continue;
    }

    if (inSmearGroup) {
      const value = (p.result || '').trim();
      if (value) smearLines.push(`${p.name}: ${value}`);
      continue;
    }

    if (isSmearParam) {
      const value = (p.result || '').trim();
      if (value) smearLines.push(value);
    }
  }

  return {
    cleaned,
    text: smearLines.length > 0 ? smearLines.join('\n') : null,
  };
}

function clamp(num: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num));
}

function parsePx(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const raw = value.trim().toLowerCase();
    if (!raw) return fallback;
    if (raw.endsWith('mm')) {
      const n = Number.parseFloat(raw.slice(0, -2));
      if (Number.isFinite(n)) return n * 3.78;
    }
    if (raw.endsWith('px')) {
      const n = Number.parseFloat(raw.slice(0, -2));
      if (Number.isFinite(n)) return n;
    }
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}


function moveItem<T>(arr: T[], from: number, to: number) {
  const clone = [...arr];
  const [removed] = clone.splice(from, 1);
  clone.splice(to, 0, removed);
  return clone;
}

export function ReportPreview() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { reports, selectedReport, fetchReportById, updateReport, isLoading, error } = useReportStore();
  const { branches, fetchBranches, currentBranchId } = useBranchStore();
  const { testFields, fetchTestFieldsMulti } = useTestStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { doctors, fetchDoctors } = useDoctorStore();
  const { user, staffList, fetchStaffList } = useAuthStore();
  const { labs: b2bLabs, fetchLabs: fetchB2BLabs } = useB2BStore();
  const [containerWidth, setContainerWidth] = useState(A4_WIDTH_PX);
  const backPath = user?.role === 'doctor' ? '/app/doctor-reports' : '/app/reports';
  const backLabel = user?.role === 'doctor' ? 'My Reports' : 'Reports';

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showLetterhead, setShowLetterhead] = useState(true);
  const [safeZones, setSafeZones] = useState<SafeZones>({ top: 52, bottom: 56, left: 24, right: 24 });
  const [zoom, setZoom] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const effectiveScale = clamp(baseScale * zoom, 0.3, 2);
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [originalSectionOrder, setOriginalSectionOrder] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [activePageIndex, setActivePageIndex] = useState(0);

  const viewerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shareAutoOpened = useRef(false);

  const [staffId, setStaffId] = useState("");
  const [isB2B, setIsB2B] = useState(false);
  const [b2bLabId, setB2bLabId] = useState("");
  const [b2bCharge, setB2bCharge] = useState("");
  const [isUpdatingMetadata, setIsUpdatingMetadata] = useState(false);

  const rawReport = useMemo(
    () => (selectedReport?.id === id ? selectedReport : reports.find(r => r.id === id)),
    [selectedReport, reports, id],
  );

  useEffect(() => {
    if (rawReport) {
      setStaffId(rawReport.staff_id || "");
      setIsB2B(!!rawReport.b2b_lab_id);
      setB2bLabId(rawReport.b2b_lab_id || "");
      setB2bCharge(rawReport.b2b_charge ? String(rawReport.b2b_charge) : "");
    }
  }, [rawReport]);

  const isMetadataDirty = useMemo(() => {
    if (!rawReport) return false;
    const currentStaffId = rawReport.staff_id || "";
    const currentB2bLabId = rawReport.b2b_lab_id || "";
    const currentB2bCharge = rawReport.b2b_charge ? String(rawReport.b2b_charge) : "";
    const currentIsB2B = !!rawReport.b2b_lab_id;

    if (staffId !== currentStaffId) return true;
    if (isB2B !== currentIsB2B) return true;
    if (isB2B) {
      if (b2bLabId !== currentB2bLabId) return true;
      if (b2bCharge !== currentB2bCharge) return true;
    }
    return false;
  }, [rawReport, staffId, isB2B, b2bLabId, b2bCharge]);

  const handleSaveMetadata = async () => {
    if (!id) return;
    setIsUpdatingMetadata(true);
    try {
      await updateReport(id, {
        staff_id: staffId || null,
        b2b_lab_id: isB2B && b2bLabId ? b2bLabId : null,
        b2b_charge: isB2B && b2bCharge ? parseFloat(b2bCharge) : 0,
      });
      toast.success("Sample & B2B settings updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update report settings");
    } finally {
      setIsUpdatingMetadata(false);
    }
  };

  const allSelected = visibleSections.size === sectionOrder.length;
  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setVisibleSections(new Set());
    } else {
      setVisibleSections(new Set(sectionOrder));
    }
  }, [allSelected, sectionOrder]);

  const patientProp = useMemo(() => {
    if (!rawReport) return null;
    return {
      id: rawReport.patient_id,
      name: rawReport.patient_name || 'Unknown Patient',
      age: rawReport.patient_age,
      age_unit: rawReport.patient_age_unit,
      gender: rawReport.patient_gender || 'Unknown',
      phone: rawReport.patient_phone || '—',
    };
  }, [rawReport]);

  const patientInitials = useMemo(() => {
    if (!reportData?.patient.name) return 'P';
    return reportData.patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }, [reportData]);

  const getImageUrl = useCallback((path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const api = (window as any).__VITE_API_URL__ || 'http://localhost:5000/api';
    const base = api.replace(/\/api$/, '');
    return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  }, []);

  useEffect(() => {
    if (id) {
      fetchReportById(id);
      fetchBranches();
      fetchStaffList();
      fetchB2BLabs();
    }
  }, [id, fetchReportById, fetchBranches, fetchStaffList, fetchB2BLabs]);

  const reportBranchId = rawReport?.branch_id || currentBranchId;

  useEffect(() => {
    if (!reportBranchId) return;
    fetchSettings(reportBranchId);
    fetchDoctors({ branch_id: reportBranchId });
  }, [reportBranchId, fetchSettings, fetchDoctors]);

  useEffect(() => {
    if (!rawReport) return;
    const testData =
      typeof rawReport.test_data === 'string' ? JSON.parse(rawReport.test_data) : rawReport.test_data;
    const testIds = testData?.testIds || testData?.tests?.map((t: any) => t.testId) || [];
    if (testIds.length > 0) fetchTestFieldsMulti(testIds);
  }, [rawReport, fetchTestFieldsMulti]);

  const sectionGroupMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of testFields) {
      if (f.section_group) map.set(`${f.test_id}::${f.field_name}`, f.section_group);
    }
    return map;
  }, [testFields]);

  const isMandatoryMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const f of testFields) {
      map.set(`${f.test_id}::${f.field_name}`, f.is_mandatory !== false);
    }
    return map;
  }, [testFields]);

  useEffect(() => {
    if (!rawReport) return;

    const branch = branches.find(b => b.id === rawReport.branch_id);
    const age = formatAge(rawReport.patient_age, rawReport.patient_age_unit) || 'N/A';
    const doctorName = rawReport.is_self_report
      ? 'Self'
      : rawReport.doctor_name
        ? (/^dr\.?/i.test(rawReport.doctor_name) ? rawReport.doctor_name : `${rawReport.doctor_title || 'Dr'}. ${rawReport.doctor_name}`)
        : rawReport.doctor_firstname && rawReport.doctor_lastname
          ? `Dr. ${rawReport.doctor_firstname} ${rawReport.doctor_lastname}`
          : 'Self';

    const testData =
      typeof rawReport.test_data === 'string' ? JSON.parse(rawReport.test_data) : rawReport.test_data;

    const mapParam = (p: any, testId?: string): Parameter => ({
      name: p.name,
      result: p.value?.toString() || '',
      unit: p.unit || '',
      refRange: p.referenceRange || '',
      isAbnormal: p.status === 'low' || p.status === 'high',
      status: p.status,
      fieldType: p.fieldType || undefined,
      group: p.group || (testId ? sectionGroupMap.get(`${testId}::${p.name}`) : undefined),
      isMandatory: testId ? isMandatoryMap.get(`${testId}::${p.name}`) ?? true : true,
    });

    const filterBlankOptionalParams = (pList: Parameter[]) => {
      return pList.filter((p) => {
        return p.result !== undefined && p.result !== null && p.result.trim() !== '';
      });
    };

    const testSections: TestSection[] = [];
    const params: Parameter[] = [];

    const layoutSnapshots = testData?.layout_snapshots || {};

    if (testData?.tests?.length) {
      for (let i = 0; i < testData.tests.length; i++) {
        const group = testData.tests[i];
        const sectionParams = (group.parameters || []).map((p: any) => mapParam(p, group.testId));

        const snapshot = layoutSnapshots[group.testId];
        if (snapshot?.parameterSettings?.length) {
          const posMap = new Map<string, any>(snapshot.parameterSettings.map((s: any) => [s.fieldName, s]));

          let filteredParams = sectionParams.filter((p: any) => {
            const setting = posMap.get(p.name);
            return !setting || setting.visible !== false;
          });

          filteredParams.sort((a: any, b: any) => {
            const posA = posMap.get(a.name)?.position ?? 9999;
            const posB = posMap.get(b.name)?.position ?? 9999;
            return posA - posB;
          });

          filteredParams = filteredParams.map((p: any) => {
            const setting = posMap.get(p.name);
            const extra: any = {};
            if (setting) {
              if (setting.group !== undefined) extra.group = setting.group || undefined;
              if (setting.fontSize !== undefined) extra.fontSize = setting.fontSize;
              if (setting.bold !== undefined) extra.bold = setting.bold;
            }
            return { ...p, ...extra };
          });

          filteredParams = filterBlankOptionalParams(filteredParams);

          const extracted = extractPeripheralSmear(filteredParams);
          filteredParams = extracted.cleaned;
          const peripheralSmearText = extracted.text;

          testSections.push({
            id: `${group.testId || group.testName || 'test'}-${i}`,
            testId: group.testId,
            testName: group.testName,
            parameters: filteredParams,
            isCbc: isCbcTest(group.testName),
            peripheralSmearText,
          });
          params.push(...filteredParams);
        } else {
          const filteredParams = filterBlankOptionalParams(sectionParams);
          const extracted = extractPeripheralSmear(filteredParams);
          const cleanedParams = extracted.cleaned;
          const peripheralSmearText = extracted.text;
          testSections.push({
            id: `${group.testId || group.testName || 'test'}-${i}`,
            testId: group.testId,
            testName: group.testName,
            parameters: cleanedParams,
            isCbc: isCbcTest(group.testName),
            peripheralSmearText,
          });
          params.push(...cleanedParams);
        }
      }
    } else if (testData?.parameters?.length) {
      const sectionParams = testData.parameters.map((p: any) => mapParam(p));
      const filteredParams = filterBlankOptionalParams(sectionParams);
      const extracted = extractPeripheralSmear(filteredParams);
      const cleanedParams = extracted.cleaned;
      const peripheralSmearText = extracted.text;
      testSections.push({
        id: 'legacy-0',
        testName: testData.testName || rawReport.report_type || 'General Test',
        parameters: cleanedParams,
        isCbc: isCbcTest(testData.testName || rawReport.report_type || 'General Test'),
        peripheralSmearText,
      });
      params.push(...cleanedParams);
    }

    const collectionDate = rawReport.collection_date || rawReport.created_at;
    const reportedAt = rawReport.approved_at || rawReport.created_at;

    const doctorSignatureUrl = rawReport.pathology_signature_url || rawReport.doctor_signature_url || null;
    const hasSig = !!(doctorSignatureUrl || rawReport.pathology_signature_label);

    const optimizedSections = optimizeTestOrder(testSections, {
      safeZones: { top: 80, bottom: 80 },
      hasDoctorSignature: hasSig,
      density: 'balanced',
      layoutSnapshots,
      testData,
      clinicalNotes: rawReport.clinical_notes,
      isSelfReport: rawReport.is_self_report,
      attachMarketingPages: rawReport.attach_marketing_pages,
      marketingPages: rawReport.marketing_pages,
    });

    const nextData: ReportData = {
      lab: {
        name: branch?.name || 'DiagnoPro Diagnostics',
        address: branch?.location || 'Medical District',
        city: branch?.city || '',
      },
      report: {
        id: `REP-${rawReport.id.slice(0, 8).toUpperCase()}`,
        date: format(new Date(rawReport.created_at), 'dd MMM yyyy'),
        time: format(new Date(rawReport.created_at), 'hh:mm aa'),
      },
      patient: {
        name: rawReport.patient_name || 'Unknown Patient',
        id: `PT-${rawReport.patient_id.slice(0, 8)}`,
        age,
        gender: rawReport.patient_gender || 'Unknown',
        referringDoctor: doctorName,
        sampleId: rawReport.sample_id_code || 'N/A',
        collectionDate: format(new Date(collectionDate), 'dd MMM yyyy, hh:mm aa'),
        reportedDate: format(new Date(reportedAt), 'dd MMM yyyy, hh:mm aa'),
      },
      testSections: optimizedSections,
      parameters: params,
      technician: {
        name:
          rawReport.technician_firstname && rawReport.technician_lastname
            ? `${rawReport.technician_firstname} ${rawReport.technician_lastname}, MLT`
            : 'Lab Technician',
      },
    };

    setReportData(nextData);
    const ids = optimizedSections.map(s => s.id);
    setSectionOrder(ids);
    setOriginalSectionOrder(ids);
    setVisibleSections(new Set(ids));
  }, [rawReport, branches, sectionGroupMap, isMandatoryMap]);

  useEffect(() => {
    if (searchParams.get('share') === '1' && reportData && !shareAutoOpened.current) {
      setShowShareModal(true);
      shareAutoOpened.current = true;
    }
  }, [searchParams, reportData]);

  // Simple, deterministic safe zone calculation.
  // Settings values are the single source of truth.
  // Keep margins and safe areas all the time so they are reserved for pre-printed letterhead.
  // Replace the safeZones useEffect in ReportPreview.tsx with:
  useEffect(() => {
    const marginTop = parsePx(settings?.report_margin_top, 80);
    const marginBottom = parsePx(settings?.report_margin_bottom, 80);
    const marginLeft = parsePx(settings?.report_margin_left, 24);
    const marginRight = parsePx(settings?.report_margin_right, 24);

    // Safe areas are now just minimum guarantees, not additive
    // The auto-detected margins already account for header/footer artwork
    // Only use safe area if margin is somehow smaller (backward compat)
    const headerSafe = parsePx(settings?.header_safe_area, 0);
    const footerSafe = parsePx(settings?.footer_safe_area, 0);

    setSafeZones({
      top: clamp(Math.max(marginTop, headerSafe), 20, Math.round(A4_HEIGHT_PX * 0.35)),
      bottom: clamp(Math.max(marginBottom, footerSafe), 10, Math.round(A4_HEIGHT_PX * 0.35)),
      left: clamp(Math.max(marginLeft, 8), 8, 60),
      right: clamp(Math.max(marginRight, 8), 8, 60),
    });
  }, [settings]);


  useLayoutEffect(() => {
    const node = viewerRef.current;
    if (!node) return;

    const updateScale = () => {
      const width = node.clientWidth;
      setContainerWidth(width);
      const fit = clamp((width - 24) / A4_WIDTH_PX, 0.3, 1);
      setBaseScale(fit);
    };

    updateScale();
    const obs = new ResizeObserver(updateScale);
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const orderedSections = useMemo(() => {
    if (!reportData) return [];
    const map = new Map(reportData.testSections.map(s => [s.id, s]));
    const ordered = sectionOrder.map(id => map.get(id)).filter(Boolean) as TestSection[];
    const filtered = ordered.filter(s => visibleSections.has(s.id));
    if (filtered.length > 0) return filtered;
    return [];
  }, [reportData, sectionOrder, visibleSections]);

  const abnormalParams = useMemo(
    () => (reportData?.parameters ?? []).filter(p => p.status === 'high' || p.status === 'low'),
    [reportData],
  );

  const remarkText = useMemo(() => {
    if (rawReport?.clinical_notes?.trim()) return rawReport.clinical_notes.trim();

    // Fetch clinical significance from layout snapshots of the tests in this report
    const testData =
      typeof rawReport?.test_data === 'string' ? JSON.parse(rawReport.test_data) : rawReport?.test_data;

    const layoutSnapshots = testData?.layout_snapshots || {};
    const sigs: string[] = [];

    let testIds: string[] = [];
    if (Array.isArray(testData?.testIds)) {
      testIds = testData.testIds;
    } else if (Array.isArray(testData?.tests)) {
      testIds = testData.tests.map((t: any) => t.id || t.testId).filter(Boolean);
    }

    for (const testId of testIds) {
      const snapshot = layoutSnapshots[testId];
      if (snapshot?.clinical_significance?.trim()) {
        sigs.push(snapshot.clinical_significance.trim());
      }
    }

    if (sigs.length > 0) {
      return sigs.join('\n');
    }

    return null;
  }, [rawReport]);

  const pathologySignature = (() => {
    if (!settings) {
      return {
        url: rawReport?.pathology_signature_url || rawReport?.doctor_signature_url || null,
        label: rawReport?.pathology_signature_label || null,
        description: rawReport?.pathology_signature_description || null,
      };
    }

    const getSigValue = (index: number, field: 'url' | 'label' | 'description') => {
      const key = `signature_${index}_${field}`;
      return settings[key as keyof typeof settings] as string | null | undefined;
    };

    const index = settings.default_signature_index;
    if ([1, 2, 3, 4].includes(index || 0)) {
      const url = getSigValue(index!, 'url');
      const label = getSigValue(index!, 'label');
      const description = getSigValue(index!, 'description');
      if (url) return { url, label: label || null, description: description || null };
    }

    for (let i = 1; i <= 4; i += 1) {
      const url = getSigValue(i, 'url');
      if (url) {
        const label = getSigValue(i, 'label');
        const description = getSigValue(i, 'description');
        return { url, label: label || null, description: description || null };
      }
    }

    return {
      url: rawReport?.pathology_signature_url || rawReport?.doctor_signature_url || null,
      label: rawReport?.pathology_signature_label || null,
      description: rawReport?.pathology_signature_description || null,
    };
  })();

  const doctorSignatureUrl = pathologySignature.url;
  const doctorSignatureName = pathologySignature.label || (doctorSignatureUrl ? 'Authorized Signatory' : '');
  const doctorSignatureDescription = pathologySignature.description || (doctorSignatureUrl ? 'Pathologist' : '');
  const hasDoctorSignature = !!(doctorSignatureUrl || pathologySignature.label);


  const density = useMemo(() => {
    const paramCount = orderedSections.reduce((s, sec) => s + sec.parameters.length, 0);

    // Count group headers too - they take as much space as a parameter row
    const groupCount = orderedSections.reduce((s, sec) => {
      let groups = 0;
      let lastGroup: string | undefined;
      for (const p of sec.parameters) {
        if (p.group && p.group !== lastGroup) groups++;
        lastGroup = p.group;
      }
      return s + groups;
    }, 0);

    // Effective row count = parameters + group headers
    const effectiveRows = paramCount + groupCount;

    if (effectiveRows > 100) return 'compact';
    if (effectiveRows > 18) return 'balanced';  // was 75 - CBC with 20 params + 5 groups = 25
    return 'comfortable';
  }, [orderedSections]);






  const paginationResult = useMemo(() => {
    if (!reportData) return { pages: [] as PageItem[][], compactAdjustment: 0 };
    const testData =
      typeof rawReport?.test_data === 'string' ? JSON.parse(rawReport.test_data) : rawReport?.test_data;
    const layoutSnapshots = testData?.layout_snapshots || {};

    return computeReportPages({
      orderedSections,
      safeZones,
      hasDoctorSignature,
      density,
      layoutSnapshots,
      testData,
      clinicalNotes: rawReport?.clinical_notes,
      isSelfReport: rawReport?.is_self_report,
      attachMarketingPages: rawReport?.attach_marketing_pages,
      marketingPages: rawReport?.marketing_pages,
    });
  }, [reportData, orderedSections, safeZones, rawReport, density, hasDoctorSignature]);

  const pages = paginationResult.pages;

  // Scroll-spying to update active page index
  useEffect(() => {
    if (!viewerRef.current) return;

    const visiblePageRatios = new Map<Element, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visiblePageRatios.set(entry.target, entry.intersectionRatio);
        });

        // Find the page with the highest visibility ratio
        let maxRatio = -1;
        let mostVisiblePage: Element | null = null;
        visiblePageRatios.forEach((ratio, target) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            mostVisiblePage = target;
          }
        });

        if (mostVisiblePage && maxRatio > 0) {
          if (!viewerRef.current) return;
          const pagesList = Array.from(viewerRef.current.querySelectorAll('.report-page'));
          const index = pagesList.indexOf(mostVisiblePage);
          if (index !== -1) {
            setActivePageIndex(index);
          }
        }
      },
      {
        root: viewerRef.current,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0],
      }
    );

    const pagesList = viewerRef.current.querySelectorAll('.report-page');
    pagesList.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [pages, reportData, effectiveScale]);

  const handleSelectPage = (index: number) => {
    setActivePageIndex(index);
    if (!viewerRef.current) return;
    const targetScrollTop = index * (A4_HEIGHT_PX + PAGE_GAP_PX) * effectiveScale;
    viewerRef.current.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
  };

  const isSelfReport = reportData?.patient.referringDoctor === 'Self' || rawReport?.is_self_report;
  const refDoctor = doctors.find(d => d.id === rawReport?.doctor_id);
  const handleDownloadPdf = useCallback(async () => {
    if (!id) return;
    setIsGeneratingPdf(true);
    try {
      const { blob, filename } = await reportApi.downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Server PDF download failed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [id]);

  const moveUp = useCallback((id: string) => {
    setSectionOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      return moveItem(prev, idx, idx - 1);
    });
  }, []);

  const moveDown = useCallback((id: string) => {
    setSectionOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      return moveItem(prev, idx, idx + 1);
    });
  }, []);

  const resetOrder = useCallback(() => {
    setSectionOrder(originalSectionOrder);
  }, [originalSectionOrder]);

  const hasVisibleTests = visibleSections.size > 0;



  const onDropReorder = useCallback((targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    setSectionOrder(prev => {
      const from = prev.indexOf(draggingId);
      const to = prev.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      return moveItem(prev, from, to);
    });
    setDraggingId(null);
  }, [draggingId]);

  const toggleSectionVisibility = useCallback((id: string) => {
    setVisibleSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (isLoading && !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm text-gray-700">{error}</p>
          <Link to={backPath} className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500">Report not found</p>
          <Link to={backPath} className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  const ownerSignature = (() => {
    let url: string | null = null;
    let label: string | null = null;
    let description: string | null = null;

    if (settings) {
      url = settings.owner_signature_url || null;
      label = settings.owner_signature_label || rawReport?.owner_signature_label || null;
      description = settings.owner_signature_description || rawReport?.owner_signature_description || null;
    } else {
      url = rawReport?.owner_signature_url || null;
      label = rawReport?.owner_signature_label || null;
      description = rawReport?.owner_signature_description || null;
    }

    return { url, label, description };
  })();

  const ownerSigUrl = ownerSignature.url;
  const ownerSigLabel = ownerSignature.label || (rawReport?.technician_firstname ? `${rawReport.technician_firstname} ${rawReport?.technician_lastname || ''}` : (user ? `${user.firstname} ${user.lastname}` : reportData.technician.name));
  const ownerSigDesc = ownerSignature.description || 'Lab Owner / Incharge';

  const letterheadActive = showLetterhead && !!settings?.letterhead_url;
  const headerActive = showLetterhead && !!settings?.header_url && !settings?.letterhead_url;
  const footerActive = showLetterhead && !!settings?.footer_url && !settings?.letterhead_url;
  const hasBranding = !!(settings?.letterhead_url || settings?.header_url || settings?.footer_url);
  const signatureStripHeight = hasDoctorSignature ? 84 : 76;
  let lastReportPageIndex = -1;
  for (let i = pages.length - 1; i >= 0; i -= 1) {
    if (pages[i]?.[0]?.type !== 'marketing') {
      lastReportPageIndex = i;
      break;
    }
  }

  const renderPageContent = (pageIndex: number) => {
    const page = pages[pageIndex];
    if (!page) return null;
    const marketingItem = page[0]?.type === 'marketing' ? page[0] : null;
    const isMarketingPage = !!marketingItem;

    const testData =
      typeof rawReport?.test_data === 'string' ? JSON.parse(rawReport.test_data) : rawReport?.test_data;
    const layoutSnapshots = testData?.layout_snapshots || {};

    return (
      <>
        {!isMarketingPage && letterheadActive && settings?.letterhead_url && (
          <img
            src={getImageUrl(settings.letterhead_url) || ''}
            alt="Letterhead"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
        )}

        {!isMarketingPage && headerActive && settings?.header_url && (
          <img
            src={getImageUrl(settings.header_url) || ''}
            alt="Header"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              objectFit: 'contain',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
        )}

        {!isMarketingPage && footerActive && settings?.footer_url && (
          <img
            src={getImageUrl(settings.footer_url) || ''}
            alt="Footer"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              objectFit: 'contain',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Centered Page Footer inside A4 paper */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-slate-400 font-medium select-none pointer-events-none z-10 print:block">
          Page {pageIndex + 1} of {pages.length}
        </div>

        {marketingItem ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: marketingItem.pageConfig.position === 'custom' ? 'block' : 'flex',
              flexDirection: 'column',
              justifyContent: marketingItem.pageConfig.position === 'top' ? 'flex-start' : marketingItem.pageConfig.position === 'bottom' ? 'flex-end' : 'center',
              alignItems: 'center',
            }}
          >
            <img
              src={getImageUrl(marketingItem.pageConfig.url || marketingItem.pageConfig.previewUrl) || ''}
              alt="Marketing Poster"
              style={{
                objectFit: 'contain',
                width: marketingItem.pageConfig.width || '100%',
                height: marketingItem.pageConfig.height || 'auto',
                position: marketingItem.pageConfig.position === 'custom' ? 'absolute' : 'relative',
                left: marketingItem.pageConfig.position === 'custom' ? marketingItem.pageConfig.x_offset : undefined,
                top: marketingItem.pageConfig.position === 'custom' ? marketingItem.pageConfig.y_offset : undefined,
              }}
            />
          </div>
        ) : (
          <div
            data-content-area="true"
            style={{
              position: 'absolute',
              top: safeZones.top,
              bottom: safeZones.bottom,
              left: safeZones.left,
              right: safeZones.right,
              zIndex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: signatureStripHeight,
              gap: 2,
              fontSize: 11,
              lineHeight: 1.35,
              color: '#222',
              fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
            }}
          >
            {page.map((item, idx) => {
              if (item.type === 'patient') {
                return (
                  <div key={`p-${idx}`} className="patient-info-box">
                    <ImprovedPatientBox
                      patientName={reportData.patient.name}
                      age={reportData.patient.age as any}
                      gender={reportData.patient.gender}
                      patientId={reportData.patient.id}
                      sampleId={reportData.patient.sampleId}
                      referringDoctor={reportData.patient.referringDoctor}
                      reportDate={reportData.report.date}
                      reportTime={reportData.report.time}
                      collectionDate={reportData.patient.collectionDate}
                      reportedDate={reportData.patient.reportedDate}
                      collectionAddress={`${reportData.lab.address}${reportData.lab.city ? `, ${reportData.lab.city}` : ''}`}
                      qrCode={
                        <QRCodeSVG
                          value={rawReport?.download_token ? `${window.location.origin}/public/report/${id}/download?token=${rawReport.download_token}` : `${window.location.origin}/public/report/${id}/download`}
                          size={56}
                          level="Q"
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      }
                      barcode={<Barcode value={reportData.patient.sampleId} />}
                      colorTokens={C}
                    />
                  </div>
                );
              }

              if (item.type === 'test') {
                let lastGroup: string | undefined;
                const hasPreviousTestOnPage = page.slice(0, idx).some(prevItem => prevItem.type === 'test');
                const shouldAddInterTestGap = hasPreviousTestOnPage;
                return (
                  <TestSectionBlock
                    key={`t-${idx}`}
                    testName={item.chunk.continuation ? `${item.chunk.title} (cont.)` : item.chunk.title}
                    isFirstSection={false}
                    extraTopGap={shouldAddInterTestGap ? 22 : 0}
                    colorTokens={C}
                  >
                    <table style={{
                      width: '100%',
                      borderCollapse: 'separate',
                      borderSpacing: 0,
                      tableLayout: 'fixed',
                      marginTop: '1px'
                    }}><InvestigationTableHeader colorTokens={C} /><tbody>
                        {item.chunk.parameters.map((param, rowIdx) => {
                          if (isPeripheralSmearParam(param.name) || isPeripheralSmearGroup(param.group)) {
                            return null;
                          }
                          const status = (param.status || '').toLowerCase();
                          const isHigh = status === 'high' || status === 'critical';
                          const isLow = status === 'low';
                          const isAbnormal = isHigh || isLow;
                          const statusColor = isHigh ? C.high : isLow ? C.low : C.text;
                          const showGroupHeader = !!param.group && param.group !== lastGroup;
                          if (param.group) lastGroup = param.group;

                          return (
                            <React.Fragment key={`${param.name}-${rowIdx}`}>
                              {showGroupHeader && (
                                <SectionGroupHeader
                                  title={param.group || ''}
                                  colorTokens={C}
                                  compact={true}
                                />
                              )}
                              <InvestigationTableRow
                                investigation={param.name}
                                result={param.result}
                                status={isHigh ? 'High' : isLow ? 'Low' : ''}
                                refRange={param.refRange}
                                unit={param.unit}
                                isAbnormal={isAbnormal}
                                statusColor={statusColor}
                                rowIndex={rowIdx}
                                indented={!!param.group}
                                colorTokens={C}
                                compact={true}
                                customFontSize={(param as any).fontSize}
                                customBold={(param as any).bold}
                              />

                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </TestSectionBlock>
                );
              }

              // Render inline clinical significance box
              if (item.type === 'interpretation') {
                const snapshot = layoutSnapshots[item.testId];
                const sigLayout = snapshot?.clinicalSignificanceLayout;
                const sigFontSize = sigLayout?.fontSize ? `${sigLayout.fontSize}px` : '9.5px';
                const titleFontWeight = sigLayout?.bold ? '800' : '700';

                return (
                  <div
                    key={`i-${idx}`}
                    style={{
                      marginTop: '8px',
                      color: '#222',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: titleFontWeight, color: '#111', textTransform: 'uppercase', marginBottom: '2px', fontSize: sigFontSize }}>
                      Clinical Significance
                    </div>
                    <FormattedClinicalSignificance
                      text={item.text}
                      fontSize={sigFontSize}
                      bold={!!sigLayout?.bold}
                    />
                  </div>
                );
              }

              // Render inline test-specific remark box
              if (item.type === 'testRemark') {
                return (
                  <div
                    key={`testremark-${idx}`}
                    style={{
                      marginTop: '8px',
                      color: '#222',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#111', textTransform: 'uppercase', marginBottom: '2px', fontSize: '9.5px' }}>
                      Notes / Remarks
                    </div>
                    <FormattedClinicalSignificance
                      text={item.text}
                      fontSize="9.5px"
                      bold={false}
                    />
                  </div>
                );
              }

              // Render inline general/technician notes box
              if (item.type === 'generalNotes') {
                return (
                  <div
                    key={`gnotes-${idx}`}
                    style={{
                      marginTop: '8px',
                      color: '#222',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#111', textTransform: 'uppercase', marginBottom: '2px', fontSize: '9.5px' }}>
                      Technician Notes / Interpretation
                    </div>
                    <FormattedClinicalSignificance
                      text={item.text}
                      fontSize="9.5px"
                      bold={false}
                    />
                  </div>
                );
              }

              if (item.type === 'peripheralSmear') {
                const smearRows = item.text
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => {
                    const sepIdx = line.indexOf(':');
                    if (sepIdx === -1) {
                      return { label: '', value: line };
                    }
                    const label = line.slice(0, sepIdx).trim();
                    const value = line.slice(sepIdx + 1).trim();

                    return {
                      label,
                      value,
                    };
                  });

                return (
                  <div
                    key={`smear-${idx}`}
                    style={{
                      marginTop: '8px',
                      fontSize: '11.5px',
                      color: '#222',
                      lineHeight: 1.55,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#111', textTransform: 'uppercase', marginBottom: '6px', fontSize: '14px' }}>
                      {item.testName}: Peripheral Smear Examination
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                      <tbody>
                        {smearRows.map((row, rowIdx) => {
                          if (!row.label) {
                            return (
                              <tr key={`smear-row-${rowIdx}`}>
                                <td colSpan={2} style={{ padding: '2px 0', fontSize: '13.5px', color: '#212121', fontWeight: 500 }}>
                                  {row.value}
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={`smear-row-${rowIdx}`}>
                              <td
                                style={{
                                  width: '220px',
                                  minWidth: '220px',
                                  maxWidth: '220px',
                                  verticalAlign: 'top',
                                  padding: '2px 8px 2px 0',
                                  fontSize: '13.5px',
                                  fontWeight: 700,
                                  color: '#1A1A1A',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {row.label}:
                              </td>
                              <td
                                style={{
                                  verticalAlign: 'top',
                                  padding: '2px 0',
                                  fontSize: '13.5px',
                                  fontWeight: 500,
                                  color: '#212121',
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {row.value.split(',').map((val) => val.trim()).filter(Boolean).map((subVal, subIdx) => (
                                  <div key={subIdx} style={{ lineHeight: 1.35 }}>
                                    {subVal}
                                  </div>
                                ))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              }

              if (item.type === 'endMarker' || item.type === 'signature') return null;

              return null;
            })}

            <section
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                paddingTop: 4,
                borderTop: '1px solid #D7DEE7',
                background: (letterheadActive || headerActive || footerActive) ? 'rgba(255,255,255,0.84)' : '#FFFFFF',
              }}
            >
              {pageIndex === lastReportPageIndex && (
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '8.5px',
                    color: '#8A99A8',
                    letterSpacing: '1.5px',
                    marginBottom: 3,
                  }}
                >
                  *** End of Report ***
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: hasDoctorSignature ? 'space-between' : 'flex-start' }}>
                <div>
                  <div style={{ height: 36, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                    {ownerSigUrl && (
                      <img
                        src={getImageUrl(ownerSigUrl) || ''}
                        alt="Owner Signature"
                        style={{ maxHeight: 36, objectFit: 'contain' }}
                      />
                    )}
                  </div>
                  <div style={{ borderTop: '1px solid #333', paddingTop: 3, minWidth: '150px' }}>
                    <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, color: '#111' }}>
                      {ownerSigLabel}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: '8.5px', color: '#666' }}>{ownerSigDesc}</p>
                  </div>
                </div>

                {hasDoctorSignature && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ height: 36, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 4 }}>
                      {doctorSignatureUrl && (
                        <img
                          src={getImageUrl(doctorSignatureUrl) || ''}
                          alt="Doctor Signature"
                          style={{ maxHeight: 36, objectFit: 'contain' }}
                        />
                      )}
                    </div>
                    <div style={{ borderTop: '1px solid #333', paddingTop: 3, minWidth: '150px' }}>
                      <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, color: '#111' }}>
                        {doctorSignatureName || 'Doctor'}
                      </p>
                      <p style={{ margin: '1px 0 0', fontSize: '8.5px', color: '#666' }}>{doctorSignatureDescription || 'Consultant'}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </>
    );
  };

  const stackHeight = pages.length * A4_HEIGHT_PX + Math.max(0, pages.length - 1) * PAGE_GAP_PX;
  return (
    <div className="report-viewer-shell flex flex-col h-[calc(100vh-76px)] overflow-hidden space-y-2.5 w-full px-1.5 sm:px-2 pb-1.5 bg-slate-50/50 dark:bg-slate-950/20">
      <style>{printStyles}</style>

      {/* Top Patient Info Bar */}
      <div className="no-print flex-shrink-0">
        <PatientInfoHeader
          mode="preview"
          patient={patientProp as any}
          selectedReport={rawReport || null}
          selectedDoctor={refDoctor || null}
          referringDoctorName={rawReport?.referring_doctor_name || ''}
          formattedCollectionDate={reportData?.patient.collectionDate || ''}
          patientInitials={patientInitials}
          formatAge={formatAge}
          onBack={() => navigate(backPath)}
          onDownloadPdf={handleDownloadPdf}
          onPrint={() => window.print()}
          onShare={() => setShowShareModal(true)}
          onToggleBranding={() => setShowLetterhead(v => !v)}
          onZoomIn={() => setZoom(z => clamp(z + 0.1, 0.6, 2))}
          onZoomOut={() => setZoom(z => clamp(z - 0.1, 0.6, 2))}
          zoom={zoom}
          effectiveScale={effectiveScale}
          showLetterhead={showLetterhead}
          hasBranding={hasBranding}
          isGeneratingPdf={isGeneratingPdf}
          hasVisibleTests={hasVisibleTests}
          onToggleOrderDrawer={() => setIsOrderDrawerOpen(true)}
        />
      </div>

      {/* Main workbench */}
      <div className="report-workbench flex-1 flex gap-3 min-h-0 overflow-hidden mb-1 w-full">

        {/* Left Column: Test Order Management & Settings */}
        <aside className="no-print hidden lg:block w-[308px] shrink-0 h-full flex flex-col gap-3 overflow-hidden">
          <div className="flex-1 min-h-0">
            <OrderManagementPanel
              sections={sectionOrder.map(id => reportData!.testSections.find(s => s.id === id)).filter(Boolean) as TestSection[]}
              visibleSections={visibleSections}
              onToggleVisibility={toggleSectionVisibility}
              moveUp={moveUp}
              moveDown={moveDown}
              resetOrder={resetOrder}
              setDraggingId={setDraggingId}
              onDropReorder={onDropReorder}
              allSelected={allSelected}
              onToggleSelectAll={toggleSelectAll}
              selectedCount={visibleSections.size}
            />
          </div>
        </aside>

        {/* Center Column: A4 Report Pages Stack (the ONLY scrolling container) */}
        <div
          ref={viewerRef}
          className="report-viewer-container flex-1 h-full overflow-y-auto overflow-x-auto flex justify-center bg-[#EEF1F6] dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-xl p-3 scrollbar-thin"
        >
          <div
            className="report-print-wrapper"
            style={{
              height: stackHeight * effectiveScale,
              width: A4_WIDTH_PX * effectiveScale,
              position: 'relative',
              margin: '0 auto',
              overflow: 'hidden',
            }}
          >
            <div
              className="report-print-container"
              style={{
                width: A4_WIDTH_PX,
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `scale(${effectiveScale})`,
                transformOrigin: 'top left',
              }}
            >
              {pages.map((page, pageIndex) => {
                pageRefs.current.length = pages.length;

                return (
                  <div
                    key={pageIndex}
                    ref={el => {
                      pageRefs.current[pageIndex] = el;
                    }}
                    className="report-page bg-white border border-gray-200"
                    style={{
                      width: A4_WIDTH_PX,
                      height: A4_HEIGHT_PX,
                      marginBottom: pageIndex === pages.length - 1 ? 0 : PAGE_GAP_PX,
                      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                      position: 'relative',
                      overflow: 'hidden',
                      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
                    }}
                  >
                    {renderPageContent(pageIndex)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Page Thumbnails */}
        <aside className="no-print hidden lg:block w-[124px] shrink-0 h-full overflow-hidden">
          <PageThumbnailPanel
            pages={pages}
            activePageIndex={activePageIndex}
            onSelectPage={handleSelectPage}
            renderPage={renderPageContent}
          />
        </aside>

      </div>

      {isOrderDrawerOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/35" onClick={() => setIsOrderDrawerOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-[88vw] max-w-[360px] bg-white shadow-2xl border-l border-gray-200 p-3 overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between mb-1 shrink-0">
              <p className="text-sm font-semibold text-gray-800">Arrange & Configure Settings</p>
              <button
                onClick={() => setIsOrderDrawerOpen(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded border border-gray-300 text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 scrollbar-thin">
              <OrderManagementPanel
                sections={sectionOrder.map(id => reportData!.testSections.find(s => s.id === id)).filter(Boolean) as TestSection[]}
                visibleSections={visibleSections}
                onToggleVisibility={toggleSectionVisibility}
                moveUp={moveUp}
                moveDown={moveDown}
                resetOrder={resetOrder}
                setDraggingId={setDraggingId}
                onDropReorder={onDropReorder}
                compact
                allSelected={allSelected}
                onToggleSelectAll={toggleSelectAll}
                selectedCount={visibleSections.size}
              />
            </div>
          </div>
        </div>
      )}

      {id && (
        <ShareReportModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          reportId={id}
          sampleIdCode={rawReport?.sample_id_code}
          patientName={rawReport?.patient_name}
          patientPhone={rawReport?.patient_phone}
          patientEmail={rawReport?.patient_email}
          doctorName={rawReport?.doctor_name ? (/^dr\.?/i.test(rawReport.doctor_name) ? rawReport.doctor_name : `${rawReport.doctor_title || 'Dr'}. ${rawReport.doctor_name}`) : undefined}
          doctorPhone={rawReport?.doctor_phone}
          doctorEmail={rawReport?.doctor_email}
          hasDoctorRef={!!rawReport?.doctor_id}
        />
      )}
    </div>
  );
}
function OrderManagementPanel({
  sections,
  visibleSections,
  onToggleVisibility,
  moveUp,
  moveDown,
  resetOrder,
  setDraggingId,
  onDropReorder,
  compact = false,
  allSelected,
  onToggleSelectAll,
  selectedCount,
}: {
  sections: TestSection[];
  visibleSections: Set<string>;
  onToggleVisibility: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  resetOrder: () => void;
  setDraggingId: (id: string | null) => void;
  onDropReorder: (id: string) => void;
  compact?: boolean;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  selectedCount: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-3 sm:p-3.5 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <p className="text-xs sm:text-sm font-semibold text-slate-800">Test Order Management</p>
        <button
          onClick={resetOrder}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-white cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
      <p className="text-[11px] text-slate-500 mb-3 flex-shrink-0">Select tests to include in preview and drag to reorder</p>

      {/* Select All Checkbox & Count Badge */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-lg mb-3 flex-shrink-0">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleSelectAll}
            className="w-4 h-4 rounded border-slate-300 cursor-pointer"
          />
          Select All
        </label>
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full select-none">
          {selectedCount} Selected
        </span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 scrollbar-thin">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => setDraggingId(section.id)}
            onDragEnd={() => setDraggingId(null)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDropReorder(section.id)}
            className={`flex items-center gap-2 rounded-lg border px-2 h-11 transition shrink-0 ${visibleSections.has(section.id) ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300 hover:shadow-sm' : 'border-gray-250 bg-gray-50 dark:bg-slate-950/20 opacity-60'}`}
          >
            <input
              type="checkbox"
              checked={visibleSections.has(section.id)}
              onChange={() => onToggleVisibility(section.id)}
              className="w-4 h-4 rounded border-slate-300 cursor-pointer shrink-0"
              title="Show in preview"
            />
            <GripVertical className="w-4 h-4 text-slate-400 shrink-0 cursor-grab active:cursor-grabbing" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-400 min-w-6 shrink-0">{idx + 1}.</span>
            <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-300 min-w-0 truncate flex-1" title={section.testName}>{section.testName}</span>
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <button
                onClick={() => moveUp(section.id)}
                className="w-7 h-7 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                title="Move up"
              >
                <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button
                onClick={() => moveDown(section.id)}
                className="w-7 h-7 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                title="Move down"
              >
                <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer message checkbox */}
      <div className="flex items-center gap-2 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-2 mt-3 border border-blue-100/50 dark:border-blue-900/40 select-none shrink-0">
        <input
          type="checkbox"
          checked={true}
          disabled
          className="w-3.5 h-3.5 rounded border-blue-300 text-blue-600 bg-blue-100 shrink-0 opacity-80"
        />
        <span>Only selected tests will appear in preview</span>
      </div>
    </div>
  );
}


// Set up pdf.js worker globally
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const isPdfPage = (page: any) => {
  if (typeof page === 'string') {
    return page.toLowerCase().endsWith('.pdf') || page.startsWith('data:application/pdf');
  }
  if (page instanceof File || page instanceof Blob) {
    return page.type === 'application/pdf';
  }
  return false;
};

function PdfThumbnail({
  pdfSource,
  pageNumber,
}: {
  pdfSource: string | File | Blob;
  pageNumber: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let renderTask: any = null;

    async function renderPdfPage() {
      try {
        let source: any;
        if (pdfSource instanceof File || pdfSource instanceof Blob) {
          const arrayBuffer = await pdfSource.arrayBuffer();
          source = { data: new Uint8Array(arrayBuffer) };
        } else {
          source = { url: pdfSource };
        }

        const loadingTask = pdfjsLib.getDocument(source);
        const pdf = await loadingTask.promise;
        if (!active) return;

        const page = await pdf.getPage(pageNumber);
        if (!active) return;

        const viewport = page.getViewport({ scale: 0.15 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
          canvas,
        });

        await renderTask.promise;
      } catch (err: any) {
        console.error('Error rendering PDF thumbnail:', err);
        if (active) {
          setError(err.message || 'Error rendering PDF');
        }
      }
    }

    renderPdfPage();

    return () => {
      active = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfSource, pageNumber]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[10px] text-red-500 p-1 text-center select-none">
        Failed to render PDF
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}

function PageThumbnailPanel({
  pages,
  activePageIndex,
  onSelectPage,
  renderPage,
}: {
  pages: any[];
  activePageIndex: number;
  onSelectPage: (idx: number) => void;
  renderPage?: (idx: number) => React.ReactNode;
}) {
  const thumbnailRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    const activeEl = thumbnailRefs.current[activePageIndex];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activePageIndex]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm select-none h-full flex flex-col overflow-hidden">
      <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between flex-shrink-0">
        <span>Pages</span>
        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] font-bold">
          {pages.length}
        </span>
      </p>
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-thin">
        {pages.map((page, idx) => (
          <div
            key={idx}
            ref={(el) => { thumbnailRefs.current[idx] = el; }}
            onClick={() => onSelectPage(idx)}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            {/* Miniature Page representation */}
            <div
              className={`w-[76px] h-[107px] bg-slate-50 dark:bg-slate-950 border rounded shadow-sm transition-all overflow-hidden relative ${activePageIndex === idx
                  ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-950'
                  : 'border-slate-200 dark:border-slate-800 group-hover:border-slate-300 dark:group-hover:border-slate-700'
                }`}
            >
              {isPdfPage(page) ? (
                <PdfThumbnail pdfSource={page} pageNumber={idx + 1} />
              ) : renderPage ? (
                <div
                  style={{
                    width: `${A4_WIDTH_PX}px`,
                    height: `${A4_HEIGHT_PX}px`,
                    transform: `scale(${76 / A4_WIDTH_PX})`,
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                  className="bg-white"
                >
                  {renderPage(idx)}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                  Page {idx + 1}
                </div>
              )}
            </div>
            {/* Circle badge page indicator */}
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${activePageIndex === idx
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                }`}
            >
              {idx + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Barcode({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value && value !== 'N/A') {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: 1.2,
          height: 16,
          displayValue: false,
          margin: 0,
        });
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
  }, [value]);

  if (!value || value === 'N/A') {
    return <span style={{ fontSize: '10px', color: '#999' }}>No Barcode</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg ref={svgRef} style={{ maxHeight: '16px' }} />
      <p style={{ margin: '2px 0 0', fontSize: '8px', color: C.text, letterSpacing: '0.8px', fontFamily: 'monospace', lineHeight: 1, fontWeight: 600 }}>{value}</p>
    </div>
  );
}
