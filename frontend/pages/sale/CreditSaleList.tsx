
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    CreditCard,
    FileCheck,
    X,
    Printer,
    AlertTriangle,
    RefreshCw,
    Loader2,
    DollarSign,
    Calendar,
    Receipt,
    Users
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, SWR_CONFIG, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';
import Voucher from '../../components/Voucher';

interface SaleItem {
    id: string;
    vno: string;
    customerId: string;
    customerName: string;
    totalQty: number;
    subTotal: number;
    discount: number;
    tax: number;
    otherAmt: number;
    total: number;
    userId: string;
    cashier: string;
    branchName?: string;
    cash: number;
    refund: number;
    returnCount: number;
    credit: number;
    date: string;
    paymentType: string;
    purchasePrice?: number;
    profit?: number;
}

interface VoucherDetail {
    voucher: {
        id: string;
        vno: string;
        customerId: string;
        customerName: string;
        customerPhone: string;
        customerAddress: string;
        totalQty: number;
        subTotal: number;
        discount: number;
        tax: number;
        otherAmt: number;
        total: number;
        cashier: string;
        cash: number;
        refund: number;
        credit: number;
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
                <ChevronDown size={16} className="text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800">
                        <div className="flex items-center bg-gray-700 rounded px-2">
                            <Search size={14} className="text-gray-400 mr-2" />
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

// --- Interfaces for Customer Pay View ---
interface CustomerPaymentSummary {
    vno: string;
    customerId: string;
    customerName: string;
    totalPaid: number;
    paymentCount: number;
    lastPaymentDate: string;
    firstPaymentDate: string;
    voucherTotal: number;
    remainingCredit: number;
    branchName?: string;
}

interface CustomerPaymentDetail {
    id: string;
    vno: string;
    customerId: string;
    amount: number;
    date: string;
    userId: string;
    userName: string;
    paymentMethod?: string;
}

interface PaymentDetailsData {
    voucher: {
        vno: string;
        customerId: string;
        customerName: string;
        customerPhone: string;
        voucherTotal: number;
        remainingCredit: number;
        voucherDate: string;
    } | null;
    payments: CustomerPaymentDetail[];
    totalPaid: number;
}

interface CustomerPaymentsResponse {
    success: boolean;
    data: CustomerPaymentSummary[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    totals: {
        grandTotalPaid: number;
    };
    fromCache: boolean;
}

// --- Tab 1: Credit Sale List ---
const CreditSaleListTab: React.FC = () => {
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

    // Pay Credit Modal State
    const [payCreditModal, setPayCreditModal] = useState<{ vno: string; customerId: string; credit: number } | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState<'Cash' | 'KPay' | 'WavePay'>('Cash');
    const [payLoading, setPayLoading] = useState(false);

    // Refs
    const payAmountInputRef = useRef<HTMLInputElement>(null);

    // Toast Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

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
        `${API_ENDPOINTS.SALE_LIST_CREDIT}?${buildQueryString()}`,
        fetcher,
        SWR_CONFIG
    );

    // SWR for customers dropdown
    const { data: customersData } = useSWR(
        API_ENDPOINTS.SALE_LIST_CUSTOMERS_DROPDOWN,
        fetcher,
        { ...SWR_CONFIG, revalidateOnFocus: false }
    );

    // Fetch categories (brands)
    const { data: categoriesData } = useSWR(
        API_ENDPOINTS.CATEGORIES,
        fetcher,
        { ...SWR_CONFIG, revalidateOnFocus: false }
    );

    // SWR for branches (only admin)
    const { data: branchData } = useSWR<{ success: boolean; data: any[] }>(
        sessionManager.getUserType() === 'admin' ? API_ENDPOINTS.BRANCHES : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

    // SWR for voucher details (only fetch when modal is open and VNO is set)
    const { data: voucherData, error: voucherError, isLoading: detailLoading, mutate: mutateVoucher } = useSWR<{ success: boolean, data: VoucherDetail }>(
        isViewModalOpen && viewVNO ? API_ENDPOINTS.SALE_LIST_VOUCHER(viewVNO) : null,
        fetcher,
        { ...SWR_CONFIG, revalidateOnFocus: false }
    );

    const customers: DropdownOption[] = customersData?.data || [];
    const sales: SaleItem[] = data?.data || [];
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
                setNotification({ message: 'Sale deleted successfully', type: 'success' });
            } else {
                setNotification({ message: response.message || 'Failed to delete', type: 'error' });
            }
        } catch (err) {
            console.error('Delete error:', err);
            setNotification({ message: 'Failed to delete sale', type: 'error' });
        } finally {
            setDeleteLoading(false);
        }
    };

