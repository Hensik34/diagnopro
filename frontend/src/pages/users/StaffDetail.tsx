import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  Clock, 
  Gauge, 
  FileText, 
  DollarSign, 
  Printer, 
  Loader2, 
  ChevronLeft, 
  AlertCircle,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  X,
  Trash2
} from 'lucide-react';
import { authApi } from '../../api/auth';
import { timeLogApi, type TimeLog } from '../../api/timeLogs';
import { formatHoursToHHMM } from '../../utils/formatters';
import { patientApi } from '../../api/patients';
import { useCollectionTrackingStore } from '../../stores/collectionTrackingStore';
import type { User, Patient, CollectionTracking } from '../../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-7 h-7 bg-card border border-border rounded-full flex items-center justify-center hover:bg-accent z-10"
        >
          <X className="w-4 h-4" />
        </button>
        <img src={src} alt="Meter" className="max-w-full max-h-[85vh] rounded object-contain" />
      </div>
    </div>
  );
}

function ImageButton({ imagePath, label }: { imagePath: string | null; label: string }) {
  const [showModal, setShowModal] = useState(false);
  if (!imagePath) return <span className="text-muted-foreground">-</span>;
  const fullUrl = imagePath.startsWith('http') || imagePath.startsWith('data:') ? imagePath : `${API_BASE}${imagePath}`;
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
        title={`View ${label}`}
      >
        <ImageIcon className="w-3.5 h-3.5" />
        View {label}
      </button>
      {showModal && <ImageModal src={fullUrl} onClose={() => setShowModal(false)} />}
    </>
  );
}

