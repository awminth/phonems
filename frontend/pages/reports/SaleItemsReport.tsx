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
    TrendingUp,
    Tag,
    ShoppingBag
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, SWR_CONFIG, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

const SaleItemsReport: React.FC = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [branchId, setBranchId] = useState('');
    const [customerId, setCustomerId] = useState('');
    
    const buildQuery = () => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        if (categoryId && categoryId !== 'all') params.append('categoryId', categoryId);
        if (branchId && branchId !== 'all') params.append('branchId', branchId);
        if (customerId && customerId !== 'all') params.append('customerId', customerId);
        return params.toString();
    };

    const { data, error, isLoading, mutate } = useSWR(
        `${API_ENDPOINTS.REPORT_SALE_ITEMS}?${buildQuery()}`,
        fetcher,
        SWR_CONFIG
    );

    const { data: branchData } = useSWR(
        sessionManager.getUserType() === 'admin' ? API_ENDPOINTS.BRANCHES : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const { data: categoryData } = useSWR(
        API_ENDPOINTS.CATEGORIES,
        fetcher,
        { revalidateOnFocus: false }
    );

    const { data: customerData } = useSWR(
        API_ENDPOINTS.CUSTOMERS_DROPDOWN,
        fetcher,
        { revalidateOnFocus: false }
    );

    const sales = data?.data || [];
    const totals = data?.totals || { qty: 0, amount: 0 };
    const pagination = data?.pagination || { total: 0, totalPages: 1 };
    const branches = branchData?.data || [];
    const categories = categoryData?.data || [];
    const customers = customerData?.data || [];

    const handleExport = () => {
        if (sales.length === 0) return;
        const title = 'Sale Items Report';
        const headers = ['Date', 'VNO', 'Item Name', 'Category', 'Branch', 'Customer', 'Qty', 'Price', 'Total', 'Purchase Price', 'Profit'];
        const excelData = sales.map((s: any) => [
            new Date(s.date).toLocaleDateString(),
            s.vno,
            s.itemName,
            s.categoryName || 'Uncategorized',
            s.branchName || '-',
            s.customerName || '-',
            s.qty,
            s.sellPrice,
            s.total,
            (s.purchasePrice || 0) * s.qty,
            s.profit || 0
        ]);
        
        // Add Summary Row
        excelData.push(['', '', '', '', '', 'TOTAL', totals.qty, '', totals.amount, totals.purchasePrice || 0, totals.profit || 0]);

        exportStyledExcel(title, headers, excelData, `sale_items_report_${new Date().toISOString().split('T')[0]}.xlsx`, 'Sale Items');
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between border-b border-gray-700 h-16 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/reports')} className="p-2 rounded-full hover:bg-gray-700 text-gray-300 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-500">
                        <ShoppingBag size={20} />
                    </div>
                    <h1 className="text-xl font-bold">Sale Items Report</h1>
                </div>

                <div className="flex items-center gap-6 text-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-gray-400 text-xs">Total Qty</span>
                        <span className="font-bold text-emerald-400">{totals.qty}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-gray-400 text-xs">Total Amount</span>
                        <span className="font-bold text-blue-400">{totals.amount.toLocaleString()} KS</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-gray-400 text-xs">Total Profit</span>
                        <span className={`font-bold ${(totals.profit || 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {(totals.profit || 0).toLocaleString()} KS
                        </span>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Sidebar Filters */}
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
                                    onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="all">All Branches</option>
                                    {branches.map((b: any) => (
                                        <option key={b.id} value={b.branchId}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Category</label>
                            <select 
                                value={categoryId}
                                onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                            >
                                <option value="all">All Categories</option>
                                <option value="none">Uncategorized</option>
                                {categories.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Customer</label>
                            <select 
                                value={customerId}
                                onChange={(e) => { setCustomerId(e.target.value); setPage(1); }}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                            >
                                <option value="all">All Customers</option>
                                {customers.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Search</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="text"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Item, VNO, Code..."
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-sm font-medium text-gray-400 block mb-1">From</label>
                                <input 
                                    type="date" 
                                    value={fromDate}
                                    onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400 block mb-1">To</label>
                                <input 
                                    type="date" 
                                    value={toDate}
                                    onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
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

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative p-4">
                    <div className="flex-1 overflow-auto bg-gray-800 rounded-xl border border-gray-700 shadow-lg text-xs md:text-sm">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 size={40} className="animate-spin text-blue-500" />
                            </div>
                        ) : sales.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500 italic">
                                <TrendingUp size={40} className="mb-2 opacity-20" />
                                No sale items found for the selected filters.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead className="bg-gray-900/50 sticky top-0 z-10 text-[10px] md:text-xs uppercase font-bold tracking-wider text-gray-400 border-b border-gray-700">
                                    <tr>
                                        <th className="p-4 text-center w-16">#</th>
                                        <th className="p-4">Date / VNO</th>
                                        <th className="p-4">Item Details</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Branch</th>
                                        <th className="p-4">Customer</th>
                                        <th className="p-4 text-right">Qty</th>
                                        <th className="p-4 text-right">Price</th>
                                        <th className="p-4 text-right font-bold">Total</th>
                                        <th className="p-4 text-right">Purchase Price</th>
                                        <th className="p-4 text-right font-bold">Profit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {sales.map((item: any, index: number) => (
                                        <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                            <td className="p-4 text-center text-xs text-gray-500">{(page - 1) * limit + index + 1}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-300 flex items-center gap-1.5">
                                                        <Calendar size={12} className="text-gray-500" />
                                                        {new Date(item.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </span>
                                                    <span className="text-xs font-mono text-blue-500">{item.vno}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium text-white">{item.itemName}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Tag size={10} /> {item.code}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-0.5 bg-gray-700 rounded-full text-[10px] text-gray-300">
                                                    {item.categoryName || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="px-2 py-1 bg-emerald-900/20 text-emerald-400 rounded border border-emerald-800/30 text-xs inline-block">
                                                    {item.branchName || '-'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-blue-300 font-medium">{item.customerName || '-'}</div>
                                            </td>
                                            <td className="p-4 text-right text-sm font-bold text-white">{item.qty}</td>
                                            <td className="p-4 text-right text-sm text-gray-400">{item.sellPrice.toLocaleString()}</td>
                                            <td className="p-4 text-right text-sm font-bold text-blue-400">{item.total.toLocaleString()}</td>
                                            <td className="p-4 text-right text-sm text-gray-350">{((item.purchasePrice || 0) * item.qty).toLocaleString()}</td>
                                            <td className={`p-4 text-right text-sm font-bold ${(item.profit || 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                                {(item.profit || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-900/30 font-bold border-t border-gray-700">
                                    <tr className="border-b border-gray-700/50">
                                        <td colSpan={6} className="p-4 text-right text-gray-400 uppercase text-xs">Total Page {page}</td>
                                        <td className="p-4 text-right text-emerald-400">{sales.reduce((sum: number, s: any) => sum + s.qty, 0)}</td>
                                        <td className="p-4"></td>
                                        <td className="p-4 text-right text-blue-400">{sales.reduce((sum: number, s: any) => sum + s.total, 0).toLocaleString()}</td>
                                        <td className="p-4 text-right text-gray-350">{sales.reduce((sum: number, s: any) => sum + (s.purchasePrice || 0) * s.qty, 0).toLocaleString()}</td>
                                        <td className="p-4 text-right text-blue-400">{sales.reduce((sum: number, s: any) => sum + (s.profit || 0), 0).toLocaleString()}</td>
                                    </tr>
                                    <tr className="bg-gray-900/60">
                                        <td colSpan={6} className="p-4 text-right text-gray-400 uppercase text-xs">Grand Total</td>
                                        <td className="p-4 text-right text-emerald-400">{totals.qty}</td>
                                        <td className="p-4"></td>
                                        <td className="p-4 text-right text-blue-400">{totals.amount.toLocaleString()}</td>
                                        <td className="p-4 text-right text-gray-350">{(totals.purchasePrice || 0).toLocaleString()}</td>
                                        <td className="p-4 text-right text-blue-400">{(totals.profit || 0).toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
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

export default SaleItemsReport;
