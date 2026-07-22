import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Calendar, 
  Timer, 
  Loader2, 
  Camera, 
  AlertCircle,
  Gauge,
  Users,
  CheckCircle,
  XCircle,
  Globe,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  X,
  Image as ImageIcon,
  User as UserIcon,
  Check,
  Ban
} from 'lucide-react';
import { useTimeLogStore, useAuthStore } from '../../stores';
import { useBranchStore } from '../../stores/branchStore';
import { addWatermarkToImage } from '../../utils/watermark';
import { formatHoursToHHMM } from '../../utils/formatters';
import type { TimeLog } from '../../api/timeLogs';

const API_BASE = (import.meta as any).env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ROLE_LABELS: Record<string, string> = {
  staff: 'Staff',
  lab_technician: 'Technician',
  doctor: 'Doctor',
};

const ROLE_COLORS: Record<string, string> = {
  staff: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  lab_technician: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  doctor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-7 h-7 bg-card border border-border rounded-full flex items-center justify-center hover:bg-accent z-10 cursor-pointer"
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
        className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium cursor-pointer"
        title={`View ${label}`}
      >
        <ImageIcon className="w-3.5 h-3.5" />
        View {label}
      </button>
      {showModal && <ImageModal src={fullUrl} onClose={() => setShowModal(false)} />}
    </>
  );
}

