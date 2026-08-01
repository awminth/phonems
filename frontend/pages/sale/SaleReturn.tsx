import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    FileText,
    User,
    Wallet,
    Wrench,
    X,
    Loader2,
    ChevronDown,
    Check,
    AlertCircle,
    Printer,
    CheckCircle,
    AlertTriangle,
    Search
} from 'lucide-react';
import { API_ENDPOINTS, apiClient, sessionManager } from '../../config';
import Voucher from '../../components/Voucher';

interface VoucherItem {
    id: string;
    itemName: string;
    codeNo: string;
    qty: number;
    sellPrice: number;
    remainId: string;
    isReturnable?: boolean;
    imei?: string;
}

interface VoucherDetails {
    voucher: {
        id: string;
        vno: string;
        customerId: string | null;
        customerName: string | null;
        customerPhone: string | null;
        customerAddress: string | null;
        totalQty: number;
        subTotal: number;
        discount: number;
        tax: number;
        total: number;
        userId: string;
        cashier: string;
        cash: number;
        refund: number;
        credit: number;
        date: string;
        paymentType: string;
        branchName?: string;
        branchInvoiceName?: string;
        branchAddress?: string;
        branchPhone?: string;
        branchLogo?: string;
        branchIncludeLogo?: number;
    };
    items: VoucherItem[];
}

interface ReturnItem {
    id: string;
    itemName: string;
    codeNo: string;
    soldPrice: number;
    qtySold: number;
    returnQty: number;
    refundSubtotal: number;
    isReturnable: boolean;
    imei?: string;
}

