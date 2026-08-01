import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Search, 
    Download, 
    ChevronLeft, 
    ChevronRight, 
    Filter, 
    RefreshCw, 
    Loader2,
    Calendar,
    ArrowRightLeft,
    Building2,
    Eye,
    X,
    FileText
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';
import { Transfer } from '../../types';

const TransferReport: React.FC = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [fromBranchId, setFromBranchId] = useState('');
    const [toBranchId, setToBranchId] = useState('');
    
    const isAdmin = sessionManager.getUserType() === 'admin';
    const userBranchId = sessionManager.getBranchId();

    // Modal state for details
    const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const buildQuery = () => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        
        if (isAdmin) {
            if (fromBranchId && fromBranchId !== 'all') params.append('fromBranchId', fromBranchId);
            if (toBranchId && toBranchId !== 'all') params.append('toBranchId', toBranchId);
        } else {
            params.append('fromBranchId', userBranchId);
        }
        
        return params.toString();
    };

    const { data, isLoading, mutate } = useSWR<{ success: boolean, data: Transfer[], pagination: any }>(
        `${API_ENDPOINTS.TRANSFERS}?${buildQuery()}`,
        fetcher
    );

    const { data: branchData } = useSWR(
        API_ENDPOINTS.BRANCHES,
        fetcher,
        { revalidateOnFocus: false }
    );

    const transfers = data?.data || [];
    const pagination = data?.pagination || { total: 0, totalPages: 1 };
    const branches = branchData?.data || [];

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

    const handleExport = () => {
        if (transfers.length === 0) return;
        const title = 'Inventory Transfer Report';
        const headers = ['Date', 'From Branch', 'To Branch', 'Items', 'Status', 'Sender', 'Remark'];
        const excelData = transfers.map((t: any) => [
            new Date(t.transferDate).toLocaleDateString(),
            t.fromBranchName,
            t.toBranchName,
            `${t.itemCount} items`,
            t.status,
            t.senderName,
            t.remark || ''
        ]);
        exportStyledExcel(title, headers, excelData, `transfer_report_${new Date().toISOString().split('T')[0]}.xlsx`, 'Transfer Report');
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between border-b border-gray-700 h-16 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/reports')} className="p-2 rounded-full hover:bg-gray-700 text-gray-300">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-500">
                        <ArrowRightLeft size={20} />
                    </div>
                    <h1 className="text-xl font-bold">Transfer Report</h1>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                <aside className="w-full lg:w-80 bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 shadow-xl">
                    <div className="flex items-center gap-2 text-cyan-400 border-b border-gray-700 pb-2">
                        <Filter size={20} />
                        <h2 className="font-bold text-lg">Filters</h2>
                    </div>

                    <div className="space-y-4">
                        {isAdmin && (
                            <>
                                <div>
                                    <label className="text-sm font-medium text-gray-400 block mb-1">From Branch</label>
                                    <select 
                                        value={fromBranchId}
                                        onChange={(e) => setFromBranchId(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                                    >
                                        <option value="all">All Branches</option>
                                        {branches.map((b: any) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400 block mb-1">To Branch</label>
                                    <select 
                                        value={toBranchId}
                                        onChange={(e) => setToBranchId(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                                    >
                                        <option value="all">All Branches</option>
                                        {branches.map((b: any) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Search</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="IMEI, Remark, Code..."
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">From Date</label>
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">To Date</label>
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                            />
                        </div>

                        <div className="pt-2 space-y-2">
                            <button 
                                onClick={() => mutate()}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} /> Refresh
                            </button>
                            <button 
                                onClick={handleExport}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Download size={16} /> Export Excel
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative p-4">
                    <div className="flex-1 overflow-auto bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 size={40} className="animate-spin text-cyan-500" />
                            </div>
                        ) : transfers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500 italic">
                                <ArrowRightLeft size={40} className="mb-2 opacity-20" />
                                No transfers found.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="bg-gray-900/50 sticky top-0 z-10">
                                    <tr className="text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Route (From → To)</th>
                                        <th className="p-4 text-center">Items</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4">Sender</th>
                                        <th className="p-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {transfers.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                            <td className="p-4 text-sm text-gray-300 whitespace-nowrap">
                                                {new Date(item.transferDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm text-white">
                                                    <span className={item.fromBranchId == userBranchId ? "text-emerald-400 font-bold" : ""}>{item.fromBranchName}</span>
                                                    <ArrowRightLeft size={12} className="text-gray-600" />
                                                    <span>{item.toBranchName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs border border-gray-600">
                                                    {item.itemCount} items
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 text-[10px] rounded-full border ${
                                                    item.status === 'Received' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 
                                                    item.status === 'Shipped' ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' : 
                                                    'bg-gray-700 text-gray-400 border-gray-600'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">{item.senderName}</td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => handleViewDetails(item.id)}
                                                    className="p-2 text-cyan-400 hover:bg-cyan-900/30 rounded transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-4">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-full hover:bg-gray-800 disabled:opacity-50"
                            >
                                <ChevronLeft />
                            </button>
                            <span className="text-sm">Page {page} of {pagination.totalPages}</span>
                            <button 
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="p-2 rounded-full hover:bg-gray-800 disabled:opacity-50"
                            >
                                <ChevronRight />
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && selectedTransfer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-gray-800 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-gray-700 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/80 sticky top-0">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="text-blue-400" size={24} /> Transfer Details
                            </h2>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div>
                                    <div className="text-gray-500 uppercase font-bold mb-1 text-[10px]">From Branch</div>
                                    <div className="text-white font-bold">{selectedTransfer.fromBranchName}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 uppercase font-bold mb-1 text-[10px]">To Branch</div>
                                    <div className="text-white font-bold">{selectedTransfer.toBranchName}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 uppercase font-bold mb-1 text-[10px]">Date Sent</div>
                                    <div className="text-white font-bold">{new Date(selectedTransfer.transferDate).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 uppercase font-bold mb-1 text-[10px]">Status</div>
                                    <div className={`font-bold ${selectedTransfer.status === 'Received' ? 'text-emerald-400' : 'text-blue-400'}`}>{selectedTransfer.status}</div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-800/50">
                                        <tr className="text-[10px] text-gray-500 uppercase font-bold">
                                            <th className="px-4 py-3">Item</th>
                                            <th className="px-4 py-3 text-center">Qty / IMEI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {selectedTransfer.items?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3">
                                                    <div className="text-white font-medium text-sm">{item.productName}</div>
                                                    <div className="text-[10px] text-gray-500">{item.productCode}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {item.imei ? (
                                                        <code className="text-cyan-400 font-mono text-[10px] bg-cyan-900/20 px-1.5 py-0.5 rounded">{item.imei}</code>
                                                    ) : (
                                                        <span className="text-white font-bold text-sm">{item.qty}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-700 bg-gray-800/80">
                            <button 
                                onClick={() => setIsDetailModalOpen(false)}
                                className="w-full px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
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

export default TransferReport;
