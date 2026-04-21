import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, ArrowLeft, Printer, Send, Download } from 'lucide-react';
import { useParams, Link, useSearchParams } from 'react-router';
import { useReportStore } from '../../stores/reportStore';
import { useBranchStore } from '../../stores/branchStore';
import { useTestStore } from '../../stores/testStore';
import { ShareReportModal } from '../components/WhatsAppModal';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';

/* ── Color tokens – Premium Medical / Pathology theme ──────────────────────── */
const C = {
  brand:       '#0D47A1',  // Deep medical blue
  brandDark:   '#0A3680',
  brandLight:  '#E8F0FE',
  brandAccent: '#1565C0',
  accent:      '#00897B',  // Teal accent for medical feel
  text:        '#212121',
  secondary:   '#546E7A',
  muted:       '#90A4AE',
  border:      '#B0BEC5',
  borderLight: '#E0E0E0',
  tableBg:     '#F8F9FB',
  tableStripe: '#F1F4F8',
  headerBg:    '#0D47A1',
  remarkBg:    '#FFF8E1',
  remarkBorder:'#FFB300',
  high:        '#C62828',
  low:         '#1565C0',
  normal:      '#2E7D32',
  white:       '#FFFFFF',
  cardBg:      '#FAFBFC',
  sectionTitle:'#37474F',
} as const;

/* ── A4 dimensions ─────────────────────────────────────────────────────────── */
const A4_MIN_HEIGHT = '1123px'; // ~A4 at 96dpi

