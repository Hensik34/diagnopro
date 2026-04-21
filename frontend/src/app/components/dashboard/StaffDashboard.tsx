import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useTimeLogStore } from '../../../stores/timeLogStore';
import { useReportStore } from '../../../stores/reportStore';
import { useAuthStore } from '../../../stores/authStore';

export function StaffDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    activeSession,
    isLoading: timeLoading,
    clockIn,
    clockOut,
    fetchActiveSession,
  } = useTimeLogStore();
  const { reports, fetchReports, isLoading: reportsLoading } = useReportStore();

  const [elapsedTime, setElapsedTime] = useState('');
  const [clockOutNotes, setClockOutNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);

  useEffect(() => {
    fetchActiveSession();
    fetchReports({});
  }, [fetchActiveSession, fetchReports]);

  // Live elapsed timer
  useEffect(() => {
    if (!activeSession) {
      setElapsedTime('');
      return;
    }
    const updateTimer = () => {
      const start = new Date(activeSession.clock_in).getTime();
      const now = Date.now();
      const diff = now - start;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleClockIn = async () => {
    await clockIn();
    fetchActiveSession();
  };

  const handleClockOutClick = () => {
    setShowNotesModal(true);
  };

  const handleClockOutConfirm = async () => {
    await clockOut(clockOutNotes || undefined);
    setShowNotesModal(false);
    setClockOutNotes('');
  };

  // Categorize reports for work list
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

  return (
    <div className="space-y-4">
      {/* Greeting Header */}
      <div>
        <h1 className="text-foreground text-lg mb-0.5">
          {greeting()}, {user?.firstname}!
        </h1>
        <p className="text-muted-foreground text-xs">
          {roleLabel} Dashboard
        </p>
      </div>

      {/* Clock In/Out Card - Prominent at top */}
      <div className={`rounded-xl border-2 p-5 transition-all ${
        activeSession 
          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
          : 'border-border bg-card'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              activeSession 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-secondary text-muted-foreground'
            }`}>
              <Clock className="w-7 h-7" />
            </div>
            <div>
              {activeSession ? (
                <>
                  <p className="text-xs text-muted-foreground">Clocked in since {new Date(activeSession.clock_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-3xl font-mono font-bold text-green-600 dark:text-green-400">{elapsedTime}</p>
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
              onClick={handleClockOutClick}
              disabled={timeLoading}
              className="h-10 px-5 inline-flex items-center gap-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {timeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Clock Out
            </button>
          ) : (
            <button
              onClick={handleClockIn}
              disabled={timeLoading}
              className="h-10 px-5 inline-flex items-center gap-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {timeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Clock In
            </button>
          )}
        </div>
      </div>

      {/* Work Summary Cards */}
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

      {/* Work List - Pending Reports */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
          <h2 className="text-foreground text-sm font-medium">Your Work Queue</h2>
          <button
            onClick={() => navigate('/reports')}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {reportsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : pendingReports.length === 0 && processingReports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No pending work right now</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Report</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Patient</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...pendingReports, ...processingReports].slice(0, 10).map((report) => (
                  <tr 
                    key={report.id} 
                    className="hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/reports/${report.id}/entry`)}
                  >
                    <td className="px-3 py-2">
                      <span className="text-xs text-foreground font-medium">
                        {report.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-foreground">
                        {report.patient_name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs text-muted-foreground">
                        {report.report_type || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                        report.status === 'processing' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clock Out Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Clock Out</h3>
            <p className="text-sm text-muted-foreground mb-3">Add notes about your shift (optional)</p>
            <textarea
              value={clockOutNotes}
              onChange={(e) => setClockOutNotes(e.target.value)}
              placeholder="e.g. Completed sample processing, attended to walk-in patients..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-secondary text-foreground resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowNotesModal(false); setClockOutNotes(''); }}
                className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleClockOutConfirm}
                disabled={timeLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {timeLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Clock Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
