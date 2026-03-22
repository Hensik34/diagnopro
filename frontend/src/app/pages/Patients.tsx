import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  FileText, 
  Edit, 
  Eye, 
  Calendar as CalendarIcon,
  ChevronDown,
  Download
} from 'lucide-react';

// Mock Data
const MOCK_PATIENTS = [
  { id: 'PT-8901', name: 'Sarah Jenkins', age: 34, gender: 'F', mobile: '+1 (555) 012-3456', test: 'Complete Blood Count', status: 'Pending', branch: 'Central Lab - Downtown', date: '2024-02-26' },
  { id: 'PT-8902', name: 'Michael Chen', age: 52, gender: 'M', mobile: '+1 (555) 012-3457', test: 'Lipid Profile', status: 'Approved', branch: 'North Branch', date: '2024-02-26' },
  { id: 'PT-8903', name: 'Emma Wilson', age: 28, gender: 'F', mobile: '+1 (555) 012-3458', test: 'Thyroid Panel', status: 'Critical', branch: 'Central Lab - Downtown', date: '2024-02-26' },
  { id: 'PT-8904', name: 'James Rodriguez', age: 45, gender: 'M', mobile: '+1 (555) 012-3459', test: 'Liver Function Test', status: 'Approved', branch: 'West Side Laboratory', date: '2024-02-25' },
  { id: 'PT-8905', name: 'Linda Kim', age: 61, gender: 'F', mobile: '+1 (555) 012-3460', test: 'HbA1c', status: 'Pending', branch: 'North Branch', date: '2024-02-25' },
  { id: 'PT-8906', name: 'Robert Taylor', age: 72, gender: 'M', mobile: '+1 (555) 012-3461', test: 'Renal Profile', status: 'Critical', branch: 'Central Lab - Downtown', date: '2024-02-25' },
  { id: 'PT-8907', name: 'David Miller', age: 39, gender: 'M', mobile: '+1 (555) 012-3462', test: 'Vitamin D', status: 'Approved', branch: 'East Medical Center', date: '2024-02-24' },
  { id: 'PT-8908', name: 'Jennifer Davis', age: 24, gender: 'F', mobile: '+1 (555) 012-3463', test: 'Urinalysis', status: 'Pending', branch: 'Central Lab - Downtown', date: '2024-02-24' },
  { id: 'PT-8909', name: 'William Anderson', age: 55, gender: 'M', mobile: '+1 (555) 012-3464', test: 'PSA Test', status: 'Approved', branch: 'West Side Laboratory', date: '2024-02-24' },
  { id: 'PT-8910', name: 'Elizabeth Martinez', age: 48, gender: 'F', mobile: '+1 (555) 012-3465', test: 'Iron Studies', status: 'Pending', branch: 'North Branch', date: '2024-02-23' },
  { id: 'PT-8911', name: 'Christopher Lee', age: 67, gender: 'M', mobile: '+1 (555) 012-3466', test: 'Cardiac Markers', status: 'Critical', branch: 'Central Lab - Downtown', date: '2024-02-23' },
  { id: 'PT-8912', name: 'Patricia Brown', age: 41, gender: 'F', mobile: '+1 (555) 012-3467', test: 'Blood Culture', status: 'Pending', branch: 'East Medical Center', date: '2024-02-23' },
];

export function Patients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');

  const filteredPatients = MOCK_PATIENTS.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          patient.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || patient.status === statusFilter;
    const matchesBranch = branchFilter === 'All' || patient.branch === branchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      Approved: {
        bg: 'var(--success)',
        text: 'var(--success-foreground)',
      },
      Pending: {
        bg: 'var(--warning)',
        text: 'var(--warning-foreground)',
      },
      Critical: {
        bg: 'var(--destructive)',
        text: 'var(--destructive-foreground)',
      },
    };

    const style = styles[status as keyof typeof styles];

    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {status}
      </span>
    );
  };

  const criticalCount = filteredPatients.filter(p => p.status === 'Critical').length;
  const pendingCount = filteredPatients.filter(p => p.status === 'Pending').length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Patients</h1>
          <p className="text-muted-foreground text-xs">
            Manage patient records and test status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-2.5 flex items-center gap-1.5 bg-card border border-border rounded hover:bg-accent transition-colors text-xs">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs">
            <Plus className="w-3.5 h-3.5" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-card border border-border rounded p-2.5">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
            <input 
              type="text"
              placeholder="Search by name or ID..."
              className="w-full h-8 pl-8 pr-3 bg-secondary border-0 rounded text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="h-6 w-px bg-border"></div>

          <select 
            className="h-8 text-xs bg-secondary border-0 rounded px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="All">All Branches</option>
            <option value="Central Lab - Downtown">Central Lab - Downtown</option>
            <option value="North Branch">North Branch</option>
            <option value="West Side Laboratory">West Side Laboratory</option>
            <option value="East Medical Center">East Medical Center</option>
          </select>

          <select 
            className="h-8 text-xs bg-secondary border-0 rounded px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Critical">Critical</option>
          </select>
          
          <button className="h-8 px-2.5 flex items-center gap-1.5 bg-secondary border-0 rounded hover:bg-accent transition-colors text-xs">
            <CalendarIcon className="w-3.5 h-3.5" />
            Date
          </button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 text-xs border-l border-border pl-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 rounded">
              <div className="w-2 h-2 rounded-full bg-destructive"></div>
              <span style={{ color: 'var(--destructive)' }}>{criticalCount} Critical</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warning"></div>
            <span className="text-muted-foreground">{pendingCount} Pending</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30 sticky top-0 z-10">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Patient ID</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Age/Gender</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Mobile Number</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Test Name</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Branch</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPatients.map((patient) => (
                <tr 
                  key={patient.id} 
                  className={`hover:bg-accent/30 transition-colors ${
                    patient.status === 'Critical' ? 'border-l-2' : ''
                  }`}
                  style={patient.status === 'Critical' ? { borderLeftColor: 'var(--destructive)' } : undefined}
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                    {patient.id}
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground">
                    {patient.name}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                    {patient.age} / {patient.gender}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                    {patient.mobile}
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground">
                    {patient.test}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {getStatusBadge(patient.status)}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {patient.branch}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
                        title="View"
                        style={{ color: 'var(--primary)' }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
                        title="Generate Report"
                        style={{ color: 'var(--success)' }}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Showing <span className="text-foreground">{filteredPatients.length}</span> of <span className="text-foreground">{MOCK_PATIENTS.length}</span> patients
          </div>
          <div className="flex gap-1">
            <button className="h-7 px-2.5 text-xs border border-border bg-card rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Previous
            </button>
            <button className="h-7 px-2.5 text-xs border border-border bg-card rounded hover:bg-accent">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}