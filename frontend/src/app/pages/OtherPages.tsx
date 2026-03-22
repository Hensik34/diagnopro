import { useState } from 'react';
import { Plus, Search, Package, AlertCircle, TrendingDown, CheckCircle, X } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  category: 'Reagent' | 'Kit';
  quantity: number;
  alertThreshold: number;
  unit: string;
  status: 'in-stock' | 'low' | 'out';
  lastRestocked: string;
}

const MOCK_STOCK: StockItem[] = [
  { id: 'ST-001', name: 'CBC Reagent Pack', category: 'Reagent', quantity: 45, alertThreshold: 20, unit: 'packs', status: 'in-stock', lastRestocked: '2024-03-10' },
  { id: 'ST-002', name: 'Blood Glucose Strips', category: 'Kit', quantity: 15, alertThreshold: 25, unit: 'boxes', status: 'low', lastRestocked: '2024-03-05' },
  { id: 'ST-003', name: 'Thyroid Test Kit', category: 'Kit', quantity: 0, alertThreshold: 10, unit: 'kits', status: 'out', lastRestocked: '2024-02-28' },
  { id: 'ST-004', name: 'Lipid Profile Reagent', category: 'Reagent', quantity: 32, alertThreshold: 15, unit: 'bottles', status: 'in-stock', lastRestocked: '2024-03-12' },
  { id: 'ST-005', name: 'HbA1c Test Kit', category: 'Kit', quantity: 8, alertThreshold: 12, unit: 'kits', status: 'low', lastRestocked: '2024-03-08' },
  { id: 'ST-006', name: 'Urine Analysis Strips', category: 'Kit', quantity: 65, alertThreshold: 30, unit: 'boxes', status: 'in-stock', lastRestocked: '2024-03-14' },
  { id: 'ST-007', name: 'ESR Reagent', category: 'Reagent', quantity: 2, alertThreshold: 10, unit: 'bottles', status: 'low', lastRestocked: '2024-02-20' },
  { id: 'ST-008', name: 'Liver Function Test Kit', category: 'Kit', quantity: 28, alertThreshold: 15, unit: 'kits', status: 'in-stock', lastRestocked: '2024-03-11' },
];

