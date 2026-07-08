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
import { PatientInfoHeader } from '../../app/components/reports/PatientInfoHeader';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import * as pdfjsLib from 'pdfjs-dist';
import { ShareReportModal } from '../../app/components/WhatsAppModal';
import {
  ImprovedPatientBox,
  InvestigationTableHeader,
  InvestigationTableRow,
  ReportLayoutConfig,
  SectionGroupHeader,
  TestSectionBlock,
} from '../../app/components/ImprovedReportLayout';
import { useAuthStore, useDoctorStore, useSettingsStore } from '../../stores';
import { useBranchStore } from '../../stores/branchStore';
import { useReportStore } from '../../stores/reportStore';
import { useTestStore } from '../../stores/testStore';
import { formatAge } from '../../utils/age';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const PAGE_GAP_PX = 24;

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
  .report-viewer-shell { padding: 0 !important; background: #fff !important; display: block !important; }
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

type Parameter = {
  name: string;
  result: string;
  unit: string;
  refRange: string;
  isAbnormal: boolean;
  status?: string;
  fieldType?: string;
  group?: string;
  isMandatory?: boolean;
};

type TestSection = {
  id: string;
  testId?: string;
  testName: string;
  parameters: Parameter[];
};

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

type TestChunk = {
  sectionId: string;
  title: string;
  continuation: boolean;
  parameters: Parameter[];
};

type PageItem =
  | { type: 'patient' }
  | { type: 'test'; chunk: TestChunk }
  | { type: 'interpretation'; testId: string; text: string }
  | { type: 'generalNotes'; text: string }
  | { type: 'endMarker' }
  | { type: 'signature' }
  | { type: 'marketing'; pageConfig: any };

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
function estimateInterpretationHeight(text: string, dense: boolean) {
  const charsPerLine = dense ? 100 : 90;
  const lineHeight = dense ? 14 : 16;
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return 24 + 16 + 14 + lines * lineHeight; // margin-top (24) + padding (16) + title (14) + lines
}

function estimateSectionHeight(section: TestSection, params: Parameter[], dense: boolean) {
  // Row height must match actual rendered: 3px top pad + ~15px text + 3px bottom pad = ~21px
  const rowHeight = dense ? 21 : 23;
  const groupHeaderHeight = dense ? 23 : 25;
  const uniqueGroupRows = params.reduce((count, p, idx) => {
    if (!p.group) return count;
    const prev = idx > 0 ? params[idx - 1].group : undefined;
    return prev !== p.group ? count + 1 : count;
  }, 0);

  const heading = 26;       // section title with lines + margin
  const tableHeader = 24;   // header row with border
  const rows = params.length * rowHeight;
  const groups = uniqueGroupRows * groupHeaderHeight;
  const spacing = 10;       // bottom margin
  return heading + tableHeader + rows + groups + spacing;
}

function splitSection(section: TestSection, maxChunkHeight: number, dense: boolean): TestChunk[] {
  const fullHeight = estimateSectionHeight(section, section.parameters, dense);
  if (fullHeight <= maxChunkHeight) {
    return [
      {
        sectionId: section.id,
        title: section.testName,
        continuation: false,
        parameters: section.parameters,
      },
    ];
  }

  const chunks: TestChunk[] = [];
  let current: Parameter[] = [];

  for (let i = 0; i < section.parameters.length; i++) {
    const candidate = [...current, section.parameters[i]];
    const candidateHeight = estimateSectionHeight(section, candidate, dense);
    const nextParam = i + 1 < section.parameters.length ? section.parameters[i + 1] : null;
    const isGroupChanging = nextParam && candidate[candidate.length - 1].group !== nextParam.group;

    if (candidateHeight > maxChunkHeight && current.length > 0) {
      // If we're about to change groups and only have 1 item in current group, keep at least one from next group
      const currentGroupItems = current.filter(p => p.group === current[current.length - 1]?.group).length;
      if (isGroupChanging && currentGroupItems <= 1 && current.length < 3) {
        current = candidate;
        continue;
      }
      chunks.push({
        sectionId: section.id,
        title: section.testName,
        continuation: chunks.length > 0,
        parameters: current,
      });
      current = [section.parameters[i]];
      continue;
    }

    current = candidate;
  }

  if (current.length > 0) {
    chunks.push({
      sectionId: section.id,
      title: section.testName,
      continuation: chunks.length > 0,
      parameters: current,
    });
  }

  return chunks;
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
  const { user } = useAuthStore();
  const [containerWidth, setContainerWidth] = useState(A4_WIDTH_PX);
  const backPath = user?.role === 'doctor' ? '/doctor-reports' : '/reports';
  const backLabel = user?.role === 'doctor' ? 'My Reports' : 'Reports';

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showLetterhead, setShowLetterhead] = useState(true);
  const [safeZones, setSafeZones] = useState<SafeZones>({ top: 52, bottom: 56, left: 24, right: 24 });
  const [zoom, setZoom] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [originalSectionOrder, setOriginalSectionOrder] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [activePageIndex, setActivePageIndex] = useState(0);

  const viewerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shareAutoOpened = useRef(false);

  const rawReport = useMemo(
    () => (selectedReport?.id === id ? selectedReport : reports.find(r => r.id === id)),
    [selectedReport, reports, id],
  );

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
    }
  }, [id, fetchReportById, fetchBranches]);

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
            if (setting && setting.group !== undefined) {
              return { ...p, group: setting.group || undefined };
            }
            return p;
          });

          filteredParams = filterBlankOptionalParams(filteredParams);

          testSections.push({
            id: `${group.testId || group.testName || 'test'}-${i}`,
            testId: group.testId,
            testName: group.testName,
            parameters: filteredParams,
          });
          params.push(...filteredParams);
        } else {
          const filteredParams = filterBlankOptionalParams(sectionParams);
          testSections.push({
            id: `${group.testId || group.testName || 'test'}-${i}`,
            testId: group.testId,
            testName: group.testName,
            parameters: filteredParams,
          });
          params.push(...filteredParams);
        }
      }
    } else if (testData?.parameters?.length) {
      const sectionParams = testData.parameters.map((p: any) => mapParam(p));
      const filteredParams = filterBlankOptionalParams(sectionParams);
      testSections.push({
        id: 'legacy-0',
        testName: testData.testName || rawReport.report_type || 'General Test',
        parameters: filteredParams,
      });
      params.push(...filteredParams);
    }

    const collectionDate = rawReport.collection_date || rawReport.created_at;
    const reportedAt = rawReport.approved_at || rawReport.created_at;

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
      testSections,
      parameters: params,
      technician: {
        name:
          rawReport.technician_firstname && rawReport.technician_lastname
            ? `${rawReport.technician_firstname} ${rawReport.technician_lastname}, MLT`
            : 'Lab Technician',
      },
    };

    setReportData(nextData);
    const ids = nextData.testSections.map(s => s.id);
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






  const pages = useMemo(() => {
    if (!reportData) return [] as PageItem[][];

    const contentHeight = A4_HEIGHT_PX - safeZones.top - safeZones.bottom;
    const isDense = density !== 'comfortable';

    const patientHeight = 100;
    const signatureHeight = 72;
    const endMarkerHeight = 20;

    const testData =
      typeof rawReport?.test_data === 'string' ? JSON.parse(rawReport.test_data) : rawReport?.test_data;
    const layoutSnapshots = testData?.layout_snapshots || {};

    const maxChunkHeight = Math.max(160, contentHeight - 50);
    const chunks = orderedSections.flatMap(section => splitSection(section, maxChunkHeight, isDense));

    // First pass: calculate total height to detect overflow
    let totalNeeded = patientHeight;
    for (const chunk of chunks) {
      const section = orderedSections.find(s => s.id === chunk.sectionId);
      if (section) {
        totalNeeded += estimateSectionHeight(section, chunk.parameters, isDense);
        // Add interpretation height if final chunk of section has significance
        const isLastChunk = chunks.filter(c => c.sectionId === chunk.sectionId).pop() === chunk;
        if (isLastChunk && section.testId) {
          const sig = layoutSnapshots[section.testId]?.clinical_significance;
          if (sig?.trim()) {
            totalNeeded += estimateInterpretationHeight(sig.trim(), isDense);
          }
        }
      }
    }

    // Add general clinical notes if present
    if (rawReport?.clinical_notes?.trim()) {
      totalNeeded += estimateInterpretationHeight(rawReport.clinical_notes.trim(), isDense);
    }

    totalNeeded += signatureHeight + endMarkerHeight;

    const overflow = totalNeeded - contentHeight;

    // If overflow is small (< 120px), apply micro-compaction to row heights
    const needsCompact = overflow > 0 && overflow <= 120;
    const compactScale = needsCompact ? Math.max(0.82, 1 - (overflow + 20) / totalNeeded) : 1;

    const estimateHeight = (section: TestSection, params: Parameter[]) => {
      const base = estimateSectionHeight(section, params, isDense);
      return needsCompact ? Math.floor(base * compactScale) : base;
    };

    const out: PageItem[][] = [[]];
    let currentHeight = 0;

    const place = (item: PageItem, itemHeight: number) => {
      if (currentHeight + itemHeight > contentHeight && out[out.length - 1].length > 0) {
        out.push([]);
        currentHeight = 0;
      }
      out[out.length - 1].push(item);
      currentHeight += itemHeight;
    };

    place({ type: 'patient' }, patientHeight);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const section = orderedSections.find(s => s.id === chunk.sectionId);
      if (!section) continue;

      const chunkH = estimateHeight(section, chunk.parameters);

      let sigH = 0;
      const isLastChunk = chunks.filter(c => c.sectionId === chunk.sectionId).pop() === chunk;
      if (isLastChunk && section.testId) {
        const sig = layoutSnapshots[section.testId]?.clinical_significance;
        if (sig?.trim()) {
          sigH = needsCompact
            ? Math.floor(estimateInterpretationHeight(sig.trim(), isDense) * compactScale)
            : estimateInterpretationHeight(sig.trim(), isDense);
        }
      }

      let trailingH = 0;
      const isLastChunkOverall = i === chunks.length - 1;
      if (isLastChunkOverall) {
        if (rawReport?.clinical_notes?.trim()) {
          const notes = rawReport.clinical_notes.trim();
          trailingH += needsCompact
            ? Math.floor(estimateInterpretationHeight(notes, isDense) * compactScale)
            : estimateInterpretationHeight(notes, isDense);
        }
        trailingH += signatureHeight + endMarkerHeight;
      }

      const totalSectionHeight = chunkH + sigH + trailingH;

      const currentHasContent = out[out.length - 1].some(item => item.type === 'test' || item.type === 'interpretation');
      if (currentHasContent && currentHeight + totalSectionHeight > contentHeight && totalSectionHeight <= contentHeight) {
        out.push([]);
        currentHeight = 0;
      }

      place({ type: 'test', chunk }, chunkH);

      if (sigH > 0) {
        const sig = layoutSnapshots[section.testId]?.clinical_significance;
        place({ type: 'interpretation', testId: section.testId, text: sig!.trim() }, sigH);
      }
    }

    if (rawReport?.clinical_notes?.trim()) {
      const notes = rawReport.clinical_notes.trim();
      const notesH = needsCompact
        ? Math.floor(estimateInterpretationHeight(notes, isDense) * compactScale)
        : estimateInterpretationHeight(notes, isDense);
      place({ type: 'generalNotes', text: notes }, notesH);
    }

    const tailHeight = signatureHeight + endMarkerHeight;
    if (currentHeight + tailHeight > contentHeight && out[out.length - 1].length > 0) {
      out.push([]);
      currentHeight = 0;
    }
    out[out.length - 1].push({ type: 'endMarker' });
    out[out.length - 1].push({ type: 'signature' });

    const shouldAttachMarketing = rawReport?.is_self_report || rawReport?.attach_marketing_pages;
    if (shouldAttachMarketing && rawReport?.marketing_pages && Array.isArray(rawReport.marketing_pages)) {
      const activeMarketingPages = rawReport.marketing_pages.filter((p: any) => p.active && (p.url || p.previewUrl));
      for (const mPage of activeMarketingPages) {
        out.push([{ type: 'marketing', pageConfig: mPage }]);
      }
    }

    return out;
  }, [reportData, orderedSections, safeZones, rawReport, density]);

  // Derive compactAdjustment from pages for rendering
  const compactAdjustment = useMemo(() => {
    if (!reportData) return 0;
    const contentHeight = A4_HEIGHT_PX - safeZones.top - safeZones.bottom;
    const isDense = density !== 'comfortable';

    const testData =
      typeof rawReport?.test_data === 'string' ? JSON.parse(rawReport.test_data) : rawReport?.test_data;
    const layoutSnapshots = testData?.layout_snapshots || {};

    let totalNeeded = 100; // patient
    for (const section of orderedSections) {
      totalNeeded += estimateSectionHeight(section, section.parameters, isDense);
      if (section.testId) {
        const sig = layoutSnapshots[section.testId]?.clinical_significance;
        if (sig?.trim()) {
          totalNeeded += estimateInterpretationHeight(sig.trim(), isDense);
        }
      }
    }
    if (rawReport?.clinical_notes?.trim()) {
      totalNeeded += estimateInterpretationHeight(rawReport.clinical_notes.trim(), isDense);
    }
    totalNeeded += 92; // signature + end marker

    const overflow = totalNeeded - contentHeight;
    return (overflow > 0 && overflow <= 120) ? overflow : 0;
  }, [reportData, orderedSections, safeZones, rawReport, density]);

  // Scroll-spying to update active page index
  useEffect(() => {
    if (!viewerRef.current) return;

    const observerOptions = {
      root: viewerRef.current,
      threshold: 0.25,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && viewerRef.current) {
          const pagesList = Array.from(viewerRef.current.querySelectorAll('.report-page'));
          const index = pagesList.indexOf(entry.target);
          if (index !== -1) {
            setActivePageIndex(index);
          }
        }
      });
    }, observerOptions);

    const pagesList = viewerRef.current.querySelectorAll('.report-page');
    pagesList.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [pages, reportData]);

  const handleSelectPage = (index: number) => {
    setActivePageIndex(index);
    if (!viewerRef.current) return;
    const pagesList = viewerRef.current.querySelectorAll('.report-page');
    if (pagesList && pagesList[index]) {
      pagesList[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isSelfReport = reportData?.patient.referringDoctor === 'Self' || rawReport?.is_self_report;
  const refDoctor = doctors.find(d => d.id === rawReport?.doctor_id);
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

  const generatePDF = useCallback(async (): Promise<File | null> => {
    if (!reportData || pages.length === 0) return null;
    setIsGeneratingPdf(true);

    // Render clones in the MAIN document (not an iframe) so they get the
    // exact same fonts, styles, and layout engine as the preview.
    // This is the root fix for bottom-cropping: the iframe had different
    // font metrics / rendering context which made content taller than expected.
    const offscreenRoot = document.createElement('div');
    offscreenRoot.style.position = 'fixed';
    offscreenRoot.style.top = '0';
    offscreenRoot.style.left = '0';
    offscreenRoot.style.width = `${A4_WIDTH_PX}px`;
    offscreenRoot.style.height = `${A4_HEIGHT_PX}px`;
    offscreenRoot.style.zIndex = '-9999';
    offscreenRoot.style.opacity = '0';
    offscreenRoot.style.pointerEvents = 'none';
    offscreenRoot.style.overflow = 'hidden';
    document.body.appendChild(offscreenRoot);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4', true);

      for (let i = 0; i < pages.length; i++) {
        const node = pageRefs.current[i];
        if (!node) continue;
        if (i > 0) pdf.addPage();

        const cloned = node.cloneNode(true) as HTMLElement;

        // Reset visual styles that are only for the preview
        cloned.style.transform = 'none';
        cloned.style.position = 'relative';
        cloned.style.margin = '0';
        cloned.style.boxShadow = 'none';
        cloned.style.border = 'none';
        cloned.style.width = `${A4_WIDTH_PX}px`;
        cloned.style.height = `${A4_HEIGHT_PX}px`;
        cloned.style.overflow = 'hidden';
        offscreenRoot.appendChild(cloned);

        // Wait for all images to load
        const imgs = cloned.querySelectorAll('img');
        await Promise.all(
          Array.from(imgs).map(
            img => new Promise(resolve => {
              const imgEl = img as HTMLImageElement;
              if (imgEl.complete && imgEl.naturalHeight > 0) {
                resolve(true);
              } else {
                imgEl.onload = () => resolve(true);
                imgEl.onerror = () => resolve(true);
              }
            })
          )
        );

        // Wait for layout to settle
        await new Promise(r => setTimeout(r, 150));

        const canvas = await html2canvas(cloned, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: A4_WIDTH_PX,
          height: A4_HEIGHT_PX,
          windowWidth: A4_WIDTH_PX,
          windowHeight: A4_HEIGHT_PX,
          scrollX: 0,
          scrollY: 0,
          onclone: (doc) => {
            doc.body.style.setProperty('-webkit-font-smoothing', 'antialiased');
          },
        });


        offscreenRoot.removeChild(cloned);

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      const fileName = `Report-${reportData.patient.name.replace(/\s+/g, '_')}-${reportData.report.id}.pdf`;
      const blob = pdf.output('blob');
      return new File([blob], fileName, { type: 'application/pdf' });
    } catch (err) {
      console.error('PDF generation failed:', err);
      return null;
    } finally {
      document.body.removeChild(offscreenRoot);
      setIsGeneratingPdf(false);
    }
  }, [reportData, pages, safeZones]);




  const handleDownloadPdf = useCallback(async () => {
    const file = await generatePDF();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatePDF]);

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

  const isDense = density !== 'comfortable';
  const signatureHeight = 72;
  const endMarkerHeight = 20;

  const renderPageContent = (pageIndex: number) => {
    const page = pages[pageIndex];
    if (!page) return null;
    const marketingItem = page[0]?.type === 'marketing' ? page[0] : null;
    const isMarketingPage = !!marketingItem;

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
              gap: compactAdjustment > 0 ? 1 : 3,
              fontSize: compactAdjustment > 60 ? 10.5 : 11,
              lineHeight: compactAdjustment > 60 ? 1.35 : 1.45,
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
                          size={68}
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
                return (
                  <TestSectionBlock
                    key={`t-${idx}`}
                    testName={item.chunk.continuation ? `${item.chunk.title} (cont.)` : item.chunk.title}
                    isFirstSection={false}
                    colorTokens={C}
                  >
                    <table style={{
                      width: '100%',
                      borderCollapse: 'separate',
                      borderSpacing: 0,
                      tableLayout: 'fixed',
                      marginTop: compactAdjustment > 0 ? '1px' : '2px'
                    }}><InvestigationTableHeader colorTokens={C} /><tbody>
                        {item.chunk.parameters.map((param, rowIdx) => {
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
                                  compact={compactAdjustment > 0}
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
                                compact={compactAdjustment > 0}
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
                return (
                  <div
                    key={`i-${idx}`}
                    style={{
                      marginTop: '8px',
                      fontSize: '9.5px',
                      color: '#222',
                      lineHeight: 1.45,
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#111', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Clinical Significance
                    </div>
                    <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                      {item.text}
                    </p>
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
                      fontSize: '9.5px',
                      color: '#222',
                      lineHeight: 1.45,
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#111', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Technician Notes / Interpretation
                    </div>
                    <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                      {item.text}
                    </p>
                  </div>
                );
              }

              // Find item.type === 'endMarker' block, replace with:
              if (item.type === 'endMarker') {
                return (
                  <div key={`e-${idx}`} style={{ textAlign: 'center', fontSize: '9px', color: '#999', letterSpacing: '2px', margin: '6px 0' }}>
                    *** End of Report ***
                  </div>
                );
              }

              return (
                <section key={`s-${idx}`} style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: hasDoctorSignature ? 'space-between' : 'flex-start' }}>
                    <div>
                      <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                        {ownerSigUrl && (
                          <img
                            src={getImageUrl(ownerSigUrl) || ''}
                            alt="Owner Signature"
                            style={{ maxHeight: 40, objectFit: 'contain' }}
                          />
                        )}
                      </div>
                      <div style={{ borderTop: '1px solid #333', paddingTop: 4, minWidth: '140px' }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#111' }}>
                          {ownerSigLabel}
                        </p>
                        <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#666' }}>{ownerSigDesc}</p>
                      </div>
                    </div>

                    {hasDoctorSignature && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 4 }}>
                          {doctorSignatureUrl && (
                            <img
                              src={getImageUrl(doctorSignatureUrl) || ''}
                              alt="Doctor Signature"
                              style={{ maxHeight: 40, objectFit: 'contain' }}
                            />
                          )}
                        </div>
                        <div style={{ borderTop: '1px solid #333', paddingTop: 4, minWidth: '140px' }}>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#111' }}>
                            {doctorSignatureName || 'Doctor'}
                          </p>
                          <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#666' }}>{doctorSignatureDescription || 'Consultant'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </>
    );
  };

  const effectiveScale = clamp(baseScale * zoom, 0.3, 2);
  const stackHeight = pages.length * A4_HEIGHT_PX + Math.max(0, pages.length - 1) * PAGE_GAP_PX;
  return (
    <div className="flex flex-col h-[calc(100vh-76px)] overflow-hidden space-y-2.5 w-full px-1.5 sm:px-2 pb-1.5 bg-slate-50/50 dark:bg-slate-950/20">
      <style>{printStyles}</style>

      {/* Top Patient Info Bar */}
      <div className="no-print flex-shrink-0">
        <PatientInfoHeader
          mode="preview"
          patient={patientProp}
          selectedReport={rawReport}
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
        />
      </div>

      {/* Main workbench */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden mb-1 w-full">

        {/* Left Column: Test Order Management */}
        <aside className="hidden lg:block w-[308px] shrink-0 h-full overflow-hidden">
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
        </aside>

        {/* Center Column: A4 Report Pages Stack (the ONLY scrolling container) */}
        <div
          ref={viewerRef}
          className="flex-1 h-full overflow-y-auto overflow-x-auto flex justify-center bg-[#EEF1F6] dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-xl p-3 scrollbar-thin"
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
        <aside className="hidden lg:block w-[124px] shrink-0 h-full overflow-hidden">
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
          <div className="absolute top-0 right-0 h-full w-[88vw] max-w-[360px] bg-white shadow-2xl border-l border-gray-200 p-3 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800">Arrange Tests</p>
              <button
                onClick={() => setIsOrderDrawerOpen(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded border border-gray-300 text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <OrderManagementPanel
              sections={sectionOrder.map(id => reportData.testSections.find(s => s.id === id)).filter(Boolean) as TestSection[]}
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
      )}

      {id && (
        <ShareReportModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          reportId={id}
          generatePDF={generatePDF}
          sampleIdCode={rawReport?.sample_id_code}
          patientName={rawReport?.patient_name}
          patientPhone={rawReport?.patient_phone}
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
            <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-300 min-w-0 truncate" title={section.testName}>{section.testName}</span>
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
          height: 20,
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
      <svg ref={svgRef} style={{ maxHeight: '20px' }} />
      <p style={{ margin: '2px 0 0', fontSize: '8px', color: C.text, letterSpacing: '0.8px', fontFamily: 'monospace', lineHeight: 1, fontWeight: 600 }}>{value}</p>
    </div>
  );
}
