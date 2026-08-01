import React, { useState, useCallback, useMemo } from 'react';
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
    AlertTriangle,
    Users,
    TrendingDown,
    Eye,
    X,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    FileText,
    CreditCard,
    ChevronDown
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

// Interfaces
interface PayableItem {
    id: string;
    vno: string;
    name: string;
    phone: string;
    totalPurchases: number;
    totalPaid: number;
    balance: number;
    date: string;
    supplierId: string;
    branchName?: string;
}

interface PaymentRecord {
    id: string;
    amount: number;
    date: string;
    cashier: string;
}

interface PurchaseRecord {
    id: string;
    amount: number;
    date: string;
    purchaseId: string;
}

interface SupplierHistory {
    payments: PaymentRecord[];
    purchases: PurchaseRecord[];
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface PayableReportResponse {
    success: boolean;
    data: PayableItem[];
    totals: {
        grandTotalPurchases: number;
        grandTotalPaid: number;
        grandTotalBalance: number;
    };
    pagination: PaginationInfo;
    fromCache: boolean;
}

const PayableReport: React.FC = () => {
    const navigate = useNavigate();
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [appliedBranch, setAppliedBranch] = useState('');
    
    // Pagination
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);

    // History Modal
    const [selectedSupplier, setSelectedSupplier] = useState<PayableItem | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Build query string for SWR
    const buildQueryString = useCallback(() => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (appliedSearch) params.append('search', appliedSearch);

        const userType = sessionManager.getUserType();
        const branchId = userType === 'admin' ? (appliedBranch || 'all') : (sessionManager.getBranchId() || 'all');
        if (branchId !== 'all') params.append('branchId', branchId);

        return `${API_ENDPOINTS.REPORT_BALANCE_PAYABLE}?${params.toString()}`;
    }, [page, limit, appliedSearch, appliedBranch]);

    // SWR for payable reports
    const { data, error, isLoading, mutate } = useSWR<PayableReportResponse>(
        buildQueryString(),
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    // SWR for supplier history
    const { data: historyData, isLoading: isLoadingHistory } = useSWR<{success: boolean, data: SupplierHistory}>(
        isHistoryModalOpen && selectedSupplier ? API_ENDPOINTS.REPORT_BALANCE_PAYABLE_HISTORY(selectedSupplier.supplierId) : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    // SWR for branches (only admin)
    const { data: branchData } = useSWR<{ success: boolean; data: any[] }>(
        sessionManager.getUserType() === 'admin' ? API_ENDPOINTS.BRANCHES : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

    const reports = data?.data || [];
    const totals = data?.totals;
    const pagination = data?.pagination;
    const history = historyData?.data;
    const branches = branchData?.data || [];

    // Combined and sorted history for the table view
    const combinedHistory = useMemo(() => {
        if (!history) return [];
        const combined = [
            ...(history.purchases || []).map(p => ({ ...p, type: 'Purchase' as const })),
            ...(history.payments || []).map(p => ({ ...p, type: 'Payment' as const }))
        ];
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [history]);

    // Apply filters
    const handleSearch = () => {
        setAppliedSearch(searchTerm);
        setAppliedBranch(branchFilter);
        setPage(1);
    };

    // Reset filters
    const handleReset = () => {
        setSearchTerm('');
        setAppliedSearch('');
        setBranchFilter('');
        setAppliedBranch('');
        setPage(1);
        mutate();
    };

    const openHistory = (item: PayableItem) => {
        setSelectedSupplier(item);
        setIsHistoryModalOpen(true);
    };

    const closeHistory = () => {
        setIsHistoryModalOpen(false);
        setSelectedSupplier(null);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString();
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Export to Excel
    const exportToExcel = () => {
        const title = `Payable Report (Supplier Balances) - ${new Date().toLocaleDateString()}`;
        const headers = ["Supplier Name", "Phone", "Total Purchase", "Total Paid", "Outstanding Balance"];
        
        const excelData = reports.map(item => [
            item.name,
            item.phone || '-',
            item.totalPurchases,
            item.totalPaid,
            item.balance
        ]);

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `payable_report_${timestamp}.xlsx`, 'Payable Report');
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
                    <div className="bg-red-500/20 p-2 rounded-lg text-red-500">
                        <TrendingDown size={20} />
                    </div>
                    <h1 className="text-xl font-bold">Payable Report</h1>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                
                {/* Left Panel - Filters */}
                <aside className="w-full lg:w-80 bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto shrink-0 z-30 shadow-xl">
                    <div className="flex items-center gap-2 text-red-400 border-b border-gray-700 pb-2 sticky top-0 bg-gray-800 z-10">
                        <Filter size={20} />
                        <h2 className="font-bold text-lg">Filters</h2>
                    </div>

                    <div className="space-y-4">
                        {sessionManager.getUserType() === 'admin' && (
                            <div>
                                <label className="text-sm font-medium text-gray-400 block mb-1">Shop / Branch</label>
                                <select 
                                    value={branchFilter}
                                    onChange={(e) => setBranchFilter(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                                >
                                    <option value="all">All Branches</option>
                                    {branches.map((b: any) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Supplier Name</label>
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search VNO or supplier..."
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>

                        <div className="pt-2 space-y-2">
                            <button onClick={handleSearch} className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg flex items-center justify-center gap-2">
                                <Search size={16} /> Search
                            </button>
                            <button onClick={handleReset} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                <RefreshCw size={16} /> Reset
                            </button>
                            <button onClick={exportToExcel} disabled={reports.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                <Download size={16} /> Excel
                            </button>
                        </div>
                    </div>

                    {/* Totals Sidebar Card */}
                    {totals && (
                        <div className="mt-auto pt-4 border-t border-gray-700 space-y-3">
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Outstanding</p>
                                <p className="text-2xl font-bold text-red-500">{(totals.grandTotalBalance || 0).toLocaleString()} <span className="text-xs font-normal">MMK</span></p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700 text-center">
                                    <p className="text-gray-400 mb-1">Total Purchases</p>
                                    <p className="text-white font-bold">{(totals.grandTotalPurchases || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700 text-center">
                                    <p className="text-gray-400 mb-1">Total Paid</p>
                                    <p className="text-emerald-400 font-bold">{(totals.grandTotalPaid || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Right Panel - Table */}
                <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative">
                    {/* Top Bar */}
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 z-20">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">Show</span>
                            <select 
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
                            >
                                {PAGINATION_CONFIG.LIMIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <span className="text-sm text-gray-400">entries</span>
                        </div>
                        <div className="text-sm text-gray-400">
                            {pagination && <span>Total: <span className="text-white font-medium">{pagination.total}</span> suppliers</span>}
                        </div>
                    </div>

                    {/* Main Table */}
                    <div className="flex-1 overflow-auto p-4">
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center py-20">
                                <Loader2 className="animate-spin text-red-500" size={40} />
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 text-red-400">Failed to load data.</div>
                        ) : (
                            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden min-w-[800px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                            <th className="p-4 w-16 text-center whitespace-nowrap">No</th>
                                            <th className="p-4 whitespace-nowrap">Voucher No</th>
                                            {sessionManager.getUserType() === 'admin' && <th className="p-4 whitespace-nowrap">Branch</th>}
                                            <th className="p-4 whitespace-nowrap">Supplier Name</th>
                                            <th className="p-4 whitespace-nowrap">Date</th>
                                            <th className="p-4 text-right whitespace-nowrap">Total Amount</th>
                                            <th className="p-4 text-right whitespace-nowrap">Total Paid</th>
                                            <th className="p-4 text-right whitespace-nowrap">Balance</th>
                                            <th className="p-4 text-center whitespace-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {reports.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                                <td className="p-4 text-center text-gray-500">{(page - 1) * limit + index + 1}</td>
                                                <td className="p-4 text-sm font-bold text-red-400 font-mono">{item.vno}</td>
                                                {sessionManager.getUserType() === 'admin' && (
                                                    <td className="p-4 text-sm font-bold text-blue-300">
                                                        {item.branchName || '-'}
                                                    </td>
                                                )}
                                                <td className="p-4 text-sm font-bold text-white flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                                        <Users size={14} />
                                                    </div>
                                                    {item.name}
                                                </td>
                                                <td className="p-4 text-sm text-gray-400">{formatDate(item.date)}</td>
                                                <td className="p-4 text-sm text-right text-gray-300">{(item.totalPurchases || 0).toLocaleString()}</td>
                                                <td className="p-4 text-sm text-right text-emerald-400">{(item.totalPaid || 0).toLocaleString()}</td>
                                                <td className="p-4 text-sm text-right font-bold text-red-400">{(item.balance || 0).toLocaleString()}</td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => openHistory(item)} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded-lg">
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Grand Total Row in Table */}
                                        {totals && reports.length > 0 && (
                                            <tr className="bg-gray-900/80 font-black border-t-2 border-gray-600">
                                                <td colSpan={sessionManager.getUserType() === 'admin' ? 5 : 4} className="p-4 text-right text-gray-400 uppercase tracking-widest text-xs">Grand Total:</td>
                                                <td className="p-4 text-right text-white">{(totals.grandTotalPurchases || 0).toLocaleString()}</td>
                                                <td className="p-4 text-right text-emerald-400">{(totals.grandTotalPaid || 0).toLocaleString()}</td>
                                                <td className="p-4 text-right text-red-500 text-lg">{(totals.grandTotalBalance || 0).toLocaleString()}</td>
                                                <td></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* History Detail Modal - Redesigned to Table View */}
            {isHistoryModalOpen && selectedSupplier && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
                        
                        {/* Modal Header */}
                        <div className="p-6 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/40">
                                    <Users size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedSupplier.name}</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={12} className="text-blue-500" /> Transaction Audit Trail
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeHistory} className="bg-gray-800 text-gray-400 hover:text-white p-2 rounded-xl transition-all border border-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Summary Totals */}
                        <div className="bg-gray-900/50 p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-700">
                            <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                                <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase mb-2">
                                    <ArrowUpRight size={14} className="text-red-400" /> Total Purchases
                                </div>
                                <p className="text-2xl font-black text-white">{(selectedSupplier.totalPurchases || 0).toLocaleString()} <span className="text-xs font-normal opacity-50">MMK</span></p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                                <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase mb-2">
                                    <ArrowDownLeft size={14} className="text-emerald-400" /> Total Paid
                                </div>
                                <p className="text-2xl font-black text-emerald-400">{(selectedSupplier.totalPaid || 0).toLocaleString()} <span className="text-xs font-normal opacity-50">MMK</span></p>
                            </div>
                            <div className="bg-red-600/10 p-4 rounded-2xl border border-red-500/20">
                                <div className="flex items-center gap-2 text-xs text-red-400 font-bold uppercase mb-2">
                                    <CreditCard size={14} /> Outstanding Balance
                                </div>
                                <p className="text-2xl font-black text-red-500">{(selectedSupplier.balance || 0).toLocaleString()} <span className="text-xs font-normal opacity-50">MMK</span></p>
                            </div>
                        </div>

                        {/* Modal Content - Table View */}
                        <div className="flex-1 overflow-auto p-6">
                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-red-500" size={48} />
                                </div>
                            ) : combinedHistory.length > 0 ? (
                                <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-inner">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-800 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-700">
                                            <tr>
                                                <th className="p-4">Date & Time</th>
                                                <th className="p-4">Type</th>
                                                <th className="p-4">Voucher No</th>
                                                <th className="p-4">Staff / Cashier</th>
                                                <th className="p-4 text-right">Debit (+)</th>
                                                <th className="p-4 text-right">Credit (-)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {combinedHistory.map((item: any, idx) => (
                                                <tr key={idx} className="hover:bg-gray-800/50 transition-colors group">
                                                    <td className="p-4 text-sm text-gray-300">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} className="text-gray-500" />
                                                            {formatDateTime(item.date)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            item.type === 'Purchase' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        }`}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm font-mono font-bold text-gray-200">
                                                        {item.vno || (item.type === 'Purchase' ? `PUR-${item.purchaseId}` : `PAY-${String(item.id).substring(0, 6).toUpperCase()}`)}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-400 font-medium">
                                                        {item.cashier || 'System'}
                                                    </td>
                                                    <td className="p-4 text-right font-black text-red-400">
                                                        {item.type === 'Purchase' ? `+${(item.amount || 0).toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="p-4 text-right font-black text-emerald-400">
                                                        {item.type === 'Payment' ? `-${(item.amount || 0).toLocaleString()}` : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-600 italic">No transaction history found.</div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end">
                            <button onClick={closeHistory} className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all border border-gray-700">
                                Close Explorer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayableReport;
