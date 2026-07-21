import { X, FileText, IndianRupee } from 'lucide-react';

interface BillingOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: 'bill' | 'receipt') => void;
  patientName?: string;
  sampleCode?: string;
}

export function BillingOptionModal({ isOpen, onClose, onSelect, patientName, sampleCode }: BillingOptionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative z-55"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Select Billing Option
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient Bar */}
        {patientName && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Patient: <strong className="text-slate-700 dark:text-slate-300">{patientName}</strong></span>
            {sampleCode && <span className="ml-3">Sample: <strong className="text-slate-700 dark:text-slate-300">{sampleCode}</strong></span>}
          </div>
        )}

        {/* Body Choices */}
        <div className="p-5 space-y-3">
          {/* Bill Choice */}
          <button
            onClick={() => onSelect('bill')}
            className="w-full text-left p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/10 transition-all flex items-start gap-4 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Generate Invoice / Bill
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                Detailed billing with test-wise pricing, discount details, payment history tracking, and full A4 print layout.
              </p>
            </div>
          </button>

          {/* Receipt Choice */}
          <button
            onClick={() => onSelect('receipt')}
            className="w-full text-left p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/10 transition-all flex items-start gap-4 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Generate Custom Receipt
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                Simplified landscape half-A4 receipt with custom total paid amount and test checkboxes (displays test names only).
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
