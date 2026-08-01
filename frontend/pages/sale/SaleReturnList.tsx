
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Search, 
    Download, 
    ChevronLeft, 
    ChevronRight,
    Eye,
    Trash2,
    Filter,
    Check,
    ChevronDown,
    CornerUpLeft,
    FileCheck,
    X,
    Printer,
    AlertTriangle,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, SWR_CONFIG } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';
import Voucher from '../../components/Voucher';
import { sessionManager } from '../../config';

interface SaleItem {
  id: string;
  vno: string;
  customerId: string;
  customerName: string;
  totalQty: number;
  subTotal: number;
  discount: number;
  tax: number;
  total: number;
  userId: string;
  cashier: string;
  branchName?: string;
  cash: number;
  refund: number;
  date: string;
  paymentType: string;
}

interface VoucherDetail {
  voucher: {
    id: string;
    vno: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    totalQty: number;
    subTotal: number;
    discount: number;
    tax: number;
    total: number;
    cashier: string;
    cash: number;
    refund: number;
    date: string;
    paymentType: string;
    branchName?: string;
    branchInvoiceName?: string;
    branchAddress?: string;
    branchPhone?: string;
    branchLogo?: string;
    branchIncludeLogo?: number;
  };
  items: Array<{
    id: string;
    itemName: string;
    qty: number;
    sellPrice: number;
    amount: number;
    codeNo: string;
    imei?: string;
  }>;
}

interface DropdownOption {
  id: string;
  name: string;
}

