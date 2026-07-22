import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Shield,
  Mail,
  Phone,
  Edit,
  Eye,
  X,
  CheckCircle,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { authApi } from '../../api/auth';
import { useBranchStore } from '../../stores/branchStore';
import type { User } from '../../types';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  lab_technician: 'Technician',
  staff: 'Staff',
};

export function Users() {
  const navigate = useNavigate();
  const { branches, currentBranchId, fetchBranches } = useBranchStore();
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
  const [formStaffName, setFormStaffName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<string>('staff');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formPetrolPrice, setFormPetrolPrice] = useState('');
  const [formCanApproveReports, setFormCanApproveReports] = useState(false);
  const [formRequiresMeterPhoto, setFormRequiresMeterPhoto] = useState(true);
  const [formBranchId, setFormBranchId] = useState<string>('');

  // Fetch users on mount and branch change, also fetch branches list
  useEffect(() => {
    fetchUsers();
    if (branches.length === 0) {
      fetchBranches();
    }
  }, [currentBranchId]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.getAllUsers();
      // Filter out doctor and admin roles
      setUsers(response.data.filter((u: User) => u.role !== 'doctor' && u.role !== 'admin'));
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
    lab_technician: users.filter(u => u.role === 'lab_technician').length,
    staff: users.filter(u => u.role === 'staff').length,
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormStaffName(user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim());
    setFormEmail(user.email);
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormPetrolPrice(user.petrol_price_per_km?.toString() || '');
    setFormCanApproveReports(user.can_approve_reports || false);
    setFormRequiresMeterPhoto(user.requires_meter_photo !== false);
    setFormBranchId(user.branches && user.branches.length > 0 ? user.branches[0].id : (currentBranchId || ''));
    setFormPassword('');
    setFormConfirmPassword('');
    setModalError(null);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setFormStaffName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('staff');
    setFormPetrolPrice('');
    setFormCanApproveReports(false);
    setFormRequiresMeterPhoto(true);
    setFormBranchId(currentBranchId || '');
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

    if (!formStaffName.trim()) {
      setModalError('Staff name is required');
      return;
    }
    if (!formEmail.trim()) {
      setModalError('Email is required');
      return;
    }

    const nameParts = formStaffName.trim().split(/\s+/);
    const firstname = nameParts[0] || formStaffName.trim();
    const lastname = nameParts.slice(1).join(' ') || '';

    setIsSaving(true);

    try {
      if (selectedUser) {
        // Update existing user
        const response = await authApi.updateUser(selectedUser.id, {
          name: formStaffName.trim(),
          staffName: formStaffName.trim(),
          firstname,
          lastname,
          email: formEmail.trim(),
          phone: formPhone || undefined,
          role: formRole,
          petrol_price_per_km: formRole !== 'lab_technician' && formPetrolPrice ? Number(formPetrolPrice) : undefined,
          can_approve_reports: formRole === 'staff' ? false : formCanApproveReports,
          requires_meter_photo: formRequiresMeterPhoto,
          branch_id: formBranchId || currentBranchId || undefined,
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
          name: formStaffName.trim(),
          staffName: formStaffName.trim(),
          firstname,
          lastname,
          email: formEmail.trim(),
          password: formPassword,
          phone: formPhone || undefined,
          role: formRole,
          petrol_price_per_km: formRole !== 'lab_technician' && formPetrolPrice ? Number(formPetrolPrice) : undefined,
          can_approve_reports: formRole === 'staff' ? false : formCanApproveReports,
          requires_meter_photo: formRequiresMeterPhoto,
          branch_id: formBranchId || currentBranchId || undefined,
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
          <p className="text-sm text-destructive font-medium">Failed to load staff</p>
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
          <h1 className="text-foreground text-lg mb-0.5">Staff Management</h1>
          <p className="text-muted-foreground text-xs">
            Manage staff members and lab technician accounts
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Staff
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Staff</span>
            <UsersIcon className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{filteredUsers.length}</div>
          <div className="text-[10px] text-success mt-0.5">{activeCount} active</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Staff</span>
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{roleCount.staff}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Front desk</div>
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

      {/* Staff Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30 sticky top-0 z-10">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Staff Member</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Contact</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Role</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Branch</th>
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
                      <span className="text-xs text-foreground font-medium">
                        {user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim()}
                      </span>
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
                    <div className="flex flex-col items-center gap-1">
                      {getRoleBadge(user.role)}
                      {user.can_approve_reports && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Approver
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                      {user.branches?.[0]?.name || user.branch_names || 'Assigned Branch'}
                    </span>
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
                        onClick={() => navigate(`/app/users/${user.id}`)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-primary/10 transition-colors text-primary"
                        title="View Staff Payout & Activity Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
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
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No staff found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Showing <span className="text-foreground">{filteredUsers.length}</span> of <span className="text-foreground">{users.length}</span> staff
          </div>
        </div>
      </div>

      {/* Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="text-foreground text-sm">
                {selectedUser ? 'Edit Staff Member' : 'Add New Staff Member'}
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
                  <div className="col-span-2">
                    <label className="text-xs text-foreground block mb-1">Staff Name *</label>
                    <input
                      type="text"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formStaffName}
                      onChange={(e) => setFormStaffName(e.target.value)}
                      placeholder="Enter full staff name (e.g. Rahul Sharma)"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Email Address *</label>
                    <input
                      type="email"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. rahul@yourlab.com"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">Custom staff email (e.g. staffname@yourlab.com)</p>
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
              <div className="border-t border-border pt-4">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Role & Access</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-foreground block mb-1">Role *</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full h-10 px-3 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="staff">Staff</option>
                      <option value="lab_technician">Lab Technician</option>
                    </select>
                  </div>
                  {formRole !== 'lab_technician' && (
                    <div>
                      <label className="text-xs text-foreground block mb-1">Petrol Price (₹/km)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formPetrolPrice}
                        onChange={(e) => setFormPetrolPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-10 px-3 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setFormRequiresMeterPhoto(!formRequiresMeterPhoto)}
                      className="flex items-start gap-2.5 cursor-pointer focus:outline-none text-left"
                    >
                      <div className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-all shrink-0 ${formRequiresMeterPhoto
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-background text-transparent'
                        }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-foreground select-none block">
                          Require Bike Meter Photo for Check-In / Check-Out
                        </span>
                        <span className="text-[11px] text-muted-foreground select-none block">
                          Uncheck if staff member does not collect field samples (enables direct check-in & checkout)
                        </span>
                      </div>
                    </button>
                  </div>

                  {formRole !== 'staff' && (
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setFormCanApproveReports(!formCanApproveReports)}
                        className="flex items-center gap-2 cursor-pointer focus:outline-none"
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formCanApproveReports
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-border bg-background text-transparent'
                          }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="text-xs font-medium text-foreground select-none">
                          Enable Report Approval Rights
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Branch Assignment - Only shown when multiple branches exist */}
              {branches.length > 1 && (
                <div className="border-t border-border pt-4">
                  <label className="text-xs text-foreground block mb-1 font-medium">Assigned Lab Branch *</label>
                  <select
                    value={formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full h-9 px-3 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                {selectedUser ? 'Save Changes' : 'Create Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}