import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
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
  Check,
  X,
  Search,
} from 'lucide-react';
import { doctorApi } from '../../api/doctors';
import { priceListApi } from '../../api/priceLists';
import { testApi } from '../../api/tests';
import { useBranchStore } from '../../stores/branchStore';
import type { Doctor, DoctorStatement, DoctorStatementReport, PriceList, DoctorPriceAssignment, DoctorTestPriceOverride, Test } from '../../types';

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
  const [error, _setError] = useState<string | null>(null);
  const setError = (msg: string | null) => {
    _setError(msg);
    if (msg) toast.error(msg);
  };

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

  const [successMessage, _setSuccessMessage] = useState<string | null>(null);
  const setSuccessMessage = (msg: string | null) => {
    _setSuccessMessage(msg);
    if (msg) toast.success(msg);
  };
  const [activeTab, setActiveTab] = useState<'statement' | 'pricing'>('statement');
  
  // Pricing states
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [assignedPriceListId, setAssignedPriceListId] = useState<string | null>(null);
  const [pricingOverrides, setPricingOverrides] = useState<DoctorTestPriceOverride[]>([]);
  const [allTests, setAllTests] = useState<Test[]>([]);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [pricingSearch, setPricingSearch] = useState('');
  
  // Load pricing data when tab switches to 'pricing'
  useEffect(() => {
    if (activeTab === 'pricing' && doctor?.branch_id && id) {
      loadPricingData();
    }
  }, [activeTab, doctor?.branch_id, id]);

  const loadPricingData = async () => {
    if (!id || !doctor?.branch_id) return;
    setIsLoadingPricing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const plRes = await priceListApi.getAll({ branch_id: doctor.branch_id, is_active: true });
      setPriceLists(plRes.data || []);
      
      const prRes = await doctorApi.getPricing(id, doctor.branch_id);
      setAssignedPriceListId(prRes.assignment?.price_list_id || '');
      setPricingOverrides(prRes.overrides || []);

      const testRes = await testApi.getAll(doctor.branch_id);
      setAllTests(testRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing configurations');
    } finally {
      setIsLoadingPricing(false);
    }
  };

  const handleSavePriceListAssignment = async () => {
    if (!id || !doctor?.branch_id) return;
    setIsSavingPricing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const plId = assignedPriceListId || null;
      await doctorApi.assignPriceList(id, doctor.branch_id, plId);
      setSuccessMessage('Assigned price list updated successfully');
      fetchStatement();
    } catch (err: any) {
      setError(err.message || 'Failed to assign price list');
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleUpdateOverridePrice = (testId: string, price: number | null) => {
    const existing = pricingOverrides.find(o => o.test_id === testId);
    if (existing) {
      if (price === null) {
        setPricingOverrides(pricingOverrides.filter(o => o.test_id !== testId));
      } else {
        setPricingOverrides(pricingOverrides.map(o => o.test_id === testId ? { ...o, price } : o));
      }
    } else if (price !== null) {
      setPricingOverrides([...pricingOverrides, {
        doctor_id: id!,
        test_id: testId,
        price,
        branch_id: doctor!.branch_id
      }]);
    }
  };

  const handleSaveOverrides = async () => {
    if (!id || !doctor?.branch_id) return;
    setIsSavingPricing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const payload = pricingOverrides.map(o => ({
        test_id: o.test_id,
        price: Number(o.price)
      }));
      await doctorApi.upsertOverrides(id, doctor.branch_id, payload);
      setSuccessMessage('Individual overrides exceptions saved successfully');
      loadPricingData();
    } catch (err: any) {
      setError(err.message || 'Failed to update overrides');
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleDeleteOverride = async (testId: string) => {
    if (!id || !doctor?.branch_id) return;
    setError(null);
    setSuccessMessage(null);
    try {
      await doctorApi.deleteOverride(id, testId, doctor.branch_id);
      setPricingOverrides(pricingOverrides.filter(o => o.test_id !== testId));
      setSuccessMessage('Individual exception deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete override exception');
    }
  };

  const handlePrint = () => {
    if (!doctor) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printableDoctorName = `${doctorTitle}. ${doctorName}`;
    const periodStr = `${new Date(startDate).toLocaleDateString()} — ${new Date(endDate).toLocaleDateString()}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Doctor Statement - ${printableDoctorName}</title>
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
          <p class="subtitle">${printableDoctorName} • ${doctorSpecialization || ''} • Period: ${periodStr}</p>
          <div class="summary">
            <div class="summary-item"><div class="summary-label">Total Reports</div><div class="summary-value">${summary.total_reports}</div></div>
            <div class="summary-item"><div class="summary-label">Total Amount</div><div class="summary-value">₹${summary.total_amount.toFixed(2)}</div></div>
            <div class="summary-item"><div class="summary-label">Paid to B2B Labs</div><div class="summary-value">₹${summary.total_b2b_charge.toFixed(2)}</div></div>
            <div class="summary-item"><div class="summary-label">Amount(${doctorCommissionPercent || 0}%)</div><div class="summary-value">₹${summary.total_commission.toFixed(2)}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
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

  const rawSummary = statement?.summary || { total_reports: 0, total_amount: 0, total_commission: 0, total_b2b_charge: 0 };
  const summary = {
    total_reports: Number(rawSummary.total_reports) || 0,
    total_amount: Number(rawSummary.total_amount) || 0,
    total_commission: Number(rawSummary.total_commission) || 0,
    total_b2b_charge: Number(rawSummary.total_b2b_charge) || 0,
  };
  const reports = statement?.reports || [];
  const doctorName =
    doctor?.name ||
    [doctor?.firstname, doctor?.lastname].filter(Boolean).join(' ').trim() ||
    statement?.doctor?.name?.replace(/^Dr\.?\s*/i, '').trim() ||
    'Unknown Doctor';
  const doctorTitle = doctor?.title || 'Dr';
  const doctorPhone = doctor?.phone || statement?.doctor?.phone || '—';
  const doctorEmail = doctor?.email || statement?.doctor?.email || '—';
  const doctorCommissionPercent = Number(
    doctor?.commission_percentage ?? statement?.doctor?.commission_percentage ?? 0
  );
  const doctorSpecialization = doctor?.specialization || 'Doctor';
  const doctorRef = doctor?.license_number || doctor?.id?.slice(0, 8) || '—';

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
            <h1 className="text-foreground text-lg mb-0.5">{doctorTitle}. {doctorName}</h1>
            <p className="text-muted-foreground text-xs">
              {doctorSpecialization} • {doctorRef}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Sharing %</span>
            <Percent className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{doctorCommissionPercent}%</div>
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
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Paid to B2B Labs</span>
            <Building2 className="w-3.5 h-3.5 text-destructive" />
          </div>
          <div className="text-foreground text-xl tabular-nums">₹{summary.total_b2b_charge.toFixed(0)}</div>
          <div className="text-[10px] text-destructive mt-0.5">Deducted from revenue</div>
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

      {/* Contact & Referred Reports Tabbed Section */}
      {successMessage && (
        <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded flex items-center gap-2 text-green-700 dark:text-green-300 text-xs">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
          <button className="ml-auto" onClick={() => setSuccessMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => {
            setActiveTab('statement');
            setError(null);
            setSuccessMessage(null);
          }}
          className={`px-4 py-2 border-b-2 font-medium text-xs transition-colors ${
            activeTab === 'statement'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Statement & Referral Info
        </button>
        <button
          onClick={() => {
            setActiveTab('pricing');
            setError(null);
            setSuccessMessage(null);
          }}
          className={`px-4 py-2 border-b-2 font-medium text-xs transition-colors ${
            activeTab === 'pricing'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Pricing Configuration
        </button>
      </div>

      {activeTab === 'statement' ? (
        <>
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
                    <div className="text-xs text-foreground">{doctorPhone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Email</div>
                    <div className="text-xs text-foreground">{doctorEmail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Specialization</div>
                    <div className="text-xs text-foreground">{doctorSpecialization || '—'}</div>
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
                      <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">B2B</th>
                      <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Sharing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
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
                            <td className="px-3 py-2 text-xs text-right tabular-nums">
                              {Number(r.b2b_charge || 0) > 0 ? (
                                <span className="text-destructive">₹{Number(r.b2b_charge).toFixed(2)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs text-primary font-medium text-right tabular-nums">₹{Number(r.doctor_commission || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="bg-secondary/50 font-medium">
                          <td colSpan={5} className="px-3 py-2 text-xs text-foreground">
                            Total ({reports.length} reports)
                          </td>
                          <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">₹{summary.total_amount.toFixed(2)}</td>
                          <td className="px-3 py-2 text-xs text-destructive text-right tabular-nums">
                            {summary.total_b2b_charge > 0 ? `₹${summary.total_b2b_charge.toFixed(2)}` : '—'}
                          </td>
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
        </>
      ) : (
        <div className="space-y-6">
          {/* Assigned Price List Card */}
          <div className="bg-card border border-border rounded p-4 text-left">
            <h3 className="font-semibold text-sm mb-1 text-foreground">Assigned Price List</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Assign a branch-level price list to Dr. {doctorName}. This list will apply to all reports referred by this doctor.
            </p>
            <div className="flex items-center gap-3">
              <select
                value={assignedPriceListId || ''}
                onChange={(e) => setAssignedPriceListId(e.target.value || null)}
                className="max-w-xs h-9 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">No Price List Assigned (Use Branch Defaults)</option>
                {priceLists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name} (v{pl.version})
                  </option>
                ))}
              </select>
              <button
                onClick={handleSavePriceListAssignment}
                disabled={isSavingPricing || isLoadingPricing}
                className="h-9 px-4 bg-primary text-white rounded-lg text-xs hover:opacity-90 transition-opacity font-semibold disabled:opacity-50"
              >
                {isSavingPricing ? 'Saving...' : 'Update Assignment'}
              </button>
            </div>
          </div>

          {/* Exceptions Table */}
          <div className="bg-card border border-border rounded p-4 text-left">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Individual Test Exceptions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set specific rates for Dr. {doctorName} on particular tests. Exceptions override the assigned price list rates.
                </p>
              </div>
              <button
                onClick={handleSaveOverrides}
                disabled={isSavingPricing || isLoadingPricing}
                className="h-9 px-4 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 animate-pulse-subtle"
              >
                {isSavingPricing ? 'Saving...' : 'Save Exceptions'}
              </button>
            </div>

            {/* Search exception */}
            <div className="relative mb-4 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={pricingSearch}
                onChange={(e) => setPricingSearch(e.target.value)}
                placeholder="Search tests by name or code..."
                className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {isLoadingPricing ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/30">
                    <tr className="border-b border-border">
                      <th className="p-3">Test</th>
                      <th className="p-3">Base Price</th>
                      <th className="p-3" style={{ width: '150px' }}>Exception Price</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allTests
                      .filter(t => 
                        t.test_name.toLowerCase().includes(pricingSearch.toLowerCase()) ||
                        t.test_code.toLowerCase().includes(pricingSearch.toLowerCase())
                      )
                      .map((test) => {
                        const override = pricingOverrides.find(o => o.test_id === test.id);
                        const hasOverride = !!override;
                        return (
                          <tr key={test.id} className={hasOverride ? 'bg-primary/5' : ''}>
                            <td className="p-3">
                              <div className="font-semibold text-foreground">{test.test_name}</div>
                              <div className="text-[10px] text-muted-foreground">{test.test_code}</div>
                            </td>
                            <td className="p-3 text-muted-foreground">₹{Number(test.price).toFixed(2)}</td>
                            <td className="p-3">
                              <div className="relative w-28">
                                <span className="absolute left-2 top-2 text-muted-foreground">₹</span>
                                <input
                                  type="number"
                                  value={override ? override.price : ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? null : Number(e.target.value);
                                    handleUpdateOverridePrice(test.id, val);
                                  }}
                                  placeholder="Auto"
                                  className="w-full pl-5 pr-2 py-1 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              {hasOverride ? (
                                Number(override.price) > Number(test.price) ? (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 px-1.5 py-0.5 rounded font-medium">
                                    Increase (+₹{(Number(override.price) - Number(test.price)).toFixed(2)})
                                  </span>
                                ) : Number(override.price) < Number(test.price) ? (
                                  <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900 px-1.5 py-0.5 rounded font-medium">
                                    Decrease (-₹{(Number(test.price) - Number(override.price)).toFixed(2)})
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                                    Custom (No Change)
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {hasOverride && (
                                <button
                                  onClick={() => handleDeleteOverride(test.id)}
                                  className="text-red-600 hover:text-red-700 font-semibold hover:underline"
                                >
                                  Delete
                                </button>
                              )}
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
      )}
    </div>
  );
}
