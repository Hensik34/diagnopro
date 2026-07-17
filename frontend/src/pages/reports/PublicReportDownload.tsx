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
  FormattedClinicalSignificance,
} from '../../app/components/ImprovedReportLayout';
import { formatAge } from '../../utils/age';
import {
  computeReportPages,
  optimizeTestOrder,
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  PAGE_GAP_PX,
  type Parameter,
  type TestSection,
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
      <p style={{ margin: '2px 0 0', fontSize: '8px', color: '#212121', letterSpacing: '0.8px', fontFamily: 'monospace', lineHeight: 1, fontWeight: 600 }}>{value}</p>
    </div>
  );
}

export function PublicReportDownload() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState<ReportData | null>(null);
  const token = searchParams.get('token') || report?.download_token;
  const printMode = searchParams.get('print') === 'true';
  const clientOrigin = (window as any).__CLIENT_URL__ || window.location.origin;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Fetch public report
  useEffect(() => {
    const fetchPublicReport = async () => {
      if ((window as any).__REPORT_DATA__) {
        setReport((window as any).__REPORT_DATA__);
        setLoading(false);
        return;
      }

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

          filteredParams = filteredParams.map((p: any) => {
            const setting = posMap.get(p.name);
            const extra: any = {};
            if (setting) {
              if (setting.fontSize !== undefined) extra.fontSize = setting.fontSize;
              if (setting.bold !== undefined) extra.bold = setting.bold;
            }
            return { ...p, ...extra };
          });

          filteredParams = filterBlankParams(filteredParams);

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
          allParams.push(...cleanedParams);
        } else {
          const filteredParams = filterBlankParams(sectionParams);
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
          allParams.push(...cleanedParams);
        }
      }
    } else if (testData?.parameters?.length) {
      const sectionParams = testData.parameters.map((p: any) => mapParam(p));
      const filteredParams = filterBlankParams(sectionParams);
      const extracted = extractPeripheralSmear(filteredParams);
      const cleanedParams = extracted.cleaned;
      const peripheralSmearText = extracted.text;

      testSections.push({
        id: 'legacy-0',
        testName: testData.testName || report.report_type || 'General Test',
        parameters: cleanedParams,
        isCbc: isCbcTest(testData.testName || report.report_type || 'General Test'),
        peripheralSmearText,
      });
      allParams.push(...cleanedParams);
    }

    const pathologySigUrl = (report as any).pathology_signature_url;
    const pathologySigLabel = (report as any).pathology_signature_label;
    const hasDoctorSignature = !!(pathologySigUrl || pathologySigLabel);

    const optimizedSections = optimizeTestOrder(testSections, {
      safeZones,
      hasDoctorSignature,
      density: 'balanced',
      layoutSnapshots,
      testData,
      clinicalNotes: report.clinical_notes,
      isSelfReport: report.is_self_report,
      attachMarketingPages: report.attach_marketing_pages,
      marketingPages: report.marketing_pages,
    });

    return { testSections: optimizedSections, allParams };
  }, [report, safeZones]);

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
  const paginationResult = useMemo(() => {
    if (!report) return { pages: [] as PageItem[][], compactAdjustment: 0 };
    const { testSections } = mappedSectionsAndParams;
    const pathologySigUrl = (report as any).pathology_signature_url;
    const pathologySigLabel = (report as any).pathology_signature_label;
    const hasDoctorSignature = !!(pathologySigUrl || pathologySigLabel);
    
    const testData = typeof report.test_data === 'string' ? JSON.parse(report.test_data) : report.test_data;
    const layoutSnapshots = testData?.layout_snapshots || {};

    return computeReportPages({
      orderedSections: testSections,
      safeZones,
      hasDoctorSignature,
      density,
      layoutSnapshots,
      testData,
      clinicalNotes: report.clinical_notes,
      isSelfReport: report.is_self_report,
      attachMarketingPages: report.attach_marketing_pages,
      marketingPages: report.marketing_pages,
    });
  }, [report, mappedSectionsAndParams, safeZones, density]);

  const reportPages = paginationResult.pages;

  // Download PDF Action
  const handleDownload = useCallback(async () => {
    if (!report || !token) return;
    setDownloading(true);
    setDownloadProgress(20);

    try {
      const apiBase = publicApi.defaults.baseURL || 'http://localhost:5000/api';
      const downloadUrl = `${apiBase}/reports/public/${id}/pdf?token=${token}`;
      
      // Navigate to trigger standard browser download stream
      window.location.href = downloadUrl;
      
      // Simulate progress indicator updates for user feedback
      setDownloadProgress(65);
      setTimeout(() => {
        setDownloadProgress(100);
        setTimeout(() => {
          setDownloading(false);
          setDownloadProgress(0);
        }, 1000);
      }, 600);

    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Could not download PDF file. Please try again.');
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, [report, id, token]);

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

  const pathologySigUrl = (report as any).pathology_signature_url;
  const pathologySigLabel = (report as any).pathology_signature_label;
  const pathologySigDesc = (report as any).pathology_signature_description;
  const hasDoctorSignature = !!(pathologySigUrl || pathologySigLabel);
  const signatureStripHeight = hasDoctorSignature ? 84 : 76;

  let lastReportPageIndex = -1;
  for (let i = reportPages.length - 1; i >= 0; i -= 1) {
    if (reportPages[i]?.[0]?.type !== 'marketing') {
      lastReportPageIndex = i;
      break;
    }
  }

  if (printMode) {
    return (
      <div className="bg-white flex flex-col items-center" style={{ width: '100%' }}>
        <style>{`
          @media print {
            @page { size: A4; margin: 0; }
            html, body { margin: 0; padding: 0; }
            body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .report-page { page-break-after: always; break-after: page; margin: 0 !important; box-shadow: none !important; border: none !important; }
            .report-page:last-child { page-break-after: avoid; break-after: avoid; }
          }
          body { background: #f0f2f5; margin: 0; padding: 0; }
          .report-page { margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        `}</style>
        <div ref={previewContainerRef}>
          {reportPages.map((page, pageIndex) => {
            const marketingItem = page[0]?.type === 'marketing' ? page[0] : null;
            const isMarketingPage = !!marketingItem;
            const testData = typeof report.test_data === 'string' ? JSON.parse(report.test_data) : report.test_data;
            const layoutSnapshots = testData?.layout_snapshots || {};
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
                    src={getImageUrl(marketingItem.pageConfig.url) || ''}
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
                                value={token ? `${clientOrigin}/public/report/${id}/download?token=${token}` : ''}
                                size={56}
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
                      const hasPreviousTestOnPage = page.slice(0, idx).some((prevItem: any) => prevItem.type === 'test');
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
                            borderCollapse: 'collapse',
                            tableLayout: 'fixed',
                            marginTop: '1px'
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
                      const smearRows: Array<{ label: string; value: string }> = item.text
                        .split('\n')
                        .map((line: string) => line.trim())
                        .filter(Boolean)
                        .map((line: string) => {
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
                              {smearRows.map((row: { label: string; value: string }, rowIdx: number) => {
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
                                      {row.value.split(',').map((val: string) => val.trim()).filter(Boolean).map((subVal: string, subIdx: number) => (
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
                          {report.owner_signature_url && (
                            <img
                              src={getImageUrl(report.owner_signature_url) || ''}
                              alt="Owner Signature"
                              style={{ maxHeight: 36, objectFit: 'contain' }}
                            />
                          )}
                        </div>
                        <div style={{ borderTop: '1px solid #333', paddingTop: 3, minWidth: '140px' }}>
                          <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, color: '#111' }}>
                            {report.owner_signature_label || (report.technician_firstname ? `${report.technician_firstname} ${report.technician_lastname || ''}` : 'Lab Technician')}
                          </p>
                          <p style={{ margin: '1px 0 0', fontSize: '8.5px', color: '#666' }}>{(report as any).owner_signature_description || 'Lab Owner / Incharge'}</p>
                        </div>
                      </div>

                      {hasDoctorSignature && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ height: 36, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 4 }}>
                            {pathologySigUrl && (
                              <img
                                src={getImageUrl(pathologySigUrl) || ''}
                                alt="Doctor Signature"
                                style={{ maxHeight: 36, objectFit: 'contain' }}
                              />
                            )}
                          </div>
                          <div style={{ borderTop: '1px solid #333', paddingTop: 3, minWidth: '140px' }}>
                            <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, color: '#111' }}>
                              {pathologySigLabel || 'Authorized Signatory'}
                            </p>
                            <p style={{ margin: '1px 0 0', fontSize: '8.5px', color: '#666' }}>
                              {pathologySigDesc || 'Pathologist'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
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
            const marketingItem = page[0]?.type === 'marketing' ? page[0] : null;
            const isMarketingPage = !!marketingItem;
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
                    src={getImageUrl(marketingItem.pageConfig.url) || ''}
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
                                value={token ? `${clientOrigin}/public/report/${id}/download?token=${token}` : ''}
                                size={56}
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
                      const hasPreviousTestOnPage = page.slice(0, idx).some((prevItem: any) => prevItem.type === 'test');
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
                            borderCollapse: 'collapse',
                            tableLayout: 'fixed',
                            marginTop: '1px'
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
                          <div style={{ margin: 0 }}>
                            {item.text.split('\n').map((line, lineIdx) => {
                              const isTableRow = line.includes('\t') || line.includes('   ');
                              return (
                                <div
                                  key={lineIdx}
                                  style={{
                                    fontFamily: isTableRow ? 'Consolas, Monaco, "Courier New", Courier, monospace' : 'inherit',
                                    whiteSpace: 'pre-wrap',
                                    minHeight: '1em'
                                  }}
                                >
                                  {line}
                                </div>
                              );
                            })}
                          </div>
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
                          <div style={{ margin: 0 }}>
                            {item.text.split('\n').map((line, lineIdx) => {
                              const isTableRow = line.includes('\t') || line.includes('   ');
                              return (
                                <div
                                  key={lineIdx}
                                  style={{
                                    fontFamily: isTableRow ? 'Consolas, Monaco, "Courier New", Courier, monospace' : 'inherit',
                                    whiteSpace: 'pre-wrap',
                                    minHeight: '1em'
                                  }}
                                >
                                  {line}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

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
                          {report.owner_signature_url && (
                            <img
                              src={getImageUrl(report.owner_signature_url) || ''}
                              alt="Owner Signature"
                              style={{ maxHeight: 36, objectFit: 'contain' }}
                            />
                          )}
                        </div>
                        <div style={{ borderTop: '1px solid #333', paddingTop: 3, minWidth: '140px' }}>
                          <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, color: '#111' }}>
                            {report.owner_signature_label || (report.technician_firstname ? `${report.technician_firstname} ${report.technician_lastname || ''}` : 'Lab Technician')}
                          </p>
                          <p style={{ margin: '1px 0 0', fontSize: '8.5px', color: '#666' }}>{(report as any).owner_signature_description || 'Lab Owner / Incharge'}</p>
                        </div>
                      </div>

                      {hasDoctorSignature && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ height: 36, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 4 }}>
                            {pathologySigUrl && (
                              <img
                                src={getImageUrl(pathologySigUrl) || ''}
                                alt="Doctor Signature"
                                style={{ maxHeight: 36, objectFit: 'contain' }}
                              />
                            )}
                          </div>
                          <div style={{ borderTop: '1px solid #333', paddingTop: 3, minWidth: '140px' }}>
                            <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, color: '#111' }}>
                              {pathologySigLabel || 'Authorized Signatory'}
                            </p>
                            <p style={{ margin: '1px 0 0', fontSize: '8.5px', color: '#666' }}>
                              {pathologySigDesc || 'Pathologist'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
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
