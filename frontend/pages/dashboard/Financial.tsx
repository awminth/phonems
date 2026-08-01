import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { API_ENDPOINTS, fetcher, apiClient, sessionManager } from '../../config';
import {
  ArrowLeft,
  PieChart,
  Calendar,
  Search,
  ShoppingCart,
  ShoppingBag,
  DollarSign,
  Minus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  CornerUpLeft,
  CornerUpRight,
  Wrench
} from 'lucide-react';
import { exportStyledExcel } from '../../utils/excelHelper';

interface FinancialSummary {
  totalSales: number;
  totalPurchaseCost: number;
  totalExpense: number;
  totalPurchaseReturn: number;
  totalSaleReturn: number;
  totalSaleReturnCost: number;
  totalServiceRevenue?: number;
  totalServiceCost?: number;
  netProfit: number;
  branchBreakdown: Array<{
    branchId: number;
    branchName: string;
    sales: number;
    cost: number;
    expense: number;
    returns: number;
    returnsCost?: number;
    serviceRevenue?: number;
    serviceCost?: number;
    profit: number;
  }>;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

interface FinancialDetails {
  cashSalesTotal: number;
  creditSalesTotal: number;
  returnTotal: number;
  outstandingCredit: number;
  purchaseReturnTotal: number;
  totalSaleReturnCost: number;
  grandTotalSales: number;
  serviceRevenueTotal?: number;
  serviceCostTotal?: number;
}

const Financial: React.FC = () => {
  const navigate = useNavigate();

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (appliedFromDate) params.append('fromDate', appliedFromDate);
    if (appliedToDate) params.append('toDate', appliedToDate);
    return params.toString();
  };

  // SWR for financial summary
  const { data: summaryData, error: summaryError, isLoading: summaryLoading, mutate: mutateSummary } = useSWR<{
    success: boolean;
    data: FinancialSummary;
    fromCache: boolean;
  }>(
    `${API_ENDPOINTS.FINANCIAL_SUMMARY}${buildQueryString() ? '?' + buildQueryString() : ''}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  // SWR for financial details
  const { data: detailsData, error: detailsError, isLoading: detailsLoading, mutate: mutateDetails } = useSWR<{
    success: boolean;
    data: FinancialDetails;
    fromCache: boolean;
  }>(
    `${API_ENDPOINTS.FINANCIAL_DETAILS}${buildQueryString() ? '?' + buildQueryString() : ''}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const handleSearch = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const handleRefresh = () => {
    mutateSummary();
    mutateDetails();
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
  };

  const handleExport = () => {
    if (!summary || !details) return;

    const title = "Financial Summary Report";
    const headers = ["Description", "Amount (MMK)"];
    
    const excelData = [
      ["Gross Sales", totalSales],
      ["Sale Return Total", totalSaleReturn],
      ["Net Sales", totalSales - totalSaleReturn],
      ["Purchase Cost (COGS)", totalPurchaseCost],
      ["Returned Sales Cost", totalSaleReturnCost],
      ["Net COGS", totalPurchaseCost - totalSaleReturnCost],
      ["Service Revenue", totalServiceRevenue],
      ["Service Cost (Parts)", totalServiceCost],
      ["Net Service Profit", totalServiceProfit],
      ["Gross Profit", (totalSales - totalSaleReturn) - (totalPurchaseCost - totalSaleReturnCost) + totalServiceProfit],
      ["Expense Total", totalExpense],
      ["Net Profit", netProfit],
      ["", ""],
      ["DETAILED BREAKDOWN", ""],
      ["Cash Sales", cashSalesTotal],
      ["Credit Sales", creditSalesTotal],
      ["Outstanding Credit", outstandingCredit],
      ["Supplier Purchase Returns", totalPurchaseReturn],
      ["Service Cash/Total Revenue", serviceRevenueTotal],
      ["Service Cost (Parts)", serviceCostTotal],
    ];

    if (sessionManager.getUserType() === 'admin' && summary.branchBreakdown) {
      excelData.push(["", ""]);
      excelData.push(["BRANCH BREAKDOWN", ""]);
      excelData.push(["Branch Name", "Sales", "Cost", "Expense", "Returns", "Service Revenue", "Service Cost", "Profit"]);
      summary.branchBreakdown.forEach(b => {
        excelData.push([
          b.branchName,
          b.sales,
          b.cost,
          b.expense,
          b.returns,
          b.serviceRevenue || 0,
          b.serviceCost || 0,
          b.profit
        ]);
      });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    exportStyledExcel(title, headers, excelData, `financial_report_${timestamp}.xlsx`, 'Financials');
  };

  // Data
  const summary = summaryData?.data;
  const details = detailsData?.data;

  const isLoading = summaryLoading || detailsLoading;
  const hasError = summaryError || detailsError;

  // Calculate values
  const totalSales = summary?.totalSales || 0;
  const totalPurchaseCost = summary?.totalPurchaseCost || 0;
  const totalExpense = summary?.totalExpense || 0;
  const totalPurchaseReturn = summary?.totalPurchaseReturn || 0;
  const totalSaleReturn = summary?.totalSaleReturn || 0;
  const totalSaleReturnCost = summary?.totalSaleReturnCost || 0;
  const totalServiceRevenue = summary?.totalServiceRevenue || 0;
  const totalServiceCost = summary?.totalServiceCost || 0;
  const totalServiceProfit = totalServiceRevenue - totalServiceCost;
  const netProfit = summary?.netProfit || 0;

  // Details
  const cashSalesTotal = details?.cashSalesTotal || 0;
  const creditSalesTotal = details?.creditSalesTotal || 0;
  const returnTotal = details?.returnTotal || 0;
  const outstandingCredit = details?.outstandingCredit || 0;
  const purchaseReturnTotal = details?.purchaseReturnTotal || 0;
  const serviceRevenueTotal = details?.serviceRevenueTotal || 0;
  const serviceCostTotal = details?.serviceCostTotal || 0;

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between border-b border-gray-700 sticky top-0 z-40 shrink-0 h-16">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-500">
              <PieChart size={20} />
            </div>
            <h1 className="text-xl font-bold">Financial Report</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport}
            disabled={isLoading || !summary}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm mr-2"
          >
            <Download size={18} /> Export
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">

        {/* Error Message */}
        {hasError && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400 shrink-0" size={24} />
            <div>
              <p className="text-red-400 font-medium">Failed to load financial data</p>
              <p className="text-red-400/70 text-sm">Please try refreshing the page</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !summaryData && !detailsData && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-400">Loading financial data...</p>
            </div>
          </div>
        )}

