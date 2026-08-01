import React, { useState } from 'react';
import useSWR from 'swr';
import { 
    Check, 
    Loader2, 
    Search, 
    ArrowRightLeft, 
    Package, 
    Calendar, 
    User,
    Eye,
    X,
    Smartphone,
    Box,
    AlertCircle,
    History,
    Filter,
    RefreshCw,
    Building2
} from 'lucide-react';
import { Transfer, TransferDetail } from '../../types';
import { API_ENDPOINTS, fetcher, apiClient, PAGINATION_CONFIG, sessionManager } from '../../config';

const ReceiveTab: React.FC = () => {
    const userBranchId = sessionManager.getBranchId();
    const isAdmin = sessionManager.getUserType() === 'admin';
    const [activeTab, setActiveTab] = useState<'incoming' | 'history'>('incoming');
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);
    
    // Search & Filter State
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Fetch incoming transfers or history
    // For admin history, we show all instead of filtering by toBranchId
    const endpoint = activeTab === 'incoming' 
        ? `${API_ENDPOINTS.TRANSFER_INCOMING}?page=${page}&limit=${limit}&search=${search}&fromDate=${fromDate}&toDate=${toDate}`
        : `${API_ENDPOINTS.TRANSFERS}?page=${page}&limit=${limit}&status=Received${isAdmin ? '' : `&toBranchId=${userBranchId}`}&search=${search}&fromDate=${fromDate}&toDate=${toDate}`;

    const { data, isLoading, mutate } = useSWR<{ success: boolean, data: Transfer[], pagination: any }>(
        endpoint,
        fetcher
    );

    const transfers = data?.data || [];
    const pagination = data?.pagination;

    // Detail Modal State
    const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isReceiving, setIsReceiving] = useState(false);

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

    const handleReceive = async () => {
        if (!selectedTransfer) return;
        if (!window.confirm('Are you sure you want to confirm receipt of these items?')) return;

        setIsReceiving(true);
        try {
            const res = await apiClient.post(API_ENDPOINTS.TRANSFER_RECEIVE(selectedTransfer.id), {
                items: selectedTransfer.items
            });

            if (res.success) {
                alert('Transfer received successfully!');
                setIsDetailModalOpen(false);
                mutate();
            } else {
                alert(res.message || 'Failed to receive transfer');
            }
        } catch (error: any) {
            alert(error.message || 'An error occurred');
        } finally {
            setIsReceiving(false);
        }
    };

    const handleTabChange = (tab: 'incoming' | 'history') => {
        setActiveTab(tab);
        setPage(1);
    };

    const clearFilters = () => {
        setSearch('');
        setFromDate('');
        setToDate('');
        setPage(1);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Tabs & Search Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="bg-gray-800 p-1 rounded-xl border border-gray-700 flex gap-1">
                    <button 
                        onClick={() => handleTabChange('incoming')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'incoming' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                        <ArrowRightLeft size={16} /> Incoming Shipments
                    </button>
                    <button 
                        onClick={() => handleTabChange('history')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                        <History size={16} /> Received History
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search IMEI, Code, Remark..."
                            className="w-full md:w-64 bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex flex-wrap gap-4 items-end shadow-sm">
                <div className="flex-1 min-w-[200px]">
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
                <div className="flex-1 min-w-[200px]">
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
                    className="p-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-all shadow-md"
                    title="Clear Filters"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                            {activeTab === 'incoming' ? (
                                <><ArrowRightLeft className="text-blue-400" size={20} /> Pending Shipments</>
                            ) : (
                                <><Check className="text-emerald-400" size={20} /> Completed Transfers</>
                            )}
                        </h3>
                        {isAdmin && (
                            <p className="text-xs text-blue-400 font-medium">
                                Administrator View: Showing shipments for all branches.
                            </p>
                        )}
                    </div>
                    <div className="text-sm text-gray-400">
                        {activeTab === 'incoming' ? 'Transfers shipped to your branch' : 'History of received items'}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-700/30">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date / Sender</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {isAdmin ? 'Route (From → To)' : (activeTab === 'incoming' ? 'From Branch' : 'Sender Branch')}
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
                                        <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={32} />
                                        <p className="text-gray-500">Loading transfers...</p>
                                    </td>
                                </tr>
                            ) : transfers.length > 0 ? (
                                transfers.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-750 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${activeTab === 'incoming' ? 'bg-blue-900/30 text-blue-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                                                    <Calendar size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{new Date(t.transferDate).toLocaleDateString()}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <User size={12} /> {t.senderName}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-gray-300 font-medium">
                                                    <Building2 size={16} className={isAdmin ? (t.toBranchId == userBranchId ? "text-emerald-400" : "text-gray-500") : "text-blue-400"} />
                                                    {isAdmin ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{t.fromBranchName}</span>
                                                            <ArrowRightLeft size={12} className="text-gray-600" />
                                                            <span className={t.toBranchId == userBranchId ? "text-emerald-400 font-bold" : ""}>{t.toBranchName}</span>
                                                        </div>
                                                    ) : (
                                                        t.fromBranchName
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
                                            <span className={`px-3 py-1 text-xs rounded-full border ${
                                                t.status === 'Received' 
                                                ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' 
                                                : 'bg-blue-900/40 text-blue-400 border-blue-800/50'
                                            }`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleViewDetails(t.id)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg flex items-center gap-2 ml-auto ${
                                                    activeTab === 'incoming' 
                                                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                                }`}
                                            >
                                                <Eye size={16} /> {activeTab === 'incoming' ? 'View & Receive' : 'View Details'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Package size={48} className="text-gray-700" />
                                            <p className="text-lg">No shipments found.</p>
                                            <button onClick={() => mutate()} className="text-blue-400 hover:underline text-sm">Refresh list</button>
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

            {/* Detail Modal */}
            {isDetailModalOpen && selectedTransfer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-gray-700 flex flex-col overflow-hidden scale-in-center animate-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/80 sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Package className={selectedTransfer.status === 'Received' ? "text-emerald-400" : "text-blue-400"} size={28} /> 
                                    {selectedTransfer.status === 'Received' ? 'Transfer Details' : 'Receive Shipment'}
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">From {selectedTransfer.fromBranchName} • {new Date(selectedTransfer.transferDate).toLocaleString()}</p>
                            </div>
                            <button 
                                onClick={() => setIsDetailModalOpen(false)}
                                className="p-2 hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Summary Card */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700">
                                    <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Status</div>
                                    <div className={`font-bold ${selectedTransfer.status === 'Received' ? 'text-emerald-400' : 'text-blue-400'}`}>{selectedTransfer.status}</div>
                                </div>
                                <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700">
                                    <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Sender</div>
                                    <div className="text-white font-bold">{selectedTransfer.senderName}</div>
                                </div>
                                <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700">
                                    <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Receiver</div>
                                    <div className="text-white font-bold">{selectedTransfer.receiverName || '-'}</div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">Manifest</h4>
                                <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-800/50">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500">Item</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-center">Type</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-center">Serial / Qty</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {selectedTransfer.items?.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-800/50">
                                                    <td className="px-4 py-3">
                                                        <div className="text-white font-medium">{item.productName}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{item.productCode}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {item.imei ? <Smartphone size={14} className="mx-auto text-blue-400" /> : <Box size={14} className="mx-auto text-purple-400" />}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {item.imei ? (
                                                            <code className="bg-gray-800 px-2 py-1 rounded text-blue-400 text-xs font-mono">{item.imei}</code>
                                                        ) : (
                                                            <span className="font-bold text-white">{item.qty}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-xs text-gray-500">
                                                            {selectedTransfer.receiveDate ? new Date(selectedTransfer.receiveDate).toLocaleDateString() : 'Shipped'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Remark */}
                            {selectedTransfer.remark && (
                                <div className="bg-blue-900/10 border border-blue-800/30 p-4 rounded-2xl flex gap-3">
                                    <AlertCircle className="text-blue-400 shrink-0" size={20} />
                                    <div>
                                        <div className="text-blue-400 text-sm font-bold">Notes</div>
                                        <div className="text-gray-300 text-sm italic">"{selectedTransfer.remark}"</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-700 bg-gray-800/80 flex gap-4 sticky bottom-0">
                            <button 
                                onClick={() => setIsDetailModalOpen(false)}
                                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
                            >
                                Close
                            </button>
                            {selectedTransfer.status !== 'Received' && (
                                <button 
                                    onClick={handleReceive}
                                    disabled={isReceiving || (selectedTransfer.toBranchId != userBranchId && !isAdmin)}
                                    className="flex-[2] px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isReceiving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                    {isReceiving ? 'Processing...' : (selectedTransfer.toBranchId != userBranchId ? `Receive on behalf of ${selectedTransfer.toBranchName}` : 'Confirm Receipt & Add to Stock')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceiveTab;
