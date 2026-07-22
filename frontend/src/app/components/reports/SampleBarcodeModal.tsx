import { useEffect, useRef, useState, useMemo } from 'react';
import { X, Printer, Beaker } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useTestStore } from '../../../stores/testStore';
import type { Report } from '../../../types';

interface SampleBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
}

export interface SampleGroup {
  id: string;
  sampleType: string;
  containerInfo: string;
  badgeColor: string;
  barcodeValue: string;
  tests: { code: string; name: string }[];
  testCodesStr: string;
}

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
        className="barcode-text text-slate-900 dark:text-slate-100" 
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
  const { tests: masterTests } = useTestStore();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const cleanCode = (code: string): string => {
    return code.replace(/[-_]\d+$/, '').toUpperCase();
  };

  const extractParentheses = (name: string): string | null => {
    const match = name.match(/\(([^)]+)\)/);
    return match ? match[1].trim() : null;
  };

  const inferSampleDetails = (sampleTypeRaw?: string, testName?: string, testCode?: string) => {
    const nameLower = (testName || '').toLowerCase();
    const codeLower = (testCode || '').toLowerCase();
    const rawLower = (sampleTypeRaw || '').toLowerCase();

    if (rawLower.includes('urine') || nameLower.includes('urine') || codeLower.includes('urine')) {
      return { sampleType: 'Urine', container: 'Sterile Container', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', prefix: 'U' };
    }
    if (rawLower.includes('stool') || nameLower.includes('stool') || nameLower.includes('feces')) {
      return { sampleType: 'Stool', container: 'Stool Container', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', prefix: 'S' };
    }
    if (rawLower.includes('fluoride') || nameLower.includes('fbs') || nameLower.includes('ppbs') || nameLower.includes('glucose')) {
      return { sampleType: 'Fluoride Blood', container: 'Grey Tube', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', prefix: 'F' };
    }
    if (rawLower.includes('edta') || nameLower.includes('cbc') || codeLower.includes('cbc') || nameLower.includes('hb')) {
      return { sampleType: 'EDTA Blood', container: 'Lavender Tube', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', prefix: 'B' };
    }
    if (rawLower.includes('serum') || nameLower.includes('crp') || nameLower.includes('lft') || nameLower.includes('kft') || nameLower.includes('lipid') || nameLower.includes('thyroid')) {
      return { sampleType: 'Serum', container: 'Red/Yellow Tube', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', prefix: 'SR' };
    }
    if (sampleTypeRaw && sampleTypeRaw.trim()) {
      return { sampleType: sampleTypeRaw, container: 'Specimen Tube', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', prefix: 'S' };
    }
    return { sampleType: 'Specimen', container: 'Blood Tube', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', prefix: 'B' };
  };

  const sampleGroups = useMemo<SampleGroup[]>(() => {
    if (!report) return [];

    const baseSampleId = report.sample_id_code || '1001';
    const rawTestItems: { name: string; code: string; sampleTypeRaw?: string }[] = [];

    if (report.pricing_snapshot && report.pricing_snapshot.length > 0) {
      report.pricing_snapshot.forEach((item) => {
        if (item.test_name || item.test_code) {
          const master = masterTests.find(t => t.id === item.test_id || t.test_name.toLowerCase() === (item.test_name || '').toLowerCase());
          rawTestItems.push({
            name: item.test_name || master?.test_name || 'Test',
            code: cleanCode(item.test_code || master?.test_code || extractParentheses(item.test_name || '') || item.test_name || 'TEST'),
            sampleTypeRaw: master?.sample_type,
          });
        }
      });
    }

    if (rawTestItems.length === 0 && report.test_data?.tests && report.test_data.tests.length > 0) {
      report.test_data.tests.forEach((t) => {
        const master = masterTests.find(mt => mt.id === t.testId || mt.test_name.toLowerCase() === (t.testName || '').toLowerCase());
        rawTestItems.push({
          name: t.testName || master?.test_name || 'Test',
          code: cleanCode(master?.test_code || extractParentheses(t.testName || '') || t.testName || 'TEST'),
          sampleTypeRaw: master?.sample_type,
        });
      });
    }

    if (rawTestItems.length === 0 && report.report_type) {
      const names = report.report_type.split(',').map(s => s.trim()).filter(Boolean);
      names.forEach((name) => {
        const master = masterTests.find(mt => mt.test_name.toLowerCase() === name.toLowerCase());
        rawTestItems.push({
          name,
          code: cleanCode(master?.test_code || extractParentheses(name) || name),
          sampleTypeRaw: master?.sample_type,
        });
      });
    }

    if (rawTestItems.length === 0) {
      rawTestItems.push({ name: 'General Diagnostic', code: 'GEN', sampleTypeRaw: 'Blood' });
    }

    const groupMap = new Map<string, {
      sampleType: string;
      container: string;
      color: string;
      prefix: string;
      tests: { code: string; name: string }[];
    }>();

    rawTestItems.forEach((item) => {
      const details = inferSampleDetails(item.sampleTypeRaw, item.name, item.code);
      const existing = groupMap.get(details.sampleType);
      if (existing) {
        if (!existing.tests.some(t => t.code === item.code)) {
          existing.tests.push({ code: item.code, name: item.name });
        }
      } else {
        groupMap.set(details.sampleType, {
          sampleType: details.sampleType,
          container: details.container,
          color: details.color,
          prefix: details.prefix,
          tests: [{ code: item.code, name: item.name }],
        });
      }
    });

    const groupsArr = Array.from(groupMap.values());

    return groupsArr.map((g, idx) => {
      const barcodeValue = groupsArr.length > 1
        ? `${baseSampleId}-${g.prefix}${idx + 1}`
        : baseSampleId;

      return {
        id: `sample-group-${idx}`,
        sampleType: g.sampleType,
        containerInfo: g.container,
        badgeColor: g.color,
        barcodeValue,
        tests: g.tests,
        testCodesStr: g.tests.map(t => t.code).join(', '),
      };
    });
  }, [report, masterTests]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [isOpen, report]);

  if (!isOpen || !report) return null;

  const patientName = report.patient_name || 'N/A';
  const collectionDate = report.created_at
    ? new Date(report.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    : new Date().toLocaleDateString('en-GB');

  const activeGroup = sampleGroups[selectedIndex] || sampleGroups[0];

  const handlePrint = (singleGroup?: SampleGroup) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printableGroups = singleGroup ? [singleGroup] : sampleGroups;

    const labelsHtml = printableGroups.map((g) => `
      <div class="label-page">
        <div class="patient-name">${patientName}</div>
        <div class="barcode-svg-container">
          <svg class="barcode-element" data-value="${g.barcodeValue}"></svg>
          <div class="barcode-text">ID: ${g.barcodeValue}</div>
        </div>
        <div class="meta-row">
          <span class="sample-type-tag">[${g.sampleType.toUpperCase()}]</span>
          <span class="test-tag">${g.testCodesStr}</span>
          <span class="collection-date">${collectionDate}</span>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Tube Barcode - ${patientName}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
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
              padding: 2mm 3mm;
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
              padding-bottom: 1px;
            }
            .barcode-svg-container {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              margin: 1px 0;
              height: 11mm;
            }
            .barcode-element {
              max-height: 7.5mm;
              width: auto;
            }
            .barcode-text {
              font-size: 7.5px;
              font-weight: bold;
              margin-top: 1px;
            }
            .meta-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-size: 6.5px;
              font-weight: bold;
              border-top: 0.5px solid #eee;
              padding-top: 1px;
              min-height: 8px;
              gap: 2px;
            }
            .sample-type-tag {
              font-weight: 900;
              white-space: nowrap;
              color: #000;
              margin-right: 2px;
            }
            .test-tag {
              font-size: 6.5px;
              font-weight: 800;
              text-transform: uppercase;
              word-break: break-word;
              flex: 1;
              display: -webkit-box;
              -webkit-line-clamp: 1;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .collection-date {
              white-space: nowrap;
              flex-shrink: 0;
              font-size: 6.5px;
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>
            window.onload = function() {
              var elements = document.querySelectorAll('.barcode-element');
              elements.forEach(function(el) {
                var val = el.getAttribute('data-value');
                if (val) {
                  try {
                    JsBarcode(el, val, {
                      format: 'CODE128',
                      width: 1.2,
                      height: 22,
                      displayValue: false,
                      margin: 0
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }
              });
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 600);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Beaker className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Print Tube Barcode</h3>
              <p className="text-[11px] text-muted-foreground">
                Patient: <span className="font-semibold text-foreground">{patientName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 space-y-4 overflow-y-auto bg-slate-50/60 dark:bg-slate-950/60">
          {/* Label Preview Card */}
          {activeGroup && (
            <div className="flex flex-col items-center justify-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Sticker Preview ({activeGroup.sampleType})
              </div>

              <div className="w-[270px] h-[135px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg shadow-md p-3 flex flex-col justify-between select-none">
                <div className="text-[10px] font-extrabold uppercase truncate border-b border-slate-200 dark:border-slate-800 pb-1 flex justify-between items-center">
                  <span className="truncate">{patientName}</span>
                  <span className="text-[8px] font-bold text-primary bg-primary/10 px-1 rounded">
                    {activeGroup.sampleType.toUpperCase()}
                  </span>
                </div>

                <div className="py-1">
                  <LabelBarcode value={activeGroup.barcodeValue} />
                </div>

                <div className="flex justify-between items-end text-[9px] font-bold pt-1 border-t border-slate-200 dark:border-slate-800 w-full gap-1.5">
                  <span className="text-slate-900 dark:text-slate-100 font-extrabold uppercase truncate flex-1 text-left">
                    {activeGroup.testCodesStr}
                  </span>
                  <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                    {collectionDate}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Clean List of Tubes if > 1 */}
          {sampleGroups.length > 1 && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Required Specimen Tubes ({sampleGroups.length})
              </span>

              <div className="space-y-1.5">
                {sampleGroups.map((g, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={g.id}
                      onClick={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-xs'
                          : 'border-border bg-card hover:bg-accent/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${g.badgeColor}`}>
                          {g.sampleType}
                        </span>
                        <div className="text-xs font-medium text-foreground">
                          {g.testCodesStr}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-primary">
                          {g.barcodeValue}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(g);
                          }}
                          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                          title="Print this label only"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-3 border-t border-border bg-card flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-border text-xs rounded-lg hover:bg-accent text-foreground transition-colors font-medium"
          >
            Close
          </button>

          <button
            onClick={() => handlePrint()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/95 transition-colors font-bold shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{sampleGroups.length > 1 ? `Print All Labels (${sampleGroups.length})` : 'Print Tube Label'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
