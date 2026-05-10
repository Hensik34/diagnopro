import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  IndianRupee,
  FileText,
} from 'lucide-react';
import type { Report } from '../../../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface DashboardCalendarProps {
  reports: Report[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function groupReportsByDate(reports: Report[]): Map<string, Report[]> {
  const map = new Map<string, Report[]>();
  for (const r of reports) {
    const key = format(new Date(r.created_at), 'yyyy-MM-dd');
    const arr = map.get(key) || [];
    arr.push(r);
    map.set(key, arr);
  }
  return map;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  COMPONENT
 * ══════════════════════════════════════════════════════════════════════════ */
export function DashboardCalendar({ reports, selectedMonth, onMonthChange }: DashboardCalendarProps) {
  const navigate = useNavigate();

  const reportsByDate = useMemo(() => groupReportsByDate(reports), [reports]);

  /* ── Calendar grid ── */
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [selectedMonth]);

  /* ── Month totals ── */
  const monthTotals = useMemo(() => {
    let rev = 0, reps = 0;
    const allPats = new Set<string>();
    for (const day of calendarDays) {
      if (!isSameMonth(day, selectedMonth)) continue;
      const key = format(day, 'yyyy-MM-dd');
      const dayReports = reportsByDate.get(key) || [];
      reps += dayReports.length;
      for (const r of dayReports) {
        rev += Number(r.report_amount) || 0;
        allPats.add(r.patient_id);
      }
    }
    return { patients: allPats.size, revenue: rev, reports: reps };
  }, [calendarDays, selectedMonth, reportsByDate]);

  const handleDayClick = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    navigate(`/dashboard/${key}`);
  };

  const prevMonth = () => onMonthChange(subMonths(selectedMonth, 1));
  const nextMonth = () => onMonthChange(addMonths(selectedMonth, 1));
  const goToday = () => onMonthChange(new Date());

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  /* ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      {/* ── Calendar Header ── */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-foreground text-sm font-medium">
            {format(selectedMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={goToday}
              className="px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Mini month totals */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {monthTotals.patients} patients
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {monthTotals.reports} reports
          </span>
          <span className="flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5" />
            {monthTotals.revenue.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* ── Week day headers ── */}
      <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
        {weekDays.map(d => (
          <div
            key={d}
            className="px-2 py-1.5 text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar Grid ── */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayReports = reportsByDate.get(key) || [];
          const inMonth = isSameMonth(day, selectedMonth);
          const today = isToday(day);
          const hasData = dayReports.length > 0;

          const patCount = hasData ? new Set(dayReports.map(r => r.patient_id)).size : 0;
          const dayRev = hasData ? dayReports.reduce((s, r) => s + (Number(r.report_amount) || 0), 0) : 0;

          return (
            <button
              key={idx}
              onClick={() => inMonth && handleDayClick(day)}
              disabled={!inMonth}
              className={`
                relative min-h-[82px] p-1.5 border-b border-r border-border text-left transition-colors
                ${!inMonth ? 'bg-secondary/20 opacity-40 cursor-default' : 'hover:bg-accent/40 cursor-pointer'}
                ${today ? 'bg-accent/30' : ''}
              `}
            >
              {/* Date number */}
              <span
                className={`
                  inline-flex items-center justify-center w-6 h-6 text-xs rounded-full
                  ${today ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground'}
                `}
              >
                {format(day, 'd')}
              </span>

              {/* Day stats */}
              {hasData && inMonth && (
                <div className="mt-1 space-y-0.5">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="w-3 h-3 shrink-0" />
                    <span className="truncate">{patCount} pt</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <FileText className="w-3 h-3 shrink-0" />
                    <span className="truncate">{dayReports.length}</span>
                  </div>
                  {dayRev > 0 && (
                    <div className="flex items-center gap-0.5 text-[10px] font-medium text-success">
                      <IndianRupee className="w-3 h-3 shrink-0" />
                      <span className="truncate">{dayRev.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
