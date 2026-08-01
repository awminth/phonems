import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    Search,
    Download,
    RefreshCw,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Eye,
    X,
    Printer
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, apiClient, fetcher, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';
import useSWR from 'swr';
import PurchaseReturnVoucher from '../../components/PurchaseReturnVoucher';

// Confirm Modal Component
interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    isLoading = false,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'bg-red-900/50 text-red-400',
            button: 'bg-red-600 hover:bg-red-500'
        },
        warning: {
            icon: 'bg-yellow-900/50 text-yellow-400',
            button: 'bg-yellow-600 hover:bg-yellow-500'
        },
        info: {
            icon: 'bg-blue-900/50 text-blue-400',
            button: 'bg-blue-600 hover:bg-blue-500'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${styles.icon}`}>
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
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-5 py-2.5 rounded-xl ${styles.button} text-white font-bold shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50`}
                        >
                            {isLoading && <Loader2 className="animate-spin" size={18} />}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface PurchaseReturn {
    id: string;
    vno: string;
    supplierId: string;
    supplierName: string;
    reason: string;
    originalAmount: number;
    returnAmount: number;
    date: string;
    userId: string;
    userName: string;
    totalQty: number;
    subTotal: number;
}

interface PurchaseReturnsResponse {
    success: boolean;
    data: PurchaseReturn[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

const PurchaseReturnList: React.FC = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; invoiceNo: string }>({
        isOpen: false,
        id: '',
        invoiceNo: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [viewVoucher, setViewVoucher] = useState<{ isOpen: boolean; id: string }>({
        isOpen: false,
        id: ''
    });

    // Build query string
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    if (search) queryParams.append('search', search);
    if (fromDate) queryParams.append('fromDate', fromDate);
    if (toDate) queryParams.append('toDate', toDate);

    const { data, error, isLoading, mutate } = useSWR<PurchaseReturnsResponse>(
        `${API_ENDPOINTS.PURCHASE_RETURNS}?${queryParams.toString()}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    // Fetch voucher details when viewing
    const { data: voucherData, error: voucherError, isLoading: isLoadingVoucher } = useSWR(
        viewVoucher.isOpen && viewVoucher.id ? API_ENDPOINTS.PURCHASE_RETURN_BY_ID(viewVoucher.id) : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const returns = data?.data || [];
    const pagination = data?.pagination;

    const handleSearch = useCallback(() => {
        setSearch(searchInput);
        setPage(1);
    }, [searchInput]);

    const handleDateSearch = useCallback(() => {
        setPage(1);
        mutate();
    }, [mutate]);

    const openDeleteConfirm = (id: string, invoiceNo: string) => {
        setDeleteConfirm({ isOpen: true, id, invoiceNo });
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirm({ isOpen: false, id: '', invoiceNo: '' });
    };

    const openViewVoucher = (id: string) => {
        setViewVoucher({ isOpen: true, id });
    };

    const closeViewVoucher = () => {
        setViewVoucher({ isOpen: false, id: '' });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await apiClient.delete(API_ENDPOINTS.PURCHASE_RETURN_BY_ID(deleteConfirm.id));
            if (result.success) {
                mutate();
                closeDeleteConfirm();
            } else {
                alert(result.message || 'Failed to delete purchase return');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Export to Excel
    const exportToExcel = () => {
        if (returns.length === 0) return;

        const title = `Purchase Return List (${fromDate || 'All'} to ${toDate || 'Today'})`;
        const headers = ["AID", "VNO", "Supplier", "Original Amount", "Return Amount", "Reason", "User", "Date"];
        
        const excelData = returns.map((item, index) => [
            (pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1),
            item.vno,
            item.supplierName || '',
            item.originalAmount,
            item.returnAmount,
            item.reason || '',
            item.userName || '',
            item.date ? new Date(item.date).toLocaleDateString() : ''
        ]);

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `purchase_returns_${timestamp}.xlsx`, 'Purchase Returns');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <header className="bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-700 sticky top-0 z-50">
                <button 
                    onClick={() => navigate('/purchase')}
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">Purchase Return List</h1>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Actions Bar */}
                <div className="bg-gray-800 rounded-xl p-4 shadow-lg mb-6 flex flex-col gap-4 border border-gray-700">
                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by invoice no or supplier..." 
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleSearch} 
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                            >
                                Search
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-gray-400" />
                                <input 
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <span className="text-gray-400">to</span>
                                <input 
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button 
                                    onClick={handleDateSearch}
                                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                                >
                                    Filter
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={() => {
                                setSearchInput('');
                                setSearch('');
                                setFromDate('');
                                setToDate('');
                                setPage(1);
                                mutate();
                            }} 
                            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors" 
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button 
                            onClick={exportToExcel}
                            disabled={returns.length === 0}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            <Download size={18} /> Export
                        </button>
                        {sessionManager.getUserType() !== 'user' && (
                            <button 
                                onClick={() => navigate('/purchase/return')}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                <Plus size={18} /> New
                            </button>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                        <p className="text-red-400 font-medium mb-2">Failed to load purchase returns.</p>
                        <p className="text-red-300 text-sm mb-4">
                            {error?.info?.message || error?.message || 'Unknown error occurred'}
                        </p>
                        <button onClick={() => mutate()} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors">Retry</button>
                    </div>
                )}

                {/* Table */}
                {!isLoading && !error && (
                    <>
                        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                            <th className="p-4 w-20">AID</th>
                                            <th className="p-4">VNO</th>
                                            <th className="p-4">Supplier</th>
                                            <th className="p-4 text-right">Original Amount</th>
                                            <th className="p-4 text-right">Return Amount</th>
                                            <th className="p-4">Reason</th>
                                            <th className="p-4">User</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {returns.length > 0 ? (
                                            returns.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                                    <td className="p-4 text-sm text-gray-400">
                                                        {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                                                    </td>
                                                    <td className="p-4 text-sm font-medium text-blue-400">{item.vno}</td>
                                                    <td className="p-4 text-sm text-white">
                                                        <p className="font-medium">{item.supplierName || '-'}</p>
                                                    </td>
                                                    <td className="p-4 text-sm text-right text-gray-300">
                                                        {item.originalAmount.toLocaleString()} MMK
                                                    </td>
                                                    <td className="p-4 text-sm text-right text-emerald-400 font-medium">
                                                        {item.returnAmount.toLocaleString()} MMK
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-300">{item.reason || '-'}</td>
                                                    <td className="p-4 text-sm text-gray-400">{item.userName || '-'}</td>
                                                    <td className="p-4 text-sm text-gray-300">
                                                        {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => openViewVoucher(item.id)}
                                                                className="p-1.5 text-emerald-400 hover:bg-emerald-900/30 rounded transition-colors"
                                                                title="View Voucher"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            {sessionManager.getUserType() !== 'user' && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => navigate(`/purchase/return/edit/${item.id}`)}
                                                                        className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit size={16} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => openDeleteConfirm(item.id, item.vno)}
                                                                        className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={9} className="p-8 text-center text-gray-500">
                                                    No purchase returns found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            {pagination && pagination.total > 0 && (
                                <div className="p-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span>Show</span>
                                        <select
                                            value={limit}
                                            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-white outline-none"
                                        >
                                            {PAGINATION_CONFIG.LIMIT_OPTIONS.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        <span>of {pagination.total} entries</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setPage(page - 1)}
                                            disabled={!pagination.hasPrev}
                                            className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
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
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-800 border border-gray-600 hover:bg-gray-700'
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
                                            className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Purchase Return"
                message={`Are you sure you want to delete purchase return "${deleteConfirm.invoiceNo}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                onCancel={closeDeleteConfirm}
                isLoading={isDeleting}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />

            {/* View Voucher Modal */}
            {viewVoucher.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Purchase Return Voucher</h3>
                            <button
                                onClick={closeViewVoucher}
                                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {isLoadingVoucher ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-blue-500" size={40} />
                                </div>
                            ) : voucherError ? (
                                <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                                    <p className="text-red-400 font-medium">Failed to load voucher details.</p>
                                </div>
                            ) : voucherData?.success && voucherData?.data ? (
                                <PurchaseReturnVoucher
                                    voucher={voucherData.data.voucher}
                                    items={voucherData.data.items}
                                />
                            ) : null}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Printer size={18} />
                                Print
                            </button>
                            <button
                                onClick={closeViewVoucher}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
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

export default PurchaseReturnList;

