import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Plus, 
  Search, 
  Stethoscope,
  Phone,
  Edit,
  Eye,
  X,
  Building2,
  Loader2,
  AlertCircle,
  Trash2,
  Mail
} from 'lucide-react';
import { useDoctorStore, useBranchStore } from '../../stores';
import type { Doctor, CreateDoctorData } from '../../types';

export function DoctorManagement() {
  const navigate = useNavigate();
  const { 
    doctors, 
    isLoading, 
    error, 
    fetchDoctors, 
    createDoctor, 
    updateDoctor,
    deleteDoctor 
  } = useDoctorStore();
  const { branches, currentBranchId } = useBranchStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch doctors on mount
  useEffect(() => {
    fetchDoctors(currentBranchId ? { branch_id: currentBranchId } : undefined);
  }, [fetchDoctors, currentBranchId]);

  const filteredDoctors = doctors.filter(doctor => {
    const fullName = `${doctor.title || 'Dr'} ${doctor.name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
      doctor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleAdd = () => {
    setSelectedDoctor(null);
    setShowModal(true);
  };

  const handleEdit = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  const handleView = (doctorId: string) => {
    navigate(`/doctors/${doctorId}`);
  };

  const handleDelete = async (doctorId: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    
    setIsDeleting(doctorId);
    try {
      await deleteDoctor(doctorId);
    } finally {
      setIsDeleting(null);
    }
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Unknown Branch';
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="sticky top-12 z-20 bg-background/95 backdrop-blur py-2 flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Doctor Management</h1>
          <p className="text-muted-foreground text-xs">
            Manage referring doctors and their information
          </p>
        </div>
        <button 
          onClick={handleAdd}
          className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Doctor
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Doctors</span>
            <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{doctors.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Registered</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Specializations</span>
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">
            {new Set(doctors.map(d => d.specialization).filter(Boolean)).size}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Unique</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Branches</span>
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">
            {new Set(doctors.map(d => d.branch_id)).size}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Locations</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded p-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input 
            type="text"
            placeholder="Search by name, phone, or specialization..."
            className="w-full h-8 pl-8 pr-3 bg-secondary border-0 rounded text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground text-sm">Loading doctors...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredDoctors.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded">
          <div className="text-muted-foreground text-sm">
            {doctors.length === 0 ? 'No doctors found. Add your first doctor to get started.' : 'No doctors match your search criteria.'}
          </div>
          {doctors.length === 0 && (
            <button
              onClick={handleAdd}
              className="mt-4 h-8 px-3 bg-primary text-white rounded text-sm hover:opacity-90 transition-opacity"
            >
              Add Doctor
            </button>
          )}
        </div>
      )}

      {/* Doctor Table */}
      {!isLoading && filteredDoctors.length > 0 && (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30 sticky top-0 z-10">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Doctor Name</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Contact</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Specialization</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Branch</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDoctors.map((doctor) => (
                  <tr 
                    key={doctor.id} 
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-foreground font-medium">
                            {doctor.title || 'Dr'}. {doctor.name}
                          </span>
                          {doctor.user_id && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                              Portal
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        {doctor.phone && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {doctor.phone}
                          </span>
                        )}
                        {doctor.email && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {doctor.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-foreground">
                        {doctor.specialization || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-foreground">
                        {getBranchName(doctor.branch_id)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleView(doctor.id)}
                          className="h-7 px-2 flex items-center gap-1 bg-secondary border border-border rounded hover:bg-accent transition-colors text-xs hover:cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button 
                          onClick={() => handleEdit(doctor)}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground hover:cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(doctor.id)}
                          disabled={isDeleting === doctor.id}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-destructive disabled:opacity-50 hover:cursor-pointer"
                          title="Delete"
                        >
                          {isDeleting === doctor.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
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
              Showing <span className="text-foreground">{filteredDoctors.length}</span> of <span className="text-foreground">{doctors.length}</span> doctors
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Doctor Modal */}
      {showModal && (
        <DoctorModal
          doctor={selectedDoctor}
          branches={branches}
          currentBranchId={currentBranchId}
          onClose={() => {
            setShowModal(false);
            setSelectedDoctor(null);
          }}
          onSave={async (data) => {
            if (selectedDoctor) {
              await updateDoctor(selectedDoctor.id, data);
            } else {
              await createDoctor(data);
            }
            setShowModal(false);
            setSelectedDoctor(null);
          }}
        />
      )}
    </div>
  );
}

// Doctor Modal Component
interface DoctorModalProps {
  doctor: Doctor | null;
  branches: { id: string; name: string }[];
  currentBranchId: string | null;
  onClose: () => void;
  onSave: (data: CreateDoctorData) => Promise<void>;
}

function DoctorModal({ doctor, branches, currentBranchId, onClose, onSave }: DoctorModalProps) {
  const [formData, setFormData] = useState<CreateDoctorData>({
    title: doctor?.title || 'Dr',
    name: doctor?.name || '',
    phone: doctor?.phone || '',
    email: doctor?.email || '',
    specialization: doctor?.specialization || '',
    license_number: doctor?.license_number || '',
    commission_percentage: doctor?.commission_percentage || 0,
    branch_id: doctor?.branch_id || currentBranchId || '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableLogin, setEnableLogin] = useState(false);

  const hasExistingLogin = !!doctor?.user_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: if login enabled, email is required
    if (enableLogin && !formData.email) {
      alert('Email is required to enable doctor login');
      return;
    }
    if (enableLogin && (!formData.password || formData.password.length < 4)) {
      alert('Password must be at least 4 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      // Only send password if login is being enabled
      const data = { ...formData };
      if (!enableLogin) {
        delete data.password;
      }
      await onSave(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="text-foreground text-sm font-medium">
            {doctor ? 'Edit Doctor' : 'Add New Doctor'}
          </h2>
          <button 
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title + Name */}
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Title</label>
              <select
                value={formData.title || 'Dr'}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Dr">Dr.</option>
                <option value="Mr">Mr.</option>
                <option value="Mrs">Mrs.</option>
                <option value="Ms">Ms.</option>
                <option value="Prof">Prof.</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Full Name *</label>
              <input 
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Full name"
                required
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Phone *</label>
              <input 
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Email {enableLogin ? '*' : ''}</label>
              <input 
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="doctor@clinic.com"
                required={enableLogin}
              />
            </div>
          </div>

          {/* Professional Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Specialization</label>
              <input 
                type="text"
                value={formData.specialization}
                onChange={e => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., Cardiologist"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">License Number</label>
              <input 
                type="text"
                value={formData.license_number}
                onChange={e => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Medical license #"
              />
            </div>
          </div>

          {/* Branch + Commission */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Branch</label>
              {branches.length > 1 ? (
                <select 
                  value={formData.branch_id}
                  onChange={e => setFormData(prev => ({ ...prev, branch_id: e.target.value }))}
                  className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              ) : (
                <div className="h-9 px-3 bg-secondary border border-border rounded text-sm flex items-center text-foreground">
                  {branches[0]?.name || 'Default Branch'}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Commission %</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.commission_percentage || ''}
                onChange={e => setFormData(prev => ({ ...prev, commission_percentage: parseFloat(e.target.value) || 0 }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., 10"
              />
              <span className="text-[10px] text-muted-foreground">Share on referred reports</span>
            </div>
          </div>

          {/* Portal Access Section */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2.5 bg-secondary/30 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">Doctor Portal Access</span>
              </div>
              {hasExistingLogin ? (
                <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                  Login Active
                </span>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableLogin}
                    onChange={e => setEnableLogin(e.target.checked)}
                    className="w-3.5 h-3.5 accent-primary rounded"
                  />
                  <span className="text-xs text-muted-foreground">Enable Login</span>
                </label>
              )}
            </div>

            {(enableLogin || hasExistingLogin) && (
              <div className="p-3 space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  {hasExistingLogin 
                    ? 'This doctor can login to view their referrals & commission. Set a new password below to change it.'
                    : 'Set a password so this doctor can login to view their referrals, reports & commission.'}
                </p>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    {hasExistingLogin ? 'New Password (leave blank to keep current)' : 'Login Password *'}
                  </label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder={hasExistingLogin ? '••••••••' : 'Set login password'}
                    minLength={4}
                    required={enableLogin && !hasExistingLogin}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Doctor will login with: {formData.email || 'email'} + this password
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button 
              type="button"
              onClick={onClose}
              className="h-9 px-4 bg-secondary border border-border rounded text-sm hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.phone.trim() || !formData.branch_id}
              className="h-9 px-4 bg-primary text-white rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {doctor ? 'Save Changes' : 'Add Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

