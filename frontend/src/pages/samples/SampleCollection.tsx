import { useState, useEffect, useRef } from 'react';
import { 
  Calendar,
  User,
  Camera,
  Save,
  Loader2,
  AlertCircle,
  Image,
  X,
  Fuel,
} from 'lucide-react';
import { useCollectionTrackingStore } from '../../stores/collectionTrackingStore';
import { useAuthStore, useBranchStore } from '../../stores';
import type { CollectionTracking } from '../../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function SampleCollection() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-foreground text-lg mb-0.5">Sample Collection</h1>
        <p className="text-muted-foreground text-xs">
          {isAdmin ? 'Track staff KM and calculate payments' : 'Enter your daily KM readings'}
        </p>
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
  const fullUrl = imagePath.startsWith('http') ? imagePath : `${API_BASE}${imagePath}`;
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
        title={`View ${label}`}
      >
        <Image className="w-3.5 h-3.5" />
        View
      </button>
      {showModal && <ImageModal src={fullUrl} onClose={() => setShowModal(false)} />}
    </>
  );
}

/* ─── Staff View ─── */
function StaffView() {
  const { todayRecords, myRecords, isLoading, error, fetchToday, fetchMyRecords, createRecord, clearError } =
    useCollectionTrackingStore();
  const { user } = useAuthStore();
  const { currentBranchId } = useBranchStore();

  const [startKm, setStartKm] = useState('');
  const [endKm, setEndKm] = useState('');
  const [visitCharge, setVisitCharge] = useState('');
  const [saving, setSaving] = useState(false);

  const startImageRef = useRef<HTMLInputElement>(null);
  const endImageRef = useRef<HTMLInputElement>(null);

  const [startImageName, setStartImageName] = useState<string | null>(null);
  const [endImageName, setEndImageName] = useState<string | null>(null);

  useEffect(() => {
    fetchToday();
    fetchMyRecords();
  }, [fetchToday, fetchMyRecords]);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const resetForm = () => {
    setStartKm('');
    setEndKm('');
    setVisitCharge('');
    setStartImageName(null);
    setEndImageName(null);
    if (startImageRef.current) startImageRef.current.value = '';
    if (endImageRef.current) endImageRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    clearError();
    try {
      const data: Record<string, any> = {};
      if (startKm) data.start_km = Number(startKm);
      if (endKm) data.end_km = Number(endKm);
      if (visitCharge) data.visit_charge = Number(visitCharge);
      if (currentBranchId) data.branch_id = currentBranchId;

      if (startImageRef.current?.files?.[0]) {
        data.start_meter_image = await toBase64(startImageRef.current.files[0]);
      }
      if (endImageRef.current?.files?.[0]) {
        data.end_meter_image = await toBase64(endImageRef.current.files[0]);
      }

      await createRecord(data as any);
      resetForm();
      fetchToday();
      fetchMyRecords();
    } catch {
      // error handled by store
    } finally {
      setSaving(false);
    }
  };

  const totalKm =
    startKm && endKm ? Math.max(0, Number(endKm) - Number(startKm)) : null;
  const petrolPrice = user?.petrol_price_per_km ?? 0;
  const petrolCost = totalKm != null && petrolPrice ? totalKm * petrolPrice : null;

  if (isLoading && todayRecords.length === 0 && myRecords.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading...
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

      {/* ─── Add New Entry ─── */}
      <div className="bg-card border border-border rounded p-3 space-y-3">
        <h3 className="text-xs text-muted-foreground uppercase tracking-wider">New Entry</h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Start KM */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground block">Start KM</label>
            <input
              type="number"
              className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
              placeholder="Enter start KM"
              value={startKm}
              onChange={(e) => setStartKm(e.target.value)}
            />
            <input
              ref={startImageRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setStartImageName(e.target.files?.[0]?.name ?? null)}
            />
            <button
              type="button"
              onClick={() => startImageRef.current?.click()}
              className="h-7 px-2.5 flex items-center gap-1.5 bg-secondary border border-border rounded text-[11px] hover:bg-accent transition-colors"
            >
              <Camera className="w-3 h-3 text-muted-foreground" />
              {startImageName ?? 'Meter photo'}
            </button>
          </div>

          {/* End KM */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground block">End KM</label>
            <input
              type="number"
              className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
              placeholder="Enter end KM"
              value={endKm}
              onChange={(e) => setEndKm(e.target.value)}
            />
            <input
              ref={endImageRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setEndImageName(e.target.files?.[0]?.name ?? null)}
            />
            <button
              type="button"
              onClick={() => endImageRef.current?.click()}
              className="h-7 px-2.5 flex items-center gap-1.5 bg-secondary border border-border rounded text-[11px] hover:bg-accent transition-colors"
            >
              <Camera className="w-3 h-3 text-muted-foreground" />
              {endImageName ?? 'Meter photo'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Visit Charge */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground block">Visit Charge (₹)</label>
            <input
              type="number"
              className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
              placeholder="0"
              value={visitCharge}
              onChange={(e) => setVisitCharge(e.target.value)}
            />
          </div>

          {/* Total KM + Cost summary */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground block">Summary</label>
            <div className="h-8 px-2.5 bg-secondary border border-border rounded flex items-center justify-between text-xs tabular-nums">
              <span className="text-muted-foreground">{totalKm != null ? `${totalKm} km` : '-'}</span>
              <span className="text-foreground font-medium">
                {(petrolCost !== null || Number(visitCharge) > 0)
                  ? `₹${((petrolCost ?? 0) + Number(visitCharge || 0)).toFixed(2)}`
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !startKm}
          className="w-full h-8 flex items-center justify-center gap-2 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Entry
        </button>
      </div>

      {/* ─── Records List ─── */}
      <div className="bg-card border border-border rounded overflow-hidden">
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
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Images</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {myRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground text-xs">
                    No records yet
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
                      <td className="px-3 py-2 text-xs text-foreground tabular-nums">
                        {new Date(r.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">{r.start_km ?? '-'}</td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">{r.end_km ?? '-'}</td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums font-medium">{km ?? '-'}</td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">
                        {petrol != null ? `₹${petrol.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">
                        {r.visit_charge ? `₹${r.visit_charge}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums font-medium">
                        {total ? `₹${total.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <ImageButton imagePath={r.start_meter_image} label="Start meter" />
                          <ImageButton imagePath={r.end_meter_image} label="End meter" />
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
                }, 0)}
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
        <div className="grid grid-cols-3 gap-3">
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
            <label className="text-xs text-muted-foreground block mb-1.5">Staff</label>
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
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Images</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground text-xs">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                    Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground text-xs">
                    No records found
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
                      <td className="px-3 py-2 text-xs text-foreground tabular-nums">
                        {new Date(r.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground">
                        {r.staff_firstname} {r.staff_lastname}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">
                        {r.start_km ?? '-'}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">
                        {r.end_km ?? '-'}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums font-medium">
                        {totalKm ?? '-'}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">
                        {rate ? `₹${rate}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">
                        {petrolCost != null ? `₹${petrolCost.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">
                        {r.visit_charge ? `₹${r.visit_charge}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums font-medium">
                        {totalAmount ? `₹${totalAmount.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1.5">
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
                }, 0)}
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
