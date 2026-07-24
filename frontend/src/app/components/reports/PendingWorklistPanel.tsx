import { useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import type { Report } from '../../../types';
import { getReportTestStatuses } from '../../../pages/reports/reportStatus';

interface PendingWorklistPanelProps {
  /** Branch report list (the panel filters to reports that still need entry/approval). */
  reports: Report[];
  /** Report currently open in the entry screen (highlighted). */
  currentReportId?: string;
  /** Invoked when the user picks another report from the worklist. */
  onSelectReport: (id: string) => void;
  /** "Back to Reports" button handler. */
  onBack: () => void;
}

/**
 * Left worklist panel for the report-entry screen: branch-wide pending reports
 * grouped by creation date, searchable, with per-report progress badges.
 * Shared between the desktop sidebar and the mobile drawer.
 */
export function PendingWorklistPanel({ reports, currentReportId, onSelectReport, onBack }: PendingWorklistPanelProps) {
  const [search, setSearch] = useState('');

  // Reports that are not fully approved, grouped by creation date (newest first).
  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = reports
      .filter((r) => {
        const st = getReportTestStatuses(r);
        return st.hasPending || st.hasReview; // still needs entry/approval
      })
      .filter((r) => {
        if (!term) return true;
        return (
          (r.patient_name || '').toLowerCase().includes(term) ||
          (r.sample_id_code || '').toLowerCase().includes(term) ||
          (r.report_type || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const out: { key: string; dateLabel: string; reports: Report[] }[] = [];
    const byKey = new Map<string, { key: string; dateLabel: string; reports: Report[] }>();
    for (const r of items) {
      const d = r.created_at ? new Date(r.created_at) : new Date();
      const key = d.toDateString();
      let g = byKey.get(key);
      if (!g) {
        g = {
          key,
          dateLabel: d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
          reports: [],
        };
        byKey.set(key, g);
        out.push(g);
      }
      g.reports.push(r);
    }
    return out;
  }, [reports, search]);

  const totalCount = groups.reduce((n, g) => n + g.reports.length, 0);

  return (
    <>
      {/* Back to Reports button at top of sidebar */}
      <button
        type="button"
        onClick={onBack}
        className="w-full flex items-center gap-2 px-2.5 py-2 mb-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex-shrink-0"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500" />
        <span>Back to Reports</span>
      </button>

      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">Pending Reports</h3>
        <span className="text-[10px] font-semibold text-slate-400">{totalCount}</span>
      </div>
      <div className="relative mb-2 flex-shrink-0">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patient / sample..."
          className="w-full h-8 pl-7 pr-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3">
        {groups.length === 0 && (
          <p className="text-xs text-muted-foreground p-2 italic text-center">No pending reports</p>
        )}
        {groups.map((group) => (
          <div key={group.key}>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1 mb-1">
              {group.dateLabel} ({group.reports.length})
            </div>
            <div className="space-y-1">
              {group.reports.map((r) => {
                const st = getReportTestStatuses(r);
                const isCurrent = r.id === currentReportId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelectReport(r.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {r.patient_name || 'Unknown'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 flex-shrink-0">{r.sample_id_code || ''}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {r.report_type || 'Test'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {st.approvedTestIds.length}/{st.testIds.length} done
                      </span>
                      {st.hasReview && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          In review
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
