import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Building2, Search, Edit2, Trash2, Eye } from 'lucide-react';
import { useB2BStore } from '../../stores/b2bStore';
import type { CreateB2BLabData } from '../../types/b2b';

export function B2BLabManagement() {
  const { labs, fetchLabs, createLab, deleteLab, isLoading } = useB2BStore();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CreateB2BLabData>({
    lab_name: '', lab_code: '', contact_person: '', mobile: '', email: '',
    address: '', city: '', state: '', pincode: '', commission_type: 'percentage',
    commission_value: 0, credit_limit: 0, lab_type: 'collection',
  });

  useEffect(() => { fetchLabs(); }, [fetchLabs]);

  const filtered = labs.filter((l) =>
    l.lab_name.toLowerCase().includes(search.toLowerCase()) ||
    l.lab_code.toLowerCase().includes(search.toLowerCase()) ||
    (l.contact_person || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLab(form);
      setShowForm(false);
      setForm({ lab_name: '', lab_code: '', contact_person: '', mobile: '', email: '',
        address: '', city: '', state: '', pincode: '', commission_type: 'percentage',
        commission_value: 0, credit_limit: 0, lab_type: 'collection' });
    } catch { /* error handled in store */ }
  };

  const statusColor: Record<string, { bg: string; color: string }> = {
    active: { bg: '#ecfdf5', color: '#10b981' },
    inactive: { bg: '#f1f5f9', color: '#64748b' },
    suspended: { bg: '#fef2f2', color: '#ef4444' },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>Partner Labs</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{labs.length} labs registered</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
          background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px',
          cursor: 'pointer', fontSize: '14px', fontWeight: '500'
        }}>
          <Plus size={16} /> Add Lab
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search labs..."
          style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0',
            borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '20px',
          border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>New Partner Lab</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {[
                { key: 'lab_name', label: 'Lab Name*', required: true },
                { key: 'lab_code', label: 'Lab Code*', required: true },
                { key: 'contact_person', label: 'Contact Person' },
                { key: 'mobile', label: 'Mobile' },
                { key: 'email', label: 'Email' },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'pincode', label: 'Pincode' },
                { key: 'gst_number', label: 'GST Number' },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input value={(form as any)[f.key] || ''} required={f.required}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0',
                      borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Commission Type</label>
                <select value={form.commission_type} onChange={(e) => setForm({ ...form, commission_type: e.target.value as any })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Commission Value</label>
                <input type="number" value={form.commission_value || ''} onChange={(e) => setForm({ ...form, commission_value: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Credit Limit (₹)</label>
                <input type="number" value={form.credit_limit || ''} onChange={(e) => setForm({ ...form, credit_limit: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{
                padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={isLoading} style={{
                padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                {isLoading ? 'Creating...' : 'Create Lab'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Labs Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Lab', 'Code', 'Contact', 'Commission', 'Balance', 'Credit Limit', 'Status', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No labs found</td></tr>
            ) : filtered.map((lab) => (
              <tr key={lab.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                <td style={{ padding: '12px', fontWeight: '500', color: '#1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} color="#6366f1" />
                    {lab.lab_name}
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <code style={{ padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px' }}>{lab.lab_code}</code>
                </td>
                <td style={{ padding: '12px' }}>
                  <div>{lab.contact_person || '—'}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{lab.mobile || ''}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  {lab.commission_value}{lab.commission_type === 'percentage' ? '%' : ' (fixed)'}
                </td>
                <td style={{ padding: '12px', fontWeight: '600', color: lab.current_balance > 0 ? '#f59e0b' : '#10b981' }}>
                  ₹{parseFloat(String(lab.current_balance)).toLocaleString()}
                </td>
                <td style={{ padding: '12px' }}>₹{parseFloat(String(lab.credit_limit)).toLocaleString()}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                    background: statusColor[lab.status]?.bg || '#f1f5f9',
                    color: statusColor[lab.status]?.color || '#64748b'
                  }}>{lab.status}</span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Link to={`/b2b/labs/${lab.id}`} style={{
                      padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0',
                      background: 'white', cursor: 'pointer', display: 'flex', textDecoration: 'none' }}>
                      <Eye size={14} color="#64748b" />
                    </Link>
                    <button onClick={() => { if (confirm('Deactivate this lab?')) deleteLab(lab.id); }} style={{
                      padding: '6px', borderRadius: '6px', border: '1px solid #fecaca',
                      background: '#fff5f5', cursor: 'pointer', display: 'flex' }}>
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
