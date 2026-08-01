import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Search, 
    Download, 
    ChevronLeft, 
    ChevronRight,
    Printer,
    CornerUpLeft,
    Filter,
    X,
    FileCheck,
    Check,
    ChevronDown,
    Loader2,
    Eye,
    RefreshCw
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';
import Voucher from '../../components/Voucher';

// Interfaces
interface ReturnReportItem {
    id: string;
    vno: string;
    customerId: string | null;
    customerName: string | null;
    totalQty: number;
    subTotal: number;
    discount: number;
    tax: number;
    total: number;
    userId: string;
    cashier: string;
    cash: number;
    refund: number;
    credit: number;
    date: string;
    paymentType: string;
    imeis?: string;
    branchName?: string;
}

interface SaleItem {
    id: string;
    itemName: string;
    qty: number;
    sellPrice: number;
    date: string;
    vno: string;
    customerId: string | null;
    remainId: string;
    codeNo: string;
    imei?: string;
}

interface VoucherDetails {
    voucher: ReturnReportItem & {
        customerPhone?: string;
        customerAddress?: string;
        branchName?: string;
        branchInvoiceName?: string;
        branchAddress?: string;
        branchPhone?: string;
        branchLogo?: string;
        branchIncludeLogo?: number;
    };
    items: SaleItem[];
}

interface Customer {
    id: string;
    name: string;
    phone: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface ReturnReportResponse {
    success: boolean;
    data: ReturnReportItem[];
    totals: {
        totalAmount: number;
        totalCash: number;
        totalRefund: number;
        totalTax: number;
    };
    pagination: PaginationInfo;
    fromCache: boolean;
}

interface CustomersDropdownResponse {
    success: boolean;
    data: Customer[];
    fromCache: boolean;
}

// --- Shared: Searchable Dropdown ---
interface SearchableDropdownProps {
    options: { id: string, name: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(o => o.id === value);

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

    return (
        <div className="relative" ref={dropdownRef}>
            <div 
                className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 flex justify-between items-center cursor-pointer text-sm focus-within:ring-2 focus-within:ring-blue-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
                    {selectedOption?.name || placeholder}
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
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-600 hover:text-white flex justify-between items-center ${value === '' ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300'}`}
                            onClick={() => {
                                onChange('');
                                setIsOpen(false);
                                setSearch('');
                            }}
                        >
                            All Customers
                            {value === '' && <Check size={14} />}
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

const SaleReturnReport: React.FC = () => {
    const navigate = useNavigate();
    
    // Filters
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        fromDate: '',
        toDate: '',
        customerId: '',
        search: '',
        branchId: '',
        brandId: ''
    });
    
    // Pagination
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);
    
    // Modal
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printVNO, setPrintVNO] = useState<string | null>(null);

    // Build query string for SWR
    const buildQueryString = useCallback(() => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (appliedFilters.search) params.append('search', appliedFilters.search);
        if (appliedFilters.fromDate) params.append('fromDate', appliedFilters.fromDate);
        if (appliedFilters.toDate) params.append('toDate', appliedFilters.toDate);
        if (appliedFilters.customerId) params.append('customerId', appliedFilters.customerId);
        if (appliedFilters.brandId) params.append('brandId', appliedFilters.brandId);
        
        const userType = sessionManager.getUserType();
        const branchId = userType === 'admin' ? (appliedFilters.branchId || 'all') : (sessionManager.getBranchId() || 'all');
        if (branchId !== 'all') params.append('branchId', branchId);

        return `${API_ENDPOINTS.REPORT_RETURN}?${params.toString()}`;
    }, [page, limit, appliedFilters]);

