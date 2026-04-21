import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Shield,
  Mail,
  Phone,
  Edit,
  X,
  CheckCircle,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { authApi } from '../../api/auth';
import type { User } from '../../types';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  doctor: 'Doctor',
  lab_technician: 'Technician',
  staff: 'Staff',
};

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form state for modal
  const [formFirstname, setFormFirstname] = useState('');
  const [formLastname, setFormLastname] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<string>('staff');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formPetrolPrice, setFormPetrolPrice] = useState('');

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.getAllUsers();
      setUsers(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' ? user.is_active : !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      admin: { bg: 'var(--info)', text: 'var(--info-foreground)' },
      doctor: { bg: '#7c3aed', text: '#ffffff' },
      lab_technician: { bg: 'var(--success)', text: 'var(--success-foreground)' },
      staff: { bg: 'var(--muted)', text: 'var(--muted-foreground)' },
    };

    const style = styles[role] || styles.staff;
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {ROLE_LABELS[role] || role}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
          style={{ backgroundColor: 'var(--success)', color: 'var(--success-foreground)' }}
        >
          <CheckCircle className="w-2.5 h-2.5" />
          Active
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
        style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
      >
        <UserX className="w-2.5 h-2.5" />
        Inactive
      </span>
    );
  };

  const activeCount = users.filter(u => u.is_active).length;
  const inactiveCount = users.filter(u => !u.is_active).length;
  const roleCount = {
    admin: users.filter(u => u.role === 'admin').length,
    doctor: users.filter(u => u.role === 'doctor').length,
    lab_technician: users.filter(u => u.role === 'lab_technician').length,
    staff: users.filter(u => u.role === 'staff').length,
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormFirstname(user.firstname);
    setFormLastname(user.lastname);
    setFormEmail(user.email);
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormPetrolPrice(user.petrol_price_per_km?.toString() || '');
    setFormPassword('');
    setFormConfirmPassword('');
    setModalError(null);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setFormFirstname('');
    setFormLastname('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('staff');
    setFormPetrolPrice('');
    setFormPassword('');
    setFormConfirmPassword('');
    setModalError(null);
    setShowModal(true);
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await authApi.toggleUserStatus(userId);
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: !u.is_active } : u
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle user status');
    }
  };

  const handleSave = async () => {
    setModalError(null);

    if (!formFirstname.trim() || !formLastname.trim()) {
      setModalError('First name and last name are required');
      return;
    }
    if (!formEmail.trim()) {
      setModalError('Email is required');
      return;
    }

    setIsSaving(true);

    try {
      if (selectedUser) {
        // Update existing user
        const response = await authApi.updateUser(selectedUser.id, {
          firstname: formFirstname,
          lastname: formLastname,
          phone: formPhone || undefined,
          role: formRole,
          petrol_price_per_km: formPetrolPrice ? Number(formPetrolPrice) : undefined,
        });
        setUsers(prev => prev.map(u =>
          u.id === selectedUser.id ? response.data : u
        ));
      } else {
        // Create new user via register
        if (!formPassword) {
          setModalError('Password is required for new users');
          setIsSaving(false);
          return;
        }
        if (formPassword !== formConfirmPassword) {
          setModalError('Passwords do not match');
          setIsSaving(false);
          return;
        }
        await authApi.createUser({
          firstname: formFirstname,
          lastname: formLastname,
          email: formEmail,
          password: formPassword,
          phone: formPhone || undefined,
          role: formRole,
          petrol_price_per_km: formPetrolPrice ? Number(formPetrolPrice) : undefined,
        });
        // Refetch to get the new user
        await fetchUsers();
      }

      setShowModal(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-destructive" />
        <div>
          <p className="text-sm text-destructive font-medium">Failed to load users</p>
          <p className="text-xs text-destructive/70">{error}</p>
        </div>
        <button onClick={fetchUsers} className="ml-auto text-xs text-primary hover:underline">
          Retry
        </button>
      </div>
    );
  }

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
          <div className="text-foreground text-xl tabular-nums">{roleCount.admin}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">System admins</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Technicians</span>
            <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{roleCount.lab_technician}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Lab staff</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Inactive</span>
            <UserX className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{inactiveCount}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Deactivated</div>
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
          <option value="admin">Admin</option>
          <option value="doctor">Doctor</option>
          <option value="lab_technician">Technician</option>
          <option value="staff">Staff</option>
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
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Created</th>
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
                      <span className="text-xs text-foreground">{user.firstname} {user.lastname}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{user.id.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        {user.email}
                      </span>
                      {user.phone && (
                        <span className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {getStatusBadge(user.is_active)}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                    {new Date(user.created_at).toLocaleDateString()}
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
                        onClick={() => handleToggleStatus(user.id)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {user.is_active ? (
                          <UserX className="w-3.5 h-3.5" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Showing <span className="text-foreground">{filteredUsers.length}</span> of <span className="text-foreground">{users.length}</span> users
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
              {/* Modal Error */}
              {modalError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded p-2.5 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-xs text-destructive">{modalError}</span>
                </div>
              )}

              {/* Personal Information */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground block mb-1">First Name *</label>
                    <input 
                      type="text"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formFirstname}
                      onChange={(e) => setFormFirstname(e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Last Name *</label>
                    <input 
                      type="text"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formLastname}
                      onChange={(e) => setFormLastname(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Email Address *</label>
                    <input 
                      type="email"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="user@lab.com"
                      disabled={!!selectedUser}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Phone Number</label>
                    <input 
                      type="tel"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+1 555-0000"
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
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                    >
                      <option value="staff">Staff — Front desk operations</option>
                      <option value="lab_technician">Technician — Lab operations</option>
                      <option value="doctor">Doctor — Reports & approvals</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Petrol Price (₹/km)</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formPetrolPrice}
                      onChange={(e) => setFormPetrolPrice(e.target.value)}
                      placeholder="e.g. 3.50"
                    />
                  </div>
                </div>
              </div>

              {/* Login Credentials - only for new users */}
              {!selectedUser && (
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Login Credentials</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-foreground block mb-1">Password *</label>
                      <input 
                        type="password"
                        className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground block mb-1">Confirm Password *</label>
                      <input 
                        type="password"
                        className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        value={formConfirmPassword}
                        onChange={(e) => setFormConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex items-center justify-end gap-2">
              <button 
                onClick={() => setShowModal(false)}
                disabled={isSaving}
                className="h-8 px-3 bg-secondary border border-border rounded text-xs hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-3 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                {selectedUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}