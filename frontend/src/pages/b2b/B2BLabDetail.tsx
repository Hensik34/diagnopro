import { useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Building2, IndianRupee, CreditCard } from 'lucide-react';
import { useB2BStore } from '../../stores/b2bStore';

export function B2BLabDetail() {
  const { id } = useParams();
  const { selectedLab, fetchLabById, rateList, fetchRateList, isLoading } = useB2BStore();

  useEffect(() => {
    if (id) { fetchLabById(id); fetchRateList(id); }
  }, [id, fetchLabById, fetchRateList]);

  if (isLoading || !selectedLab) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>;
  }

  const lab = selectedLab;

  return (
    <div>
      <Link to="/b2b/labs" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1',
        textDecoration: 'none', fontSize: '14px', marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to Labs
      </Link>

      {/* Lab Info Card */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Building2 size={22} color="#6366f1" />
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>{lab.lab_name}</h2>
              <code style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px' }}>{lab.lab_code}</code>
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              {lab.contact_person} · {lab.mobile} · {lab.city}, {lab.state}
            </p>
          </div>
          <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500',
            background: lab.status === 'active' ? '#ecfdf5' : '#fef2f2',
            color: lab.status === 'active' ? '#10b981' : '#ef4444'
          }}>{lab.status}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px' }}>
          {[
            { icon: IndianRupee, label: 'Balance', value: `₹${parseFloat(String(lab.current_balance)).toLocaleString()}`,
              color: parseFloat(String(lab.current_balance)) > 0 ? '#f59e0b' : '#10b981' },
            { icon: CreditCard, label: 'Credit Limit', value: `₹${parseFloat(String(lab.credit_limit)).toLocaleString()}`, color: '#3b82f6' },
            { icon: IndianRupee, label: 'Commission', value: `${lab.commission_value}${lab.commission_type === 'percentage' ? '%' : ' fixed'}`, color: '#6366f1' },
            { icon: Building2, label: 'Type', value: lab.lab_type, color: '#64748b' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Icon size={14} color="#94a3b8" />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.label}</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: item.color }}>{item.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rate List */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>Rate List ({rateList.length} tests)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Test', 'Category', 'Collection Price (₹)', 'Processing Price (₹)', 'Margin (₹)'].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rateList.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No rates configured</td></tr>
            ) : rateList.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 12px', fontWeight: '500' }}>{r.test_name}</td>
                <td style={{ padding: '10px 12px' }}>{r.category || '—'}</td>
                <td style={{ padding: '10px 12px' }}>₹{parseFloat(String(r.collection_price)).toLocaleString()}</td>
                <td style={{ padding: '10px 12px' }}>₹{parseFloat(String(r.processing_price)).toLocaleString()}</td>
                <td style={{ padding: '10px 12px', fontWeight: '600', color: '#10b981' }}>
                  ₹{(parseFloat(String(r.collection_price)) - parseFloat(String(r.processing_price))).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
