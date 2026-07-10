import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Plus, 
  Search, 
  MapPin, 
  Activity, 
  Edit,
  MoreVertical,
  X,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  Building2,
  Trash2,
  ArrowRightLeft,
  CheckCircle2
} from 'lucide-react';
import { useBranchStore } from '../../stores';
import { Branch, CreateBranchData } from '../../types';

export function Branches() {
  const navigate = useNavigate();
  const { 
    branches, 
    currentBranchId,
    isLoading, 
    error, 
    fetchBranches, 
    createBranch, 
    updateBranch,
    deleteBranch,
    switchBranch 
  } = useBranchStore();

  const hasMultipleBranches = branches.length > 1;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedBranch(null);
    setShowModal(true);
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    
    setIsDeleting(branchId);
    try {
      await deleteBranch(branchId);
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-0.5">Branch Management</h1>
          <p className="text-muted-foreground text-xs">
            Manage all laboratory locations
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <button 
            onClick={handleAdd}
            className="h-8 px-2.5 flex items-center justify-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs w-full sm:w-auto flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Branch
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Total Branches</span>
            <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {branches.length}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Locations</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Cities</span>
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {new Set(branches.map(b => b.city).filter(Boolean)).size}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Unique locations</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Latest Added</span>
            <Activity className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-lg tracking-tight font-semibold truncate block">
              {branches.length > 0 ? branches[branches.length - 1]?.name : '-'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">
              {branches.length > 0 ? formatDate(branches[branches.length - 1]?.created_at) : '-'}
            </span>
          </div>
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
          <span className="ml-2 text-muted-foreground text-sm">Loading branches...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredBranches.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded">
          <div className="text-muted-foreground text-sm">
            {branches.length === 0 ? 'No branches found. Add your first branch to get started.' : 'No branches match your search criteria.'}
          </div>
          {branches.length === 0 && (
            <button
              onClick={handleAdd}
              className="mt-4 h-8 px-3 bg-primary text-white rounded text-sm hover:opacity-90 transition-opacity"
            >
              Add Branch
            </button>
          )}
        </div>
      )}

      {/* Branch Table */}
      {!isLoading && filteredBranches.length > 0 && (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30 sticky top-0 z-10">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Branch</th>
                  {hasMultipleBranches && (
                    <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-20">Status</th>
                  )}
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Contact</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Location</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Created</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBranches.map((branch) => {
                  const isCurrentBranch = branch.id === currentBranchId;
                  return (
                    <tr 
                      key={branch.id} 
                      className={`hover:bg-accent/30 transition-colors ${
                        isCurrentBranch ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground font-medium">{branch.name}</span>
                        </div>
                      </td>
                      {hasMultipleBranches && (
                        <td className="px-3 py-2 text-center">
                          {isCurrentBranch ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          {branch.phone && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {branch.phone}
                            </span>
                          )}
                          {branch.email && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {branch.email}
                            </span>
                          )}
                          {!branch.phone && !branch.email && (
                            <span className="text-[11px] text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          {branch.location && (
                            <span className="text-[11px] text-foreground">{branch.location}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {[branch.city, branch.state, branch.postal_code].filter(Boolean).join(', ') || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {formatDate(branch.created_at)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          {/* Switch Branch — only for multi-branch, and not the current one */}
                          {hasMultipleBranches && !isCurrentBranch && (
                            <button 
                              onClick={() => switchBranch(branch.id, navigate)}
                              className="h-6 px-2 flex items-center justify-center gap-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-medium"
                              title={`Switch to ${branch.name}`}
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              Switch
                            </button>
                          )}
                          <button 
                            onClick={() => handleEdit(branch)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(branch.id)}
                            disabled={isDeleting === branch.id}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-destructive disabled:opacity-50"
                            title="Delete"
                          >
                            {isDeleting === branch.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Showing <span className="text-foreground">{filteredBranches.length}</span> of <span className="text-foreground">{branches.length}</span> branches
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Branch Modal */}
      {showModal && (
        <BranchModal
          branch={selectedBranch}
          onClose={() => {
            setShowModal(false);
            setSelectedBranch(null);
          }}
          onSave={async (data) => {
            if (selectedBranch) {
              await updateBranch(selectedBranch.id, data);
            } else {
              await createBranch(data);
            }
            setShowModal(false);
            setSelectedBranch(null);
          }}
        />
      )}
    </div>
  );
}

// Branch Modal Component
interface BranchModalProps {
  branch: Branch | null;
  onClose: () => void;
  onSave: (data: CreateBranchData) => Promise<void>;
}

function BranchModal({ branch, onClose, onSave }: BranchModalProps) {
  const [formData, setFormData] = useState<CreateBranchData>({
    name: branch?.name || '',
    location: branch?.location || '',
    city: branch?.city || '',
    state: branch?.state || '',
    postal_code: branch?.postal_code || '',
    phone: branch?.phone || '',
    email: branch?.email || '',
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
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="text-foreground text-sm font-medium">
            {branch ? 'Edit Branch' : 'Add New Branch'}
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
          {/* Basic Information */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Branch Name *</label>
            <input 
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter branch name"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Address</label>
            <input 
              type="text"
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">City</label>
              <input 
                type="text"
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="City"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">State</label>
              <input 
                type="text"
                value={formData.state}
                onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="State"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Postal Code</label>
              <input 
                type="text"
                value={formData.postal_code}
                onChange={e => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Zip"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Phone</label>
              <input 
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Email</label>
              <input 
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="branch@lab.com"
              />
            </div>
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
              disabled={isSubmitting || !formData.name.trim()}
              className="h-9 px-4 bg-primary text-white rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {branch ? 'Save Changes' : 'Add Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
