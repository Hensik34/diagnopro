import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useTimeLogStore, useAuthStore } from '../../stores';
import { useBranchStore } from '../../stores/branchStore';

export function TimeTracking() {
  const { currentBranchId } = useBranchStore();
  const { user } = useAuthStore();
  const {
    activeSession,
    myLogs,
    myTotalHours,
    isLoading,
    error,
    clockIn,
    clockOut,
    fetchActiveSession,
    fetchMyLogs,
    clearError,
  } = useTimeLogStore();

  // Modals state
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  
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
  
  // Location capture
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      fetchActiveSession();
    }
  }, [fetchActiveSession, isAdmin]);

  useEffect(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();
    fetchMyLogs(startDate, endDate);
  }, [selectedMonth, fetchMyLogs, currentBranchId]);

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

  // Start Clock In Flow
  const handleStartClockIn = () => {
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

  // Start Clock Out Flow
  const handleStartClockOut = () => {
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
      alert("Mandatory End Bike Meter Photo is required to clock out!");
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
      const [year, month] = selectedMonth.split('-').map(Number);
      fetchMyLogs(
        new Date(year, month - 1, 1).toISOString(),
        new Date(year, month, 1).toISOString()
      );
    }
  };

  const formatDateTime = (dt: string) => {
    return new Date(dt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dt: string) => {
    return new Date(dt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dt: string) => {
    return new Date(dt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-0.5">Personal Shift Attendance</h1>
          <p className="text-muted-foreground text-xs">
            Shift duration & day-by-day attendance history
          </p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full sm:w-auto h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
        />
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-red-500 hover:text-red-700 font-medium text-xs">Dismiss</button>
        </div>
      )}

      {/* Clock In/Out Main Card for Staff */}
      {!isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              activeSession 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}>
              <Clock className="w-10 h-10" />
            </div>

            {activeSession ? (
              <>
                <div className="py-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">You are clocked in since</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDateTime(activeSession.clock_in)}
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer text-sm"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                  Clock Out & Upload Meter Photo
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">You are not clocked in</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">Start your shift at Lab</p>
                </div>
                <button
                  onClick={handleStartClockIn}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer text-sm"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  Clock In (Start Shift)
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Total Working Hours</span>
            <Timer className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {myTotalHours.toFixed(1)}h
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Accumulated shift duration this month</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Total Shifts Logged</span>
            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {myLogs.length}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Work periods completed</span>
          </div>
        </div>
      </div>

      {/* Day-by-Day Shift Hours History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Day-by-Day Shift Hours History</h2>
        </div>

        {isLoading && myLogs.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading shift history...
          </div>
        ) : myLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-xs">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No shift logs recorded for this month</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left bg-secondary/30">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Clock In</th>
                  <th className="px-4 py-3 font-medium">Clock Out</th>
                  <th className="px-4 py-3 font-medium">Working Hours</th>
                  <th className="px-4 py-3 font-medium">Lab GPS Status</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent/30 transition-colors text-foreground">
                    <td className="px-4 py-3 font-medium">{formatDate(log.clock_in)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatTime(log.clock_in)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {log.clock_out ? formatTime(log.clock_out) : (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">Active Shift</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-foreground">
                      {log.total_hours ? `${log.total_hours} hrs` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {log.location_meta?.clock_in?.verified || log.location_meta?.clock_out?.verified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                          🟢 Lab Verified
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Standard</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                      {log.notes || '—'}
                    </td>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Start Shift (Clock In)</h3>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Location will be verified at Lab Branch and Start Bike Meter photo is required.
            </p>

            {locationError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2.5 rounded text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{locationError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Start Odometer Reading (KM)
              </label>
              <input
                type="number"
                value={startKm}
                onChange={(e) => setStartKm(e.target.value)}
                placeholder="Enter current meter KM"
                className="w-full h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Mandatory Start Bike Meter Photo */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
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
                className="w-full h-10 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 text-xs text-primary hover:bg-primary/5 transition-colors font-medium cursor-pointer"
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

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowClockInModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClockIn}
                disabled={isLoading || gettingLocation || !startMeterImageBase64}
                className="px-4 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
              >
                {(isLoading || gettingLocation) && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Clock In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clock Out Modal */}
      {showClockOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">End Shift (Clock Out)</h3>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Lab location will be verified and End Bike Meter photo upload is mandatory.
            </p>

            {locationError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2.5 rounded text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{locationError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                End Odometer Reading (KM)
              </label>
              <input
                type="number"
                value={endKm}
                onChange={(e) => setEndKm(e.target.value)}
                placeholder="Enter final meter KM"
                className="w-full h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Mandatory End Meter Photo Upload */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
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
                className="w-full h-10 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 text-xs text-primary hover:bg-primary/5 transition-colors font-medium cursor-pointer"
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
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Shift Notes (Optional)
              </label>
              <textarea
                value={clockOutNotes}
                onChange={(e) => setClockOutNotes(e.target.value)}
                placeholder="e.g. Completed patient home collections..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowClockOutModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClockOut}
                disabled={isLoading || gettingLocation || !endMeterImageBase64}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
              >
                {(isLoading || gettingLocation) && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Clock Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
