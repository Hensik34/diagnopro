import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, ArrowLeft, Printer, Send, Download, FileImage } from 'lucide-react';
import { useParams, Link, useSearchParams } from 'react-router';
import { useReportStore } from '../../stores/reportStore';
import { useBranchStore } from '../../stores/branchStore';
import { useTestStore } from '../../stores/testStore';
import { useSettingsStore, useDoctorStore, useAuthStore } from '../../stores';
import { ShareReportModal } from '../../app/components/WhatsAppModal';
import {
  ImprovedPatientBox,
  TestSectionBlock,
  InvestigationTableHeader,
  SectionGroupHeader,
  InvestigationTableRow,
  ReportLayoutConfig,
} from '../../app/components/ImprovedReportLayout';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { formatAge } from '../../utils/age';

/* ── Color tokens – Premium Medical / Pathology theme ──────────────────────── */
const C = {
  brand: '#0D47A1',  // Deep medical blue
  brandDark: '#0A3680',
  brandLight: '#E8F0FE',
  brandAccent: '#1565C0',
  accent: '#00897B',  // Teal accent for medical feel
  text: '#212121',
  secondary: '#546E7A',
  muted: '#90A4AE',
  border: '#B0BEC5',
  borderLight: '#E0E0E0',
  tableBg: '#F8F9FB',
  tableStripe: '#F1F4F8',
  headerBg: '#0D47A1',
  remarkBg: '#FFF8E1',
  remarkBorder: '#FFB300',
  high: '#C62828',
  low: '#1565C0',
  normal: '#2E7D32',
  white: '#FFFFFF',
  cardBg: '#FAFBFC',
  sectionTitle: '#37474F',
} as const;

/* ── A4 dimensions ─────────────────────────────────────────────────────────── */
const A4_MIN_HEIGHT = '1123px'; // ~A4 at 96dpi

/* ── Print & Responsive styles ─────────────────────────────────────────────── */
const printStyles = `
@media print {
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; width: 100%; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
  .report-page {
    box-shadow: none !important;
    margin: 0 !important;
    border-radius: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  .report-inner { padding-left: 8mm !important; padding-right: 8mm !important; }
  .report-bg-wrapper { background: white !important; }
}

@media screen {
  .report-page { min-height: ${A4_MIN_HEIGHT}; }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    .report-page {
      max-width: 100% !important;
      margin: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }
    
    .report-toolbar {
      position: sticky;
      top: 0;
      z-index: 30;
      padding: 8px 12px;
    }
    
    .toolbar-content {
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .toolbar-btn {
      font-size: 10px !important;
      padding: 6px 8px !important;
    }
    
    .toolbar-left {
      flex-basis: 100%;
      order: -1;
    }
    
    .report-inner {
      padding: 12px !important;
      font-size: 10px !important;
    }
    
    .patient-info-box {
      flex-direction: column !important;
    }
    
    .patient-info-box > div {
      flex: 1 !important;
      border-right: none !important;
      border-bottom: 1px solid #e0e0e0 !important;
      padding: 10px 8px !important;
    }
    
    .patient-info-box > div:last-child {
      border-bottom: none !important;
    }
    
    table {
      font-size: 9px !important;
    }
    
    table th {
      padding: 6px 4px !important;
      font-size: 8px !important;
    }
    
    table td {
      padding: 5px 4px !important;
      font-size: 9px !important;
    }
    
    .signature-section {
      grid-template-columns: 1fr !important;
      gap: 20px !important;
    }
    
    .signature-block {
      text-align: left !important;
    }
    
    .signature-block-right {
      text-align: left !important;
    }
  }
  
  /* Tablet optimizations */
  @media (max-width: 1024px) and (min-width: 769px) {
    .report-page {
      max-width: 95% !important;
    }
    
    .patient-info-box > div {
      flex: 1 !important;
      padding: 10px !important;
    }
    
    table {
      font-size: 10px;
    }
  }
}
`;

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Parameter {
  name: string;
  result: string;
  unit: string;
  refRange: string;
  isAbnormal: boolean;
  status?: string;
  fieldType?: string; // 'input' | 'calculated' | 'flag'
  group?: string; // sub-section heading, e.g. "HEMOGLOBIN", "RBC COUNT"
}

interface TestSection {
  testName: string;
  parameters: Parameter[];
}

