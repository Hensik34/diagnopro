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
import { Link, useParams, useSearchParams } from 'react-router';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
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
  low: '#1565C0',
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
};

type TestSection = {
  id: string;
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
  | { type: 'interpretation'; text: string }
  | { type: 'endMarker' }
  | { type: 'signature' };

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
  const charsPerLine = 110;
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return 16 + lines * 14;
}

function estimateSectionHeight(section: TestSection, params: Parameter[], dense: boolean) {
  const rowHeight = 15;
  const groupHeaderHeight = 16;
  const uniqueGroupRows = params.reduce((count, p, idx) => {
    if (!p.group) return count;
    const prev = idx > 0 ? params[idx - 1].group : undefined;
    return prev !== p.group ? count + 1 : count;
  }, 0);

  const heading = 18;
  const tableHeader = 15;
  const rows = params.length * rowHeight;
  const groups = uniqueGroupRows * groupHeaderHeight;
  const spacing = 8;
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
  const { reports, selectedReport, fetchReportById, isLoading, error } = useReportStore();
  const { branches, fetchBranches, currentBranchId } = useBranchStore();
  const { testFields, fetchTestFieldsMulti } = useTestStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { doctors, fetchDoctors } = useDoctorStore();
  const { user } = useAuthStore();

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

  const viewerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shareAutoOpened = useRef(false);

  const rawReport = useMemo(
    () => (selectedReport?.id === id ? selectedReport : reports.find(r => r.id === id)),
    [selectedReport, reports, id],
  );

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

  const reportBranchId = (rawReport as any)?.branch_id || currentBranchId;

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

  useEffect(() => {
    if (!rawReport) return;

    const branch = branches.find(b => b.id === (rawReport as any).branch_id);
    const age = formatAge(rawReport.patient_age, rawReport.patient_age_unit) || 'N/A';
    const doctorName = rawReport.doctor_name
      ? `${rawReport.doctor_title || 'Dr'}. ${rawReport.doctor_name}`
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
      isAbnormal: p.status === 'low' || p.status === 'high' || p.status === 'critical',
      status: p.status,
      fieldType: p.fieldType || undefined,
      group: p.group || (testId ? sectionGroupMap.get(`${testId}::${p.name}`) : undefined),
    });

    const testSections: TestSection[] = [];
    const params: Parameter[] = [];

    if (testData?.tests?.length) {
      for (let i = 0; i < testData.tests.length; i++) {
        const group = testData.tests[i];
        const sectionParams = (group.parameters || []).map((p: any) => mapParam(p, group.testId));
        testSections.push({
          id: `${group.testId || group.testName || 'test'}-${i}`,
          testName: group.testName,
          parameters: sectionParams,
        });
        params.push(...sectionParams);
      }
    } else if (testData?.parameters?.length) {
      const sectionParams = testData.parameters.map((p: any) => mapParam(p));
      testSections.push({
        id: 'legacy-0',
        testName: testData.testName || rawReport.report_type || 'General Test',
        parameters: sectionParams,
      });
      params.push(...sectionParams);
    }

    const collectionDate = (rawReport as any).collection_date || rawReport.created_at;
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
  }, [rawReport, branches, sectionGroupMap]);

  useEffect(() => {
    if (searchParams.get('share') === '1' && reportData && !shareAutoOpened.current) {
      setShowShareModal(true);
      shareAutoOpened.current = true;
    }
  }, [searchParams, reportData]);

  // Simple, deterministic safe zone calculation.
  // Settings values are the single source of truth.
  // Keep margins and safe areas all the time so they are reserved for pre-printed letterhead.
  useEffect(() => {
    const marginTop = parsePx(settings?.report_margin_top, 80);
    const marginBottom = parsePx(settings?.report_margin_bottom, 80);
    const marginLeft = parsePx(settings?.report_margin_left, 24);
    const marginRight = parsePx(settings?.report_margin_right, 24);
    const headerSafe = parsePx(settings?.header_safe_area, 0);
    const footerSafe = parsePx(settings?.footer_safe_area, 0);

    setSafeZones({
      top: clamp(marginTop + headerSafe, 0, Math.round(A4_HEIGHT_PX * 0.45)),
      bottom: clamp(marginBottom + footerSafe, 0, Math.round(A4_HEIGHT_PX * 0.45)),
      left: clamp(marginLeft, 0, 80),
      right: clamp(marginRight, 0, 80),
    });
  }, [settings]);

  useLayoutEffect(() => {
    const node = viewerRef.current;
    if (!node) return;

    const updateScale = () => {
      const width = node.clientWidth;
      const fit = clamp((width - 24) / A4_WIDTH_PX, 0.45, 1);
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
    () => (reportData?.parameters ?? []).filter(p => p.status === 'high' || p.status === 'low' || p.status === 'critical'),
    [reportData],
  );

  const remarkText = useMemo(() => {
    if (rawReport?.clinical_notes?.trim()) return rawReport.clinical_notes.trim();
    if (abnormalParams.length === 0) return null;
    return abnormalParams
      .map(p => {
        const dir = p.status === 'critical' ? 'critical' : p.status === 'high' ? 'elevated' : 'below normal range';
        return `${p.name} is ${dir} (${p.result} ${p.unit}).`;
      })
      .join(' ') + ' Clinical correlation is advised.';
  }, [rawReport, abnormalParams]);

  const density = useMemo(() => {
    const count = orderedSections.reduce((s, sec) => s + sec.parameters.length, 0);
    if (count > 140) return 'compact';
    if (count > 75) return 'balanced';
    return 'comfortable';
  }, [orderedSections]);

  const pages = useMemo(() => {
    if (!reportData) return [] as PageItem[][];

    const contentHeight = A4_HEIGHT_PX - safeZones.top - safeZones.bottom;
    const dense = density !== 'comfortable';

    const patientHeight = 92;
    const signatureHeight = 70;
    const endMarkerHeight = 14;

    const maxChunkHeight = Math.max(140, contentHeight - 45);
    const chunks = orderedSections.flatMap(section => splitSection(section, maxChunkHeight, dense));

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

    for (const chunk of chunks) {
      const section = orderedSections.find(s => s.id === chunk.sectionId);
      if (!section) continue;
      const h = estimateSectionHeight(section, chunk.parameters, dense);
      place({ type: 'test', chunk }, h);
    }

    if (remarkText) {
      place({ type: 'interpretation', text: remarkText }, estimateInterpretationHeight(remarkText, dense));
    }

    // Place end marker + signature together; only push new page if we really can't fit
    const tailHeight = signatureHeight + endMarkerHeight;
    if (currentHeight + tailHeight > contentHeight && out[out.length - 1].length > 0) {
      out.push([]);
      currentHeight = 0;
    }
    out[out.length - 1].push({ type: 'endMarker' });
    out[out.length - 1].push({ type: 'signature' });

    return out;
  }, [reportData, orderedSections, safeZones, remarkText, density]);

  const isSelfReport = reportData?.patient.referringDoctor === 'Self' || rawReport?.is_self_report;
  const refDoctor = doctors.find(d => d.id === rawReport?.doctor_id);
  const doctorSignatureUrl = refDoctor?.signature_url;

  const generatePDF = useCallback(async (): Promise<File | null> => {
    if (!reportData || pages.length === 0) return null;

    setIsGeneratingPdf(true);

    // Create a temporary hidden iframe to isolate html2canvas rendering.
    // This keeps the main application's UI perfectly styled and responsive,
    // and allows us to filter out Tailwind's oklch styles entirely from the iframe document context.
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = `${A4_WIDTH_PX}px`;
    iframe.style.height = `${A4_HEIGHT_PX}px`;
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      setIsGeneratingPdf(false);
      return null;
    }

    // Set up standard HTML and standard typography inside the iframe
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        </style>
      </head>
      <body>
        <div id="iframe-content-root"></div>
      </body>
      </html>
    `);
    iframeDoc.close();

    // Copy all stylesheets to the iframe, rewriting any "oklch(...)" colors to a safe fallback
    // color to prevent html2canvas crashes while retaining all layout/reset/table styles.
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
      const styleEl = el as HTMLStyleElement | HTMLLinkElement;
      try {
        let cssText = '';
        if (styleEl.tagName === 'STYLE') {
          cssText = styleEl.textContent || '';
        } else if (styleEl instanceof HTMLLinkElement) {
          if (styleEl.sheet) {
            const rules = styleEl.sheet.cssRules || styleEl.sheet.rules;
            for (let k = 0; k < rules.length; k++) {
              cssText += rules[k].cssText + '\n';
            }
          }
        }

        if (cssText) {
          // Clean the CSS of oklch definitions so html2canvas doesn't crash on parse
          const cleanedCss = cssText.replace(/oklch\([^)]+\)/gi, '#212121');
          const newStyle = iframeDoc.createElement('style');
          newStyle.textContent = cleanedCss;
          iframeDoc.head.appendChild(newStyle);
        } else if (styleEl instanceof HTMLLinkElement) {
          // If no cssText computed but it's a link (e.g. cross-origin/Google Fonts), copy it directly
          const cloned = styleEl.cloneNode(true);
          iframeDoc.head.appendChild(cloned);
        }
      } catch (e) {
        // Fallback: Copy link stylesheet elements directly (they throw CORS error, but don't contain oklch)
        const cloned = styleEl.cloneNode(true);
        iframeDoc.head.appendChild(cloned);
      }
    });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setProperties({ compress: true });
      const root = iframeDoc.getElementById('iframe-content-root');
      if (!root) throw new Error("Iframe root not found");

      // Wait for fonts to be fully loaded inside the iframe doc context
      if (iframeDoc.fonts && iframeDoc.fonts.ready) {
        await iframeDoc.fonts.ready;
      }

      for (let i = 0; i < pages.length; i++) {
        const node = pageRefs.current[i];
        if (!node) continue;

        if (i > 0) pdf.addPage();

        // Clone node into the iframe DOM context
        const clonedNode = node.cloneNode(true) as HTMLElement;
        clonedNode.style.transform = 'none';
        clonedNode.style.position = 'relative';
        clonedNode.style.margin = '0';
        clonedNode.style.boxShadow = 'none';
        clonedNode.style.border = 'none';
        (clonedNode.style as any).WebkitFontSmoothing = 'antialiased';

        root.appendChild(clonedNode);

        // Wait for all images and fonts to load
        const images = clonedNode.querySelectorAll('img');
        const imageLoads = Array.from(images).map(
          img =>
            new Promise(resolve => {
              if ((img as HTMLImageElement).complete) resolve(true);
              else (img as HTMLImageElement).onload = () => resolve(true);
            }),
        );
        await Promise.all(imageLoads);
        await new Promise(r => setTimeout(r, 300));

        const canvas = await html2canvas(clonedNode, {
          scale: 4, // Ultra-high resolution rendering for crisp, sharp output
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: A4_WIDTH_PX,
          height: A4_HEIGHT_PX,
          allowTaint: true,
          windowWidth: A4_WIDTH_PX * 4,
          windowHeight: A4_HEIGHT_PX * 4,
        });

        // Clean up page element from iframe
        root.removeChild(clonedNode);

        const imgData = canvas.toDataURL('image/png'); // PNG for lossless quality
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      }

      const fileName = `Report-${reportData.patient.name.replace(/\s+/g, '_')}-${reportData.report.id}.pdf`;
      const blob = pdf.output('blob');
      return new File([blob], fileName, { type: 'application/pdf' });
    } catch (err) {
      console.error('PDF generation failed:', err);
      return null;
    } finally {
      document.body.removeChild(iframe);
      setIsGeneratingPdf(false);
    }
  }, [reportData, pages]);

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
          <Link to="/reports" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports
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
          <Link to="/reports" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  const letterheadActive = showLetterhead && !!settings?.letterhead_url;
  const headerActive = showLetterhead && !!settings?.header_url && !settings?.letterhead_url;
  const footerActive = showLetterhead && !!settings?.footer_url && !settings?.letterhead_url;
  const hasBranding = !!(settings?.letterhead_url || settings?.header_url || settings?.footer_url);

  const effectiveScale = clamp(baseScale * zoom, 0.45, 2);
  const stackHeight = pages.length * A4_HEIGHT_PX + Math.max(0, pages.length - 1) * PAGE_GAP_PX;

  return (
    <>
      <style>{printStyles}</style>

      <div className="no-print sticky top-12 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-[1300px] mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center gap-2">
          <Link to="/reports" className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Reports
          </Link>

          <div className="flex items-center gap-2 ml-auto">
            {hasBranding && (
              <button
                onClick={() => setShowLetterhead(v => !v)}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border cursor-pointer"
                style={{
                  borderColor: showLetterhead ? C.brand : '#D1D5DB',
                  color: showLetterhead ? C.brand : '#6B7280',
                  backgroundColor: showLetterhead ? C.brandLight : '#F9FAFB',
                }}
              >
                <FileImage className="w-3.5 h-3.5" /> {showLetterhead ? 'Branding On' : 'Branding Off'}
              </button>
            )}

            <button
              onClick={() => setZoom(z => clamp(z - 0.1, 0.6, 2))}
              className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-600 min-w-14 text-center">{Math.round(effectiveScale * 100)}%</span>
            <button
              onClick={() => setZoom(z => clamp(z + 0.1, 0.6, 2))}
              className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsOrderDrawerOpen(true)}
              className="lg:hidden inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Arrange Tests
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              disabled={!hasVisibleTests}
              title={!hasVisibleTests ? 'Select at least one test to share' : 'Share report'}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Share
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || !hasVisibleTests}
              title={!hasVisibleTests ? 'Select at least one test to download' : 'Download as PDF'}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
            </button>
            <button
              onClick={() => window.print()}
              disabled={!hasVisibleTests}
              title={!hasVisibleTests ? 'Select at least one test to print' : 'Print report'}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: !hasVisibleTests ? '#9CA3AF' : C.brand }}
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>
      </div>

      <div className="report-viewer-shell min-h-screen bg-[#EEF1F6] px-0 sm:px-3 py-3">
        <div className="max-w-[1500px] mx-auto flex items-start gap-4">
          <aside className="hidden lg:block w-[308px] shrink-0 sticky top-28 max-h-[calc(100vh-120px)] overflow-y-auto">
            <OrderManagementPanel
              sections={sectionOrder.map(id => reportData!.testSections.find(s => s.id === id)).filter(Boolean) as TestSection[]}
              visibleSections={visibleSections}
              onToggleVisibility={toggleSectionVisibility}
              moveUp={moveUp}
              moveDown={moveDown}
              resetOrder={resetOrder}
              setDraggingId={setDraggingId}
              onDropReorder={onDropReorder}
            />
          </aside>

          <div ref={viewerRef} className="w-full overflow-x-hidden overflow-y-auto">
          <div className="report-print-wrapper" style={{ height: stackHeight * effectiveScale, position: 'relative' }}>
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
                    {letterheadActive && settings?.letterhead_url && (
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

                    {headerActive && settings?.header_url && (
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

                    {footerActive && settings?.footer_url && (
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

                    <div
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
                        gap: 2,
                        fontSize: density === 'compact' ? 9.5 : 10,
                        lineHeight: density === 'compact' ? 1.3 : 1.4,
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
                                    value={`${window.location.origin}/reports/${id}`}
                                    size={46}
                                    level="M"
                                    bgColor="#ffffff"
                                    fgColor={C.brand}
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
                              <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: '0 0', tableLayout: 'fixed', marginTop: '4px' }}>
                                <InvestigationTableHeader colorTokens={C} />
                                <tbody>
                                  {item.chunk.parameters.map((param, rowIdx) => {
                                    const status = (param.status || '').toLowerCase();
                                    const isCritical = status === 'critical';
                                    const isHigh = status === 'high';
                                    const isLow = status === 'low';
                                    const isAbnormal = isCritical || isHigh || isLow;
                                    const statusColor = isCritical ? C.high : isHigh ? C.high : isLow ? C.low : C.text;
                                    const showGroupHeader = !!param.group && param.group !== lastGroup;
                                    if (param.group) lastGroup = param.group;

                                    return (
                                      <React.Fragment key={`${param.name}-${rowIdx}`}>
                                        {showGroupHeader && <SectionGroupHeader title={param.group || ''} colorTokens={C} />}
                                        <InvestigationTableRow
                                          investigation={param.name}
                                          result={param.result}
                                          status={isCritical ? 'Critical' : isHigh ? 'High' : isLow ? 'Low' : ''}
                                          refRange={param.refRange}
                                          unit={param.unit}
                                          isAbnormal={isAbnormal}
                                          statusColor={statusColor}
                                          rowIndex={rowIdx}
                                          indented={!!param.group}
                                          colorTokens={C}
                                        />
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </TestSectionBlock>
                          );
                        }

                        if (item.type === 'interpretation') {
                          return (
                            <section
                              key={`i-${idx}`}
                              style={{
                                padding: `${ReportLayoutConfig.boxPadding.normal}px ${ReportLayoutConfig.boxPadding.normal + 2}px`,
                                background: C.remarkBg,
                                border: `1px solid ${C.remarkBorder}`,
                                borderLeft: `4px solid ${C.remarkBorder}`,
                                borderRadius: 4,
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  marginBottom: 4,
                                  fontSize: `${ReportLayoutConfig.fontSize.header}px`,
                                  fontWeight: 700,
                                  color: C.sectionTitle,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                Interpretation
                              </p>
                              <p style={{ margin: 0, fontSize: `${ReportLayoutConfig.fontSize.value}px`, color: C.secondary }}>
                                {item.text}
                              </p>
                            </section>
                          );
                        }

                        if (item.type === 'endMarker') {
                          return (
                            <div key={`e-${idx}`} style={{ textAlign: 'center', fontSize: '9px', color: C.muted, letterSpacing: '1px' }}>
                              - - - End of Report - - -
                            </div>
                          );
                        }

                        return (
                          <section key={`s-${idx}`} style={{ marginTop: 4 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isSelfReport ? '1fr' : '1fr 1fr', gap: 80 }}>
                              <div>
                                <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                                  {settings?.owner_signature_url && (
                                    <img
                                      src={getImageUrl(settings.owner_signature_url) || ''}
                                      alt="Owner Signature"
                                      style={{ maxHeight: 40, objectFit: 'contain' }}
                                    />
                                  )}
                                </div>
                                <div style={{ borderTop: `1.5px solid ${C.text}`, paddingTop: 6 }}>
                                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.text }}>
                                    {user ? `${user.firstname} ${user.lastname}` : reportData.technician.name}
                                  </p>
                                  <p style={{ margin: '1px 0 0', fontSize: 9, color: C.secondary }}>Lab Owner / Incharge</p>
                                </div>
                              </div>

                              {!isSelfReport && (
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
                                  <div style={{ borderTop: `1.5px solid ${C.text}`, paddingTop: 6 }}>
                                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.text }}>
                                      {refDoctor ? `${refDoctor.title} ${refDoctor.name}` : reportData.patient.referringDoctor}
                                    </p>
                                    <p style={{ margin: '1px 0 0', fontSize: 9, color: C.secondary }}>
                                      {refDoctor?.specialization || 'Referring Physician'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
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
          doctorName={rawReport?.doctor_name ? `${rawReport.doctor_title || 'Dr'}. ${rawReport.doctor_name}` : undefined}
          doctorPhone={rawReport?.doctor_phone}
          doctorEmail={rawReport?.doctor_email}
          hasDoctorRef={!!rawReport?.doctor_id}
        />
      )}
    </>
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
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-3 sm:p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs sm:text-sm font-semibold text-slate-800">Test Order Management</p>
        <button
          onClick={resetOrder}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-white cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
      <p className="text-[11px] text-slate-500 mb-2.5">Check to include tests in preview. Drag and drop or use controls to reorder.</p>
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1'} gap-2`}>
        {sections.map((section, idx) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => setDraggingId(section.id)}
            onDragEnd={() => setDraggingId(null)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDropReorder(section.id)}
            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition ${visibleSections.has(section.id) ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm' : 'border-gray-200 bg-gray-50 opacity-60'}`}
          >
            <input
              type="checkbox"
              checked={visibleSections.has(section.id)}
              onChange={() => onToggleVisibility(section.id)}
              className="w-4 h-4 rounded border-slate-300 cursor-pointer shrink-0"
              title="Show in preview"
            />
            <GripVertical className="w-4 h-4 text-slate-400 shrink-0 cursor-grab active:cursor-grabbing" />
            <span className="text-xs font-semibold text-slate-700 min-w-6 shrink-0">{idx + 1}.</span>
            <span className="text-xs sm:text-sm text-slate-800 min-w-0 truncate" title={section.testName}>{section.testName}</span>
            <button
              onClick={() => moveUp(section.id)}
              className="w-7 h-7 inline-flex items-center justify-center rounded border border-slate-300 hover:bg-slate-50 cursor-pointer shrink-0"
              title="Move up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => moveDown(section.id)}
              className="w-7 h-7 inline-flex items-center justify-center rounded border border-slate-300 hover:bg-slate-50 cursor-pointer shrink-0"
              title="Move down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Barcode({ value }: { value: string }) {
  const bars: number[] = [];
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed += value.charCodeAt(i);
  for (let i = 0; i < 50; i++) {
    seed = (seed * 31 + i) % 97;
    bars.push(seed % 3 === 0 ? 2 : 1);
  }

  let x = 0;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="90" height="20" viewBox={`0 0 ${bars.reduce((s, b, i) => s + b + (i % 2 === 0 ? 0 : 1), 0)} 20`}>
        {bars.map((w, i) => {
          const isBar = i % 2 === 0;
          const rect = isBar ? <rect key={i} x={x} y={0} width={w} height={16} fill={C.text} /> : null;
          x += w + (isBar ? 0 : 1);
          return rect;
        })}
      </svg>
      <p style={{ margin: '0px 0 0', fontSize: '7px', color: C.muted, letterSpacing: '0.5px', fontFamily: 'monospace', lineHeight: 1 }}>{value}</p>
    </div>
  );
}
