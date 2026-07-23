import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  X,
  Loader2,
  History as HistoryIcon,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { Report } from "../../../types";

// ==========================================
// Patient Test History panel
// ==========================================
// Groups a patient's past reports by test. A test done only once just gets a
// one-line "when + status" entry. A test that repeats (e.g. Sugar on the 1st,
// 11th, 21st, 31st) additionally gets a per-parameter trend row: a small
// inline sparkline (not a full chart) plus the latest value and its delta
// from the previous reading. Trend rows are gated to lab techs/admins —
// everyone else still sees the plain occurrence list.

interface TrendPoint {
  reportId: string;
  date: string;
  rawValue: string;
  numericValue: number | null;
  unit?: string;
  referenceRange?: string;
}

interface TestHistoryGroup {
  key: string;
  testName: string;
  occurrences: { reportId: string; date: string; status: string }[];
  parameters: Map<string, TrendPoint[]>;
}

type FlagStatus = "low" | "high" | "normal" | undefined;

function parseRange(rangeStr?: string): { low: number | null; high: number | null } {
  if (!rangeStr) return { low: null, high: null };
  const cleaned = rangeStr.replace(/\s+/g, "").replace(/–/g, "-").replace(/—/g, "-");

  if (cleaned.startsWith("<")) {
    const v = parseFloat(cleaned.slice(1));
    return { low: null, high: Number.isFinite(v) ? v : null };
  }
  if (cleaned.startsWith(">")) {
    const v = parseFloat(cleaned.slice(1));
    return { low: Number.isFinite(v) ? v : null, high: null };
  }
  const parts = cleaned.split("-");
  if (parts.length === 2) {
    const low = parseFloat(parts[0]);
    const high = parseFloat(parts[1]);
    return { low: Number.isFinite(low) ? low : null, high: Number.isFinite(high) ? high : null };
  }
  return { low: null, high: null };
}

function flagFor(point: TrendPoint): FlagStatus {
  if (point.numericValue == null) return undefined;
  const { low, high } = parseRange(point.referenceRange);
  if (low == null && high == null) return undefined;
  if (low != null && point.numericValue < low) return "low";
  if (high != null && point.numericValue > high) return "high";
  return "normal";
}

function flagColor(flag: FlagStatus): string {
  if (flag === "high") return "var(--destructive)";
  if (flag === "low") return "var(--info)";
  if (flag === "normal") return "var(--success)";
  return "var(--muted-foreground)";
}

/**
 * Compact inline trend cue for a single parameter — deliberately small
 * (fits in a table row), not a full chart. Dots are colored by whether that
 * reading was low/high/normal against the reference range stored with it.
 */
function Sparkline({ points, width = 84, height = 26 }: { points: { value: number; flag: FlagStatus }[]; width?: number; height?: number }) {
  if (points.length === 0) return null;

  if (points.length === 1) {
    return (
      <svg width={width} height={height} className="flex-shrink-0">
        <circle cx={width / 2} cy={height / 2} r={3} fill={flagColor(points[0].flag)} />
      </svg>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const padY = 5;
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: height - padY - ((p.value - min) / span) * (height - padY * 2),
    flag: p.flag,
  }));

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");

  return (
    <svg width={width} height={height} className="flex-shrink-0 overflow-visible">
      <path d={path} fill="none" stroke="var(--muted-foreground)" strokeOpacity={0.4} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 2.75 : 1.5} fill={flagColor(c.flag)} />
      ))}
    </svg>
  );
}

function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    approved: "bg-success/15 text-success",
    completed: "bg-success/15 text-success",
    under_review: "bg-info/15 text-info",
    rejected: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold flex-shrink-0 ${cfg[status] || "bg-warning/15 text-warning"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function buildHistoryGroups(reports: Report[]): TestHistoryGroup[] {
  const groups = new Map<string, TestHistoryGroup>();

  for (const rep of reports) {
    if (!rep.created_at) continue;
    let td: any = rep.test_data;
    if (typeof td === "string") {
      try {
        td = JSON.parse(td);
      } catch {
        td = null;
      }
    }
    if (!td) continue;

    const testList: any[] = td.tests?.length
      ? td.tests
      : td.parameters?.length
        ? [{ testId: undefined, testName: rep.report_type || "General Test", parameters: td.parameters }]
        : [];

    for (const t of testList) {
      const testName = t.testName || rep.report_type || "Test";
      const key = (t.testId || testName).toString().toLowerCase().trim();

      let group = groups.get(key);
      if (!group) {
        group = { key, testName, occurrences: [], parameters: new Map() };
        groups.set(key, group);
      }
      group.occurrences.push({ reportId: rep.id, date: rep.created_at, status: rep.status });

      for (const p of t.parameters || []) {
        if (p.value === null || p.value === undefined || p.value === "") continue;
        const num = typeof p.value === "number" ? p.value : parseFloat(p.value);
        const list = group.parameters.get(p.name) || [];
        list.push({
          reportId: rep.id,
          date: rep.created_at,
          rawValue: String(p.value),
          numericValue: Number.isFinite(num) ? num : null,
          unit: p.unit,
          referenceRange: p.referenceRange,
        });
        group.parameters.set(p.name, list);
      }
    }
  }

  const result = Array.from(groups.values());
  for (const g of result) {
    g.occurrences.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const list of g.parameters.values()) {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  }

  // Most-repeated tests first — that's where the trend signal actually is
  return result.sort((a, b) => b.occurrences.length - a.occurrences.length);
}

interface HistoryTrendPanelProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  reports: Report[];
  patientName?: string;
  /** Trend graphs are a lab-tech/admin tool; everyone else sees plain occurrence lists. */
  canViewTrends: boolean;
}

