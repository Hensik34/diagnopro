import { useState, useEffect } from 'react';
import { 
  Calendar,
  User,
  Loader2,
  AlertCircle,
  Image,
  X,
  Gauge
} from 'lucide-react';
import { useCollectionTrackingStore } from '../../stores/collectionTrackingStore';
import { useAuthStore } from '../../stores';
import type { CollectionTracking } from '../../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function SampleCollection() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'lab_technician';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-0.5">Sample Collection & Bike Meter Logs</h1>
          <p className="text-muted-foreground text-xs">
            {isAdmin ? 'Monitor staff odometer readings, shift meter photos, and petrol payments' : 'Your shift meter readings and photo logs'}
          </p>
        </div>
      </div>

      {isAdmin ? <AdminView /> : <StaffView />}
    </div>
  );
}

/* ─── Image Preview Modal ─── */
function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-7 h-7 bg-card border border-border rounded-full flex items-center justify-center hover:bg-accent z-10"
        >
          <X className="w-4 h-4" />
        </button>
        <img src={src} alt="Meter" className="max-w-full max-h-[85vh] rounded object-contain" />
      </div>
    </div>
  );
}

/* ─── Image Thumbnail Button ─── */
function ImageButton({ imagePath, label }: { imagePath: string | null; label: string }) {
  const [showModal, setShowModal] = useState(false);
  if (!imagePath) return <span className="text-muted-foreground">-</span>;
  const fullUrl = imagePath.startsWith('http') || imagePath.startsWith('data:') ? imagePath : `${API_BASE}${imagePath}`;
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
        title={`View ${label}`}
      >
        <Image className="w-3.5 h-3.5" />
        View {label}
      </button>
      {showModal && <ImageModal src={fullUrl} onClose={() => setShowModal(false)} />}
    </>
  );
}