// Searchable Dropdown for Vouchers
const SearchableVoucherDropdown: React.FC<{
    value: string;
    onChange: (vno: string) => void;
    onLoad: (vno: string) => void;
    isLoading: boolean;
}> = ({ value, onChange, onLoad, isLoading }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [vouchers, setVouchers] = useState<{ id: string, name: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchVouchers = async () => {
            setIsSearching(true);
            try {
                const result = await apiClient.get(API_ENDPOINTS.SALE_LIST_VOUCHERS_DROPDOWN, { search });
                if (result.success) {
                    setVouchers(result.data);
                }
            } catch (error) {
                console.error('Fetch vouchers error:', error);
            } finally {
                setIsSearching(false);
            }
        };

        if (isOpen) {
            const timer = setTimeout(fetchVouchers, 300);
            return () => clearTimeout(timer);
        }
    }, [search, isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <div 
                className="w-full bg-gray-800 border border-gray-600 hover:border-gray-500 rounded-lg py-2.5 sm:py-3 px-4 flex justify-between items-center cursor-pointer text-sm sm:text-base focus-within:ring-2 focus-within:ring-blue-500 transition-all"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3 text-white truncate min-w-0">
                    <FileText className="text-gray-400 sm:w-5 sm:h-5 shrink-0" size={18} />
                    <span className={`truncate font-mono ${value ? 'text-white' : 'text-gray-500 font-sans'}`}>
                        {value ? value : "Select Folio No"}
                    </span>
                </div>
                <ChevronDown size={18} className="text-gray-400 shrink-0 ml-2" />
            </div>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-1.5 bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-2 border-b border-gray-700 bg-gray-850 sticky top-0">
                        <div className="flex items-center bg-gray-900 rounded px-2.5 border border-gray-700 focus-within:border-blue-500 transition-all">
                            <Search size={14} className="text-gray-400 mr-2 shrink-0" />
                            <input 
                                type="text"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 text-white placeholder-gray-500 outline-none"
                                placeholder="Search Folio No..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && search.trim()) {
                                        onChange(search.trim());
                                        setIsOpen(false);
                                        onLoad(search.trim());
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {search.trim() && !vouchers.some(v => v.id.toLowerCase() === search.trim().toLowerCase()) && (
                            <div 
                                className="px-4 py-2.5 text-xs sm:text-sm cursor-pointer hover:bg-blue-600 hover:text-white text-blue-400 hover:font-semibold border-b border-gray-700 flex justify-between items-center transition-all"
                                onClick={() => {
                                    onChange(search.trim());
                                    setIsOpen(false);
                                    onLoad(search.trim());
                                }}
                            >
                                <span>Use custom: "{search.trim()}"</span>
                            </div>
                        )}
                        {isSearching && vouchers.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                                <Loader2 size={16} className="animate-spin text-blue-500" /> Searching...
                            </div>
                        ) : vouchers.length > 0 ? (
                            vouchers.map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-blue-600 text-gray-200 hover:text-white transition-colors flex justify-between items-center ${v.id === value ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300'}`}
                                    onClick={() => {
                                        onChange(v.id);
                                        setIsOpen(false);
                                        onLoad(v.id);
                                    }}
                                >
                                    <span className="font-mono">{v.name}</span>
                                    <Check size={14} className={value === v.id ? 'opacity-100 text-blue-400' : 'opacity-0'} />
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-sm">No vouchers found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const SaleReturn: React.FC = () => {
    const navigate = useNavigate();
    const [voucherNo, setVoucherNo] = useState('');
    const [voucherDetails, setVoucherDetails] = useState<VoucherDetails | null>(null);
    const [isLoadingVoucher, setIsLoadingVoucher] = useState(false);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [reason, setReason] = useState('defective');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
    const reasonDropdownRef = useRef<HTMLDivElement>(null);
    const [returnVoucher, setReturnVoucher] = useState<VoucherDetails | null>(null);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const isAdmin = sessionManager.getUserType() === 'admin';

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (reasonDropdownRef.current && !reasonDropdownRef.current.contains(event.target as Node)) {
                setIsReasonDropdownOpen(false);
            }
        };
        if (isReasonDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isReasonDropdownOpen]);

    const reasons = [
        { value: 'defective', label: 'Defective / Broken', icon: <Wrench size={16} /> },
        { value: 'wrong_item', label: 'Wrong Item', icon: <AlertCircle size={16} /> },
        { value: 'damaged', label: 'Damaged', icon: <AlertCircle size={16} /> },
        { value: 'not_as_described', label: 'Not as Described', icon: <AlertCircle size={16} /> },
        { value: 'other', label: 'Other', icon: <X size={16} /> }
    ];

    const selectedReason = reasons.find(r => r.value === reason) || reasons[0];

    const loadVoucher = async (vnoToLoad?: string) => {
        const vno = vnoToLoad || voucherNo;
        if (!vno.trim()) {
            setNotification({ message: 'Please enter a folio number', type: 'error' });
            return;
        }

        setIsLoadingVoucher(true);
        try {
            const result = await apiClient.get(API_ENDPOINTS.SALE_LIST_VOUCHER(vno.trim()));
            if (result.success && result.data) {
                // Check if voucher is Cash type (only Cash vouchers can be returned)
                if (result.data.voucher.paymentType !== 'Cash') {
                    setNotification({ message: 'Only Cash vouchers can be returned. This voucher is not eligible for return.', type: 'error' });
                    setVoucherDetails(null);
                    setReturnItems([]);
                    return;
                }

                setVoucherDetails(result.data);

                // Initialize return items
                const items: ReturnItem[] = result.data.items.map((item: VoucherItem) => {
                    // Check if item is returnable (services typically aren't)
                    const isReturnable = !item.codeNo.toLowerCase().includes('srv-') &&
                        !item.itemName.toLowerCase().includes('service') &&
                        !item.itemName.toLowerCase().includes('installation');

                    return {
                        id: item.id,
                        itemName: item.itemName,
                        codeNo: item.codeNo,
                        soldPrice: item.sellPrice,
                        qtySold: item.qty,
                        returnQty: 0,
                        refundSubtotal: 0,
                        isReturnable,
                        imei: item.imei
                    };
                });
                setReturnItems(items);
                setNotification({ message: 'Voucher loaded successfully', type: 'success' });
            } else {
                setNotification({ message: result.message || 'Voucher not found or not eligible for return', type: 'error' });
                setVoucherDetails(null);
                setReturnItems([]);
            }
        } catch (error: any) {
            console.error('Load voucher error:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load voucher. Please try again.';
            setNotification({ message: errorMessage, type: 'error' });
            setVoucherDetails(null);
            setReturnItems([]);
        } finally {
            setIsLoadingVoucher(false);
        }
    };

    const handleReturnQtyChange = (id: string, value: string) => {
        setReturnItems(prev => prev.map(item => {
            if (item.id === id) {
                const returnQty = Math.max(0, Math.min(item.qtySold, parseInt(value) || 0));
                // If returning 0, reset refund amount. If returning > 0 and was 0, set to full price.
                let refundSubtotal = item.refundSubtotal;
                if (returnQty === 0) {
                    refundSubtotal = 0;
                } else if (item.returnQty === 0) {
                    refundSubtotal = returnQty * item.soldPrice;
                } else {
                    // Adjust refund amount proportionally if quantity changed but was already > 0
                    // This is a heuristic, the user can still edit it manually
                    refundSubtotal = (refundSubtotal / item.returnQty) * returnQty;
                }

                return {
                    ...item,
                    returnQty,
                    refundSubtotal: Math.round(refundSubtotal)
                };
            }
            return item;
        }));
    };

    const handleRefundAmountChange = (id: string, value: string) => {
        setReturnItems(prev => prev.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    refundSubtotal: parseFloat(value) || 0
                };
            }
            return item;
        }));
    };

    const calculateRefundTotal = () => {
        return returnItems.reduce((sum, item) => sum + item.refundSubtotal, 0);
    };

    const handleConfirmRefund = async () => {
        if (!voucherDetails) {
            setNotification({ message: 'Please load a voucher first', type: 'error' });
            return;
        }

        const hasReturnItems = returnItems.some(item => item.returnQty > 0);
        if (!hasReturnItems) {
            setNotification({ message: 'Please select items to return', type: 'error' });
            return;
        }

        if (!reason) {
            setNotification({ message: 'Please select a reason for return', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            const userId = sessionManager.getUserId();
            if (!userId) {
                setNotification({ message: 'User session expired. Please login again.', type: 'error' });
                setTimeout(() => navigate('/'), 2000);
                return;
            }

            const returnData = {
                vno: voucherDetails.voucher.vno,
                items: returnItems
                    .filter(item => item.returnQty > 0)
                    .map(item => ({
                        id: String(item.id), // Ensure ID is sent as string
                        returnQty: item.returnQty,
                        refundAmount: item.refundSubtotal
                    })),
                reason,
                refundTotal: calculateRefundTotal(),
                userId,
                username: sessionManager.getUsername()
            };

            const result = await apiClient.post(API_ENDPOINTS.SALE_LIST_RETURN, returnData);
            if (result.success && result.data) {
                // Show return voucher
                setReturnVoucher(result.data);
                setIsVoucherModalOpen(true);
                setNotification({ message: 'Return processed successfully!', type: 'success' });
            } else {
                setNotification({ message: result.message || 'Failed to process return', type: 'error' });
            }
        } catch (error) {
            console.error('Confirm refund error:', error);
            setNotification({ message: 'An error occurred. Please try again.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseVoucher = () => {
        setIsVoucherModalOpen(false);
        setReturnVoucher(null);
        // Reset form
        setVoucherNo('');
        setVoucherDetails(null);
        setReturnItems([]);
        setReason('defective');
        navigate('/sale/return');
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    const cashierName = sessionManager.getUsername() || 'Admin';
    const shift = 'Morning'; // You can get this from session or settings

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            {/* Toast Notification */}
            {notification && (
                <div className={`fixed top-16 sm:top-20 right-2 sm:right-4 left-2 sm:left-auto z-[200] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-lg text-white text-sm sm:text-base font-medium flex items-center animate-in slide-in-from-right duration-300 max-w-sm sm:max-w-none ${notification.type === 'success' ? 'bg-green-600' :
                        notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle size={18} className="sm:w-5 sm:h-5 mr-2 shrink-0" /> :
                        notification.type === 'error' ? <AlertTriangle size={18} className="sm:w-5 sm:h-5 mr-2 shrink-0" /> :
                            <AlertCircle size={18} className="sm:w-5 sm:h-5 mr-2 shrink-0" />}
                    <span className="break-words">{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <header className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-500 sticky top-0 z-50 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-full hover:bg-white/20 text-white transition-colors shrink-0"
                    >
                        <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg sm:text-xl font-bold text-white truncate">Sale Return (Credit Note)</h1>
                        <p className="text-xs sm:text-sm text-purple-100 hidden sm:block">Process customer returns and refunds</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm w-full sm:w-auto justify-end sm:justify-start">
                    <div className="text-white">
                        <span className="text-purple-200">Cashier: </span>
                        <span className="font-semibold">{cashierName}</span>
                    </div>
                    <div className="text-white">
                        <span className="text-purple-200">Shift: </span>
                        <span className="font-semibold">{shift}</span>
                    </div>
                </div>
            </header>

            {/* Main Content - Two Panel Layout */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Panel - Controls and Summary */}
                <div className="w-full lg:w-96 xl:w-[420px] bg-gray-800 lg:border-r border-b lg:border-b-0 border-gray-700 flex flex-col overflow-y-auto shrink-0 max-h-[50vh] lg:max-h-full">
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {/* Receipt/Voucher Input */}
                        <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-700 shadow-lg">
                            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="hidden sm:inline">SCAN RECEIPT / FOLIO NO</span>
                                <span className="sm:hidden">FOLIO NO</span>
                            </label>
                            <div className="space-y-3">
                                <SearchableVoucherDropdown 
                                    value={voucherNo}
                                    onChange={setVoucherNo}
                                    onLoad={loadVoucher}
                                    isLoading={isLoadingVoucher}
                                />
                                <button
                                    onClick={() => loadVoucher()}
                                    disabled={isLoadingVoucher || !voucherNo.trim()}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {isLoadingVoucher ? (
                                        <>
                                            <Loader2 className="animate-spin sm:w-[18px] sm:h-[18px]" size={16} />
                                            <span>Loading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="sm:w-[18px] sm:h-[18px]" size={16} />
                                            <span>Load Voucher</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Customer Card */}
                        {voucherDetails && (
                            <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-700 shadow-lg">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                    <div className="bg-blue-500/20 p-1.5 sm:p-2 rounded-lg text-blue-400">
                                        <User size={16} className="sm:w-5 sm:h-5" />
                                    </div>
                                    <h3 className="text-xs sm:text-sm font-medium text-gray-400 uppercase">Customer</h3>
                                </div>
                                <div className="space-y-1 sm:space-y-2">
                                    <p className="text-base sm:text-lg font-bold text-white break-words">
                                        {voucherDetails.voucher.customerName || 'Walk-in Customer'}
                                    </p>
                                    {voucherDetails.voucher.customerPhone && (
                                        <p className="text-xs sm:text-sm text-gray-400 break-words">
                                            {voucherDetails.voucher.customerPhone}
                                            {voucherDetails.voucher.customerId && ' • Member'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Refund Total Card */}
                        {voucherDetails && (
                            <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-xl p-4 sm:p-5 border-2 border-red-500/30 shadow-lg">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                    <div className="bg-red-500/20 p-1.5 sm:p-2 rounded-lg text-red-400">
                                        <Wallet size={16} className="sm:w-5 sm:h-5" />
                                    </div>
                                    <h3 className="text-xs sm:text-sm font-medium text-gray-400 uppercase">Refund Total</h3>
                                </div>
                                <p className="text-2xl sm:text-4xl font-bold text-red-400 break-words">
                                    {calculateRefundTotal().toLocaleString()} <span className="text-base sm:text-xl text-gray-400">Ks</span>
                                </p>
                            </div>
                        )}

                        {/* Reason for Return */}
                        {voucherDetails && (
                            <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-700 shadow-lg">
                                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-3 uppercase">
                                    Reason for Return
                                </label>
                                <div className="relative" ref={reasonDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between text-sm sm:text-base text-white hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="shrink-0">{selectedReason.icon}</span>
                                            <span className="truncate">{selectedReason.label}</span>
                                        </div>
                                        <ChevronDown size={16} className="text-gray-400 shrink-0 ml-2" />
                                    </button>
                                    {isReasonDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden">
                                            {reasons.map((r) => (
                                                <button
                                                    key={r.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setReason(r.value);
                                                        setIsReasonDropdownOpen(false);
                                                    }}
                                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 text-left hover:bg-gray-700 transition-colors text-sm sm:text-base ${reason === r.value ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300'
                                                        }`}
                                                >
                                                    {r.icon}
                                                    <span className="flex-1">{r.label}</span>
                                                    {reason === r.value && <Check size={16} className="ml-auto shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {voucherDetails && (
                            <div className="space-y-2 sm:space-y-3 pt-2">
                                {isAdmin && (
                                    <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2 text-red-400">
                                        <AlertTriangle size={18} />
                                        <span className="text-sm font-medium">Administrator account cannot perform returns. View only mode.</span>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleConfirmRefund}
                                    disabled={isSubmitting || isAdmin || calculateRefundTotal() === 0}
                                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin sm:w-[18px] sm:h-[18px]" size={16} />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="sm:w-[18px] sm:h-[18px]" size={16} />
                                            <span>Confirm Refund</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/sale/return')}
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Items Table */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gray-900 min-h-[50vh] lg:min-h-0">
                    {voucherDetails && returnItems.length > 0 ? (
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
                            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
                                <div className="p-3 sm:p-4 border-b border-gray-700 bg-gray-900/50">
                                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                        <FileText size={18} className="sm:w-5 sm:h-5" />
                                        <span>Return Items</span>
                                    </h2>
                                </div>
                                <div className="overflow-x-auto -mx-3 sm:mx-0">
                                    <div className="inline-block min-w-full align-middle px-3 sm:px-0">
                                        <table className="w-full min-w-[600px]">
                                            <thead className="bg-gray-900/50">
                                                <tr>
                                                    <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-gray-400 uppercase">Item Name</th>
                                                    <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-medium text-gray-400 uppercase">Sold Price</th>
                                                    <th className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-gray-400 uppercase">Qty Sold</th>
                                                    <th className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-gray-400 uppercase">Return Qty</th>
                                                    <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-medium text-gray-400 uppercase">Refund Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                                {returnItems.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                                        <td className="p-3 sm:p-4">
                                                            <div>
                                                                <p className="text-white font-medium text-sm sm:text-base break-words">{item.itemName}</p>
                                                                <div className="flex flex-wrap gap-2 mt-1">
                                                                    <p className="text-xs text-gray-500">{item.codeNo}</p>
                                                                    {item.imei && (
                                                                        <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                                                                            IMEI: {item.imei}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {!item.isReturnable && (
                                                                    <span className="inline-block mt-2 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] sm:text-xs font-bold rounded">
                                                                        NON-RETURNABLE
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-right text-gray-300 text-sm sm:text-base whitespace-nowrap">
                                                            {item.soldPrice.toLocaleString()}
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-center text-gray-300">
                                                            <span className="bg-gray-700 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium">{item.qtySold}</span>
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-center">
                                                            {item.isReturnable ? (
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={item.qtySold}
                                                                    value={item.returnQty}
                                                                    onChange={(e) => handleReturnQtyChange(item.id, e.target.value)}
                                                                    className="w-20 sm:w-24 bg-gray-900 border border-gray-600 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-center text-sm sm:text-base text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-500">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-right whitespace-nowrap">
                                                            {item.isReturnable ? (
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={item.refundSubtotal}
                                                                        onChange={(e) => handleRefundAmountChange(item.id, e.target.value)}
                                                                        className="w-24 sm:w-32 bg-gray-900 border border-gray-600 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-right text-sm sm:text-base text-red-400 focus:ring-2 focus:ring-red-500 outline-none font-bold"
                                                                        placeholder="Refund Amount"
                                                                    />
                                                                    <span className="text-[10px] text-gray-500">Max: {(item.returnQty * item.soldPrice).toLocaleString()}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-500">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                            <div className="text-center text-gray-500">
                                <FileText size={40} className="sm:w-12 sm:h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-base sm:text-lg">No voucher loaded</p>
                                <p className="text-xs sm:text-sm mt-2 px-4">Enter a folio number to start processing returns</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Return Voucher Modal */}
            {isVoucherModalOpen && returnVoucher && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
                    <div className="bg-white text-gray-900 rounded-lg w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                        <div className="p-4 bg-red-100 border-b flex justify-between items-center print:hidden">
                            <h3 className="font-bold text-red-800 flex items-center gap-2">
                                <FileText size={18} /> Return Receipt
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-red-200 rounded transition-colors"
                                    title="Print"
                                >
                                    <Printer size={18} />
                                </button>
                                <button
                                    onClick={handleCloseVoucher}
                                    className="text-gray-500 hover:text-gray-800"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 min-h-0">
                            <Voucher
                                voucher={{
                                    vno: returnVoucher.voucher.vno,
                                    customerName: returnVoucher.voucher.customerName || undefined,
                                    customerPhone: returnVoucher.voucher.customerPhone || undefined,
                                    customerAddress: returnVoucher.voucher.customerAddress || undefined,
                                    totalQty: returnVoucher.voucher.totalQty,
                                    subTotal: returnVoucher.voucher.subTotal,
                                    discount: returnVoucher.voucher.discount,
                                    tax: returnVoucher.voucher.tax,
                                    total: returnVoucher.voucher.total,
                                    cash: returnVoucher.voucher.cash,
                                    refund: returnVoucher.voucher.refund,
                                    cashier: returnVoucher.voucher.cashier || undefined,
                                    date: returnVoucher.voucher.date,
                                    paymentType: 'Return',
                                    branchName: returnVoucher.voucher.branchName,
                                    branchInvoiceName: returnVoucher.voucher.branchInvoiceName,
                                    branchAddress: returnVoucher.voucher.branchAddress,
                                    branchPhone: returnVoucher.voucher.branchPhone,
                                    branchLogo: returnVoucher.voucher.branchLogo,
                                    branchIncludeLogo: returnVoucher.voucher.branchIncludeLogo
                                }}
                                items={returnVoucher.items.map(item => ({
                                    itemName: item.itemName,
                                    qty: item.qty,
                                    sellPrice: item.sellPrice,
                                    amount: item.amount || (item.qty * item.sellPrice),
                                    codeNo: item.codeNo
                                }))}
                                showReturnLabel={true}
                            />
                        </div>

                        <div className="p-4 bg-gray-50 border-t flex gap-3 print:hidden">
                            <button
                                onClick={handleCloseVoucher}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 text-sm font-medium"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Printer size={16} /> Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SaleReturn;
