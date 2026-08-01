import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';
import { 
    ArrowLeft, 
    Filter, 
    RefreshCw, 
    TrendingUp, 
    Download,
    Calendar,
    LayoutGrid,
    PieChart as PieChartIcon,
    BarChart3,
    Loader2,
    Store
} from 'lucide-react';
import { API_ENDPOINTS, fetcher, SWR_CONFIG, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

interface AnalyticsData {
    branchId: string;
    branchName: string;
    brandId?: string;
    brandName?: string;
    totalQty: number;
    totalAmount: number;
    fill: string;
}

const BrandPerformanceReport: React.FC = () => {
    const navigate = useNavigate();
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [brandFilter, setBrandFilter] = useState('all');
    const [analyticsType, setAnalyticsType] = useState<'brand' | 'branch'>('brand');
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
    const [viewType, setViewType] = useState<'amount' | 'qty'>('amount');

    const [appliedFilters, setAppliedFilters] = useState({
        fromDate: '',
        toDate: '',
        branchId: '',
        brandId: 'all'
    });

    const userType = sessionManager.getUserType();

    // Fetch dropdowns (branches, categories)
    const { data: dropdownsData } = useSWR(
        API_ENDPOINTS.REPORT_BRAND_ANALYTICS_DROPDOWNS,
        fetcher,
        { ...SWR_CONFIG, revalidateOnFocus: false }
    );

    const categories = dropdownsData?.data?.categories || [];
    const branches = dropdownsData?.data?.branches || [];

    // Fetch Analytics Data
    const buildQueryString = () => {
        const params = new URLSearchParams();
        if (appliedFilters.fromDate) params.append('fromDate', appliedFilters.fromDate);
        if (appliedFilters.toDate) params.append('toDate', appliedFilters.toDate);
        
        if (analyticsType === 'brand') {
            const branchId = userType === 'admin' ? (appliedFilters.branchId || 'all') : (sessionManager.getBranchId() || 'all');
            if (branchId !== 'all') params.append('branchId', branchId);
        } else {
            if (appliedFilters.brandId !== 'all') params.append('brandId', appliedFilters.brandId);
        }
        
        return params.toString();
    };

    const endpoint = analyticsType === 'brand' 
        ? API_ENDPOINTS.REPORT_BRAND_ANALYTICS 
        : API_ENDPOINTS.REPORT_BRANCH_COMPARISON;

    const { data, error, isLoading, mutate } = useSWR(
        `${endpoint}?${buildQueryString()}`,
        fetcher,
        SWR_CONFIG
    );

    const displayData: AnalyticsData[] = data?.data || [];

    const handleSearch = () => {
        setAppliedFilters({
            fromDate,
            toDate,
            branchId: branchFilter,
            brandId: brandFilter
        });
    };

    const handleReset = () => {
        setFromDate('');
        setToDate('');
        setBranchFilter('');
        setBrandFilter('all');
        setAppliedFilters({
            fromDate: '',
            toDate: '',
            branchId: '',
            brandId: 'all'
        });
    };

    const exportToExcel = () => {
        if (displayData.length === 0) return;
        const title = analyticsType === 'brand' 
            ? `Brand Sales Performance (${appliedFilters.fromDate || 'All'} - ${appliedFilters.toDate || 'Today'})`
            : `Branch Sales Comparison (${appliedFilters.fromDate || 'All'} - ${appliedFilters.toDate || 'Today'})`;
        
        const labelCol = analyticsType === 'brand' ? "Brand Name" : "Branch Name";
        const headers = [labelCol, "Total Quantity Sold", "Total Sales Amount"];
        
        const excelData = displayData.map(b => [
            analyticsType === 'brand' ? b.brandName : b.branchName,
            b.totalQty,
            b.totalAmount
        ]);

        const totalQty = displayData.reduce((sum, b) => sum + Number(b.totalQty), 0);
        const totalAmount = displayData.reduce((sum, b) => sum + Number(b.totalAmount), 0);
        excelData.push(['TOTAL', totalQty, totalAmount]);

        exportStyledExcel(title, headers, excelData, `${analyticsType}_performance_${new Date().getTime()}.xlsx`, 'Analytics');
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            const name = analyticsType === 'brand' ? item.brandName : item.branchName;
            return (
                <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-xl">
                    <p className="text-white font-bold mb-1">{name}</p>
                    <p className="text-blue-400 text-sm">
                        Amount: <span className="font-mono">{Number(item.totalAmount).toLocaleString()}</span>
                    </p>
                    <p className="text-emerald-400 text-sm">
                        Quantity: <span className="font-mono">{item.totalQty.toLocaleString()}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/reports')}
                        className="p-2 rounded-full hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600/20 p-2 rounded-lg">
                            <TrendingUp size={24} className="text-blue-500" />
                        </div>
                        <h1 className="text-xl font-bold font-myanmar">အရောင်းပိုင်းခြားစိတ်ဖြာချက် (Analytics)</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-700 mr-4">
                        <button 
                            onClick={() => setAnalyticsType('brand')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${analyticsType === 'brand' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Brand Analytics
                        </button>
                        <button 
                            onClick={() => setAnalyticsType('branch')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${analyticsType === 'branch' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Branch Comparison
                        </button>
                    </div>
                    <button 
                        onClick={exportToExcel}
                        disabled={displayData.length === 0}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Download size={18} /> Excel
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Filters Sidebar */}
                <aside className="w-full lg:w-80 bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-5 flex flex-col gap-6 overflow-y-auto shrink-0 shadow-2xl z-10">
                    <div className="flex items-center gap-2 text-blue-400 border-b border-gray-700 pb-2">
                        <Filter size={18} />
                        <h2 className="font-bold">Analytics Filters</h2>
                    </div>

                    <div className="space-y-4">
                        {analyticsType === 'brand' ? (
                            userType === 'admin' && (
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Shop / Branch</label>
                                    <div className="relative">
                                        <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <select 
                                            value={branchFilter}
                                            onChange={(e) => setBranchFilter(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        >
                                            <option value="all">All Branches</option>
                                            {branches.map((b: any) => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Select Brand</label>
                                <div className="relative">
                                    <LayoutGrid size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <select 
                                        value={brandFilter}
                                        onChange={(e) => setBrandFilter(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="all">All Brands</option>
                                        {categories.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">From Date</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input 
                                        type="date" 
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">To Date</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input 
                                        type="date" 
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            <button 
                                onClick={handleSearch}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95"
                            >
                                <RefreshCw size={18} /> Apply Analysis
                            </button>
                            <button 
                                onClick={handleReset}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto border-t border-gray-700 pt-6 space-y-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Chart Type</label>
                            <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-700">
                                <button 
                                    onClick={() => setChartType('bar')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${chartType === 'bar' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <BarChart3 size={16} /> Bar
                                </button>
                                <button 
                                    onClick={() => setChartType('pie')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${chartType === 'pie' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <PieChartIcon size={16} /> Pie
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Metric</label>
                            <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-700">
                                <button 
                                    onClick={() => setViewType('amount')}
                                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${viewType === 'amount' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Sales Amount
                                </button>
                                <button 
                                    onClick={() => setViewType('qty')}
                                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${viewType === 'qty' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Sales Quantity
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Chart Area */}
                <main className="flex-1 overflow-y-auto bg-gray-900 p-6">
                    <div className="grid grid-cols-1 gap-6 max-w-6xl mx-auto h-full flex flex-col">
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-gray-800/50 border border-gray-700 p-5 rounded-2xl backdrop-blur-sm shadow-xl">
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Total {analyticsType === 'brand' ? 'Brands' : 'Branches'}</p>
                                <h3 className="text-3xl font-black text-white">{displayData.length}</h3>
                            </div>
                            <div className="bg-gray-800/50 border border-gray-700 p-5 rounded-2xl backdrop-blur-sm shadow-xl">
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Total Sales Volume</p>
                                <h3 className="text-3xl font-black text-emerald-400">
                                    {displayData.reduce((sum, b) => sum + Number(b.totalAmount), 0).toLocaleString()}
                                </h3>
                            </div>
                            <div className="bg-gray-800/50 border border-gray-700 p-5 rounded-2xl backdrop-blur-sm shadow-xl hidden lg:block">
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Total Units Sold</p>
                                <h3 className="text-3xl font-black text-blue-400">
                                    {displayData.reduce((sum, b) => sum + Number(b.totalQty), 0).toLocaleString()}
                                </h3>
                            </div>
                        </div>

                        {/* Main Visualization */}
                        <div className="flex-1 bg-gray-800/30 border border-gray-700 rounded-2xl p-6 shadow-2xl relative min-h-[450px]">
                            {isLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 size={48} className="animate-spin text-blue-500" />
                                        <p className="text-gray-400 animate-pulse">Analyzing sales data...</p>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-red-400">Failed to load analytics. Please try again.</p>
                                </div>
                            ) : displayData.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <LayoutGrid size={48} className="mx-auto text-gray-700 mb-4" />
                                        <p className="text-gray-500">No sales data found for the selected criteria.</p>
                                    </div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'bar' ? (
                                        <BarChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                            <XAxis 
                                                dataKey={analyticsType === 'brand' ? 'brandName' : 'branchName'} 
                                                stroke="#9CA3AF" 
                                                fontSize={12} 
                                                angle={-45} 
                                                textAnchor="end"
                                                interval={0}
                                                height={70}
                                            />
                                            <YAxis 
                                                stroke="#9CA3AF" 
                                                fontSize={12}
                                                tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(1)}K` : value}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                                            <Bar 
                                                dataKey={viewType === 'amount' ? 'totalAmount' : 'totalQty'} 
                                                radius={[6, 6, 0, 0]}
                                                animationDuration={1500}
                                            >
                                                {displayData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    ) : (
                                        <PieChart>
                                            <Pie
                                                data={displayData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={140}
                                                paddingAngle={5}
                                                dataKey={viewType === 'amount' ? 'totalAmount' : 'totalQty'}
                                                nameKey={analyticsType === 'brand' ? 'brandName' : 'branchName'}
                                                label={({ brandName, branchName, percent }) => `${brandName || branchName} ${(percent * 100).toFixed(0)}%`}
                                                animationDuration={1500}
                                            >
                                                {displayData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    )}
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Top Performers Table */}
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl mb-8">
                            <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                                <h4 className="font-bold text-gray-300">Sales Breakdown by {analyticsType === 'brand' ? 'Brand' : 'Branch'}</h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-900/30 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-700">
                                            <th className="px-6 py-3">{analyticsType === 'brand' ? 'Brand / Category' : 'Shop / Branch'}</th>
                                            <th className="px-6 py-3 text-right">Units Sold</th>
                                            <th className="px-6 py-3 text-right">Total Amount</th>
                                            <th className="px-6 py-3 text-right">% Contribution</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700/50">
                                        {displayData.map((item, idx) => {
                                            const total = displayData.reduce((sum, b) => sum + Number(b.totalAmount), 0);
                                            const percent = ((Number(item.totalAmount) / (total || 1)) * 100).toFixed(1);
                                            const name = analyticsType === 'brand' ? item.brandName : item.branchName;
                                            return (
                                                <tr key={idx} className="hover:bg-gray-750 transition-colors group">
                                                    <td className="px-6 py-4 flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }}></div>
                                                        <span className="font-bold text-sm text-gray-300 group-hover:text-white">{name}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-sm text-emerald-400">{Number(item.totalQty).toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-sm text-blue-400">{Number(item.totalAmount).toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="bg-gray-900 px-2 py-1 rounded text-xs font-bold text-gray-500 group-hover:text-blue-300 border border-gray-700">{percent}%</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default BrandPerformanceReport;
