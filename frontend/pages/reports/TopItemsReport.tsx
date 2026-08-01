
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Search, 
    Download, 
    ChevronLeft, 
    ChevronRight,
    TrendingUp,
    Filter,
    Check,
    ChevronDown,
    RefreshCw,
    Eye,
    X,
    Loader2
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, SWR_CONFIG, getImageUrl } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

interface TopItem {
  id: string;
  code: string;
  name: string;
  totalQty: number;
  totalAmount: number;
  categoryId: string;
  categoryName: string;
  supplierId: string;
  supplierName: string;
  image: string;
  lastSaleDate: string;
}

interface DropdownOption {
  id: string;
  name: string;
}

interface ItemDetail {
  item: {
    id: string;
    code: string;
    name: string;
    remainQty: number;
    sellPrice: number;
    categoryName: string;
    supplierName: string;
    image: string;
  };
  saleHistory: Array<{
    id: string;
    vno: string;
    qty: number;
    sellPrice: number;
    amount: number;
    date: string;
    customerName: string;
  }>;
  totals: {
    totalQty: number;
    totalAmount: number;
  };
}

// --- Shared: Searchable Dropdown ---
interface SearchableDropdownProps {
    options: DropdownOption[];
    value: string; 
    onChange: (value: string) => void;
    placeholder: string;
    allLabel?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ 
    options, 
    value, 
    onChange, 
    placeholder,
    allLabel = 'All'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
    const selectedOption = options.find(o => o.id === value);

