import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Users, 
    CreditCard, 
    Search, 
    Download, 
    Plus, 
    Edit, 
    Trash2, 
    ChevronLeft, 
    ChevronRight, 
    X,
    User,
    Calendar,
    Filter,
    Eye,
    Receipt,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { Customer } from '../../types';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

// --- Interfaces ---
interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface CustomersResponse {
    success: boolean;
    data: Customer[];
    pagination: PaginationInfo;
    fromCache: boolean;
}

// --- Confirm Modal Component ---
interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen, title, message, onConfirm, onCancel, isLoading = false
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-900/50 text-red-400">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 mb-6">{message}</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={onCancel} disabled={isLoading} className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50">Cancel</button>
                        <button onClick={onConfirm} disabled={isLoading} className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                            {isLoading && <Loader2 className="animate-spin" size={18} />}
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Tab 1: Customer List ---
const CustomerListTab: React.FC = () => {
    // Search & Pagination State
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
        isOpen: false, id: '', name: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Form State
    const initialForm = { name: '', phone: '', address: '', email: '' };
    const [formData, setFormData] = useState(initialForm);

    // Build query string
    const buildQueryString = () => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (searchTerm) params.append('search', searchTerm);
        return `${API_ENDPOINTS.CUSTOMERS}?${params.toString()}`;
    };

    // SWR for customers
    const { data, error, isLoading, mutate } = useSWR<CustomersResponse>(
        buildQueryString(),
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    const customers = data?.data || [];
    const pagination = data?.pagination;

    // Search handler
    const handleSearch = useCallback(() => {
        setSearchTerm(searchInput);
        setPage(1);
    }, [searchInput]);

    // Export Excel (UTF-8)
    const exportToExcel = () => {
        const title = "Customer List";
        const headers = ["Name", "Phone", "Address", "Email"];
        const excelData = customers.map(c => [
            c.name,
            c.phone,
            c.address,
            c.email
        ]);
        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `customers_${timestamp}.xlsx`, 'Customers');
    };

    // Modal handlers
    const handleOpenModal = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                email: customer.email
            });
        } else {
            setEditingCustomer(null);
            setFormData(initialForm);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                email: formData.email
            };

            if (editingCustomer) {
                const result = await apiClient.put(API_ENDPOINTS.CUSTOMER_BY_ID(editingCustomer.id), payload);
                if (result.success) {
                    mutate();
                    setIsModalOpen(false);
                } else {
                    alert(result.message || 'Failed to update customer');
                }
            } else {
                const result = await apiClient.post(API_ENDPOINTS.CUSTOMERS, payload);
                if (result.success) {
                    mutate();
                    setIsModalOpen(false);
                } else {
                    alert(result.message || 'Failed to create customer');
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteConfirm = (id: string, name: string) => {
        setDeleteConfirm({ isOpen: true, id, name });
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirm({ isOpen: false, id: '', name: '' });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await apiClient.delete(API_ENDPOINTS.CUSTOMER_BY_ID(deleteConfirm.id));
            if (result.success) {
                mutate();
                closeDeleteConfirm();
            } else {
                alert(result.message || 'Failed to delete customer');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const resetFilters = () => {
        setSearchInput('');
        setSearchTerm('');
        setPage(1);
        mutate();
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col h-full">
            {/* Action Bar */}
            <div className="bg-gray-800 rounded-xl p-4 shadow-lg mb-4 flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-700 shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search name or phone..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    </div>
                    <button onClick={handleSearch} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">Search</button>
                    <button onClick={resetFilters} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors" title="Refresh">
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <select 
                        value={limit}
                        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                        className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    >
                        {PAGINATION_CONFIG.LIMIT_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt} rows</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={exportToExcel} disabled={customers.length === 0} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                        <Download size={18} /> Export
                    </button>
                    <button onClick={() => handleOpenModal()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                        <Plus size={18} /> Add Customer
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-teal-500" size={40} />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                        <p className="text-red-400">Failed to load customers.</p>
                        <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Retry</button>
                    </div>
                </div>
            )}

            {/* Table */}
            {!isLoading && !error && (
                <div className="flex-1 bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold border-b border-gray-700">
                                    <th className="p-4 w-16 text-center">No</th>
                                    <th className="p-4">Customer Name</th>
                                    <th className="p-4">Phone</th>
                                    <th className="p-4">Address</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4 text-center w-32">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {customers.length > 0 ? (
                                    customers.map((c, i) => (
                                        <tr key={c.id} className="hover:bg-gray-750 transition-colors">
                                            <td className="p-4 text-center text-gray-500">
                                                {pagination ? (pagination.page - 1) * pagination.limit + i + 1 : i + 1}
                                            </td>
                                            <td className="p-4 font-medium text-white">{c.name}</td>
                                            <td className="p-4 text-gray-300">{c.phone}</td>
                                            <td className="p-4 text-gray-300 truncate max-w-xs">{c.address}</td>
                                            <td className="p-4 text-gray-300">{c.email}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleOpenModal(c)} className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg"><Edit size={16} /></button>
                                                    <button onClick={() => openDeleteConfirm(c.id, c.name)} className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">No customers found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.total > 0 && (
                        <div className="mt-auto p-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800">
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
                                                        ? 'bg-teal-600 text-white scale-105 shadow-lg' 
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
                                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <User className="text-teal-500"/> {editingCustomer ? 'Edit Customer' : 'New Customer'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Customer Name *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-teal-500 outline-none" 
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                                <input 
                                    type="text" 
                                    value={formData.phone} 
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-teal-500 outline-none" 
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                <input 
                                    type="email" 
                                    value={formData.email} 
                                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-teal-500 outline-none" 
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                                <textarea 
                                    value={formData.address} 
                                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none h-20" 
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700" disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Customer"
                message={`Are you sure you want to delete "${deleteConfirm.name}"?`}
                onConfirm={handleDelete}
                onCancel={closeDeleteConfirm}
                isLoading={isDeleting}
            />
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
}

interface CustomerPaymentDetail {
    id: string;
    vno: string;
    customerId: string;
    amount: number;
    date: string;
    userId: string;
    userName: string;
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
    pagination: PaginationInfo;
    totals: {
        grandTotalPaid: number;
    };
    fromCache: boolean;
}

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
    const [deletePaymentId, setDeletePaymentId] = useState<{id: string; amount: number} | null>(null);
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
        const title = "Customer Payment History";
        const headers = ["Folio No", "Customer", "Voucher Total", "Total Paid", "Remaining", "Payment Count", "Last Payment"];
        const excelData = payments.map(p => [
            p.vno,
            p.customerName,
            p.voucherTotal,
            p.totalPaid,
            p.remainingCredit,
            p.paymentCount,
            p.lastPaymentDate ? new Date(p.lastPaymentDate).toLocaleDateString() : ''
        ]);
        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `customer_payments_${timestamp}.xlsx`, 'Payments');
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
                                            <td colSpan={9} className="p-8 text-center text-gray-500">No payment records found.</td>
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
                                        <ChevronLeft size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => setPage(page + 1)} 
                                        disabled={!pagination.hasNext} 
                                        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                                    >
                                        <ChevronRight size={18}/>
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
                                <Receipt className="text-indigo-500"/> Payment Details - {viewVNO}
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
                                                                <p className="text-gray-500 text-xs">{formatDate(payment.date)} by {payment.userName || 'Unknown'}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setDeletePaymentId({ id: payment.id, amount: payment.amount })}
                                                            className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title="Delete Payment"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
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

// --- Main Page ---
const Customers: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'list' | 'pay'>('list');

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden font-sans">
            <div className="bg-gray-800 shadow-md border-b border-gray-700 sticky top-0 z-40 shrink-0">
                <div className="p-4 flex items-center">
                    <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <div className="bg-teal-500/20 p-2 rounded-lg text-teal-500"><Users size={24}/></div>
                        Customer Management
                    </h1>
                </div>
                <div className="flex px-6 gap-8">
                    <button 
                        onClick={() => setActiveTab('list')}
                        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'list' ? 'border-teal-500 text-teal-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        <Users size={18} /> Customer List
                    </button>
                    <button 
                        onClick={() => setActiveTab('pay')}
                        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pay' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        <CreditCard size={18} /> Customer Pay View
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-gray-900 p-0 md:p-0">
                {activeTab === 'list' ? <div className="h-full p-4 md:p-6 overflow-y-auto"><CustomerListTab /></div> : <CustomerPayViewTab />}
            </div>
        </div>
    );
};

export default Customers;
