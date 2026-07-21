import { useEffect, useRef } from 'react';
import { X, Printer } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useTestStore } from '../../../stores/testStore';
import type { Report } from '../../../types';

interface SampleBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
}

// Inner barcode component specifically for the test tube sticker preview
function LabelBarcode({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: 1.2,
          height: 22,
          displayValue: false,
          margin: 0,
        });
      } catch (err) {
        console.error('Label barcode generation error:', err);
      }
    }
  }, [value]);

  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg ref={svgRef} style={{ display: 'block', margin: '0 auto' }} />
      <div 
        className="barcode-text text-black dark:text-white" 
        style={{ 
          fontSize: '8px', 
          fontWeight: 'bold', 
          marginTop: '2px', 
          letterSpacing: '0.5px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        ID: {value}
      </div>
    </div>
  );
}

export function SampleBarcodeModal({ isOpen, onClose, report }: SampleBarcodeModalProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);
  const { tests } = useTestStore();

  if (!isOpen || !report) return null;

  // Extract test short-codes / abbreviations
  const getTestCodes = (): string => {
    const cleanCode = (code: string): string => {
      return code.replace(/[-_]\d+$/, '').toUpperCase();
    };

    const extractParentheses = (name: string): string | null => {
      const match = name.match(/\(([^)]+)\)/);
      return match ? match[1].trim() : null;
    };

    const findCode = (testName?: string, testId?: string): string | null => {
      if (testId) {
        const test = tests.find(t => t.id === testId);
        if (test?.test_code) return cleanCode(test.test_code);
      }
      if (testName) {
        const test = tests.find(t => t.test_name.toLowerCase() === testName.toLowerCase());
        if (test?.test_code) return cleanCode(test.test_code);
        
        const codeInParen = extractParentheses(testName);
        if (codeInParen) return cleanCode(codeInParen);
      }
      return null;
    };

    // Check if there are snapshotted packages first
    if (report.pricing_snapshot && report.pricing_snapshot.length > 0) {
      const packageNames = report.pricing_snapshot
        .filter(item => item.package_id)
        .map(item => item.package_name)
        .filter(Boolean) as string[];

      const standaloneTests = report.pricing_snapshot
        .filter(item => !item.package_id && item.test_id)
        .map(item => item.test_code)
        .filter(Boolean) as string[];

      if (packageNames.length > 0) {
        if (standaloneTests.length > 0) {
          const matchedStandalones = standaloneTests.map(c => cleanCode(c));
          return `${packageNames.join(', ')} + ${matchedStandalones.join(', ')}`;
        }
        return packageNames.join(', ');
      }
    }

    // 1. Grouped structure
    if (report.test_data?.tests && report.test_data.tests.length > 0) {
      const codes = report.test_data.tests.map(t => {
        return findCode(t.testName, t.testId) || t.testName;
      });
      return codes.join(', ');
    }

    // 2. Flat structure with testIds
    if (report.test_data?.testIds && report.test_data.testIds.length > 0) {
      const codes = report.test_data.testIds.map(testId => {
        const test = tests.find(t => t.id === testId);
        return test?.test_code ? cleanCode(test.test_code) : (extractParentheses(test?.test_name || '') || test?.test_name || 'Test');
      });
      return codes.join(', ');
    }

    // Fallback: split report_type
    if (report.report_type) {
      const items = report.report_type.split(',').map(s => s.trim()).filter(Boolean);
      const codes = items.map(name => findCode(name) || extractParentheses(name) || name);
      return codes.join(', ');
    }

    return 'General';
  };

  const testCodes = getTestCodes();
  const sampleId = report.sample_id_code || 'N/A';
  const patientName = report.patient_name || 'N/A';
  const collectionDate = report.created_at
    ? new Date(report.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    : new Date().toLocaleDateString('en-GB');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get current labels HTML from the ref
    const content = printContainerRef.current?.innerHTML || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Tube Barcode - ${patientName}</title>
          <style>
            @page {
              size: 50mm 25mm;
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              background-color: #fff;
            }
            .label-page {
              width: 50mm;
              height: 25mm;
              box-sizing: border-box;
              padding: 2.5mm 3.5mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              page-break-after: always;
              overflow: hidden;
            }
            .label-page:last-child {
              page-break-after: avoid;
            }
            .patient-name {
              font-size: 8px;
              font-weight: 700;
              text-transform: uppercase;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              border-bottom: 0.5px solid #eee;
              padding-bottom: 1.5px;
            }
            .barcode-svg-container {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              margin: 1px 0;
              height: 11mm;
            }
            .barcode-svg-container svg {
              max-height: 7.5mm;
              width: auto;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              font-size: 7px;
              font-weight: bold;
              border-top: 0.5px solid #eee;
              padding-top: 1.5px;
              min-height: 8px;
            }
            .test-tag {
              font-size: 7px;
              font-weight: 800;
              text-transform: uppercase;
              word-break: break-word;
              flex: 1;
              margin-right: 6px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .collection-date {
              white-space: nowrap;
              flex-shrink: 0;
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-md overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Print Tube Barcode Sticker</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Stickers for patient <span className="font-medium text-foreground">{patientName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
          <div className="text-[11px] font-medium text-muted-foreground text-center mb-1">
            Label Preview (50mm x 25mm)
          </div>

          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-[280px] h-[140px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-black dark:text-white rounded shadow-sm p-4 flex flex-col justify-between select-none"
            >
              {/* Patient Name */}
              <div className="text-[10px] font-bold uppercase truncate border-b border-slate-100 dark:border-slate-800 pb-1.5">
                {patientName}
              </div>

              {/* Barcode SVG */}
              <div className="py-2">
                <LabelBarcode value={sampleId} />
              </div>

              {/* Footer Meta */}
              <div className="flex justify-between items-end text-[9px] font-bold pt-1.5 border-t border-slate-100 dark:border-slate-800 w-full gap-2">
                <span 
                  className="text-slate-800 dark:text-slate-200 font-extrabold uppercase break-words flex-1 text-left line-clamp-2" 
                  title={testCodes}
                >
                  {testCodes}
                </span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                  {collectionDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Printable Container used to grab HTML for window.print */}
        <div ref={printContainerRef} className="hidden">
          <div className="label-page">
            <div className="patient-name">{patientName}</div>
            <div className="barcode-svg-container">
              <LabelBarcode value={sampleId} />
            </div>
            <div className="meta-row">
              <span className="test-tag">{testCodes}</span>
              <span className="collection-date">{collectionDate}</span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2 bg-card">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-border text-xs rounded hover:bg-accent text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/95 transition-colors font-medium"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