// --- Shared: Searchable Dropdown ---
const SearchableDropdown: React.FC<{
    options: DropdownOption[];
    value: string; 
    onChange: (value: string) => void;
    placeholder: string;
}> = ({ options, value, onChange, placeholder }) => {
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
                    {value ? (selectedOption?.name || 'All Customers') : placeholder}
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
                            All Customers
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

const SaleReturnList: React.FC = () => {
  const navigate = useNavigate();
  const isAdmin = sessionManager.getUserType() === 'admin';
  
  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
      search: '',
      customerId: '',
      fromDate: '',
      toDate: '',
      branchId: '',
      brandId: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
  const [itemsPerPage, setItemsPerPage] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);

  // Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewVNO, setViewVNO] = useState<string | null>(null);
  
  // Delete Modal State
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', itemsPerPage.toString());
    if (appliedFilters.search) params.append('search', appliedFilters.search);
    if (appliedFilters.customerId) params.append('customerId', appliedFilters.customerId);
    if (appliedFilters.fromDate) params.append('fromDate', appliedFilters.fromDate);
    if (appliedFilters.toDate) params.append('toDate', appliedFilters.toDate);
    if (appliedFilters.brandId) params.append('brandId', appliedFilters.brandId);

    const userType = sessionManager.getUserType();
    const branchId = userType === 'admin' ? (appliedFilters.branchId || 'all') : (sessionManager.getBranchId() || 'all');
    if (branchId !== 'all') params.append('branchId', branchId);

    return params.toString();
  };

  // Fetch data with SWR
  const { data, error, isLoading, mutate } = useSWR(
    `${API_ENDPOINTS.SALE_LIST_RETURN}?${buildQueryString()}`,
    fetcher,
    SWR_CONFIG
  );

  // Fetch customers for dropdown
  const { data: customersData } = useSWR(
    API_ENDPOINTS.SALE_LIST_CUSTOMERS_DROPDOWN,
    fetcher,
    { ...SWR_CONFIG, revalidateOnFocus: false }
  );

  // SWR for branches (only admin)
  const { data: branchData } = useSWR<{ success: boolean; data: any[] }>(
    sessionManager.getUserType() === 'admin' ? API_ENDPOINTS.BRANCHES : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Fetch categories (brands)
  const { data: categoriesData } = useSWR(
    API_ENDPOINTS.CATEGORIES,
    fetcher,
    { ...SWR_CONFIG, revalidateOnFocus: false }
  );

  // SWR for voucher details (only fetch when modal is open and VNO is set)
  const { data: voucherData, error: voucherError, isLoading: detailLoading, mutate: mutateVoucher } = useSWR<{success: boolean, data: VoucherDetail}>(
    isViewModalOpen && viewVNO ? `${API_ENDPOINTS.SALE_LIST_VOUCHER(viewVNO)}?type=return` : null,
    fetcher,
    { ...SWR_CONFIG, revalidateOnFocus: false }
  );

  const customers: DropdownOption[] = customersData?.data || [];
  const sales: any[] = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };
  const totals = data?.totals || {};
  const branches: any[] = branchData?.data || [];
  const categories: any[] = categoriesData?.data || [];
  const voucherDetail = voucherData?.data || null;

  // Handle search
  const handleSearch = () => {
    setAppliedFilters({
        search: searchTerm,
        customerId: customerFilter,
        fromDate: fromDate,
        toDate: toDate,
        branchId: branchFilter,
        brandId: brandFilter
    });
    setCurrentPage(1);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setCustomerFilter('');
    setSearchTerm('');
    setBranchFilter('');
    setBrandFilter('');
    setAppliedFilters({
        search: '',
        customerId: '',
        fromDate: '',
        toDate: '',
        branchId: '',
        brandId: ''
    });
    setCurrentPage(1);
  };

  // Handle view
  const handleView = (vno: string) => {
    setViewVNO(vno);
    setIsViewModalOpen(true);
  };

  // Handle delete
  const promptDelete = (vno: string) => {
    setSaleToDelete(vno);
  };

  const confirmDelete = async () => {
    if (!saleToDelete) return;
    
    setDeleteLoading(true);
    try {
      const userId = sessionStorage.getItem('userId');
      const username = sessionStorage.getItem('username');
      const response = await apiClient.delete(API_ENDPOINTS.SALE_LIST_DELETE(saleToDelete), {
        userId,
        username
      });
      if (response.success) {
        mutate();
        setSaleToDelete(null);
      } else {
        alert(response.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete sale');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
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

  // Export
  const exportToExcel = () => {
    if (sales.length === 0) return;

    const title = `Sale Return List (${appliedFilters.fromDate || 'All'} to ${appliedFilters.toDate || 'Today'})`;
    const isAdmin = sessionManager.getUserType() === 'admin';
    const headers = isAdmin 
        ? ["Date", "Folio No", "Branch", "Customer", "SubTotal", "Disc", "Tax", "Total", "Cash", "Refund", "Cashier"]
        : ["Date", "Folio No", "Customer", "SubTotal", "Disc", "Tax", "Total", "Cash", "Refund", "Cashier"];
    
    const excelData = sales.map(item => {
        const row: any[] = [
            new Date(item.date).toLocaleDateString(),
            item.vno,
        ];
        
        if (isAdmin) row.push(item.branchName || '-');
        
        row.push(
            item.customerName || '-',
            item.subTotal,
            item.discount,
            item.tax,
            item.total,
            item.cash,
            item.refund,
            item.cashier || '-'
        );
        return row;
    });

    excelData.push([
      '', '', 
      ...(isAdmin ? [''] : []),
      'TOTAL:', 
      totals.totalSubTotal || 0, 
      totals.totalDiscount || 0, 
      totals.totalTax || 0, 
      totals.totalAmount || 0, 
      totals.totalCash || 0, 
      totals.totalRefund || 0, 
      ''
    ]);

    const timestamp = new Date().toISOString().split('T')[0];
    exportStyledExcel(title, headers, excelData, `sale_returns_${timestamp}.xlsx`, 'Sale Returns');
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between border-b border-gray-700 sticky top-0 z-40 shrink-0 h-16">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/sale')}
                className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            >
                <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
                <div className="bg-red-500/20 p-2 rounded-lg text-red-500">
                    <CornerUpLeft size={20} />
                </div>
                <h1 className="text-xl font-bold font-myanmar">Sale Return စာရင်း</h1>
            </div>
        </div>
        {!isAdmin && (
            <button
                onClick={() => navigate('/sale-return/new')}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
            >
                <CornerUpLeft size={18} /> New Sale Return
            </button>
        )}
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
                  {sessionManager.getUserType() === 'admin' && (
                      <div>
                          <label className="text-sm font-medium text-gray-400 block mb-1">Shop / Branch</label>
                          <select 
                              value={branchFilter}
                              onChange={(e) => setBranchFilter(e.target.value)}
                              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                          >
                              <option value="all">All Branches</option>
                              {branches.map((b: any) => (
                                  <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                          </select>
                      </div>
                  )}
                  <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">Search Folio No</label>
                      <input 
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Enter Folio No..."
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">From</label>
                      <input 
                          type="date" 
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">To</label>
                      <input 
                          type="date" 
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="text-sm font-medium text-gray-400 block mb-1">Customer</label>
                      <SearchableDropdown 
                          options={customers}
                          value={customerFilter}
                          onChange={setCustomerFilter}
                          placeholder="Select Customer"
                      />
                  </div>

                  {sessionManager.getUserType() === 'admin' && (
                      <div>
                          <label className="text-sm font-medium text-gray-400 block mb-1">Brand</label>
                          <select 
                              value={brandFilter}
                              onChange={(e) => setBrandFilter(e.target.value)}
                              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                          >
                              <option value="">All Brands</option>
                              {categories.map((c: any) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                          </select>
                      </div>
                  )}

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
                        disabled={sales.length === 0}
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
                      Total: <span className="text-white font-medium">{pagination.total}</span> records
                  </div>
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 size={40} className="animate-spin text-blue-500" />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-64 text-red-400">
                        Failed to load data. Please try again.
                    </div>
                ) : sales.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-gray-400">
                        No return sales found.
                    </div>
                ) : (
                 <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden min-w-[1000px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                <th className="p-4 w-16 text-center">စဉ်</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Folio No</th>
                                {sessionManager.getUserType() === 'admin' && <th className="p-4">Branch</th>}
                                <th className="p-4">Customer</th>
                                <th className="p-4 text-right">SubTotal</th>
                                <th className="p-4 text-right">Disc</th>
                                <th className="p-4 text-right">Tax</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-right">Cash</th>
                                <th className="p-4 text-right">Refund</th>
                                <th className="p-4">Cashier</th>
                                <th className="p-4 text-center w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {sales.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                    <td className="p-4 text-center text-gray-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="p-4 text-sm text-gray-300 whitespace-nowrap">
                                        <span className="bg-red-900/30 text-red-300 px-2 py-1 rounded text-xs border border-red-800">
                                            {new Date(item.date).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-blue-400 font-medium">{item.vno}</td>
                                    {sessionManager.getUserType() === 'admin' && (
                                        <td className="p-4 text-sm font-bold text-orange-300">
                                            {item.branchName || '-'}
                                        </td>
                                    )}
                                    <td className="p-4 text-sm font-medium text-white">{item.customerName || '-'}</td>
                                    <td className="p-4 text-sm text-right text-gray-300">{item.subTotal.toLocaleString()}</td>
                                    <td className="p-4 text-sm text-right text-gray-300">{item.discount}</td>
                                    <td className="p-4 text-sm text-right text-gray-300">{item.tax.toLocaleString()}</td>
                                    <td className="p-4 text-sm text-right font-bold text-white">{item.total.toLocaleString()}</td>
                                    <td className="p-4 text-sm text-right text-emerald-400">{item.cash.toLocaleString()}</td>
                                    <td className="p-4 text-sm text-right text-red-400">{item.refund.toLocaleString()}</td>
                                    <td className="p-4 text-sm text-gray-500">{item.cashier || '-'}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => handleView(item.vno)}
                                                className="p-1.5 bg-green-900/30 hover:bg-green-600 text-green-400 hover:text-white rounded transition-colors"
                                                title="View"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {sessionManager.getUserType() !== 'user' && (
                                                <button 
                                                    onClick={() => promptDelete(item.vno)}
                                                    className="p-1.5 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}

                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {/* Footer / Totals Row */}
                            <tr className="bg-gray-750 font-bold text-white border-t border-gray-700">
                                <td colSpan={sessionManager.getUserType() === 'admin' ? 5 : 4} className="p-4 text-right text-gray-400 text-sm">စုစုပေါင်း:</td>
                                <td className="p-4 text-right text-gray-300">{(totals.totalSubTotal || 0).toLocaleString()}</td>
                                <td className="p-4 text-right text-gray-300">{(totals.totalDiscount || 0).toLocaleString()}</td>
                                <td className="p-4 text-right text-gray-300">{(totals.totalTax || 0).toLocaleString()}</td>
                                <td className="p-4 text-right text-white">{(totals.totalAmount || 0).toLocaleString()}</td>
                                <td className="p-4 text-right text-emerald-400">{(totals.totalCash || 0).toLocaleString()}</td>
                                <td className="p-4 text-right text-red-400">{(totals.totalRefund || 0).toLocaleString()}</td>
                                <td colSpan={2}></td>
                            </tr>
                        </tbody>
                    </table>
                 </div>
                )}
                 
                 {/* Pagination */}
                 {sales.length > 0 && (
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

      {/* VOUCHER MODAL */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white text-gray-900 rounded-lg w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-4 bg-gray-100 border-b flex justify-between items-center print:hidden">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FileCheck size={18} /> Return Receipt
                    </h3>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => mutateVoucher()} 
                            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} />
                        </button>
                        <button onClick={() => { setIsViewModalOpen(false); setViewVNO(null); }} className="text-gray-500 hover:text-gray-800">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                
                {detailLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-blue-500" />
                    </div>
                ) : voucherError ? (
                    <div className="p-12 text-center">
                        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                            <p className="text-red-400">Failed to load voucher details</p>
                            <button 
                                onClick={() => mutateVoucher()} 
                                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : voucherDetail ? (
                    <>
                        <div className="overflow-y-auto flex-1 min-h-0">
                            <Voucher
                                voucher={{
                                    vno: voucherDetail.voucher.vno,
                                    customerName: voucherDetail.voucher.customerName || undefined,
                                    customerPhone: voucherDetail.voucher.customerPhone || undefined,
                                    customerAddress: voucherDetail.voucher.customerAddress || undefined,
                                    totalQty: voucherDetail.voucher.totalQty,
                                    subTotal: voucherDetail.voucher.subTotal,
                                    discount: voucherDetail.voucher.discount,
                                    tax: voucherDetail.voucher.tax,
                                    total: voucherDetail.voucher.total,
                                    cash: voucherDetail.voucher.cash,
                                    refund: voucherDetail.voucher.refund,
                                    cashier: voucherDetail.voucher.cashier || undefined,
                                    date: voucherDetail.voucher.date,
                                    paymentType: voucherDetail.voucher.paymentType || 'Return',
                                    branchName: voucherDetail.voucher.branchName,
                                    branchInvoiceName: voucherDetail.voucher.branchInvoiceName,
                                    branchAddress: voucherDetail.voucher.branchAddress,
                                    branchPhone: voucherDetail.voucher.branchPhone,
                                    branchLogo: voucherDetail.voucher.branchLogo,
                                    branchIncludeLogo: voucherDetail.voucher.branchIncludeLogo
                                }}
                                items={voucherDetail.items.map(item => ({
                                    itemName: item.itemName,
                                    qty: item.qty,
                                    sellPrice: item.sellPrice,
                                    amount: item.amount,
                                    codeNo: item.codeNo,
                                    imei: item.imei
                                }))}
                                showReturnLabel={true}
                            />
                        </div>

                        <div className="p-4 bg-gray-50 border-t flex gap-3 print:hidden">
                            <button 
                                onClick={() => { setIsViewModalOpen(false); setViewVNO(null); }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 text-sm font-medium"
                            >
                                Close
                            </button>
                            <button 
                                onClick={handlePrint}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Printer size={16} /> Print
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="p-6 text-center text-gray-500">No data available</div>
                )}
            </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {saleToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="text-red-500" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Delete Return?</h3>
                    <p className="text-gray-400 text-sm mb-2">
                        Folio No: <span className="text-white font-mono">{saleToDelete}</span>
                    </p>
                    <p className="text-gray-400 text-sm mb-6">
                        This will delete the return record and restore inventory quantities. This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setSaleToDelete(null)}
                            disabled={deleteLoading}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDelete}
                            disabled={deleteLoading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SaleReturnList;