        {/* Top Cards Section */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
            {/* Card 1: Sales */}
            <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4 border-l-4 border-green-500">
              <div className="bg-green-100 p-3 rounded-lg text-green-600">
                <ShoppingCart size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-semibold">အရောင်းစုစုပေါင်း</p>
                <p className="text-xl font-bold text-gray-800">{totalSales.toLocaleString()} MMK</p>
              </div>
            </div>

            {/* Card 2: Purchase Return (New) */}
            <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4 border-l-4 border-emerald-500">
              <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                <CornerUpRight size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-semibold">အဝယ်ဘောင်ချာပြန်သွင်းငွေ</p>
                <p className="text-xl font-bold text-gray-800">{totalPurchaseReturn.toLocaleString()} MMK</p>
              </div>
            </div>

            {/* Card 3: Purchase Cost */}
            <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4 border-l-4 border-orange-500">
              <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
                <ShoppingBag size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-semibold">အဝယ် (ကုန်ကျစရိတ်)</p>
                <p className="text-xl font-bold text-gray-800">{totalPurchaseCost.toLocaleString()} MMK</p>
              </div>
            </div>

            {/* Card 4: Sale Return (New) */}
            <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4 border-l-4 border-orange-400">
              <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
                <CornerUpLeft size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-semibold">အရောင်းပြန်အမ်းငွေ</p>
                <p className="text-xl font-bold text-gray-800">{totalSaleReturn.toLocaleString()} MMK</p>
              </div>
            </div>

            {/* Card 5: Service Net Profit */}
            <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4 border-l-4 border-pink-500">
              <div className="bg-pink-100 p-3 rounded-lg text-pink-600">
                <Wrench size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-semibold">ဝန်ဆောင်မှုလုပ်ငန်း အမြတ်</p>
                <p className="text-xl font-bold text-gray-800">{totalServiceProfit.toLocaleString()} MMK</p>
              </div>
            </div>

            {/* Card 6: Expense */}
            <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4 border-l-4 border-red-500">
              <div className="bg-red-100 p-3 rounded-lg text-red-600">
                <Minus size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-semibold">အသုံးစရိတ်</p>
                <p className="text-xl font-bold text-gray-800">{totalExpense.toLocaleString()} MMK</p>
              </div>
            </div>

            {/* Card 7: Profit */}
            <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4 border-l-4 border-blue-500">
              <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                <DollarSign size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-semibold">အမြတ်/အရှုံး</p>
                <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {netProfit.toLocaleString()} MMK
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Branch Breakdown (Admin Only) */}
        {!isLoading && sessionManager.getUserType() === 'admin' && summary?.branchBreakdown && summary.branchBreakdown.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-2">
              <PieChart size={20} className="text-blue-600" />
              <h3 className="font-bold text-gray-800">Branch-wise Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Branch Name</th>
                    <th className="p-4 text-right font-bold">Sales</th>
                    <th className="p-4 text-right font-bold">Cost</th>
                    <th className="p-4 text-right font-bold">Expense</th>
                    <th className="p-4 text-right font-bold">Returns</th>
                    <th className="p-4 text-right font-bold">Services (Net)</th>
                    <th className="p-4 text-right font-bold">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.branchBreakdown.map((b) => (
                    <tr key={b.branchId} className="hover:bg-gray-50 text-sm">
                      <td className="p-4 text-gray-800 font-bold">{b.branchName}</td>
                      <td className="p-4 text-right text-gray-700">{b.sales.toLocaleString()} MMK</td>
                      <td className="p-4 text-right text-red-500">-{b.cost.toLocaleString()} MMK</td>
                      <td className="p-4 text-right text-red-500">-{b.expense.toLocaleString()} MMK</td>
                      <td className="p-4 text-right text-orange-500">-{b.returns.toLocaleString()} MMK</td>
                      <td className="p-4 text-right text-pink-650 font-medium">
                        {((b.serviceRevenue || 0) - (b.serviceCost || 0)).toLocaleString()} MMK
                      </td>
                      <td className={`p-4 text-right font-bold ${b.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {b.profit.toLocaleString()} MMK
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom Section: Filters & Detail List */}
        {!isLoading && (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Left Panel: Date Search */}
            <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-fit">
              <div className="flex items-center gap-2 mb-6 text-gray-800 border-b border-gray-100 pb-2">
                <Calendar size={20} className="text-gray-600" />
                <h3 className="font-bold text-lg">Date Filter</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">From (မှ)</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">To (ထိ)</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg shadow transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <Search size={18} /> ရှာဖွေရန်
                </button>

                {(appliedFromDate || appliedToDate) && (
                  <button
                    onClick={handleClearFilters}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    ရှာဖွေမှုဖယ်ရှားရန်
                  </button>
                )}

                {/* Applied Filters Info */}
                {(appliedFromDate || appliedToDate) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">Applied Filters:</p>
                    <p className="text-sm text-blue-800">
                      {appliedFromDate && `From: ${appliedFromDate}`}
                      {appliedFromDate && appliedToDate && ' - '}
                      {appliedToDate && `To: ${appliedToDate}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Detailed List */}
            <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-gray-100">
                  {/* Section: Revenue */}
                  <tr className="bg-gray-100/50">
                    <td colSpan={2} className="p-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue (ဝင်ငွေ)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-600 font-medium pl-8">Gross Sales (အရောင်းစုစုပေါင်း)</td>
                    <td className="p-4 text-right font-bold text-gray-800">{totalSales.toLocaleString()} MMK</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-600 font-medium pl-8">Sale Returns (အရောင်းပြန်အမ်းငွေ)</td>
                    <td className="p-4 text-right font-bold text-red-500">- {totalSaleReturn.toLocaleString()} MMK</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-600 font-medium pl-8 text-pink-650">Service Revenue (ဝန်ဆောင်မှုရရှိငွေစုစုပေါင်း)</td>
                    <td className="p-4 text-right font-bold text-pink-600">+ {totalServiceRevenue.toLocaleString()} MMK</td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="p-4 text-gray-800 font-bold pl-8 underline decoration-emerald-500/30 decoration-2">Net Sales & Services (အရောင်းနှင့် ဝန်ဆောင်မှုအသားတင်)</td>
                    <td className="p-4 text-right font-bold text-emerald-600 text-lg">{(totalSales - totalSaleReturn + totalServiceRevenue).toLocaleString()} MMK</td>
                  </tr>

                  {/* Section: COGS */}
                  <tr className="bg-gray-100/50">
                    <td colSpan={2} className="p-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Cost of Goods & Parts (အရောင်းနှင့် ဝန်ဆောင်မှုပစ္စည်း ကုန်ကျစရိတ်)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-600 font-medium pl-8">Purchase Cost (ဝယ်ရင်းစုစုပေါင်း)</td>
                    <td className="p-4 text-right font-bold text-gray-800">{totalPurchaseCost.toLocaleString()} MMK</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-600 font-medium pl-8">Returned Sales Cost (အရောင်းပြန်ဝင် ကုန်ကျစရိတ်သက်သာခွင့်)</td>
                    <td className="p-4 text-right font-bold text-emerald-600">- {totalSaleReturnCost.toLocaleString()} MMK</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-600 font-medium pl-8 text-pink-650">Service Parts Cost (ဝန်ဆောင်မှုပစ္စည်းဝယ်ယူစရိတ်)</td>
                    <td className="p-4 text-right font-bold text-red-500">+ {totalServiceCost.toLocaleString()} MMK</td>
                  </tr>
                  <tr className="bg-orange-50/50">
                    <td className="p-4 text-gray-800 font-bold pl-8 underline decoration-orange-500/30 decoration-2">Net COGS & Parts Cost (အသားတင်ကုန်ကျစရိတ်)</td>
                    <td className="p-4 text-right font-bold text-orange-600">{(totalPurchaseCost - totalSaleReturnCost + totalServiceCost).toLocaleString()} MMK</td>
                  </tr>

                  {/* Gross Profit */}
                  <tr className="bg-blue-100/30">
                    <td className="p-4 text-blue-800 font-bold text-lg">Gross Profit (စုစုပေါင်းအမြတ်)</td>
                    <td className="p-4 text-right font-bold text-blue-700 text-xl">
                      {((totalSales - totalSaleReturn + totalServiceRevenue) - (totalPurchaseCost - totalSaleReturnCost + totalServiceCost)).toLocaleString()} MMK
                    </td>
                  </tr>

                  {/* Section: Expenses */}
                  <tr className="bg-gray-100/50">
                    <td colSpan={2} className="p-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Operating Expenses (အထွေထွေအသုံးစရိတ်)</td>
                  </tr>
                  <tr className="hover:bg-gray-50 border-b-2 border-gray-200">
                    <td className="p-4 text-gray-600 font-medium pl-8 font-bold">General Expenses (အသုံးစရိတ်စုစုပေါင်း)</td>
                    <td className="p-4 text-right font-bold text-red-500">- {totalExpense.toLocaleString()} MMK</td>
                  </tr>

                  {/* Net Profit */}
                  <tr className="bg-indigo-600 text-white shadow-xl">
                    <td className="p-5 font-bold text-xl flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <DollarSign size={24} />
                      </div>
                      Net Profit (ခန့်မှန်းအသားတင်အမြတ်)
                    </td>
                    <td className="p-5 text-right font-bold text-2xl tracking-tight">
                      {netProfit.toLocaleString()} MMK
                    </td>
                  </tr>

                  {/* Additional Info */}
                  <tr className="bg-gray-50/50 border-t-8 border-gray-100">
                    <td className="p-4 text-gray-500 font-medium italic text-sm">လက်ရှိမရသေးသောအကြွေး (Total Outstanding)</td>
                    <td className="p-4 text-right font-bold text-amber-600/70 text-sm">{outstandingCredit.toLocaleString()} MMK</td>
                  </tr>
                  <tr className="bg-gray-50/50 border-t border-gray-100">
                    <td className="p-4 text-gray-500 font-medium italic text-sm">အဝယ်ဘောင်ချာပြန်သွင်းငွေ (Supplier Purchase Returns)</td>
                    <td className="p-4 text-right font-bold text-emerald-600/70 text-sm">{purchaseReturnTotal.toLocaleString()} MMK</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Financial;
