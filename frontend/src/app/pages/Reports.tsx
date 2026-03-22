import { useState } from 'react';
import { Link } from 'react-router';
import {
  Search,
  Filter,
  FileText,
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Building2,
  ChevronDown,
} from 'lucide-react';

interface Report {
  id: string;
  patientName: string;
  patientId: string;
  testType: string;
  branch: string;
  status: 'pending' | 'in-progress' | 'approved' | 'completed';
  createdDate: string;
  completedDate?: string;
  technician?: string;
  critical: boolean;
}

const MOCK_REPORTS: Report[] = [
  {
    id: 'REP-2024-001234',
    patientName: 'Sarah Jenkins',
    patientId: 'PT-8901',
    testType: 'Complete Blood Count (CBC)',
    branch: 'Main Branch',
    status: 'completed',
    createdDate: '2024-03-13',
    completedDate: '2024-03-13',
    technician: 'Lisa Johnson',
    critical: false,
  },
  {
    id: 'REP-2024-001235',
    patientName: 'Michael Chen',
    patientId: 'PT-7823',
    testType: 'Lipid Profile',
    branch: 'Downtown Center',
    status: 'approved',
    createdDate: '2024-03-13',
    completedDate: '2024-03-13',
    technician: 'Robert Miller',
    critical: false,
  },
  {
    id: 'REP-2024-001236',
    patientName: 'Emma Davis',
    patientId: 'PT-5667',
    testType: 'Thyroid Profile (T3, T4, TSH)',
    branch: 'Main Branch',
    status: 'in-progress',
    createdDate: '2024-03-13',
    technician: 'Lisa Johnson',
    critical: true,
  },
  {
    id: 'REP-2024-001237',
    patientName: 'Robert Williams',
    patientId: 'PT-6745',
    testType: 'Liver Function Test (LFT)',
    branch: 'West Side Lab',
    status: 'pending',
    createdDate: '2024-03-12',
    critical: false,
  },
  {
    id: 'REP-2024-001238',
    patientName: 'Jennifer Martinez',
    patientId: 'PT-4523',
    testType: 'Complete Blood Count (CBC)',
    branch: 'Main Branch',
    status: 'completed',
    createdDate: '2024-03-12',
    completedDate: '2024-03-13',
    technician: 'Lisa Johnson',
    critical: true,
  },
];

export function Reports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const getStatusConfig = (status: Report['status']) => {
    const configs = {
      pending: {
        bg: 'var(--muted)',
        text: 'var(--muted-foreground)',
        label: 'Pending',
        icon: Clock,
      },
      'in-progress': {
        bg: 'var(--warning)',
        text: 'var(--warning-foreground)',
        label: 'In Progress',
        icon: Clock,
      },
      approved: {
        bg: 'var(--primary)',
        text: 'var(--primary-foreground)',
        label: 'Approved',
        icon: CheckCircle,
      },
      completed: {
        bg: 'var(--success)',
        text: 'var(--success-foreground)',
        label: 'Completed',
        icon: CheckCircle,
      },
    };
    return configs[status];
  };

  const filteredReports = MOCK_REPORTS.filter((report) => {
    const matchesSearch =
      report.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.testType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || report.status === statusFilter;

    const matchesBranch =
      branchFilter === 'all' || report.branch === branchFilter;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  const uniqueBranches = [...new Set(MOCK_REPORTS.map((r) => r.branch))];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Reports</h1>
          <p className="text-muted-foreground text-xs">
            View and manage all laboratory reports
          </p>
        </div>
        <Link
          to="/reports/new"
          className="h-8 px-3 flex items-center gap-1.5 rounded text-xs text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <FileText className="w-3.5 h-3.5" />
          Create New Report
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-card border border-border rounded p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search by patient name, ID, or report number..."
              className="w-full h-8 pl-8 pr-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              className="h-8 pl-2.5 pr-7 bg-secondary border border-border rounded text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>

          {/* Branch Filter */}
          <div className="relative">
            <select
              className="h-8 pl-2.5 pr-7 bg-secondary border border-border rounded text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="all">All Branches</option>
              {uniqueBranches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30 sticky top-0">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Report ID
                </th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Test Type
                </th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Created
                </th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Technician
                </th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const statusConfig = getStatusConfig(report.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr
                      key={report.id}
                      className="border-b border-border hover:bg-accent transition-colors"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground font-medium">
                            {report.id}
                          </span>
                          {report.critical && (
                            <AlertTriangle
                              className="w-3.5 h-3.5"
                              style={{ color: 'var(--destructive)' }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-xs text-foreground">
                          {report.patientName}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {report.patientId}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-foreground">
                          {report.testType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-foreground">
                            {report.branch}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                          style={{
                            backgroundColor: statusConfig.bg,
                            color: statusConfig.text,
                          }}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-foreground">
                            {new Date(report.createdDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-foreground">
                          {report.technician || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          {report.status === 'pending' && (
                            <Link
                              to={`/reports/${report.id}/entry`}
                              className="h-7 px-2 flex items-center gap-1 bg-secondary border border-border rounded hover:bg-accent transition-colors text-xs"
                              title="Enter Results"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Enter
                            </Link>
                          )}
                          {(report.status === 'approved' ||
                            report.status === 'completed') && (
                            <Link
                              to={`/reports/${report.id}/preview`}
                              className="h-7 px-2 flex items-center gap-1 bg-secondary border border-border rounded hover:bg-accent transition-colors text-xs"
                              title="View Report"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </Link>
                          )}
                          {report.status === 'in-progress' && (
                            <Link
                              to={`/reports/${report.id}/entry`}
                              className="h-7 px-2 flex items-center gap-1 bg-secondary border border-border rounded hover:bg-accent transition-colors text-xs"
                              title="Continue Entry"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Continue
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No reports found matching your filters
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Total Reports
          </div>
          <div className="text-xl text-foreground font-semibold">
            {MOCK_REPORTS.length}
          </div>
        </div>
        <div className="bg-card border border-border rounded p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Pending
          </div>
          <div className="text-xl text-foreground font-semibold">
            {MOCK_REPORTS.filter((r) => r.status === 'pending').length}
          </div>
        </div>
        <div className="bg-card border border-border rounded p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            In Progress
          </div>
          <div className="text-xl text-foreground font-semibold">
            {MOCK_REPORTS.filter((r) => r.status === 'in-progress').length}
          </div>
        </div>
        <div className="bg-card border border-border rounded p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Completed Today
          </div>
          <div className="text-xl text-foreground font-semibold">
            {
              MOCK_REPORTS.filter(
                (r) =>
                  r.status === 'completed' &&
                  r.completedDate === new Date().toISOString().split('T')[0]
              ).length
            }
          </div>
        </div>
      </div>
    </div>
  );
}
