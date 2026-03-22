import { useState } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Activity, 
  TrendingUp, 
  Users,
  Edit,
  MoreVertical,
  X,
  Phone,
  Mail,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
  phone: string;
  email: string;
  status: 'operational' | 'maintenance' | 'closed';
  todayCases: number;
  todayRevenue: number;
  occupancy: number;
  staff: number;
  equipment: string;
  openingHours: string;
}

const MOCK_BRANCHES: Branch[] = [
  {
    id: 'BR-001',
    name: 'Central Lab - Downtown',
    location: '123 Medical Plaza, Downtown',
    manager: 'Dr. Sarah Mitchell',
    phone: '+1 (555) 100-2001',
    email: 'central@medlab.com',
    status: 'operational',
    todayCases: 187,
    todayRevenue: 24850,
    occupancy: 78,
    staff: 24,
    equipment: 'Full Service',
    openingHours: '6:00 AM - 10:00 PM',
  },
  {
    id: 'BR-002',
    name: 'North Branch',
    location: '456 Healthcare Ave, North District',
    manager: 'Dr. Michael Chen',
    phone: '+1 (555) 100-2002',
    email: 'north@medlab.com',
    status: 'operational',
    todayCases: 142,
    todayRevenue: 18960,
    occupancy: 65,
    staff: 18,
    equipment: 'Full Service',
    openingHours: '7:00 AM - 9:00 PM',
  },
  {
    id: 'BR-003',
    name: 'West Side Laboratory',
    location: '789 Wellness Blvd, West Side',
    manager: 'Dr. Emily Rodriguez',
    phone: '+1 (555) 100-2003',
    email: 'west@medlab.com',
    status: 'operational',
    todayCases: 98,
    todayRevenue: 13240,
    occupancy: 52,
    staff: 12,
    equipment: 'Basic + Imaging',
    openingHours: '8:00 AM - 8:00 PM',
  },
  {
    id: 'BR-004',
    name: 'East Medical Center',
    location: '321 Hospital Road, East District',
    manager: 'Dr. James Wilson',
    phone: '+1 (555) 100-2004',
    email: 'east@medlab.com',
    status: 'operational',
    todayCases: 156,
    todayRevenue: 21120,
    occupancy: 72,
    staff: 20,
    equipment: 'Full Service',
    openingHours: '24 Hours',
  },
  {
    id: 'BR-005',
    name: 'South Express Lab',
    location: '654 Quick Care St, South Zone',
    manager: 'Dr. Linda Park',
    phone: '+1 (555) 100-2005',
    email: 'south@medlab.com',
    status: 'maintenance',
    todayCases: 34,
    todayRevenue: 4590,
    occupancy: 28,
    staff: 8,
    equipment: 'Basic Only',
    openingHours: '9:00 AM - 6:00 PM',
  },
];

