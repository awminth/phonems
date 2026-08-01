import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    DollarSign, 
    Wallet, 
    AlertCircle,
    Loader2,
    Building2,
    Plus,
    Edit,
    Trash2,
    X,
    Search,
    Download,
    ChevronLeft,
    ChevronRight,
    Calendar
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, SWR_CONFIG, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

interface Supplier {
    id: string;
    name: string;
    address: string;
    email: string;
    phone: string;
}

interface TransactionSummary {
    totalPaid: number;
    totalPurchases: number;
    outstanding: number;
}

interface Payment {
    id: string;
    supplierId: string;
    amount: number;
    date: string;
    userId: string;
    userName: string;
}

interface Purchase {
    id: string;
    supplierId: string;
    purchaseId: string;
    amount: number;
    date: string;
    codeNo: string;
    itemName: string;
    qty: number;
    purchasePrice: number;
    purchaseDate: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface SupplierResponse {
    success: boolean;
    data: Supplier;
}

interface TransactionSummaryResponse {
    success: boolean;
    data: TransactionSummary;
}

interface PaymentsResponse {
    success: boolean;
    data: Payment[];
    pagination: PaginationInfo;
    fromCache: boolean;
}

interface PurchasesResponse {
    success: boolean;
    data: Purchase[];
    pagination: PaginationInfo;
    fromCache: boolean;
            }

// Confirm Modal Component
interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    isLoading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-900/50 text-red-400">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 mb-6">{message}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                <button 
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isLoading && <Loader2 className="animate-spin" size={18} />}
                            Delete
                </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SupplierInOut: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const supplierId = searchParams.get('id') || '';
    const [activeTab, setActiveTab] = useState<'payments' | 'purchases'>('payments');

    // Payments state
    const [paymentsPage, setPaymentsPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [paymentsLimit, setPaymentsLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);
    const [paymentsFromDate, setPaymentsFromDate] = useState('');
    const [paymentsToDate, setPaymentsToDate] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0] });
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [deletePaymentConfirm, setDeletePaymentConfirm] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
    const [isDeletingPayment, setIsDeletingPayment] = useState(false);

    // Purchases state
    const [purchasesPage, setPurchasesPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [purchasesLimit, setPurchasesLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);
    const [purchasesFromDate, setPurchasesFromDate] = useState('');
    const [purchasesToDate, setPurchasesToDate] = useState('');

    // Build query strings
    const buildPaymentsQuery = useCallback(() => {
        const params = new URLSearchParams();
        params.append('page', paymentsPage.toString());
        params.append('limit', paymentsLimit.toString());
        if (paymentsFromDate) params.append('fromDate', paymentsFromDate);
        if (paymentsToDate) params.append('toDate', paymentsToDate);
        return `${API_ENDPOINTS.SUPPLIER_PAYMENTS(supplierId)}?${params.toString()}`;
    }, [supplierId, paymentsPage, paymentsLimit, paymentsFromDate, paymentsToDate]);

    const buildPurchasesQuery = useCallback(() => {
        const params = new URLSearchParams();
        params.append('page', purchasesPage.toString());
        params.append('limit', purchasesLimit.toString());
        if (purchasesFromDate) params.append('fromDate', purchasesFromDate);
        if (purchasesToDate) params.append('toDate', purchasesToDate);
        return `${API_ENDPOINTS.SUPPLIER_PURCHASES(supplierId)}?${params.toString()}`;
    }, [supplierId, purchasesPage, purchasesLimit, purchasesFromDate, purchasesToDate]);

    // Fetch supplier info
    const { data: supplierData, isLoading: supplierLoading } = useSWR<SupplierResponse>(
        supplierId ? API_ENDPOINTS.SUPPLIER_BY_ID(supplierId) : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    // Fetch transaction summary
    const { data: summaryData, isLoading: summaryLoading, mutate: mutateSummary } = useSWR<TransactionSummaryResponse>(
        supplierId ? API_ENDPOINTS.SUPPLIER_TRANSACTIONS(supplierId) : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    // Fetch payments with pagination
    const { data: paymentsData, isLoading: paymentsLoading, mutate: mutatePayments } = useSWR<PaymentsResponse>(
        supplierId ? buildPaymentsQuery() : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    // Fetch purchases with pagination
    const { data: purchasesData, isLoading: purchasesLoading } = useSWR<PurchasesResponse>(
        supplierId ? buildPurchasesQuery() : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const supplier = supplierData?.data;
    const summary = summaryData?.data;
    const payments = paymentsData?.data || [];
    const paymentsPagination = paymentsData?.pagination;
    const purchases = purchasesData?.data || [];
    const purchasesPagination = purchasesData?.pagination;

    // Payment CRUD handlers
    const handleOpenPaymentModal = (payment?: Payment) => {
        if (payment) {
            setEditingPayment(payment);
            setPaymentForm({
                amount: payment.amount.toString(),
                date: payment.date
            });
        } else {
            setEditingPayment(null);
            setPaymentForm({
                amount: '',
                date: new Date().toISOString().split('T')[0]
            });
        }
        setIsPaymentModalOpen(true);
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingPayment(true);

        try {
            const userId = sessionManager.getUserId();
            const paymentData = {
                amount: parseFloat(paymentForm.amount),
                date: paymentForm.date,
                userId: userId || null
            };

            if (editingPayment) {
                const result = await apiClient.put(
                    API_ENDPOINTS.SUPPLIER_PAYMENT_UPDATE(supplierId, editingPayment.id),
                    paymentData
                );
                if (result.success) {
                    mutatePayments();
                    mutateSummary();
                    setIsPaymentModalOpen(false);
                } else {
                    alert(result.message || 'Failed to update payment');
                }
            } else {
                const result = await apiClient.post(
                    API_ENDPOINTS.SUPPLIER_PAYMENT_CREATE(supplierId),
                    paymentData
                );
                if (result.success) {
                    mutatePayments();
                    mutateSummary();
                    setIsPaymentModalOpen(false);
        } else {
                    alert(result.message || 'Failed to create payment');
                }
            }
        } catch (error) {
            console.error('Submit payment error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleDeletePayment = async () => {
        setIsDeletingPayment(true);
        try {
            const result = await apiClient.delete(
                API_ENDPOINTS.SUPPLIER_PAYMENT_DELETE(supplierId, deletePaymentConfirm.id)
            );
            if (result.success) {
                mutatePayments();
                mutateSummary();
                setDeletePaymentConfirm({ isOpen: false, id: '' });
            } else {
                alert(result.message || 'Failed to delete payment');
            }
        } catch (error) {
            console.error('Delete payment error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsDeletingPayment(false);
        }
    };

    // Export functions
    const exportPaymentsToExcel = () => {
        if (payments.length === 0) return;

        const title = `Supplier Payments - ${supplier?.name || 'Unknown'} (${paymentsFromDate || 'All'} to ${paymentsToDate || 'Today'})`;
        const headers = ['စဉ်', 'Date', 'Amount', 'User'];
        
        const excelData = payments.map((payment, index) => [
            (paymentsPagination ? (paymentsPagination.page - 1) * paymentsPagination.limit + index + 1 : index + 1),
            payment.date,
            payment.amount,
            payment.userName
        ]);

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `supplier_payments_${timestamp}.xlsx`, 'Payments');
    };

    const exportPurchasesToExcel = () => {
        if (purchases.length === 0) return;

        const title = `Supplier Purchases - ${supplier?.name || 'Unknown'} (${purchasesFromDate || 'All'} to ${purchasesToDate || 'Today'})`;
        const headers = ['စဉ်', 'Code No', 'Item Name', 'Qty', 'Purchase Price', 'Amount', 'Date'];
        
        const excelData = purchases.map((purchase, index) => [
            (purchasesPagination ? (purchasesPagination.page - 1) * purchasesPagination.limit + index + 1 : index + 1),
            purchase.codeNo,
            purchase.itemName,
            purchase.qty,
            purchase.purchasePrice,
            purchase.amount,
            purchase.date
        ]);

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `supplier_purchases_${timestamp}.xlsx`, 'Purchases');
    };

    if (!supplierId) {
    return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">No supplier selected</p>
                    <button
                        onClick={() => navigate('/purchase/company')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
                    >
                        Go to Supplier List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
            {/* Header */}
            <header className="bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-700 sticky top-0 z-40">
                <button 
                    onClick={() => navigate('/purchase/company')}
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
                >
                    <ArrowLeft size={24} />
                        </button>
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">
                            {supplierLoading ? 'Loading...' : supplier?.name || 'Supplier In/Out'}
                        </h1>
                        {supplier && (
                            <p className="text-sm text-gray-400">{supplier.phone || supplier.email || ''}</p>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Total Paid Card */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg hover:border-blue-500/30 transition-colors">
                        <div className="flex items-center justify-between">
                    <div>
                                <p className="text-gray-400 text-sm font-medium mb-1">ငွေ, Supplier ကိုပေးသွင်း</p>
                                <h2 className="text-3xl font-bold text-blue-400">
                                    {summaryLoading ? (
                                        <Loader2 className="animate-spin inline" size={24} />
                                    ) : (
                                        <>
                                            {(summary?.totalPaid || 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">MMK</span>
                                        </>
                                    )}
                                </h2>
                            </div>
                            <div className="bg-blue-500/10 p-4 rounded-full text-blue-400">
                                <Wallet size={32} />
                            </div>
                        </div>
                    </div>

                    {/* Outstanding Card */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg hover:border-red-500/30 transition-colors">
                        <div className="flex items-center justify-between">
                    <div>
                                <p className="text-gray-400 text-sm font-medium mb-1">Supplier ကိုပေးရန်ကျန်ငွေ</p>
                                <h2 className="text-3xl font-bold text-red-400">
                                    {summaryLoading ? (
                                        <Loader2 className="animate-spin inline" size={24} />
                                    ) : (
                                        <>
                                            {(summary?.outstanding || 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">MMK</span>
                                        </>
                                    )}
                                </h2>
                            </div>
                            <div className="bg-red-500/10 p-4 rounded-full text-red-400">
                                <AlertCircle size={32} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-gray-800 rounded-t-xl border border-gray-700 border-b-0">
                    <div className="flex gap-4 px-6 pt-4">
                        <button 
                            onClick={() => setActiveTab('payments')}
                            className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
                                activeTab === 'payments' 
                                    ? 'border-blue-500 text-blue-400' 
                                    : 'border-transparent text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            Supplier ကိုပေးသွင်းထားသော Transaction
                        </button>
                        <button 
                            onClick={() => setActiveTab('purchases')}
                            className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
                                activeTab === 'purchases' 
                                    ? 'border-emerald-500 text-emerald-400' 
                                    : 'border-transparent text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            Supplier မှဝယ်ထားသော Transaction
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-gray-800 rounded-b-xl border border-gray-700 border-t-0 overflow-hidden">
                    {activeTab === 'payments' ? (
                        <div className="p-6">
                            {/* Search and Actions Bar */}
                            <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div className="flex flex-col md:flex-row gap-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={18} className="text-gray-400" />
                                        <input
                                            type="date"
                                            value={paymentsFromDate}
                                            onChange={(e) => {
                                                setPaymentsFromDate(e.target.value);
                                                setPaymentsPage(1);
                                            }}
                                            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="From Date"
                                        />
                                        <span className="text-gray-400">to</span>
                                        <input
                                            type="date"
                                            value={paymentsToDate}
                                            onChange={(e) => {
                                                setPaymentsToDate(e.target.value);
                                                setPaymentsPage(1);
                                            }}
                                            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="To Date"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={exportPaymentsToExcel}
                                        disabled={payments.length === 0}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Download size={18} /> Export
                                    </button>
                                    <button
                                        onClick={() => handleOpenPaymentModal()}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={18} /> Add Payment
                                    </button>
                                </div>
                            </div>

                            {paymentsLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-blue-500" size={40} />
                                </div>
                            ) : payments.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <Wallet size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No payment records found</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto mb-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold border-b border-gray-700">
                                    <th className="p-4 w-16 text-center">စဉ်</th>
                                    <th className="p-4">Date</th>
                                                    <th className="p-4 text-right">Amount</th>
                                                    <th className="p-4">User</th>
                                                    <th className="p-4 text-center w-32">Action</th>
                                </tr>
                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                                {payments.map((payment, index) => (
                                                    <tr key={payment.id} className="hover:bg-gray-750 transition-colors">
                                                        <td className="p-4 text-center text-gray-500">
                                                            {(paymentsPagination?.page - 1) * paymentsPagination?.limit + index + 1}
                                                        </td>
                                                        <td className="p-4 text-white">
                                                            <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs border border-blue-800">
                                                                {payment.date}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right font-medium text-blue-400">
                                                            {payment.amount.toLocaleString()} MMK
                                        </td>
                                                        <td className="p-4 text-gray-300">{payment.userName}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleOpenPaymentModal(payment)}
                                                                    className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                                                                >
                                                    <Edit size={16} />
                                                </button>
                                                                <button
                                                                    onClick={() => setDeletePaymentConfirm({ isOpen: true, id: payment.id })}
                                                                    className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                                    {paymentsPagination && paymentsPagination.total > 0 && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-700">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <span>Show</span>
                                                <select
                                                    value={paymentsLimit}
                                                    onChange={(e) => {
                                                        setPaymentsLimit(Number(e.target.value));
                                                        setPaymentsPage(1);
                                                    }}
                                                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-white outline-none"
                                                >
                                                    {PAGINATION_CONFIG.LIMIT_OPTIONS.map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <span>of {paymentsPagination.total} entries</span>
                                            </div>
                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                                                    disabled={!paymentsPagination.hasPrev}
                                                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                                                >
                                    <ChevronLeft size={18} />
                                </button>
                                                <span className="text-sm text-gray-400 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                                                    <span className="text-white font-medium">{paymentsPagination.page}</span> / <span className="text-white font-medium">{paymentsPagination.totalPages}</span>
                                                </span>
                                        <button
                                                    onClick={() => setPaymentsPage(p => p + 1)}
                                                    disabled={!paymentsPagination.hasNext}
                                                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="p-6">
                            {/* Search and Actions Bar */}
                            <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div className="flex flex-col md:flex-row gap-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={18} className="text-gray-400" />
                                        <input
                                            type="date"
                                            value={purchasesFromDate}
                                            onChange={(e) => {
                                                setPurchasesFromDate(e.target.value);
                                                setPurchasesPage(1);
                                            }}
                                            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="From Date"
                                        />
                                        <span className="text-gray-400">to</span>
                                        <input
                                            type="date"
                                            value={purchasesToDate}
                                            onChange={(e) => {
                                                setPurchasesToDate(e.target.value);
                                                setPurchasesPage(1);
                                            }}
                                            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="To Date"
                                />
                            </div>
                            </div>
                                <button
                                    onClick={exportPurchasesToExcel}
                                    disabled={purchases.length === 0}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <Download size={18} /> Export
                                </button>
                </div>
                
                            {purchasesLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-emerald-500" size={40} />
                    </div>
                            ) : purchases.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <DollarSign size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No purchase records found</p>
                    </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto mb-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold border-b border-gray-700">
                                    <th className="p-4 w-16 text-center">စဉ်</th>
                                                    <th className="p-4">Code No</th>
                                    <th className="p-4">Item Name</th>
                                                    <th className="p-4 text-center">Qty</th>
                                                    <th className="p-4 text-right">Purchase Price</th>
                                                    <th className="p-4 text-right">Amount</th>
                                                    <th className="p-4">Date</th>
                                </tr>
                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                                {purchases.map((purchase, index) => (
                                                    <tr key={purchase.id} className="hover:bg-gray-750 transition-colors">
                                                        <td className="p-4 text-center text-gray-500">
                                                            {(purchasesPagination?.page - 1) * purchasesPagination?.limit + index + 1}
                                                        </td>
                                                        <td className="p-4 text-white font-medium">{purchase.codeNo}</td>
                                                        <td className="p-4 text-gray-300">{purchase.itemName}</td>
                                                        <td className="p-4 text-center text-gray-300">{purchase.qty}</td>
                                                        <td className="p-4 text-right text-gray-300">{purchase.purchasePrice.toLocaleString()}</td>
                                                        <td className="p-4 text-right font-medium text-emerald-400">
                                                            {purchase.amount.toLocaleString()} MMK
                                                        </td>
                                        <td className="p-4">
                                                            <span className="bg-emerald-900/30 text-emerald-300 px-2 py-1 rounded text-xs border border-emerald-800">
                                                                {purchase.date}
                                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                                    {purchasesPagination && purchasesPagination.total > 0 && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-700">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <span>Show</span>
                                                <select
                                                    value={purchasesLimit}
                                                    onChange={(e) => {
                                                        setPurchasesLimit(Number(e.target.value));
                                                        setPurchasesPage(1);
                                                    }}
                                                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-white outline-none"
                                                >
                                                    {PAGINATION_CONFIG.LIMIT_OPTIONS.map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <span>of {purchasesPagination.total} entries</span>
                                            </div>
                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setPurchasesPage(p => Math.max(1, p - 1))}
                                                    disabled={!purchasesPagination.hasPrev}
                                                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                                                >
                                    <ChevronLeft size={18} />
                                </button>
                                                <span className="text-sm text-gray-400 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                                                    <span className="text-white font-medium">{purchasesPagination.page}</span> / <span className="text-white font-medium">{purchasesPagination.totalPages}</span>
                                                </span>
                                        <button
                                                    onClick={() => setPurchasesPage(p => p + 1)}
                                                    disabled={!purchasesPagination.hasNext}
                                                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white">
                                {editingPayment ? 'Edit Payment' : 'New Payment'}
                            </h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                    </button>
                        </div>
                        <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                                <input
                                    type="number"
                                    required
                                    min="0.01"
                                    step="0.01"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter amount"
                                    disabled={isSubmittingPayment}
                                />
                    </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={paymentForm.date}
                                    onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    disabled={isSubmittingPayment}
                                />
                </div>
                            <div className="flex justify-end gap-3 pt-4">
                    <button 
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                                    disabled={isSubmittingPayment}
                    >
                                    Cancel
                    </button>
                    <button 
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50"
                                    disabled={isSubmittingPayment}
                    >
                                    {isSubmittingPayment && <Loader2 className="animate-spin" size={18} />}
                                    {editingPayment ? 'Update' : 'Save'}
                    </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deletePaymentConfirm.isOpen}
                title="Delete Payment"
                message="Are you sure you want to delete this payment? This action cannot be undone."
                onConfirm={handleDeletePayment}
                onCancel={() => setDeletePaymentConfirm({ isOpen: false, id: '' })}
                isLoading={isDeletingPayment}
            />
        </div>
    );
};

export default SupplierInOut;