export function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'Reagent' | 'Kit'>('Reagent');
  const [formQuantity, setFormQuantity] = useState('');
  const [formAlertThreshold, setFormAlertThreshold] = useState('');
  const [formUnit, setFormUnit] = useState('');

  const filteredStock = MOCK_STOCK.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockCount = MOCK_STOCK.filter(i => i.status === 'low').length;
  const outOfStockCount = MOCK_STOCK.filter(i => i.status === 'out').length;
  const inStockCount = MOCK_STOCK.filter(i => i.status === 'in-stock').length;

  const getStatusBadge = (status: StockItem['status']) => {
    if (status === 'in-stock') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide bg-success/10 text-success">
          <CheckCircle className="w-2.5 h-2.5" />
          In Stock
        </span>
      );
    } else if (status === 'low') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide bg-warning/10 text-warning">
          <TrendingDown className="w-2.5 h-2.5" />
          Low Stock
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide bg-destructive/10 text-destructive">
          <AlertCircle className="w-2.5 h-2.5" />
          Out of Stock
        </span>
      );
    }
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setFormName('');
    setFormCategory('Reagent');
    setFormQuantity('');
    setFormAlertThreshold('');
    setFormUnit('');
    setShowModal(true);
  };

  const handleEdit = (item: StockItem) => {
    setSelectedItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormQuantity(item.quantity.toString());
    setFormAlertThreshold(item.alertThreshold.toString());
    setFormUnit(item.unit);
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="bg-warning/10 border border-warning/20 rounded p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-warning font-medium">
              Stock Alert: {lowStockCount} items low in stock, {outOfStockCount} items out of stock
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Stock Management</h1>
          <p className="text-muted-foreground text-xs">
            Track reagents, kits, and laboratory supplies inventory
          </p>
        </div>
        <button 
          onClick={handleAdd}
          className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Stock
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Items</span>
            <Package className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{MOCK_STOCK.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Items tracked</div>
        </div>

        <div className="bg-card border border-success/20 rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">In Stock</span>
            <CheckCircle className="w-3.5 h-3.5 text-success" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{inStockCount}</div>
          <div className="text-[10px] text-success mt-0.5">Available</div>
        </div>

        <div className="bg-card border border-warning/20 rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Low Stock</span>
            <TrendingDown className="w-3.5 h-3.5 text-warning" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{lowStockCount}</div>
          <div className="text-[10px] text-warning mt-0.5">Need restock</div>
        </div>

        <div className="bg-card border border-destructive/20 rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Out of Stock</span>
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{outOfStockCount}</div>
          <div className="text-[10px] text-destructive mt-0.5">Urgent</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded p-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input 
            type="text"
            placeholder="Search by item name or ID..."
            className="w-full h-8 pl-8 pr-3 bg-secondary border-0 rounded text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="h-6 w-px bg-border"></div>

        <select 
          className="h-8 text-xs bg-secondary border-0 rounded px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="Reagent">Reagent</option>
          <option value="Kit">Kit</option>
        </select>

        <select 
          className="h-8 text-xs bg-secondary border-0 rounded px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="in-stock">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Stock Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30 sticky top-0 z-10">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Item Name</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Quantity</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Alert Level</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Last Restocked</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStock.map((item) => {
                const rowClass = item.status === 'low' 
                  ? 'bg-warning/5' 
                  : item.status === 'out' 
                    ? 'bg-destructive/5' 
                    : '';
                
                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-accent/30 transition-colors ${rowClass}`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-foreground font-medium">{item.name}</span>
                        <span className="text-[10px] text-muted-foreground">{item.id}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wide bg-secondary border border-border">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-medium tabular-nums ${
                        item.status === 'out' ? 'text-destructive' : 
                        item.status === 'low' ? 'text-warning' : 
                        'text-foreground'
                      }`}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {item.alertThreshold} {item.unit}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(item.lastRestocked).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="h-7 px-2 flex items-center gap-1 bg-secondary border border-border rounded hover:bg-accent transition-colors text-xs"
                        >
                          Add Stock
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Showing <span className="text-foreground">{filteredStock.length}</span> of <span className="text-foreground">{MOCK_STOCK.length}</span> items
          </div>
        </div>
      </div>

      {/* Add/Edit Stock Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg">
            {/* Modal Header */}
            <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="text-foreground text-sm">
                {selectedItem ? 'Update Stock' : 'Add New Stock Item'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-foreground block mb-1">Item Name *</label>
                <input 
                  type="text"
                  className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., CBC Reagent Pack"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-foreground block mb-1">Category *</label>
                  <select 
                    className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as 'Reagent' | 'Kit')}
                  >
                    <option value="Reagent">Reagent</option>
                    <option value="Kit">Kit</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-foreground block mb-1">Unit *</label>
                  <input 
                    type="text"
                    className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="e.g., packs, boxes, kits"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-foreground block mb-1">Quantity *</label>
                  <input 
                    type="number"
                    className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground block mb-1">Alert Threshold *</label>
                  <input 
                    type="number"
                    className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formAlertThreshold}
                    onChange={(e) => setFormAlertThreshold(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-4 py-3 flex items-center justify-end gap-2">
              <button 
                onClick={() => setShowModal(false)}
                className="h-8 px-3 bg-secondary border border-border rounded text-xs hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="h-8 px-3 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity"
              >
                {selectedItem ? 'Update Stock' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Analytics() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-foreground text-lg mb-0.5">Analytics</h1>
        <p className="text-muted-foreground text-xs">
          Business intelligence and performance metrics
        </p>
      </div>
      <div className="bg-card border border-border rounded p-8 text-center">
        <p className="text-muted-foreground text-sm">Analytics page content coming soon...</p>
      </div>
    </div>
  );
}

export function Settings() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-foreground text-lg mb-0.5">Settings</h1>
        <p className="text-muted-foreground text-xs">
          System configuration and preferences
        </p>
      </div>
      <div className="bg-card border border-border rounded p-8 text-center">
        <p className="text-muted-foreground text-sm">Settings page content coming soon...</p>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded p-8 text-center">
        <h1 className="text-foreground text-lg mb-1">404 - Page Not Found</h1>
        <p className="text-muted-foreground text-sm">The page you're looking for doesn't exist.</p>
      </div>
    </div>
  );
}