    // SWR for return reports
    const { data, error, isLoading, mutate } = useSWR<ReturnReportResponse>(
        buildQueryString(),
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    // SWR for customers dropdown
    const { data: customersData } = useSWR<CustomersDropdownResponse>(
        API_ENDPOINTS.CUSTOMERS_DROPDOWN,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

    // SWR for categories (brands)
    const { data: categoriesData } = useSWR<{ success: boolean; data: any[] }>(
        API_ENDPOINTS.CATEGORIES,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

    // SWR for branches (only admin)
    const { data: branchData } = useSWR<{ success: boolean; data: any[] }>(
        sessionManager.getUserType() === 'admin' ? API_ENDPOINTS.BRANCHES : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

    // SWR for voucher details (only fetch when modal is open and VNO is set)
    const { data: voucherData, error: voucherError, isLoading: isLoadingVoucher, mutate: mutateVoucher } = useSWR<{success: boolean, data: VoucherDetails}>(
        isPrintModalOpen && printVNO ? `${API_ENDPOINTS.REPORT_RETURN_VOUCHER(printVNO)}?type=return` : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    const reports = data?.data || [];
    const totals = data?.totals;
    const pagination = data?.pagination;
    const customers = customersData?.data || [];
    const categories = categoriesData?.data || [];
    const branches = branchData?.data || [];
    const voucherDetails = voucherData?.data || null;

    // Apply filters
    const handleSearch = () => {
        setAppliedFilters({
            fromDate,
            toDate,
            customerId: customerFilter,
            search: searchTerm,
            branchId: branchFilter,
            brandId: brandFilter
        });
        setPage(1);
    };

    // Reset filters
    const handleReset = () => {
        setFromDate('');
        setToDate('');
        setCustomerFilter('');
        setSearchTerm('');
        setBranchFilter('');
        setBrandFilter('');
        setAppliedFilters({
            fromDate: '',
            toDate: '',
            customerId: '',
            search: '',
            branchId: '',
            brandId: ''
        });
        setPage(1);
        mutate();
    };

    // Export to Excel
    const exportToExcel = () => {
        const title = `Sale Return Report (${appliedFilters.fromDate || 'All'} to ${appliedFilters.toDate || 'Today'})`;
        const headers = ["Date", "Folio No", "Customer", "IMEI", "SubTotal", "Disc", "Tax", "Total", "Cash", "Refund", "Cashier"];
        
        const excelData = reports.map(item => [
            item.date ? new Date(item.date).toLocaleDateString() : '',
            item.vno,
            item.customerName || 'Walk-in',
            item.imeis || '',
            item.subTotal,
            item.discount,
            item.tax,
            item.total,
            item.cash,
            item.refund,
            item.cashier
        ]);

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `sale_return_report_${timestamp}.xlsx`, 'Sale Return Report');
    };

    // View/Print voucher
    const handleViewVoucher = (vno: string) => {
        setPrintVNO(vno);
        setIsPrintModalOpen(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between border-b border-gray-700 sticky top-0 z-40 shrink-0 h-16">
                <div className="flex items-center">
                <button 
                    onClick={() => navigate('/reports')}
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-red-500/20 p-2 rounded-lg text-red-500">
                        <CornerUpLeft size={20} />
                    </div>
                    <h1 className="text-xl font-bold">Sale Return Report</h1>
                </div>
                </div>
                <button
                    onClick={() => navigate('/sale-return/new')}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
                >
                    <CornerUpLeft size={18} /> New Sale Return
                </button>
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
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Enter Folio No..."
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
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
                                options={customers.map(c => ({ id: c.id, name: c.name }))}
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
                                onClick={handleReset}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} /> Reset
                            </button>
                            <button 
                                onClick={exportToExcel}
                                disabled={reports.length === 0}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
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
                                <span>Total: <span className="text-white font-medium">{pagination.total}</span> records</span>
                            )}
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-red-500" size={40} />
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                                <p className="text-red-400">Failed to load return reports.</p>
                                <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Retry</button>
                            </div>
                        </div>
                    )}

                    {/* Table Content */}
                    {!isLoading && !error && (
                        <div className="flex-1 overflow-auto p-4">
                            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden min-w-[1000px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                            <th className="p-4 w-16 text-center">No</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Folio No</th>
                                            {sessionManager.getUserType() === 'admin' && <th className="p-4">Branch</th>}
                                            <th className="p-4">Customer</th>
                                            <th className="p-4">IMEI</th>
                                            <th className="p-4 text-right">SubTotal</th>
                                            <th className="p-4 text-right">Disc</th>
                                            <th className="p-4 text-right">Tax</th>
                                            <th className="p-4 text-right">Total</th>
                                            <th className="p-4 text-right">Cash</th>
                                            <th className="p-4 text-right">Refund</th>
                                            <th className="p-4">Cashier</th>
                                            <th className="p-4 text-center w-24">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {reports.length > 0 ? (
                                            <>
                                                {reports.map((item, index) => (
                                                    <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                                        <td className="p-4 text-center text-gray-500">
                                                            {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                                                        </td>
                                                        <td className="p-4 text-sm text-gray-300 whitespace-nowrap">{formatDate(item.date)}</td>
                                                        <td className="p-4 font-mono text-xs text-blue-400 font-medium">{item.vno}</td>
                                                        {sessionManager.getUserType() === 'admin' && (
                                                            <td className="p-4 text-sm font-bold text-blue-300">
                                                                {item.branchName || '-'}
                                                            </td>
                                                        )}
                                                        <td className="p-4 text-sm font-medium text-white">{item.customerName || 'Walk-in'}</td>
                                                        <td className="p-4 text-xs text-gray-400 max-w-[150px] truncate" title={item.imeis}>{item.imeis || '-'}</td>
                                                        <td className="p-4 text-sm text-right text-gray-300">{item.subTotal.toLocaleString()}</td>
                                                        <td className="p-4 text-sm text-right text-gray-300">{item.discount}</td>
                                                        <td className="p-4 text-sm text-right text-gray-300">{item.tax.toLocaleString()}</td>
                                                        <td className="p-4 text-sm text-right font-bold text-white">{item.total.toLocaleString()}</td>
                                                        <td className="p-4 text-sm text-right text-emerald-400">{item.cash.toLocaleString()}</td>
                                                        <td className="p-4 text-sm text-right text-red-400">{item.refund.toLocaleString()}</td>
                                                        <td className="p-4 text-sm text-gray-500">{item.cashier}</td>
                                                        <td className="p-4 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button 
                                                                    onClick={() => handleViewVoucher(item.vno)}
                                                                    className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleViewVoucher(item.vno)}
                                                                    className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                                                                    title="Print Voucher"
                                                                >
                                                                    <Printer size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {/* Footer / Totals Row */}
                                                {totals && (
                                                    <tr className="bg-gray-750 font-bold text-white border-t-2 border-gray-600">
                                                        <td colSpan={sessionManager.getUserType() === 'admin' ? 6 : 5} className="p-4 text-right text-gray-400 text-sm">TOTAL:</td>
                                                        <td className="p-4 text-right"></td>
                                                        <td className="p-4 text-right"></td>
                                                        <td className="p-4 text-right text-yellow-400">{totals.totalTax.toLocaleString()}</td>
                                                        <td className="p-4 text-right text-emerald-400">{totals.totalAmount.toLocaleString()}</td>
                                                        <td className="p-4 text-right text-blue-400">{totals.totalCash.toLocaleString()}</td>
                                                        <td className="p-4 text-right text-red-400">{totals.totalRefund.toLocaleString()}</td>
                                                        <td colSpan={2}></td>
                                                    </tr>
                                                )}
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={12} className="p-8 text-center text-gray-500">
                                                    No return records found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination */}
                            {pagination && pagination.total > 0 && (
                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
                                    <span className="text-sm text-gray-400">
                                        Page <span className="text-white font-medium">{pagination.page}</span> of <span className="text-white font-medium">{pagination.totalPages}</span>
                                    </span>
                                    
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setPage(page - 1)}
                                            disabled={!pagination.hasPrev}
                                            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors"
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
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                                                            page === pageNum 
                                                                ? 'bg-red-600 text-white shadow-lg' 
                                                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
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
                                            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors"
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

            {/* VOUCHER MODAL */}
            {isPrintModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white text-gray-900 rounded-lg w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-4 bg-red-100 border-b flex justify-between items-center print:hidden">
                            <h3 className="font-bold text-red-800 flex items-center gap-2">
                                <FileCheck size={18} /> Return Receipt
                            </h3>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => mutateVoucher()} 
                                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-red-200 rounded transition-colors"
                                    title="Refresh"
                                >
                                    <RefreshCw size={18} />
                                </button>
                                <button onClick={() => { setIsPrintModalOpen(false); setPrintVNO(null); }} className="text-gray-500 hover:text-gray-800">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        
                        {isLoadingVoucher ? (
                            <div className="p-12 flex items-center justify-center">
                                <Loader2 className="animate-spin text-red-600" size={40} />
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
                        ) : voucherDetails ? (
                            <>
                                <div className="overflow-y-auto flex-1 min-h-0">
                                    <Voucher
                                        voucher={{
                                            vno: voucherDetails.voucher.vno,
                                            customerName: voucherDetails.voucher.customerName || undefined,
                                            customerPhone: voucherDetails.voucher.customerPhone || undefined,
                                            customerAddress: voucherDetails.voucher.customerAddress || undefined,
                                            totalQty: voucherDetails.voucher.totalQty,
                                            subTotal: voucherDetails.voucher.subTotal,
                                            discount: voucherDetails.voucher.discount,
                                            tax: voucherDetails.voucher.tax,
                                            total: voucherDetails.voucher.total,
                                            cash: voucherDetails.voucher.cash,
                                            refund: voucherDetails.voucher.refund,
                                            cashier: voucherDetails.voucher.cashier || undefined,
                                            date: voucherDetails.voucher.date,
                                            paymentType: voucherDetails.voucher.paymentType || 'Return',
                                            branchName: voucherDetails.voucher.branchName,
                                            branchInvoiceName: voucherDetails.voucher.branchInvoiceName,
                                            branchAddress: voucherDetails.voucher.branchAddress,
                                            branchPhone: voucherDetails.voucher.branchPhone,
                                            branchLogo: voucherDetails.voucher.branchLogo,
                                            branchIncludeLogo: voucherDetails.voucher.branchIncludeLogo
                                        }}
                                        items={voucherDetails.items.map(item => ({
                                            itemName: item.itemName,
                                            qty: item.qty,
                                            sellPrice: item.sellPrice,
                                            amount: item.qty * item.sellPrice,
                                            codeNo: item.codeNo,
                                            imei: item.imei
                                        }))}
                                        showReturnLabel={true}
                                    />
                                </div>

                                <div className="p-4 bg-gray-50 border-t flex gap-3 print:hidden">
                                    <button 
                                        onClick={() => { setIsPrintModalOpen(false); setPrintVNO(null); }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 text-sm font-medium"
                                    >
                                        Close
                                    </button>
                                    <button 
                                        onClick={handlePrint}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Printer size={16} /> Print
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="p-12 text-center text-gray-500">
                                Failed to load voucher details
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SaleReturnReport;
