import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Search, 
    Download, 
    Edit, 
    ChevronLeft, 
    ChevronRight,
    X,
    Image as ImageIcon,
    Printer,
    Filter,
    Layers,
    Truck,
    Loader2,
    RefreshCw, 
    TrendingUp, 
    Calendar, 
    User,
    PlusCircle,
    MinusCircle,
    History,
    Tag
} from 'lucide-react';
import { InventoryItem } from '../../types';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, getImageUrl, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface InventoryResponse {
    success: boolean;
    data: InventoryItem[];
    pagination: PaginationInfo;
    fromCache: boolean;
}

interface DropdownsResponse {
    success: boolean;
    categories: { id: string; name: string }[];
    suppliers: { id: string; name: string }[];
    branches: { id: string; name: string }[];
}

const InventoryList: React.FC = () => {
  const navigate = useNavigate();
  const isAdmin = sessionManager.getUserType() === 'admin';
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [underQtyFilter, setUnderQtyFilter] = useState('');
  const [underQtyInput, setUnderQtyInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [supplierInput, setSupplierInput] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [branchInput, setBranchInput] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
  const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'phone' | 'accessories' | 'service' | 'spare'>('phone');
  
  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState<{qty: number, sellPrice: number}>({ qty: 0, sellPrice: 0 });

  // Barcode State
  const [barcodeConfig, setBarcodeConfig] = useState({
      qty: 1,
      type: 'Code 128'
  });

  // IMEI State
  const [isImeiModalOpen, setIsImeiModalOpen] = useState(false);
  const [imeiList, setImeiList] = useState<any[]>([]);
  const [isLoadingImei, setIsLoadingImei] = useState(false);
  
  // Price History State
  const [isPriceHistoryModalOpen, setIsPriceHistoryModalOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [isLoadingPriceHistory, setIsLoadingPriceHistory] = useState(false);

  // Selling Price History State
  const [isSellingPriceHistoryModalOpen, setIsSellingPriceHistoryModalOpen] = useState(false);
  const [sellingPriceHistory, setSellingPriceHistory] = useState<any[]>([]);
  const [isLoadingSellingPriceHistory, setIsLoadingSellingPriceHistory] = useState(false);

  // Adjustment State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
      type: 'add' as 'add' | 'remove',
      qty: 1,
      reason: '',
      imei: ''
  });
  const [adjustmentHistory, setAdjustmentHistory] = useState<any[]>([]);
  const [isLoadingAdjustment, setIsLoadingAdjustment] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);

  // Build query string for SWR
  const buildQueryString = () => {
    const branchId = (sessionManager.getUserType() === 'admin') ? (branchFilter || 'all') : (sessionManager.getBranchId() || 'all');
    
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('branchId', branchId);
    
    if (searchTerm) params.append('search', searchTerm);
    if (categoryFilter) params.append('categoryId', categoryFilter);
    if (supplierFilter) params.append('supplierId', supplierFilter);
    if (underQtyFilter) params.append('underQty', underQtyFilter);

    if (activeTab === 'phone') {
      params.append('isSerialized', '1');
      params.append('isService', '0');
      params.append('isSparePart', '0');
    } else if (activeTab === 'accessories') {
      params.append('isSerialized', '0');
      params.append('isService', '0');
      params.append('isSparePart', '0');
    } else if (activeTab === 'service') {
      params.append('isService', '1');
      params.append('isSparePart', '0');
    } else if (activeTab === 'spare') {
      params.append('isSparePart', '1');
    }

    return `${API_ENDPOINTS.INVENTORY}?${params.toString()}`;
  };

  // SWR for inventory data
  const { data, error, isLoading, mutate } = useSWR<InventoryResponse>(
    buildQueryString(),
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  // SWR for dropdown options
  const { data: dropdownData } = useSWR<DropdownsResponse>(
    API_ENDPOINTS.INVENTORY_DROPDOWNS,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // SWR for branches (for admin filter)
  const { data: branchData } = useSWR<{ success: boolean; data: any[] }>(
    sessionManager.getUserType() === 'admin' ? API_ENDPOINTS.BRANCHES : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const inventory = data?.data || [];
  const pagination = data?.pagination;
  const categories = dropdownData?.categories || [];
  const suppliers = dropdownData?.suppliers || [];
  const branches = branchData?.data || [];

  // Apply Search/Filters
  const applyFilters = useCallback(() => {
    setSearchTerm(searchInput);
    setCategoryFilter(categoryInput);
    setSupplierFilter(supplierInput);
    setUnderQtyFilter(underQtyInput);
    setBranchFilter(branchInput);
    setPage(1);
  }, [searchInput, categoryInput, supplierInput, underQtyInput, branchInput]);

  // Modal Handlers
  const handleOpenEditModal = (item: InventoryItem) => {
      setSelectedItem(item);
      setEditForm({ qty: item.qty, sellPrice: item.sellPrice });
      setIsEditModalOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedItem) return;
      
      setIsSubmitting(true);
      try {
          const result = await apiClient.put(API_ENDPOINTS.INVENTORY_BY_ID(selectedItem.id), {
              qty: editForm.qty,
              sellPrice: editForm.sellPrice
          });
          
          if (result.success) {
              mutate();
              setIsEditModalOpen(false);
          } else {
              alert(result.message || 'Failed to update inventory');
          }
      } catch (error) {
          console.error('Update error:', error);
          alert('An error occurred. Please try again.');
      } finally {
          setIsSubmitting(false);
      }
  };

  // Barcode Handlers
  const handleOpenBarcodeModal = (item: InventoryItem) => {
      setSelectedItem(item);
      setBarcodeConfig({ qty: item.qty, type: 'Code 128' });
      setIsBarcodeModalOpen(true);
  };

  // IMEI Handlers
  const handleOpenImeiModal = async (item: InventoryItem) => {
      setSelectedItem(item);
      setIsImeiModalOpen(true);
      setIsLoadingImei(true);
      try {
          const res = await apiClient.get(API_ENDPOINTS.INVENTORY_IMEI(item.id));
          if (res.success) {
              setImeiList(res.data);
          } else {
              setImeiList([]);
          }
      } catch (error) {
          console.error('Fetch IMEI error:', error);
          setImeiList([]);
      } finally {
          setIsLoadingImei(false);
      }
  };

  // Price History Handlers
  const handleOpenPriceHistoryModal = async (item: InventoryItem) => {
      setSelectedItem(item);
      setIsPriceHistoryModalOpen(true);
      setIsLoadingPriceHistory(true);
      try {
          const res = await apiClient.get(API_ENDPOINTS.INVENTORY_PRICE_HISTORY(item.id));
          if (res.success) {
              setPriceHistory(res.data);
          } else {
              setPriceHistory([]);
          }
      } catch (error) {
          console.error('Fetch price history error:', error);
          setPriceHistory([]);
      } finally {
          setIsLoadingPriceHistory(false);
      }
  };

  const handleOpenSellingPriceHistoryModal = async (item: InventoryItem) => {
      setSelectedItem(item);
      setIsSellingPriceHistoryModalOpen(true);
      setIsLoadingSellingPriceHistory(true);
      try {
          const res = await apiClient.get(API_ENDPOINTS.INVENTORY_SELLING_PRICE_HISTORY(item.id));
          if (res.success) {
              setSellingPriceHistory(res.data);
          } else {
              setSellingPriceHistory([]);
          }
      } catch (error) {
          console.error('Fetch selling price history error:', error);
          setSellingPriceHistory([]);
      } finally {
          setIsLoadingSellingPriceHistory(false);
      }
  };

  // Adjustment Handlers
  const handleOpenAdjustModal = (item: InventoryItem) => {
      setSelectedItem(item);
      setAdjustForm({ type: 'add', qty: 1, reason: '', imei: '' });
      setIsAdjustModalOpen(true);
      setIsHistoryView(false);
      fetchAdjustmentHistory(item.id);
  };

  const fetchAdjustmentHistory = async (productId: string | number) => {
      setIsLoadingAdjustment(true);
      try {
          const res = await apiClient.get(`${API_ENDPOINTS.INVENTORY}/${productId}/adjustments`);
          if (res.success) setAdjustmentHistory(res.data);
      } catch (err) {
          console.error('Fetch adjustment history error:', err);
      } finally {
          setIsLoadingAdjustment(false);
      }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedItem) return;

      const branchId = sessionManager.getBranchId();
      if (!branchId) return alert("Branch ID not found in session");

      const payload = {
          productId: selectedItem.id,
          branchId: Number(branchId),
          qty: adjustForm.type === 'add' ? adjustForm.qty : -adjustForm.qty,
          reason: adjustForm.reason,
          imei: selectedItem.isSerialized ? adjustForm.imei : undefined
      };

      if (selectedItem.isSerialized && !adjustForm.imei) {
          return alert("Please select or enter an IMEI for adjustment");
      }

      setIsSubmitting(true);
      try {
          const res = await apiClient.post(`${API_ENDPOINTS.INVENTORY}/adjust`, payload);
          if (res.success) {
              mutate();
              setIsAdjustModalOpen(false);
          } else {
              alert(res.message || 'Adjustment failed');
          }
      } catch (err) {
          console.error('Adjustment error:', err);
          alert('An error occurred');
      } finally {
          setIsSubmitting(false);
      }
  };

  // Reset Filters - Clear all and show all data
  const resetFilters = () => {
      setSearchInput('');
      setSearchTerm('');
      setUnderQtyInput('');
      setUnderQtyFilter('');
      setCategoryInput('');
      setCategoryFilter('');
      setSupplierInput('');
      setSupplierFilter('');
      setActiveTab('phone');
      setPage(1);
      mutate();
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex flex-col font-sans overflow-hidden">
      {/* Header - Fixed Top */}
      <header className="bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-700 z-40 shrink-0 h-16">
        <button 
            onClick={() => navigate('/purchase')}
            className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
        >
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Inventory List</h1>
        
        {/* Refresh Button */}
        <button
          onClick={resetFilters}
          className="ml-auto p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
          title="Refresh & Reset Filters"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Main Content - Flex Col on Mobile, Flex Row on Desktop */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          {/* LEFT PANEL - Filters */}
          <aside className="w-full lg:w-80 bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto shrink-0 z-30 shadow-xl max-h-[40vh] lg:max-h-full">
              <div className="flex items-center gap-2 text-blue-400 border-b border-gray-700 pb-2 sticky top-0 bg-gray-800 z-10">
                  <Filter size={20} />
                  <h2 className="font-bold text-lg">Search & Filters</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {/* Text Search */}
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Search Item</label>
                      <div className="relative">
                          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                          <input 
                              type="text" 
                              placeholder="Code or Name..." 
                              value={searchInput}
                              onChange={(e) => setSearchInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                              className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          />
                      </div>
                  </div>

                  {/* Under Qty Filter */}
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Under Quantity {"(<=)"}</label>
                      <input 
                          type="number" 
                          placeholder="Stock below..." 
                          value={underQtyInput}
                          onChange={(e) => setUnderQtyInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <Layers size={16}/> Category
                      </label>
                      <select 
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                      >
                          <option value="">All Categories</option>
                          {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                      </select>
                  </div>

                  {/* Supplier Filter */}
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <Truck size={16}/> Supplier
                      </label>
                      <select 
                          value={supplierInput}
                          onChange={(e) => setSupplierInput(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                      >
                          <option value="">All Suppliers</option>
                          {suppliers.map(sup => (
                              <option key={sup.id} value={sup.id}>{sup.name}</option>
                          ))}
                      </select>
                  </div>

                  {/* Branch Filter (Admin Only) */}
                  {sessionManager.getUserType() === 'admin' && (
                      <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">Shop / Branch</label>
                          <select 
                              value={branchInput}
                              onChange={(e) => setBranchInput(e.target.value)}
                              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                          >
                              <option value="all">All Branches</option>
                              {branches.map((b: any) => (
                                  <option key={b.AID} value={b.AID}>{b.BranchName}</option>
                              ))}
                          </select>
                      </div>
                  )}

                  <div className="pt-2 flex flex-col gap-2">
                      <button 
                          onClick={applyFilters}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
                      >
                          <Search size={16} /> Apply Filters
                      </button>
                      <button 
                          onClick={resetFilters}
                          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                          <RefreshCw size={16} /> Reset All
                      </button>
                      <button 
                          onClick={() => exportStyledExcel("Inventory List", ["Code", "Item Name", "Category", "Supplier", "Qty", "Sell Price"], inventory.map(i => [i.code, i.name, i.categoryName, i.supplierName, i.qty, i.sellPrice]), "inventory.xlsx")}
                          disabled={inventory.length === 0}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                      >
                          <Download size={16} /> Export Excel
                      </button>
                  </div>
              </div>
          </aside>

          {/* RIGHT PANEL - Content */}
          <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative">
              
              {/* Top Bar */}
              <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900 z-20 sticky top-0">
                  <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Show</span>
                      <select 
                          value={limit}
                          onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
                      >
                          {PAGINATION_CONFIG.LIMIT_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                          ))}
                      </select>
                      <span className="text-sm text-gray-400">entries</span>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                      {pagination && (
                          <span>Showing <span className="text-white font-medium">{(page-1)*limit + 1}</span> to <span className="text-white font-medium">{Math.min(page*limit, pagination.total)}</span> of <span className="text-white font-medium">{pagination.total}</span> records</span>
                      )}
                  </div>
              </div>

              {/* Navigation Tabs */}
              <div className="px-4 lg:px-6 pt-4 bg-gray-900 z-10 shrink-0">
                  <div className="flex bg-gray-800 border-b border-gray-700 rounded-xl overflow-hidden text-sm">
                      <button
                          type="button"
                          onClick={() => {
                              setActiveTab('phone');
                              setPage(1);
                          }}
                          className={`flex-1 px-6 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                              activeTab === 'phone'
                                  ? 'border-blue-500 text-blue-400 bg-gray-750/30'
                                  : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-750/10'
                          }`}
                      >
                          Phone
                      </button>
                      <button
                          type="button"
                          onClick={() => {
                              setActiveTab('accessories');
                              setPage(1);
                          }}
                          className={`flex-1 px-6 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                              activeTab === 'accessories'
                                  ? 'border-blue-500 text-blue-400 bg-gray-750/30'
                                  : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-750/10'
                          }`}
                      >
                          Accessories
                      </button>
                      <button
                          type="button"
                          onClick={() => {
                              setActiveTab('service');
                              setPage(1);
                          }}
                          className={`flex-1 px-6 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                              activeTab === 'service'
                                  ? 'border-blue-500 text-blue-400 bg-gray-750/30'
                                  : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-750/10'
                          }`}
                      >
                          Service Item
                      </button>
                      <button
                          type="button"
                          onClick={() => {
                              setActiveTab('spare');
                              setPage(1);
                          }}
                          className={`flex-1 px-6 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                              activeTab === 'spare'
                                  ? 'border-blue-500 text-blue-400 bg-gray-750/30'
                                  : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-750/10'
                          }`}
                      >
                          Spare Part
                      </button>
                  </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                  <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                          <Loader2 className="animate-spin text-blue-500 mb-4 mx-auto" size={48} />
                          <p className="text-gray-400 animate-pulse">Loading inventory records...</p>
                      </div>
                  </div>
              )}

              {/* Error State */}
              {error && (
                  <div className="flex-1 flex items-center justify-center p-6">
                      <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-8 text-center max-w-md">
                          <X size={48} className="text-red-500 mb-4 mx-auto" />
                          <h3 className="text-xl font-bold text-white mb-2">Fetch Error</h3>
                          <p className="text-red-300/80 mb-6">We couldn't load the inventory data. This might be a connection issue.</p>
                          <button onClick={() => mutate()} className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all">Retry Now</button>
                      </div>
                  </div>
              )}

              {/* Table Content */}
              {!isLoading && !error && (
                  <div className="flex-1 overflow-auto p-4 lg:p-6">
                      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden min-w-[1000px]">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                      <th className="p-4 w-16 text-center">No</th>
                                      <th className="p-4 w-20">Image</th>
                                      <th className="p-4">Code</th>
                                      <th className="p-4">Item Name</th>
                                      <th className="p-4">Category</th>
                                      <th className="p-4">Supplier</th>
                                      {sessionManager.getUserType() === 'admin' && <th className="p-4 text-center">Shop / Branch</th>}
                                      <th className="p-4 text-center">Qty</th>
                                      <th className="p-4 text-right">Buying Price</th>
                                      <th className="p-4 text-right">Sell Price</th>
                                      <th className="p-4 text-center w-32">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700/50">
                                  {inventory.length > 0 ? (
                                      inventory.map((item, index) => (
                                          <tr key={item.id} className="hover:bg-gray-750 transition-colors group">
                                              <td className="p-4 text-center text-gray-500 text-sm font-mono">
                                                  {(page - 1) * limit + index + 1}
                                              </td>
                                              <td className="p-4">
                                                  <div className="w-12 h-12 rounded-xl bg-gray-900 overflow-hidden border border-gray-700 p-1 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                                                      {item.image ? (
                                                          <img src={getImageUrl(item.image)} alt="" className="w-full h-full object-contain" />
                                                      ) : (
                                                          <ImageIcon size={20} className="text-gray-600" />
                                                      )}
                                                  </div>
                                              </td>
                                              <td className="p-4 text-sm font-mono text-blue-400 font-medium">
                                                  {item.code}
                                              </td>
                                              <td className="p-4">
                                                  <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{item.name}</div>
                                                  <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                                                      <Layers size={10} /> {item.categoryName || 'No Category'}
                                                  </div>
                                              </td>
                                              <td className="p-4 text-sm text-gray-400">{item.categoryName || '-'}</td>
                                              <td className="p-4 text-sm text-gray-400">{item.supplierName || '-'}</td>
                                              {sessionManager.getUserType() === 'admin' && (
                                                  <td className="p-4 text-center">
                                                      <span className="px-2 py-1 bg-indigo-900/30 text-indigo-400 border border-indigo-800 rounded-lg text-xs font-medium">
                                                          {item.branchName || 'Unknown'}
                                                      </span>
                                                  </td>
                                              )}
                                              <td className="p-4 text-center">
                                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                                      item.qty <= 5 ? 'bg-red-900/30 text-red-400 border-red-800' : 
                                                      item.qty <= 10 ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' : 
                                                      'bg-emerald-900/30 text-emerald-400 border-emerald-800'
                                                  }`}>
                                                      {item.qty}
                                                  </span>
                                              </td>
                                              <td className="p-4 text-sm text-right font-medium text-gray-300">
                                                  <button 
                                                      onClick={() => handleOpenPriceHistoryModal(item)}
                                                      className="hover:text-amber-400 transition-colors flex items-center gap-1 ml-auto"
                                                      title="View Buying Price History"
                                                  >
                                                      <TrendingUp size={14} className="text-amber-500/50" />
                                                      {item.purchasePrice?.toLocaleString()}
                                                  </button>
                                              </td>
                                              <td className="p-4 text-sm text-right font-bold text-white">
                                                  <button 
                                                      onClick={() => handleOpenSellingPriceHistoryModal(item)}
                                                      className="hover:text-blue-400 transition-colors flex items-center gap-1 ml-auto"
                                                      title="View Selling Price History"
                                                  >
                                                      <History size={14} className="text-blue-500/50" />
                                                      {item.sellPrice?.toLocaleString()}
                                                  </button>
                                              </td>
                                              <td className="p-4">
                                                  <div className="flex items-center justify-center gap-1">
                                                      <button 
                                                          onClick={() => handleOpenEditModal(item)} style={{ display: isAdmin ? 'none' : 'flex' }}
                                                          className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                                                          title="Change Price"
                                                      >
                                                          <Tag size={16} />
                                                      </button>
                                                      {item.isSerialized && (
                                                        <button 
                                                            onClick={() => handleOpenImeiModal(item)}
                                                            className="p-2 text-emerald-400 hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                            title="View IMEI List"
                                                        >
                                                            <Layers size={16} />
                                                        </button>
                                                      )}
                                                      <button 
                                                          onClick={() => handleOpenAdjustModal(item)}
                                                          className="p-2 text-emerald-400 hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                          title="Adjust Stock"
                                                      >
                                                          <PlusCircle size={16} />
                                                      </button>
                                                      <button 
                                                          onClick={() => handleOpenBarcodeModal(item)} style={{ display: isAdmin ? 'none' : 'flex' }}
                                                          className="p-2 text-amber-400 hover:bg-amber-900/30 rounded-lg transition-colors"
                                                          title="Print Barcode"
                                                      >
                                                          <Printer size={16} />
                                                      </button>
                                                  </div>
                                              </td>
                                          </tr>
                                      ))
                                  ) : (
                                      <tr>
                                          <td colSpan={10} className="p-12 text-center text-gray-500 italic">
                                              No inventory records match your current filters.
                                          </td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>

                      {/* Pagination Controls */}
                      {pagination && pagination.total > 0 && (
                          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-800 rounded-2xl border border-gray-700">
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                  Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{pagination.totalPages}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <button 
                                      onClick={() => setPage(page - 1)}
                                      disabled={!pagination.hasPrev}
                                      className="p-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-lg"
                                  >
                                      <ChevronLeft size={20} />
                                  </button>
                                  <div className="flex items-center gap-1">
                                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                          let p;
                                          if (pagination.totalPages <= 5) p = i + 1;
                                          else if (page <= 3) p = i + 1;
                                          else if (page >= pagination.totalPages - 2) p = pagination.totalPages - 4 + i;
                                          else p = page - 2 + i;
                                          return (
                                              <button
                                                  key={p}
                                                  onClick={() => setPage(p)}
                                                  className={`w-10 h-10 rounded-xl font-bold transition-all ${page === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                                              >
                                                  {p}
                                              </button>
                                          );
                                      })}
                                  </div>
                                  <button 
                                      onClick={() => setPage(page + 1)}
                                      disabled={!pagination.hasNext}
                                      className="p-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-lg"
                                  >
                                      <ChevronRight size={20} />
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              )}
          </main>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Tag size={20} className="text-blue-400" />
                        Change Selling Price
                    </h2>
                    <button 
                        onClick={() => setIsEditModalOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleUpdateItem} className="p-6 space-y-5">
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                        <div className="mb-2">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Item Name</p>
                            <p className="text-white font-medium">{selectedItem.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Code</p>
                            <p className="text-blue-400 font-mono text-sm">{selectedItem.code}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">New Selling Price</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                required
                                min="0"
                                value={editForm.sellPrice}
                                onChange={(e) => setEditForm({...editForm, sellPrice: Number(e.target.value)})}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all pl-10"
                                disabled={isSubmitting}
                                autoFocus
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">Note: Changing the price will be recorded in the price history.</p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-3 rounded-xl transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                            Update Price
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* BARCODE PRINT MODAL */}
      {isBarcodeModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                 {/* Blue Header */}
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold">Barcode Print</h2>
                    <button 
                        onClick={() => setIsBarcodeModalOpen(false)}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row h-full max-h-[80vh]">
                    {/* Left Panel: Configuration */}
                    <div className="w-full lg:w-1/3 bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Code No</label>
                                <input 
                                    type="text" 
                                    readOnly
                                    value={selectedItem.code}
                                    className="w-full bg-gray-200 border border-gray-300 rounded px-3 py-2 text-gray-600 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Item Name</label>
                                <input 
                                    type="text" 
                                    readOnly
                                    value={selectedItem.name}
                                    className="w-full bg-gray-200 border border-gray-300 rounded px-3 py-2 text-gray-600 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Price</label>
                                <input 
                                    type="number" 
                                    readOnly
                                    value={selectedItem.sellPrice}
                                    className="w-full bg-gray-200 border border-gray-300 rounded px-3 py-2 text-gray-600 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Qty</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={barcodeConfig.qty}
                                    onChange={(e) => setBarcodeConfig({...barcodeConfig, qty: Number(e.target.value)})}
                                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Barcode Type</label>
                                <select 
                                    value={barcodeConfig.type}
                                    onChange={(e) => setBarcodeConfig({...barcodeConfig, type: e.target.value})}
                                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Code 128">Code 128</option>
                                    <option value="Code 39">Code 39</option>
                                    <option value="EAN-13">EAN-13</option>
                                </select>
                            </div>

                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-colors mt-4">
                                Generate
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Preview */}
                    <div className="w-full lg:w-2/3 bg-white p-6 flex flex-col">
                        <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                            <div className="flex flex-wrap gap-4 justify-start content-start">
                                {Array.from({ length: barcodeConfig.qty }).map((_, index) => (
                                    <div key={index} className="w-[200px] h-[120px] bg-white border border-black p-2 flex flex-col items-center justify-center text-center shadow-sm">
                                        <p className="text-[10px] font-bold text-black mb-1 line-clamp-1 w-full leading-tight">
                                            {selectedItem.name}
                                        </p>
                                        <div className="flex-1 flex items-center justify-center w-full">
                                             {/* Using the Google Font for visual barcode representation */}
                                             <span className="font-barcode text-4xl text-black">
                                                 {selectedItem.code}
                                             </span>
                                        </div>
                                        <p className="text-[10px] text-black tracking-widest font-mono">
                                            {selectedItem.code}
                                        </p>
                                        <p className="text-xs font-bold text-black mt-1">
                                            price : {selectedItem.sellPrice?.toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button 
                                onClick={() => window.print()} 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded shadow-lg transition-colors flex items-center gap-2"
                            >
                                <Printer size={18} /> Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* IMEI MODAL */}
      {isImeiModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Layers size={20} className="text-emerald-400" />
                            IMEI Details
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">{selectedItem.name} ({selectedItem.code})</p>
                    </div>
                    <button 
                        onClick={() => setIsImeiModalOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {isLoadingImei ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="animate-spin text-emerald-500" size={32} />
                        </div>
                    ) : imeiList.length > 0 ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <div className="bg-gray-750 p-2 rounded-lg border border-gray-700 text-center">
                                    <span className="text-gray-400 text-[10px] block uppercase">Available</span>
                                    <span className="text-emerald-400 font-bold">{imeiList.filter(i => i.status === 'Available').length}</span>
                                </div>
                                <div className="bg-gray-750 p-2 rounded-lg border border-gray-700 text-center">
                                    <span className="text-gray-400 text-[10px] block uppercase">Sold</span>
                                    <span className="text-blue-400 font-bold">{imeiList.filter(i => i.status === 'Sold').length}</span>
                                </div>
                                <div className="bg-gray-750 p-2 rounded-lg border border-gray-700 text-center">
                                    <span className="text-gray-400 text-[10px] block uppercase">Damage</span>
                                    <span className="text-amber-400 font-bold">{imeiList.filter(i => i.status === 'Damaged').length}</span>
                                </div>
                                <div className="bg-gray-750 p-2 rounded-lg border border-gray-700 text-center">
                                    <span className="text-gray-400 text-[10px] block uppercase">Returned</span>
                                    <span className="text-red-400 font-bold">{imeiList.filter(i => i.status === 'Returned').length}</span>
                                </div>
                            </div>
                            
                            <ul className="space-y-2">
                                {imeiList.map((imeiItem, index) => (
                                    <li key={index} className="bg-gray-750 p-3 rounded-lg border border-gray-700 flex justify-between items-center relative overflow-hidden group">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                            imeiItem.status === 'Available' ? 'bg-emerald-500' : 
                                            imeiItem.status === 'Sold' ? 'bg-blue-500' : 
                                            imeiItem.status === 'Damaged' ? 'bg-amber-500' : 'bg-red-500'
                                        }`} />
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-xs font-mono mb-1 flex items-center gap-2">
                                                IMEI 1 
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    imeiItem.status === 'Available' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 
                                                    imeiItem.status === 'Sold' ? 'bg-blue-900/50 text-blue-400 border border-blue-800' : 
                                                    imeiItem.status === 'Damaged' ? 'bg-amber-900/50 text-amber-400 border border-amber-800' : 
                                                    'bg-red-900/50 text-red-400 border border-red-800'
                                                }`}>
                                                    {imeiItem.status}
                                                </span>
                                            </span>
                                            <span className="text-white font-medium tracking-wider">{imeiItem.imei_1}</span>
                                        </div>
                                        {imeiItem.imei_2 && (
                                            <div className="flex flex-col items-end border-l border-gray-600 pl-4">
                                                <span className="text-gray-400 text-xs font-mono mb-1">IMEI 2</span>
                                                <span className="text-white font-medium tracking-wider">{imeiItem.imei_2}</span>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-gray-400">No active IMEIs found in stock for this item.</p>
                        </div>
                    )}
                </div>
                
                <div className="p-5 border-t border-gray-700 bg-gray-750 rounded-b-2xl shrink-0 flex justify-end">
                    <button 
                        onClick={() => setIsImeiModalOpen(false)}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* PRICE HISTORY MODAL */}
      {isPriceHistoryModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <TrendingUp size={20} className="text-amber-400" />
                            Buying Price History
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">{selectedItem.name} ({selectedItem.code})</p>
                    </div>
                    <button 
                        onClick={() => setIsPriceHistoryModalOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {isLoadingPriceHistory ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="animate-spin text-amber-500" size={32} />
                        </div>
                    ) : priceHistory.length > 0 ? (
                        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-800 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                    <tr>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Invoice</th>
                                        <th className="p-3">Supplier</th>
                                        <th className="p-3">IMEI</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3 text-right">Unit Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {priceHistory.map((history, index) => (
                                        <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="p-3 text-sm text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-gray-500" />
                                                    {new Date(history.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm text-blue-400 font-mono">{history.invoice}</td>
                                            <td className="p-3 text-sm text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-gray-500" />
                                                    {history.supplierName || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm">
                                                {history.imei_1 ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-white font-mono text-xs">{history.imei_1}</span>
                                                        {history.imei_2 && <span className="text-gray-500 font-mono text-[10px]">{history.imei_2}</span>}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-sm text-center text-gray-400">{history.qty}</td>
                                            <td className="p-3 text-sm text-right font-bold text-amber-400">
                                                {Number(history.price).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrendingUp size={32} className="text-gray-500" />
                            </div>
                            <p className="text-gray-400">No purchase history found for this item.</p>
                        </div>
                    )}
                </div>
                
                <div className="p-5 border-t border-gray-700 bg-gray-750 rounded-b-2xl shrink-0 flex justify-end">
                    <button 
                        onClick={() => setIsPriceHistoryModalOpen(false)}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {isAdjustModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <PlusCircle size={20} className="text-emerald-400" />
                            Stock Adjustment
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">{selectedItem.name} ({selectedItem.code})</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsHistoryView(!isHistoryView)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${isHistoryView ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                        >
                            {isHistoryView ? <PlusCircle size={16} /> : <History size={16} />}
                            {isHistoryView ? 'Back to Adjust' : 'View History'}
                        </button>
                        <button 
                            onClick={() => setIsAdjustModalOpen(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {isHistoryView ? (
                        /* History View */
                        isLoadingAdjustment ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="animate-spin text-blue-500" size={40} />
                            </div>
                        ) : adjustmentHistory.length > 0 ? (
                            <div className="space-y-4">
                                {adjustmentHistory.map((adj, idx) => (
                                    <div key={idx} className="bg-gray-900/50 border border-gray-700 p-4 rounded-xl flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${adj.Qty > 0 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                                                {adj.Qty > 0 ? <PlusCircle size={20} /> : <MinusCircle size={20} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${adj.Qty > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {adj.Qty > 0 ? '+' : ''}{adj.Qty}
                                                    </span>
                                                    <span className="text-gray-400 text-xs">Correction</span>
                                                </div>
                                                <p className="text-sm text-gray-300 mt-0.5">{adj.Reason || 'No reason specified'}</p>
                                                {adj.Imei && <p className="text-[10px] text-blue-400 font-mono mt-1">IMEI: {adj.Imei}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 font-medium">{new Date(adj.AdjustDate).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-gray-600 mt-1">{new Date(adj.AdjustDate).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <History size={48} className="mx-auto text-gray-700 mb-4 opacity-20" />
                                <p className="text-gray-500">No adjustment records found for this item.</p>
                            </div>
                        )
                    ) : (
                        /* Adjustment Form */
                        <form id="adjustForm" onSubmit={handleAdjustStock} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setAdjustForm({ ...adjustForm, type: 'add' })}
                                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${adjustForm.type === 'add' ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-900/20' : 'bg-gray-900/50 border-gray-700 text-gray-500 hover:border-gray-600'}`}
                                >
                                    <PlusCircle size={24} />
                                    <span className="font-bold">Add to Stock</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAdjustForm({ ...adjustForm, type: 'remove' })}
                                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${adjustForm.type === 'remove' ? 'bg-red-900/20 border-red-500 text-red-400 shadow-lg shadow-red-900/20' : 'bg-gray-900/50 border-gray-700 text-gray-500 hover:border-gray-600'}`}
                                >
                                    <MinusCircle size={24} />
                                    <span className="font-bold">Remove from Stock</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Adjustment Qty</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="1"
                                        value={adjustForm.qty}
                                        onChange={(e) => setAdjustForm({...adjustForm, qty: Number(e.target.value)})}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                {selectedItem.isSerialized && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">IMEI Number</label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="Scan or enter IMEI..."
                                            value={adjustForm.imei}
                                            onChange={(e) => setAdjustForm({...adjustForm, imei: e.target.value})}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 px-4 text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-2 italic">
                                            {adjustForm.type === 'remove' ? 'Enter IMEI to remove from stock' : 'Enter new IMEI to add to stock'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Adjustment Reason</label>
                                <textarea 
                                    rows={3}
                                    required
                                    placeholder="Explain why you are adjusting the stock (e.g., Stock count correction, lost item, found item)..."
                                    value={adjustForm.reason}
                                    onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                />
                            </div>
                        </form>
                    )}
                </div>
                
                <div className="p-5 border-t border-gray-700 bg-gray-750 rounded-b-2xl shrink-0 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsAdjustModalOpen(false)}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-6 rounded-xl transition-colors"
                    >
                        {isHistoryView ? 'Close' : 'Cancel'}
                    </button>
                    {!isHistoryView && (
                        <button 
                            form="adjustForm"
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 md:flex-none md:min-w-[160px] font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${adjustForm.type === 'add' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30' : 'bg-red-600 hover:bg-red-500 shadow-red-900/30'}`}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (adjustForm.type === 'add' ? <PlusCircle size={18} /> : <MinusCircle size={18} />)}
                            Confirm Adjustment
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* SELLING PRICE HISTORY MODAL */}
      {isSellingPriceHistoryModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <History size={24} className="text-blue-400" />
                            Selling Price History
                        </h2>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{selectedItem.name}</p>
                    </div>
                    <button 
                        onClick={() => setIsSellingPriceHistoryModalOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {isLoadingSellingPriceHistory ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                            <p className="text-gray-400">Fetching history...</p>
                        </div>
                    ) : sellingPriceHistory.length > 0 ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-900/50 rounded-lg mb-2">
                                <div>Old Price</div>
                                <div>New Price</div>
                                <div>Changed By</div>
                                <div className="text-right">Date</div>
                            </div>
                            <div className="space-y-2">
                                {sellingPriceHistory.map((hist, idx) => (
                                    <div key={idx} className="grid grid-cols-4 px-4 py-4 items-center bg-gray-900/30 border border-gray-700/50 rounded-xl hover:border-blue-500/50 transition-colors group">
                                        <div className="text-sm text-gray-400 line-through decoration-red-500/50">
                                            {hist.oldPrice?.toLocaleString()}
                                        </div>
                                        <div className="text-base font-bold text-emerald-400">
                                            {hist.newPrice?.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-900/30 flex items-center justify-center text-[10px] text-blue-400 font-bold border border-blue-800">
                                                {hist.userName?.charAt(0).toUpperCase()}
                                            </div>
                                            {hist.userName || 'System'}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-300 font-medium">{new Date(hist.date).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-gray-600 mt-0.5">{new Date(hist.date).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <History size={48} className="mx-auto text-gray-700 mb-4 opacity-20" />
                            <p className="text-gray-500 font-medium">No selling price changes recorded for this item.</p>
                            <p className="text-[10px] text-gray-600 mt-2">Any future price updates will appear here.</p>
                        </div>
                    )}
                </div>
                
                <div className="p-5 border-t border-gray-700 bg-gray-750 rounded-b-2xl flex justify-end">
                    <button 
                        onClick={() => setIsSellingPriceHistoryModalOpen(false)}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-8 rounded-xl transition-colors shadow-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
