import React, { useState } from 'react';
import useSWR from 'swr';
import { 
    Plus, 
    Search, 
    Loader2, 
    ArrowRightLeft, 
    Calendar, 
    User,
    Eye,
    X,
    Building2,
    CheckCircle2,
    Clock,
    FileText,
    Trash2
} from 'lucide-react';
import { Transfer } from '../../types';
import { API_ENDPOINTS, fetcher, apiClient, PAGINATION_CONFIG, sessionManager } from '../../config';
import TransferNew from './TransferNew';

const TransferTab: React.FC = () => {
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const userBranchId = sessionManager.getBranchId();
    const isAdmin = sessionManager.getUserType() === 'admin';

    // Fetch sent transfers
    // For admin, we don't force fromBranchId to be the current branch
    const endpoint = isAdmin 
        ? `${API_ENDPOINTS.TRANSFERS}?page=${page}&limit=${limit}&search=${search}&fromDate=${fromDate}&toDate=${toDate}`
        : `${API_ENDPOINTS.TRANSFERS}?page=${page}&limit=${limit}&fromBranchId=${userBranchId}&search=${search}&fromDate=${fromDate}&toDate=${toDate}`;

    const { data, isLoading, mutate } = useSWR<{ success: boolean, data: Transfer[], pagination: any }>(
        endpoint,
        fetcher
    );

    const transfers = data?.data || [];
    const pagination = data?.pagination;

    const clearFilters = () => {
        setSearch('');
        setFromDate('');
        setToDate('');
        setPage(1);
    };

    const handleViewDetails = async (id: string) => {
        try {
            const res = await apiClient.get(API_ENDPOINTS.TRANSFER_BY_ID(id));
            if (res.success) {
                setSelectedTransfer(res.data);
                setIsDetailModalOpen(true);
            }
        } catch (error) {
            console.error('Fetch transfer detail error:', error);
            alert('Failed to fetch details');
        }
    };

    const handleDeleteTransfer = async (id: string) => {
        if (!window.confirm('Are you sure you want to cancel this transfer? The stock will be returned to your inventory.')) {
            return;
        }

        try {
            const res = await apiClient.delete(API_ENDPOINTS.TRANSFER_BY_ID(id));
            if (res.success) {
                mutate();
                alert('Transfer cancelled successfully');
            } else {
                alert(res.message || 'Failed to cancel transfer');
            }
        } catch (error) {
            console.error('Delete transfer error:', error);
            alert('An error occurred');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Received': return 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50';
            case 'Shipped': return 'bg-blue-900/30 text-blue-400 border-blue-800/50';
            case 'Cancelled': return 'bg-red-900/30 text-red-400 border-red-800/50';
            default: return 'bg-gray-700 text-gray-300 border-gray-600';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Actions Bar */}
            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by IMEI, Code, Remark..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsNewModalOpen(true)}
                        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> New Transfer
                    </button>
                </div>
                {isAdmin && (
                    <p className="text-xs text-blue-400 font-medium">
                        Administrator View: Showing transfers from all branches.
                    </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Calendar size={12} /> From Date
                        </label>
                        <input 
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Calendar size={12} /> To Date
                        </label>
                        <input 
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <button 
                        onClick={clearFilters}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-700/30">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {isAdmin ? 'Route (From → To)' : 'Destination'}
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Items</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin mx-auto text-emerald-500 mb-2" size={32} />
                                        <p className="text-gray-500">Loading transfers...</p>
                                    </td>
                                </tr>
                            ) : transfers.length > 0 ? (
                                transfers.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-750 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-emerald-900/20 p-2 rounded-lg text-emerald-400">
                                                    <Calendar size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{new Date(t.transferDate).toLocaleDateString()}</div>
                                                    <div className="text-xs text-gray-500">{new Date(t.transferDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-gray-300 font-medium">
                                                    <Building2 size={16} className={isAdmin ? (t.fromBranchId == userBranchId ? "text-emerald-400" : "text-gray-500") : "text-blue-400"} />
                                                    {isAdmin ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={t.fromBranchId == userBranchId ? "text-emerald-400 font-bold" : ""}>{t.fromBranchName}</span>
                                                            <ArrowRightLeft size={12} className="text-gray-600" />
                                                            <span>{t.toBranchName}</span>
                                                        </div>
                                                    ) : (
                                                        t.toBranchName
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full text-sm font-bold border border-gray-600">
                                                {t.itemCount} items
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 text-xs rounded-full border flex items-center justify-center gap-1 w-fit mx-auto ${getStatusStyle(t.status)}`}>
                                                {t.status === 'Received' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleViewDetails(t.id)}
                                                    className="p-2 text-blue-400 hover:text-white hover:bg-blue-600/20 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                                {t.status === 'Shipped' && (t.fromBranchId == userBranchId || isAdmin) && (
                                                    <button 
                                                        onClick={() => handleDeleteTransfer(t.id)}
                                                        className="p-2 text-red-400 hover:text-white hover:bg-red-600/20 rounded-lg transition-all"
                                                        title="Cancel Transfer"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <ArrowRightLeft size={48} className="text-gray-700" />
                                            <p className="text-lg">No transfers found.</p>
                                            <button onClick={() => setIsNewModalOpen(true)} className="text-emerald-400 hover:underline text-sm font-bold">Start a new transfer</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-gray-700 flex justify-between items-center bg-gray-800/50">
                        <div className="text-sm text-gray-400">
                            Page {page} of {pagination.totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg text-sm transition-all"
                            >
                                Previous
                            </button>
                            <button 
                                disabled={page === pagination.totalPages}
                                onClick={() => setPage(page + 1)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg text-sm transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* New Transfer Modal */}
            {isNewModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 rounded-3xl w-full max-w-5xl max-h-[95vh] shadow-2xl border border-gray-700 flex flex-col overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <ArrowRightLeft className="text-emerald-400" size={28} /> New Stock Transfer
                            </h2>
                            <button 
                                onClick={() => {
                                    setIsNewModalOpen(false);
                                    mutate();
                                }}
                                className="p-2 hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
                            <TransferNew onComplete={() => {
                                setIsNewModalOpen(false);
                                mutate();
                            }} onCancel={() => setIsNewModalOpen(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {isDetailModalOpen && selectedTransfer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-800 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-gray-700 flex flex-col overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/80 sticky top-0">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="text-blue-400" size={24} /> Transfer Details
                            </h2>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">To Branch</div>
                                    <div className="text-white font-bold text-lg">{selectedTransfer.toBranchName}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Date Sent</div>
                                    <div className="text-white font-bold text-lg">{new Date(selectedTransfer.transferDate).toLocaleString()}</div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-800/50">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-500 text-left">Item</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-500 text-center">Qty / IMEI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {selectedTransfer.items?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3">
                                                    <div className="text-white font-medium">{item.productName}</div>
                                                    <div className="text-xs text-gray-500">{item.productCode}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {item.imei ? (
                                                        <code className="text-emerald-400 font-mono text-xs">{item.imei}</code>
                                                    ) : (
                                                        <span className="text-white font-bold">{item.qty}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-700 bg-gray-800/80">
                            <button 
                                onClick={() => setIsDetailModalOpen(false)}
                                className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
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

export default TransferTab;
