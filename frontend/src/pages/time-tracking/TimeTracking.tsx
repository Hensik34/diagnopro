import { useState, useEffect, useCallback } from 'react';
import { Clock, LogIn, LogOut, Calendar, Timer, Loader2 } from 'lucide-react';
import { useTimeLogStore } from '../../stores';
import { useBranchStore } from '../../stores/branchStore';

export function TimeTracking() {
  const { currentBranchId } = useBranchStore();
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

  const [clockOutNotes, setClockOutNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  useEffect(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();
    fetchMyLogs(startDate, endDate);
  }, [selectedMonth, fetchMyLogs, currentBranchId]);

  // Active timer logic removed as requested

  const handleClockIn = async () => {
    await clockIn();
    fetchActiveSession();
  };

  const handleClockOutClick = () => {
    setShowNotesModal(true);
  };

  const handleClockOutConfirm = async () => {
    const success = await clockOut(clockOutNotes || undefined);
    if (success) {
      setShowNotesModal(false);
      setClockOutNotes('');
      // Refresh logs
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
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-0.5">Time Tracking</h1>
          <p className="text-muted-foreground text-xs">
            Track your working hours with clock in/out
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-500 hover:text-red-700 font-medium">Dismiss</button>
        </div>
      )}

      {/* Clock In/Out Card */}
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
              </div>
              <button
                onClick={handleClockOutClick}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                Clock Out
              </button>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">You are not clocked in</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Start your shift</p>
              </div>
              <button
                onClick={handleClockIn}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                Clock In
              </button>
            </>
          )}
        </div>
      </div>

      {/* My History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My History</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Timer className="w-4 h-4" />
              Total: <strong className="text-gray-900 dark:text-white">{myTotalHours}h</strong>
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {isLoading && myLogs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : myLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No time logs for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Clock In</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Clock Out</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Hours</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {myLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{formatDate(log.clock_in)}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatTime(log.clock_in)}</td>
                    <td className="px-4 py-3">
                      {log.clock_out ? (
                        <span className="text-gray-700 dark:text-gray-300">{formatTime(log.clock_out)}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {log.total_hours ? `${log.total_hours}h` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                      {log.notes || '—'}
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
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Clock Out</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Add notes about your shift (optional)
            </p>
            <textarea
              value={clockOutNotes}
              onChange={(e) => setClockOutNotes(e.target.value)}
              placeholder="e.g. Completed sample processing, attended to walk-in patients..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowNotesModal(false); setClockOutNotes(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleClockOutConfirm}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Clock Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
