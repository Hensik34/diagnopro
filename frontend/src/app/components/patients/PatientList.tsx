import { useState, useEffect, FormEvent } from 'react';
import { Search, Plus, Filter, MoreHorizontal, Edit, Eye, Trash2 } from 'lucide-react';
import { CustomConfirmModal } from '../ui/CustomConfirmModal';
import { usePatientStore, useBranchStore } from '../../../stores';
import type { CreatePatientData, Patient } from '../../../types';

/**
 * Patient List Component
 * Demonstrates patient store usage with CRUD operations
 */
export function PatientList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'danger' | 'warning' | 'alert';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: () => {}
  });
  
  // Get state and actions from stores
  const { 
    patients, 
    isLoading, 
    error, 
    fetchPatients, 
    createPatient, 
    deletePatient,
    clearError 
  } = usePatientStore();
  
  const { branches, currentBranchId, fetchBranches } = useBranchStore();

  // Fetch data on mount
  useEffect(() => {
    fetchBranches();
    if (currentBranchId) {
      fetchPatients({ branch_id: currentBranchId });
    } else {
      fetchPatients();
    }
  }, [fetchPatients, fetchBranches, currentBranchId]);

  // Filter patients by search term
  const filteredPatients = patients.filter(patient => {
    const name = (patient.name || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || 
           patient.phone.includes(searchTerm);
  });

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Patient',
      message: 'Are you sure you want to delete this patient?',
      type: 'danger',
      onConfirm: async () => {
        await deletePatient(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Patients</h1>
          <p className="text-muted-foreground text-xs">
            Manage patient records ({patients.length} total)
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Patient
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded p-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 bg-background border border-border rounded text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <button className="h-8 px-2.5 flex items-center gap-1.5 bg-card border border-border rounded hover:bg-accent transition-colors text-xs">
          <Filter className="w-3.5 h-3.5" />
          Filters
        </button>
      </div>

      {/* Patient Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Gender</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Blood Type</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                  Loading patients...
                </td>
              </tr>
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                  No patients found
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <span className="text-sm text-foreground">
                      {patient.name}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{patient.phone}</td>
                  <td className="p-3 text-sm text-muted-foreground">{patient.gender || '-'}</td>
                  <td className="p-3 text-sm text-muted-foreground">{patient.blood_type || '-'}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 hover:bg-accent rounded" title="View">
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-accent rounded" title="Edit">
                        <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={() => handleDelete(patient.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded" 
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <AddPatientModal 
          branches={branches}
          onClose={() => setShowAddModal(false)} 
          onSubmit={async (data) => {
            const result = await createPatient(data);
            if (result) {
              setShowAddModal(false);
            }
          }}
        />
      )}

      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

/**
 * Add Patient Modal Component
 */
function AddPatientModal({ 
  branches,
  onClose, 
  onSubmit 
}: { 
  branches: { id: string; name: string }[];
  onClose: () => void; 
  onSubmit: (data: CreatePatientData) => Promise<void>;
}) {
  const [formData, setFormData] = useState<CreatePatientData>({
    name: '',
    phone: '',
    email: '',
    gender: '',
    branch_id: branches[0]?.id || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Add New Patient</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Patient Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-9 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
            />
          </div>
          
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Phone *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full h-9 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
            />
          </div>
          
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-9 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-9 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Branch *</label>
              <select
                required
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                className="w-full h-9 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 bg-muted text-muted-foreground rounded text-sm hover:bg-muted/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
