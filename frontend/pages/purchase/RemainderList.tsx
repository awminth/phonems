import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Search, 
    Download, 
    ChevronLeft, 
    ChevronRight,
    Filter,
    Layers,
    Truck,
    BellRing,
    Loader2,
    RefreshCw,
    AlertTriangle,
    X
} from 'lucide-react';
import { InventoryItem } from '../../types';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, getImageUrl } from '../../config';
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
}

// Default low stock threshold
const LOW_STOCK_THRESHOLD = 3;

const RemainderList: React.FC = () => {
  const navigate = useNavigate();
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [underQtyFilter, setUnderQtyFilter] = useState('min');
  const [underQtyInput, setUnderQtyInput] = useState('min');
  const [customQty, setCustomQty] = useState('3');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [supplierInput, setSupplierInput] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
  const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);

  // IMEI State
  const [isImeiModalOpen, setIsImeiModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [imeiList, setImeiList] = useState<any[]>([]);
  const [isLoadingImei, setIsLoadingImei] = useState(false);

  // Build query string for SWR - always filter by underQty
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (searchTerm) params.append('search', searchTerm);
    if (categoryFilter) params.append('categoryId', categoryFilter);
    if (supplierFilter) params.append('supplierId', supplierFilter);
    // Always apply underQty filter (default is 'min')
    params.append('underQty', underQtyFilter || 'min');
    return `${API_ENDPOINTS.INVENTORY}?${params.toString()}`;
  };

  // SWR for inventory data (low stock items)
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

  const inventory = data?.data || [];
  const pagination = data?.pagination;
  const categories = dropdownData?.categories || [];
  const suppliers = dropdownData?.suppliers || [];

  // Apply Search/Filters
  const applyFilters = useCallback(() => {
    setSearchTerm(searchInput);
    setCategoryFilter(categoryInput);
    setSupplierFilter(supplierInput);
    setUnderQtyFilter(underQtyInput);
    setPage(1);
  }, [searchInput, categoryInput, supplierInput, underQtyInput]);

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


  // Export Excel (UTF-8)
  const exportToExcel = () => {
    if (inventory.length === 0) return;

    const title = `Stock Remainder List (Qty <= ${underQtyFilter === 'min' ? 'Min Stock' : underQtyFilter})`;
    const headers = ["Code", "Item Name", "Category", "Supplier", "Qty", "Min Stock", "Sell Price"];
    
    const excelData = inventory.map(item => [
      item.code,
      item.name,
      item.categoryName || '',
      item.supplierName || '',
      item.qty,
      item.minStockQty || 0,
      item.sellPrice
    ]);

    const timestamp = new Date().toISOString().split('T')[0];
    exportStyledExcel(title, headers, excelData, `low_stock_list_${timestamp}.xlsx`, 'Low Stock');
  };

  // Reset Filters - Reset to default low stock threshold
  const resetFilters = () => {
      setSearchInput('');
      setSearchTerm('');
      setUnderQtyInput('min');
      setUnderQtyFilter('min');
      setCustomQty('3');
      setCategoryInput('');
      setCategoryFilter('');
      setSupplierInput('');
      setSupplierFilter('');
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
        <div className="flex items-center gap-2">
            <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500">
                <BellRing size={20} />
            </div>
            <h1 className="text-xl font-bold">Stock Remainder List</h1>
            {pagination && pagination.total > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                    {pagination.total} Low Stock
                </span>
            )}
        </div>
        
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
              <div className="flex items-center gap-2 text-yellow-400 border-b border-gray-700 pb-2 sticky top-0 bg-gray-800 z-10">
                  <Filter size={20} />
                  <h2 className="font-bold text-lg">Search & Filters</h2>
              </div>

              {/* Alert Info */}
              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-200">
                      Showing items with quantity less than or equal to <strong>{underQtyFilter === 'min' ? "their minimum stock threshold" : underQtyFilter}</strong>. 
                      These items need to be restocked soon.
                  </p>
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
                              className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                          />
                      </div>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <Layers size={16}/> Category
                      </label>
                      <select 
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none appearance-none"
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
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none appearance-none"
                      >
                          <option value="">All Suppliers</option>
                          {suppliers.map(sup => (
                              <option key={sup.id} value={sup.id}>{sup.name}</option>
                          ))}
                      </select>
                  </div>

                  {/* Under Qty Filter */}
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Low Stock Threshold</label>
                      <select
                          value={underQtyInput === 'min' ? 'min' : 'custom'}
                          onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'min') {
                                  setUnderQtyInput('min');
                              } else {
                                  setUnderQtyInput(customQty);
                              }
                          }}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none appearance-none"
                      >
                          <option value="min">Product Min Stock Limit</option>
                          <option value="custom">Custom Quantity Limit</option>
                      </select>

                      {underQtyInput !== 'min' && (
                          <div className="relative mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                              <input 
                                  type="number" 
                                  placeholder="e.g. 3" 
                                  min="0"
                                  value={underQtyInput}
                                  onChange={(e) => {
                                      setUnderQtyInput(e.target.value);
                                      setCustomQty(e.target.value);
                                  }}
                                  onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                              />
                          </div>
                      )}
                  </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 lg:pt-4 lg:mt-auto space-y-3">
                  <button 
                      onClick={applyFilters} 
                      className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-yellow-900/30"
                  >
                      Apply Search
                  </button>
                  <button 
                      onClick={resetFilters}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2.5 rounded-lg font-medium transition-colors border border-gray-600"
                  >
                      Reset Filters
                  </button>
              </div>
          </aside>

          {/* RIGHT PANEL - Table */}
          <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative">
              
              {/* Top Bar inside Right Panel */}
              <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 z-20 sticky top-0">
                  <h3 className="text-lg font-semibold text-gray-200">
                      Low Stock Items <span className="text-sm font-normal text-gray-500 ml-2">({pagination?.total || 0} found)</span>
                  </h3>
                  <div className="flex gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 hidden sm:inline">Rows:</span>
                            <select 
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
                            >
                                {PAGINATION_CONFIG.LIMIT_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={exportToExcel}
                            disabled={inventory.length === 0}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors shadow-sm"
                        >
                            <Download size={16} /> <span className="hidden sm:inline">Export</span>
                        </button>
                  </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-yellow-500" size={40} />
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                        <p className="text-red-400">Failed to load data.</p>
                        <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Retry</button>
                    </div>
                </div>
              )}

              {/* Table Content */}
              {!isLoading && !error && (
                <div className="flex-1 overflow-auto p-4">
                 <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden min-w-[800px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                <th className="p-4 w-16">Image</th>
                                <th className="p-4">Code</th>
                                <th className="p-4">Item Name</th>
                                <th className="p-4 text-center">Qty</th>
                                <th className="p-4 text-center">Min Stock</th>
                                <th className="p-4 text-right">Sell Price</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Supplier</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {inventory.length > 0 ? (
                                inventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-750 transition-colors group">
                                        <td className="p-4">
                                            <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden border border-gray-600">
                                                <img 
                                                    src={item.image ? getImageUrl(item.image) : getImageUrl('/assets/icon.jpg')} 
                                                    alt={item.name} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = getImageUrl('/assets/icon.jpg') || '';
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-300">{item.code}</td>
                                        <td className="p-4 text-sm font-medium text-white">{item.name}</td>
                                        <td className="p-4 text-sm text-center">
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-red-900/50 text-red-300 border border-red-800 animate-pulse">
                                                {item.qty}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-center font-semibold text-gray-400">
                                            {item.minStockQty || 0}
                                        </td>
                                        <td className="p-4 text-sm text-right text-blue-400 font-medium">{item.sellPrice?.toLocaleString()}</td>
                                        <td className="p-4 text-sm text-gray-400">{item.categoryName || '-'}</td>
                                        <td className="p-4 text-sm text-gray-400">{item.supplierName || '-'}</td>
                                        <td className="p-4 text-center">
                                            {Boolean(item.isSerialized) ? (
                                                <button 
                                                    onClick={() => handleOpenImeiModal(item)}
                                                    className="p-1.5 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded transition-colors"
                                                    title="View IMEIs"
                                                >
                                                    <Layers size={16} />
                                                </button>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <BellRing size={48} className="mb-4 opacity-20 text-green-500"/>
                                            <p className="text-lg text-green-400">All stocked up!</p>
                                            <p className="text-sm">No items with low stock found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
                 
                 {/* Pagination */}
                 {pagination && pagination.total > 0 && (
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
                        <span className="text-sm text-gray-500">
                            Page <span className="text-white font-medium">{pagination.page}</span> of <span className="text-white font-medium">{pagination.totalPages}</span>
                            <span className="ml-2">({pagination.total} items need restocking)</span>
                        </span>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setPage(page - 1)}
                                disabled={!pagination.hasPrev}
                                className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (page <= 3) {
                                        pageNum = i + 1;
                                    } else if (page >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                                page === pageNum
                                                    ? 'bg-yellow-600 text-white'
                                                    : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button 
                                onClick={() => setPage(page + 1)}
                                disabled={!pagination.hasNext}
                                className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                 )}
                </div>
              )}
          </main>
      </div>

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
                            <div className="flex justify-between items-center bg-gray-750 p-3 rounded-lg border border-gray-700 mb-4">
                                <span className="text-gray-400 text-sm">Total In Stock:</span>
                                <span className="text-emerald-400 font-bold">{imeiList.length}</span>
                            </div>
                            
                            <ul className="space-y-2">
                                {imeiList.map((imeiItem, index) => (
                                    <li key={index} className="bg-gray-750 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-xs font-mono mb-1">IMEI 1</span>
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
    </div>
  );
};

export default RemainderList;
