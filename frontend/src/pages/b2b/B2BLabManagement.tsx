import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useB2BStore } from '../../stores/b2bStore';
import { useBranchStore } from '../../stores/branchStore';
import type { B2BLab, CreateB2BLabData } from '../../types/b2b';

/**
 * B2B Partner Labs — Simple CRUD list
 */
export function B2BLabManagement() {
  const { labs, isLoading, error, fetchLabs, createLab, updateLab, deleteLab, clearError } = useB2BStore();
  const { currentBranchId } = useBranchStore();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLab, setEditingLab] = useState<B2BLab | null>(null);
  const [formData, setFormData] = useState<CreateB2BLabData>({
    lab_name: '',
    contact_person: '',
    mobile: '',
    email: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  const openCreate = () => {
    setEditingLab(null);
    setFormData({ lab_name: '', contact_person: '', mobile: '', email: '', owner_branch_id: currentBranchId || undefined });
    setShowModal(true);
  };

  const openEdit = (lab: B2BLab) => {
    setEditingLab(lab);
    setFormData({
      lab_name: lab.lab_name,
      contact_person: lab.contact_person || '',
      mobile: lab.mobile || '',
      email: lab.email || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.lab_name.trim()) return;
    setIsSaving(true);
    try {
      if (editingLab) {
        await updateLab(editingLab.id, formData);
      } else {
        await createLab({ ...formData, owner_branch_id: currentBranchId || undefined });
      }
      setShowModal(false);
    } catch {
      // error shown by store
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteLab(id);
    setDeleteConfirmId(null);
  };

  const activeLabs = labs.filter(l => l.status === 'active');
  const inactiveLabs = labs.filter(l => l.status !== 'active');

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">B2B Partner Labs</h1>
          <p className="text-muted-foreground text-xs">
            Manage partner laboratories for outsourced reports
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-8 px-3 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Lab
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
          <button onClick={clearError} className="text-xs text-destructive hover:underline">Dismiss</button>
        </div>
      )}

      {/* Loading */}
      {isLoading && labs.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && labs.length === 0 && (
        <div className="bg-card border border-border rounded p-8 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm text-foreground mb-1">No Partner Labs</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Add your first B2B partner lab to start outsourcing reports.
          </p>
          <button
            onClick={openCreate}
            className="h-8 px-4 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />
            Add Partner Lab
          </button>
        </div>
      )}

      {/* Lab List */}
      {labs.length > 0 && (
        <div className="bg-card border border-border rounded">
          <div className="px-4 py-2.5 border-b border-border bg-secondary/30 flex items-center justify-between">
            <h2 className="text-sm text-foreground">Partner Labs ({labs.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">#</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Lab Name</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Contact Person</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Mobile</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Email</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...activeLabs, ...inactiveLabs].map((lab, i) => (
                  <tr key={lab.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-xs text-foreground font-medium">{lab.lab_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-foreground">{lab.contact_person || '—'}</td>
                    <td className="px-3 py-2 text-xs text-foreground">
                      {lab.mobile ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {lab.mobile}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-foreground">
                      {lab.email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {lab.email}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                        lab.status === 'active'
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {lab.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(lab)}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirmId === lab.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(lab.id)}
                              className="h-6 px-2 bg-destructive text-white rounded text-[10px] hover:opacity-90"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="h-6 px-2 bg-secondary text-foreground rounded text-[10px] hover:bg-accent"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(lab.id)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-lg w-full max-w-md mx-4 shadow-xl">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm text-foreground font-medium">
                {editingLab ? 'Edit Partner Lab' : 'Add Partner Lab'}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Lab Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="w-full h-9 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.lab_name}
                  onChange={e => setFormData(prev => ({ ...prev, lab_name: e.target.value }))}
                  placeholder="e.g. Metro Diagnostics"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Contact Person</label>
                <input
                  type="text"
                  className="w-full h-9 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.contact_person}
                  onChange={e => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Mobile</label>
                  <input
                    type="tel"
                    className="w-full h-9 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.mobile}
                    onChange={e => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="+91 9XXXXXXX"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full h-9 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="lab@email.com"
                  />
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="h-8 px-4 bg-secondary border border-border rounded text-xs hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.lab_name.trim() || isSaving}
                className="h-8 px-4 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                    Saving...
                  </>
                ) : (
                  editingLab ? 'Update Lab' : 'Add Lab'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
