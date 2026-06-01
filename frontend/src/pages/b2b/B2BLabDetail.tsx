import { useParams, useNavigate } from 'react-router';
import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Loader2, Download } from 'lucide-react';
import { b2bApi } from '../../api/b2b';

// Helper: format date to YYYY-MM-DD
const toDateStr = (d: Date) => d.toISOString().split('T')[0];

// Default to current month range
const now = new Date();
const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

interface B2BStatement {
  summary: {
    total_reports: number;
    total_amount: number;
    total_charge: number;
  };
  reports: Array<{
    id: string;
    report_date: string;
    patient_name: string;
    report_type: string;
    status: string;
    report_amount: number;
    b2b_charge: number;
  }>;
}

interface B2BLab {
  id: string;
  lab_name: string;
  lab_code: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  status: 'active' | 'inactive' | 'suspended';
  owner_branch_id?: string;
  created_at: string;
  updated_at: string;
}

export function B2BLabDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [lab, setLab] = useState<B2BLab | null>(null);
  const [statement, setStatement] = useState<B2BStatement | null>(null);
  const [isLoadingLab, setIsLoadingLab] = useState(true);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(toDateStr(firstOfMonth));
  const [endDate, setEndDate] = useState(toDateStr(lastOfMonth));

  // Fetch lab on mount
  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoadingLab(true);
      try {
        const lab = await b2bApi.getLabById(id);
        setLab(lab);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load B2B lab');
      } finally {
        setIsLoadingLab(false);
      }
    })();
  }, [id]);

  // Fetch statement when lab loads or dates change
  useEffect(() => {
    if (!id || !startDate || !endDate) return;
    fetchStatement();
  }, [id, startDate, endDate]);

  const fetchStatement = async () => {
    if (!id) return;
    setIsLoadingStatement(true);
    try {
      const res = await b2bApi.getStatement(id, startDate, endDate);
      setStatement(res);
    } catch {
      setStatement(null);
    } finally {
      setIsLoadingStatement(false);
    }
  };

  const handlePrint = () => {
    if (!lab || !statement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const periodStr = `${new Date(startDate).toLocaleDateString()} — ${new Date(endDate).toLocaleDateString()}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>B2B Lab Statement - ${lab.lab_name}</title>
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
          <h1>B2B Lab Statement</h1>
          <p class="subtitle">${lab.lab_name} • ${lab.contact_person || ''} • Period: ${periodStr}</p>
          <div class="summary">
            <div class="summary-item"><div class="summary-label">Total Reports</div><div class="summary-value">${statement.summary.total_reports}</div></div>
            <div class="summary-item"><div class="summary-label">Total Amount</div><div class="summary-value">₹${statement.summary.total_amount.toFixed(2)}</div></div>
            <div class="summary-item"><div class="summary-label">B2B Charge</div><div class="summary-value">₹${statement.summary.total_charge.toFixed(2)}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Report Type</th>
                <th>Status</th>
                <th class="text-right">Amount</th>
                <th class="text-right">B2B Charge</th>
              </tr>
            </thead>
            <tbody>
              ${statement.reports.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${new Date(r.report_date).toLocaleDateString()}</td>
                  <td>${r.patient_name || '—'}</td>
                  <td>${r.report_type || '—'}</td>
                  <td>${r.status}</td>
                  <td class="text-right">₹${Number(r.report_amount).toFixed(2)}</td>
                  <td class="text-right">₹${Number(r.b2b_charge).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5">Total</td>
                <td class="text-right">₹${statement.summary.total_amount.toFixed(2)}</td>
                <td class="text-right">₹${statement.summary.total_charge.toFixed(2)}</td>
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

  const rawSummary = statement?.summary || {
    total_reports: 0,
    total_amount: 0,
    total_charge: 0,
  };
  const summary = {
    total_reports: Number(rawSummary.total_reports) || 0,
    total_amount: Number(rawSummary.total_amount) || 0,
    total_charge: Number(rawSummary.total_charge) || 0,
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

  if (isLoadingLab) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/b2b')}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to B2B Labs
        </button>
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded text-destructive">
          <AlertCircle className="w-5 h-5" />
          {error || 'Lab not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/b2b')}
            className="flex items-center gap-2 text-sm text-primary hover:underline mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to B2B Labs
          </button>
          <h1 className="text-2xl font-bold text-foreground">{lab.lab_name}</h1>
          <p className="text-sm text-muted-foreground">{lab.lab_code}</p>
        </div>
      </div>

      {/* Lab Info Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <p className="text-xs text-muted-foreground mb-1">Contact Person</p>
          <p className="text-sm font-semibold text-foreground">{lab.contact_person || '—'}</p>
        </div>
        <div className="bg-card border border-border rounded p-3">
          <p className="text-xs text-muted-foreground mb-1">Mobile</p>
          <p className="text-sm font-semibold text-foreground">{lab.mobile || '—'}</p>
        </div>
        <div className="bg-card border border-border rounded p-3">
          <p className="text-xs text-muted-foreground mb-1">Email</p>
          <p className="text-sm font-semibold text-foreground break-all">{lab.email || '—'}</p>
        </div>
        <div className="bg-card border border-border rounded p-3">
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <p className={`text-sm font-semibold ${lab.status === 'active' ? 'text-success' : lab.status === 'inactive' ? 'text-muted-foreground' : 'text-destructive'}`}>
            {lab.status.charAt(0).toUpperCase() + lab.status.slice(1)}
          </p>
        </div>
      </div>

      {/* Monthly Bill - Date Filter + Reports Table */}
      <div className="bg-card border border-border rounded" ref={printRef}>
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Monthly Bill</h2>
            <button
              onClick={handlePrint}
              className="h-7 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Print Bill
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-secondary/30">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 px-2 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 px-2 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoadingStatement && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2 text-xs text-muted-foreground">Loading reports...</span>
          </div>
        )}

        {/* Summary Cards */}
        {!isLoadingStatement && statement && (
          <>
            <div className="px-4 py-3 border-b border-border bg-secondary/30 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Reports</p>
                <p className="text-lg font-bold text-foreground">{summary.total_reports}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                <p className="text-lg font-bold text-foreground">₹{summary.total_amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total B2B Charge</p>
                <p className="text-lg font-bold text-success">₹{summary.total_charge.toFixed(2)}</p>
              </div>
            </div>

            {/* Reports Table */}
            {reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">#</th>
                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Date</th>
                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Patient</th>
                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Report Type</th>
                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Amount</th>
                      <th className="text-right px-4 py-2 font-semibold text-muted-foreground">B2B Charge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, i) => (
                      <tr key={report.id} className="border-b border-border hover:bg-secondary/30">
                        <td className="px-4 py-2">{i + 1}</td>
                        <td className="px-4 py-2">{new Date(report.report_date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-foreground">{report.patient_name || '—'}</td>
                        <td className="px-4 py-2">{report.report_type || '—'}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(report.status)}`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          ₹{Number(report.report_amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-success font-semibold">
                          ₹{Number(report.b2b_charge).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <p className="text-sm">No reports found for the selected period</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-border bg-secondary/30 px-4 py-2 flex justify-between items-center text-xs text-muted-foreground">
              <span>Showing {reports.length} report(s)</span>
              <span>Period: {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
