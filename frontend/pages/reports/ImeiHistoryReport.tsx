import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    History,
    Calendar,
    User,
    FileText,
    ArrowUpCircle,
    ArrowDownCircle,
    RotateCcw,
    Loader2,
    ShieldCheck,
    Download,
    X,
    ChevronRight,
    Smartphone,
    LayoutGrid,
    Store,
    AlertCircle
} from 'lucide-react';
import { exportStyledExcel } from '../../utils/excelHelper';
import { API_ENDPOINTS, apiClient, fetcher, SWR_CONFIG } from '../../config';
import useSWR from 'swr';

interface HistoryItem {
    vno: string;
    date: string;
    person: string;
    price: number;
    type: 'Purchase' | 'Sale' | 'Return' | 'Damage';
    branchName?: string;
    isReturned?: boolean;
    reason?: string;
}

interface ProductInfo {
    id: string;
    itemName: string;
    codeNo: string;
    currentPrice: number;
}

const ImeiHistoryReport: React.FC = () => {
    const navigate = useNavigate();
    
    // Left Pane States
    const [imeiList, setImeiList] = useState<string[]>([]);
    const [searchListTerm, setSearchListTerm] = useState('');
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [brandFilter, setBrandFilter] = useState('');

    // Fetch brands for dropdown
    const { data: dropdownsData } = useSWR(
        API_ENDPOINTS.REPORT_BRAND_ANALYTICS_DROPDOWNS,
        fetcher,
        { ...SWR_CONFIG, revalidateOnFocus: false }
    );
    const categories = dropdownsData?.data?.categories || [];

    // Right Pane States
    const [selectedImei, setSelectedImei] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [data, setData] = useState<{ product: ProductInfo | null, history: HistoryItem[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch IMEI list for left pane
    const fetchImeiList = useCallback(async (targetPage: number) => {
        setIsLoadingList(true);
        try {
            const result = await apiClient.get(`${API_ENDPOINTS.REPORT_IMEI_LIST}?search=${searchListTerm}&brandId=${brandFilter}&page=${targetPage}&limit=30`);
            if (result.success) {
                if (targetPage === 1) {
                    setImeiList(result.data);
                } else {
                    setImeiList(prev => [...prev, ...result.data]);
                }
                setHasMore(result.data.length === 30);
                setPage(targetPage + 1);
            }
        } catch (err) {
            console.error('Fetch IMEI list error:', err);
        } finally {
            setIsLoadingList(false);
        }
    }, [searchListTerm, brandFilter]);

    // Initial fetch
    useEffect(() => {
        fetchImeiList(1);
    }, [searchListTerm, brandFilter, fetchImeiList]);

    // Fetch history for selected IMEI
    const fetchHistory = async (imei: string) => {
        setSelectedImei(imei);
        setIsLoadingHistory(true);
        setError(null);
        try {
            const result = await apiClient.get(API_ENDPOINTS.REPORT_IMEI_HISTORY(imei));
            if (result.success) {
                setData(result.data);
                if (result.data.history.length === 0) {
                    setError('No history found for this IMEI');
                }
            } else {
                setError(result.message || 'Failed to fetch history');
                setData(null);
            }
        } catch (err: any) {
            console.error('History fetch error:', err);
            setError('An error occurred while fetching history');
            setData(null);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const exportToExcel = () => {
        if (!data || !data.history.length || !selectedImei) return;

        const title = `IMEI History Report: ${selectedImei} (${data.product?.itemName || ''})`;
        const headers = ['Date', 'Type', 'Voucher No', 'Shop / Branch', 'Person', 'Amount', 'Status'];
        
        const excelData = data.history.map(item => [
            formatDate(item.date),
            item.type,
            item.vno,
            item.branchName || '-',
            item.person || 'Walk-in Customer',
            item.price,
            item.isReturned ? 'Returned' : 'Normal'
        ]);

        const timestamp = new Date().getTime();
        exportStyledExcel(title, headers, excelData, `IMEI_History_${selectedImei}_${timestamp}.xlsx`, 'IMEI History');
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-700 shrink-0 h-16 z-50">
                <button
                    onClick={() => navigate('/reports')}
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500">
                        <History size={20} />
                    </div>
                    <h1 className="text-xl font-bold">IMEI History Explorer</h1>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left Pane - IMEI List */}
                <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0">
                    <div className="p-4 border-b border-gray-700 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                type="text"
                                placeholder="Search IMEI..."
                                value={searchListTerm}
                                onChange={(e) => setSearchListTerm(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="relative">
                            <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <select 
                                value={brandFilter}
                                onChange={(e) => setBrandFilter(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none text-gray-300"
                            >
                                <option value="">All Brands</option>
                                {categories.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
                            <span>Available Devices</span>
                            {isLoadingList && <Loader2 size={12} className="animate-spin" />}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {imeiList.map((imei, idx) => (
                            <button
                                key={`${imei}-${idx}`}
                                onClick={() => fetchHistory(imei)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-700/50 transition-colors flex items-center justify-between group ${
                                    selectedImei === imei ? 'bg-blue-600/20 text-blue-400 border-l-4 border-l-blue-500' : 'hover:bg-gray-700/50 text-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Smartphone size={16} className={selectedImei === imei ? 'text-blue-400' : 'text-gray-500'} />
                                    <span className="font-mono text-sm">{imei}</span>
                                </div>
                                <ChevronRight size={14} className={`transition-transform ${selectedImei === imei ? 'translate-x-1 opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                            </button>
                        ))}
                        
                        {hasMore && !isLoadingList && (
                            <button 
                                onClick={() => fetchImeiList(page)}
                                className="w-full py-4 text-xs text-blue-500 font-bold uppercase hover:bg-gray-700/30 transition-all"
                            >
                                Load More
                            </button>
                        )}
                        
                        {!isLoadingList && imeiList.length === 0 && (
                            <div className="p-8 text-center text-gray-600 italic text-sm">
                                No IMEIs found
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right Pane - History Details */}
                <main className="flex-1 bg-gray-900 overflow-y-auto custom-scrollbar relative">
                    {!selectedImei ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 p-8 text-center">
                            <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                                <ShieldCheck size={40} className="opacity-20" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-400">Select a device to view history</h2>
                            <p className="max-w-xs mt-2 text-sm">Pick an IMEI from the left list to see its complete purchase and sales lifecycle.</p>
                        </div>
                    ) : isLoadingHistory ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
                            <p className="text-gray-400 animate-pulse">Loading device history...</p>
                        </div>
                    ) : (
                        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
                            
                            {/* Device Info Header */}
                            <div className="bg-gray-800 rounded-3xl border border-gray-700 shadow-2xl overflow-hidden">
                                <div className="bg-blue-600/10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-700">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                                            <Smartphone size={32} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{data?.product?.itemName || 'Unknown Device'}</h2>
                                            <p className="text-blue-400 font-mono text-sm mt-1">{selectedImei}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Current Selling Price</p>
                                        <p className="text-3xl font-black text-white">{data?.product?.currentPrice.toLocaleString() || '0'} <span className="text-sm font-normal text-gray-400 ml-1">Ks</span></p>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-800/50 flex flex-wrap gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 uppercase font-bold text-[10px]">Product Code:</span>
                                        <span className="font-mono text-gray-300">{data?.product?.codeNo || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 uppercase font-bold text-[10px]">Total Events:</span>
                                        <span className="text-gray-300 font-bold">{data?.history.length || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
                                    {error}
                                </div>
                            )}

                            {data && data.history.length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-lg font-bold flex items-center gap-3">
                                            <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-500">
                                                <ShieldCheck size={20} />
                                            </div>
                                            Lifecycle Audit Trail
                                        </h3>
                                        <button
                                            onClick={exportToExcel}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                                        >
                                            <Download size={18} /> Export Excel
                                        </button>
                                    </div>

                                    {/* Timeline */}
                                    <div className="relative border-l-2 border-gray-800 ml-6 pl-10 space-y-10 py-6">
                                        {data.history.map((item, index) => (
                                            <div key={index} className="relative group">
                                                {/* Timeline Dot */}
                                                <div className={`absolute -left-[51px] top-0 p-2 rounded-2xl border-4 border-gray-900 shadow-xl transition-transform group-hover:scale-110 ${
                                                    item.type === 'Purchase' ? 'bg-emerald-500 shadow-emerald-500/20' :
                                                    item.type === 'Sale' ? 'bg-blue-500 shadow-blue-500/20' : 
                                                    item.type === 'Damage' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-red-500 shadow-red-500/20'
                                                }`}>
                                                    {item.type === 'Purchase' ? <ArrowUpCircle size={20} className="text-white" /> :
                                                     item.type === 'Sale' ? <ArrowDownCircle size={20} className="text-white" /> :
                                                     item.type === 'Damage' ? <AlertCircle size={20} className="text-white" /> :
                                                     <RotateCcw size={20} className="text-white" />}
                                                </div>

                                                {/* Card */}
                                                <div className="bg-gray-800 border border-gray-700 p-6 rounded-3xl shadow-xl hover:border-gray-600 hover:bg-gray-750 transition-all">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm ${
                                                                item.type === 'Purchase' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                item.type === 'Sale' ? 'bg-blue-500/20 text-blue-400' : 
                                                                item.type === 'Damage' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                                                            }`}>
                                                                {item.type}
                                                            </span>
                                                            {item.isReturned && (
                                                                <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                                                    Returned
                                                                </span>
                                                            )}
                                                            <div className="h-4 w-px bg-gray-700 hidden sm:block"></div>
                                                            <span className="text-gray-500 text-xs font-mono font-bold">{item.vno}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-900/50 px-3 py-1.5 rounded-lg">
                                                            <Calendar size={14} className="text-gray-500" />
                                                            <span className="font-medium">{formatDate(item.date)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="bg-gray-900/40 p-4 rounded-2xl flex items-start gap-4">
                                                            <div className="bg-gray-800 p-2.5 rounded-xl text-gray-400 shadow-inner">
                                                                <User size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">
                                                                    {item.type === 'Purchase' ? 'Supplier' : item.type === 'Damage' ? 'Reported By' : 'Customer'}
                                                                </p>
                                                                <p className="text-white font-bold text-lg">{item.person || 'Walk-in Customer'}</p>
                                                            </div>
                                                        </div>
                                                        {item.type === 'Damage' && (
                                                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-4">
                                                                <div className="bg-gray-800 p-2.5 rounded-xl text-amber-400 shadow-inner">
                                                                    <AlertCircle size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-amber-500 uppercase font-black tracking-widest mb-1">Damage Reason</p>
                                                                    <p className="text-white font-medium text-sm italic">"{item.reason || 'No reason specified'}"</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="bg-gray-900/40 p-4 rounded-2xl flex items-start gap-4">
                                                            <div className="bg-gray-800 p-2.5 rounded-xl text-gray-400 shadow-inner">
                                                                <Store size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Shop / Branch</p>
                                                                <p className="text-white font-bold text-lg">{item.branchName || '-'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-gray-900/40 p-4 rounded-2xl flex items-start gap-4">
                                                            <div className="bg-gray-800 p-2.5 rounded-xl text-gray-400 shadow-inner">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Transaction Value</p>
                                                                <p className={`text-2xl font-black ${
                                                                    item.type === 'Purchase' ? 'text-white' :
                                                                    item.type === 'Sale' ? 'text-emerald-400' : 'text-red-400'
                                                                }`}>
                                                                    {item.price.toLocaleString()} <span className="text-sm font-normal opacity-50">Ks</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #374151;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #4B5563;
                }
            `}</style>
        </div>
    );
};

export default ImeiHistoryReport;
