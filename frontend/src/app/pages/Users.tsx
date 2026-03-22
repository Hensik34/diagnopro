import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Shield,
  Mail,
  Phone,
  MapPin,
  Edit,
  MoreVertical,
  X,
  AlertCircle,
  CheckCircle,
  Users as UsersIcon,
  UserCheck,
  UserX
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'technician' | 'receptionist' | 'admin' | 'staff' | 'approver';
  branch: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  hireDate: string;
  permissions?: {
    canApproveReports: boolean;
    canManageBilling: boolean;
    canManageStock: boolean;
  };
}

const MOCK_USERS: User[] = [
  {
    id: 'U-001',
    name: 'Dr. Sarah Mitchell',
    email: 'sarah.mitchell@medlab.com',
    phone: '+1 (555) 100-1001',
    role: 'owner',
    branch: 'All Branches',
    status: 'active',
    lastLogin: '2024-02-27 09:15',
    hireDate: '2020-01-15',
  },
  {
    id: 'U-002',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@medlab.com',
    phone: '+1 (555) 100-1002',
    role: 'manager',
    branch: 'Central Lab - Downtown',
    status: 'active',
    lastLogin: '2024-02-27 08:45',
    hireDate: '2020-03-20',
  },
  {
    id: 'U-003',
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@medlab.com',
    phone: '+1 (555) 100-1003',
    role: 'manager',
    branch: 'North Branch',
    status: 'active',
    lastLogin: '2024-02-27 07:30',
    hireDate: '2020-06-10',
  },
  {
    id: 'U-004',
    name: 'John Anderson',
    email: 'john.anderson@medlab.com',
    phone: '+1 (555) 100-1004',
    role: 'technician',
    branch: 'Central Lab - Downtown',
    status: 'active',
    lastLogin: '2024-02-27 09:00',
    hireDate: '2021-02-15',
  },
  {
    id: 'U-005',
    name: 'Maria Santos',
    email: 'maria.santos@medlab.com',
    phone: '+1 (555) 100-1005',
    role: 'technician',
    branch: 'North Branch',
    status: 'active',
    lastLogin: '2024-02-27 08:20',
    hireDate: '2021-05-22',
  },
  {
    id: 'U-006',
    name: 'Lisa Johnson',
    email: 'lisa.johnson@medlab.com',
    phone: '+1 (555) 100-1006',
    role: 'receptionist',
    branch: 'Central Lab - Downtown',
    status: 'active',
    lastLogin: '2024-02-27 08:00',
    hireDate: '2022-01-10',
  },
  {
    id: 'U-007',
    name: 'Robert Taylor',
    email: 'robert.taylor@medlab.com',
    phone: '+1 (555) 100-1007',
    role: 'technician',
    branch: 'West Side Laboratory',
    status: 'active',
    lastLogin: '2024-02-26 17:45',
    hireDate: '2022-03-15',
  },
  {
    id: 'U-008',
    name: 'Jennifer Lee',
    email: 'jennifer.lee@medlab.com',
    phone: '+1 (555) 100-1008',
    role: 'receptionist',
    branch: 'East Medical Center',
    status: 'active',
    lastLogin: '2024-02-27 07:15',
    hireDate: '2022-06-20',
  },
  {
    id: 'U-009',
    name: 'David Kim',
    email: 'david.kim@medlab.com',
    phone: '+1 (555) 100-1009',
    role: 'technician',
    branch: 'East Medical Center',
    status: 'inactive',
    lastLogin: '2024-01-15 16:30',
    hireDate: '2021-08-10',
  },
  {
    id: 'U-010',
    name: 'Patricia Brown',
    email: 'patricia.brown@medlab.com',
    phone: '+1 (555) 100-1010',
    role: 'receptionist',
    branch: 'North Branch',
    status: 'active',
    lastLogin: '2024-02-27 08:50',
    hireDate: '2023-01-05',
  },
];