    // Handle pay credit
    const openPayCreditModal = (sale: SaleItem) => {
        setPayCreditModal({ vno: sale.vno, customerId: sale.customerId, credit: sale.credit });
        setPayAmount('');
        setPayMethod('Cash');
        // Auto-focus input
        setTimeout(() => {
            if (payAmountInputRef.current) {
                payAmountInputRef.current.focus();
            }
        }, 100);
    };

    const handlePayCredit = async () => {
        if (!payCreditModal || !payAmount) return;

        const amount = parseFloat(payAmount);
        if (isNaN(amount) || amount <= 0) {
            setNotification({ message: 'Please enter a valid amount', type: 'info' });
            return;
        }

        if (amount > payCreditModal.credit) {
            setNotification({ message: 'Payment amount cannot exceed credit balance', type: 'info' });
            return;
        }

        setPayLoading(true);
        try {
            const userId = sessionStorage.getItem('userId');
            const username = sessionStorage.getItem('username');
            const response = await apiClient.post(API_ENDPOINTS.SALE_LIST_CREDIT_PAY, {
                vno: payCreditModal.vno,
                customerId: payCreditModal.customerId,
                amount: amount,
                userId: userId,
                username,
                paymentMethod: payMethod
            });

            if (response.success) {
                mutate();
                setPayCreditModal(null);
                setPayAmount('');
                setNotification({ message: 'Credit payment recorded successfully', type: 'success' });
            } else {
                setNotification({ message: response.message || 'Failed to process payment', type: 'error' });
            }
        } catch (err) {
            console.error('Pay credit error:', err);
            setNotification({ message: 'Failed to process payment', type: 'error' });
        } finally {
            setPayLoading(false);
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

        const title = `Credit Sale List (${appliedFilters.fromDate || 'All'} to ${appliedFilters.toDate || 'Today'})`;
        const isAdmin = sessionManager.getUserType() === 'admin';
        const headers = isAdmin 
            ? ["Date", "Folio No", "Branch", "Customer", "SubTotal", "Disc", "Tax", "Other", "Total", "Purchase Price", "Profit", "Cash", "Credit", "Cashier"]
            : ["Date", "Folio No", "Customer", "SubTotal", "Disc", "Tax", "Other", "Total", "Purchase Price", "Profit", "Cash", "Credit", "Cashier"];
        
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
                item.otherAmt || 0,
                item.total,
                item.purchasePrice || 0,
                item.profit || 0,
                item.cash,
                item.credit,
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
            totals.totalOther || 0,
            totals.totalAmount || 0, 
            totals.totalPurchasePrice || 0,
            totals.totalProfit || 0,
            totals.totalCash || 0, 
            totals.totalCredit || 0, 
            ''
        ]);

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `credit_sales_${timestamp}.xlsx`, 'Credit Sales');
    };

    return (
        <>
            {/* Toast Notification */}
            {notification && (
                <div className={`fixed top-20 right-4 z-[200] px-6 py-3 rounded-lg shadow-lg text-white font-medium flex items-center animate-bounce ${notification.type === 'success' ? 'bg-green-600' :
                    notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                    {notification.type === 'success' ? <Check size={20} className="mr-2" /> :
                        notification.type === 'error' ? <AlertTriangle size={20} className="mr-2" /> :
                            <AlertTriangle size={20} className="mr-2" />}
                    {notification.message}
                </div>
            )}

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
                                No credit sales found.
                            </div>
                        ) : (
                            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden min-w-[1300px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                            <th className="p-4 w-16 text-center whitespace-nowrap">စဉ်</th>
                                            <th className="p-4 whitespace-nowrap">Date</th>
                                            <th className="p-4 whitespace-nowrap">Folio No</th>
                                            {sessionManager.getUserType() === 'admin' && <th className="p-4 whitespace-nowrap">Branch</th>}
                                            <th className="p-4 whitespace-nowrap">Customer</th>
                                            <th className="p-4 text-right whitespace-nowrap">SubTotal</th>
                                            <th className="p-4 text-right whitespace-nowrap">Disc</th>
                                            <th className="p-4 text-right whitespace-nowrap">Tax</th>
                                            <th className="p-4 text-right whitespace-nowrap">Other</th>
                                            <th className="p-4 text-right whitespace-nowrap">Total</th>
                                            <th className="p-4 text-right whitespace-nowrap">Purchase Price</th>
                                            <th className="p-4 text-right whitespace-nowrap">Profit</th>
                                            <th className="p-4 text-right whitespace-nowrap">Credit</th>
                                            <th className="p-4 whitespace-nowrap">Cashier</th>
                                            <th className="p-4 text-center min-w-[140px] whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {sales.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                                <td className="p-4 text-center text-gray-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                <td className="p-4 text-sm text-gray-300 whitespace-nowrap">
                                                    <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs border border-blue-800">
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-blue-400 font-medium">
                                                    {item.vno}
                                                    {item.returnCount > 0 && (
                                                        <span className="ml-2 px-1.5 py-0.5 bg-red-900/30 text-red-400 text-[10px] font-bold rounded border border-red-800 animate-pulse">
                                                            RETURNED
                                                        </span>
                                                    )}
                                                </td>
                                                {sessionManager.getUserType() === 'admin' && (
                                                    <td className="p-4 text-sm font-bold text-blue-300">
                                                        {item.branchName || '-'}
                                                    </td>
                                                )}
                                                <td className="p-4 text-sm font-medium text-white">{item.customerName || '-'}</td>
                                                <td className="p-4 text-sm text-right text-gray-300">{item.subTotal.toLocaleString()}</td>
                                                <td className="p-4 text-sm text-right text-gray-300">{item.discount}</td>
                                                <td className="p-4 text-sm text-right text-gray-300">{item.tax.toLocaleString()}</td>
                                                <td className="p-4 text-sm text-right text-gray-300">{(item.otherAmt || 0).toLocaleString()}</td>
                                                <td className="p-4 text-sm text-right font-bold text-white">{item.total.toLocaleString()}</td>
                                                <td className="p-4 text-sm text-right text-gray-350">{(item.purchasePrice || 0).toLocaleString()}</td>
                                                <td className={`p-4 text-sm text-right font-bold ${(item.profit || 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                                    {(item.profit || 0).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-sm text-right text-orange-400 font-bold">{item.credit.toLocaleString()}</td>
                                                <td className="p-4 text-sm text-gray-500">{item.cashier || '-'}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleView(item.vno)}
                                                            className="p-1.5 bg-green-900/30 hover:bg-green-600 text-green-400 hover:text-white rounded transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openPayCreditModal(item)}
                                                            className="p-1.5 bg-yellow-900/30 hover:bg-yellow-600 text-yellow-400 hover:text-white rounded transition-colors"
                                                            title="Pay Credit"
                                                        >
                                                            <DollarSign size={16} />
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
                                            <td className="p-4 text-right text-gray-300">{(totals.totalOther || 0).toLocaleString()}</td>
                                            <td className="p-4 text-right text-white">{(totals.totalAmount || 0).toLocaleString()}</td>
                                            <td className="p-4 text-right text-gray-350">{(totals.totalPurchasePrice || 0).toLocaleString()}</td>
                                            <td className="p-4 text-right text-blue-400">{(totals.totalProfit || 0).toLocaleString()}</td>
                                            <td className="p-4 text-right text-orange-400">{(totals.totalCredit || 0).toLocaleString()}</td>
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
                                <FileCheck size={18} /> Receipt Details
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
                                            otherAmt: voucherDetail.voucher.otherAmt,
                                            total: voucherDetail.voucher.total,
                                            cash: voucherDetail.voucher.cash,
                                            credit: voucherDetail.voucher.credit,
                                            refund: voucherDetail.voucher.refund,
                                            cashier: voucherDetail.voucher.cashier || undefined,
                                            date: voucherDetail.voucher.date,
                                            paymentType: voucherDetail.voucher.paymentType || 'Credit',
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

            {/* PAY CREDIT MODAL */}
            {payCreditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <DollarSign size={20} className="text-yellow-400" /> Pay Credit
                            </h3>
                            <button onClick={() => setPayCreditModal(null)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 text-center">
                                <p className="text-sm text-gray-400">Folio No</p>
                                <p className="text-lg font-mono text-blue-400">{payCreditModal.vno}</p>
                            </div>
                            <div className="mb-6 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-400">Total Credit</span>
                                    <span className="text-lg font-bold text-orange-400">{payCreditModal.credit.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-400">Pay Amount</span>
                                    <span className="text-lg font-bold text-white">{payAmount ? Number(payAmount).toLocaleString() : '0'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                    <span className="text-sm text-gray-400">Remaining</span>
                                    <span className="text-lg font-bold text-red-400">
                                        {Math.max(0, payCreditModal.credit - (Number(payAmount) || 0)).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="text-sm font-medium text-gray-400 block mb-2">Payment Method</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Cash', 'KPay', 'WavePay'].map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => {
                                                setPayMethod(method as any);
                                                if (payAmountInputRef.current) {
                                                    payAmountInputRef.current.focus();
                                                }
                                            }}
                                            className={`py-2 rounded-lg text-sm font-medium transition-all ${payMethod === method
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-2 ring-blue-400'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="text-sm font-medium text-gray-400 block mb-2">Payment Amount</label>
                                <div className="relative">
                                    <input
                                        ref={payAmountInputRef}
                                        type="number"
                                        value={payAmount}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Prevent paying more than credit
                                            if (Number(val) <= payCreditModal.credit) {
                                                setPayAmount(val);
                                            }
                                        }}
                                        placeholder="Enter amount..."
                                        min="0"
                                        max={payCreditModal.credit}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-4 pr-12 py-3 text-lg text-white focus:ring-2 focus:ring-yellow-500 outline-none font-bold"
                                    />
                                    <span className="absolute right-4 top-4 text-xs text-gray-500 font-bold">MMK</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPayCreditModal(null)}
                                    disabled={payLoading}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePayCredit}
                                    disabled={payLoading || !payAmount}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-bold shadow-lg shadow-yellow-900/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {payLoading ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                                    Pay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {
                saleToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="text-red-500" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Delete Sale?</h3>
                                <p className="text-gray-400 text-sm mb-2">
                                    Folio No: <span className="text-white font-mono">{saleToDelete}</span>
                                </p>
                                <p className="text-gray-400 text-sm mb-6">
                                    This will delete the sale and restore inventory quantities. This action cannot be undone.
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
                )
            }
        </>
    );
};

// --- Tab 2: Customer Pay View ---
const CustomerPayViewTab: React.FC = () => {
    // Filter States
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [appliedFromDate, setAppliedFromDate] = useState('');
    const [appliedToDate, setAppliedToDate] = useState('');
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);

    // Modal States
    const [viewVNO, setViewVNO] = useState<string | null>(null);
    const [deletePaymentId, setDeletePaymentId] = useState<{ id: string; amount: number } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Build query string
    const buildQueryString = () => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (searchTerm) params.append('search', searchTerm);
        if (appliedFromDate) params.append('fromDate', appliedFromDate);
        if (appliedToDate) params.append('toDate', appliedToDate);
        return params.toString();
    };

    // SWR for customer payments list
    const { data, error, isLoading, mutate } = useSWR<CustomerPaymentsResponse>(
        `${API_ENDPOINTS.CUSTOMER_PAYMENTS}?${buildQueryString()}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    // SWR for payment details when VNO is selected
    const { data: detailsData, error: detailsError, isLoading: detailsLoading, mutate: mutateDetails } = useSWR<{
        success: boolean;
        data: PaymentDetailsData;
        fromCache: boolean;
    }>(
        viewVNO ? API_ENDPOINTS.CUSTOMER_PAYMENTS_DETAIL(viewVNO) : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const payments = data?.data || [];
    const pagination = data?.pagination;
    const totals = data?.totals;

    const handleSearch = useCallback(() => {
        setSearchTerm(searchInput);
        setAppliedFromDate(fromDate);
        setAppliedToDate(toDate);
        setPage(1);
    }, [searchInput, fromDate, toDate]);

    const resetFilters = () => {
        setSearchInput('');
        setSearchTerm('');
        setFromDate('');
        setToDate('');
        setAppliedFromDate('');
        setAppliedToDate('');
        setPage(1);
    };

    // Export
    const exportToExcel = () => {
        const escapeCSV = (value: any): string => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const headers = ["Folio No", "Customer", "Voucher Total", "Total Paid", "Remaining", "Payment Count", "Last Payment"];
        const rows = [
            headers.map(escapeCSV).join(','),
            ...payments.map(p => [
                escapeCSV(p.vno),
                escapeCSV(p.customerName),
                escapeCSV(p.voucherTotal),
                escapeCSV(p.totalPaid),
                escapeCSV(p.remainingCredit),
                escapeCSV(p.paymentCount),
                escapeCSV(p.lastPaymentDate ? new Date(p.lastPaymentDate).toLocaleDateString() : '')
            ].join(','))
        ];

        const csvContent = rows.join("\r\n");
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `customer_payments_${timestamp}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Delete payment handler
    const handleDeletePayment = async () => {
        if (!deletePaymentId) return;
        setIsDeleting(true);
        try {
            const result = await apiClient.delete(API_ENDPOINTS.CUSTOMER_PAYMENTS_DELETE(deletePaymentId.id));
            if (result.success) {
                mutate();
                mutateDetails();
                setDeletePaymentId(null);
            } else {
                alert(result.message || 'Failed to delete payment');
            }
        } catch (error) {
            console.error('Delete payment error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Left Panel: Filters */}
            <aside className="w-full lg:w-80 bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto shrink-0 z-30 shadow-xl max-h-[35vh] lg:max-h-full">
                <div className="flex items-center gap-2 text-indigo-400 border-b border-gray-700 pb-2 sticky top-0 bg-gray-800 z-10">
                    <Filter size={20} />
                    <h2 className="font-bold text-lg">Search & Filters</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Search (Folio No / Customer)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">From Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-500" size={18} />
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">To Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-500" size={18} />
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleSearch}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium transition-colors"
                    >
                        <Search size={16} className="inline mr-2" />
                        Search
                    </button>
                    <button
                        onClick={resetFilters}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2.5 rounded-lg font-medium transition-colors border border-gray-600"
                    >
                        Reset Filters
                    </button>

                    {/* Totals Summary */}
                    {totals && (
                        <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                            <p className="text-xs text-gray-500 mb-2">Summary</p>
                            <div className="flex justify-between">
                                <span className="text-gray-400 text-sm">Total Paid:</span>
                                <span className="text-emerald-400 font-bold">{totals.grandTotalPaid.toLocaleString()} MMK</span>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Right Panel: Table */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-900 relative">
                <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900 z-20 shrink-0">
                    <h3 className="text-lg font-semibold text-gray-200">
                        Payment History (by Folio No)
                        <span className="text-sm font-normal text-gray-500 ml-2">
                            ({pagination?.total || 0} records)
                        </span>
                    </h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Rows:</span>
                            <select
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
                            >
                                {PAGINATION_CONFIG.LIMIT_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => mutate()}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={exportToExcel}
                            disabled={payments.length === 0}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors shadow-sm"
                        >
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-500" size={40} />
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                            <p className="text-red-400">Failed to load payment data.</p>
                            <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Retry</button>
                        </div>
                    </div>
                )}

                {/* Table */}
                {!isLoading && !error && (
                    <div className="flex-1 overflow-auto p-4">
                        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden min-w-[700px]">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold border-b border-gray-700">
                                        <th className="p-4 w-16 text-center">No</th>
                                        <th className="p-4">Folio No</th>
                                        {sessionManager.getUserType() === 'admin' && <th className="p-4">Branch</th>}
                                        <th className="p-4">Customer Name</th>
                                        <th className="p-4 text-right">Voucher Total</th>
                                        <th className="p-4 text-right">Total Paid</th>
                                        <th className="p-4 text-right">Remaining</th>
                                        <th className="p-4 text-center">Payments</th>
                                        <th className="p-4">Last Payment</th>
                                        <th className="p-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {payments.length > 0 ? (
                                        payments.map((p, i) => (
                                            <tr key={p.vno} className="hover:bg-gray-750 transition-colors">
                                                <td className="p-4 text-center text-gray-500">
                                                    {pagination ? (pagination.page - 1) * pagination.limit + i + 1 : i + 1}
                                                </td>
                                                <td className="p-4 font-mono text-sm text-indigo-300">{p.vno}</td>
                                                {sessionManager.getUserType() === 'admin' && (
                                                    <td className="p-4 text-sm font-bold text-indigo-400">
                                                        {p.branchName || '-'}
                                                    </td>
                                                )}
                                                <td className="p-4 text-white font-medium">{p.customerName || 'N/A'}</td>
                                                <td className="p-4 text-right text-gray-300">{Number(p.voucherTotal).toLocaleString()}</td>
                                                <td className="p-4 text-right text-emerald-400 font-bold">{Number(p.totalPaid).toLocaleString()}</td>
                                                <td className="p-4 text-right text-red-400">{Number(p.remainingCredit).toLocaleString()}</td>
                                                <td className="p-4 text-center">
                                                    <span className="px-2 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-xs font-bold">
                                                        {p.paymentCount}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-300 whitespace-nowrap">{formatDate(p.lastPaymentDate)}</td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => setViewVNO(p.vno)}
                                                        className="p-2 text-indigo-400 hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={sessionManager.getUserType() === 'admin' ? 10 : 9} className="p-8 text-center text-gray-500">No payment records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.total > 0 && (
                            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <span className="text-sm text-gray-400">
                                    Page <span className="text-white font-medium">{pagination.page}</span> of <span className="text-white font-medium">{pagination.totalPages}</span>
                                    <span className="ml-2">({pagination.total} total)</span>
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(page - 1)}
                                        disabled={!pagination.hasPrev}
                                        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => setPage(page + 1)}
                                        disabled={!pagination.hasNext}
                                        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* View Payment Details Modal */}
            {viewVNO && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl shrink-0">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Receipt className="text-indigo-500" /> Payment Details - {viewVNO}
                            </h2>
                            <button onClick={() => setViewVNO(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {detailsLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                                </div>
                            ) : detailsError ? (
                                <div className="text-center py-10 text-red-400">Failed to load details</div>
                            ) : detailsData?.data ? (
                                <div className="space-y-6">
                                    {/* Voucher Info */}
                                    {detailsData.data.voucher && (
                                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                                            <h3 className="text-sm font-bold text-gray-400 mb-3">Voucher Information</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Customer</p>
                                                    <p className="text-white font-medium">{detailsData.data.voucher.customerName || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Phone</p>
                                                    <p className="text-white font-medium">{detailsData.data.voucher.customerPhone || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Voucher Date</p>
                                                    <p className="text-white font-medium">{formatDate(detailsData.data.voucher.voucherDate)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Voucher Total</p>
                                                    <p className="text-white font-bold">{Number(detailsData.data.voucher.voucherTotal).toLocaleString()} MMK</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Total Paid</p>
                                                    <p className="text-emerald-400 font-bold">{detailsData.data.totalPaid.toLocaleString()} MMK</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Remaining</p>
                                                    <p className="text-red-400 font-bold">{Number(detailsData.data.voucher.remainingCredit).toLocaleString()} MMK</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment History */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-400 mb-3">Payment History ({detailsData.data.payments.length})</h3>
                                        {detailsData.data.payments.length > 0 ? (
                                            <div className="space-y-2">
                                                {detailsData.data.payments.map((payment, idx) => (
                                                    <div key={payment.id} className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-gray-500 text-sm w-8">{idx + 1}.</span>
                                                            <div>
                                                                <p className="text-white font-medium">{Number(payment.amount).toLocaleString()} MMK</p>
                                                                <div className="flex gap-2 text-xs text-gray-500">
                                                                    <span>{formatDate(payment.date)}</span>
                                                                    <span>•</span>
                                                                    <span>{payment.userName || 'Unknown'}</span>
                                                                    <span>•</span>
                                                                    <span className="font-medium text-blue-400">{payment.paymentMethod || 'Cash'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {sessionManager.getUserType() !== 'user' && (
                                                            <button
                                                                onClick={() => setDeletePaymentId({ id: payment.id, amount: payment.amount })}
                                                                className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                                                title="Delete Payment"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">No payment records</p>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="p-4 border-t border-gray-700 shrink-0">
                            <button
                                onClick={() => setViewVNO(null)}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Payment Confirmation Modal */}
            {deletePaymentId && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-900/50 text-red-400">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Delete Payment</h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to delete this payment of <span className="text-red-400 font-bold">{Number(deletePaymentId.amount).toLocaleString()} MMK</span>?
                                <br />
                                <span className="text-xs text-gray-500">This will add the amount back to remaining credit.</span>
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setDeletePaymentId(null)}
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeletePayment}
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isDeleting && <Loader2 className="animate-spin" size={18} />}
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

// --- Main Component with Tabs ---
const CreditSaleList: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'list' | 'pay'>('list');

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="bg-gray-800 shadow-md border-b border-gray-700 sticky top-0 z-40 shrink-0">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/sale')}
                            className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500">
                                <CreditCard size={20} />
                            </div>
                            <h1 className="text-xl font-bold font-myanmar">Credit အရောင်းစာရင်း</h1>
                        </div>
                    </div>
                </div>
                <div className="flex px-6 gap-8">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'list' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        <CreditCard size={18} /> Credit Sale List
                    </button>
                    <button
                        onClick={() => setActiveTab('pay')}
                        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pay' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        <Users size={18} /> Customer Pay View
                    </button>
                </div>
            </header>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden bg-gray-900">
                {activeTab === 'list' ? <CreditSaleListTab /> : <CustomerPayViewTab />}
            </div>
        </div>
    );
};

export default CreditSaleList;
