import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, Users, FileText, Activity, Calendar, Download, Filter, Loader2, X
} from 'lucide-react';
import { reportApi } from '../../api/reports';
import { useBranchStore } from '../../stores';

interface AnalyticsData {
  monthlyReports: Array<{ month: string; total: number; approved: number; draft: number }>;
  reportsByDoctor: Array<{ name: string; reports: number; percentage: number }>;
  referralSources: Array<{ name: string; value: number; percentage: number }>;
  stats: {
    totalReports: number;
    approvedReports: number;
    draftReports: number;
    doctorReferrals: number;
    selfReferrals: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const DOCTOR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function Analytics() {
  const { currentBranchId } = useBranchStore();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    monthlyReports: [],
    reportsByDoctor: [],
    referralSources: [],
    stats: {
      totalReports: 0,
      approvedReports: 0,
      draftReports: 0,
      doctorReferrals: 0,
      selfReferrals: 0,
    }
  });
  const [monthsBack, setMonthsBack] = useState(6);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    // Initialize date range if using custom date
    if (useCustomDate && !fromDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
      setToDate(today.toISOString().split('T')[0]);
    }
  }, [useCustomDate]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [currentBranchId, monthsBack, useCustomDate, fromDate, toDate]);

  const fetchAnalyticsData = async () => {
    if (!currentBranchId) return;
    
    setIsLoading(true);
    try {
      const res = await reportApi.getAll({ branch_id: currentBranchId });
      const reports = res.data || [];

      // Determine date range
      let startDate: Date, endDate: Date;
      let dayCount: number;

      if (useCustomDate && fromDate && toDate) {
        startDate = new Date(fromDate);
        endDate = new Date(toDate);
        dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        const today = new Date();
        endDate = today;
        startDate = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
        dayCount = monthsBack * 30;
      }

      // Filter reports by date range
      const filteredReports = reports.filter((report: any) => {
        const reportDate = new Date(report.created_at);
        return reportDate >= startDate && reportDate <= endDate;
      });

      // Generate monthly data
      const monthlyMap = new Map<string, any>();
      
      // Determine if we should show by day or month based on date range
      const showByDay = dayCount <= 31;
      
      if (showByDay) {
        // Generate daily data for 30 days or less
        for (let i = dayCount; i >= 0; i--) {
          const date = new Date(endDate);
          date.setDate(date.getDate() - i);
          const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          monthlyMap.set(dateKey, { month: dateKey, total: 0, approved: 0, draft: 0 });
        }
      } else {
        // Generate monthly data
        let currentMonth = new Date(startDate);
        while (currentMonth <= endDate) {
          const monthKey = currentMonth.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          monthlyMap.set(monthKey, { month: monthKey, total: 0, approved: 0, draft: 0 });
          currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        }
      }

      // Count reports by period
      filteredReports.forEach((report: any) => {
        const reportDate = new Date(report.created_at);
        let periodKey: string;
        
        if (showByDay) {
          periodKey = reportDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          periodKey = reportDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }
        
        if (monthlyMap.has(periodKey)) {
          const entry = monthlyMap.get(periodKey)!;
          entry.total += 1;
          if (report.status === 'approved') entry.approved += 1;
          if (report.status === 'draft') entry.draft += 1;
        }
      });

      const monthlyReports = Array.from(monthlyMap.values());

      // Count reports by doctor
      const doctorMap = new Map<string, number>();
      let selfReferrals = 0;

      filteredReports.forEach((report: any) => {
        if (report.doctor_id && report.doctor_name) {
          doctorMap.set(report.doctor_name, (doctorMap.get(report.doctor_name) || 0) + 1);
        } else {
          selfReferrals += 1;
        }
      });

      const totalDoctorReports = filteredReports.filter((r: any) => r.doctor_id).length;
      const reportsByDoctor = Array.from(doctorMap.entries())
        .map(([name, count]) => ({
          name: name.substring(0, 20),
          reports: count,
          percentage: Math.round((count / filteredReports.length) * 100)
        }))
        .sort((a, b) => b.reports - a.reports)
        .slice(0, 8);

      // Referral sources
      const referralSources = [
        { 
          name: 'Doctor Referrals', 
          value: totalDoctorReports,
          percentage: filteredReports.length > 0 ? Math.round((totalDoctorReports / filteredReports.length) * 100) : 0
        },
        { 
          name: 'Self-Referred', 
          value: selfReferrals,
          percentage: filteredReports.length > 0 ? Math.round((selfReferrals / filteredReports.length) * 100) : 0
        }
      ];

      setData({
        monthlyReports,
        reportsByDoctor,
        referralSources,
        stats: {
          totalReports: filteredReports.length,
          approvedReports: filteredReports.filter((r: any) => r.status === 'approved').length,
          draftReports: filteredReports.filter((r: any) => r.status === 'draft').length,
          doctorReferrals: totalDoctorReports,
          selfReferrals: selfReferrals,
        }
      });
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ label, value, subtext, icon: Icon, trend, color }: any) => (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold tabular-nums">{value}</span>
            {trend && (
              <span className={`text-xs font-medium ${trend > 0 ? 'text-success' : 'text-destructive'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtext && <p className="text-muted-foreground text-xs">{subtext}</p>}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold mb-1">Business Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Real-time insights into lab performance and patient referrals
          </p>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          {!useCustomDate ? (
            <>
              <select 
                value={monthsBack}
                onChange={(e) => setMonthsBack(parseInt(e.target.value))}
                className="h-9 px-3 bg-card border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
              </select>
              <button 
                onClick={() => setUseCustomDate(true)}
                className="h-9 px-3 bg-card border border-border rounded text-sm text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Custom Date
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">From:</label>
                <input 
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 px-2.5 bg-card border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">To:</label>
                <input 
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 px-2.5 bg-card border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button 
                onClick={() => setUseCustomDate(false)}
                className="h-9 px-3 bg-card border border-border rounded text-sm text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          label="Total Reports"
          value={data.stats.totalReports}
          subtext="All report submissions"
          icon={FileText}
          color="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          label="Approved"
          value={data.stats.approvedReports}
          subtext={`${data.stats.totalReports > 0 ? Math.round((data.stats.approvedReports / data.stats.totalReports) * 100) : 0}% of total`}
          icon={Activity}
          color="bg-success/10 text-success"
        />
        <StatCard
          label="Draft"
          value={data.stats.draftReports}
          subtext="Pending submission"
          icon={FileText}
          color="bg-warning/10 text-warning"
        />
        <StatCard
          label="Doctor Referrals"
          value={data.stats.doctorReferrals}
          subtext={`${data.stats.totalReports > 0 ? Math.round((data.stats.doctorReferrals / data.stats.totalReports) * 100) : 0}% of patients`}
          icon={Users}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label="Self-Referred"
          value={data.stats.selfReferrals}
          subtext={`${data.stats.totalReports > 0 ? Math.round((data.stats.selfReferrals / data.stats.totalReports) * 100) : 0}% of patients`}
          icon={TrendingUp}
          color="bg-purple-500/10 text-purple-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Monthly Reports Trend */}
        <div className="col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-foreground font-semibold text-sm">Reports Over Time</h2>
            <Filter className="w-4 h-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.monthlyReports}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '6px'
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorTotal)"
                name="Total Reports"
              />
              <Area 
                type="monotone" 
                dataKey="approved" 
                stroke="#10b981" 
                fillOpacity={0.1}
                name="Approved"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Referral Sources */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-foreground font-semibold text-sm mb-4">Referral Sources</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.referralSources}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.referralSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => `${value} reports`}
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#f3f4f6'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {data.referralSources.map((source, idx) => (
              <div key={source.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{source.name}</span>
                </div>
                <span className="text-foreground font-medium">{source.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reports by Doctor */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-foreground font-semibold text-sm mb-4">Top Referring Doctors</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.reportsByDoctor}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280" 
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '6px'
              }}
              labelStyle={{ color: '#f3f4f6' }}
              formatter={(value: any) => `${value} reports`}
            />
            <Bar dataKey="reports" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Reports Submitted" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics Table */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-foreground font-semibold text-sm mb-4">Report Status Distribution</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="border border-border rounded p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Approved</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-success">{data.stats.approvedReports}</span>
              <span className="text-xs text-muted-foreground">
                {data.stats.totalReports > 0 ? Math.round((data.stats.approvedReports / data.stats.totalReports) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="border border-border rounded p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Draft</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-warning">{data.stats.draftReports}</span>
              <span className="text-xs text-muted-foreground">
                {data.stats.totalReports > 0 ? Math.round((data.stats.draftReports / data.stats.totalReports) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="border border-border rounded p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Total</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{data.stats.totalReports}</span>
              <span className="text-xs text-muted-foreground">100%</span>
            </div>
          </div>
          <div className="border border-border rounded p-3 bg-primary/5">
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Avg per Doctor</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {data.reportsByDoctor.length > 0 
                  ? Math.round(data.stats.doctorReferrals / data.reportsByDoctor.length) 
                  : 0}
              </span>
              <span className="text-xs text-muted-foreground">per doctor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