/* ── Print styles ──────────────────────────────────────────────────────────── */
const printStyles = `
@media print {
  @page { size: A4; margin: 8mm 10mm; }
  html, body { margin: 0; padding: 0; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
  .report-page {
    box-shadow: none !important;
    margin: 0 !important;
    border-radius: 0 !important;
    min-height: 100vh !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  .report-inner { padding: 0 10mm !important; }
}
@media screen {
  .report-page { min-height: ${A4_MIN_HEIGHT}; }
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
  const { branches, fetchBranches } = useBranchStore();
  const { testFields, fetchTestFieldsMulti } = useTestStore();

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Handle multi-page if content is taller than A4
      const pageHeight = 297; // A4 height in mm
      let position = 0;
      let remainingHeight = imgHeight;

      while (remainingHeight > 0) {
        if (position > 0) pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.95),
          'JPEG', 0, -position, imgWidth, imgHeight
        );
        remainingHeight -= pageHeight;
        position += pageHeight;
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
    const age = report.patient_age || 0;

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
      isAbnormal: p.status === 'low' || p.status === 'high',
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
        sampleId: report.sample_id ? `SMP-${report.sample_id.slice(0, 8)}` : 'N/A',
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
  const abnormalParams = useMemo(
    () => (reportData?.parameters ?? []).filter(p => p.status === 'high' || p.status === 'low'),
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
          const dir = p.status === 'high' ? 'elevated' : 'below normal range';
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
      <div className="no-print sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-[850px] mx-auto px-6 h-12 flex items-center justify-between">
          <Link to="/reports" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Reports
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Share
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded text-white transition-colors"
              style={{ backgroundColor: C.brand }}
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* ── A4 Report Page ── */}
      <div className="min-h-screen print:bg-white" style={{ backgroundColor: '#E8EAF0' }}>
        <div
          ref={reportPageRef}
          className="report-page max-w-[850px] mx-auto my-6 print:my-0 bg-white print:shadow-none"
          style={{
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            minHeight: A4_MIN_HEIGHT,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* ── Watermark ── */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%) rotate(-35deg)',
            fontSize: '80px', fontWeight: 900, color: 'rgba(13,71,161,0.03)',
            letterSpacing: '12px', textTransform: 'uppercase',
            pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 0,
          }}>
            {reportData.lab.name}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
           *  TOP GRADIENT BAND
           * ═════════════════════════════════════════════════════════════ */}
          <div style={{
            height: '5px',
            background: `linear-gradient(90deg, ${C.brand} 0%, ${C.brandAccent} 50%, ${C.accent} 100%)`,
          }} />

          {/* ═══════════════════════════════════════════════════════════════
           *  HEADER – Lab Letterhead
           * ═════════════════════════════════════════════════════════════ */}
          <header style={{ padding: '14px 28px 10px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              {/* Left: Lab identity */}
              <div style={{ flex: 1 }}>
                <h1 style={{
                  margin: 0, fontSize: '26px', fontWeight: 800, color: C.brand,
                  letterSpacing: '0.8px', textTransform: 'uppercase',
                  lineHeight: 1.1,
                }}>
                  {reportData.lab.name}
                </h1>
                <p style={{
                  margin: '3px 0 0', fontSize: '10px', color: C.accent,
                  fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
                }}>
                  Pathology &amp; Diagnostic Laboratory
                </p>
                <p style={{
                  margin: '6px 0 0', fontSize: '10px', color: C.secondary, lineHeight: 1.5,
                }}>
                  {reportData.lab.address}{reportData.lab.city ? `, ${reportData.lab.city}` : ''}
                </p>
              </div>

              {/* Right: Contact info only */}
              <div style={{ flexShrink: 0, textAlign: 'right', fontSize: '10px', color: C.secondary, lineHeight: 1.9 }}>
                {reportData.lab.phone && (
                  <p style={{ margin: 0 }}>
                    <span style={{ fontWeight: 600, color: C.text }}>Ph:</span> {reportData.lab.phone}
                  </p>
                )}
                {reportData.lab.email && (
                  <p style={{ margin: 0 }}>
                    <span style={{ fontWeight: 600, color: C.text }}>Email:</span> {reportData.lab.email}
                  </p>
                )}
              </div>
            </div>
          </header>

          {/* ═══════════════════════════════════════════════════════════════
           *  ACCREDITATION BAR (License + NABL)
           * ═════════════════════════════════════════════════════════════ */}
          <div style={{
            background: C.brand, padding: '4px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '9px', letterSpacing: '0.3px' }}>
              Lic: {reportData.lab.license}
            </span>
            <span style={{ color: C.white, fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.5px' }}>
              NABL Accredited Laboratory
            </span>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
           *  PATIENT & SAMPLE INFO – Single Card Layout
           * ═════════════════════════════════════════════════════════════ */}
          <div style={{
            padding: '10px 28px 12px',
            position: 'relative', zIndex: 1,
          }}>
            <div style={{
              background: C.cardBg, border: `1px solid ${C.borderLight}`,
              borderRadius: '6px', padding: '12px 14px',
            }}>
              {/* Top row: Patient info (left) + QR & Barcode (right) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Left: Patient details */}
                <div style={{ flex: 1, fontSize: '10px' }}>
                  <p style={{
                    margin: 0, fontSize: '15px', fontWeight: 800, color: C.text, lineHeight: 1.2,
                  }}>
                    {reportData.patient.name}
                  </p>
                  <div style={{ marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <InfoRow label="Age" value={`${reportData.patient.age} Years`} />
                    <InfoRow label="Sex" value={reportData.patient.gender} />
                    <InfoRow label="PID" value={reportData.patient.id} />
                  </div>
                </div>
                {/* Right: QR + Barcode (compact) */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '2px', border: `1px solid ${C.borderLight}`, borderRadius: '3px', background: C.white }}>
                    <QRCodeSVG
                      value={`${window.location.origin}/reports/${id}`}
                      size={44}
                      level="M"
                      bgColor="#ffffff"
                      fgColor={C.brand}
                    />
                  </div>
                  <Barcode value={reportData.patient.sampleId} />
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: C.borderLight, margin: '8px 0' }} />

              {/* Bottom row: Sample & dates in structured grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: '3px 12px', fontSize: '9.5px',
              }}>
                <InfoRow label="Sample ID" value={reportData.patient.sampleId} />
                <InfoRow label="Ref. By" value={reportData.patient.referringDoctor} bold />
                <InfoRow label="Registered" value={`${reportData.report.date}, ${reportData.report.time}`} />
                <InfoRow label="Collected" value={reportData.patient.collectionDate} />
                <InfoRow label="Reported" value={reportData.patient.reportedDate} />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1.5px', background: C.border, margin: '0 28px' }} />

          {/* ═══════════════════════════════════════════════════════════════
           *  BODY – flex-grow to fill A4
           * ═════════════════════════════════════════════════════════════ */}
          <div
            className="report-inner"
            style={{
              flex: 1,
              padding: '12px 28px 0',
              color: C.text,
              fontSize: '11px',
              lineHeight: 1.55,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative', zIndex: 1,
            }}
          >

            {/* ═══════════════════════════════════════════════════════════════
             *  TEST SECTIONS – each test rendered as separate block with heading + table
             * ═════════════════════════════════════════════════════════════ */}
            <section style={{ flex: 1 }}>
              {reportData.testSections.map((section, sIdx) => (
                <div key={sIdx} style={{ marginBottom: sIdx < reportData.testSections.length - 1 ? '20px' : 0 }}>
                  {/* Test section heading */}
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h2 style={{
                      margin: 0, fontSize: '13px', fontWeight: 800, color: C.brand,
                      textTransform: 'uppercase', letterSpacing: '1.5px',
                      display: 'inline-block', paddingBottom: '4px',
                      borderBottom: `2px solid ${C.brand}`,
                    }}>
                      {section.testName}
                    </h2>
                  </div>

                  {/* Parameter table for this test */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto', fontSize: '10.5px' }}>
                    <thead>
                      <tr style={{ background: C.brand }}>
                        <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 700, color: C.white, fontSize: '10px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                          Investigation
                        </th>
                        <th style={{ textAlign: 'center', padding: '5px 8px', fontWeight: 700, color: C.white, fontSize: '10px', letterSpacing: '0.3px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                          Result
                        </th>
                        <th style={{ textAlign: 'center', padding: '5px 8px', fontWeight: 700, color: C.white, fontSize: '10px', letterSpacing: '0.3px', textTransform: 'uppercase', whiteSpace: 'nowrap', width: '1%' }}>
                          {/* status column - no header text */}
                        </th>
                        <th style={{ textAlign: 'center', padding: '5px 8px', fontWeight: 700, color: C.white, fontSize: '10px', letterSpacing: '0.3px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                          Reference Value
                        </th>
                        <th style={{ textAlign: 'center', padding: '5px 8px', fontWeight: 700, color: C.white, fontSize: '10px', letterSpacing: '0.3px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                          Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let lastGroup: string | undefined;
                        return section.parameters.map((param, idx) => {
                          const isHigh = param.status === 'high';
                          const isLow  = param.status === 'low';
                          const isAbnormal = isHigh || isLow;
                          const isCalc = param.fieldType === 'calculated';
                          const statusColor = isHigh ? C.high : isLow ? C.low : C.text;
                          const statusLabel = isHigh ? 'High' : isLow ? 'Low' : '';
                          const rowBg = isAbnormal
                            ? (isHigh ? 'rgba(198,40,40,0.04)' : 'rgba(21,101,192,0.04)')
                            : idx % 2 === 0 ? C.white : C.tableStripe;

                          // Sub-section group header row
                          const showGroupHeader = param.group && param.group !== lastGroup;
                          if (param.group) lastGroup = param.group;

                          return (
                            <>{showGroupHeader && (
                              <tr key={`group-${idx}`} style={{ background: C.brandLight }}>
                                <td colSpan={5} style={{
                                  padding: '4px 8px',
                                  fontWeight: 800,
                                  fontSize: '9.5px',
                                  color: C.brand,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  borderBottom: `1px solid ${C.borderLight}`,
                                }}>
                                  {param.group}
                                </td>
                              </tr>
                            )}
                            <tr key={idx} style={{ background: rowBg }}>
                              <td style={{
                                padding: '3px 8px', fontWeight: 500, color: C.text,
                                borderBottom: `1px solid ${C.borderLight}`,
                                fontSize: '10px',
                              }}>
                                {param.name}
                                {isCalc && (
                                  <span style={{ fontSize: '7px', color: C.muted, display: 'block', lineHeight: 1 }}>Calculated</span>
                                )}
                              </td>
                              <td style={{
                                padding: '3px 8px', textAlign: 'center',
                                fontWeight: isAbnormal ? 700 : 500,
                                color: statusColor,
                                fontSize: '10px',
                                fontVariantNumeric: 'tabular-nums',
                                borderBottom: `1px solid ${C.borderLight}`,
                                whiteSpace: 'nowrap',
                              }}>
                                {param.result}
                              </td>
                              <td style={{
                                padding: '3px 2px', textAlign: 'center',
                                borderBottom: `1px solid ${C.borderLight}`,
                                whiteSpace: 'nowrap', width: '1%',
                              }}>
                                {isAbnormal && (
                                  <span style={{
                                    fontSize: '8.5px', fontWeight: 700, color: statusColor,
                                  }}>
                                    {statusLabel}
                                  </span>
                                )}
                              </td>
                              <td style={{
                                padding: '3px 8px', textAlign: 'center', color: C.secondary,
                                borderBottom: `1px solid ${C.borderLight}`,
                                fontSize: '10px', whiteSpace: 'nowrap',
                              }}>
                                {param.refRange}
                              </td>
                              <td style={{
                                padding: '3px 8px', textAlign: 'center', color: C.secondary,
                                borderBottom: `1px solid ${C.borderLight}`,
                                fontSize: '10px', whiteSpace: 'nowrap',
                              }}>
                                {param.unit}
                              </td>
                            </tr></>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>

            {/* ═══════════════════════════════════════════════════════════════
             *  INTERPRETATION – bordered shaded box
             * ═════════════════════════════════════════════════════════════ */}
            {remarkText && (
              <section style={{
                marginTop: '16px', padding: '10px 14px',
                background: C.remarkBg,
                border: `1px solid ${C.remarkBorder}`,
                borderLeft: `4px solid ${C.remarkBorder}`,
                borderRadius: '4px',
              }}>
                <p style={{
                  margin: 0, fontSize: '10.5px', fontWeight: 700,
                  color: C.sectionTitle, textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  Interpretation
                </p>
                <p style={{
                  margin: '4px 0 0', fontSize: '10.5px', color: C.secondary, lineHeight: 1.65,
                }}>
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
            <section style={{ marginTop: 'auto', paddingTop: '36px', paddingBottom: '10px' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '100px',
              }}>
                {/* Lab Technician */}
                <div>
                  <div style={{ height: '40px' }}>{/* signature area */}</div>
                  <div style={{ borderTop: `1.5px solid ${C.text}`, paddingTop: '6px' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: C.text }}>
                      {reportData.technician.name}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: '9px', color: C.secondary }}>
                      Lab Technician (DMLT, BMLT)
                    </p>
                  </div>
                </div>
                {/* Pathologist */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ height: '40px' }}>{/* signature area */}</div>
                  <div style={{ borderTop: `1.5px solid ${C.text}`, paddingTop: '6px' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: C.text }}>
                      {reportData.pathologist.name}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: '9px', color: C.secondary }}>
                      {reportData.pathologist.title}
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>{/* /report-inner */}

          {/* ═══════════════════════════════════════════════════════════════
           *  FOOTER
           * ═════════════════════════════════════════════════════════════ */}
          <footer style={{ padding: '0 28px', position: 'relative', zIndex: 1 }}>
            <div style={{
              borderTop: `1px solid ${C.borderLight}`, paddingTop: '6px', paddingBottom: '6px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '8px', color: C.muted, lineHeight: 1.5,
            }}>
              <div>
                <p style={{ margin: 0 }}>
                  Report Generated : {reportData.patient.reportedDate}
                </p>
                {(reportData.lab.phone || reportData.lab.email) && (
                  <p style={{ margin: '1px 0 0' }}>
                    {reportData.lab.phone && <>Ph: {reportData.lab.phone}</>}
                    {reportData.lab.phone && reportData.lab.email && <> | </>}
                    {reportData.lab.email && <>Email: {reportData.lab.email}</>}
                  </p>
                )}
              </div>
              <p style={{ margin: 0 }}>Page 1 of 1</p>
            </div>
          </footer>

          {/* Bottom band */}
          <div style={{
            height: '28px', background: C.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '8.5px', letterSpacing: '0.3px' }}>
              This is a computer-generated report and does not require a physical signature.
            </span>
          </div>
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