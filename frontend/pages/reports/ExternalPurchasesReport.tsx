import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Search, 
    Download, 
    ChevronLeft, 
    ChevronRight,
    Filter,
    Loader2,
    RefreshCw,
    ShoppingBag,
    DollarSign,
    TrendingUp,
    Hash
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

// Interfaces
interface ExternalPurchaseItem {
    id: number;
    ticketId: number;
    ticketNo: string;
    customerName: string;
    customerPhone: string;
    partName: string;
    qty: number;
    cost: number;
    price: number;
    totalAmount: number;
    totalCost: number;
    profit: number;
    date: string;
    branchName?: string;
}

interface SummaryInfo {
    total: number;
    totalQty: number;
    totalCost: number;
    totalRevenue: number;
    totalProfit: number;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface ReportResponse {
    success: boolean;
    data: ExternalPurchaseItem[];
    summary: SummaryInfo;
    pagination: PaginationInfo;
}

const ExternalPurchasesReport: React.FC = () => {
    const navigate = useNavigate();
    
    // Filters
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        fromDate: '',
        toDate: '',
        search: '',
        branchId: ''
    });
    
    // Pagination
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);

    // SWR for branches (only admin)
    const { data: branchData } = useSWR<{ success: boolean; data: any[] }>(
        sessionManager.getUserType() === 'admin' ? API_ENDPOINTS.BRANCHES : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

    // Build query string for SWR
    const buildQueryString = useCallback(() => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (appliedFilters.search) params.append('search', appliedFilters.search);
        if (appliedFilters.fromDate) params.append('fromDate', appliedFilters.fromDate);
        if (appliedFilters.toDate) params.append('toDate', appliedFilters.toDate);
        
        const userType = sessionManager.getUserType();
        const branchId = userType === 'admin' ? (appliedFilters.branchId || 'all') : (sessionManager.getBranchId() || 'all');
        if (branchId !== 'all') params.append('branchId', branchId);

        return `${API_ENDPOINTS.REPORT_EXTERNAL_PURCHASES}?${params.toString()}`;
    }, [page, limit, appliedFilters]);

    // SWR for report data
    const { data, error, isLoading, mutate } = useSWR<ReportResponse>(
        buildQueryString(),
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    const reports = data?.data || [];
    const summary = data?.summary || { total: 0, totalQty: 0, totalCost: 0, totalRevenue: 0, totalProfit: 0 };
    const pagination = data?.pagination;
    const branches = branchData?.data || [];

    // Apply filters
    const handleSearch = () => {
        setAppliedFilters({
            fromDate,
            toDate,
            search: searchTerm,
            branchId: branchFilter
        });
        setPage(1);
    };

    // Reset filters
    const handleReset = () => {
        setFromDate('');
        setToDate('');
        setSearchTerm('');
        setBranchFilter('');
        setAppliedFilters({
            fromDate: '',
            toDate: '',
            search: '',
            branchId: ''
        });
        setPage(1);
        mutate();
    };

    // Export to Excel
    const exportToExcel = () => {
        const title = `External Purchases Report (${appliedFilters.fromDate || 'All'} to ${appliedFilters.toDate || 'Today'})`;
        const headers = ["Date", "Ticket No", "Branch", "Customer Name", "Customer Phone", "Part Name", "Qty", "Cost (Ks)", "Price (Ks)", "Total Cost (Ks)", "Total Price (Ks)", "Profit (Ks)"];
        
        const excelData = reports.map(item => [
            item.date ? new Date(item.date).toLocaleDateString() : '',
            item.ticketNo,
            item.branchName || '-',
            item.customerName || 'Walk-in',
            item.customerPhone || '-',
            item.partName,
            item.qty,
            item.cost,
            item.price,
            item.totalCost,
            item.totalAmount,
            item.profit
        ]);

        excelData.push([
            '', '', 'TOTAL:', '', '', '',
            summary.totalQty,
            '', '',
            summary.totalCost,
            summary.totalRevenue,
            summary.totalProfit
        ]);

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `external_purchases_${timestamp}.xlsx`, 'External Purchases');
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-700 sticky top-0 z-40 shrink-0 h-16">
                <button 
                    onClick={() => navigate('/reports')}
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-rose-500/20 p-2 rounded-lg text-rose-500">
                        <ShoppingBag size={20} />
                    </div>
                    <h1 className="text-xl font-bold">External Purchases Report</h1>
                </div>
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
                            <label className="text-sm font-medium text-gray-400 block mb-1">Search Keyword</label>
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Part Name / Ticket No..."
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">From Date</label>
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">To Date</label>
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

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
                                <Download size={16} /> Export to Excel
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Right Panel - Stats and Table */}
                <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative">
                    
                    {/* Stats Dashboard */}
                    <div className="p-4 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-900/50 border-b border-gray-800">
                        {/* Stat 1: Total Cost */}
                        <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700/50 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Cost</p>
                                <p className="text-lg md:text-xl font-bold mt-0.5">{summary.totalCost.toLocaleString()} Ks</p>
                            </div>
                        </div>

                        {/* Stat 2: Total Revenue */}
                        <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700/50 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Revenue</p>
                                <p className="text-lg md:text-xl font-bold mt-0.5">{summary.totalRevenue.toLocaleString()} Ks</p>
                            </div>
                        </div>

                        {/* Stat 3: Estimated Profit */}
                        <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700/50 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Est. Profit</p>
                                <p className="text-lg md:text-xl font-bold mt-0.5 text-emerald-400">{summary.totalProfit.toLocaleString()} Ks</p>
                            </div>
                        </div>

                        {/* Stat 4: Total Parts Qty */}
                        <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700/50 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                                <Hash size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Quantity</p>
                                <p className="text-lg md:text-xl font-bold mt-0.5">{summary.totalQty.toLocaleString()} units</p>
                            </div>
                        </div>
                    </div>

                    {/* Table Control */}
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/30">
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

                    {/* SWR Loading State */}
                    {isLoading && (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-rose-500" size={40} />
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                                <p className="text-red-400 font-medium">Failed to load report data.</p>
                                <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-2 mx-auto">
                                    <RefreshCw size={16} /> Retry
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Table View */}
                    {!isLoading && !error && (
                        <div className="flex-1 overflow-auto p-4">
                            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                                <div className="overflow-x-auto font-sans">
                                    <table className="w-full text-left border-collapse min-w-[1200px]">
                                        <thead>
                                            <tr className="bg-gray-900/60 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                                <th className="p-4 w-16 text-center">No</th>
                                                <th className="p-4">Date</th>
                                                <th className="p-4">Ticket No</th>
                                                {sessionManager.getUserType() === 'admin' && <th className="p-4">Branch</th>}
                                                <th className="p-4">Customer Name</th>
                                                <th className="p-4">Customer Phone</th>
                                                <th className="p-4 font-semibold text-blue-400">Part / Item Name</th>
                                                <th className="p-4 text-center">Qty</th>
                                                <th className="p-4 text-right">Cost</th>
                                                <th className="p-4 text-right">Price</th>
                                                <th className="p-4 text-right font-medium text-orange-400">Total Cost</th>
                                                <th className="p-4 text-right font-medium text-blue-400">Total Price</th>
                                                <th className="p-4 text-right font-medium text-emerald-400">Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/60">
                                            {reports.length > 0 ? (
                                                <>
                                                    {reports.map((item, index) => (
                                                        <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                                            <td className="p-4 text-center text-gray-500">
                                                                {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                                                            </td>
                                                            <td className="p-4 text-sm text-gray-300 whitespace-nowrap">{formatDate(item.date)}</td>
                                                            <td className="p-4 font-mono text-xs font-semibold text-blue-400">{item.ticketNo}</td>
                                                            {sessionManager.getUserType() === 'admin' && (
                                                                <td className="p-4 text-sm font-bold text-blue-300">{item.branchName || '-'}</td>
                                                            )}
                                                            <td className="p-4 text-sm font-medium text-white">{item.customerName || 'Walk-in'}</td>
                                                            <td className="p-4 text-sm text-gray-400">{item.customerPhone || '-'}</td>
                                                            <td className="p-4 text-sm font-medium text-white max-w-[200px] truncate" title={item.partName}>{item.partName}</td>
                                                            <td className="p-4 text-sm text-center text-white font-semibold">{item.qty}</td>
                                                            <td className="p-4 text-sm text-right text-gray-300">{item.cost.toLocaleString()}</td>
                                                            <td className="p-4 text-sm text-right text-gray-300">{item.price.toLocaleString()}</td>
                                                            <td className="p-4 text-sm text-right text-orange-300 font-semibold">{item.totalCost.toLocaleString()}</td>
                                                            <td className="p-4 text-sm text-right text-blue-300 font-semibold">{item.totalAmount.toLocaleString()}</td>
                                                            <td className="p-4 text-sm text-right text-emerald-400 font-bold">{(item.profit).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    {/* Total Row */}
                                                    <tr className="bg-gray-750 font-bold text-white border-t-2 border-gray-600">
                                                        <td colSpan={sessionManager.getUserType() === 'admin' ? 6 : 5} className="p-4 text-right text-gray-400 text-sm">TOTAL:</td>
                                                        <td className="p-4"></td>
                                                        <td className="p-4 text-center text-purple-400 font-bold">{summary.totalQty.toLocaleString()}</td>
                                                        <td className="p-4 text-right"></td>
                                                        <td className="p-4 text-right"></td>
                                                        <td className="p-4 text-right text-orange-400 font-bold">{summary.totalCost.toLocaleString()}</td>
                                                        <td className="p-4 text-right text-blue-400 font-bold">{summary.totalRevenue.toLocaleString()}</td>
                                                        <td className="p-4 text-right text-emerald-400 font-bold">{summary.totalProfit.toLocaleString()}</td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <tr>
                                                    <td colSpan={sessionManager.getUserType() === 'admin' ? 13 : 12} className="p-8 text-center text-gray-500">
                                                        No external purchase records found for this criteria.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination controls */}
                            {pagination && pagination.total > 0 && (
                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
                                    <span className="text-sm text-gray-400">
                                        Page <span className="text-white font-medium">{pagination.page}</span> of <span className="text-white font-medium">{pagination.totalPages}</span>
                                    </span>
                                    
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 1}
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
                                                                ? 'bg-rose-600 text-white shadow-lg' 
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
                                            disabled={page === pagination.totalPages}
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
        </div>
    );
};

export default ExternalPurchasesReport;
