import { useState, useEffect } from 'react';
import { Clock, Users, Calendar, Timer, ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react';
import { useTimeLogStore } from '../../stores';
import { useBranchStore } from '../../stores/branchStore';
import type { TimeLog } from '../../api/timeLogs';

const ROLE_LABELS: Record<string, string> = {
  staff: 'Staff',
  lab_technician: 'Lab Technician',
  doctor: 'Doctor',
};

const ROLE_COLORS: Record<string, string> = {
  staff: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  lab_technician: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  doctor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export function WorkingHours() {
  const { currentBranchId } = useBranchStore();
  const {
    userSummary,
    totalHoursAll,
    isLoading,
    error,
    fetchUserSummary,
    fetchUserLogs,
    deleteLog,
    clearError,
  } = useTimeLogStore();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userLogs, setUserLogs] = useState<TimeLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();
    fetchUserSummary(startDate, endDate);
  }, [selectedMonth, fetchUserSummary, currentBranchId]);

  const handleExpandUser = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setUserLogs([]);
      return;
    }
    setExpandedUser(userId);
    setLoadingLogs(true);
    const [year, month] = selectedMonth.split('-').map(Number);
    const logs = await fetchUserLogs(
      userId,
      new Date(year, month - 1, 1).toISOString(),
      new Date(year, month, 1).toISOString()
    );
    setUserLogs(logs);
    setLoadingLogs(false);
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this time log?')) return;
    const success = await deleteLog(logId);
    if (success) {
      setUserLogs((prev) => prev.filter((l) => l.id !== logId));
      // Refresh summary
      const [year, month] = selectedMonth.split('-').map(Number);
      fetchUserSummary(
        new Date(year, month - 1, 1).toISOString(),
        new Date(year, month, 1).toISOString()
      );
    }
  };

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatTime = (dt: string) =>
    new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const totalSessions = userSummary.reduce((sum, u) => sum + Number(u.total_sessions), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Working Hours</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage staff working hours
          </p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-500 hover:text-red-700 font-medium">Dismiss</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userSummary.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Timer className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalHoursAll}h</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Staff Hours Summary</h2>
        </div>

        {isLoading && userSummary.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : userSummary.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No time records for this period</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {userSummary.map((user) => (
              <div key={user.user_id}>
                <button
                  onClick={() => handleExpandUser(user.user_id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.firstname?.[0]}{user.lastname?.[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.firstname} {user.lastname}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium ${
                      ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'
                    }`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{Number(user.total_hours).toFixed(1)}h</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.total_sessions} sessions</p>
                    </div>
                    {expandedUser === user.user_id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded user logs */}
                {expandedUser === user.user_id && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 px-4 pb-4">
                    {loadingLogs ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    ) : userLogs.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No logs found</p>
                    ) : (
                      <table className="w-full text-sm mt-2">
                        <thead>
                          <tr className="text-left text-gray-500 dark:text-gray-400">
                            <th className="pb-2 font-medium">Date</th>
                            <th className="pb-2 font-medium">Clock In</th>
                            <th className="pb-2 font-medium">Clock Out</th>
                            <th className="pb-2 font-medium">Hours</th>
                            <th className="pb-2 font-medium">Notes</th>
                            <th className="pb-2 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {userLogs.map((log) => (
                            <tr key={log.id} className="text-gray-700 dark:text-gray-300">
                              <td className="py-2">{formatDate(log.clock_in)}</td>
                              <td className="py-2">{formatTime(log.clock_in)}</td>
                              <td className="py-2">
                                {log.clock_out ? formatTime(log.clock_out) : (
                                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>
                                )}
                              </td>
                              <td className="py-2 font-medium">{log.total_hours ? `${log.total_hours}h` : '—'}</td>
                              <td className="py-2 text-gray-500 max-w-[150px] truncate">{log.notes || '—'}</td>
                              <td className="py-2">
                                <button
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Delete log"
                                >
                                  <Trash2 className="w-4 h-4" />
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
  );
}