export function HistoryTrendPanel({ isOpen, onClose, loading, reports, patientName, canViewTrends }: HistoryTrendPanelProps) {
  const groups = useMemo(() => buildHistoryGroups(reports), [reports]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Auto-expand repeated tests by default — that's the useful signal; keep singletons collapsed.
  useEffect(() => {
    setExpandedKeys(new Set(groups.filter((g) => g.occurrences.length > 1).map((g) => g.key)));
  }, [groups]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-150" onClick={onClose} />
      <div className="relative h-full w-full sm:max-w-md md:max-w-lg bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">Patient Test History</h3>
            {patientName && <p className="text-[10px] text-muted-foreground truncate">{patientName}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
              <span className="text-xs text-muted-foreground">Loading history...</span>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <HistoryIcon className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <p className="text-xs text-muted-foreground">No previous reports found for this patient.</p>
            </div>
          ) : (
            <>
              {!canViewTrends && groups.some((g) => g.occurrences.length > 1) && (
                <p className="text-[10px] text-slate-400 px-1 pb-1">
                  Trend graphs for repeated tests are visible to lab technicians and admins.
                </p>
              )}
              {groups.map((group) => {
                const expanded = expandedKeys.has(group.key);
                const isRepeat = group.occurrences.length > 1;
                const showTrend = isRepeat && canViewTrends;
                const lastOccurrence = group.occurrences[group.occurrences.length - 1];

                return (
                  <div key={group.key} className="border border-border rounded-lg overflow-hidden bg-background">
                    <button
                      type="button"
                      onClick={() => toggle(group.key)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{group.testName}</span>
                        {isRepeat && (
                          <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex-shrink-0 whitespace-nowrap">
                            {group.occurrences.length}× repeated
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] text-slate-400 whitespace-nowrap hidden sm:inline">
                          {format(new Date(lastOccurrence.date), "dd MMM yyyy")}
                        </span>
                        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-3 py-1.5 border-t border-border divide-y divide-slate-100 dark:divide-slate-800/60">
                        {showTrend
                          ? Array.from(group.parameters.entries()).map(([paramName, points]) => {
                              const numericPoints = points.filter((p) => p.numericValue != null);
                              const isTrendable = numericPoints.length >= 2;
                              const last = points[points.length - 1];
                              const prev = points.length > 1 ? points[points.length - 2] : undefined;
                              const lastFlag = flagFor(last);

                              let deltaPct: number | null = null;
                              if (isTrendable && prev && prev.numericValue != null && last.numericValue != null && prev.numericValue !== 0) {
                                deltaPct = ((last.numericValue - prev.numericValue) / Math.abs(prev.numericValue)) * 100;
                              }

                              return (
                                <div key={paramName} className="flex items-center gap-2.5 py-1.5">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{paramName}</p>
                                    <p className="text-[9px] text-slate-400 truncate">
                                      {points.length} reading{points.length > 1 ? "s" : ""} · {format(new Date(points[0].date), "dd MMM")} → {format(new Date(last.date), "dd MMM yyyy")}
                                    </p>
                                  </div>

                                  {isTrendable ? (
                                    <Sparkline points={numericPoints.map((p) => ({ value: p.numericValue as number, flag: flagFor(p) }))} />
                                  ) : (
                                    <p className="text-[10px] text-slate-400 max-w-[110px] truncate flex-shrink-0" title={points.map((p) => p.rawValue).join(" → ")}>
                                      {points.map((p) => p.rawValue).join(" → ")}
                                    </p>
                                  )}

                                  <div className="text-right flex-shrink-0 w-[64px]">
                                    <p className="text-xs font-bold" style={{ color: flagColor(lastFlag) }}>
                                      {last.rawValue}
                                      {last.unit ? ` ${last.unit}` : ""}
                                    </p>
                                    {deltaPct != null && Math.abs(deltaPct) >= 1 && (
                                      <p className="text-[9px] font-semibold flex items-center justify-end gap-0.5" style={{ color: deltaPct > 0 ? "var(--destructive)" : "var(--info)" }}>
                                        {deltaPct > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                        {Math.abs(deltaPct).toFixed(0)}%
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          : group.occurrences
                              .slice()
                              .reverse()
                              .map((o) => (
                                <div key={o.reportId} className="flex items-center justify-between gap-2 py-1.5 text-[11px]">
                                  <span className="text-slate-500 dark:text-slate-400">{format(new Date(o.date), "dd MMM yyyy")}</span>
                                  <StatusChip status={o.status} />
                                  <a
                                    href={`/app/reports/preview/${o.reportId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline flex items-center gap-0.5 flex-shrink-0"
                                  >
                                    View <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
