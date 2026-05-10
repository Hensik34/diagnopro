import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Search, Filter, Eye, Package } from 'lucide-react';
import { useB2BStore } from '../../stores/b2bStore';
import type { B2BOrderStatus } from '../../types/b2b';

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
  sample_sent: { bg: '#dbeafe', color: '#2563eb', label: 'Sample Sent' },
  sample_received: { bg: '#e0e7ff', color: '#4f46e5', label: 'Received' },
  processing: { bg: '#f3e8ff', color: '#7c3aed', label: 'Processing' },
  partial_complete: { bg: '#fef3c7', color: '#ea580c', label: 'Partial' },
  completed: { bg: '#dcfce7', color: '#16a34a', label: 'Completed' },
  report_released: { bg: '#ecfdf5', color: '#059669', label: 'Released' },
  rejected: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
  cancelled: { bg: '#f1f5f9', color: '#64748b', label: 'Cancelled' },
};

export function B2BOrders() {
  const { orders, fetchOrders, isLoading } = useB2BStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchOrders(statusFilter ? { status: statusFilter as B2BOrderStatus } : undefined);
  }, [fetchOrders, statusFilter]);

  const filtered = orders.filter((o) =>
    o.order_code.toLowerCase().includes(search.toLowerCase()) ||
    (o.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.source_lab_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.barcode || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>Outsource Orders</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{orders.length} total orders</p>
        </div>
        <Link to="/b2b/orders/new" style={{
          padding: '10px 18px', background: '#6366f1', color: 'white', border: 'none',
          borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '500'
        }}>+ New Order</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order code, patient, lab, barcode..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0',
              borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', minWidth: '160px' }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Status Pipeline */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = orders.filter((o) => o.status === key).length;
          return (
            <button key={key} onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                border: statusFilter === key ? `2px solid ${config.color}` : '1px solid #e2e8f0',
                background: statusFilter === key ? config.bg : 'white',
                color: config.color, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Order', 'Patient', 'Lab', 'Tests', 'Amount', 'Margin', 'Status', 'Date', ''].map((h) => (
                <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No orders found</td></tr>
            ) : filtered.map((o) => {
              const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{o.order_code}</div>
                    {o.barcode && <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{o.barcode}</div>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '500' }}>{o.patient_name || '—'}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{o.patient_phone || ''}</div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{o.source_lab_name || '—'}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Package size={14} color="#94a3b8" />
                      <span>{o.test_count || 0}</span>
                      {(o.tat_breach_count || 0) > 0 && (
                        <span style={{ padding: '1px 6px', background: '#fef2f2', color: '#dc2626', borderRadius: '10px', fontSize: '11px' }}>
                          {o.tat_breach_count} late
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: '500' }}>₹{parseFloat(String(o.total_collection_amount)).toLocaleString()}</td>
                  <td style={{ padding: '12px', fontWeight: '600', color: '#10b981' }}>₹{parseFloat(String(o.margin_amount)).toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Link to={`/b2b/orders/${o.id}`} style={{
                      padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0',
                      background: 'white', textDecoration: 'none', fontSize: '12px', color: '#6366f1', fontWeight: '500'
                    }}>View</Link>
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
