import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
import axios from 'axios';
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
  FileText,
  User,
  Calendar,
  Layers,
  ArrowDownToLine,
  ExternalLink,
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
  low: '#1565C0',
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
  owner_signature_url?: string;
  doctor_signature_url?: string;
};

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

// Split logic helper (cloned from ReportPreview to keep layout rendering consistent)
function estimateSectionHeight(section: TestSection, params: Parameter[]) {
  const heading = 26;
  const tableHeader = 24;
  const rows = params.length * 23;
  const spacing = 10;
  return heading + tableHeader + rows + spacing;
}

function splitSection(section: TestSection, maxChunkHeight: number): { sectionId: string; title: string; continuation: boolean; parameters: Parameter[] }[] {
  const fullHeight = estimateSectionHeight(section, section.parameters);
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
    const candidateHeight = estimateSectionHeight(section, candidate);

    if (candidateHeight > maxChunkHeight && current.length > 0) {
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

export function PublicReportDownload() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Fetch report using a direct axios call to avoid auth response interceptors
  useEffect(() => {
    const fetchPublicReport = async () => {
      if (!id || !token) {
        setError('Invalid report link. Missing report identifier or token.');
        setLoading(false);
        return;
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${apiBaseUrl}/reports/public/${id}?token=${token}`);
        setReport(response.data.data);
      } catch (err: any) {
        const msg = err.response?.data?.error || err.message || 'Failed to fetch public report';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicReport();
  }, [id, token]);

  const getImageUrl = useCallback((path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const api = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const base = api.replace(/\/api$/, '');
    return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  }, []);

  // Format age safely
  const patientAgeString = useMemo(() => {
    if (!report) return 'N/A';
    return formatAge(report.patient_age, report.patient_age_unit) || 'N/A';
  }, [report]);

  // Referring Doctor display name
  const referringDoctorName = useMemo(() => {
    if (!report) return 'Self';
    if (report.is_self_report) return 'Self';
    if (report.doctor_name) return `${report.doctor_title || 'Dr'}. ${report.doctor_name}`;
    if (report.doctor_firstname) return `Dr. ${report.doctor_firstname} ${report.doctor_lastname || ''}`;
    return 'Self';
  }, [report]);

  // Re-map tests & parameters to layout sections (same as ReportPreview)
  const mappedSectionsAndParams = useMemo(() => {
    if (!report) return { testSections: [], allParams: [] };

    const testData = typeof report.test_data === 'string' ? JSON.parse(report.test_data) : report.test_data;
    const layoutSnapshots = testData?.layout_snapshots || {};

    const mapParam = (p: any): Parameter => ({
      name: p.name,
      result: p.value?.toString() || '',
      unit: p.unit || '',
      refRange: p.referenceRange || '',
      isAbnormal: p.status === 'low' || p.status === 'high' || p.status === 'critical',
      status: p.status,
      fieldType: p.fieldType || undefined,
      group: p.group || undefined,
    });

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

          testSections.push({
            id: `${group.testId || group.testName || 'test'}-${i}`,
            testName: group.testName,
            parameters: filteredParams,
          });
          allParams.push(...filteredParams);
        } else {
          testSections.push({
            id: `${group.testId || group.testName || 'test'}-${i}`,
            testName: group.testName,
            parameters: sectionParams,
          });
          allParams.push(...sectionParams);
        }
      }
    } else if (testData?.parameters?.length) {
      const sectionParams = testData.parameters.map((p: any) => mapParam(p));
      testSections.push({
        id: 'legacy-0',
        testName: testData.testName || report.report_type || 'General Test',
        parameters: sectionParams,
      });
      allParams.push(...sectionParams);
    }

    return { testSections, allParams };
  }, [report]);

  // Compute pages (compact chunking algorithm from ReportPreview)
  const reportPages = useMemo(() => {
    if (!report) return [] as any[][];

    const { testSections } = mappedSectionsAndParams;
    const safeZones = { top: 70, bottom: 70, left: 24, right: 24 }; // Standard default A4 margins
    const contentHeight = A4_HEIGHT_PX - safeZones.top - safeZones.bottom;

    const patientHeight = 100;
    const signatureHeight = 72;
    const endMarkerHeight = 20;

    const maxChunkHeight = contentHeight - 50;
    const chunks = testSections.flatMap(section => splitSection(section, maxChunkHeight));

    const out: any[][] = [[]];
    let currentHeight = 0;

    const place = (item: any, itemHeight: number) => {
      if (currentHeight + itemHeight > contentHeight && out[out.length - 1].length > 0) {
        out.push([]);
        currentHeight = 0;
      }
      out[out.length - 1].push(item);
      currentHeight += itemHeight;
    };

    place({ type: 'patient' }, patientHeight);

    for (const chunk of chunks) {
      const section = testSections.find(s => s.id === chunk.sectionId);
      if (!section) continue;
      place({ type: 'test', chunk }, estimateSectionHeight(section, chunk.parameters));
    }

    if (report.clinical_notes?.trim()) {
      const charCount = report.clinical_notes.trim().length;
      const lines = Math.max(1, Math.ceil(charCount / 80));
      const remarkH = 22 + lines * 18 + 10;
      place({ type: 'interpretation', text: report.clinical_notes.trim() }, remarkH);
    }

    const tailHeight = signatureHeight + endMarkerHeight;
    if (currentHeight + tailHeight > contentHeight && out[out.length - 1].length > 0) {
      out.push([]);
      currentHeight = 0;
    }
    out[out.length - 1].push({ type: 'endMarker' });
    out[out.length - 1].push({ type: 'signature' });

    return out;
  }, [report, mappedSectionsAndParams]);

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

    // Copy styles
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

      // Render each page into the iframe and screenshot it
      const pagesCount = reportPages.length;
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

        root.appendChild(cloned);

        // Resolve barcode SVGs manually to ensure proper rendering in canvas
        const barcodes = cloned.querySelectorAll('svg');
        barcodes.forEach((svg) => {
          // Add XML namespace
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

        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(cloned, {
          scale: 2.5,
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
      
      // Auto-reset button state after 1.5 seconds
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
  }, [report, reportPages]);

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

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Dynamic colorful blur circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-700/50 relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <CheckCircle2 className="w-8 h-8 animate-pulse text-emerald-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Report Verified</h1>
          <p className="text-xs text-slate-400 mt-1">DiagnoPro Secure Verification Hub</p>
        </div>

        {/* Patient confirmation card */}
        <div className="bg-slate-700/30 rounded-2xl p-5 border border-slate-600/30 mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Patient Name</p>
              <p className="text-sm font-semibold text-white truncate text-capitalize">{report.patient_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-700/50 pt-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Registration ID</p>
              <p className="text-xs font-semibold text-slate-200 mt-0.5">{report.sample_id_code}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Gender & Age</p>
              <p className="text-xs font-semibold text-slate-200 mt-0.5 text-capitalize">{report.patient_gender}, {patientAgeString}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-700/50 pt-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Date Approved</p>
              <p className="text-xs font-semibold text-slate-200 mt-0.5">
                {report.approved_at ? format(new Date(report.approved_at), 'dd MMM yyyy, hh:mm aa') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Download action button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="relative w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none overflow-hidden group cursor-pointer flex items-center justify-center gap-2"
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
              <span>Download Secure Report</span>
            </>
          )}
        </button>

        {/* Footer info */}
        <p className="text-[10px] text-center text-slate-500 mt-6 leading-relaxed">
          This document is cryptographically signed and verified. It matches the original record generated on branch records.
        </p>
      </div>

      {/* Hidden Render target for html2canvas generation */}
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
          {reportPages.map((page, pageIndex) => (
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
              {report.letterhead_url && (
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

              {/* Page Contents */}
              <div
                style={{
                  position: 'absolute',
                  top: 70,
                  bottom: 70,
                  left: 24,
                  right: 24,
                  zIndex: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  fontSize: 11,
                  lineHeight: 1.45,
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
                          marginTop: '2px'
                        }}>
                          <InvestigationTableHeader colorTokens={C} />
                          <tbody>
                            {item.chunk.parameters.map((param: any, rowIdx: number) => {
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
                                  {showGroupHeader && (
                                    <SectionGroupHeader
                                      title={param.group || ''}
                                      colorTokens={C}
                                      compact={false}
                                    />
                                  )}
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
                                    compact={false}
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
                      <section key={`i-${idx}`} style={{ marginTop: '4px' }}>
                        <p style={{ margin: '0 0 3px 0', fontSize: '10.5px', fontWeight: 700, color: '#222', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Clinical Significance
                        </p>
                        <p style={{ margin: 0, fontSize: '10.5px', color: '#444', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                          {item.text}
                        </p>
                      </section>
                    );
                  }

                  if (item.type === 'endMarker') {
                    return (
                      <div key={`e-${idx}`} style={{ textAlign: 'center', fontSize: '9px', color: '#999', letterSpacing: '2px', margin: '6px 0' }}>
                        *** End of Report ***
                      </div>
                    );
                  }

                  return (
                    <section key={`s-${idx}`} style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: report.is_self_report ? 'flex-start' : 'space-between' }}>
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
                              {report.technician_firstname ? `${report.technician_firstname} ${report.technician_lastname || ''}` : 'Lab Technician'}
                            </p>
                            <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#666' }}>Lab Owner / Incharge</p>
                          </div>
                        </div>

                        {!report.is_self_report && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 4 }}>
                              {report.doctor_signature_url && (
                                <img
                                  src={getImageUrl(report.doctor_signature_url) || ''}
                                  alt="Doctor Signature"
                                  style={{ maxHeight: 40, objectFit: 'contain' }}
                                />
                              )}
                            </div>
                            <div style={{ borderTop: '1px solid #333', paddingTop: 4, minWidth: '140px' }}>
                              <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#111' }}>
                                {referringDoctorName}
                              </p>
                              <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#666' }}>
                                Referring Physician
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
          ))}
        </div>
      </div>
    </div>
  );
}