interface ReportData {
  lab: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    license: string;
  };
  report: {
    id: string;
    date: string;
    time: string;
  };
  patient: {
    name: string;
    id: string;
    age: number;
    gender: string;
    referringDoctor: string;
    sampleId: string;
    collectionDate: string;
    collectionTime: string;
    reportedDate: string;
    reportedTime: string;
  };
  test: {
    name: string;
    category: string;
  };
  testSections: TestSection[];
  parameters: Parameter[];
  technician: {
    name: string;
    signature: string;
  };
  pathologist: {
    name: string;
    title: string;
    license: string;
    signature: string;
  };
}

/* ══════════════════════════════════════════════════════════════════════════════ */

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
  const reportPageRef = useRef<HTMLDivElement>(null);
  const shareAutoOpened = useRef(false);

  // Auto-open share modal when navigated with ?share=1 (from Reports list)
  useEffect(() => {
    if (searchParams.get('share') === '1' && reportData && !shareAutoOpened.current) {
      setShowShareModal(true);
      shareAutoOpened.current = true;
    }
  }, [searchParams, reportData]);

  // Prefer selectedReport (has full joins including age/gender) over reports array
  const rawReport = useMemo(() => selectedReport?.id === id ? selectedReport : reports.find(r => r.id === id), [selectedReport, reports, id]);

  
  // Generate PDF from the report page element
  const generatePDF = useCallback(async (): Promise<File | null> => {
    const el = reportPageRef.current;
    if (!el) return null;

    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Calculate the pixel height that corresponds to one A4 page
      const pxPerMm = canvas.width / imgWidth;
      const pageHeightPx = Math.floor(pageHeight * pxPerMm);
      const totalPages = Math.ceil(canvas.height / pageHeightPx);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        // Slice the canvas for this page
        const srcY = page * pageHeightPx;
        const srcH = Math.min(pageHeightPx, canvas.height - srcY);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageHeightPx; // Always full A4 height canvas
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        }

        pdf.addImage(
          pageCanvas.toDataURL('image/jpeg', 0.95),
          'JPEG', 0, 0, imgWidth, pageHeight
        );
      }

      const fileName = `Report-${reportData?.patient?.name?.replace(/\s+/g, '_') || 'Patient'}-${reportData?.report?.id || 'report'}.pdf`;
      const blob = pdf.output('blob');
      return new File([blob], fileName, { type: 'application/pdf' });
    } catch (err) {
      console.error('PDF generation failed:', err);
      return null;
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [reportData]);

  // Download PDF helper
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

  useEffect(() => {
    if (id) { fetchReportById(id); fetchBranches(); }
  }, [id, fetchReportById, fetchBranches]);

  // Use report's branch_id for settings (so technicians also see letterhead)
  const reportBranchId = (rawReport as any)?.branch_id || currentBranchId;

  useEffect(() => {
    if (reportBranchId) {
      fetchSettings(reportBranchId);
      fetchDoctors({ branch_id: reportBranchId });
    }
  }, [reportBranchId, fetchSettings, fetchDoctors]);

  const getImageUrl = useCallback((path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = API_URL.replace(/\/api$/, '');
    return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  }, []);

  // Fetch test fields for section_group data when report loads
  useEffect(() => {
    if (!rawReport) return;
    const testData =
      typeof rawReport.test_data === 'string'
        ? JSON.parse(rawReport.test_data)
        : rawReport.test_data;
    const testIds = testData?.testIds || testData?.tests?.map((t: any) => t.testId) || [];
    if (testIds.length > 0) {
      fetchTestFieldsMulti(testIds);
    }
  }, [rawReport, fetchTestFieldsMulti]);

  // Build a lookup: "testId::fieldName" → section_group
  const sectionGroupMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of testFields) {
      if (f.section_group) {
        map.set(`${f.test_id}::${f.field_name}`, f.section_group);
      }
    }
    return map;
  }, [testFields]);

  /* ── Transform raw → ReportData ─────────────────────────────────────────── */
  useEffect(() => {
    if (!rawReport) return;
    const report = rawReport;

    const branch = branches.find(b => b.id === (report as any).branch_id);
    const age = formatAge(report.patient_age, report.patient_age_unit) || 'N/A';

    const doctorName =
      report.doctor_name
        ? `${report.doctor_title || 'Dr'}. ${report.doctor_name}`
        : report.doctor_firstname && report.doctor_lastname
          ? `Dr. ${report.doctor_firstname} ${report.doctor_lastname}`
          : 'Self';

    const testData =
      typeof report.test_data === 'string'
        ? JSON.parse(report.test_data)
        : report.test_data;

    // Build grouped test sections + flat parameters for backward compat
    const testSections: TestSection[] = [];
    const parameters: Parameter[] = [];

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

    if (testData?.tests?.length) {
      // New grouped structure
      for (const group of testData.tests) {
        const params = (group.parameters || []).map((p: any) => mapParam(p, group.testId));
        testSections.push({ testName: group.testName, parameters: params });
        parameters.push(...params);
      }
    } else if (testData?.parameters?.length) {
      // Legacy flat structure — treat as a single test section
      const params = testData.parameters.map((p: any) => mapParam(p));
      testSections.push({
        testName: testData.testName || report.report_type || 'General Test',
        parameters: params,
      });
      parameters.push(...params);
    }

    const collectionDate = (report as any).collection_date || report.created_at;
    const reportedAt = report.approved_at || report.created_at;

    setReportData({
      lab: {
        name: branch?.name || 'DiagnoPro Diagnostics',
        address: branch?.location || 'Medical District',
        city: branch?.city || '',
        phone: branch?.phone || '',
        email: branch?.email || '',
        license: 'LAB-2024-001234',
      },
      report: {
        id: `REP-${report.id.slice(0, 8).toUpperCase()}`,
        date: format(new Date(report.created_at), 'dd MMM yyyy'),
        time: format(new Date(report.created_at), 'hh:mm aa'),
      },
      patient: {
        name: report.patient_name || 'Unknown Patient',
        id: `PT-${report.patient_id.slice(0, 8)}`,
        age,
        gender: report.patient_gender || 'Unknown',
        referringDoctor: doctorName,
        sampleId: report.sample_id_code || 'N/A',
        collectionDate: format(new Date(collectionDate), 'dd MMM yyyy, hh:mm aa'),
        collectionTime: format(new Date(collectionDate), 'hh:mm aa'),
        reportedDate: format(new Date(reportedAt), 'dd MMM yyyy, hh:mm aa'),
        reportedTime: format(new Date(reportedAt), 'hh:mm aa'),
      },
      test: {
        name: testData?.testName || report.report_type || 'General Test',
        category: testData?.testType || 'Laboratory',
      },
      testSections,
      parameters,
      technician: {
        name:
          report.technician_firstname && report.technician_lastname
            ? `${report.technician_firstname} ${report.technician_lastname}, MLT`
            : 'Lab Technician',
        signature: report.technician_firstname
          ? `${report.technician_firstname.charAt(0)}. ${report.technician_lastname}`
          : 'Technician',
      },
      pathologist: {
        name:
          report.approved_by_firstname && report.approved_by_lastname
            ? `Dr. ${report.approved_by_firstname} ${report.approved_by_lastname}, MD`
            : 'Pathologist',
        title: 'Consultant Pathologist',
        license: 'MD-LIC-00000',
        signature: report.approved_by_firstname || 'Pathologist',
      },
    });
  }, [rawReport, branches, sectionGroupMap]);

  /* ── Derived ──────────────────────────────────────────────────────────────── */
  const isSelfReport = reportData?.patient.referringDoctor === 'Self' || rawReport?.is_self_report;
  const refDoctor = doctors.find(d => d.id === rawReport?.doctor_id);
  const doctorSignatureUrl = refDoctor?.signature_url;

  // Check if any letterhead/header/footer is uploaded
  const hasLetterhead = !!(settings?.letterhead_url);
  const hasHeaderFooter = !!(settings?.header_url || settings?.footer_url);
  const hasAnyCustomHeader = hasLetterhead || hasHeaderFooter;
  // Active letterhead state: only show if uploaded AND user toggle is ON
  const letterheadActive = showLetterhead && hasLetterhead;
  const headerActive = showLetterhead && hasHeaderFooter && !hasLetterhead;
  const footerActive = showLetterhead && !!settings?.footer_url && !hasLetterhead;

  const abnormalParams = useMemo(
    () => (reportData?.parameters ?? []).filter(p => p.status === 'high' || p.status === 'low' || p.status === 'critical'),
    [reportData],
  );

  const remarkText = useMemo(() => {
    // Prefer clinical_notes from report (may include AI-generated interpretation)
    if (rawReport?.clinical_notes?.trim()) {
      return rawReport.clinical_notes.trim();
    }
    // Fallback: auto-generate from abnormal parameters
    if (abnormalParams.length === 0) return null;
    return (
      abnormalParams
        .map(p => {
          const dir = p.status === 'critical' ? 'critical' : p.status === 'high' ? 'elevated' : 'below normal range';
          return `${p.name} is ${dir} (${p.result} ${p.unit}).`;
        })
        .join(' ') + ' Clinical correlation is advised.'
    );
  }, [abnormalParams, rawReport]);

  /* ── Loading ──────────────────────────────────────────────────────────────── */
  if (isLoading && !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  /* ── Error ─────────────────────────────────────────────────────────────────── */
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

  /* ── Not Found ─────────────────────────────────────────────────────────────── */
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

  /* ══════════════════════════════════════════════════════════════════════════════
   *  MAIN REPORT – Premium Medical Pathology Lab Format (SRL / Metropolis style)
   * ══════════════════════════════════════════════════════════════════════════ */

  return (
    <>
      <style>{printStyles}</style>

      {/* ── Screen-only toolbar ── */}
      <div className="no-print report-toolbar sticky top-12 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="report-toolbar-inner max-w-[850px] mx-auto px-4 sm:px-6 h-auto sm:h-12 py-2 sm:py-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="toolbar-left flex items-center gap-1.5 w-full sm:w-auto">
            <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-800 transition-colors whitespace-nowrap">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> Reports
            </Link>
          </div>
          <div className="toolbar-content flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto">
            {/* Letterhead toggle – only show when letterhead/header is uploaded */}
            {hasAnyCustomHeader && (
              <button
                onClick={() => setShowLetterhead(prev => !prev)}
                className="toolbar-btn inline-flex items-center gap-1 text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded border transition-colors"
                style={{
                  borderColor: showLetterhead ? C.brand : '#D1D5DB',
                  backgroundColor: showLetterhead ? C.brandLight : '#F9FAFB',
                  color: showLetterhead ? C.brand : '#6B7280',
                }}
                title={showLetterhead ? 'Hide Letterhead' : 'Show Letterhead'}
              >
                <FileImage className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">{showLetterhead ? 'Letterhead On' : 'Letterhead Off'}</span>
                <span className="sm:hidden">{showLetterhead ? 'On' : 'Off'}</span>
              </button>
            )}
            <button
              onClick={() => setShowShareModal(true)}
              className="toolbar-btn inline-flex items-center gap-1 text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="toolbar-btn inline-flex items-center gap-1 text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isGeneratingPdf ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              className="toolbar-btn inline-flex items-center gap-1 text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded text-white transition-colors"
              style={{ backgroundColor: C.brand }}
            >
              <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── A4 Report Page ── */}
      <div className="report-bg-wrapper min-h-screen print:bg-white" style={{ backgroundColor: '#E8EAF0' }}>
        <div
          ref={reportPageRef}
          className="report-page max-w-[850px] mx-auto my-3 sm:my-6 print:my-0 bg-white print:shadow-none"
          style={{
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            margin: '0 auto',
            paddingTop: letterheadActive
              ? (settings?.report_margin_top !== undefined ? `${settings.report_margin_top}px` : '160px')
              : headerActive
                ? (settings?.report_margin_top !== undefined ? `${settings.report_margin_top}px` : '160px')
                : '16px',
            paddingBottom: letterheadActive
              ? (settings?.report_margin_bottom !== undefined ? `${settings.report_margin_bottom}px` : '120px')
              : footerActive
                ? (settings?.report_margin_bottom !== undefined ? `${settings.report_margin_bottom}px` : '120px')
                : '16px',
            paddingLeft: settings?.report_margin_left !== undefined ? `${settings.report_margin_left}px` : '0px',
            paddingRight: settings?.report_margin_right !== undefined ? `${settings.report_margin_right}px` : '0px',
          }}
        >
          {/* Full Letterhead Background — covers entire page like pre-printed paper */}
          {letterheadActive && settings?.letterhead_url && (
            <img
              src={getImageUrl(settings.letterhead_url) || ''}
              alt="Letterhead"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'top center',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Header Image (only when no full letterhead) */}
          {headerActive && settings?.header_url && (
            <img
              src={getImageUrl(settings.header_url) || ''}
              alt="Report Header"
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

          {/* Footer Image (only when no full letterhead) */}
          {footerActive && settings?.footer_url && (
            <img
              src={getImageUrl(settings.footer_url) || ''}
              alt="Report Footer"
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

          {/* No default header — only uploaded letterhead/header images are shown */}

          {/* ═══════════════════════════════════════════════════════════════
           *  PATIENT & SAMPLE INFO – Improved Layout
           * ═════════════════════════════════════════════════════════════ */}
          <div
            className="patient-info-box"
            style={{
              padding: `${ReportLayoutConfig.boxPadding.normal}px 12px ${ReportLayoutConfig.spacing.lg}px`,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <ImprovedPatientBox
              patientName={reportData.patient.name}
              age={reportData.patient.age}
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
                  size={64}
                  level="M"
                  bgColor="#ffffff"
                  fgColor={C.brand}
                />
              }
              barcode={<Barcode value={reportData.patient.sampleId} />}
              colorTokens={C}
            />
          </div>

          {/* ═══════════════════════════════════════════════════════════════
           *  BODY – flex-grow to fill A4
           * ═════════════════════════════════════════════════════════════ */}
          <div
            className="report-inner"
            style={{
              flex: 1,
              padding: `${ReportLayoutConfig.spacing.md}px 14px 0`,
              color: C.text,
              fontSize: '10.5px',
              lineHeight: 1.55,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              zIndex: 1,
              overflowX: 'auto',
            }}
          >

            {/* ═══════════════════════════════════════════════════════════════
             *  TEST SECTIONS – each test rendered with improved layout
             * ═════════════════════════════════════════════════════════════ */}
            <section style={{ flex: 1 }}>
              {reportData.testSections.map((section, sIdx) => (
                <TestSectionBlock
                  key={sIdx}
                  testName={section.testName}
                  isFirstSection={sIdx === 0}
                  colorTokens={C}
                >
                  {/* Parameter table for this test */}
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      tableLayout: 'fixed',
                      fontSize: `${ReportLayoutConfig.fontSize.value}px`,
                    }}
                  >
                    <InvestigationTableHeader colorTokens={C} />
                    <tbody>
                      {(() => {
                        let lastGroup: string | undefined;
                        let rowIndex = 0;

                        return section.parameters.map((param, idx) => {
                          const isCritical = param.status === 'critical';
                          const isHigh = param.status === 'high';
                          const isLow = param.status === 'low';
                          const isAbnormal = isHigh || isLow || isCritical;
                          const statusColor = isCritical ? C.high : isHigh ? C.high : isLow ? C.low : C.text;
                          const statusLabel = isCritical ? 'Critical' : isHigh ? 'High' : isLow ? 'Low' : '';

                          // Sub-section group header row
                          const showGroupHeader = param.group && param.group !== lastGroup;
                          if (param.group) lastGroup = param.group;

                          rowIndex++;

                          return (
                            <React.Fragment key={idx}>
                              {showGroupHeader && (
                                <SectionGroupHeader title={param.group || ''} colorTokens={C} />
                              )}
                              <InvestigationTableRow
                                investigation={param.name}
                                result={param.result}
                                status={statusLabel}
                                refRange={param.refRange}
                                unit={param.unit}
                                isAbnormal={isAbnormal}
                                statusColor={statusColor}
                                rowIndex={rowIndex}
                                indented={!!param.group}
                                colorTokens={C}
                              />
                            </React.Fragment>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </TestSectionBlock>
              ))}
            </section>

            {/* ═══════════════════════════════════════════════════════════════
             *  INTERPRETATION – bordered shaded box
             * ═════════════════════════════════════════════════════════════ */}
            {remarkText && (
              <section
                style={{
                  marginTop: `${ReportLayoutConfig.sectionMargin.between}px`,
                  padding: `${ReportLayoutConfig.boxPadding.normal}px ${ReportLayoutConfig.boxPadding.normal + 2}px`,
                  background: C.remarkBg,
                  border: `1px solid ${C.remarkBorder}`,
                  borderLeft: `4px solid ${C.remarkBorder}`,
                  borderRadius: '4px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    marginBottom: `${ReportLayoutConfig.spacing.sm}px`,
                    fontSize: `${ReportLayoutConfig.fontSize.header}px`,
                    fontWeight: 700,
                    color: C.sectionTitle,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Interpretation
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: `${ReportLayoutConfig.fontSize.value}px`,
                    color: C.secondary,
                    lineHeight: ReportLayoutConfig.lineHeight.spacious,
                  }}
                >
                  {remarkText}
                </p>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════
             *  END OF REPORT MARKER
             * ═════════════════════════════════════════════════════════════ */}
            <div style={{
              marginTop: '18px', textAlign: 'center',
              fontSize: '9px', color: C.muted, letterSpacing: '1px',
            }}>
              - - - End of Report - - -
            </div>

            {/* ═══════════════════════════════════════════════════════════════
             *  SIGNATURE SECTION – pushed to bottom via flex
             * ═════════════════════════════════════════════════════════════ */}
            <section
              className="signature-section"
              style={{
                marginTop: 'auto',
                paddingTop: `${ReportLayoutConfig.sectionMargin.between}px`,
                paddingBottom: `${ReportLayoutConfig.spacing.md}px`,
              }}
            >
              <div
                className="signature-section"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '100px',
                }}
              >
                {/* Lab Owner / Technician */}
                <div className="signature-block">
                  <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                    {settings?.owner_signature_url && (
                      <img
                        src={getImageUrl(settings.owner_signature_url) || ''}
                        alt="Owner Signature"
                        style={{ maxHeight: '40px', objectFit: 'contain' }}
                      />
                    )}
                  </div>
                  <div style={{ borderTop: `1.5px solid ${C.text}`, paddingTop: '6px' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: C.text }}>
                      {user ? `${user.firstname} ${user.lastname}` : reportData.technician.name}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: '9px', color: C.secondary }}>
                      Lab Owner / Incharge
                    </p>
                  </div>
                </div>

                {/* Reference Doctor Signature */}
                {!isSelfReport && (
                  <div className="signature-block-right" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                      {doctorSignatureUrl && (
                        <img
                          src={getImageUrl(doctorSignatureUrl) || ''}
                          alt="Doctor Signature"
                          style={{ maxHeight: '40px', objectFit: 'contain' }}
                        />
                      )}
                    </div>
                    <div style={{ borderTop: `1.5px solid ${C.text}`, paddingTop: '6px', width: '100%' }}>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: C.text }}>
                        {refDoctor ? `${refDoctor.title} ${refDoctor.name}` : reportData.patient.referringDoctor}
                      </p>
                      <p style={{ margin: '1px 0 0', fontSize: '9px', color: C.secondary }}>
                        {refDoctor?.specialization || 'Referring Physician'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

          </div>{/* /report-inner */}

          {/* ═══════════════════════════════════════════════════════════════
           *  FOOTER
           * ═════════════════════════════════════════════════════════════ */}
          {/* No default footer — only uploaded footer images are shown */}
        </div>{/* /report-page */}
      </div>

      {/* Share Modal */}
      {id && (
        <ShareReportModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          reportId={id}
          generatePDF={generatePDF}
          sampleIdCode={rawReport?.sample_id_code}
          patientName={rawReport?.patient_name}
          patientPhone={rawReport?.patient_phone}
          doctorName={rawReport?.doctor_name ? `${rawReport.doctor_title || 'Dr'}. ${rawReport.doctor_name}` : rawReport?.doctor_firstname ? `Dr. ${rawReport.doctor_firstname} ${rawReport.doctor_lastname}` : undefined}
          doctorPhone={rawReport?.doctor_phone}
          doctorEmail={rawReport?.doctor_email}
          hasDoctorRef={!!rawReport?.doctor_id}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  SUB-COMPONENTS & HELPERS
 * ══════════════════════════════════════════════════════════════════════════ */

/** Compact label → value row for patient/sample cards */
function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '4px', lineHeight: 1.7 }}>
      <span style={{ color: C.secondary, whiteSpace: 'nowrap' }}>{label}:</span>
      <span style={{ color: C.text, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}

/** Simple SVG barcode – decorative Code128-style bars */
function Barcode({ value }: { value: string }) {
  // Generate pseudo-random bar pattern from value string
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
      <svg width="110" height="28" viewBox={`0 0 ${bars.reduce((s, b, i) => s + b + (i % 2 === 0 ? 0 : 1), 0)} 28`}>
        {bars.map((w, i) => {
          const isBar = i % 2 === 0;
          const rect = isBar ? (
            <rect key={i} x={x} y={0} width={w} height={24} fill={C.text} />
          ) : null;
          x += w + (isBar ? 0 : 1);
          return rect;
        })}
      </svg>
      <p style={{ margin: '1px 0 0', fontSize: '7.5px', color: C.muted, letterSpacing: '1px', fontFamily: 'monospace' }}>
        {value}
      </p>
    </div>
  );
}