import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { reportApi } from '../../api';
import { publicApi } from '../../api/client';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
} from 'lucide-react';
import {
  ImprovedPatientBox,
  InvestigationTableHeader,
  InvestigationTableRow,
  SectionGroupHeader,
  TestSectionBlock,
} from '../../app/components/ImprovedReportLayout';
import { formatAge } from '../../utils/age';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

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
  testId?: string;
  testName: string;
  parameters: Parameter[];
};

type ReportData = {
  id: string;
  created_at: string;
  patient_name: string;
  patient_id: string;
  patient_age: number;
  patient_age_unit: string;
  patient_gender: string;
  sample_id_code: string;
  doctor_title?: string;
  doctor_name?: string;
  doctor_firstname?: string;
  doctor_lastname?: string;
  technician_firstname?: string;
  technician_lastname?: string;
  approved_at?: string;
  clinical_notes?: string;
  is_self_report?: boolean;
  test_data: any;
  branch?: {
    name: string;
    location: string;
    city: string;
  };
  letterhead_url?: string;
  header_url?: string;
  footer_url?: string;
  report_margin_top?: string | number;
  report_margin_bottom?: string | number;
  report_margin_left?: string | number;
  report_margin_right?: string | number;
  header_safe_area?: string | number;
  footer_safe_area?: string | number;
  report_type?: string;
  owner_signature_url?: string;
  owner_signature_label?: string;
  doctor_signature_url?: string;
  download_token?: string;
  attach_marketing_pages?: boolean;
  marketing_pages?: any[];
};

type PageItem =
  | { type: 'patient' }
  | { type: 'test'; chunk: { sectionId: string; title: string; continuation: boolean; parameters: Parameter[] } }
  | { type: 'interpretation'; testId?: string; text: string }
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
  const charsPerLine = dense ? 90 : 80;
  const lineHeight = dense ? 16 : 18;
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return 22 + lines * lineHeight + 10;
}

function estimateSectionHeight(section: TestSection, params: Parameter[], dense: boolean) {
  const rowHeight = dense ? 21 : 23;
  const groupHeaderHeight = dense ? 23 : 25;
  const uniqueGroupRows = params.reduce((count, p, idx) => {
    if (!p.group) return count;
    const prev = idx > 0 ? params[idx - 1].group : undefined;
    return prev !== p.group ? count + 1 : count;
  }, 0);

  const heading = 26;
  const tableHeader = 24;
  const rows = params.length * rowHeight;
  const groups = uniqueGroupRows * groupHeaderHeight;
  const spacing = 10;
  return heading + tableHeader + rows + groups + spacing;
}

