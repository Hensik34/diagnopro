import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  FileText, 
  Edit, 
  Eye, 
  Calendar as CalendarIcon,
  Download,
  Loader2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { usePatientStore, useBranchStore } from '../../stores';
import type { Patient, CreatePatientData } from '../../types';

export function Patients() {
  const { 
    patients, 
    isLoading, 
    error, 
    fetchPatients, 
    createPatient, 
    updatePatient,
    deletePatient 
  } = usePatientStore();
  const { branches, currentBranchId } = useBranchStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Fetch patients on mount and when branch changes
  useEffect(() => {
    fetchPatients(currentBranchId ? { branch_id: currentBranchId } : {});
  }, [fetchPatients, currentBranchId]);

  // Filter patients based on search and filters
  const filteredPatients = patients.filter(patient => {
    const name = (patient.name || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
                          patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.phone?.includes(searchTerm);
    const matchesGender = genderFilter === 'All' || patient.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Calculate age from date_of_birth
  const calculateAge = (dob?: string) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Get branch name
  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Unknown Branch';
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Patients</h1>
          <p className="text-muted-foreground text-xs">
            Manage patient records and information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-2.5 flex items-center gap-1.5 bg-card border border-border rounded hover:bg-accent transition-colors text-xs">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
          >
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
              placeholder="Search by name, ID, or phone..."
              className="w-full h-8 pl-8 pr-3 bg-secondary border-0 rounded text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="h-6 w-px bg-border"></div>

          <select 
            className="h-8 text-xs bg-secondary border-0 rounded px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Patient Count */}
        <div className="flex items-center gap-3 text-xs border-l border-border pl-3">
          <span className="text-muted-foreground">
            Total: <span className="text-foreground font-medium">{patients.length}</span> patients
          </span>
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
          <span className="ml-2 text-muted-foreground text-sm">Loading patients...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredPatients.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded">
          <div className="text-muted-foreground text-sm">
            {patients.length === 0 ? 'No patients found. Add your first patient to get started.' : 'No patients match your search criteria.'}
          </div>
          {patients.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 h-8 px-3 bg-primary text-white rounded text-sm hover:opacity-90 transition-opacity"
            >
              Add Patient
            </button>
          )}
        </div>
      )}

      {/* Data Table */}
      {!isLoading && filteredPatients.length > 0 && (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30 sticky top-0 z-10">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Patient ID</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Age/Gender</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Phone</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Email</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Branch</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Registered</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPatients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                      {patient.id.slice(0, 8)}...
                    </td>
                    <td className="px-3 py-2 text-xs text-foreground font-medium">
                      {patient.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                      {patient.age != null ? patient.age : '-'} / {patient.gender?.charAt(0) || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                      {patient.phone || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {patient.email || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {patient.branch_name || getBranchName(patient.branch_id)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatDate(patient.created_at)}
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
                          onClick={() => setEditingPatient(patient)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
                          title="Create Report"
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
              Showing <span className="text-foreground">{filteredPatients.length}</span> of <span className="text-foreground">{patients.length}</span> patients
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Patient Modal */}
      {(showAddModal || editingPatient) && (
        <PatientModal
          patient={editingPatient}
          branches={branches}
          currentBranchId={currentBranchId}
          onClose={() => {
            setShowAddModal(false);
            setEditingPatient(null);
          }}
          onSave={async (data) => {
            if (editingPatient) {
              await updatePatient(editingPatient.id, data);
            } else {
              await createPatient(data);
            }
            setShowAddModal(false);
            setEditingPatient(null);
          }}
        />
      )}
    </div>
  );
}

// Patient Modal Component
interface PatientModalProps {
  patient: Patient | null;
  branches: { id: string; name: string }[];
  currentBranchId: string | null;
  onClose: () => void;
  onSave: (data: CreatePatientData) => Promise<void>;
}

function PatientModal({ patient, branches, currentBranchId, onClose, onSave }: PatientModalProps) {
  const [formData, setFormData] = useState<CreatePatientData>({
    name: patient?.name || '',
    email: patient?.email || '',
    phone: patient?.phone || '',
    age: patient?.age,
    gender: patient?.gender || '',
    address: patient?.address || '',
    city: patient?.city || '',
    state: patient?.state || '',
    postal_code: patient?.postal_code || '',
    blood_type: patient?.blood_type || '',
    branch_id: patient?.branch_id || currentBranchId || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {patient ? 'Edit Patient' : 'Add New Patient'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Patient Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Age
              </label>
              <input
                type="number"
                min="0"
                max="150"
                value={formData.age ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, age: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Age"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Blood Type
              </label>
              <select
                value={formData.blood_type}
                onChange={e => setFormData(prev => ({ ...prev, blood_type: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Branch *
            </label>
            <select
              value={formData.branch_id}
              onChange={e => setFormData(prev => ({ ...prev, branch_id: e.target.value }))}
              className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">Select Branch</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={e => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 border border-border rounded text-sm hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 bg-primary text-white rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {patient ? 'Update' : 'Create'} Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}