export function Branches() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredBranches = MOCK_BRANCHES.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Branch['status']) => {
    const styles = {
      operational: { bg: 'var(--success)', text: 'var(--success-foreground)' },
      maintenance: { bg: 'var(--warning)', text: 'var(--warning-foreground)' },
      closed: { bg: 'var(--destructive)', text: 'var(--destructive-foreground)' },
    };

    const style = styles[status];
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {status}
      </span>
    );
  };

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 80) return 'var(--destructive)';
    if (occupancy >= 60) return 'var(--warning)';
    return 'var(--success)';
  };

  const totalCases = filteredBranches.reduce((sum, b) => sum + b.todayCases, 0);
  const totalRevenue = filteredBranches.reduce((sum, b) => sum + b.todayRevenue, 0);
  const avgOccupancy = Math.round(
    filteredBranches.reduce((sum, b) => sum + b.occupancy, 0) / filteredBranches.length
  );
  const operationalCount = filteredBranches.filter(b => b.status === 'operational').length;

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedBranch(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Branch Management</h1>
          <p className="text-muted-foreground text-xs">
            Monitor and manage all laboratory locations
          </p>
        </div>
        <button 
          onClick={handleAdd}
          className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Branch
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Today's Cases</span>
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{totalCases}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Across all branches</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">
            ${(totalRevenue / 1000).toFixed(1)}k
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Today's total</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Avg Occupancy</span>
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{avgOccupancy}%</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Capacity utilization</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Branches</span>
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{operationalCount}/{filteredBranches.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Operational</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded p-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input 
            type="text"
            placeholder="Search branches by name, location, or ID..."
            className="w-full h-8 pl-8 pr-3 bg-secondary border-0 rounded text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Branch Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30 sticky top-0 z-10">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Branch</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Manager</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Today's Cases</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Revenue</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Occupancy</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Staff</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBranches.map((branch) => (
                <tr 
                  key={branch.id} 
                  className="hover:bg-accent/30 transition-colors"
                >
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground">{branch.name}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {branch.location}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground">{branch.manager}</td>
                  <td className="px-3 py-2 text-center">
                    {getStatusBadge(branch.status)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="text-xs text-foreground tabular-nums">{branch.todayCases}</div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="text-xs text-foreground tabular-nums">
                      ${(branch.todayRevenue / 1000).toFixed(1)}k
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${branch.occupancy}%`,
                            backgroundColor: getOccupancyColor(branch.occupancy)
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {branch.occupancy}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="text-xs text-foreground tabular-nums flex items-center justify-center gap-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      {branch.staff}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => handleEdit(branch)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                        title="More"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
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
            Showing <span className="text-foreground">{filteredBranches.length}</span> of <span className="text-foreground">{MOCK_BRANCHES.length}</span> branches
          </div>
        </div>
      </div>

      {/* Edit/Add Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="text-foreground text-sm">
                {selectedBranch ? 'Edit Branch' : 'Add New Branch'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground block mb-1">Branch Name</label>
                    <input 
                      type="text"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedBranch?.name}
                      placeholder="Enter branch name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Branch ID</label>
                    <input 
                      type="text"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedBranch?.id}
                      placeholder="Auto-generated"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Location Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-foreground block mb-1">Full Address</label>
                    <input 
                      type="text"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedBranch?.location}
                      placeholder="Enter complete address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-foreground block mb-1">Opening Hours</label>
                      <input 
                        type="text"
                        className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        defaultValue={selectedBranch?.openingHours}
                        placeholder="e.g., 8:00 AM - 8:00 PM"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground block mb-1">Equipment Level</label>
                      <select className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="basic">Basic Only</option>
                        <option value="basic-imaging">Basic + Imaging</option>
                        <option value="full">Full Service</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground block mb-1">Branch Manager</label>
                    <input 
                      type="text"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedBranch?.manager}
                      placeholder="Manager name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Phone Number</label>
                    <input 
                      type="tel"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedBranch?.phone}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-foreground block mb-1">Email Address</label>
                    <input 
                      type="email"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedBranch?.email}
                      placeholder="branch@medlab.com"
                    />
                  </div>
                </div>
              </div>

              {/* Operational Settings */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Operational Settings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground block mb-1">Status</label>
                    <select 
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedBranch?.status}
                    >
                      <option value="operational">Operational</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Staff Count</label>
                    <input 
                      type="number"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedBranch?.staff}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {selectedBranch?.status === 'maintenance' && (
                <div className="bg-warning/10 border border-warning/20 rounded p-2.5 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                  <div className="text-[11px]" style={{ color: 'var(--warning)' }}>
                    <p className="font-medium mb-0.5">Branch in Maintenance Mode</p>
                    <p>Limited operations may affect patient capacity and revenue.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex items-center justify-end gap-2">
              <button 
                onClick={() => setShowModal(false)}
                className="h-8 px-3 bg-secondary border border-border rounded text-xs hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button 
                className="h-8 px-3 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity"
              >
                {selectedBranch ? 'Save Changes' : 'Add Branch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
