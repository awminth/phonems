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
    Settings
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, SWR_CONFIG, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

const StockAdjustmentReport: React.FC = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [branchId, setBranchId] = useState('');
    
    const buildQuery = () => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        if (branchId && branchId !== 'all') params.append('branchId', branchId);
        return params.toString();
    };

    const { data, error, isLoading, mutate } = useSWR(
        `${API_ENDPOINTS.ADJUSTMENTS}?${buildQuery()}`,
        fetcher,
        SWR_CONFIG
    );

    const { data: branchData } = useSWR(
        sessionManager.getUserType() === 'admin' ? API_ENDPOINTS.BRANCHES : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const adjustments = data?.data || [];
    const pagination = data?.pagination || { total: 0, totalPages: 1 };
    const branches = branchData?.data || [];

    const handleExport = () => {
        if (adjustments.length === 0) return;
        const title = 'Stock Adjustment History Report';
        const headers = ['Date', 'Product', 'Code', 'Qty', 'Reason', 'Branch', 'IMEI', 'Adjusted By'];
        const excelData = adjustments.map((a: any) => [
            new Date(a.date).toLocaleDateString(),
            a.productName,
            a.codeNo,
            a.qty > 0 ? `+${a.qty}` : a.qty,
            a.reason,
            a.branchName,
            a.imei || '-',
            a.userName
        ]);
        exportStyledExcel(title, headers, excelData, `adjustment_report_${new Date().toISOString().split('T')[0]}.xlsx`, 'Adjustment History');
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between border-b border-gray-700 h-16 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/reports')} className="p-2 rounded-full hover:bg-gray-700 text-gray-300 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500">
                        <Settings size={20} />
                    </div>
                    <h1 className="text-xl font-bold">Stock Adjustment History</h1>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                <aside className="w-full lg:w-80 bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 shadow-xl">
                    <div className="flex items-center gap-2 text-blue-400 border-b border-gray-700 pb-2">
                        <Filter size={20} />
                        <h2 className="font-bold text-lg">Filters</h2>
                    </div>

                    <div className="space-y-4">
                        {sessionManager.getUserType() === 'admin' && (
                            <div>
                                <label className="text-sm font-medium text-gray-400 block mb-1">Branch</label>
                                <select 
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="all">All Branches</option>
                                    {branches.map((b: any) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Search</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Product, Code, IMEI..."
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">From</label>
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">To</label>
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
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
                                <Loader2 size={40} className="animate-spin text-blue-500" />
                            </div>
                        ) : adjustments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500 italic">
                                <Settings size={40} className="mb-2 opacity-20" />
                                No adjustment records found.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="bg-gray-900/50 sticky top-0 z-10">
                                    <tr className="text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                        <th className="p-4 text-center w-16">#</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Product</th>
                                        <th className="p-4 text-center">Qty</th>
                                        <th className="p-4">Reason</th>
                                        <th className="p-4">Branch</th>
                                        <th className="p-4">Adjusted By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {adjustments.map((item: any, index: number) => (
                                        <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                            <td className="p-4 text-center text-xs text-gray-500">{(page - 1) * limit + index + 1}</td>
                                            <td className="p-4 text-sm text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-gray-500" />
                                                    {new Date(item.date).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium text-white">{item.productName}</div>
                                                <div className="text-xs text-gray-500">{item.codeNo}</div>
                                                {item.imei && (
                                                    <div className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800 inline-block mt-1">
                                                        IMEI: {item.imei}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`text-sm font-bold px-2 py-1 rounded-full ${item.qty > 0 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                                                    {item.qty > 0 ? `+${item.qty}` : item.qty}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-400 max-w-xs truncate" title={item.reason}>{item.reason}</td>
                                            <td className="p-4 text-sm text-blue-400">{item.branchName}</td>
                                            <td className="p-4 text-sm text-gray-500">{item.userName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="mt-4 flex items-center justify-between shrink-0">
                        <div className="text-sm text-gray-500">
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} entries
                        </div>
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                                        let pageNum = page;
                                        if (page <= 3) pageNum = i + 1;
                                        else if (page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                                        else pageNum = page - 2 + i;

                                        if (pageNum <= 0 || pageNum > pagination.totalPages) return null;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-sm transition-colors ${page === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button 
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StockAdjustmentReport;
