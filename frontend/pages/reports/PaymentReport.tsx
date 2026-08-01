import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import {
    ArrowLeft,
    Wallet,
    Calendar,
    RefreshCw,
    Download,
    Banknote,
    CreditCard,
    Smartphone,
    Loader2
} from 'lucide-react';
import { API_ENDPOINTS, fetcher, SWR_CONFIG, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

const PaymentReport: React.FC = () => {
    const navigate = useNavigate();

    // Date State
    const today = new Date().toISOString().split('T')[0];
    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);
    const [branchId, setBranchId] = useState('all');

    const isAdmin = sessionManager.getUserType() === 'admin';

    // Fetch Data
    const { data, error, isLoading, mutate } = useSWR(
        `${API_ENDPOINTS.REPORT_PAYMENT_SUMMARY}?fromDate=${fromDate}&toDate=${toDate}${branchId !== 'all' ? `&branchId=${branchId}` : ''}`,
        fetcher,
        SWR_CONFIG
    );

    // Fetch Branches (Admin only)
    const { data: branchData } = useSWR(
        isAdmin ? API_ENDPOINTS.BRANCHES : null,
        fetcher,
        { revalidateOnFocus: false }
    );
    const branches = branchData?.data || [];

    const reportData = data?.data || {
        summary: { Cash: 0, KPay: 0, WavePay: 0 },
        breakdown: { sales: [], creditPayments: [] }
    };

    const totalAmount = (reportData.summary.Cash || 0) + (reportData.summary.KPay || 0) + (reportData.summary.WavePay || 0);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString() + ' Ks';
    };

    const handlePrint = () => {
        window.print();
    };

    const exportToExcel = () => {
        const title = `Payment Method Report (${fromDate} to ${toDate})`;
        const headers = ["Payment Method", "Amount"];
        const excelData = [
            ["Cash", reportData.summary.Cash || 0],
            ["KBZ Pay", reportData.summary.KPay || 0],
            ["Wave Pay", reportData.summary.WavePay || 0],
            ["TOTAL", totalAmount]
        ];

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `payment_report_${timestamp}.xlsx`, 'Payment Report');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            {/* Header */}
            <header className="bg-gray-800 shadow-lg p-4 sticky top-0 z-40 border-b border-gray-700 print:hidden">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/reports')}
                            className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                                <Wallet size={24} />
                            </div>
                            <h1 className="text-xl font-bold">Payment Method Report</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

                {/* Filters */}
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg print:hidden">
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">From Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className='block text-sm text-gray-400 mb-1'>To Date</label>
                            <div className='relative'>
                                <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' size={18} />
                                <input
                                    type='date'
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className='pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm'
                                />
                            </div>
                        </div>

                        {isAdmin && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Shop / Branch</label>
                                <select
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                    className="px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm min-w-[150px]"
                                >
                                    <option value="all">All Branches</option>
                                    {branches.map((br: any) => (
                                        <option key={br.id} value={br.id}>{br.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <button
                            onClick={() => mutate()}
                            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors ml-auto"
                            title="Refresh"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button
                            onClick={exportToExcel}
                            disabled={!data}
                            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                            title="Excel"
                        >
                            <Download size={20} />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-indigo-500" />
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-red-400 bg-gray-800 rounded-xl border border-red-900/30">
                        Failed to load report data
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Cash Card */}
                            <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute right-[-20px] top-[-20px] bg-emerald-500/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
                                            <Banknote size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-emerald-100">Cash Payment</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-white mb-1">
                                        {formatCurrency(reportData.summary.Cash || 0)}
                                    </p>
                                    <p className="text-sm text-emerald-300/60">Total Cash collected</p>
                                </div>
                            </div>

                            {/* KPay Card */}
                            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute right-[-20px] top-[-20px] bg-blue-500/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                                            <Smartphone size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-blue-100">KBZ Pay</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-white mb-1">
                                        {formatCurrency(reportData.summary.KPay || 0)}
                                    </p>
                                    <p className="text-sm text-blue-300/60">Total KPay transactions</p>
                                </div>
                            </div>

                            {/* WavePay Card */}
                            <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute right-[-20px] top-[-20px] bg-yellow-500/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-all"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400">
                                            <CreditCard size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-yellow-100">Wave Pay</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-white mb-1">
                                        {formatCurrency(reportData.summary.WavePay || 0)}
                                    </p>
                                    <p className="text-sm text-yellow-300/60">Total WavePay transactions</p>
                                </div>
                            </div>
                        </div>

                        {/* Grand Total */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-gray-400 font-medium">Grand Total (All Methods)</h3>
                                <p className="text-sm text-gray-500">Sum of Cash, KPay, and WavePay</p>
                            </div>
                            <div className="text-4xl font-bold text-white">
                                {formatCurrency(totalAmount)}
                            </div>
                        </div>

                        {/* Printable Area (Hidden normally, shown on print) */}
                        <div className="hidden print:block text-black">
                            <h2 className="text-2xl font-bold mb-4 text-center">Payment Report</h2>
                            <p className="text-center mb-6">Period: {fromDate} - {toDate}</p>
                            <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 p-2 text-left">Method</th>
                                        <th className="border border-gray-300 p-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 p-2">Cash</td>
                                        <td className="border border-gray-300 p-2 text-right">{formatCurrency(reportData.summary.Cash || 0)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 p-2">KPay</td>
                                        <td className="border border-gray-300 p-2 text-right">{formatCurrency(reportData.summary.KPay || 0)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 p-2">WavePay</td>
                                        <td className="border border-gray-300 p-2 text-right">{formatCurrency(reportData.summary.WavePay || 0)}</td>
                                    </tr>
                                    <tr className="font-bold">
                                        <td className="border border-gray-300 p-2">Total</td>
                                        <td className="border border-gray-300 p-2 text-right">{formatCurrency(totalAmount)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default PaymentReport;