function splitSection(section: TestSection, maxChunkHeight: number, dense: boolean): { sectionId: string; title: string; continuation: boolean; parameters: Parameter[] }[] {
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

  const chunks: any[] = [];
  let current: Parameter[] = [];

  for (let i = 0; i < section.parameters.length; i++) {
    const candidate = [...current, section.parameters[i]];
    const candidateHeight = estimateSectionHeight(section, candidate, dense);
    const nextParam = i + 1 < section.parameters.length ? section.parameters[i + 1] : null;
    const isGroupChanging = nextParam && candidate[candidate.length - 1].group !== nextParam.group;

    if (candidateHeight > maxChunkHeight && current.length > 0) {
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
      <p style={{ margin: '2px 0 0', fontSize: '8px', color: '#212121', letterSpacing: '0.8px', fontFamily: 'monospace', lineHeight: 1, fontWeight: 600 }}>{value}</p>
    </div>
  );
}

export function PublicReportDownload() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const printMode = searchParams.get('print') === 'true';

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Fetch public report
  useEffect(() => {
    const fetchPublicReport = async () => {
      if (!id || !token) {
        setError('Invalid report link. Missing report identifier or token.');
        setLoading(false);
        return;
      }

      try {
        const response = await reportApi.getPublicById(id, token);
        setReport(response.data as any);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch public report');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicReport();
  }, [id, token]);

  const getImageUrl = useCallback((path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const apiBase = publicApi.defaults.baseURL || 'http://localhost:5000/api';
    const base = apiBase.replace(/\/api$/, '');
    return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  }, []);

  // Safe zones calculation (synchronized with settings on the report object)
  const safeZones = useMemo(() => {
    if (!report) return { top: 80, bottom: 80, left: 24, right: 24 };

    const marginTop = parsePx(report.report_margin_top, 80);
    const marginBottom = parsePx(report.report_margin_bottom, 80);
    const marginLeft = parsePx(report.report_margin_left, 24);
    const marginRight = parsePx(report.report_margin_right, 24);

    const headerSafe = parsePx(report.header_safe_area, 0);
    const footerSafe = parsePx(report.footer_safe_area, 0);

    return {
      top: clamp(Math.max(marginTop, headerSafe), 20, Math.round(A4_HEIGHT_PX * 0.35)),
      bottom: clamp(Math.max(marginBottom, footerSafe), 10, Math.round(A4_HEIGHT_PX * 0.35)),
      left: clamp(Math.max(marginLeft, 8), 8, 60),
      right: clamp(Math.max(marginRight, 8), 8, 60),
    };
  }, [report]);

  // Format age safely
  const patientAgeString = useMemo(() => {
    if (!report) return 'N/A';
    return formatAge(report.patient_age, report.patient_age_unit) || 'N/A';
  }, [report]);

  // Referring Doctor display name
  const referringDoctorName = useMemo(() => {
    if (!report) return 'Self';
    if (report.is_self_report) return 'Self';
    if (report.doctor_name) {
      if (/^dr\.?/i.test(report.doctor_name)) {
        return report.doctor_name;
      }
      return `${report.doctor_title || 'Dr'}. ${report.doctor_name}`;
    }
    if (report.doctor_firstname) return `Dr. ${report.doctor_firstname} ${report.doctor_lastname || ''}`;
    return 'Self';
  }, [report]);

  // Re-map tests & parameters to layout sections
  const mappedSectionsAndParams = useMemo(() => {
    if (!report) return { testSections: [], allParams: [] };

    const testData = typeof report.test_data === 'string' ? JSON.parse(report.test_data) : report.test_data;
    const layoutSnapshots = testData?.layout_snapshots || {};

    const mapParam = (p: any): Parameter => ({
      name: p.name,
      result: p.value?.toString() || '',
      unit: p.unit || '',
      refRange: p.referenceRange || '',
      isAbnormal: p.status === 'low' || p.status === 'high',
      status: p.status,
      fieldType: p.fieldType || undefined,
      group: p.group || undefined,
    });

    const filterBlankParams = (pList: Parameter[]) => {
      return pList.filter((p) => {
        return p.result !== undefined && p.result !== null && p.result.trim() !== '';
      });
    };

    const testSections: TestSection[] = [];
    const allParams: Parameter[] = [];

    if (testData?.tests?.length) {
      for (let i = 0; i < testData.tests.length; i++) {
        const group = testData.tests[i];
        const sectionParams = (group.parameters || []).map((p: any) => mapParam(p));
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

          filteredParams = filterBlankParams(filteredParams);

          testSections.push({
            id: `${group.testId || group.testName || 'test'}-${i}`,
            testId: group.testId,
            testName: group.testName,
            parameters: filteredParams,
          });
          allParams.push(...filteredParams);
        } else {
          const filteredParams = filterBlankParams(sectionParams);
          testSections.push({
            id: `${group.testId || group.testName || 'test'}-${i}`,
            testId: group.testId,
            testName: group.testName,
            parameters: filteredParams,
          });
          allParams.push(...filteredParams);
        }
      }
    } else if (testData?.parameters?.length) {
      const sectionParams = testData.parameters.map((p: any) => mapParam(p));
      const filteredParams = filterBlankParams(sectionParams);
      testSections.push({
        id: 'legacy-0',
        testName: testData.testName || report.report_type || 'General Test',
        parameters: filteredParams,
      });
      allParams.push(...filteredParams);
    }

    return { testSections, allParams };
  }, [report]);

  // Determine density matching logic
  const density = useMemo(() => {
    const { testSections } = mappedSectionsAndParams;
    const paramCount = testSections.reduce((s, sec) => s + sec.parameters.length, 0);

    const groupCount = testSections.reduce((s, sec) => {
      let groups = 0;
      let lastGroup: string | undefined;
      for (const p of sec.parameters) {
        if (p.group && p.group !== lastGroup) groups++;
        lastGroup = p.group;
      }
      return s + groups;
    }, 0);

    const effectiveRows = paramCount + groupCount;
    if (effectiveRows > 100) return 'compact';
    if (effectiveRows > 18) return 'balanced';
    return 'comfortable';
  }, [mappedSectionsAndParams]);

  // Compute pages (compact chunking algorithm)
  const reportPages = useMemo(() => {
    if (!report) return [] as PageItem[][];

    const { testSections } = mappedSectionsAndParams;
    const contentHeight = A4_HEIGHT_PX - safeZones.top - safeZones.bottom;
    const isDense = density !== 'comfortable';

    const patientHeight = 100;
    const signatureHeight = 72;
    const endMarkerHeight = 20;

    const maxChunkHeight = Math.max(160, contentHeight - 50);
    const chunks = testSections.flatMap(section => splitSection(section, maxChunkHeight, isDense));

    const testData = typeof report.test_data === 'string' ? JSON.parse(report.test_data) : report.test_data;
    const layoutSnapshots = testData?.layout_snapshots || {};

    // First pass: calculate total height to detect overflow
    let totalNeeded = patientHeight;
    for (const chunk of chunks) {
      const section = testSections.find(s => s.id === chunk.sectionId);
      if (section) {
        totalNeeded += estimateSectionHeight(section, chunk.parameters, isDense);
        // Include interpretation if it is the last chunk of the section and has significance
        const isLastChunk = chunks.filter(c => c.sectionId === chunk.sectionId).pop() === chunk;
        if (isLastChunk && section.testId) {
          const sig = layoutSnapshots[section.testId]?.clinical_significance;
          if (sig?.trim()) {
            totalNeeded += estimateInterpretationHeight(sig.trim(), isDense);
          }
        }
      }
    }
    const notes = report.clinical_notes?.trim();
    if (notes) totalNeeded += estimateInterpretationHeight(notes, isDense);
    totalNeeded += signatureHeight + endMarkerHeight;

    const overflow = totalNeeded - contentHeight;

    // Apply micro-compaction scaling to row heights if overflow is minor
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
      const section = testSections.find(s => s.id === chunk.sectionId);
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
        if (notes) {
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

    if (notes) {
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

    const shouldAttachMarketing = report?.is_self_report || report?.attach_marketing_pages;
    if (shouldAttachMarketing && report?.marketing_pages && Array.isArray(report.marketing_pages)) {
      const activeMarketingPages = report.marketing_pages.filter((p: any) => p.active && p.url);
      for (const mPage of activeMarketingPages) {
        out.push([{ type: 'marketing', pageConfig: mPage }]);
      }
    }

    return out;
  }, [report, mappedSectionsAndParams, safeZones, density]);

  // Derive compactAdjustment value
  const compactAdjustment = useMemo(() => {
    if (!report) return 0;
    const { testSections } = mappedSectionsAndParams;
    const contentHeight = A4_HEIGHT_PX - safeZones.top - safeZones.bottom;
    const isDense = density !== 'comfortable';

    const testData = typeof report.test_data === 'string' ? JSON.parse(report.test_data) : report.test_data;
    const layoutSnapshots = testData?.layout_snapshots || {};

    let totalNeeded = 100; // patient info
    for (const section of testSections) {
      totalNeeded += estimateSectionHeight(section, section.parameters, isDense);
      if (section.testId) {
        const sig = layoutSnapshots[section.testId]?.clinical_significance;
        if (sig?.trim()) {
          totalNeeded += estimateInterpretationHeight(sig.trim(), isDense);
        }
      }
    }
    const notes = report.clinical_notes?.trim();
    if (notes) totalNeeded += estimateInterpretationHeight(notes, isDense);
    totalNeeded += 92; // signature + end marker

    const overflow = totalNeeded - contentHeight;
    return (overflow > 0 && overflow <= 120) ? overflow : 0;
  }, [report, mappedSectionsAndParams, safeZones, density]);

  // Download PDF Action
  const handleDownload = useCallback(async () => {
    if (!report || reportPages.length === 0) return;
    setDownloading(true);
    setDownloadProgress(10);

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
      setDownloading(false);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0; padding: 0;
            background: #ffffff;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * {
            text-rendering: geometricPrecision;
            -webkit-font-smoothing: antialiased;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body><div id="iframe-content-root"></div></body>
      </html>
    `);
    iframeDoc.close();

    // Copy stylesheet styles
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
      try {
        let cssText = '';
        if (el.tagName === 'STYLE') {
          cssText = el.textContent || '';
        } else if (el instanceof HTMLLinkElement && el.sheet) {
          const rules = el.sheet.cssRules || el.sheet.rules;
          for (let k = 0; k < rules.length; k++) {
            cssText += rules[k].cssText + '\n';
          }
        }
        if (cssText) {
          const cleaned = cssText.replace(/oklch\([^)]+\)/gi, '#212121');
          const s = iframeDoc.createElement('style');
          s.textContent = cleaned;
          iframeDoc.head.appendChild(s);
        } else if (el instanceof HTMLLinkElement) {
          iframeDoc.head.appendChild(el.cloneNode(true));
        }
      } catch {
        iframeDoc.head.appendChild(el.cloneNode(true));
      }
    });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      const root = iframeDoc.getElementById('iframe-content-root');
      if (!root) throw new Error('Iframe root not found');

      if (iframeDoc.fonts?.ready) await iframeDoc.fonts.ready;

      setDownloadProgress(30);

      const pagesCount = reportPages.length;
      const isCompact = compactAdjustment > 0;
      const pdfRowPad = isCompact ? '2px' : '3px';

      for (let i = 0; i < pagesCount; i++) {
        const node = previewContainerRef.current?.children[i] as HTMLElement;
        if (!node) continue;

        if (i > 0) pdf.addPage();

        const cloned = node.cloneNode(true) as HTMLElement;
        cloned.style.transform = 'none';
        cloned.style.position = 'relative';
        cloned.style.margin = '0';
        cloned.style.boxShadow = 'none';
        cloned.style.border = 'none';
        cloned.style.width = `${A4_WIDTH_PX}px`;
        cloned.style.height = `${A4_HEIGHT_PX}px`;
        cloned.style.overflow = 'hidden';

        const contentContainer = cloned.querySelector('[data-content-area="true"]') as HTMLElement;
        if (contentContainer) {
          contentContainer.style.gap = `${isCompact ? 1 : 3}px`;
          contentContainer.style.fontSize = `${isCompact && compactAdjustment > 60 ? 10.5 : 11}px`;
          contentContainer.style.lineHeight = `${isCompact && compactAdjustment > 60 ? 1.35 : 1.45}`;
        }

        const allCells = cloned.querySelectorAll('td, th');
        allCells.forEach((cell) => {
          const el = cell as HTMLElement;
          ['padding', 'paddingTop', 'paddingBottom'].forEach(prop => {
            const val = (el.style as any)[prop];
            if (val && typeof val === 'string' && val.includes('var(')) {
              (el.style as any)[prop] = val.replace(/var\(--row-pad[^)]*\)/g, pdfRowPad);
            }
          });
        });

        root.appendChild(cloned);

        // Resolve SVG namespaces
        const barcodes = cloned.querySelectorAll('svg');
        barcodes.forEach((svg) => {
          svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        });

        // Wait for images
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

        await new Promise(r => setTimeout(r, 200));

        const canvas = await html2canvas(cloned, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: A4_WIDTH_PX,
          height: A4_HEIGHT_PX,
          allowTaint: true,
        });

        root.removeChild(cloned);

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

        setDownloadProgress(Math.min(90, Math.round(30 + ((i + 1) / pagesCount) * 60)));
      }

      const fileName = `Report-${report.patient_name.replace(/\s+/g, '_')}-${report.sample_id_code}.pdf`;
      pdf.save(fileName);
      setDownloadProgress(100);

      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
      }, 1500);

    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not generate PDF file. Please try again.');
      setDownloading(false);
      setDownloadProgress(0);
    } finally {
      document.body.removeChild(iframe);
    }
  }, [report, reportPages, compactAdjustment]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="text-center space-y-4 max-w-sm">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-800">Verifying Link & Report Details</h2>
          <p className="text-sm text-slate-500">Please wait while we connect securely to retrieve your report information...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-md text-center border border-slate-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Verification Failed</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            {error || 'This report is unavailable or has not been fully verified/approved by the lab head.'}
          </p>
          <div className="space-y-2">
            <a
              href="mailto:support@diagno.pro"
              className="block w-full py-2.5 px-4 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900 transition cursor-pointer"
            >
              Contact Laboratory Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Determine letterhead/header/footer activation (same logic as ReportPreview)
  const letterheadActive = !!report.letterhead_url;
  const headerActive = !!report.header_url && !report.letterhead_url;
  const footerActive = !!report.footer_url && !report.letterhead_url;

  if (printMode) {
    return (
      <div className="bg-white flex flex-col items-center" style={{ width: '100%' }}>
        <style>{`
          @media print {
            body { background: white; margin: 0; padding: 0; }
            .report-page { page-break-after: always; break-after: page; margin: 0 !important; box-shadow: none !important; border: none !important; }
          }
          body { background: #f0f2f5; margin: 0; padding: 0; }
          .report-page { margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        `}</style>
        <div ref={previewContainerRef}>
          {reportPages.map((page, pageIndex) => {
            const isMarketingPage = page[0]?.type === 'marketing';
            return (
              <div
                key={pageIndex}
                className="report-page bg-white"
              style={{
                width: A4_WIDTH_PX,
                height: A4_HEIGHT_PX,
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
                color: '#222',
              }}
            >
              {/* Optional letterhead */}
              {!isMarketingPage && letterheadActive && report.letterhead_url && (
                <img
                  src={getImageUrl(report.letterhead_url) || ''}
                  alt="Letterhead"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                  }}
                />
              )}

              {/* Optional Header artwork */}
              {!isMarketingPage && headerActive && report.header_url && (
                <img
                  src={getImageUrl(report.header_url) || ''}
                  alt="Header"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    objectFit: 'contain',
                    zIndex: 0,
                  }}
                />
              )}

              {/* Optional Footer artwork */}
              {!isMarketingPage && footerActive && report.footer_url && (
                <img
                  src={getImageUrl(report.footer_url) || ''}
                  alt="Footer"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    objectFit: 'contain',
                    zIndex: 0,
                  }}
                />
              )}

              {isMarketingPage ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: page[0].pageConfig.position === 'custom' ? 'block' : 'flex',
                    flexDirection: 'column',
                    justifyContent: page[0].pageConfig.position === 'top' ? 'flex-start' : page[0].pageConfig.position === 'bottom' ? 'flex-end' : 'center',
                    alignItems: 'center',
                  }}
                >
                  <img
                    src={getImageUrl(page[0].pageConfig.url) || ''}
                    alt="Marketing Poster"
                    style={{
                      objectFit: 'contain',
                      width: page[0].pageConfig.width || '100%',
                      height: page[0].pageConfig.height || 'auto',
                      position: page[0].pageConfig.position === 'custom' ? 'absolute' : 'relative',
                      left: page[0].pageConfig.position === 'custom' ? page[0].pageConfig.x_offset : undefined,
                      top: page[0].pageConfig.position === 'custom' ? page[0].pageConfig.y_offset : undefined,
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
                }}
              >
                {page.map((item: any, idx: number) => {
                  if (item.type === 'patient') {
                    return (
                      <div key={`p-${idx}`} className="patient-info-box">
                        <ImprovedPatientBox
                          patientName={report.patient_name}
                          age={report.patient_age as any}
                          gender={report.patient_gender}
                          patientId={`PT-${report.patient_id.slice(0, 8)}`}
                          sampleId={report.sample_id_code}
                          referringDoctor={referringDoctorName}
                          reportDate={format(new Date(report.created_at), 'dd MMM yyyy')}
                          reportTime={format(new Date(report.created_at), 'hh:mm aa')}
                          collectionDate={format(new Date(report.created_at), 'dd MMM yyyy, hh:mm aa')}
                          reportedDate={report.approved_at ? format(new Date(report.approved_at), 'dd MMM yyyy, hh:mm aa') : 'N/A'}
                          collectionAddress={`${report.branch?.location || ''}${report.branch?.city ? `, ${report.branch.city}` : ''}`}
                          qrCode={
                            <QRCodeSVG
                              value={token ? `${window.location.origin}/public/report/${id}/download?token=${token}` : ''}
                              size={68}
                              level="Q"
                              bgColor="#ffffff"
                              fgColor="#000000"
                            />
                          }
                          barcode={<Barcode value={report.sample_id_code} />}
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
                          borderCollapse: 'collapse',
                          tableLayout: 'fixed',
                          marginTop: compactAdjustment > 0 ? '1px' : '2px'
                        }}>
                          <InvestigationTableHeader colorTokens={C} />
                          <tbody>
                            {item.chunk.parameters.map((param: any, rowIdx: number) => {
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

                  if (item.type === 'endMarker') {
                    return (
                      <div key={`e-${idx}`} style={{ textAlign: 'center', fontSize: '9px', color: '#999', letterSpacing: '2px', margin: '6px 0' }}>
                        *** End of Report ***
                      </div>
                    );
                  }

                  const pathologySigUrl = (report as any).pathology_signature_url;
                  const pathologySigLabel = (report as any).pathology_signature_label;
                  const pathologySigDesc = (report as any).pathology_signature_description;
                  const hasDoctorSignature = !!(pathologySigUrl || pathologySigLabel);

                  return (
                    <section key={`s-${idx}`} style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: hasDoctorSignature ? 'space-between' : 'flex-start' }}>
                        <div>
                          <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                            {report.owner_signature_url && (
                              <img
                                src={getImageUrl(report.owner_signature_url) || ''}
                                alt="Owner Signature"
                                style={{ maxHeight: 40, objectFit: 'contain' }}
                              />
                            )}
                          </div>
                          <div style={{ borderTop: '1px solid #333', paddingTop: 4, minWidth: '140px' }}>
                            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#111' }}>
                              {report.owner_signature_label || (report.technician_firstname ? `${report.technician_firstname} ${report.technician_lastname || ''}` : 'Lab Technician')}
                            </p>
                            <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#666' }}>{(report as any).owner_signature_description || 'Lab Owner / Incharge'}</p>
                          </div>
                        </div>

                        {hasDoctorSignature && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 4 }}>
                              {pathologySigUrl && (
                                <img
                                  src={getImageUrl(pathologySigUrl) || ''}
                                  alt="Doctor Signature"
                                  style={{ maxHeight: 40, objectFit: 'contain' }}
                                />
                              )}
                            </div>
                            <div style={{ borderTop: '1px solid #333', paddingTop: 4, minWidth: '140px' }}>
                              <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#111' }}>
                                {pathologySigLabel || 'Authorized Signatory'}
                              </p>
                              <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#666' }}>
                                {pathologySigDesc || 'Pathologist'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
            </div>
          );
        })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/5 blur-[100px] pointer-events-none" />

      {/* Verification Portal UI Card */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200/80 relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <CheckCircle2 className="w-8 h-8 animate-pulse text-emerald-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Report Verified</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">DiagnoPro Secure Verification Hub</p>
        </div>

        {/* Patient information summary block */}
        <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100 mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Patient Name</p>
              <p className="text-sm font-semibold text-slate-700 truncate text-capitalize">{report.patient_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Registration ID</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{report.sample_id_code}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Gender & Age</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5 text-capitalize">{report.patient_gender}, {patientAgeString}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-200/50 pt-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Date Approved</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {report.approved_at ? format(new Date(report.approved_at), 'dd MMM yyyy, hh:mm aa') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Download action button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="relative w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none overflow-hidden group cursor-pointer flex items-center justify-center gap-2"
        >
          {downloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating PDF ({downloadProgress}%)</span>
              <div
                className="absolute bottom-0 left-0 h-1 bg-emerald-400 transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </>
          ) : (
            <>
              <Download className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
              <span>Download Your Report</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-center text-slate-400 mt-6 leading-relaxed">
          This document is cryptographically signed and verified. It matches the original record generated on branch records.
        </p>
      </div>

      {/* Off-screen hidden render target for html2canvas generation */}
      <div
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          visibility: 'hidden',
          pointerEvents: 'none'
        }}
      >
        <div ref={previewContainerRef}>
          {reportPages.map((page, pageIndex) => {
            const isMarketingPage = page[0]?.type === 'marketing';
            return (
              <div
                key={pageIndex}
                className="report-page bg-white"
              style={{
                width: A4_WIDTH_PX,
                height: A4_HEIGHT_PX,
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
                color: '#222',
              }}
            >
              {/* Optional letterhead */}
              {!isMarketingPage && letterheadActive && report.letterhead_url && (
                <img
                  src={getImageUrl(report.letterhead_url) || ''}
                  alt="Letterhead"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                  }}
                />
              )}

              {/* Optional Header artwork */}
              {!isMarketingPage && headerActive && report.header_url && (
                <img
                  src={getImageUrl(report.header_url) || ''}
                  alt="Header"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    objectFit: 'contain',
                    zIndex: 0,
                  }}
                />
              )}

              {/* Optional Footer artwork */}
              {!isMarketingPage && footerActive && report.footer_url && (
                <img
                  src={getImageUrl(report.footer_url) || ''}
                  alt="Footer"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    objectFit: 'contain',
                    zIndex: 0,
                  }}
                />
              )}

              {isMarketingPage ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: page[0].pageConfig.position === 'custom' ? 'block' : 'flex',
                    flexDirection: 'column',
                    justifyContent: page[0].pageConfig.position === 'top' ? 'flex-start' : page[0].pageConfig.position === 'bottom' ? 'flex-end' : 'center',
                    alignItems: 'center',
                  }}
                >
                  <img
                    src={getImageUrl(page[0].pageConfig.url) || ''}
                    alt="Marketing Poster"
                    style={{
                      objectFit: 'contain',
                      width: page[0].pageConfig.width || '100%',
                      height: page[0].pageConfig.height || 'auto',
                      position: page[0].pageConfig.position === 'custom' ? 'absolute' : 'relative',
                      left: page[0].pageConfig.position === 'custom' ? page[0].pageConfig.x_offset : undefined,
                      top: page[0].pageConfig.position === 'custom' ? page[0].pageConfig.y_offset : undefined,
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
                }}
              >
                {page.map((item: any, idx: number) => {
                  if (item.type === 'patient') {
                    return (
                      <div key={`p-${idx}`} className="patient-info-box">
                        <ImprovedPatientBox
                          patientName={report.patient_name}
                          age={report.patient_age as any}
                          gender={report.patient_gender}
                          patientId={`PT-${report.patient_id.slice(0, 8)}`}
                          sampleId={report.sample_id_code}
                          referringDoctor={referringDoctorName}
                          reportDate={format(new Date(report.created_at), 'dd MMM yyyy')}
                          reportTime={format(new Date(report.created_at), 'hh:mm aa')}
                          collectionDate={format(new Date(report.created_at), 'dd MMM yyyy, hh:mm aa')}
                          reportedDate={report.approved_at ? format(new Date(report.approved_at), 'dd MMM yyyy, hh:mm aa') : 'N/A'}
                          collectionAddress={`${report.branch?.location || ''}${report.branch?.city ? `, ${report.branch.city}` : ''}`}
                          qrCode={
                            <QRCodeSVG
                              value={token ? `${window.location.origin}/public/report/${id}/download?token=${token}` : ''}
                              size={68}
                              level="Q"
                              bgColor="#ffffff"
                              fgColor="#000000"
                            />
                          }
                          barcode={<Barcode value={report.sample_id_code} />}
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
                          borderCollapse: 'collapse',
                          tableLayout: 'fixed',
                          marginTop: compactAdjustment > 0 ? '1px' : '2px'
                        }}>
                          <InvestigationTableHeader colorTokens={C} />
                          <tbody>
                            {item.chunk.parameters.map((param: any, rowIdx: number) => {
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

                  if (item.type === 'endMarker') {
                    return (
                      <div key={`e-${idx}`} style={{ textAlign: 'center', fontSize: '9px', color: '#999', letterSpacing: '2px', margin: '6px 0' }}>
                        *** End of Report ***
                      </div>
                    );
                  }

                  const pathologySigUrl = (report as any).pathology_signature_url;
                  const pathologySigLabel = (report as any).pathology_signature_label;
                  const pathologySigDesc = (report as any).pathology_signature_description;
                  const hasDoctorSignature = !!(pathologySigUrl || pathologySigLabel);

                  return (
                    <section key={`s-${idx}`} style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: hasDoctorSignature ? 'space-between' : 'flex-start' }}>
                        <div>
                          <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                            {report.owner_signature_url && (
                              <img
                                src={getImageUrl(report.owner_signature_url) || ''}
                                alt="Owner Signature"
                                style={{ maxHeight: 40, objectFit: 'contain' }}
                              />
                            )}
                          </div>
                          <div style={{ borderTop: '1px solid #333', paddingTop: 4, minWidth: '140px' }}>
                            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#111' }}>
                              {report.owner_signature_label || (report.technician_firstname ? `${report.technician_firstname} ${report.technician_lastname || ''}` : 'Lab Technician')}
                            </p>
                            <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#666' }}>{(report as any).owner_signature_description || 'Lab Owner / Incharge'}</p>
                          </div>
                        </div>

                        {hasDoctorSignature && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 4 }}>
                              {pathologySigUrl && (
                                <img
                                  src={getImageUrl(pathologySigUrl) || ''}
                                  alt="Doctor Signature"
                                  style={{ maxHeight: 40, objectFit: 'contain' }}
                                />
                              )}
                            </div>
                            <div style={{ borderTop: '1px solid #333', paddingTop: 4, minWidth: '140px' }}>
                              <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#111' }}>
                                {pathologySigLabel || 'Authorized Signatory'}
                              </p>
                              <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#666' }}>
                                {pathologySigDesc || 'Pathologist'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