export function StaffDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [staff, setStaff] = useState<User | null>(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [activeTab, setActiveTab] = useState<'attendance' | 'odometer' | 'patients'>('attendance');

  // Logs & Collections data
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [odometerRecords, setOdometerRecords] = useState<CollectionTracking[]>([]);

  useEffect(() => {
    if (!id) return;
    fetchStaff();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchMonthData();
  }, [id, selectedMonth]);

  const fetchStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const res = await authApi.getAllUsers();
      const found = (res.data || []).find((u: User) => u.id === id);
      if (!found) {
        setError("Staff user not found");
      } else {
        setStaff(found);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load staff details");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const fetchMonthData = async () => {
    if (!id) return;
    setIsLoadingData(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 1).toISOString();

      // Fetch Time Logs
      const logsRes = await timeLogApi.getUserLogs(id, startDate, endDate);
      setLogs(logsRes.data || []);

      // Fetch Patients Registered by Staff
      const patientsRes = await patientApi.getAll({ created_by: id });
      // Filter patients created in selected month
      const monthPatients = (patientsRes.data || []).filter(p => {
        const dt = new Date(p.created_at);
        return dt.getFullYear() === year && dt.getMonth() === month - 1;
      });
      setPatients(monthPatients);

      // Fetch Collection/Odometer Tracking Records
      const ctStore = useCollectionTrackingStore.getState();
      const ctRes = await ctStore.fetchRecords({ staff_id: id });
      setOdometerRecords(useCollectionTrackingStore.getState().records);

    } catch (err: any) {
      console.error("Failed to load staff month data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this time log?')) return;
    try {
      await timeLogApi.deleteLog(logId);
      setLogs(prev => prev.filter(l => l.id !== logId));
      toast.success("Time log deleted successfully");
    } catch {
      toast.error("Failed to delete log");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculations for Settlement Board
  const totalWorkingHours = logs.reduce((sum, l) => sum + (parseFloat(String(l.total_hours)) || 0), 0);
  const totalPenalties = logs.reduce((sum, l) => sum + (parseFloat(String(l.penalty_hours)) || 0), 0);

  const petrolRate = Number(staff?.petrol_price_per_km || 0);
  const totalKmTraveled = logs.reduce((sum, l) => sum + (parseFloat(String(l.total_km)) || 0), 0);
  const totalPetrolCost = totalKmTraveled * petrolRate;

  const totalVisitCharges = patients.reduce((sum, p) => sum + (Number(p.sample_collection_visit_charge) || 0), 0);
  const grandTotalPayout = totalPetrolCost + totalVisitCharges;

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatTime = (dt: string) =>
    new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (isLoadingStaff) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading staff profile...
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error || 'Staff member not found'}</span>
        </div>
        <button onClick={() => navigate('/app/users')} className="underline font-medium text-xs">Return to Staff List</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/users')}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-accent text-foreground transition-colors cursor-pointer"
            title="Back to Staff List"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-0.5">
              {staff.firstname} {staff.lastname}
            </h1>
            <p className="text-muted-foreground text-xs flex items-center gap-3">
              <span>{staff.email}</span>
              {staff.phone && <span>• {staff.phone}</span>}
              <span className="capitalize px-2 py-0.5 bg-primary/10 text-primary font-medium rounded-full text-[10px]">
                {staff.role === 'lab_technician' ? 'Technician' : staff.role}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 px-3 bg-secondary border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
          />
          <button
            onClick={handlePrint}
            className="h-9 px-3.5 bg-secondary border border-border text-foreground hover:bg-accent rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Statement
          </button>
        </div>
      </div>

      {/* Month-End Payout Settlement Board */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm" ref={printRef}>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Month-End Payout & Expense Settlement Board
            </h2>
            <p className="text-xs text-muted-foreground">
              Period: {new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          {petrolRate > 0 && (
            <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded border border-border">
              Petrol Rate: <strong>₹{petrolRate}/KM</strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Working Hours */}
          <div className="bg-secondary/40 border border-border rounded-lg p-3.5">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
              <span>Total Working Hours</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {formatHoursToHHMM(totalWorkingHours)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex justify-between">
              <span>Shifts: {logs.length}</span>
              {totalPenalties > 0 && (
                <span className="text-destructive font-medium">-{totalPenalties}h penalty</span>
              )}
            </div>
          </div>

          {/* Odometer & Petrol Cost */}
          <div className="bg-secondary/40 border border-border rounded-lg p-3.5">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
              <span>Odometer Distance</span>
              <Gauge className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {totalKmTraveled} KM
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex justify-between">
              <span>Petrol Cost:</span>
              <strong className="text-foreground">₹{totalPetrolCost.toFixed(2)}</strong>
            </div>
          </div>

          {/* Visit Charges */}
          <div className="bg-secondary/40 border border-border rounded-lg p-3.5">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
              <span>Field Visit Charges</span>
              <FileText className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              ₹{totalVisitCharges.toFixed(2)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {patients.length} field patient{patients.length !== 1 ? 's' : ''} registered
            </div>
          </div>

          {/* Grand Total Settlement Payout */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3.5">
            <div className="flex items-center justify-between text-primary text-xs font-medium mb-1">
              <span>Grand Total Payout</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-primary tabular-nums">
              ₹{grandTotalPayout.toFixed(2)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Petrol Allowance + Visit Charges
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'attendance'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Shift Checkin/Checkout Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('odometer')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'odometer'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Bike Odometer & Meter Photos ({logs.filter(l => l.start_km != null || l.end_km != null).length})
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'patients'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Field Patients & Visit Charges ({patients.length})
        </button>
      </div>

      {/* Tab 1: Attendance & Shift Checkin/Checkout Logs */}
      {activeTab === 'attendance' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/30">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Date-Separated Shift Checkin & Checkout History</h3>
            <span className="text-[11px] text-muted-foreground">Original requested timestamps preserved</span>
          </div>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-xs">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading shift logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No shift checkin logs found for this period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left bg-secondary/20">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Checkin Time</th>
                    <th className="px-4 py-2.5">Checkout Time</th>
                    <th className="px-4 py-2.5">Duration</th>
                    <th className="px-4 py-2.5">Location & Approval Status</th>
                    <th className="px-4 py-2.5">Notes / Rejection Reason</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => {
                    const isOutside = log.is_outside;
                    const isPending = log.approval_status === 'pending';
                    const isRejectedPenalty = log.approval_status === 'rejected_with_penalty';
                    const isRejected = log.approval_status === 'rejected';

                    return (
                      <tr key={log.id} className="hover:bg-accent/30 transition-colors text-foreground">
                        <td className="px-4 py-3 font-medium tabular-nums">{formatDate(log.clock_in)}</td>
                        <td className="px-4 py-3 tabular-nums">{formatTime(log.requested_clock_in || log.clock_in)}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {log.clock_out ? formatTime(log.requested_clock_out || log.clock_out) : (
                            <span className="px-2 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded font-medium">Active Shift</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold tabular-nums">
                          {formatHoursToHHMM(log.total_hours)}
                          {Number(log.penalty_hours) > 0 && (
                            <span className="block text-[10px] text-destructive font-medium">(-{formatHoursToHHMM(log.penalty_hours)} penalty)</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-warning/20 text-warning-foreground font-medium">
                              ⏳ Outside Pending Approval
                            </span>
                          ) : isRejectedPenalty ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                              🔴 Outside Checkout Rejected (-1h)
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-destructive/20 text-destructive font-medium">
                              ❌ Checkin Rejected
                            </span>
                          ) : isOutside ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                              🌐 Approved Outside
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                              🟢 Lab Branch Verified
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                          {log.rejection_note || log.outside_reason || log.notes || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                            title="Delete Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bike Odometer & Meter Photos */}
      {activeTab === 'odometer' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/30">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Odometer Shift Logs & Bike Meter Photo Proofs</h3>
            <span className="text-[11px] text-muted-foreground">Synced on shift Checkin & Checkout</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left bg-secondary/20">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-right">Start KM</th>
                  <th className="px-4 py-2.5 text-right">End KM</th>
                  <th className="px-4 py-2.5 text-right">Total KM</th>
                  <th className="px-4 py-2.5 text-right">Petrol Rate</th>
                  <th className="px-4 py-2.5 text-right">Petrol Cost</th>
                  <th className="px-4 py-2.5 text-center">Bike Meter Photos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-xs">
                      No odometer logs recorded for this period
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const startKm = log.start_km != null ? Number(log.start_km) : null;
                    const endKm = log.end_km != null ? Number(log.end_km) : null;
                    const km = log.total_km != null ? Number(log.total_km) : (startKm != null && endKm != null ? Math.max(0, endKm - startKm) : 0);
                    const cost = km * petrolRate;

                    return (
                      <tr key={log.id} className="hover:bg-accent/30 transition-colors text-foreground">
                        <td className="px-4 py-3 font-medium tabular-nums">{formatDate(log.clock_in)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{startKm ?? '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{endKm ?? '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold">{km ? `${km} KM` : '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums">₹{petrolRate}/KM</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                          {cost ? `₹${cost.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <ImageButton imagePath={log.start_meter_image} label="Start" />
                            <ImageButton imagePath={log.end_meter_image} label="End" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Field Patients & Visit Charges */}
      {activeTab === 'patients' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/30">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Registered Field Patients & Sample Collection Visit Charges</h3>
            <span className="text-[11px] text-muted-foreground">Created by {staff.firstname} this month</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left bg-secondary/20">
                  <th className="px-4 py-2.5">Date & Time</th>
                  <th className="px-4 py-2.5">Patient Name</th>
                  <th className="px-4 py-2.5">Mobile Phone</th>
                  <th className="px-4 py-2.5">Age / Gender</th>
                  <th className="px-4 py-2.5">Address</th>
                  <th className="px-4 py-2.5 text-right">Sample Collection Visit Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-xs">
                      No field patients registered by staff for this month
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p.id} className="hover:bg-accent/30 transition-colors text-foreground">
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {formatDate(p.created_at)} {formatTime(p.created_at)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-foreground">{p.phone || '—'}</td>
                      <td className="px-4 py-3 text-foreground">{p.age} {p.age_unit || 'yrs'} ({p.gender || '—'})</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate">{p.address || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400 tabular-nums">
                        {p.sample_collection_visit_charge ? `₹${p.sample_collection_visit_charge}` : '₹0'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
