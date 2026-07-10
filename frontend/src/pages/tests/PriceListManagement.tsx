import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { CustomConfirmModal } from '../../app/components/ui/CustomConfirmModal';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Star,
  Percent,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Loader2,
  Calendar,
  Save,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useBranchStore, useDoctorStore, useCan, PERMISSIONS } from '../../stores';
import { testApi } from '../../api/tests';
import { priceListApi } from '../../api/priceLists';
import type { PriceList, PriceListItem, Test, Doctor } from '../../types';
import { smartSearchFilter } from '../../utils';

export function PriceListManagement() {
  const { currentBranchId } = useBranchStore();
  const activeBranchId = currentBranchId || '';
  const { doctors, fetchDoctors } = useDoctorStore();

  const canUpdate = useCan(PERMISSIONS.TEST_UPDATE);

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
  const [errorMessage, _setErrorMessage] = useState<string | null>(null);
  const setErrorMessage = (msg: string | null) => {
    _setErrorMessage(msg);
    if (msg) toast.error(msg);
  };
  const [successMessage, _setSuccessMessage] = useState<string | null>(null);
  const setSuccessMessage = (msg: string | null) => {
    _setSuccessMessage(msg);
    if (msg) toast.success(msg);
  };

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
  const [formDoctorId, setFormDoctorId] = useState<string>('');
  const [formIsDefault, setFormIsDefault] = useState<boolean>(false);

  // Pagination State for Price List Overrides
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Bulk Discount Form State
  const [bulkDiscountType, setBulkDiscountType] = useState<'percent' | 'amount'>('percent');
  const [bulkDiscountVal, setBulkDiscountVal] = useState(0);
  const [bulkCategory, setBulkCategory] = useState('All');
  const [bulkAction, setBulkAction] = useState<'decrease' | 'increase'>('decrease');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'danger' | 'warning' | 'alert';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: () => {}
  });

  // Categories list
  const categories = ['All', ...Array.from(new Set(tests.map(t => t.category).filter(Boolean)))];

  // Fetch all tests and price lists on branch change
  useEffect(() => {
    if (activeBranchId) {
      fetchPriceLists();
      fetchTests();
      fetchDoctors({ branch_id: activeBranchId });
    }
  }, [activeBranchId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedList?.id, searchQuery, categoryFilter, onlyOverridden]);

  const fetchPriceLists = async () => {
    setIsLoadingLists(true);
    try {
      const res = await priceListApi.getAll({ branch_id: activeBranchId });
      const lists = res.data || [];
      setPriceLists(lists);
      
      // Auto-select list if nothing is selected
      if (!selectedList) {
        if (lists.length > 0) {
          handleSelectList(lists[0]);
        } else {
          // If no custom lists exist, select the virtual default price list
          handleSelectList({
            id: 'default-lab-price',
            name: 'Default Lab Price',
            description: 'Standard base prices of this laboratory branch.',
            branch_id: activeBranchId,
            is_active: true,
            version: 1,
            effective_from: null,
            effective_to: null,
            created_at: '',
            updated_at: '',
          } as any);
        }
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
    
    // Reset bulk pricing modifier states
    setBulkDiscountVal(0);
    setBulkDiscountType('percent');
    setBulkCategory('All');
    setBulkAction('decrease');

    try {
      if (list.id === 'default-lab-price') {
        const itemsMap: Record<string, Partial<PriceListItem>> = {};
        const newMarkupRows: Record<string, boolean> = {};
        
        tests.forEach((test) => {
          itemsMap[test.id] = {
            test_id: test.id,
            price: test.has_branch_override ? Number(test.price) : null,
            discount_type: 'none',
            discount_value: 0,
          };
        });
        setListItems(itemsMap);
        setMarkupRows(newMarkupRows);
      } else {
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
      }
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
    setFormDoctorId('');
    setFormIsDefault(false);
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
    setFormDoctorId(list.doctor?.id || '');
    setFormIsDefault(!!list.is_default);
    setShowModal(true);
  };

  const handleSavePriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      const payload = {
        name: formName,
        description: formDescription,
        version: formVersion,
        effective_from: formEffectiveFrom || null,
        effective_to: formEffectiveTo || null,
        is_active: formIsActive,
        branch_id: activeBranchId,
        doctor_id: formDoctorId || null,
        is_default: formIsDefault,
      };

      if (modalMode === 'create') {
        await priceListApi.create(payload as any);
        setSuccessMessage('Price list created successfully');
        await fetchPriceLists();
      } else if (modalMode === 'edit' && editingListId) {
        const res = await priceListApi.update(editingListId, payload as any);
        setSuccessMessage('Price list updated successfully');
        await fetchPriceLists();
        if (selectedList?.id === editingListId) {
          setSelectedList(res.data);
        }
      }
      setShowModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save price list');
    }
  };

  const handleDeletePriceList = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Price List',
      message: `Are you sure you want to delete the price list "${name}"?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
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
      }
    });
  };

  const handleSetAsDefault = async (listId: string) => {
    try {
      if (listId === 'default-lab-price') {
        // Clear is_default from whichever custom list currently has it
        const currentDefault = priceLists.find(l => l.is_default);
        if (currentDefault) {
          await priceListApi.update(currentDefault.id, {
            name: currentDefault.name,
            is_default: false
          });
        }
        setSuccessMessage('Default Lab Price set as branch default.');
      } else {
        // Set this custom list as default
        const listToSet = priceLists.find(l => l.id === listId);
        if (listToSet) {
          await priceListApi.update(listId, {
            name: listToSet.name,
            is_default: true
          });
          setSuccessMessage(`"${listToSet.name}" set as branch default.`);
        }
      }
      await fetchPriceLists();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update default price list');
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
      if (selectedList.id === 'default-lab-price') {
        const updates = Object.values(listItems).map((item) => ({
          test_id: item.test_id!,
          price: item.price !== null && item.price !== undefined ? Number(item.price) : null,
        }));
        
        await testApi.bulkUpdateBranchPrices(activeBranchId, updates);
        setSuccessMessage('Branch default base prices saved successfully');
        await fetchTests();
        handleSelectList(selectedList);
      } else {
        // Map listItems map to array payload
        const itemsPayload = Object.values(listItems).filter(item => {
          // Only save if it has a flat price override OR a discount override
          return item.price !== null || item.discount_type !== 'none';
        });

        await priceListApi.bulkUpdateItems(selectedList.id, itemsPayload as PriceListItem[]);
        setSuccessMessage('Price list overrides saved successfully');
        handleSelectList(selectedList);
      }
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
  const filteredTests = useMemo(() => {
    const categoryAndOverrideFiltered = tests.filter((test) => {
      const matchesCategory = categoryFilter === 'All' || test.category === categoryFilter;

      const hasOverride = listItems[test.id] && (
        listItems[test.id].price !== null ||
        listItems[test.id].discount_type !== 'none'
      );
      const matchesOverride = !onlyOverridden || hasOverride;

      return matchesCategory && matchesOverride;
    });

    if (!searchQuery.trim()) {
      return categoryAndOverrideFiltered;
    }

    return smartSearchFilter(categoryAndOverrideFiltered, searchQuery, [
      { field: t => t.test_name, weight: 1.0 },
      { field: t => t.test_code, weight: 0.8 }
    ]);
  }, [tests, searchQuery, categoryFilter, onlyOverridden, listItems]);

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
            {canUpdate && (
              <button
                onClick={handleOpenCreateModal}
                className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1 text-sm px-2.5 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add List
              </button>
            )}
          </div>

          {isLoadingLists ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (() => {
            const hasCustomDefault = priceLists.some(l => l.is_default);
            const displayedPriceLists = [
              {
                id: 'default-lab-price',
                name: 'Default Lab Price',
                description: 'Standard base prices of this laboratory branch.',
                branch_id: activeBranchId,
                is_active: true,
                version: 1,
                effective_from: null,
                effective_to: null,
                created_at: '',
                updated_at: '',
                is_default: !hasCustomDefault,
              },
              ...priceLists
            ];
            
            return (
              <div className="space-y-2">
                {displayedPriceLists.map((list) => {
                  const isSelected = selectedList?.id === list.id;
                  return (
                    <div
                      key={list.id}
                      onClick={() => handleSelectList(list as any)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex flex-col gap-1">
                            <h3 className="font-semibold text-sm">{list.name}</h3>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] px-1 py-0.2 bg-muted rounded border text-muted-foreground">
                                v{list.version}
                              </span>
                              {!list.is_active && (
                                <span className="text-[10px] px-1 py-0.2 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 rounded font-medium">
                                  Inactive
                                </span>
                              )}
                              {list.is_default && (
                                <span className="text-[10px] px-1 py-0.2 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded font-semibold">
                                  Default
                                </span>
                              )}
                              {list.doctor && (
                                <span className="text-[10px] px-1 py-0.2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded font-semibold line-clamp-1">
                                  {list.doctor.title || 'Dr'}. {list.doctor.name}
                                </span>
                              )}
                            </div>
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
                        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                          {/* Render default status star or action */}
                          {list.is_default ? (
                            <button
                              type="button"
                              className="p-1 text-amber-500 cursor-default shrink-0 focus:outline-none"
                              title="Current Branch Default Price List"
                            >
                              <Star className="w-4 h-4 fill-amber-400 text-amber-500 drop-shadow-xs" />
                            </button>
                          ) : (
                            canUpdate && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetAsDefault(list.id);
                                }}
                                className="p-1 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded text-muted-foreground/45 hover:text-amber-500 cursor-pointer shrink-0 transition-colors focus:outline-none group/star"
                                title="Set as Branch Default Price List"
                              >
                                <Star className="w-4 h-4 transition-transform group-hover/star:scale-110" />
                              </button>
                            )
                          )}

                          {list.id !== 'default-lab-price' && canUpdate && (
                            <div className="flex gap-0.5 mt-1 border-t border-border/50 pt-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(list as any);
                                }}
                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors focus:outline-none"
                                title="Edit Price List Properties"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePriceList(list.id, list.name);
                                }}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded text-muted-foreground hover:text-red-600 cursor-pointer transition-colors focus:outline-none"
                                title="Delete Price List"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Right Side: Custom Branch Prices */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col min-h-[500px]">
          {selectedList ? (
            <>
              <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 mb-4 gap-4">
                <div>
                  <h2 className="font-semibold text-lg">
                    Customize Prices: <span className="text-primary">{selectedList.name}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {canUpdate
                      ? 'Customize branch test rates with flat custom prices or discount adjustments.'
                      : 'View branch test rates and custom prices for the selected list.'}
                  </p>
                </div>
                {canUpdate && (
                  <button
                    onClick={handleSaveItems}
                    disabled={isSaving || isLoadingItems}
                    className="flex items-center gap-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors px-4 py-2 font-medium disabled:opacity-50 text-sm shadow-sm flex-shrink-0 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Custom Prices
                  </button>
                )}
              </div>

              {/* Bulk pricing modifier settings */}
              {selectedList.id !== 'default-lab-price' && canUpdate && (
                <div className="bg-muted/40 border border-border rounded-lg p-3 mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-primary" />
                    <span className="font-medium text-xs">Bulk Price Updates:</span>
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
                      <option value="decrease">Reduce Price (-)</option>
                      <option value="increase">Increase Price (+)</option>
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
              )}

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
                  <span className="text-xs">Show customized only</span>
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
                ) : (() => {
                  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
                  const paginatedTests = filteredTests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                  return (
                    <>
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium text-xs">
                            <th className="p-3">Test Details</th>
                            <th className="p-3">Base Price</th>
                            <th className="p-3">Custom Price</th>
                            <th className="p-3">Final Price (₹)</th>
                            {canUpdate && <th className="p-3 text-right">Action</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {paginatedTests.map((test) => {
                            const isDefaultLabPrice = selectedList?.id === 'default-lab-price';
                            const basePrice = isDefaultLabPrice ? Number(test.base_price || test.price || 0) : Number(test.price || 0);
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

                            const hasOverride = isDefaultLabPrice 
                              ? (override && override.price !== null)
                              : (override && (override.price !== null || override.discount_type !== 'none'));

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
                                  <div className="relative flex items-center w-22">
                                    <span className="absolute left-2 text-xs text-muted-foreground pointer-events-none select-none">
                                      ₹
                                    </span>
                                    <input
                                      type="number"
                                      value={override?.price ?? ''}
                                      disabled={!canUpdate}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? null : Number(e.target.value);
                                        handleItemOverrideChange(test.id, 'price', val);
                                      }}
                                      placeholder="Auto"
                                      className="pl-5 pr-1.5 py-1 text-xs w-full bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:bg-muted disabled:cursor-not-allowed"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 font-semibold text-xs">
                                  <span className={hasOverride ? 'text-primary' : 'text-foreground'}>
                                    ₹{calculatedPrice}
                                  </span>
                                </td>
                                {canUpdate && (
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
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/10 mt-4 select-none rounded-b-xl">
                          <div className="text-xs text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{Math.min(filteredTests.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
                            <span className="font-semibold text-foreground">{Math.min(filteredTests.length, currentPage * itemsPerPage)}</span> of{' '}
                            <span className="font-semibold text-foreground">{filteredTests.length}</span> tests
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(1)}
                              className="p-1 border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="First Page"
                            >
                              <ChevronsLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              className="p-1 border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Previous Page"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                              .map((p, idx, arr) => {
                                const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                                return (
                                  <div key={p} className="flex items-center">
                                    {showEllipsis && <span className="text-xs text-muted-foreground px-1.5 font-medium">...</span>}
                                    <button
                                      onClick={() => setCurrentPage(p)}
                                      className={`px-2 py-0.5 text-xs font-semibold rounded border min-w-[24px] text-center transition-colors ${
                                        currentPage === p
                                          ? 'bg-primary border-primary text-primary-foreground'
                                          : 'border-border bg-background hover:bg-muted text-foreground'
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  </div>
                                );
                              })}

                            <button
                              disabled={currentPage === totalPages || totalPages === 0}
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              className="p-1 border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Next Page"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={currentPage === totalPages || totalPages === 0}
                              onClick={() => setCurrentPage(totalPages)}
                              className="p-1 border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Last Page"
                            >
                              <ChevronsRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
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
                <X className="w-4 h-4 cursor-pointer" />
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

              <div>
                <label className="block text-xs font-semibold mb-1">Assigned Referring Doctor (Optional)</label>
                <select
                  value={formDoctorId}
                  onChange={(e) => setFormDoctorId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">None (General price list)</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title || 'Dr'}. {doc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Assigning a doctor automatically switches to this price list when creating a report for them.
                </p>
              </div>

              {/* Default status is set via the Star icon directly on the Price Lists sidebar */}

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Save Properties
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
