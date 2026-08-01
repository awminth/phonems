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
    Users,
    FileText,
    Eye,
    X
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, SWR_CONFIG, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';
import Voucher from '../../components/Voucher';

const SalespersonReport: React.FC = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [userId, setUserId] = useState('all');
    const [paymentType, setPaymentType] = useState('all');
    const [branchId, setBranchId] = useState('');

    // Modal State
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printVNO, setPrintVNO] = useState('');
    
    const buildQuery = () => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        if (userId && userId !== 'all') params.append('userId', userId);
        if (paymentType && paymentType !== 'all') params.append('paymentType', paymentType);
        
        // Admin branch filter
        const currentBranch = sessionManager.getUserType() === 'admin' ? (branchId || 'all') : (sessionManager.getBranchId() || 'all');
        if (currentBranch && currentBranch !== 'all') params.append('branchId', currentBranch);
        
        return params.toString();
    };

    // Vouchers data SWR
    const { data, error, isLoading, mutate } = useSWR(
        `${API_ENDPOINTS.REPORT_SALESPERSON}?${buildQuery()}`,
        fetcher,
        SWR_CONFIG
    );

    // Users list for dropdown (Salespeople list)
    const { data: usersData } = useSWR(
        `${API_ENDPOINTS.USERS}?limit=9999`,
        fetcher,
        { revalidateOnFocus: false }
    );

    // Branches list for admin filter
    const { data: branchData } = useSWR(
        sessionManager.getUserType() === 'admin' ? API_ENDPOINTS.BRANCHES : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    // Voucher details for printing modal
    const { data: voucherData, error: voucherError, isLoading: isLoadingVoucher } = useSWR(
        isPrintModalOpen && printVNO ? `${API_ENDPOINTS.SALE_LIST_VOUCHER(printVNO)}` : null,
        fetcher
    );

    const isAdmin = sessionManager.getUserType() === 'admin';
    const vouchers = data?.data || [];
    const totals = data?.totals || {};
    const pagination = data?.pagination || { total: 0, totalPages: 1 };
    const users = usersData?.data || [];
    const branches = branchData?.data || [];
    const voucherDetails = voucherData?.data || null;

    const handleExport = () => {
        if (vouchers.length === 0) return;
        const title = 'Salesperson Sales Report';
        
        let headers = ['Date', 'Voucher No', 'Customer Name', 'Payment Type', 'Total Qty', 'Sub Total', 'Discount', 'Tax', 'Total Amount', 'Cashier'];
        if (isAdmin) {
            headers.splice(9, 0, 'Branch');
        }

        const excelData = vouchers.map((v: any) => {
            const row = [
                new Date(v.date).toLocaleDateString(),
                v.vno,
                v.customerName || 'General',
                v.paymentType,
                v.totalQty,
                v.subTotal,
                v.discount,
                v.tax,
                v.total,
                v.cashier
            ];
            if (isAdmin) {
                row.splice(9, 0, v.branchName);
            }
            return row;
        });

        // Add summary totals row at the end
        const totalsRow = [
            'TOTAL:', '', '', '', 
            vouchers.reduce((acc: number, item: any) => acc + (item.totalQty || 0), 0),
            totals.totalSubTotal || 0,
            totals.totalDiscount || 0,
            totals.totalTax || 0,
            totals.totalAmount || 0,
            ''
        ];
        if (isAdmin) {
            totalsRow.splice(9, 0, '');
        }
        excelData.push(totalsRow);

        exportStyledExcel(title, headers, excelData, `salesperson_report_${new Date().toISOString().split('T')[0]}.xlsx`, 'Salesperson Report');
    };

    const handleViewVoucher = (vno: string) => {
        setPrintVNO(vno);
        setIsPrintModalOpen(true);
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between border-b border-gray-700 h-16 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/reports')} className="p-2 rounded-full hover:bg-gray-700 text-gray-300 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="bg-teal-500/20 p-2 rounded-lg text-teal-500">
                        <Users size={20} />
                    </div>
                    <h1 className="text-xl font-bold">Salesperson Report</h1>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                <aside className="w-full lg:w-80 bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 shadow-xl">
                    <div className="flex items-center gap-2 text-teal-400 border-b border-gray-700 pb-2">
                        <Filter size={20} />
                        <h2 className="font-bold text-lg">Filters</h2>
                    </div>

                    <div className="space-y-4">
                        {isAdmin && (
                            <div>
                                <label className="text-sm font-medium text-gray-400 block mb-1">Branch</label>
                                <select 
                                    value={branchId}
                                    onChange={(e) => {
                                        setBranchId(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500 transition-colors"
                                >
                                    <option value="all">All Branches</option>
                                    {branches.map((b: any) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Salesperson</label>
                            <select 
                                value={userId}
                                onChange={(e) => {
                                    setUserId(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500 transition-colors"
                            >
                                <option value="all">All Salespeople</option>
                                {users.map((u: any) => (
                                    <option key={u.id} value={u.id}>{u.username}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Payment Type</label>
                            <select 
                                value={paymentType}
                                onChange={(e) => {
                                    setPaymentType(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500 transition-colors"
                            >
                                <option value="all">All Types</option>
                                <option value="Cash">Cash</option>
                                <option value="Credit">Credit</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Search Voucher</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Search VNO..."
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-teal-500 transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">From Date</label>
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">To Date</label>
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500 transition-colors"
                            />
                        </div>

                        <div className="pt-2 space-y-2">
                            <button 
                                onClick={() => mutate()}
                                className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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

                <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative p-4 gap-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                        <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
                            <span className="text-xs text-gray-400 block uppercase font-bold mb-1">Total Vouchers</span>
                            <span className="text-xl font-bold text-teal-400">{pagination.total}</span>
                        </div>
                        <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
                            <span className="text-xs text-gray-400 block uppercase font-bold mb-1">Total Quantity</span>
                            <span className="text-xl font-bold text-white">
                                {vouchers.reduce((acc: number, item: any) => acc + (item.totalQty || 0), 0)}
                            </span>
                        </div>
                        <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
                            <span className="text-xs text-gray-400 block uppercase font-bold mb-1">Total Subtotal</span>
                            <span className="text-xl font-bold text-white">{(totals.totalSubTotal || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
                            <span className="text-xs text-gray-400 block uppercase font-bold mb-1">Total Amount</span>
                            <span className="text-xl font-bold text-emerald-400">{(totals.totalAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Vouchers Table */}
                    <div className="flex-1 overflow-auto bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 size={40} className="animate-spin text-teal-500" />
                            </div>
                        ) : vouchers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500 italic">
                                <FileText size={40} className="mb-2 opacity-20" />
                                No vouchers found for the selected salesperson.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="bg-gray-900/50 sticky top-0 z-10">
                                    <tr className="text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                        <th className="p-4 text-center w-16">#</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Voucher No</th>
                                        <th className="p-4">Customer</th>
                                        <th className="p-4 text-center">Type</th>
                                        <th className="p-4 text-center">Qty</th>
                                        <th className="p-4 text-right">Subtotal</th>
                                        <th className="p-4 text-right">Total</th>
                                        {isAdmin && <th className="p-4">Branch</th>}
                                        <th className="p-4">Cashier</th>
                                        <th className="p-4 text-center w-24">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {vouchers.map((item: any, index: number) => (
                                        <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                            <td className="p-4 text-center text-xs text-gray-500">{(page - 1) * limit + index + 1}</td>
                                            <td className="p-4 text-sm text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-gray-500" />
                                                    {new Date(item.date).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-teal-400 font-mono">{item.vno}</td>
                                            <td className="p-4 text-sm text-white">{item.customerName || 'General'}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${item.paymentType === 'Credit' ? 'bg-blue-900/50 text-blue-400 border border-blue-800/30' : 'bg-emerald-900/50 text-emerald-400 border border-emerald-800/30'}`}>
                                                    {item.paymentType}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-center text-gray-300">{item.totalQty}</td>
                                            <td className="p-4 text-sm text-right text-gray-300">{item.subTotal?.toLocaleString()}</td>
                                            <td className="p-4 text-sm text-right font-bold text-white">{item.total?.toLocaleString()}</td>
                                            {isAdmin && <td className="p-4 text-sm text-blue-400">{item.branchName}</td>}
                                            <td className="p-4 text-sm text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-teal-900/30 flex items-center justify-center text-[10px] text-teal-400 font-bold border border-teal-800">
                                                        {item.cashier?.charAt(0).toUpperCase()}
                                                    </div>
                                                    {item.cashier}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => handleViewVoucher(item.vno)}
                                                    className="p-1.5 text-teal-400 hover:bg-teal-900/30 rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
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
                                                className={`w-8 h-8 rounded-lg text-sm transition-colors ${page === pageNum ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
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

            {/* Voucher Details Modal */}
            {isPrintModalOpen && printVNO && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700 my-8 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-750 shrink-0 print:hidden">
                            <h3 className="text-lg font-bold text-white">Voucher Details</h3>
                            <button onClick={() => setIsPrintModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-gray-900 min-h-0">
                            {isLoadingVoucher ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-teal-500" size={32} />
                                </div>
                            ) : voucherError ? (
                                <div className="text-center py-10">
                                    <p className="text-red-400">Failed to load voucher details</p>
                                    <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-white">Retry</button>
                                </div>
                            ) : voucherDetails ? (
                                <Voucher
                                    voucher={{
                                        vno: voucherDetails.voucher.vno,
                                        customerName: voucherDetails.voucher.customerName || undefined,
                                        customerPhone: voucherDetails.voucher.customerPhone || undefined,
                                        customerAddress: voucherDetails.voucher.customerAddress || undefined,
                                        totalQty: voucherDetails.voucher.totalQty,
                                        subTotal: voucherDetails.voucher.subTotal,
                                        discount: voucherDetails.voucher.discount,
                                        tax: voucherDetails.voucher.tax,
                                        total: voucherDetails.voucher.total,
                                        cash: voucherDetails.voucher.cash,
                                        refund: voucherDetails.voucher.refund,
                                        credit: voucherDetails.voucher.credit,
                                        paymentType: voucherDetails.voucher.paymentType,
                                        paymentMethod: voucherDetails.voucher.paymentMethod,
                                        cashier: voucherDetails.voucher.cashier,
                                        date: voucherDetails.voucher.date,
                                        branchInvoiceName: voucherDetails.voucher.branchInvoiceName || undefined,
                                        branchAddress: voucherDetails.voucher.branchAddress || undefined,
                                        branchPhone: voucherDetails.voucher.branchPhone || undefined,
                                        branchLogo: voucherDetails.voucher.branchLogo || undefined,
                                        branchIncludeLogo: voucherDetails.voucher.branchIncludeLogo,
                                        otherAmt: voucherDetails.voucher.otherAmt || undefined,
                                        otherType: voucherDetails.voucher.otherType || undefined,
                                        otherValue: voucherDetails.voucher.otherValue || undefined
                                    }}
                                    items={voucherDetails.items.map((item: any) => ({
                                        itemName: item.itemName,
                                        qty: item.qty,
                                        sellPrice: item.sellPrice,
                                        amount: item.amount,
                                        codeNo: item.codeNo,
                                        specification: item.specification,
                                        imei: item.imei,
                                        imei2: item.imei2
                                    }))}
                                />
                            ) : null}
                        </div>
                        <div className="p-4 border-t border-gray-700 bg-gray-750 flex justify-between gap-3 shrink-0 print:hidden">
                            <button onClick={() => window.print()} className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold transition-colors">Print</button>
                            <button onClick={() => setIsPrintModalOpen(false)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalespersonReport;
