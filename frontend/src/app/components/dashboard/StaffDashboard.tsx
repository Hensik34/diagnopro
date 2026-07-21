import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  FileText, 
  Loader2,
  Syringe,
  ClipboardList,
  ArrowRight,
  UserPlus,
  Camera,
  AlertCircle,
  Gauge,
  X,
  User as UserIcon,
  Plus
} from 'lucide-react';
import { useTimeLogStore } from '../../../stores/timeLogStore';
import { useReportStore } from '../../../stores/reportStore';
import { useAuthStore } from '../../../stores/authStore';
import { useBranchStore } from '../../../stores/branchStore';
import { patientApi } from '../../../api/patients';
import type { Patient, AgeUnit } from '../../../types';

export function StaffDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentBranchId } = useBranchStore();
  const {
    activeSession,
    isLoading: timeLoading,
    error: timeError,
    clockIn,
    clockOut,
    fetchActiveSession,
    clearError,
  } = useTimeLogStore();
  const { reports, fetchReports, isLoading: reportsLoading } = useReportStore();

  // Modals state
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);

  // Clock In state
  const [startKm, setStartKm] = useState('');
  const startImageInputRef = useRef<HTMLInputElement>(null);
  const [startMeterImageBase64, setStartMeterImageBase64] = useState<string | null>(null);
  const [startMeterImageName, setStartMeterImageName] = useState<string | null>(null);

  // Clock Out state
  const [endKm, setEndKm] = useState('');
  const [clockOutNotes, setClockOutNotes] = useState('');
  const endImageInputRef = useRef<HTMLInputElement>(null);
  const [endMeterImageBase64, setEndMeterImageBase64] = useState<string | null>(null);
  const [endMeterImageName, setEndMeterImageName] = useState<string | null>(null);

  // Location capture state
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Patient Register Form State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientAgeUnit, setPatientAgeUnit] = useState<AgeUnit>('years');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female'>('Male');
  const [patientAddress, setPatientAddress] = useState('');
  const [patientCity, setPatientCity] = useState('');
  const [patientBloodType, setPatientBloodType] = useState('');
  const [savingPatient, setSavingPatient] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);

  // Today's Patients created by logged in staff
  const [todayPatients, setTodayPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      fetchActiveSession();
    }
    if (user?.role !== 'staff') {
      const filters = currentBranchId ? { branch_id: currentBranchId } : {};
      fetchReports(filters);
    }
  }, [fetchActiveSession, fetchReports, currentBranchId, user, isAdmin]);

  useEffect(() => {
    if (user?.id) {
      fetchTodayPatients();
    }
  }, [user?.id, currentBranchId]);

  const fetchTodayPatients = async () => {
    if (!user?.id) return;
    setLoadingPatients(true);
    try {
      const res = await patientApi.getAll({
        created_by: user.id,
        today_only: true,
        branch_id: currentBranchId || undefined,
      });
      setTodayPatients(res.data || []);
    } catch (err) {
      console.error("Failed to fetch today's added patients:", err);
    } finally {
      setLoadingPatients(false);
    }
  };

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

  // Start Clock In
  const handleOpenClockInModal = () => {
    setStartKm('');
    setStartMeterImageBase64(null);
    setStartMeterImageName(null);
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
    if (!startMeterImageBase64) {
      alert("Start Bike Meter photo is required to start shift!");
      return;
    }

    const coords = await getCoordinates();
    const success = await clockIn({
      start_km: startKm ? parseFloat(startKm) : undefined,
      start_meter_image: startMeterImageBase64,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    });

    if (success) {
      setShowClockInModal(false);
      fetchActiveSession();
    }
  };

  // Start Clock Out
  const handleOpenClockOutModal = () => {
    setEndKm('');
    setClockOutNotes('');
    setEndMeterImageBase64(null);
    setEndMeterImageName(null);
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
    if (!endMeterImageBase64) {
      alert("End Bike Meter photo is required to clock out!");
      return;
    }

    const coords = await getCoordinates();
    const success = await clockOut({
      notes: clockOutNotes || undefined,
      end_km: endKm ? parseFloat(endKm) : undefined,
      end_meter_image: endMeterImageBase64,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    });

    if (success) {
      setShowClockOutModal(false);
      fetchActiveSession();
    }
  };

  // Patient Registration submit
  const handleRegisterPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim() || !patientAge.trim()) {
      setPatientError("Patient Name, Phone, and Age are required");
      return;
    }
    if (!currentBranchId) {
      setPatientError("Please select a Branch first");
      return;
    }

    setSavingPatient(true);
    setPatientError(null);

    try {
      await patientApi.create({
        name: patientName.trim(),
        phone: patientPhone.trim(),
        age: parseInt(patientAge, 10),
        age_unit: patientAgeUnit,
        gender: patientGender,
        address: patientAddress.trim() || undefined,
        city: patientCity.trim() || undefined,
        blood_type: patientBloodType.trim() || undefined,
        branch_id: currentBranchId,
      });

      setShowPatientModal(false);
      setPatientName('');
      setPatientPhone('');
      setPatientAge('');
      setPatientAddress('');
      setPatientCity('');
      setPatientBloodType('');
      fetchTodayPatients();
    } catch (err: any) {
      setPatientError(err?.response?.data?.error || err.message || "Failed to register patient");
    } finally {
      setSavingPatient(false);
    }
  };

  // Categorize reports
  const pendingReports = reports.filter(r => r.status === 'draft' || r.status === 'rejected');
  const processingReports = reports.filter(r => r.status === 'under_review');
  const completedToday = reports.filter(r => {
    const today = new Date().toDateString();
    return r.status === 'approved' && new Date(r.updated_at).toDateString() === today;
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const roleLabel = user?.role === 'lab_technician' ? 'Technician' : user?.role === 'staff' ? 'Staff' : user?.role || '';

  const formatTime = (dt: string) => {
    return new Date(dt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">
            {greeting()}, {user?.firstname}!
          </h1>
          <p className="text-muted-foreground text-xs">
            {roleLabel} Dashboard
          </p>
        </div>
        <button
          onClick={() => {
            setPatientError(null);
            setShowPatientModal(true);
          }}
          className="h-9 px-3.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 w-full sm:w-auto justify-center shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          + Register Patient
        </button>
      </div>

      {/* Time Tracking Error Banner */}
      {timeError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-xs text-red-700 dark:text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{timeError}</span>
          </div>
          <button onClick={clearError} className="text-red-500 hover:text-red-700 font-medium">Dismiss</button>
        </div>
      )}

      {/* Clock In/Out Card - Only for Non-Admin Staff */}
      {!isAdmin && (
        <div className={`rounded-xl border-2 p-5 transition-all ${
          activeSession 
            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
            : 'border-border bg-card'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                activeSession 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                <Clock className="w-7 h-7" />
              </div>
              <div>
                {activeSession ? (
                  <>
                    <p className="text-sm font-medium text-foreground">You are clocked in</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Started shift at {new Date(activeSession.clock_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {activeSession.start_km != null && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5" /> Start Odometer: <strong>{activeSession.start_km} KM</strong>
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">You are not clocked in</p>
                    <p className="text-xs text-muted-foreground">Start your shift to begin tracking</p>
                  </>
                )}
              </div>
            </div>
            
            {activeSession ? (
              <button
                onClick={handleOpenClockOutModal}
                disabled={timeLoading}
                className="h-10 px-5 inline-flex items-center gap-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center cursor-pointer"
              >
                {timeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                Clock Out
              </button>
            ) : (
              <button
                onClick={handleOpenClockInModal}
                disabled={timeLoading}
                className="h-10 px-5 inline-flex items-center gap-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center cursor-pointer"
              >
                {timeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                Clock In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tech / Admin Work Summary Cards */}
      {user?.role !== 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Pending Work</span>
              <ClipboardList className="w-3.5 h-3.5 text-warning" />
            </div>
            <div className="text-foreground text-xl tabular-nums">{pendingReports.length}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Reports to process</div>
          </div>

          <div className="bg-card border border-border rounded p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider">In Progress</span>
              <Syringe className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-foreground text-xl tabular-nums">{processingReports.length}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Being processed</div>
          </div>

          <div className="bg-card border border-border rounded p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Completed Today</span>
              <FileText className="w-3.5 h-3.5 text-success" />
            </div>
            <div className="text-foreground text-xl tabular-nums">{completedToday.length}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Done today</div>
          </div>
        </div>
      )}

      {/* My Added Patients Today Card */}
      <div className="bg-card border border-border rounded p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">My Added Patients Today</h2>
            <span className="px-2 py-0.5 text-[11px] bg-primary/10 text-primary rounded-full font-medium">
              {todayPatients.length}
            </span>
          </div>
          <button 
            onClick={fetchTodayPatients}
            className="text-xs text-primary hover:underline font-medium"
          >
            Refresh List
          </button>
        </div>

        {loadingPatients ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading today's patients...
          </div>
        ) : todayPatients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No patients added by you today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left bg-secondary/30">
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Patient Name</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Age / Gender</th>
                  <th className="px-3 py-2">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {todayPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatTime(p.created_at)}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{p.name}</td>
                    <td className="px-3 py-2 text-foreground">{p.phone || '—'}</td>
                    <td className="px-3 py-2 text-foreground">{p.age} {p.age_unit || 'yrs'} ({p.gender || '—'})</td>
                    <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{p.address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clock In Modal */}
      {showClockInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-foreground">Start Shift (Clock In)</h3>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Location will be verified at Lab Branch and Start Bike Meter photo is required.
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

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowClockInModal(false)}
                className="px-4 py-2 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-accent cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClockIn}
                disabled={timeLoading || gettingLocation || !startMeterImageBase64}
                className="px-4 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
              >
                {(timeLoading || gettingLocation) && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Clock In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clock Out Modal */}
      {showClockOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-foreground">End Shift (Clock Out)</h3>
            </div>

            <p className="text-xs text-muted-foreground">
              Lab location will be verified and End Bike Meter photo upload is mandatory.
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
                disabled={timeLoading || gettingLocation || !endMeterImageBase64}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
              >
                {(timeLoading || gettingLocation) && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Clock Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Patient Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Register Field Patient</h3>
              </div>
              <button
                onClick={() => setShowPatientModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {patientError && (
              <div className="bg-destructive/10 border border-destructive/20 p-2.5 rounded text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{patientError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterPatientSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient full name"
                  className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Gender *</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as 'Male' | 'Female')}
                    className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Age *</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 35"
                    className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Age Unit</label>
                  <select
                    value={patientAgeUnit}
                    onChange={(e) => setPatientAgeUnit(e.target.value as AgeUnit)}
                    className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="years">Years</option>
                    <option value="months">Months</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Address</label>
                <input
                  type="text"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  placeholder="Street / house address"
                  className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">City</label>
                  <input
                    type="text"
                    value={patientCity}
                    onChange={(e) => setPatientCity(e.target.value)}
                    placeholder="City"
                    className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Blood Group</label>
                  <input
                    type="text"
                    value={patientBloodType}
                    onChange={(e) => setPatientBloodType(e.target.value)}
                    placeholder="e.g. B+"
                    className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="px-4 py-2 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPatient}
                  className="px-4 py-2 text-xs font-medium text-white bg-primary rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {savingPatient && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
