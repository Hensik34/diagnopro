import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  DollarSign,
  Percent,
  Stethoscope,
  FileText,
  Loader2,
  AlertCircle,
  Printer,
  Calendar,
} from 'lucide-react';
import { doctorApi } from '../../api/doctors';
import { useBranchStore } from '../../stores/branchStore';
import type { Doctor, DoctorStatement, DoctorStatementReport } from '../../types';

// Helper: format date to YYYY-MM-DD
const toDateStr = (d: Date) => d.toISOString().split('T')[0];

// Default to current month range
const now = new Date();
const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

export function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { branches } = useBranchStore();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [statement, setStatement] = useState<DoctorStatement | null>(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(toDateStr(firstOfMonth));
  const [endDate, setEndDate] = useState(toDateStr(lastOfMonth));

  // Fetch doctor on mount
  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoadingDoctor(true);
      try {
        const res = await doctorApi.getById(id);
        setDoctor(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load doctor');
      } finally {
        setIsLoadingDoctor(false);
      }
    })();
  }, [id]);

  // Fetch statement when doctor loads or dates change
  useEffect(() => {
    if (!id || !startDate || !endDate) return;
    fetchStatement();
  }, [id, startDate, endDate]);

  const fetchStatement = async () => {
    if (!id) return;
    setIsLoadingStatement(true);
    try {
      const res = await doctorApi.getStatement(id, startDate, endDate);
      setStatement(res.data);
    } catch {
      setStatement(null);
    } finally {
      setIsLoadingStatement(false);
    }
  };

  const handlePrint = () => {
    if (!doctor) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doctorName = `${doctor.title || 'Dr'}. ${doctor.name}`;
    const periodStr = `${new Date(startDate).toLocaleDateString()} — ${new Date(endDate).toLocaleDateString()}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Doctor Statement - ${doctorName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; font-size: 12px; color: #111; }
            h1 { font-size: 16px; margin-bottom: 4px; }
            .subtitle { color: #666; margin-bottom: 16px; }
            .summary { display: flex; gap: 24px; margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 4px; }
            .summary-item { }
            .summary-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
            .summary-value { font-size: 18px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { background: #f5f5f5; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; border-bottom: 1px solid #ddd; }
            td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
            .text-right { text-align: right; }
            .total-row td { font-weight: 600; border-top: 2px solid #333; }
            .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Doctor Statement</h1>
          <p class="subtitle">${doctorName} • ${doctor.specialization || ''} • Period: ${periodStr}</p>
          <div class="summary">
            <div class="summary-item"><div class="summary-label">Total Reports</div><div class="summary-value">${summary.total_reports}</div></div>
            <div class="summary-item"><div class="summary-label">Total Amount</div><div class="summary-value">₹${summary.total_amount.toFixed(2)}</div></div>
            <div class="summary-item"><div class="summary-label">Amount(${doctor.commission_percentage || 0}%)</div><div class="summary-value">₹${summary.total_commission.toFixed(2)}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>x
                <th>Date</th>
                <th>Patient</th>
                <th>Test Type</th>
                <th>Status</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Sharing</th>
              </tr>
            </thead>
            <tbody>
              ${reports.map((r: DoctorStatementReport, i: number) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${new Date(r.report_date).toLocaleDateString()}</td>
                  <td>${r.patient_name || '—'}</td>
                  <td>${r.report_type || '—'}</td>
                  <td>${r.status}</td>
                  <td class="text-right">₹${Number(r.report_amount || 0).toFixed(2)}</td>
                  <td class="text-right">₹${Number(r.doctor_commission || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5">Total</td>
                <td class="text-right">₹${summary.total_amount.toFixed(2)}</td>
                <td class="text-right">₹${summary.total_commission.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <span>Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span>
            <span>DiagnoPro Management System</span>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const rawSummary = statement?.summary || { total_reports: 0, total_amount: 0, total_commission: 0 };
  const summary = {
    total_reports: Number(rawSummary.total_reports) || 0,
    total_amount: Number(rawSummary.total_amount) || 0,
    total_commission: Number(rawSummary.total_commission) || 0,
  };
  const reports = statement?.reports || [];

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: 'bg-success/10 text-success',
      completed: 'bg-success/10 text-success',
      draft: 'bg-secondary text-muted-foreground',
      under_review: 'bg-warning/10 text-warning',
      rejected: 'bg-destructive/10 text-destructive',
    };
    return map[status] || 'bg-secondary text-muted-foreground';
  };

  if (isLoadingDoctor) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/doctors')} className="h-8 w-8 flex items-center justify-center bg-secondary border border-border rounded hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="bg-destructive/10 border border-destructive/20 rounded p-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive">{error || 'Doctor not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/doctors')}
            className="h-8 w-8 flex items-center justify-center bg-secondary border border-border rounded hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-foreground text-lg mb-0.5">{doctor.title || 'Dr'}. {doctor.name}</h1>
            <p className="text-muted-foreground text-xs">
              {doctor.specialization || 'Doctor'} • {doctor.license_number || doctor.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          disabled={reports.length === 0}
          className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs disabled:opacity-50"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Statement
        </button>
      </div>

      {/* Doctor Info Cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Sharing %</span>
            <Percent className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{doctor.commission_percentage || 0}%</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Per report</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">₹{summary.total_amount.toFixed(0)}</div>
          <div className="text-[10px] text-success mt-0.5">In selected period</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Amount Due</span>
            <DollarSign className="w-3.5 h-3.5 text-warning" />
          </div>
          <div className="text-foreground text-xl tabular-nums">₹{summary.total_commission.toFixed(0)}</div>
          <div className="text-[10px] text-warning mt-0.5">Payable</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Reports</span>
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{summary.total_reports}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Referrals</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Branch</span>
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xs mt-1 truncate">{branches.find(b => b.id === doctor.branch_id)?.name || 'Default Branch'}</div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-card border border-border rounded">
        <div className="px-4 py-2.5 border-b border-border bg-secondary/30">
          <h2 className="text-sm text-foreground">Contact Information</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Phone</div>
                <div className="text-xs text-foreground">{doctor.phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Email</div>
                <div className="text-xs text-foreground">{doctor.email || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Specialization</div>
                <div className="text-xs text-foreground">{doctor.specialization || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter + Reports Table */}
      <div className="bg-card border border-border rounded" ref={printRef}>
        <div className="px-4 py-2.5 border-b border-border bg-secondary/30 flex items-center justify-between">
          <h2 className="text-sm text-foreground">Referred Reports</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={reports.length === 0}
              className="h-7 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Printer className="w-3 h-3" />
              Print
            </button>
            <span className="w-px h-5 bg-border"></span>
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-7 px-2 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-7 px-2 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {isLoadingStatement ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30 sticky top-0 z-10">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider w-10">#</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Patient</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Test Type</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Sharing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                      No reports found for this period
                    </td>
                  </tr>
                ) : (
                  <>
                    {reports.map((r, i) => (
                      <tr key={r.report_id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-2 text-xs text-foreground">{new Date(r.report_date).toLocaleDateString()}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-foreground">{r.patient_name || '—'}</span>
                            <span className="text-[10px] text-muted-foreground">{r.patient_phone || ''}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-foreground">{r.report_type || '—'}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${getStatusBadge(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">₹{Number(r.report_amount || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs text-primary font-medium text-right tabular-nums">₹{Number(r.doctor_commission || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-secondary/50 font-medium">
                      <td colSpan={5} className="px-3 py-2 text-xs text-foreground">
                        Total ({reports.length} reports)
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">₹{summary.total_amount.toFixed(2)}</td>
                      <td className="px-3 py-2 text-xs text-primary font-semibold text-right tabular-nums">₹{summary.total_commission.toFixed(2)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {reports.length} reports • {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}
          </div>

        </div>
      </div>
    </div>
  );
}
