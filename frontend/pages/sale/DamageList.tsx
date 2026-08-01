import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Search, 
    Plus, 
    Trash2, 
    ChevronLeft, 
    ChevronRight, 
    Filter, 
    RefreshCw, 
    Loader2,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, SWR_CONFIG, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

const DamageList: React.FC = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [branchId, setBranchId] = useState('');
    const isAdmin = sessionManager.getUserType() === 'admin';
    
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
        `${API_ENDPOINTS.DAMAGES}?${buildQuery()}`,
        fetcher,
        SWR_CONFIG
    );

    const { data: branchData } = useSWR(
        sessionManager.getUserType() === 'admin' ? API_ENDPOINTS.BRANCHES : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const damages = data?.data || [];
    const pagination = data?.pagination || { total: 0, totalPages: 1 };
    const branches = branchData?.data || [];

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this record and restore stock?')) return;
        
        try {
            const result = await apiClient.delete(API_ENDPOINTS.DAMAGE_BY_ID(id));
            if (result.success) {
                mutate();
            } else {
                alert(result.message || 'Failed to delete');
            }
        } catch (err) {
            console.error('Delete damage error:', err);
            alert('An error occurred while deleting');
        }
    };

    const handleExport = () => {
        if (damages.length === 0) return;
        const title = 'Damage Inventory Report';
        const headers = ['Date', 'Product', 'Code', 'Qty', 'Reason', 'Branch', 'IMEI', 'Reported By'];
        const excelData = damages.map((d: any) => [
            new Date(d.date).toLocaleDateString(),
            d.productName,
            d.codeNo,
            d.qty,
            d.reason,
            d.branchName,
            d.imei || '-',
            d.userName
        ]);
        exportStyledExcel(title, headers, excelData, `damage_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between border-b border-gray-700 h-16 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/sale')} className="p-2 rounded-full hover:bg-gray-700 text-gray-300">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Damage Inventory</h1>
                </div>
                {!isAdmin && (
                    <button 
                        onClick={() => navigate('/sale/damage/new')}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus size={18} /> Report Damage
                    </button>
                )}
            </header>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                <aside className="w-full lg:w-80 bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 shadow-xl">
                    <div className="flex items-center gap-2 text-orange-400 border-b border-gray-700 pb-2">
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
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
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
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">From</label>
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">To</label>
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
                                Export Excel
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative p-4">
                    <div className="flex-1 overflow-auto bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 size={40} className="animate-spin text-orange-500" />
                            </div>
                        ) : damages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500 italic">
                                <AlertCircle size={40} className="mb-2 opacity-20" />
                                No damage records found.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="bg-gray-900/50 sticky top-0 z-10">
                                    <tr className="text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Product</th>
                                        <th className="p-4">Qty</th>
                                        <th className="p-4">Reason</th>
                                        <th className="p-4">Branch</th>
                                        <th className="p-4">Reported By</th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {damages.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                            <td className="p-4 text-sm text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-gray-500" />
                                                    {new Date(item.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium text-white">{item.productName}</div>
                                                <div className="text-xs text-gray-500">{item.codeNo}</div>
                                                {item.imei && (
                                                    <div className="text-[10px] bg-orange-900/30 text-orange-400 px-1.5 py-0.5 rounded border border-orange-800 inline-block mt-1">
                                                        IMEI: {item.imei}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm font-bold text-orange-400">{item.qty}</td>
                                            <td className="p-4 text-sm text-gray-400">{item.reason}</td>
                                            <td className="p-4 text-sm text-blue-400">{item.branchName}</td>
                                            <td className="p-4 text-sm text-gray-500">{item.userName}</td>
                                            <td className="p-4 text-center">
                                             {sessionManager.getUserType() !== 'user' && (
                                                 <button 
                                                     onClick={() => handleDelete(item.id)}
                                                     className="p-2 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors"
                                                     title="Delete & Restore Stock"
                                                 >
                                                     <Trash2 size={16} />
                                                 </button>
                                             )}

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
        </div>
    );
};

export default DamageList;