/* ─── Staff View ─── */
function StaffView() {
  const { myRecords, isLoading, error, fetchMyRecords } = useCollectionTrackingStore();

  useEffect(() => {
    fetchMyRecords();
  }, [fetchMyRecords]);

  if (isLoading && myRecords.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading your shift logs...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-2.5 flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ─── My Records List ─── */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">My Monthly Shift Odometer Logs</h3>
          <span className="text-xs text-muted-foreground">Odometer & photos synced automatically on Check-In & Check-Out</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Start KM</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">End KM</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Total KM</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Petrol</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Visit</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Total</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Meter Photos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {myRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground text-xs">
                    <Gauge className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No shift meter logs recorded yet this month
                  </td>
                </tr>
              ) : (
                myRecords.map((r) => {
                  const startKmVal = r.start_km != null ? Number(r.start_km) : null;
                  const endKmVal = r.end_km != null ? Number(r.end_km) : null;
                  const km = r.total_km != null ? Number(r.total_km) : (startKmVal != null && endKmVal != null ? Math.max(0, endKmVal - startKmVal) : null);
                  const rate = Number(r.per_km_rate ?? 0);
                  const petrol = km != null ? km * rate : null;
                  const total = (petrol ?? 0) + Number(r.visit_charge ?? 0);
                  return (
                    <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-3 py-2.5 text-xs text-foreground tabular-nums font-medium">
                        {new Date(r.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums">{r.start_km ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums">{r.end_km ?? '-'}</td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums font-semibold">{km != null ? `${km} KM` : '-'}</td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums">
                        {petrol != null ? `₹${petrol.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums">
                        {r.visit_charge ? `₹${r.visit_charge}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums font-semibold">
                        {total ? `₹${total.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <ImageButton imagePath={r.start_meter_image} label="Start" />
                          <ImageButton imagePath={r.end_meter_image} label="End" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {myRecords.length > 0 && (
          <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {myRecords.length} record{myRecords.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-4 text-xs text-foreground tabular-nums font-medium">
              <span>
                Total KM:{' '}
                {myRecords.reduce((s, r) => {
                  const startKmVal = r.start_km != null ? Number(r.start_km) : null;
                  const endKmVal = r.end_km != null ? Number(r.end_km) : null;
                  const km = r.total_km != null ? Number(r.total_km) : (startKmVal != null && endKmVal != null ? Math.max(0, endKmVal - startKmVal) : 0);
                  return s + km;
                }, 0)} KM
              </span>
              <span>
                Total: ₹
                {myRecords.reduce((s, r) => {
                  const startKmVal = r.start_km != null ? Number(r.start_km) : null;
                  const endKmVal = r.end_km != null ? Number(r.end_km) : null;
                  const km = r.total_km != null ? Number(r.total_km) : (startKmVal != null && endKmVal != null ? Math.max(0, endKmVal - startKmVal) : 0);
                  return s + km * Number(r.per_km_rate ?? 0) + Number(r.visit_charge ?? 0);
                }, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Admin View ─── */
function AdminView() {
  const { records, staffList, isLoading, fetchRecords, fetchStaffList } =
    useCollectionTrackingStore();

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [staffId, setStaffId] = useState('');

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  useEffect(() => {
    fetchRecords({ date_from: dateFrom, date_to: dateTo, staff_id: staffId || undefined });
  }, [dateFrom, dateTo, staffId, fetchRecords]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card border border-border rounded p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">From</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                className="w-full h-8 pl-8 pr-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">To</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                className="w-full h-8 pl-8 pr-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Staff Filter</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select
                className="w-full h-8 pl-8 pr-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              >
                <option value="">All Staff</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstname} {s.lastname}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Staff Name</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Start KM</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">End KM</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Total KM</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">₹/km</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Petrol Cost</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Visit</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Total</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Meter Photos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground text-xs">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                    Loading shift logs...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground text-xs">
                    No shift meter logs found for selected criteria
                  </td>
                </tr>
              ) : (
                records.map((r: CollectionTracking) => {
                  const startKm = r.start_km != null ? Number(r.start_km) : null;
                  const endKmVal = r.end_km != null ? Number(r.end_km) : null;
                  const totalKm = r.total_km != null ? Number(r.total_km) : (startKm != null && endKmVal != null ? endKmVal - startKm : null);
                  const rate = Number(r.per_km_rate ?? r.staff_petrol_price ?? 0);
                  const petrolCost = totalKm != null ? totalKm * rate : null;
                  const totalAmount = (petrolCost ?? 0) + Number(r.visit_charge ?? 0);

                  return (
                    <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-3 py-2.5 text-xs text-foreground tabular-nums font-medium">
                        {new Date(r.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground font-medium">
                        {r.staff_firstname} {r.staff_lastname}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums">
                        {r.start_km ?? '-'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums">
                        {r.end_km ?? '-'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums font-semibold">
                        {totalKm != null ? `${totalKm} KM` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums">
                        {rate ? `₹${rate}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums">
                        {petrolCost != null ? `₹${petrolCost.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums">
                        {r.visit_charge ? `₹${r.visit_charge}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums font-semibold">
                        {totalAmount ? `₹${totalAmount.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-3">
                          <ImageButton imagePath={r.start_meter_image} label="Start" />
                          <ImageButton imagePath={r.end_meter_image} label="End" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer totals */}
        {records.length > 0 && (
          <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {records.length} record{records.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-4 text-xs text-foreground tabular-nums font-medium">
              <span>
                Total KM:{' '}
                {records.reduce((sum: number, r: CollectionTracking) => {
                  const startKm = r.start_km != null ? Number(r.start_km) : null;
                  const endKmVal = r.end_km != null ? Number(r.end_km) : null;
                  const km = r.total_km != null ? Number(r.total_km) : (startKm != null && endKmVal != null ? Math.max(0, endKmVal - startKm) : 0);
                  return sum + km;
                }, 0)} KM
              </span>
              <span>
                Total: ₹
                {records.reduce((sum: number, r: CollectionTracking) => {
                  const startKm = r.start_km != null ? Number(r.start_km) : null;
                  const endKmVal = r.end_km != null ? Number(r.end_km) : null;
                  const km = r.total_km != null ? Number(r.total_km) : (startKm != null && endKmVal != null ? Math.max(0, endKmVal - startKm) : 0);
                  const cost = km * Number(r.per_km_rate ?? 0) + Number(r.visit_charge ?? 0);
                  return sum + cost;
                }, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
