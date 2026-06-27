import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Percent,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Loader2,
  Calendar,
  Save,
  CheckSquare,
  Square
} from 'lucide-react';
import { useBranchStore } from '../../stores';
import { testApi } from '../../api/tests';
import { priceListApi } from '../../api/priceLists';
import type { PriceList, PriceListItem, Test } from '../../types';

export function PriceListManagement() {
  const { currentBranchId } = useBranchStore();
  const activeBranchId = currentBranchId || '';

  // Lists
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedList, setSelectedList] = useState<PriceList | null>(null);
  const [listItems, setListItems] = useState<Record<string, Partial<PriceListItem>>>({});
  const [markupRows, setMarkupRows] = useState<Record<string, boolean>>({});

  // Loading & Errors
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [onlyOverridden, setOnlyOverridden] = useState(false);

  // Price List Form (Modal state)
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVersion, setFormVersion] = useState(1);
  const [formEffectiveFrom, setFormEffectiveFrom] = useState('');
  const [formEffectiveTo, setFormEffectiveTo] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Bulk Discount Form State
  const [bulkDiscountType, setBulkDiscountType] = useState<'percent' | 'amount'>('percent');
  const [bulkDiscountVal, setBulkDiscountVal] = useState(0);
  const [bulkCategory, setBulkCategory] = useState('All');
  const [bulkAction, setBulkAction] = useState<'decrease' | 'increase'>('decrease');

  // Categories list
  const categories = ['All', ...Array.from(new Set(tests.map(t => t.category).filter(Boolean)))];

  // Fetch all tests and price lists on branch change
  useEffect(() => {
    if (activeBranchId) {
      fetchPriceLists();
      fetchTests();
    }
  }, [activeBranchId]);

  const fetchPriceLists = async () => {
    setIsLoadingLists(true);
    try {
      const res = await priceListApi.getAll({ branch_id: activeBranchId });
      setPriceLists(res.data || []);
      // Auto-select first list if nothing is selected
      if (res.data && res.data.length > 0 && !selectedList) {
        handleSelectList(res.data[0]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load price lists');
    } finally {
      setIsLoadingLists(false);
    }
  };

  const fetchTests = async () => {
    try {
      const res = await testApi.getAll(activeBranchId);
      setTests(res.data || []);
    } catch (err: any) {
      console.error('Failed to load tests:', err);
    }
  };

  const handleSelectList = async (list: PriceList) => {
    setSelectedList(list);
    setIsLoadingItems(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await priceListApi.getById(list.id);
      const itemsMap: Record<string, Partial<PriceListItem>> = {};
      const newMarkupRows: Record<string, boolean> = {};
      
      // Populate items map
      if (res.data?.items) {
        res.data.items.forEach((item) => {
          const discountVal = Number(item.discount_value || 0);
          itemsMap[item.test_id] = {
            test_id: item.test_id,
            price: item.price !== null ? Number(item.price) : null,
            discount_type: item.discount_type,
            discount_value: discountVal,
          };
          if (discountVal < 0) {
            newMarkupRows[item.test_id] = true;
          }
        });
      }
      setListItems(itemsMap);
      setMarkupRows(newMarkupRows);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load price list items');
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Create / Update Price List
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingListId(null);
    setFormName('');
    setFormDescription('');
    setFormVersion(1);
    setFormEffectiveFrom('');
    setFormEffectiveTo('');
    setFormIsActive(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (list: PriceList) => {
    setModalMode('edit');
    setEditingListId(list.id);
    setFormName(list.name);
    setFormDescription(list.description || '');
    setFormVersion(list.version || 1);
    setFormEffectiveFrom(list.effective_from ? list.effective_from.split('T')[0] : '');
    setFormEffectiveTo(list.effective_to ? list.effective_to.split('T')[0] : '');
    setFormIsActive(list.is_active);
    setShowModal(true);
  };

  const handleSavePriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      const payload: Partial<PriceList> = {
        name: formName,
        description: formDescription,
        version: formVersion,
        effective_from: formEffectiveFrom || null,
        effective_to: formEffectiveTo || null,
        is_active: formIsActive,
        branch_id: activeBranchId,
      };

      if (modalMode === 'create') {
        const res = await priceListApi.create(payload);
        setSuccessMessage('Price list created successfully');
        setPriceLists([...priceLists, res.data]);
        handleSelectList(res.data);
      } else if (modalMode === 'edit' && editingListId) {
        const res = await priceListApi.update(editingListId, payload);
        setSuccessMessage('Price list updated successfully');
        setPriceLists(priceLists.map(l => l.id === editingListId ? res.data : l));
        if (selectedList?.id === editingListId) {
          setSelectedList(res.data);
        }
      }
      setShowModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save price list');
    }
  };

  const handleDeletePriceList = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the price list "${name}"?`)) return;

    try {
      await priceListApi.delete(id);
      setSuccessMessage('Price list deleted successfully');
      setPriceLists(priceLists.filter(l => l.id !== id));
      if (selectedList?.id === id) {
        setSelectedList(null);
        setListItems({});
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete price list');
    }
  };

  // Modify individual item overrides
  const handleItemOverrideChange = (
    testId: string,
    field: 'price' | 'discount_type' | 'discount_value',
    value: any
  ) => {
    const currentItem = listItems[testId] || {
      test_id: testId,
      price: null,
      discount_type: 'none',
      discount_value: 0
    };

    const updatedItem = {
      ...currentItem,
      [field]: value
    };

    // If changing discount type to none, reset discount value
    if (field === 'discount_type' && value === 'none') {
      updatedItem.discount_value = 0;
    }

    // If setting flat price override, nullify discount info, and vice versa
    if (field === 'price' && value !== null) {
      updatedItem.discount_type = 'none';
      updatedItem.discount_value = 0;
    } else if ((field === 'discount_type' && value !== 'none') || (field === 'discount_value' && value !== 0)) {
      updatedItem.price = null;
    }

    setListItems({
      ...listItems,
      [testId]: updatedItem
    });
  };

  const handleClearItemOverride = (testId: string) => {
    const updated = { ...listItems };
    delete updated[testId];
    setListItems(updated);
    setMarkupRows(prev => {
      const next = { ...prev };
      delete next[testId];
      return next;
    });
  };

  // Save current item pricing changes to database
  const handleSaveItems = async () => {
    if (!selectedList) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Map listItems map to array payload
      const itemsPayload = Object.values(listItems).filter(item => {
        // Only save if it has a flat price override OR a discount override
        return item.price !== null || item.discount_type !== 'none';
      });

      await priceListApi.bulkUpdateItems(selectedList.id, itemsPayload as PriceListItem[]);
      setSuccessMessage('Price list overrides saved successfully');
      handleSelectList(selectedList);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save overrides');
    } finally {
      setIsSaving(false);
    }
  };

  // Apply discount to multiple tests at once
  const handleApplyBulkDiscount = () => {
    if (bulkDiscountVal <= 0) return;

    const updated = { ...listItems };
    const val = bulkAction === 'increase' ? -bulkDiscountVal : bulkDiscountVal;
    tests.forEach((test) => {
      // Filter category
      if (bulkCategory !== 'All' && test.category !== bulkCategory) return;

      updated[test.id] = {
        test_id: test.id,
        price: null,
        discount_type: bulkDiscountType,
        discount_value: val
      };
    });

    setListItems(updated);
    setSuccessMessage(`Applied bulk ${bulkAction === 'increase' ? 'markup' : 'discount'} to all ${bulkCategory === 'All' ? '' : bulkCategory} tests! Remember to save.`);
  };

  // Filtering tests
  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      test.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.test_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || test.category === categoryFilter;

    const hasOverride = listItems[test.id] && (
      listItems[test.id].price !== null ||
      listItems[test.id].discount_type !== 'none'
    );
    const matchesOverride = !onlyOverridden || hasOverride;

    return matchesSearch && matchesCategory && matchesOverride;
  });

  return (
    <div className="space-y-6">
      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
          <button className="ml-auto" onClick={() => setErrorMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-300">
          <Check className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
          <button className="ml-auto" onClick={() => setSuccessMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Price Lists */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-4 h-fit">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <h2 className="font-semibold text-lg">Price Lists</h2>
            <button
              onClick={handleOpenCreateModal}
              className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1 text-sm px-2.5 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add List
            </button>
          </div>

          {isLoadingLists ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : priceLists.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              No price lists created for this branch.
            </div>
          ) : (
            <div className="space-y-2">
              {priceLists.map((list) => {
                const isSelected = selectedList?.id === list.id;
                return (
                  <div
                    key={list.id}
                    onClick={() => handleSelectList(list)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{list.name}</h3>
                          <span className="text-xs px-1.5 py-0.5 bg-muted rounded border text-muted-foreground">
                            v{list.version}
                          </span>
                          {!list.is_active && (
                            <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        {list.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {list.description}
                          </p>
                        )}
                        {(list.effective_from || list.effective_to) && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {list.effective_from
                                ? new Date(list.effective_from).toLocaleDateString()
                                : 'Immediate'}{' '}
                              -{' '}
                              {list.effective_to
                                ? new Date(list.effective_to).toLocaleDateString()
                                : 'No Expiry'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(list);
                          }}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                          title="Edit Price List Properties"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePriceList(list.id, list.name);
                          }}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded text-muted-foreground hover:text-red-600"
                          title="Delete Price List"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Price Overrides */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col min-h-[500px]">
          {selectedList ? (
            <>
              <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 mb-4 gap-4">
                <div>
                  <h2 className="font-semibold text-lg">
                    Manage Overrides: <span className="text-primary">{selectedList.name}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Set flat test overrides or discount percentages/flat amounts on default test rates.
                  </p>
                </div>
                <button
                  onClick={handleSaveItems}
                  disabled={isSaving || isLoadingItems}
                  className="flex items-center gap-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors px-4 py-2 font-medium disabled:opacity-50 text-sm shadow-sm"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Overrides
                </button>
              </div>

              {/* Bulk discount settings */}
              <div className="bg-muted/40 border border-border rounded-lg p-3 mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  <span className="font-medium text-xs">Bulk Adjustments Tool:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="p-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c === 'All' ? 'All Categories' : c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value as any)}
                    className="p-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  >
                    <option value="decrease">Discount (Reduce Price)</option>
                    <option value="increase">Markup (Increase Price)</option>
                  </select>
                  <select
                    value={bulkDiscountType}
                    onChange={(e) => setBulkDiscountType(e.target.value as any)}
                    className="p-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="amount">Amount (Flat)</option>
                  </select>
                  <input
                    type="number"
                    value={bulkDiscountVal || ''}
                    onChange={(e) => setBulkDiscountVal(Math.max(0, Number(e.target.value)))}
                    placeholder="Val"
                    className="w-16 p-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-center"
                  />
                  <button
                    onClick={handleApplyBulkDiscount}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 px-3 py-1.5 rounded-md text-xs font-semibold"
                  >
                    Apply Bulk
                  </button>
                </div>
              </div>

              {/* Filters / Search */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by test name or code..."
                    className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'All' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
                <div
                  onClick={() => setOnlyOverridden(!onlyOverridden)}
                  className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 text-sm cursor-pointer select-none bg-background hover:bg-muted/30"
                >
                  {onlyOverridden ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-xs">Show overridden only</span>
                </div>
              </div>

              {/* Main Overrides Table */}
              <div className="flex-1 overflow-x-auto">
                {isLoadingItems ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredTests.length === 0 ? (
                  <div className="text-center p-12 text-muted-foreground text-sm">
                    No tests match your filter settings.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium text-xs">
                        <th className="p-3">Test Details</th>
                        <th className="p-3">Base Price</th>
                        <th className="p-3">Flat Override</th>
                        <th className="p-3 text-center" style={{ width: '130px' }}>Discount Type</th>
                        <th className="p-3" style={{ width: '100px' }}>Discount</th>
                        <th className="p-3">Final Price</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTests.map((test) => {
                        const basePrice = Number(test.price || 0);
                        const override = listItems[test.id];

                        let calculatedPrice = basePrice;
                        if (override) {
                          if (override.price !== null && override.price !== undefined) {
                            calculatedPrice = Number(override.price);
                          } else if (override.discount_type === 'percent') {
                            calculatedPrice = basePrice * (1 - (override.discount_value || 0) / 100);
                          } else if (override.discount_type === 'amount') {
                            calculatedPrice = basePrice - (override.discount_value || 0);
                          }
                        }
                        calculatedPrice = Math.max(0, Math.round(calculatedPrice * 100) / 100);

                        const hasOverride = override && (override.price !== null || override.discount_type !== 'none');

                        return (
                          <tr
                            key={test.id}
                            className={`hover:bg-muted/10 transition-colors ${
                              hasOverride ? 'bg-primary/5' : ''
                            }`}
                          >
                            <td className="p-3">
                              <div className="font-semibold text-xs text-foreground line-clamp-1">
                                {test.test_name}
                              </div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                <span>{test.test_code}</span>
                                <span>•</span>
                                <span className="bg-muted px-1.5 py-0.2 border rounded">{test.category}</span>
                              </div>
                            </td>
                            <td className="p-3 text-xs font-medium text-muted-foreground">
                              ₹{basePrice}
                            </td>
                            <td className="p-3">
                              <div className="relative">
                                ₹
                                <input
                                  type="number"
                                  value={override?.price ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? null : Number(e.target.value);
                                    handleItemOverrideChange(test.id, 'price', val);
                                  }}
                                  placeholder="Auto"
                                  className="pl-5 pr-1.5 py-1 text-xs w-20 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <select
                                value={override?.discount_type || 'none'}
                                onChange={(e) =>
                                  handleItemOverrideChange(test.id, 'discount_type', e.target.value)
                                }
                                className="p-1 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="none">None</option>
                                <option value="percent">Percent (%)</option>
                                <option value="amount">Amount (₹)</option>
                              </select>
                            </td>
                            <td className="p-3">
                              {override?.discount_type && override.discount_type !== 'none' ? (
                                <div className="flex items-center gap-1.5 justify-center">
                                  <input
                                    type="number"
                                    value={override.discount_value !== undefined ? Math.abs(override.discount_value) : ''}
                                    onChange={(e) => {
                                      const rawVal = Math.abs(Number(e.target.value));
                                      const isMarkup = markupRows[test.id] || (override.discount_value || 0) < 0;
                                      const finalVal = isMarkup ? -rawVal : rawVal;
                                      handleItemOverrideChange(
                                        test.id,
                                        'discount_value',
                                        finalVal
                                      );
                                    }}
                                    placeholder="0"
                                    className="p-1 text-xs w-14 bg-background border border-border rounded text-center focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const wasMarkup = markupRows[test.id] || (override.discount_value || 0) < 0;
                                      const nextMarkup = !wasMarkup;
                                      setMarkupRows(prev => ({ ...prev, [test.id]: nextMarkup }));
                                      const currentVal = Math.abs(override.discount_value || 0);
                                      handleItemOverrideChange(
                                        test.id,
                                        'discount_value',
                                        nextMarkup ? -currentVal : currentVal
                                      );
                                    }}
                                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded border shrink-0 transition-colors ${
                                      (markupRows[test.id] || (override.discount_value || 0) < 0)
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                        : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900'
                                    }`}
                                    title={(markupRows[test.id] || (override.discount_value || 0) < 0) ? "Click to change to Discount (reduces price)" : "Click to change to Markup (increases price)"}
                                  >
                                    {(markupRows[test.id] || (override.discount_value || 0) < 0) ? 'Markup (+)' : 'Discount (-)'}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-xs">
                              <span className={hasOverride ? 'text-primary' : 'text-foreground'}>
                                ₹{calculatedPrice}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {hasOverride && (
                                <button
                                  onClick={() => handleClearItemOverride(test.id)}
                                  className="text-xs text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 border border-red-200 dark:border-red-900 rounded"
                                >
                                  Reset
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <TrendingDown className="w-12 h-12 text-muted-foreground mb-2" />
              <h3 className="font-semibold text-sm">No Price List Selected</h3>
              <p className="text-xs mt-1">Select or create a price list on the left to start configuring pricing overrides.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-bold text-lg">
                {modalMode === 'create' ? 'Create Price List' : 'Edit Price List'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePriceList} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold mb-1">List Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Corporate Rate, Camp Discount"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the purpose of this pricing tier..."
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Version</label>
                  <input
                    type="number"
                    required
                    value={formVersion}
                    onChange={(e) => setFormVersion(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Status</label>
                  <select
                    value={formIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormIsActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Effective From</label>
                  <input
                    type="date"
                    value={formEffectiveFrom}
                    onChange={(e) => setFormEffectiveFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Effective To</label>
                  <input
                    type="date"
                    value={formEffectiveTo}
                    onChange={(e) => setFormEffectiveTo(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-sm font-semibold transition-colors flex items-center gap-1.5"
                >
                  Save Properties
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
