import { useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertTriangle, QrCode } from 'lucide-react';
import { useB2BStore } from '../../stores/b2bStore';

const TEST_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
  processing: { bg: '#f3e8ff', color: '#7c3aed', label: 'Processing' },
  completed: { bg: '#dcfce7', color: '#16a34a', label: 'Completed' },
  approved: { bg: '#ecfdf5', color: '#059669', label: 'Approved' },
  rejected: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
  cancelled: { bg: '#f1f5f9', color: '#64748b', label: 'Cancelled' },
};

export function B2BOrderDetail() {
  const { id } = useParams();
  const { selectedOrder, fetchOrderById, receiveOrder, updateTestStatus, isLoading } = useB2BStore();

  useEffect(() => { if (id) fetchOrderById(id); }, [id, fetchOrderById]);

  if (isLoading || !selectedOrder) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>;
  }

  const order = selectedOrder;

  return (
    <div>
      <Link to="/b2b/orders" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1',
        textDecoration: 'none', fontSize: '14px', marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to Orders
      </Link>

      {/* Order Header */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>
              Order {order.order_code}
            </h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#64748b' }}>
              <span>Lab: <strong>{order.source_lab_name}</strong></span>
              <span>Patient: <strong>{order.patient_name}</strong></span>
              {order.patient_phone && <span>📱 {order.patient_phone}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {order.barcode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px',
                background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <QrCode size={14} color="#64748b" />
                <code style={{ fontSize: '12px' }}>{order.barcode}</code>
              </div>
            )}
            {order.status === 'pending' || order.status === 'sample_sent' ? (
              <button onClick={() => receiveOrder(order.id)} style={{
                padding: '8px 16px', background: '#10b981', color: 'white', border: 'none',
                borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500'
              }}>Mark Received</button>
            ) : null}
          </div>
        </div>

        {/* Sample & Financial Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginTop: '20px' }}>
          {[
            { label: 'Status', value: order.status.replace(/_/g, ' ').toUpperCase() },
            { label: 'Sample Type', value: order.sample_type || '—' },
            { label: 'Container', value: order.container_type || '—' },
            { label: 'Fasting', value: order.fasting_required ? 'Yes' : 'No' },
            { label: 'Collection Price', value: `₹${parseFloat(String(order.total_collection_amount)).toLocaleString()}` },
            { label: 'Processing Cost', value: `₹${parseFloat(String(order.total_processing_amount)).toLocaleString()}` },
            { label: 'Doctor Commission', value: `₹${parseFloat(String(order.doctor_commission)).toLocaleString()}` },
            { label: 'Net Margin', value: `₹${parseFloat(String(order.margin_amount)).toLocaleString()}` },
          ].map((item) => (
            <div key={item.label} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>{item.label}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-Test Status */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>
          Tests ({order.tests?.length || 0})
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Test', 'Category', 'Collection (₹)', 'Processing (₹)', 'TAT', 'Status', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(order.tests || []).map((t) => {
              const sc = TEST_STATUS[t.status] || TEST_STATUS.pending;
              const tatBreached = t.is_tat_breached;
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9',
                  background: tatBreached ? '#fffbeb' : undefined }}>
                  <td style={{ padding: '10px 12px', fontWeight: '500' }}>
                    {t.test_name}
                    {t.is_package && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '4px', marginLeft: '6px' }}>Package</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{t.category || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>₹{parseFloat(String(t.collection_price)).toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}>₹{parseFloat(String(t.processing_price)).toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {t.expected_tat_hours ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {tatBreached ? <AlertTriangle size={14} color="#dc2626" /> : <Clock size={14} color="#94a3b8" />}
                        <span style={{ color: tatBreached ? '#dc2626' : '#64748b' }}>{t.expected_tat_hours}h</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: sc.bg, color: sc.color }}>
                      {sc.label} {t.report_version > 0 ? `v${t.report_version}` : ''}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {t.status === 'pending' && (
                      <button onClick={() => updateTestStatus(t.id, 'processing')} style={{
                        padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '6px',
                        background: 'white', cursor: 'pointer', fontSize: '12px', color: '#6366f1'
                      }}>Start</button>
                    )}
                    {t.status === 'processing' && (
                      <button onClick={() => updateTestStatus(t.id, 'completed')} style={{
                        padding: '4px 10px', border: 'none', borderRadius: '6px',
                        background: '#10b981', cursor: 'pointer', fontSize: '12px', color: 'white'
                      }}>Complete</button>
                    )}
                    {t.status === 'completed' && (
                      <button onClick={() => updateTestStatus(t.id, 'approved')} style={{
                        padding: '4px 10px', border: 'none', borderRadius: '6px',
                        background: '#6366f1', cursor: 'pointer', fontSize: '12px', color: 'white'
                      }}>Approve</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
