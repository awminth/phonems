import React, { useState, useCallback } from 'react';
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
    TrendingUp,
    Check,
    Eye,
    X,
    CreditCard
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

// Interfaces
interface ReceivableItem {
    id: string;
    vno: string;
    customerId: string;
    name: string;
    phone: string;
    totalAmount: number;
    balance: number;
    date: string;
    branchName?: string;
}

interface PaymentRecord {
    id: string;
    vno: string;
    amount: number;
    date: string;
    method: string;
    cashier: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface ReceivableReportResponse {
    success: boolean;
    data: ReceivableItem[];
    totals: {
        grandTotalCreditSales: number;
        grandTotalPaid: number;
        grandTotalBalance: number;
    };
    pagination: PaginationInfo;
    fromCache: boolean;
}

const ReceivableReport: React.FC = () => {
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
    const [selectedVoucher, setSelectedVoucher] = useState<{id: string, vno: string, name: string} | null>(null);
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

        return `${API_ENDPOINTS.REPORT_BALANCE_RECEIVABLE}?${params.toString()}`;
    }, [page, limit, appliedSearch, appliedBranch]);

    // SWR for receivable reports
    const { data, error, isLoading, mutate } = useSWR<ReceivableReportResponse>(
        buildQueryString(),
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    // SWR for customer payment history
    const { data: historyData, isLoading: isLoadingHistory } = useSWR<{success: boolean, data: PaymentRecord[]}>(
        isHistoryModalOpen && selectedVoucher ? API_ENDPOINTS.REPORT_BALANCE_RECEIVABLE_HISTORY(selectedVoucher.id) : null,
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
    const history = historyData?.data || [];
    const branches = branchData?.data || [];

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

    const openHistory = (voucher: {id: string, vno: string, name: string}) => {
        setSelectedVoucher(voucher);
        setIsHistoryModalOpen(true);
    };

    const closeHistory = () => {
        setIsHistoryModalOpen(false);
        setSelectedVoucher(null);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString();
    };

    // Export to Excel
    const exportToExcel = () => {

        const title = `Receivable Report (Credit Vouchers) - ${new Date().toLocaleDateString()}`;
        const headers = ["Voucher No", "Customer Name", "Date", "Total Amount", "Outstanding Balance"];
        
        const excelData = reports.map(item => [
            item.vno,
            item.name,
            formatDate(item.date),
            item.totalAmount,
            item.balance
        ]);

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `receivable_report_${timestamp}.xlsx`, 'Receivable Report');
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
                    <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-500">
                        <TrendingUp size={20} />
                    </div>
                    <h1 className="text-xl font-bold">Receivable Report (By Voucher)</h1>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                
                {/* Left Panel - Filters */}
                <aside className="w-full lg:w-80 bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto shrink-0 z-30 shadow-xl">
                    <div className="flex items-center gap-2 text-emerald-400 border-b border-gray-700 pb-2 sticky top-0 bg-gray-800 z-10">
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
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                                >
                                    <option value="all">All Branches</option>
                                    {branches.map((b: any) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Voucher or Customer</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search VNO or customer..."
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-2 space-y-2">
                            <button 
                                onClick={handleSearch}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
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
                                <Download size={16} /> Excel
                            </button>
                        </div>
                    </div>

                    {/* Totals Card */}
                    {totals && (
                        <div className="mt-auto pt-4 border-t border-gray-700 space-y-3">
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Outstanding</p>
                                <p className="text-2xl font-bold text-emerald-500">{totals.grandTotalBalance.toLocaleString()} <span className="text-xs font-normal">MMK</span></p>
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
                                {PAGINATION_CONFIG.LIMIT_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <span className="text-sm text-gray-400">entries</span>
                        </div>
                        
                        <div className="text-sm text-gray-400">
                            {pagination && (
                                <span>Total: <span className="text-white font-medium">{pagination.total}</span> vouchers</span>
                            )}
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-emerald-500" size={40} />
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                                <AlertTriangle className="mx-auto text-red-500 mb-2" size={40} />
                                <p className="text-red-400">Failed to load receivable report.</p>
                                <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Retry</button>
                            </div>
                        </div>
                    )}

                    {/* Table Content */}
                    {!isLoading && !error && (
                        <div className="flex-1 overflow-auto p-4">
                            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden min-w-[800px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                            <th className="p-4 w-16 text-center whitespace-nowrap">No</th>
                                            <th className="p-4 whitespace-nowrap">Voucher No</th>
                                            {sessionManager.getUserType() === 'admin' && <th className="p-4 whitespace-nowrap">Branch</th>}
                                            <th className="p-4 whitespace-nowrap">Customer</th>
                                            <th className="p-4 whitespace-nowrap">Date</th>
                                            <th className="p-4 text-right whitespace-nowrap">Total Amount</th>
                                            <th className="p-4 text-right whitespace-nowrap">Balance</th>
                                            <th className="p-4 text-center whitespace-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {reports.length > 0 ? (
                                            reports.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                                    <td className="p-4 text-center text-gray-500">
                                                        {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-emerald-400">{item.vno}</td>
                                                    {sessionManager.getUserType() === 'admin' && (
                                                        <td className="p-4 text-sm font-bold text-blue-300">
                                                            {item.branchName || '-'}
                                                        </td>
                                                    )}
                                                    <td className="p-4 text-sm font-medium text-white flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                                            <Users size={14} />
                                                        </div>
                                                        {item.name}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-400">{formatDate(item.date)}</td>
                                                    <td className="p-4 text-sm text-right text-gray-300 font-medium">{item.totalAmount.toLocaleString()}</td>
                                                    <td className="p-4 text-sm text-right">
                                                        <span className="px-2 py-1 rounded font-bold text-emerald-400 bg-emerald-900/20">
                                                            {item.balance.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => openHistory({id: item.id, vno: item.vno, name: item.name})}
                                                            className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="View Payments"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={sessionManager.getUserType() === 'admin' ? 8 : 7} className="p-8 text-center text-gray-500">
                                                    No credit vouchers found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination */}
                            {pagination && pagination.total > 0 && (
                                <div className="mt-4 flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700">
                                    <span className="text-sm text-gray-400">
                                        Page <span className="text-white font-medium">{pagination.page}</span> of <span className="text-white font-medium">{pagination.totalPages}</span>
                                    </span>
                                    
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setPage(page - 1)}
                                            disabled={!pagination.hasPrev}
                                            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button 
                                            onClick={() => setPage(page + 1)}
                                            disabled={!pagination.hasNext}
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

            {/* History Modal */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{selectedVoucher?.vno}</h3>
                                    <p className="text-xs text-gray-400">Credit Payment History - {selectedVoucher?.name}</p>
                                </div>
                            </div>
                            <button onClick={closeHistory} className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-gray-700 pb-2">
                                <Check size={18} />
                                Payments Received
                            </div>
                            {isLoadingHistory ? (
                                <div className="flex-1 flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                                </div>
                            ) : history.length > 0 ? (
                                <div className="space-y-3">
                                    {history.map(payment => (
                                        <div key={payment.id} className="bg-gray-900/50 border border-gray-700 p-4 rounded-xl flex justify-between items-center group hover:border-emerald-500/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-emerald-500/10 p-3 rounded-full text-emerald-500">
                                                    <CreditCard size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium mb-0.5">{formatDate(payment.date)}</p>
                                                    <p className="text-sm font-bold text-white uppercase tracking-tight">Paid via {payment.method}</p>
                                                    <p className="text-[10px] text-gray-400 italic">Cashier: {payment.cashier}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-emerald-400 font-black text-lg">-{payment.amount.toLocaleString()} <span className="text-[10px] font-normal">MMK</span></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                                    <AlertTriangle size={48} className="mb-4 opacity-20" />
                                    <p>No payment records found for this voucher.</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end">
                            <button 
                                onClick={closeHistory}
                                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
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

export default ReceivableReport;
