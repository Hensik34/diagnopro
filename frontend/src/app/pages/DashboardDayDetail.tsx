import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import {
  ArrowLeft,
  Users,
  IndianRupee,
  FileText,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useReportStore } from '../../stores/reportStore';
import type { Report } from '../../types';

/* ══════════════════════════════════════════════════════════════════════════════ */

export function DashboardDayDetail() {
  const { date } = useParams<{ date: string }>();
  const { reports, fetchReports, isLoading } = useReportStore();

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* ── Filter reports for selected date ── */
  const dayReports = useMemo(() => {
    if (!date) return [];
    return reports.filter(r => {
      const reportDate = format(new Date(r.created_at), 'yyyy-MM-dd');
      return reportDate === date;
    });
  }, [reports, date]);

  /* ── Aggregates ── */
  const stats = useMemo(() => {
    const uniquePatients = new Set(dayReports.map(r => r.patient_id));
    let revenue = 0;
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    const doctorMap: Record<string, { name: string; reports: number; revenue: number; patients: Set<string> }> = {};

    for (const r of dayReports) {
      revenue += Number(r.report_amount) || 0;
      if (r.status === 'approved' || r.status === 'completed') approved++;
      if (r.status === 'draft' || r.status === 'under_review') pending++;
      if (r.status === 'rejected') rejected++;

      const docKey = r.doctor_id || '_self';
      const docName =
        r.doctor_name
          ? `${r.doctor_title || 'Dr'}. ${r.doctor_name}`
          : r.doctor_firstname && r.doctor_lastname
          ? `Dr. ${r.doctor_firstname} ${r.doctor_lastname}`
          : 'Self / Walk-in';
      if (!doctorMap[docKey]) {
        doctorMap[docKey] = { name: docName, reports: 0, revenue: 0, patients: new Set() };
      }
      doctorMap[docKey].reports++;
      doctorMap[docKey].revenue += Number(r.report_amount) || 0;
      doctorMap[docKey].patients.add(r.patient_id);
    }

    const doctors = Object.values(doctorMap)
      .map(d => ({ ...d, patients: d.patients.size }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      patients: uniquePatients.size,
      reports: dayReports.length,
      revenue,
      approved,
      pending,
      rejected,
      doctors,
    };
  }, [dayReports]);

  const dateLabel = date ? format(parseISO(date), 'EEEE, MMMM d, yyyy') : '';

  /* ── Loading ── */
  if (isLoading && dayReports.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
        <div className="bg-card border border-border rounded p-8 flex items-center justify-center">
          <div className="animate-pulse space-y-3 w-full max-w-md">
            <div className="h-4 bg-secondary rounded w-48" />
            <div className="h-8 bg-secondary rounded w-32" />
            <div className="h-3 bg-secondary rounded w-64" />
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-foreground text-lg mb-0.5 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            {dateLabel}
          </h1>
          <p className="text-muted-foreground text-xs">
            Daily summary &amp; breakdown for this date
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Patients', value: stats.patients, icon: Users, color: 'var(--primary)' },
          { label: 'Reports', value: stats.reports, icon: FileText, color: 'var(--info)' },
          { label: 'Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'var(--success)' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'var(--success)' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'var(--warning)' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded p-3 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${s.color} 12%, transparent)` }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-foreground text-lg font-medium leading-none tabular-nums">{s.value}</div>
                <div className="text-muted-foreground text-[10px] mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Doctor Breakdown ── */}
      {stats.doctors.length > 0 && (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <h3 className="text-foreground text-sm font-medium flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-muted-foreground" />
              Doctor-wise Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
                    Doctor
                  </th>
                  <th className="px-4 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
                    Patients
                  </th>
                  <th className="px-4 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
                    Reports
                  </th>
                  <th className="px-4 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.doctors.map((doc, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-2.5 text-foreground text-xs">{doc.name}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">{doc.patients}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">{doc.reports}</td>
                    <td className="px-4 py-2.5 text-right text-foreground font-medium tabular-nums">
                      ₹{doc.revenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Reports List ── */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <h3 className="text-foreground text-sm font-medium flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Reports ({dayReports.length})
          </h3>
        </div>

        {dayReports.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No reports on this date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
                    Patient
                  </th>
                  <th className="px-4 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
                    Test
                  </th>
                  <th className="px-4 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
                    Doctor
                  </th>
                  <th className="px-4 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
                    Time
                  </th>
                  <th className="px-4 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {dayReports.map(r => {
                  const st = getStatusStyle(r.status);
                  return (
                    <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-2.5 text-foreground">{r.patient_name || 'Unknown'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.report_type || 'Test'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {r.doctor_name ? `${r.doctor_title || 'Dr'}. ${r.doctor_name}` : r.doctor_firstname ? `Dr. ${r.doctor_firstname} ${r.doctor_lastname}` : 'Self'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                        {format(new Date(r.created_at), 'hh:mm a')}
                      </td>
                      <td className="px-4 py-2.5 text-right text-foreground font-medium tabular-nums">
                        {r.report_amount ? `₹${Number(r.report_amount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium"
                          style={{ backgroundColor: st.bg, color: st.fg }}
                        >
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Status style helper ── */
function getStatusStyle(status: string) {
  switch (status) {
    case 'approved':
    case 'completed':
      return { bg: 'color-mix(in srgb, var(--success) 12%, transparent)', fg: 'var(--success)' };
    case 'draft':
      return { bg: 'color-mix(in srgb, var(--muted-foreground) 12%, transparent)', fg: 'var(--muted-foreground)' };
    case 'under_review':
      return { bg: 'color-mix(in srgb, var(--warning) 12%, transparent)', fg: 'var(--warning-foreground)' };
    case 'rejected':
      return { bg: 'color-mix(in srgb, var(--destructive) 12%, transparent)', fg: 'var(--destructive)' };
    default:
      return { bg: 'color-mix(in srgb, var(--info) 12%, transparent)', fg: 'var(--info)' };
  }
}
