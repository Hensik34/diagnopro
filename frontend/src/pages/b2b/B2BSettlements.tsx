import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { IndianRupee, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { useB2BStore } from '../../stores/b2bStore';
import type { RecordB2BPaymentData, B2BPaymentType } from '../../types/b2b';
import { b2bApi } from '../../api/b2b';

export function B2BSettlements() {
  const { labs, fetchLabs, payments, fetchPayments, ledger, fetchLedger, recordPayment, isLoading } = useB2BStore();
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  const [settlementData, setSettlementData] = useState<any[]>([]);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState<RecordB2BPaymentData>({
    b2b_lab_id: '', payment_type: 'settlement', amount: 0, payment_mode: 'bank_transfer', reference_number: '', notes: '',
  });

  useEffect(() => { fetchLabs(); loadSettlements(); }, [fetchLabs]);

  useEffect(() => {
    if (selectedLabId) {
      fetchPayments(selectedLabId);
      fetchLedger(selectedLabId);
    }
  }, [selectedLabId, fetchPayments, fetchLedger]);

  const loadSettlements = async () => {
    try {
      const data = await b2bApi.getSettlementSummary();
      setSettlementData(data);
    } catch {}
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.b2b_lab_id || !payForm.amount) return;
    try {
      await recordPayment(payForm);
      setShowPayForm(false);
      loadSettlements();
    } catch {}
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>Settlements</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Payment tracking & reconciliation</p>
        </div>
        <button onClick={() => setShowPayForm(!showPayForm)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
          background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px'
        }}><Plus size={16} /> Record Payment</button>
      </div>

      {/* Payment Form */}
      {showPayForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>Record Payment</h3>
          <form onSubmit={handlePayment}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Lab *</label>
                <select value={payForm.b2b_lab_id} onChange={(e) => setPayForm({ ...payForm, b2b_lab_id: e.target.value })} required
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="">Select Lab</option>
                  {labs.map((l) => <option key={l.id} value={l.id}>{l.lab_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Type</label>
                <select value={payForm.payment_type} onChange={(e) => setPayForm({ ...payForm, payment_type: e.target.value as B2BPaymentType })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="settlement">Settlement</option>
                  <option value="advance">Advance</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Amount (₹) *</label>
                <input type="number" value={payForm.amount || ''} onChange={(e) => setPayForm({ ...payForm, amount: parseFloat(e.target.value) || 0 })} required
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Mode</label>
                <select value={payForm.payment_mode || ''} onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
                  {['cash', 'upi', 'bank_transfer', 'cheque', 'neft', 'rtgs'].map((m) => (
                    <option key={m} value={m}>{m.replace(/_/g, ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Reference</label>
                <input value={payForm.reference_number || ''} onChange={(e) => setPayForm({ ...payForm, reference_number: e.target.value })}
                  placeholder="Transaction ID"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label>
                <input value={payForm.notes || ''} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowPayForm(false)} style={{
                padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={isLoading} style={{
                padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                {isLoading ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settlement Summary Table */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>Lab-wise Settlement</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Lab', 'Orders', 'Collection', 'Processing', 'Paid', 'Balance', 'Credit Limit', ''].map((h) => (
                <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {settlementData.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No settlement data</td></tr>
            ) : settlementData.map((s: any) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                background: selectedLabId === String(s.id) ? '#f8fafc' : 'white' }}
                onClick={() => setSelectedLabId(String(s.id))}>
                <td style={{ padding: '12px', fontWeight: '500' }}>{s.lab_name}</td>
                <td style={{ padding: '12px' }}>{s.total_orders}</td>
                <td style={{ padding: '12px' }}>₹{parseFloat(s.total_collection || 0).toLocaleString()}</td>
                <td style={{ padding: '12px' }}>₹{parseFloat(s.total_processing || 0).toLocaleString()}</td>
                <td style={{ padding: '12px', color: '#10b981' }}>₹{parseFloat(s.total_paid || 0).toLocaleString()}</td>
                <td style={{ padding: '12px', fontWeight: '600',
                  color: parseFloat(s.current_balance) > 0 ? '#f59e0b' : '#10b981' }}>
                  ₹{parseFloat(s.current_balance || 0).toLocaleString()}
                </td>
                <td style={{ padding: '12px' }}>₹{parseFloat(s.credit_limit || 0).toLocaleString()}</td>
                <td style={{ padding: '12px' }}>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedLabId(String(s.id)); }} style={{
                    padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '6px',
                    background: 'white', cursor: 'pointer', fontSize: '12px', color: '#6366f1'
                  }}>Ledger</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ledger Detail */}
      {selectedLabId && ledger && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              Ledger: {ledger.lab.lab_name}
            </h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Outstanding</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b' }}>₹{ledger.outstanding.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Credit Available</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>₹{ledger.credit_available.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Date', 'Type', 'Order', 'Amount', 'Balance', 'Mode', 'Ref', 'By'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No transactions</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                      background: p.payment_type === 'credit' ? '#fef3c7' : p.payment_type === 'settlement' ? '#dcfce7' : '#e0e7ff',
                      color: p.payment_type === 'credit' ? '#d97706' : p.payment_type === 'settlement' ? '#16a34a' : '#4f46e5',
                    }}>{p.payment_type}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{p.order_code || '—'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px',
                      color: p.payment_type === 'credit' ? '#dc2626' : '#10b981' }}>
                      {p.payment_type === 'credit' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      ₹{parseFloat(String(p.amount)).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: '500' }}>₹{parseFloat(String(p.running_balance)).toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}>{(p.payment_mode || '—').replace(/_/g, ' ')}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>{p.reference_number || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>
                    {p.creator_firstname ? `${p.creator_firstname} ${p.creator_lastname || ''}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