export function TimeTracking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'pending' ? 'pending' : 'attendance';

  const { currentBranchId } = useBranchStore();
  const { user } = useAuthStore();
  const {
    activeSession,
    myLogs,
    myTotalHours,
    userSummary,
    pendingApprovals,
    isLoading,
    error,
    clockIn,
    clockOut,
    fetchActiveSession,
    fetchMyLogs,
    fetchUserSummary,
    fetchPendingApprovals,
    approveClockRequest,
    rejectClockRequest,
    fetchUserLogs,
    deleteLog,
    clearError,
  } = useTimeLogStore();

  const [activeTab, setActiveTab] = useState<'attendance' | 'pending' | 'summary'>(initialTab as any);

  // Modals state
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [rejectModalLogId, setRejectModalLogId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Checkin state
  const [startKm, setStartKm] = useState('');
  const startImageInputRef = useRef<HTMLInputElement>(null);
  const [startMeterImageBase64, setStartMeterImageBase64] = useState<string | null>(null);
  const [startMeterImageName, setStartMeterImageName] = useState<string | null>(null);
  const [isOutsideCheckin, setIsOutsideCheckin] = useState(false);
  const [outsideCheckinReason, setOutsideCheckinReason] = useState('');

  // Checkout state
  const [endKm, setEndKm] = useState('');
  const [clockOutNotes, setClockOutNotes] = useState('');
  const endImageInputRef = useRef<HTMLInputElement>(null);
  const [endMeterImageBase64, setEndMeterImageBase64] = useState<string | null>(null);
  const [endMeterImageName, setEndMeterImageName] = useState<string | null>(null);
  const [isOutsideCheckout, setIsOutsideCheckout] = useState(false);
  const [outsideCheckoutReason, setOutsideCheckoutReason] = useState('');

  // Location capture
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedUserLogs, setExpandedUserLogs] = useState<TimeLog[]>([]);
  const [loadingUserLogs, setLoadingUserLogs] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'lab_technician';

  useEffect(() => {
    if (!isAdmin) {
      fetchActiveSession();
    }
  }, [fetchActiveSession, isAdmin]);

  useEffect(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    if (isAdmin) {
      fetchUserSummary(startDate, endDate);
      fetchPendingApprovals();
    } else {
      fetchMyLogs(startDate, endDate);
    }
  }, [selectedMonth, fetchMyLogs, fetchUserSummary, fetchPendingApprovals, currentBranchId, isAdmin]);

  const getCoordinates = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser");
        resolve(null);
        return;
      }
      setGettingLocation(true);
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGettingLocation(false);
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          setGettingLocation(false);
          setLocationError(`GPS Location Error: ${err.message}. Please enable location permissions.`);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Start Checkin
  const handleStartClockIn = () => {
    setStartKm('');
    setStartMeterImageBase64(null);
    setStartMeterImageName(null);
    setIsOutsideCheckin(false);
    setOutsideCheckinReason('');
    if (startImageInputRef.current) startImageInputRef.current.value = '';
    setLocationError(null);
    clearError();
    setShowClockInModal(true);
  };

  const handleStartImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStartMeterImageName(file.name);
      const b64 = await toBase64(file);
      setStartMeterImageBase64(b64);
    }
  };

  const handleConfirmClockIn = async () => {
    if (user?.requires_meter_photo !== false && !startMeterImageBase64) {
      alert("Start Bike Meter photo is required to checkin!");
      return;
    }

    let finalStartImage = startMeterImageBase64 || undefined;
    if (startMeterImageBase64) {
      finalStartImage = await addWatermarkToImage({
        imageBase64: startMeterImageBase64,
        title: 'DIAGNOPRO • CHECK-IN',
        staffName: `${user?.firstname || ''} ${user?.lastname || ''}`.trim() || undefined,
        kmReading: startKm ? `START KM: ${startKm} km` : undefined,
      });
    }

    const coords = await getCoordinates();
    const res = await clockIn({
      start_km: startKm ? parseFloat(startKm) : undefined,
      start_meter_image: finalStartImage,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      is_outside: isOutsideCheckin,
      outside_reason: outsideCheckinReason || undefined,
    });
    if (res.success) {
      setShowClockInModal(false);
      fetchActiveSession();
      if (res.is_outside) {
        toast.info("Outside Checkin request submitted for Admin approval.");
      } else {
        toast.success("Checked in successfully.");
      }
    }
  };

  // Start Checkout
  const handleStartClockOut = () => {
    setEndKm('');
    setClockOutNotes('');
    setEndMeterImageBase64(null);
    setEndMeterImageName(null);
    setIsOutsideCheckout(false);
    setOutsideCheckoutReason('');
    if (endImageInputRef.current) endImageInputRef.current.value = '';
    setLocationError(null);
    clearError();
    setShowClockOutModal(true);
  };

  const handleEndImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEndMeterImageName(file.name);
      const b64 = await toBase64(file);
      setEndMeterImageBase64(b64);
    }
  };

  const handleConfirmClockOut = async () => {
    if (user?.requires_meter_photo !== false && !endMeterImageBase64) {
      alert("Mandatory End Bike Meter Photo is required to checkout!");
      return;
    }

    let finalEndImage = endMeterImageBase64 || undefined;
    if (endMeterImageBase64) {
      finalEndImage = await addWatermarkToImage({
        imageBase64: endMeterImageBase64,
        title: 'DIAGNOPRO • CHECK-OUT',
        staffName: `${user?.firstname || ''} ${user?.lastname || ''}`.trim() || undefined,
        kmReading: endKm ? `END KM: ${endKm} km` : undefined,
      });
    }

    const coords = await getCoordinates();
    const res = await clockOut({
      notes: clockOutNotes || undefined,
      end_km: endKm ? parseFloat(endKm) : undefined,
      end_meter_image: finalEndImage,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      is_outside: isOutsideCheckout,
      outside_reason: outsideCheckoutReason || undefined,
    });

    if (res.success) {
      setShowClockOutModal(false);
      const [year, month] = selectedMonth.split('-').map(Number);
      fetchMyLogs(
        new Date(year, month - 1, 1).toISOString(),
        new Date(year, month, 1).toISOString()
      );
      if (res.is_outside) {
        toast.info("Outside Checkout request submitted for Admin approval.");
      } else {
        toast.success("Checked out successfully.");
      }
    }
  };

  const handleApproveRequest = async (id: string) => {
    const success = await approveClockRequest(id);
    if (success) {
      toast.success("Checkin/Checkout request approved successfully");
      fetchPendingApprovals();
    }
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectModalLogId(id);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalLogId) return;
    const success = await rejectClockRequest(rejectModalLogId, rejectionReason);
    if (success) {
      toast.success("Outside Checkin/Checkout request rejected");
      setRejectModalLogId(null);
      setRejectionReason('');
      fetchPendingApprovals();
    }
  };

  const handleExpandUser = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setExpandedUserLogs([]);
      return;
    }
    setExpandedUser(userId);
    setLoadingUserLogs(true);
    const [year, month] = selectedMonth.split('-').map(Number);
    const logsData = await fetchUserLogs(
      userId,
      new Date(year, month - 1, 1).toISOString(),
      new Date(year, month, 1).toISOString()
    );
    setExpandedUserLogs(logsData);
    setLoadingUserLogs(false);
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this time log?')) return;
    const success = await deleteLog(logId);
    if (success) {
      setExpandedUserLogs((prev) => prev.filter((l) => l.id !== logId));
      toast.success("Time log deleted successfully");
    }
  };

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatTime = (dt: string) =>
    new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const filteredUserSummary = userSummary.filter(
    (u) => !selectedStaffId || u.user_id === selectedStaffId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-0.5">Shift Checkin & Attendance</h1>
          <p className="text-muted-foreground text-xs">
            {isAdmin ? 'Manage staff shift attendance, outside approvals, and odometer tracking' : 'Your shift duration & attendance history'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-shrink-0">
          {isAdmin && (
            <div className="relative w-full sm:w-48">
              <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="">All Staff</option>
                {userSummary.map((s) => (
                  <option key={s.user_id} value={s.user_id}>
                    {s.firstname} {s.lastname}
                  </option>
                ))}
              </select>
            </div>
          )}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-auto h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
          />
        </div>
      </div>

      {/* Global Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-destructive font-medium hover:underline">Dismiss</button>
        </div>
      )}

      {/* Staff Checkin/Checkout Card */}
      {!isAdmin && (
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              activeSession 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-secondary text-muted-foreground'
            }`}>
              <Clock className="w-10 h-10" />
            </div>

            {activeSession ? (
              <>
                <div className="py-2">
                  <p className="text-xs text-muted-foreground">You are checked in since</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatTime(activeSession.requested_clock_in || activeSession.clock_in)} ({formatDate(activeSession.clock_in)})
                  </p>
                  {activeSession.start_km != null && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Gauge className="w-3.5 h-3.5" /> Start Odometer: <strong>{activeSession.start_km} KM</strong>
                    </p>
                  )}
                </div>
                <button
                  onClick={handleStartClockOut}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer text-sm shadow-sm"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                  Checkout & Upload Meter Photo
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">You are not checked in</p>
                  <p className="text-lg font-semibold text-foreground">Checkin to start shift tracking</p>
                </div>
                <button
                  onClick={handleStartClockIn}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer text-sm shadow-sm"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  Checkin (Start Shift)
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Admin Tabs */}
      {isAdmin && (
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'attendance'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Staff Shift Attendance & Hours Summary
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pending'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending Outside Approvals
            {pendingApprovals.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-warning text-warning-foreground text-[10px] font-bold animate-pulse">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Pending Outside Approvals Tab (Admin) */}
      {isAdmin && activeTab === 'pending' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Outside Checkin / Checkout Approval Requests</h2>
            </div>
            <span className="text-xs text-muted-foreground">{pendingApprovals.length} pending request{pendingApprovals.length !== 1 ? 's' : ''}</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" />
              No pending outside checkin/checkout requests
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left bg-secondary/20">
                    <th className="px-4 py-3">Staff Name</th>
                    <th className="px-4 py-3">Request Type</th>
                    <th className="px-4 py-3">Requested Time</th>
                    <th className="px-4 py-3">Distance & Reason</th>
                    <th className="px-4 py-3 text-center">Meter Photo</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingApprovals.map((req) => {
                    const isCheckout = req.clock_out != null;
                    const meterPhoto = isCheckout ? req.end_meter_image : req.start_meter_image;
                    const distance = req.location_meta?.clock_in?.distance_meters || req.location_meta?.clock_out?.distance_meters || 0;

                    return (
                      <tr key={req.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">
                            {req.user ? `${req.user.firstname} ${req.user.lastname}` : 'Staff'}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{req.user?.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isCheckout ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {isCheckout ? 'Outside Checkout' : 'Outside Checkin'}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums font-medium">
                          {formatDate(req.clock_in)} {formatTime(isCheckout ? (req.requested_clock_out || req.clock_out!) : (req.requested_clock_in || req.clock_in))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{req.outside_reason || 'Outside Location Request'}</div>
                          <div className="text-[10px] text-muted-foreground">{distance}m away from Lab Branch</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ImageButton imagePath={meterPhoto} label={isCheckout ? 'End Meter' : 'Start Meter'} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveRequest(req.id)}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(req.id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Ban className="w-3 h-3" /> Reject
                            </button>
                          </div>
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

      {/* Staff Attendance Summary Tab (Admin / Consolidated View) */}
      {(isAdmin && activeTab === 'attendance') && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1 text-muted-foreground text-xs">
                <span>Active Staff Tracked</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">{filteredUserSummary.length}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1 text-muted-foreground text-xs">
                <span>Total Accumulated Hours</span>
                <Timer className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {formatHoursToHHMM(filteredUserSummary.reduce((sum, u) => sum + parseFloat(String(u.total_hours) || '0'), 0))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1 text-muted-foreground text-xs">
                <span>Total Shift Sessions</span>
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {filteredUserSummary.reduce((sum, u) => sum + Number(u.total_sessions), 0)}
              </div>
            </div>
          </div>

          {/* User Summary List */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Staff Shift Summary List</h2>
              <span className="text-xs text-muted-foreground">Click staff row to view day-by-day shift breakdown</span>
            </div>

            {isLoading && userSummary.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUserSummary.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No shift time records found for this month selection
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredUserSummary.map((userItem) => (
                  <div key={userItem.user_id}>
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-accent/30 transition-colors">
                      <div 
                        onClick={() => handleExpandUser(userItem.user_id)}
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-foreground">
                          {userItem.firstname?.[0]}{userItem.lastname?.[0]}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-foreground">
                            {userItem.firstname} {userItem.lastname}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{userItem.email}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          ROLE_COLORS[userItem.role] || 'bg-secondary text-foreground'
                        }`}>
                          {ROLE_LABELS[userItem.role] || userItem.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-bold text-foreground tabular-nums">
                            {formatHoursToHHMM(userItem.total_hours)} Total
                          </p>
                          <p className="text-[10px] text-muted-foreground">{userItem.total_sessions} shifts</p>
                        </div>

                        <button
                          onClick={() => navigate(`/app/users/${userItem.user_id}`)}
                          className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                          title="View Full Staff Payout Board"
                        >
                          <Eye className="w-3.5 h-3.5" /> Payout Board
                        </button>

                        <button
                          onClick={() => handleExpandUser(userItem.user_id)}
                          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {expandedUser === userItem.user_id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Day-by-Day Shift Breakdown */}
                    {expandedUser === userItem.user_id && (
                      <div className="bg-secondary/20 px-4 pb-4 border-t border-border">
                        {loadingUserLogs ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : expandedUserLogs.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-4 text-center">No logs found</p>
                        ) : (
                          <table className="w-full text-xs mt-2">
                            <thead>
                              <tr className="text-left text-muted-foreground border-b border-border">
                                <th className="pb-2 font-medium">Date</th>
                                <th className="pb-2 font-medium">Checkin</th>
                                <th className="pb-2 font-medium">Checkout</th>
                                <th className="pb-2 font-medium">Duration</th>
                                <th className="pb-2 font-medium">Location Status</th>
                                <th className="pb-2 font-medium">Notes</th>
                                <th className="pb-2 font-medium text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {expandedUserLogs.map((log) => (
                                <tr key={log.id} className="text-foreground">
                                  <td className="py-2 font-medium tabular-nums">{formatDate(log.clock_in)}</td>
                                  <td className="py-2 tabular-nums">{formatTime(log.requested_clock_in || log.clock_in)}</td>
                                  <td className="py-2 tabular-nums">
                                    {log.clock_out ? formatTime(log.requested_clock_out || log.clock_out) : (
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">Active Shift</span>
                                    )}
                                  </td>
                                  <td className="py-2 font-bold tabular-nums">
                                    {formatHoursToHHMM(log.total_hours)}
                                  </td>
                                  <td className="py-2">
                                    {log.is_outside ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                                        🌐 Outside Shift
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                                        🟢 Lab Verified
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 text-xs text-muted-foreground max-w-[180px] truncate">
                                    {log.rejection_note || log.outside_reason || log.notes || '—'}
                                  </td>
                                  <td className="py-2 text-right">
                                    <button
                                      onClick={() => handleDeleteLog(log.id)}
                                      className="p-1 text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                                      title="Delete log"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff Personal Shift History (Non-Admin Staff View) */}
      {!isAdmin && (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Day-by-Day Shift Checkin & Duration History</h2>
          </div>

          {isLoading && myLogs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-xs">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading shift history...
            </div>
          ) : myLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No shift logs recorded for this month</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left bg-secondary/30">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Checkin Time</th>
                    <th className="px-4 py-3 font-medium">Checkout Time</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Location Status</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {myLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-accent/30 transition-colors text-foreground">
                      <td className="px-4 py-3 font-medium tabular-nums">{formatDate(log.clock_in)}</td>
                      <td className="px-4 py-3 tabular-nums">{formatTime(log.requested_clock_in || log.clock_in)}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {log.clock_out ? formatTime(log.requested_clock_out || log.clock_out) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">Active Shift</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums text-foreground">
                        {formatHoursToHHMM(log.total_hours)}
                      </td>
                      <td className="px-4 py-3">
                        {log.is_outside ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                            🌐 Outside Shift
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                            🟢 Lab Verified
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                        {log.rejection_note || log.outside_reason || log.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Checkin Modal */}
      {showClockInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-foreground">Shift Checkin</h3>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Verify Lab location or checkin from field with photo & reason.
            </p>

            {locationError && (
              <div className="bg-destructive/10 border border-destructive/20 p-2.5 rounded text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{locationError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Start Odometer Reading (KM)
              </label>
              <input
                type="number"
                value={startKm}
                onChange={(e) => setStartKm(e.target.value)}
                placeholder="Enter current meter KM"
                className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Mandatory Start Bike Meter Photo */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Start Bike Meter Photo * (Mandatory)
              </label>
              <input
                ref={startImageInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleStartImageChange}
              />
              <button
                type="button"
                onClick={() => startImageInputRef.current?.click()}
                className="w-full h-10 border border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-xs text-primary hover:bg-primary/5 transition-colors font-medium cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                {startMeterImageName ? `Selected: ${startMeterImageName}` : 'Take Start Bike Meter Photo (Camera)'}
              </button>
              {startMeterImageBase64 && (
                <div className="mt-2 text-center">
                  <img src={startMeterImageBase64} alt="Start meter preview" className="max-h-32 mx-auto rounded border border-border object-contain" />
                </div>
              )}
            </div>

            {/* Outside Checkin Toggle */}
            <div className="p-3 bg-secondary/40 border border-border rounded-lg space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOutsideCheckin}
                  onChange={(e) => setIsOutsideCheckin(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                Checkin from Field / Outside Lab (Requires Admin Approval)
              </label>
              {isOutsideCheckin && (
                <input
                  type="text"
                  value={outsideCheckinReason}
                  onChange={(e) => setOutsideCheckinReason(e.target.value)}
                  placeholder="e.g. Patient Home Visit at Residence"
                  className="w-full h-8 px-2.5 border border-border rounded text-xs bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowClockInModal(false)}
                className="px-4 py-2 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-accent cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClockIn}
                disabled={isLoading || gettingLocation || !startMeterImageBase64}
                className="px-4 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
              >
                {(isLoading || gettingLocation) && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Checkin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showClockOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-foreground">Shift Checkout</h3>
            </div>

            <p className="text-xs text-muted-foreground">
              End shift and upload final bike meter photo.
            </p>

            {locationError && (
              <div className="bg-destructive/10 border border-destructive/20 p-2.5 rounded text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{locationError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                End Odometer Reading (KM)
              </label>
              <input
                type="number"
                value={endKm}
                onChange={(e) => setEndKm(e.target.value)}
                placeholder="Enter final meter KM"
                className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Mandatory End Meter Photo Upload */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                End Bike Meter Photo * (Mandatory)
              </label>
              <input
                ref={endImageInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleEndImageChange}
              />
              <button
                type="button"
                onClick={() => endImageInputRef.current?.click()}
                className="w-full h-10 border border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-xs text-primary hover:bg-primary/5 transition-colors font-medium cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                {endMeterImageName ? `Selected: ${endMeterImageName}` : 'Take End Bike Meter Photo (Camera)'}
              </button>
              {endMeterImageBase64 && (
                <div className="mt-2 text-center">
                  <img src={endMeterImageBase64} alt="End meter preview" className="max-h-32 mx-auto rounded border border-border object-contain" />
                </div>
              )}
            </div>

            {/* Outside Checkout Toggle */}
            <div className="p-3 bg-secondary/40 border border-border rounded-lg space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOutsideCheckout}
                  onChange={(e) => setIsOutsideCheckout(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                Checkout from Field / Outside Lab (Requires Admin Approval)
              </label>
              {isOutsideCheckout && (
                <input
                  type="text"
                  value={outsideCheckoutReason}
                  onChange={(e) => setOutsideCheckoutReason(e.target.value)}
                  placeholder="e.g. Completed patient home collections"
                  className="w-full h-8 px-2.5 border border-border rounded text-xs bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Shift Notes (Optional)
              </label>
              <textarea
                value={clockOutNotes}
                onChange={(e) => setClockOutNotes(e.target.value)}
                placeholder="e.g. Completed patient home collections..."
                className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-secondary text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowClockOutModal(false)}
                className="px-4 py-2 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-accent cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClockOut}
                disabled={isLoading || gettingLocation || !endMeterImageBase64}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
              >
                {(isLoading || gettingLocation) && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Rejection Modal (for specifying penalty reason) */}
      {rejectModalLogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Ban className="w-5 h-5 text-destructive" /> Reject Outside Request
            </h3>
            <p className="text-xs text-muted-foreground">
              If rejecting a Checkout request, checkout will complete with a <strong>1-hour penalty deduction</strong> from shift working hours.
            </p>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Rejection Note / Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide reason for rejection (e.g. Invalid location photo)"
                className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-secondary text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setRejectModalLogId(null)}
                className="px-4 py-2 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-accent cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
