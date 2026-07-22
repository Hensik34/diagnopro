import { useState, useMemo } from 'react';
import { X, Check, Clock, Beaker, Printer } from 'lucide-react';
import { useTestStore } from '../../../stores/testStore';
import type { Report } from '../../../types';

interface SampleReceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
  onConfirmReception: (status: 'received' | 'partial' | 'pending') => Promise<void> | void;
  onOpenBarcodes: () => void;
}

export function SampleReceptionModal({
  isOpen,
  onClose,
  report,
  onConfirmReception,
  onOpenBarcodes,
}: SampleReceptionModalProps) {
  const { tests: masterTests } = useTestStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract test items & required samples for the report
  const sampleItems = useMemo(() => {
    if (!report) return [];

    const rawTestItems: { name: string; code: string; sampleTypeRaw?: string }[] = [];

    if (report.pricing_snapshot && report.pricing_snapshot.length > 0) {
      report.pricing_snapshot.forEach((item) => {
        if (item.test_name || item.test_code) {
          const master = masterTests.find(t => t.id === item.test_id || t.test_name.toLowerCase() === (item.test_name || '').toLowerCase());
          rawTestItems.push({
            name: item.test_name || master?.test_name || 'Test',
            code: (item.test_code || master?.test_code || item.test_name || 'TEST').toUpperCase(),
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
          code: (master?.test_code || t.testName || 'TEST').toUpperCase(),
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
          code: (master?.test_code || name).toUpperCase(),
          sampleTypeRaw: master?.sample_type,
        });
      });
    }

    const categoryMap = new Map<string, { sampleType: string; tests: string[]; container: string }>();

    rawTestItems.forEach((item) => {
      const nameLower = item.name.toLowerCase();
      const rawLower = (item.sampleTypeRaw || '').toLowerCase();

      let sampleType = 'EDTA Blood';
      let container = 'Lavender Tube';

      if (rawLower.includes('urine') || nameLower.includes('urine')) {
        sampleType = 'Urine';
        container = 'Sterile Container';
      } else if (rawLower.includes('stool') || nameLower.includes('stool') || nameLower.includes('feces')) {
        sampleType = 'Stool';
        container = 'Stool Container';
      } else if (rawLower.includes('fluoride') || nameLower.includes('fbs') || nameLower.includes('ppbs') || nameLower.includes('glucose')) {
        sampleType = 'Fluoride Blood';
        container = 'Grey Tube';
      } else if (rawLower.includes('serum') || nameLower.includes('crp') || nameLower.includes('lft') || nameLower.includes('kft') || nameLower.includes('lipid') || nameLower.includes('thyroid')) {
        sampleType = 'Serum';
        container = 'Red/Yellow Tube';
      }

      const key = `${item.name} (${sampleType})`;
      categoryMap.set(key, { sampleType, tests: [item.name], container });
    });

    if (categoryMap.size === 0) {
      categoryMap.set('General Specimen', { sampleType: 'Blood', tests: ['Diagnostic Test'], container: 'Specimen Tube' });
    }

    return Array.from(categoryMap.entries()).map(([key, value]) => ({
      id: key,
      testName: value.tests.join(', '),
      sampleType: value.sampleType,
      container: value.container,
    }));
  }, [report, masterTests]);

  // Reception state per item: boolean (true = received, false = pending)
  const [receptionStates, setReceptionStates] = useState<Record<string, boolean>>({});

  const handleToggleItem = (id: string) => {
    setReceptionStates(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false,
    }));
  };

  const computeFinalStatus = (): 'received' | 'partial' | 'pending' => {
    if (sampleItems.length === 0) return 'received';
    const receivedCount = sampleItems.filter(item => receptionStates[item.id] !== false).length;
    if (receivedCount === sampleItems.length) return 'received';
    if (receivedCount > 0) return 'partial';
    return 'pending';
  };

  const handleSave = async (printBarcode: boolean) => {
    setIsSubmitting(true);
    try {
      const finalStatus = computeFinalStatus();
      await onConfirmReception(finalStatus);
      onClose();
      if (printBarcode && finalStatus !== 'pending') {
        onOpenBarcodes();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !report) return null;

  const patientName = report.patient_name || 'N/A';
  const sampleId = report.sample_id_code || '1001';

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
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Beaker className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Sample Arrival Check</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Patient: <span className="font-semibold text-foreground">{patientName}</span> • Sample ID: <span className="font-mono font-bold text-primary">{sampleId}</span>
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

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Tests & Required Samples ({sampleItems.length})
          </div>

          {/* Simple List of Tests */}
          <div className="space-y-2">
            {sampleItems.map((item) => {
              const isReceived = receptionStates[item.id] !== false;
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleItem(item.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    isReceived
                      ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                      : 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {item.testName}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                      Sample: <span className="font-semibold text-foreground">{item.sampleType}</span> ({item.container})
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleItem(item.id);
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0 ${
                      isReceived
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                        : 'bg-amber-500 text-white hover:bg-amber-600 shadow-xs'
                    }`}
                  >
                    {isReceived ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        Received
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        Pending
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-border bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-3.5 py-2 border border-border text-xs rounded-lg hover:bg-accent text-foreground transition-colors font-medium text-center"
          >
            Save Status Only
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/95 transition-colors font-bold shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Confirm & Print Barcodes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
