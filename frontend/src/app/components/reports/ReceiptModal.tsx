import { useEffect, useState, useMemo, useCallback } from 'react';
import { Loader2, AlertCircle, Printer, X, FileText, CheckSquare, Square } from 'lucide-react';
import { useReportStore } from '../../../stores/reportStore';
import { reportApi } from '../../../api';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
}

export function ReceiptModal({ isOpen, onClose, reportId }: ReceiptModalProps) {
  const { selectedReport, fetchReportById, isLoading: reportLoading, error: reportError } = useReportStore();

  useEffect(() => {
    if (isOpen && reportId) {
      fetchReportById(reportId);
    }
  }, [isOpen, reportId, fetchReportById]);

  const report = useMemo(() => selectedReport?.id === reportId ? selectedReport : null, [selectedReport, reportId]);

  // Extract test items
  const tests = useMemo(() => {
    if (!report) return [];
    if (report.pricing_snapshot && report.pricing_snapshot.length > 0) {
      return report.pricing_snapshot.map((t: any) => ({
        id: t.test_id || t.package_id || t.test_name || String(Math.random()),
        name: t.test_name || t.package_name || 'Unnamed test',
      }));
    }
    if (report.report_type) {
      return report.report_type.split(',').map((name: string) => ({
        id: name.trim(),
        name: name.trim(),
      }));
    }
    return [];
  }, [report]);

  // Local state for checkboxes, custom amount & persistence
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isPersistedLoading, setIsPersistedLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state and load from DB
  useEffect(() => {
    if (isOpen && report && tests.length > 0) {
      setIsPersistedLoading(true);
      reportApi.getReceipt(reportId)
        .then((res) => {
          if (res.data) {
            setCustomAmount(String(res.data.custom_amount));
            if (res.data.selected_tests) {
              const savedNames = res.data.selected_tests.split(',').map((n: string) => n.trim());
              const matchingIds = tests
                .filter(t => savedNames.includes(t.name))
                .map(t => t.id);
              setSelectedTests(matchingIds);
            } else {
              setSelectedTests([]);
            }
          } else {
            // Default pre-fill
            setCustomAmount(String(report.final_amount ?? report.report_amount ?? 0));
            setSelectedTests(tests.map(t => t.id));
          }
        })
        .catch((err) => {
          console.error("Failed to load persisted receipt:", err);
          // Fallback defaults
          setCustomAmount(String(report.final_amount ?? report.report_amount ?? 0));
          setSelectedTests(tests.map(t => t.id));
        })
        .finally(() => {
          setIsPersistedLoading(false);
        });
    }
  }, [isOpen, report, reportId, tests]);

  const handleToggleTest = (id: string) => {
    setSelectedTests(prev =>
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedTests(tests.map(t => t.id));
  };

  const handleSelectNone = () => {
    setSelectedTests([]);
  };

  const handlePrint = useCallback(async () => {
    if (!report) return;
    const selectedNames = tests
      .filter(t => selectedTests.includes(t.id))
      .map(t => t.name)
      .join(',');

    setIsSaving(true);
    try {
      // Save receipt to DB first
      await reportApi.saveReceipt(reportId, {
        custom_amount: parseFloat(customAmount) || 0,
        selected_tests: selectedNames,
      });

      // Proceed with print dialog trigger via hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';

      const queryParams = new URLSearchParams({
        tests: selectedNames,
        amount: customAmount || '0',
      });
      iframe.src = `/app/reports/${reportId}/receipt?${queryParams.toString()}`;

      const cleanup = () => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      };

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            iframe.contentWindow?.addEventListener('afterprint', cleanup, { once: true });
            setTimeout(cleanup, 10000);
          } catch {
            cleanup();
            window.open(`/app/reports/${reportId}/receipt?${queryParams.toString()}`, '_blank');
          }
        }, 400);
      };

      document.body.appendChild(iframe);
    } catch (err) {
      console.error("Failed to save receipt before printing:", err);
      alert("Failed to save receipt details. Please check connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }, [report, reportId, tests, selectedTests, customAmount]);

  if (!isOpen) return null;

  const isLoading = reportLoading || isPersistedLoading;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Generate Custom Receipt
              {report?.sample_id_code && (
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-2">
                  {report.sample_id_code}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient Bar */}
        {report && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{report.patient_name || 'Unknown Patient'}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{report.patient_phone || 'No Phone'}</span>
            {report.patient_gender && (
              <>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{report.patient_gender}</span>
              </>
            )}
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {isLoading && !report ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : reportError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
                <p className="text-xs text-red-500 font-medium">{reportError}</p>
              </div>
            </div>
          ) : !report ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-xs text-slate-400">Report not found</p>
            </div>
          ) : (
            <>
              {/* Test Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Select Tests to include
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer border-none bg-transparent"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleSelectNone}
                      className="text-[10px] text-slate-500 dark:text-slate-400 hover:underline font-semibold cursor-pointer border-none bg-transparent"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-lg max-h-[160px] overflow-y-auto p-2 bg-slate-50/50 dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-slate-800/80">
                  {tests.map((test) => {
                    const isSelected = selectedTests.includes(test.id);
                    return (
                      <div
                        key={test.id}
                        onClick={() => handleToggleTest(test.id)}
                        className="flex items-center gap-2.5 py-1.5 px-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <span className="text-xs text-slate-700 dark:text-slate-300 select-none truncate">
                          {test.name}
                        </span>
                      </div>
                    );
                  })}
                  {tests.length === 0 && (
                    <p className="text-xs text-slate-400 py-3 text-center">No tests available in this report.</p>
                  )}
                </div>
              </div>

              {/* Custom Amount input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Total Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customAmount}
                  disabled={isSaving}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter total receipt amount"
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-shadow disabled:opacity-50"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {report && (
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-end">
            <button
              onClick={handlePrint}
              disabled={selectedTests.length === 0 || isSaving}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all text-xs font-bold text-white cursor-pointer shadow-sm shadow-amber-500/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
