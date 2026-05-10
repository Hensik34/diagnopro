import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Trash2 } from 'lucide-react';
import { useB2BStore } from '../../stores/b2bStore';
import { useTestStore } from '../../stores/testStore';
import { usePatientStore } from '../../stores/patientStore';

export function B2BCreateOrder() {
  const navigate = useNavigate();
  const { labs, fetchLabs, createOrder, isLoading, error } = useB2BStore();
  const { tests, fetchTests } = useTestStore();
  const { patients, fetchPatients } = usePatientStore();

  const [form, setForm] = useState({
    source_lab_id: '', patient_id: '', patient_name: '', patient_age: 0,
    patient_gender: '', patient_phone: '', sample_type: '', container_type: '',
    fasting_required: false, notes: '',
  });
  const [selectedTests, setSelectedTests] = useState<{
    test_id: string; test_name: string; collection_price: number;
    processing_price: number; expected_tat_hours: number;
  }[]>([]);

  useEffect(() => { fetchLabs(); fetchTests(); fetchPatients(); }, [fetchLabs, fetchTests, fetchPatients]);

  const selectedPatient = patients.find((p) => p.id === form.patient_id);
  useEffect(() => {
    if (selectedPatient) {
      setForm((f) => ({
        ...f, patient_name: selectedPatient.name, patient_age: selectedPatient.age || 0,
        patient_gender: selectedPatient.gender || '', patient_phone: selectedPatient.phone || '',
      }));
    }
  }, [selectedPatient]);

  const addTest = (testId: string) => {
    const test = tests.find((t) => t.id === testId);
    if (!test || selectedTests.some((s) => s.test_id === testId)) return;
    setSelectedTests([...selectedTests, {
      test_id: test.id, test_name: test.test_name,
      collection_price: test.price || 0, processing_price: 0, expected_tat_hours: test.turnaround_time || 24,
    }]);
  };

  const removeTest = (testId: string) => {
    setSelectedTests(selectedTests.filter((t) => t.test_id !== testId));
  };

  const updateTestPrice = (testId: string, field: string, value: number) => {
    setSelectedTests(selectedTests.map((t) =>
      t.test_id === testId ? { ...t, [field]: value } : t
    ));
  };

  const totalCollection = selectedTests.reduce((s, t) => s + t.collection_price, 0);
  const totalProcessing = selectedTests.reduce((s, t) => s + t.processing_price, 0);
  const margin = totalCollection - totalProcessing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.source_lab_id || selectedTests.length === 0) return;
    try {
      const order = await createOrder({
        ...form,
        source_lab_id: form.source_lab_id,
        tests: selectedTests,
      });
      navigate(`/b2b/orders/${order.id}`);
    } catch { /* handled in store */ }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>
        Create Outsource Order
      </h2>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '10px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Lab & Patient */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>Order Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Collection Lab *</label>
              <select value={form.source_lab_id} onChange={(e) => setForm({ ...form, source_lab_id: e.target.value })} required
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
                <option value="">Select Lab</option>
                {labs.filter((l) => l.status === 'active').map((l) => (
                  <option key={l.id} value={l.id}>{l.lab_name} ({l.lab_code})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Patient</label>
              <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Sample Type</label>
              <input value={form.sample_type} onChange={(e) => setForm({ ...form, sample_type: e.target.value })}
                placeholder="e.g. Blood, Urine, Serum"
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Container Type</label>
              <input value={form.container_type} onChange={(e) => setForm({ ...form, container_type: e.target.value })}
                placeholder="e.g. EDTA, Plain, Fluoride"
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* Test Selection */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>Select Tests</h3>
          <select onChange={(e) => { addTest(e.target.value); e.target.value = ''; }}
            style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' }}>
            <option value="">+ Add Test</option>
            {tests.filter((t) => !selectedTests.some((s) => s.test_id === t.id)).map((t) => (
              <option key={t.id} value={t.id}>{t.test_name} ({t.category}) — ₹{t.price || 0}</option>
            ))}
          </select>

          {selectedTests.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Test', 'Collection Price (₹)', 'Processing Cost (₹)', 'TAT (hrs)', 'Margin', ''].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedTests.map((t) => (
                  <tr key={t.test_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 10px', fontWeight: '500' }}>{t.test_name}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="number" value={t.collection_price} onChange={(e) => updateTestPrice(t.test_id, 'collection_price', parseFloat(e.target.value) || 0)}
                        style={{ width: '80px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="number" value={t.processing_price} onChange={(e) => updateTestPrice(t.test_id, 'processing_price', parseFloat(e.target.value) || 0)}
                        style={{ width: '80px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="number" value={t.expected_tat_hours} onChange={(e) => updateTestPrice(t.test_id, 'expected_tat_hours', parseInt(e.target.value) || 0)}
                        style={{ width: '60px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: '600', color: '#10b981' }}>
                      ₹{(t.collection_price - t.processing_price).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <button type="button" onClick={() => removeTest(t.test_id)} style={{
                        padding: '4px', border: 'none', background: '#fef2f2', borderRadius: '4px', cursor: 'pointer' }}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary & Submit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'white', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Collection Total</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>₹{totalCollection.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Processing Cost</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>₹{totalProcessing.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Net Margin</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>₹{margin.toLocaleString()}</div>
            </div>
          </div>
          <button type="submit" disabled={isLoading || selectedTests.length === 0} style={{
            padding: '12px 28px', background: selectedTests.length === 0 ? '#94a3b8' : '#6366f1',
            color: 'white', border: 'none', borderRadius: '10px', cursor: selectedTests.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '15px', fontWeight: '600'
          }}>
            {isLoading ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
