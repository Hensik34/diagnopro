import { useState, useEffect } from 'react';
import { Plus, Pen, Search, Package, AlertCircle, TrendingDown, CheckCircle, X, Loader2 } from 'lucide-react';
import { inventoryApi } from '../../api/inventory';
import { useBranchStore } from '../../stores';
import type { InventoryItem } from '../../types';

type StockStatus = 'in-stock' | 'low' | 'out';

const getItemStatus = (item: InventoryItem): StockStatus => {
  if (item.quantity === 0) return 'out';
  if (item.quantity < item.alert_threshold) return 'low';
  return 'in-stock';
};

export function Inventory() {
  const { currentBranchId } = useBranchStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'Reagent' | 'Kit'>('Reagent');
  const [formQuantity, setFormQuantity] = useState('');
  const [formAlertThreshold, setFormAlertThreshold] = useState('');

  useEffect(() => {
    if (currentBranchId) {
      fetchItems();
    }
  }, [currentBranchId]);

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.getAll(currentBranchId!);
      setItems(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStock = items.filter(item => {
    const status = getItemStatus(item);
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockCount = items.filter(i => getItemStatus(i) === 'low').length;
  const outOfStockCount = items.filter(i => getItemStatus(i) === 'out').length;
  const inStockCount = items.filter(i => getItemStatus(i) === 'in-stock').length;

  const getStatusBadge = (status: StockStatus) => {
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
    setModalError('');
    setShowModal(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormQuantity(item.quantity.toString());
    setFormAlertThreshold(item.alert_threshold.toString());
    setModalError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setModalError('Name is required');
      return;
    }
    setIsSaving(true);
    setModalError('');
    try {
      const data = {
        name: formName.trim(),
        category: formCategory,
        quantity: parseInt(formQuantity) || 0,
        alert_threshold: parseInt(formAlertThreshold) || 0,
        branch_id: currentBranchId!,
      };
      if (selectedItem) {
        await inventoryApi.update(selectedItem.id, data);
      } else {
        await inventoryApi.create(data);
      }
      setShowModal(false);
      fetchItems();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  // Daily reminder logic
  useEffect(() => {
    const checkReminder = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      const lastCheck = localStorage.getItem('lastStockReminderDate');
      const today = now.toDateString();
      
      if (lastCheck !== today && ((hour === 13 && minute === 0) || (hour === 19 && minute === 0))) {
        localStorage.setItem('lastStockReminderDate', today);
        alert('Daily Reminder: Please review and update your inventory stock levels.');
      }
    };
    
    const interval = setInterval(checkReminder, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const [stockUpdateItem, setStockUpdateItem] = useState<InventoryItem | null>(null);
  const [stockAddAmount, setStockAddAmount] = useState('');

  const handleAddStockSubmit = async () => {
    if (!stockUpdateItem) return;
    const num = parseInt(stockAddAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid positive number');
      return;
    }
    try {
      await inventoryApi.addStock(stockUpdateItem.id, num);
      setStockUpdateItem(null);
      setStockAddAmount('');
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add stock');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded p-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-destructive" />
        <span className="text-sm text-destructive">{error}</span>
        <button onClick={fetchItems} className="ml-auto text-xs text-primary hover:underline">Retry</button>
      </div>
    );
  }

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-0.5">Stock Management</h1>
          <p className="text-muted-foreground text-xs">
            Track reagents, kits, and laboratory supplies inventory
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <button 
            onClick={handleAdd}
            className="h-8 px-2.5 flex items-center justify-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs w-full sm:w-auto flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stock
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Total Items</span>
            <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {items.length}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Items tracked</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">In Stock</span>
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {inStockCount}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-success">Available</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Low Stock</span>
            <TrendingDown className="w-4 h-4 text-warning flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {lowStockCount}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-warning">Need restock</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Out of Stock</span>
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {outOfStockCount}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-destructive">Urgent</span>
          </div>
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
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No inventory items found
                  </td>
                </tr>
              ) : filteredStock.map((item) => {
                const status = getItemStatus(item);
                const rowClass = status === 'low' 
                  ? 'bg-warning/5' 
                  : status === 'out' 
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
                        <span className="text-[10px] text-muted-foreground">{item.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wide bg-secondary border border-border">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-medium tabular-nums ${
                        status === 'out' ? 'text-destructive' : 
                        status === 'low' ? 'text-warning' : 
                        'text-foreground'
                      }`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {item.alert_threshold}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {getStatusBadge(status)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {item.last_restocked ? new Date(item.last_restocked).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => setStockUpdateItem(item)}
                          className="h-7 px-2 flex items-center gap-1 bg-secondary border border-border rounded hover:bg-accent transition-colors text-xs"
                          title="Add Stock"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleEdit(item)}
                          className="h-7 px-2 flex items-center gap-1 bg-secondary border border-border rounded hover:bg-accent transition-colors text-xs"
                          title="Edit Item"
                        >
                          <Pen className="w-3.5 h-3.5" />
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
            Showing <span className="text-foreground">{filteredStock.length}</span> of <span className="text-foreground">{items.length}</span> items
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
              {modalError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded p-2.5 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-xs text-destructive">{modalError}</span>
                </div>
              )}

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

              <div className="grid grid-cols-1 gap-3">
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
                disabled={isSaving}
                className="h-8 px-3 bg-secondary border border-border rounded text-xs hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-3 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                {selectedItem ? 'Update Stock' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {stockUpdateItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-sm">
            <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="text-foreground text-sm">Add Stock: {stockUpdateItem.name}</h2>
              <button 
                onClick={() => { setStockUpdateItem(null); setStockAddAmount(''); }}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-foreground block mb-1">Amount to Add *</label>
                <input 
                  type="number"
                  className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={stockAddAmount}
                  onChange={(e) => setStockAddAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                />
              </div>
            </div>
            <div className="border-t border-border px-4 py-3 flex items-center justify-end gap-2">
              <button 
                onClick={() => { setStockUpdateItem(null); setStockAddAmount(''); }}
                className="h-8 px-3 bg-secondary border border-border rounded text-xs hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddStockSubmit}
                className="h-8 px-3 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity"
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
