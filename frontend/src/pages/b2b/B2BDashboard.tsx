import { useEffect } from 'react';
import { Link } from 'react-router';
import {
  Building2, TrendingUp, Clock, AlertTriangle, ArrowUpRight,
  IndianRupee, Package, CheckCircle, XCircle, BarChart3
} from 'lucide-react';
import { useB2BStore } from '../../stores/b2bStore';

export function B2BDashboard() {
  const { dashboard, fetchDashboard, isLoading } = useB2BStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const stats = dashboard;

  const kpiCards = [
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: Package, color: '#6366f1', bg: '#eef2ff' },
    { label: 'Revenue', value: `₹${(stats?.total_revenue || 0).toLocaleString()}`, icon: IndianRupee, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Margin', value: `₹${(stats?.total_margin || 0).toLocaleString()}`, icon: TrendingUp, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Pending', value: stats?.pending_orders || 0, icon: Clock, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Processing', value: stats?.processing_orders || 0, icon: BarChart3, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Completed', value: stats?.completed_orders || 0, icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Rejected', value: stats?.rejected_orders || 0, icon: XCircle, color: '#ef4444', bg: '#fef2f2' },
    { label: 'TAT Breaches', value: stats?.tat_breaches || 0, icon: AlertTriangle, color: '#f97316', bg: '#fff7ed' },
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: '28px 32px', borderRadius: '16px', marginBottom: '24px',
        color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px',
          background: 'rgba(99, 102, 241, 0.15)', borderRadius: '50%' }} />
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>B2B Reference Lab</h1>
        <p style={{ margin: '6px 0 0', opacity: 0.7, fontSize: '14px' }}>
          Partner lab management, outsource tracking & settlements
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <Link to="/b2b/labs" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)',
            borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '13px',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            Manage Labs
          </Link>
          <Link to="/b2b/orders/new" style={{ padding: '8px 16px', background: '#6366f1',
            borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '13px' }}>
            + New Order
          </Link>
          <Link to="/b2b/orders" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)',
            borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '13px',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            All Orders
          </Link>
          <Link to="/b2b/settlements" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)',
            borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '13px',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            Settlements
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading dashboard...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} style={{
                  background: 'white', borderRadius: '12px', padding: '20px',
                  border: '1px solid #e2e8f0', transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: card.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={card.color} />
                    </div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{card.value}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{card.label}</div>
                </div>
              );
            })}
          </div>

          {/* Financial Summary & Top Labs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Financial */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Financial Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Total Revenue', value: `₹${(stats?.total_revenue || 0).toLocaleString()}`, color: '#10b981' },
                  { label: 'Processing Cost', value: `₹${(stats?.total_cost || 0).toLocaleString()}`, color: '#ef4444' },
                  { label: 'Net Margin', value: `₹${(stats?.total_margin || 0).toLocaleString()}`, color: '#6366f1' },
                  { label: 'Receivable', value: `₹${(stats?.total_receivable || 0).toLocaleString()}`, color: '#f59e0b' },
                  { label: 'Payable', value: `₹${(stats?.total_payable || 0).toLocaleString()}`, color: '#ef4444' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>{item.label}</span>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Labs */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Top Partner Labs</h3>
              {stats?.top_labs && stats.top_labs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.top_labs.map((lab, i) => (
                    <Link key={lab.id} to={`/b2b/labs/${lab.id}`} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px', background: '#f8fafc', borderRadius: '8px',
                      textDecoration: 'none', color: 'inherit', transition: 'background 0.2s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '50%',
                          background: ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'][i] || '#94a3b8',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: '700' }}>{i + 1}</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{lab.lab_name}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{lab.order_count} orders</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                          ₹{parseFloat(String(lab.revenue)).toLocaleString()}
                        </span>
                        <ArrowUpRight size={14} color="#94a3b8" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
                  No partner labs yet
                </div>
              )}
            </div>
          </div>

          {/* TAT Breaches */}
          {stats?.tat_breached_tests && stats.tat_breached_tests.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #fecaca' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#dc2626',
                display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> Delayed Reports (TAT Breached)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #fee2e2' }}>
                      {['Test', 'Order', 'Lab', 'Expected By', 'Delay'].map((h) => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.tat_breached_tests.map((t: any) => {
                      const delayMs = Date.now() - new Date(t.expected_completion_at).getTime();
                      const delayHours = Math.round(delayMs / (1000 * 60 * 60));
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid #fef2f2' }}>
                          <td style={{ padding: '10px 12px', fontWeight: '500' }}>{t.test_name}</td>
                          <td style={{ padding: '10px 12px' }}>{t.order_code}</td>
                          <td style={{ padding: '10px 12px' }}>{t.source_lab_name}</td>
                          <td style={{ padding: '10px 12px' }}>{new Date(t.expected_completion_at).toLocaleString()}</td>
                          <td style={{ padding: '10px 12px', color: '#dc2626', fontWeight: '600' }}>
                            {delayHours}h late
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