export function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredUsers = MOCK_USERS.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: User['role']) => {
    const styles = {
      owner: { bg: '#7c3aed', text: '#ffffff' }, // Purple
      manager: { bg: 'var(--primary)', text: 'var(--primary-foreground)' }, // Blue
      technician: { bg: 'var(--success)', text: 'var(--success-foreground)' }, // Green
      receptionist: { bg: 'var(--warning)', text: 'var(--warning-foreground)' }, // Yellow
      admin: { bg: 'var(--info)', text: 'var(--info-foreground)' }, // Cyan
      staff: { bg: 'var(--muted)', text: 'var(--muted-foreground)' }, // Gray
      approver: { bg: 'var(--accent)', text: 'var(--accent-foreground)' }, // Orange
    };

    const labels = {
      owner: 'Owner',
      manager: 'Manager',
      technician: 'Technician',
      receptionist: 'Receptionist',
      admin: 'Admin',
      staff: 'Staff',
      approver: 'Approver',
    };

    const style = styles[role];
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {labels[role]}
      </span>
    );
  };

  const getStatusBadge = (status: User['status']) => {
    if (status === 'active') {
      return (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
          style={{ backgroundColor: 'var(--success)', color: 'var(--success-foreground)' }}
        >
          <CheckCircle className="w-2.5 h-2.5" />
          Active
        </span>
      );
    } else {
      return (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
          style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
        >
          <UserX className="w-2.5 h-2.5" />
          Inactive
        </span>
      );
    }
  };

  const roleCount = {
    owner: filteredUsers.filter(u => u.role === 'owner').length,
    manager: filteredUsers.filter(u => u.role === 'manager').length,
    technician: filteredUsers.filter(u => u.role === 'technician').length,
    receptionist: filteredUsers.filter(u => u.role === 'receptionist').length,
    admin: filteredUsers.filter(u => u.role === 'admin').length,
    staff: filteredUsers.filter(u => u.role === 'staff').length,
    approver: filteredUsers.filter(u => u.role === 'approver').length,
  };

  const activeCount = filteredUsers.filter(u => u.status === 'active').length;
  const inactiveCount = filteredUsers.filter(u => u.status === 'inactive').length;

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const toggleUserStatus = (userId: string) => {
    // In a real app, this would update the user status in the backend
    console.log('Toggle status for user:', userId);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">User Management</h1>
          <p className="text-muted-foreground text-xs">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <button 
          onClick={handleAdd}
          className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Users</span>
            <UsersIcon className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{filteredUsers.length}</div>
          <div className="text-[10px] text-success mt-0.5">{activeCount} active</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Managers</span>
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{roleCount.manager}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">+ {roleCount.owner} owner</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Technicians</span>
            <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{roleCount.technician}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Lab staff</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Receptionists</span>
            <UsersIcon className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{roleCount.receptionist}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Front desk</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Inactive</span>
            <UserX className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{inactiveCount}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Users</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded p-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input 
            type="text"
            placeholder="Search by name, email, or ID..."
            className="w-full h-8 pl-8 pr-3 bg-secondary border-0 rounded text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="h-6 w-px bg-border"></div>

        <select 
          className="h-8 text-xs bg-secondary border-0 rounded px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="technician">Technician</option>
          <option value="receptionist">Receptionist</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="approver">Approver</option>
        </select>

        <select 
          className="h-8 text-xs bg-secondary border-0 rounded px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* User Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30 sticky top-0 z-10">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">User</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Contact</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Role</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Branch</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Last Login</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-accent/30 transition-colors"
                >
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{user.id}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        {user.email}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {user.phone}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      {user.branch}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                    {user.lastLogin}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => toggleUserStatus(user.id)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'active' ? (
                          <UserX className="w-3.5 h-3.5" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5" />
                        )}
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
            Showing <span className="text-foreground">{filteredUsers.length}</span> of <span className="text-foreground">{MOCK_USERS.length}</span> users
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="text-foreground text-sm">
                {selectedUser ? 'Edit User' : 'Add New User'}
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
              {/* Personal Information */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-foreground block mb-1">Full Name *</label>
                    <input 
                      type="text"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedUser?.name}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Email Address *</label>
                    <input 
                      type="email"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedUser?.email}
                      placeholder="user@medlab.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Phone Number *</label>
                    <input 
                      type="tel"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedUser?.phone}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Access */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Role & Access</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground block mb-1">Role *</label>
                    <select 
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedUser?.role}
                    >
                      <option value="">Select role...</option>
                      <option value="owner">Owner - Full system access</option>
                      <option value="manager">Manager - Branch management</option>
                      <option value="technician">Technician - Lab operations</option>
                      <option value="receptionist">Receptionist - Patient management</option>
                      <option value="admin">Admin - System administration</option>
                      <option value="staff">Staff - General access</option>
                      <option value="approver">Approver - Report approval</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Branch Assignment *</label>
                    <select 
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedUser?.branch}
                    >
                      <option value="">Select branch...</option>
                      <option value="All Branches">All Branches (Admin only)</option>
                      <option value="Central Lab - Downtown">Central Lab - Downtown</option>
                      <option value="North Branch">North Branch</option>
                      <option value="West Side Laboratory">West Side Laboratory</option>
                      <option value="East Medical Center">East Medical Center</option>
                      <option value="South Express Lab">South Express Lab</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Initial Status *</label>
                    <select 
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedUser?.status || 'active'}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Hire Date</label>
                    <input 
                      type="date"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedUser?.hireDate}
                    />
                  </div>
                </div>
              </div>

              {/* Login Credentials */}
              {!selectedUser && (
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Login Credentials</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-foreground block mb-1">Temporary Password *</label>
                      <input 
                        type="password"
                        className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Enter temporary password"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground block mb-1">Confirm Password *</label>
                      <input 
                        type="password"
                        className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                  <div className="mt-2 bg-info/10 border border-info/20 rounded p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--info)' }} />
                    <p className="text-[11px]" style={{ color: 'var(--info)' }}>
                      User will be required to change password on first login for security.
                    </p>
                  </div>
                </div>
              )}

              {/* Permissions Preview */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Role Permissions</h3>
                <div className="bg-secondary/50 border border-border rounded p-3 space-y-2 text-[11px]">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                    <span className="text-foreground">View and manage patient records</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                    <span className="text-foreground">Enter and approve test results</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                    <span className="text-foreground">Generate and print reports</span>
                  </div>
                  <div className="flex items-start gap-2 opacity-50">
                    <X className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Manage user accounts (admin only)</span>
                  </div>
                </div>
              </div>
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
                {selectedUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}