    return (
        <div className="relative" ref={dropdownRef}>
            <div 
                className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 flex justify-between items-center cursor-pointer text-sm focus-within:ring-2 focus-within:ring-blue-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? 'text-white' : 'text-gray-400'}>
                    {value ? (selectedOption?.name || allLabel) : placeholder}
                </span>
                <ChevronDown size={16} className="text-gray-400"/>
            </div>
            
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800">
                        <div className="flex items-center bg-gray-700 rounded px-2">
                            <Search size={14} className="text-gray-400 mr-2"/>
                            <input 
                                type="text"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm py-1.5 text-white placeholder-gray-500 outline-none"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto">
                        <div 
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-600 hover:text-white flex justify-between items-center ${!value ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300'}`}
                            onClick={() => {
                                onChange('');
                                setIsOpen(false);
                                setSearch('');
                            }}
                        >
                            {allLabel}
                            {!value && <Check size={14} />}
                        </div>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <div 
                                    key={option.id}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-600 hover:text-white flex justify-between items-center ${option.id === value ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300'}`}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    {option.name}
                                    {option.id === value && <Check size={14} />}
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-sm text-gray-500 text-center">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Detail Modal Component
const DetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    detail: ItemDetail | null;
    isLoading: boolean;
    error: any;
    onRefresh: () => void;
    fromDate: string;
    toDate: string;
}> = ({ isOpen, onClose, detail, isLoading, error, onRefresh, fromDate, toDate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Eye size={20} className="text-blue-400" />
                        Sale History Detail
                    </h3>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onRefresh} 
                            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className="text-gray-400" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={40} className="animate-spin text-blue-500" />
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-center">
                                <p className="text-red-400">Failed to load item details</p>
                                <button 
                                    onClick={onRefresh} 
                                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : detail ? (
                        <div className="space-y-4">
                            {/* Item Info Card */}
                            <div className="bg-gray-700/50 rounded-lg p-4 flex gap-4">
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-600 flex-shrink-0">
                                    <img 
                                        src={detail.item.image ? getImageUrl(detail.item.image) : '/assets/icon.jpg'} 
                                        alt={detail.item.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/icon.jpg'; }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-white">{detail.item.name}</h4>
                                    <p className="text-sm text-gray-400">Code: <span className="text-blue-300 font-mono">{detail.item.code}</span></p>
                                    <p className="text-sm text-gray-400">Category: {detail.item.categoryName || '-'}</p>
                                    <p className="text-sm text-gray-400">Supplier: {detail.item.supplierName || '-'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">Remain Qty</p>
                                    <p className="text-2xl font-bold text-emerald-400">{detail.item.remainQty}</p>
                                    <p className="text-sm text-gray-400 mt-2">Price</p>
                                    <p className="text-lg font-medium text-white">{detail.item.sellPrice.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="text-sm text-gray-400 text-center">
                                Period: <span className="text-white">{fromDate || 'All'}</span> to <span className="text-white">{toDate || 'All'}</span>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-center">
                                    <p className="text-sm text-blue-300">Total Qty Sold</p>
                                    <p className="text-2xl font-bold text-white">{detail.totals.totalQty}</p>
                                </div>
                                <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4 text-center">
                                    <p className="text-sm text-emerald-300">Total Amount</p>
                                    <p className="text-2xl font-bold text-white">{detail.totals.totalAmount.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Sale History Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                                            <th className="p-3">Folio No</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Customer</th>
                                            <th className="p-3 text-right">Qty</th>
                                            <th className="p-3 text-right">Price</th>
                                            <th className="p-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {detail.saleHistory.map((sale) => (
                                            <tr key={sale.id} className="text-sm">
                                                <td className="p-3">
                                                    <span className="text-blue-300 font-mono">{sale.vno}</span>
                                                </td>
                                                <td className="p-3 text-gray-300">
                                                    {new Date(sale.date).toLocaleDateString()}
                                                </td>
                                                <td className="p-3 text-gray-300">{sale.customerName || '-'}</td>
                                                <td className="p-3 text-right text-gray-300">{sale.qty}</td>
                                                <td className="p-3 text-right text-gray-300">{sale.sellPrice.toLocaleString()}</td>
                                                <td className="p-3 text-right text-emerald-400 font-medium">{sale.amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-10">No data available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TopItemsReport: React.FC = () => {
  const navigate = useNavigate();
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('qty'); // qty or total
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
  const [itemsPerPage, setItemsPerPage] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Build query string for API (memoized)
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', itemsPerPage.toString());
    if (searchTerm) params.append('search', searchTerm);
    if (categoryFilter) params.append('categoryId', categoryFilter);
    if (supplierFilter) params.append('supplierId', supplierFilter);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    params.append('sortBy', sortBy);
    return params.toString();
  }, [currentPage, itemsPerPage, searchTerm, categoryFilter, supplierFilter, fromDate, toDate, sortBy]);

  // Fetch data with SWR
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.REPORT_TOP_ITEMS}?${queryString}`,
    fetcher,
    SWR_CONFIG
  );

  // Fetch dropdowns
  const { data: dropdownsData } = useSWR(
    API_ENDPOINTS.REPORT_TOP_ITEMS_DROPDOWNS,
    fetcher,
    { ...SWR_CONFIG, revalidateOnFocus: false }
  );

  const categories: DropdownOption[] = dropdownsData?.data?.categories || [];
  const suppliers: DropdownOption[] = dropdownsData?.data?.suppliers || [];

  // Build detail query string
  const buildDetailQueryString = useCallback(() => {
    if (!selectedItemId) return null;
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const queryString = params.toString();
    return `${API_ENDPOINTS.REPORT_TOP_ITEMS_DETAIL(selectedItemId)}${queryString ? '?' + queryString : ''}`;
  }, [selectedItemId, fromDate, toDate]);

  // SWR for item detail (only fetch when modal is open and item is selected)
  const { data: detailDataResponse, error: detailError, isLoading: detailLoading, mutate: mutateDetail } = useSWR<{success: boolean, data: ItemDetail}>(
    detailModalOpen && selectedItemId ? buildDetailQueryString() : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const items: TopItem[] = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };
  const totals = data?.totals || { grandTotalQty: 0, grandTotalAmount: 0 };
  const detailData = detailDataResponse?.data || null;

  // Debug: Log data changes
  useEffect(() => {
    if (error) {
      console.error('TopItemsReport error:', error);
    }
    if (data) {
      console.log('TopItemsReport data:', data);
    }
  }, [data, error]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    mutate();
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSupplierFilter('');
    setFromDate('');
    setToDate('');
    setSortBy('qty');
    setCurrentPage(1);
  };

  // Handle view detail
  const handleViewDetail = (item: TopItem) => {
    setSelectedItemId(item.id);
    setDetailModalOpen(true);
  };

  // Pagination
  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= pagination.totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const total = pagination.totalPages;
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', total);
      } else if (currentPage >= total - 2) {
        pages.push(1, '...', total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', total);
      }
    }
    return pages;
  };

  const exportToExcel = () => {
    if (items.length === 0) return;

    const title = `Top Selling Items (${fromDate || 'All'} to ${toDate || 'Today'})`;
    const headers = ["No", "CodeNo", "Item Name", "Category", "Supplier", "Qty", "Total"];
    
    const excelData = items.map((item, index) => [
      index + 1,
      item.code,
      item.name,
      item.categoryName || '-',
      item.supplierName || '-',
      item.totalQty,
      item.totalAmount
    ]);

    // Add totals row
    excelData.push(['', '', '', '', 'TOTAL:', totals.grandTotalQty, totals.grandTotalAmount]);

    const timestamp = new Date().toISOString().split('T')[0];
    exportStyledExcel(title, headers, excelData, `top_items_report_${timestamp}.xlsx`, 'Top Items');
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-700 sticky top-0 z-40 shrink-0 h-16">
        <button 
            onClick={() => navigate('/reports')}
            className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
        >
            <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
            <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500">
                <TrendingUp size={20} />
            </div>
            <h1 className="text-xl font-bold font-myanmar">Top Items Report</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          {/* Left Panel - Filters */}
          <aside className="w-full lg:w-80 bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto shrink-0 z-30 shadow-xl max-h-[40vh] lg:max-h-full">
              <div className="flex items-center gap-2 text-blue-400 border-b border-gray-700 pb-2 sticky top-0 bg-gray-800 z-10">
                  <Filter size={20} />
                  <h2 className="font-bold text-lg">Search & Filters</h2>
              </div>

              <div className="space-y-4">
                  {/* Search */}
                  <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">Search Item</label>
                      <input 
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Item name or code..."
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                  </div>

                  {/* Category Dropdown */}
                  <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">Category</label>
                      <SearchableDropdown 
                          options={categories}
                          value={categoryFilter}
                          onChange={setCategoryFilter}
                          placeholder="Select Category"
                          allLabel="All Categories"
                      />
                  </div>

                  {/* Supplier Dropdown */}
                  <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">Supplier</label>
                      <SearchableDropdown 
                          options={suppliers}
                          value={supplierFilter}
                          onChange={setSupplierFilter}
                          placeholder="Select Supplier"
                          allLabel="All Suppliers"
                      />
                  </div>

                  {/* From Date */}
                  <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">From</label>
                      <input 
                          type="date" 
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                  </div>

                  {/* To Date */}
                  <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">To</label>
                      <input 
                          type="date" 
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                  </div>

                  {/* Sort By */}
                  <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">Sort By</label>
                      <select 
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                          <option value="qty">Highest Quantity</option>
                          <option value="total">Highest Amount</option>
                      </select>
                  </div>

                  {/* Buttons */}
                  <div className="pt-2 space-y-2">
                    <button 
                        onClick={handleSearch}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
                    >
                        <Search size={16} /> Search
                    </button>
                    <button 
                        onClick={handleResetFilters}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} /> Reset Filters
                    </button>
                    <button 
                        onClick={exportToExcel}
                        disabled={items.length === 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                    >
                        <Download size={16} /> Excel
                    </button>
                  </div>
              </div>
          </aside>

          {/* Right Panel - Table */}
          <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative">
              
              {/* Top Bar */}
              <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900 z-20 sticky top-0">
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Show</span>
                          <select 
                              value={itemsPerPage}
                              onChange={(e) => {
                                  setItemsPerPage(Number(e.target.value));
                                  setCurrentPage(1);
                              }}
                              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
                          >
                              {PAGINATION_CONFIG.LIMIT_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                              ))}
                          </select>
                      </div>
                      <button 
                          onClick={() => mutate()}
                          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                          title="Refresh"
                      >
                          <RefreshCw size={16} className="text-gray-400" />
                      </button>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                      Total: <span className="text-white font-medium">{pagination.total}</span> items
                  </div>
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 size={40} className="animate-spin text-blue-500" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-red-400">
                        <p className="mb-2">Failed to load data. Please try again.</p>
                        <p className="text-xs text-gray-500">{error?.message || 'Unknown error'}</p>
                        <button 
                            onClick={() => mutate()} 
                            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm"
                        >
                            Retry
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-gray-400">
                        No items found.
                    </div>
                ) : (
                 <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden min-w-[900px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                <th className="p-4 w-16 text-center">No</th>
                                <th className="p-4 w-20">Image</th>
                                <th className="p-4 w-32">CodeNo</th>
                                <th className="p-4">Item Name</th>
                                <th className="p-4 w-32">Category</th>
                                <th className="p-4 text-right w-24">Qty</th>
                                <th className="p-4 text-right w-32">Total</th>
                                <th className="p-4 text-center w-20">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {items.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                    <td className="p-4 text-center text-gray-500 text-sm">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="p-4">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700">
                                            <img 
                                                src={item.image ? getImageUrl(item.image) : '/assets/icon.jpg'} 
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).src = '/assets/icon.jpg'; }}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-block bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-800 font-mono">
                                            {item.code}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-white">{item.name}</td>
                                    <td className="p-4 text-sm text-gray-400">{item.categoryName || '-'}</td>
                                    <td className="p-4 text-sm text-right">
                                        <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded font-medium">
                                            {item.totalQty}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-right font-medium text-emerald-400">
                                        {item.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => handleViewDetail(item)}
                                            className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-blue-400"
                                            title="View Detail"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {/* Total Row */}
                            <tr className="bg-gray-750 font-bold text-white border-t-2 border-gray-600">
                                <td colSpan={5} className="p-4 text-right text-gray-400 text-sm">GRAND TOTAL:</td>
                                <td className="p-4 text-right">
                                    <span className="bg-blue-600 text-white px-3 py-1 rounded font-bold">
                                        {totals.grandTotalQty}
                                    </span>
                                </td>
                                <td className="p-4 text-right text-emerald-400 text-lg">
                                    {totals.grandTotalAmount.toLocaleString()}
                                </td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                 </div>
                )}
                 
                 {/* Pagination */}
                 {items.length > 0 && (
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
                        <span className="text-sm text-gray-400">
                            Showing <span className="text-white font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-white font-medium">{Math.min(currentPage * itemsPerPage, pagination.total)}</span> of <span className="text-white font-medium">{pagination.total}</span>
                        </span>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 text-gray-300 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {getPageNumbers().map((number, idx) => (
                                    number === '...' ? (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                                    ) : (
                                        <button
                                            key={number}
                                            onClick={() => paginate(number as number)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                                ${currentPage === number 
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105' 
                                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                                                }
                                            `}
                                        >
                                            {number}
                                        </button>
                                    )
                                ))}
                            </div>

                            <button 
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === pagination.totalPages}
                                className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 text-gray-300 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
              </div>
          </main>
      </div>

      {/* Detail Modal */}
      <DetailModal 
          isOpen={detailModalOpen}
          onClose={() => {
              setDetailModalOpen(false);
              setSelectedItemId(null);
          }}
          detail={detailData}
          isLoading={detailLoading}
          error={detailError}
          onRefresh={() => mutateDetail()}
          fromDate={fromDate}
          toDate={toDate}
      />
    </div>
  );
};

export default TopItemsReport;
