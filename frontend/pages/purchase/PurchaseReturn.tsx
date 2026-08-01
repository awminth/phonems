import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    FileText,
    Search,
    Building2,
    RefreshCw,
    X,
    Loader2,
    ChevronDown,
    Check,
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    Info,
    Plus,
    Minus,
    Printer
} from 'lucide-react';
import { API_ENDPOINTS, apiClient, fetcher, SWR_CONFIG, sessionManager } from '../../config';
import useSWR from 'swr';
import PurchaseReturnVoucher from '../../components/PurchaseReturnVoucher';

interface DropdownOption {
    id: string;
    name: string;
}

const SearchableDropdown: React.FC<{
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    onSelect?: (value: string) => void;
}> = ({ value, onChange, placeholder, disabled, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: optionsData, isLoading } = useSWR<{success: boolean, data: DropdownOption[]}>(
        isOpen ? `${API_ENDPOINTS.PURCHASE_RETURNS_VOUCHERS_DROPDOWN}?search=${search}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const options = optionsData?.data || [];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative">
                <input
                    type="text"
                    value={isOpen ? search : value}
                    onChange={(e) => {
                        if (!isOpen) setIsOpen(true);
                        setSearch(e.target.value);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearch('');
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-3 pr-10 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ChevronDown size={18} />}
                </div>
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-[100] w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {options.length > 0 ? (
                        options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onChange(option.id);
                                    if (onSelect) onSelect(option.id);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-gray-700 text-gray-200 flex items-center justify-between border-b border-gray-700/50 last:border-0"
                            >
                                <span>{option.name}</span>
                                {value === option.id && <Check size={16} className="text-blue-500" />}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-gray-500 text-center text-sm italic">
                            {search ? 'No vouchers found' : 'Type to search...'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface PurchaseItem {
    purchaseId: string;
    codeNo: string;
    itemName: string;
    qty: number;
    costPrice: number;
    sellPrice: number;
    categoryId: string;
    supplierId: string;
    supplierName: string;
    supplierCode: string;
    purchaseDate: string;
    remainId: string;
    currentQty: number;
    totalReturned: number;
    availableQty: number;
}

interface PurchaseInvoiceItem {
    purchaseId: string;
    codeNo: string;
    itemName: string;
    qty: number;
    costPrice: number;
    sellPrice: number;
    categoryId: string;
    supplierId: string;
    purchaseDate: string;
    remainId: string;
    currentQty: number;
    totalReturned: number;
    availableQty: number;
    imei1?: string;
    imei2?: string;
}

interface PurchaseInvoiceDetails {
    voucher: {
        voucherId: string;
        vno: string;
        supplierId: string;
        supplierName: string;
        supplierCode: string;
        totalAmount: number;
        voucherDate: string;
        userId: string;
    };
    items: PurchaseInvoiceItem[];
}

interface ReturnItem {
    purchaseId: string;
    itemName: string;
    codeNo: string;
    costPrice: number;
    purchased: number;
    history: number;
    returnQty: number;
    refundSubtotal: number;
    remainId: string;
    imei1?: string;
    imei2?: string;
}

const reasons = [
    { value: 'damaged', label: 'Damaged Item', icon: <AlertCircle size={16} /> },
    { value: 'defective', label: 'Defective / Broken', icon: <AlertCircle size={16} /> },
    { value: 'wrong_item', label: 'Wrong Item', icon: <X size={16} /> },
    { value: 'not_as_described', label: 'Not as Described', icon: <AlertCircle size={16} /> },
    { value: 'other', label: 'Other', icon: <X size={16} /> }
];

const PurchaseReturn: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const isEditMode = !!id;
    const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState('');
    const [purchaseDetails, setPurchaseDetails] = useState<PurchaseInvoiceDetails | null>(null);
    const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [reason, setReason] = useState('damaged');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
    const reasonDropdownRef = useRef<HTMLDivElement>(null);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
    const [returnVoucher, setReturnVoucher] = useState<{ isOpen: boolean; voucher: any; items: any[] } | null>(null);

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Close dropdowns when clicking outside
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

    // Load existing data in edit mode
    useEffect(() => {
        if (isEditMode && id) {
            loadReturnData(id);
        }
    }, [id, isEditMode]);

    const selectedReason = reasons.find(r => r.value === reason) || reasons[0];

    const loadReturnData = async (returnId: string) => {
        setIsLoadingData(true);
        try {
            const result = await apiClient.get(API_ENDPOINTS.PURCHASE_RETURN_BY_ID(returnId));
            if (result.success && result.data) {
                const { voucher, items } = result.data;
                
                // Set VNO and reason
                setPurchaseInvoiceNo(voucher.vno);
                setReason(voucher.reason || 'damaged');
                
                // Load the original purchase invoice first
                setIsLoadingInvoice(true);
                try {
                    const invoiceResult = await apiClient.get(API_ENDPOINTS.PURCHASE_RETURN_INVOICE(voucher.vno));
                    if (invoiceResult.success && invoiceResult.data) {
                        setPurchaseDetails(invoiceResult.data);
                        
                        // Map return items to ReturnItem format using invoice data
                        const mappedItems: ReturnItem[] = invoiceResult.data.items.map((purchaseItem: PurchaseInvoiceItem) => {
                            // Find the corresponding return item
                            const returnItem = items.find((ri: any) => ri.purchaseId === purchaseItem.purchaseId);
                            
                            // Calculate history (total returned excluding current return)
                            const history = returnItem 
                                ? Math.max(0, purchaseItem.totalReturned - (returnItem.returnQty || 0))
                                : purchaseItem.totalReturned;
                            
                            return {
                                purchaseId: purchaseItem.purchaseId,
                                itemName: purchaseItem.itemName,
                                codeNo: purchaseItem.codeNo,
                                costPrice: purchaseItem.costPrice,
                                purchased: purchaseItem.qty,
                                history: history,
                                returnQty: returnItem ? returnItem.returnQty : 0,
                                refundSubtotal: returnItem ? returnItem.subTotal : 0,
                                remainId: purchaseItem.remainId,
                                imei1: purchaseItem.imei1,
                                imei2: purchaseItem.imei2
                            };
                        });
                        
                        setReturnItems(mappedItems);
                    } else {
                        setNotification({ message: 'Failed to load purchase invoice', type: 'error' });
                    }
                } catch (error) {
                    console.error('Load invoice error:', error);
                    setNotification({ message: 'Failed to load purchase invoice', type: 'error' });
                } finally {
                    setIsLoadingInvoice(false);
                }
            } else {
                setNotification({ message: 'Failed to load purchase return data', type: 'error' });
                setTimeout(() => navigate('/purchase/return-list'), 2000);
            }
        } catch (error) {
            console.error('Load return data error:', error);
            setNotification({ message: 'Failed to load purchase return data', type: 'error' });
            setTimeout(() => navigate('/purchase/return-list'), 2000);
        } finally {
            setIsLoadingData(false);
        }
    };

    const loadPurchaseInvoice = async () => {
        if (!purchaseInvoiceNo.trim()) {
            setNotification({ message: 'Please enter a purchase invoice number', type: 'error' });
            return;
        }

        setIsLoadingInvoice(true);
        try {
            const result = await apiClient.get(API_ENDPOINTS.PURCHASE_RETURN_INVOICE(purchaseInvoiceNo.trim()));
            if (result.success && result.data) {
                setPurchaseDetails(result.data);
                
                // Initialize return items from all items in the voucher
                const items: ReturnItem[] = result.data.items.map((item: PurchaseInvoiceItem) => ({
                    purchaseId: item.purchaseId,
                    itemName: item.itemName,
                    codeNo: item.codeNo,
                    costPrice: item.costPrice,
                    purchased: item.qty,
                    history: item.totalReturned,
                    returnQty: 0,
                    refundSubtotal: 0,
                    remainId: item.remainId,
                    imei1: item.imei1,
                    imei2: item.imei2
                }));
                setReturnItems(items);
                setNotification({ message: 'Purchase invoice loaded successfully', type: 'success' });
            } else {
                setNotification({ message: result.message || 'Purchase invoice not found', type: 'error' });
                setPurchaseDetails(null);
                setReturnItems([]);
            }
        } catch (error: any) {
            console.error('Load purchase invoice error:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load purchase invoice. Please try again.';
            setNotification({ message: errorMessage, type: 'error' });
            setPurchaseDetails(null);
            setReturnItems([]);
        } finally {
            setIsLoadingInvoice(false);
        }
    };

    const handleReturnQtyChange = (purchaseId: string, value: string) => {
        setReturnItems(prev => prev.map(item => {
            if (item.purchaseId === purchaseId) {
                const returnQty = Math.max(0, Math.min(item.purchased - item.history, parseInt(value) || 0));
                return {
                    ...item,
                    returnQty,
                    refundSubtotal: returnQty * item.costPrice
                };
            }
            return item;
        }));
    };

    const handleIncrementQty = (purchaseId: string) => {
        setReturnItems(prev => prev.map(item => {
            if (item.purchaseId === purchaseId) {
                const maxQty = item.purchased - item.history;
                const returnQty = Math.min(maxQty, item.returnQty + 1);
                return {
                    ...item,
                    returnQty,
                    refundSubtotal: returnQty * item.costPrice
                };
            }
            return item;
        }));
    };

    const handleDecrementQty = (purchaseId: string) => {
        setReturnItems(prev => prev.map(item => {
            if (item.purchaseId === purchaseId) {
                const returnQty = Math.max(0, item.returnQty - 1);
                return {
                    ...item,
                    returnQty,
                    refundSubtotal: returnQty * item.costPrice
                };
            }
            return item;
        }));
    };

    const calculateRefundTotal = () => {
        return returnItems.reduce((sum, item) => sum + item.refundSubtotal, 0);
    };

    const handleConfirmReturn = async () => {
        if (!purchaseDetails) {
            setNotification({ message: 'Please load a purchase invoice first', type: 'error' });
            return;
        }

        const hasReturnItems = returnItems.some(item => item.returnQty > 0);
        if (!hasReturnItems) {
            setNotification({ message: 'Please enter return quantities', type: 'error' });
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
                purchaseInvoiceNo: purchaseInvoiceNo.trim(),
                supplierId: purchaseDetails.voucher.supplierId,
                items: returnItems
                    .filter(item => item.returnQty > 0)
                    .map(item => ({
                        purchaseId: item.purchaseId,
                        remainId: item.remainId,
                        costPrice: item.costPrice,
                        oldQty: item.purchased,
                        returnQty: item.returnQty,
                        refundSubtotal: item.refundSubtotal
                    })),
                reason,
                refundTotal: calculateRefundTotal(),
                userId
            };

            let result;
            if (isEditMode && id) {
                result = await apiClient.put(API_ENDPOINTS.PURCHASE_RETURN_BY_ID(id), returnData);
            } else {
                result = await apiClient.post(API_ENDPOINTS.PURCHASE_RETURNS, returnData);
            }
            
            if (result.success) {
                setNotification({ 
                    message: isEditMode 
                        ? 'Purchase return updated successfully!' 
                        : 'Purchase return processed successfully!', 
                    type: 'success' 
                });
                
                // Fetch the created/updated return voucher to display
                if (!isEditMode && result.data?.id) {
                    try {
                        const voucherResult = await apiClient.get(API_ENDPOINTS.PURCHASE_RETURN_BY_ID(result.data.id));
                        if (voucherResult.success && voucherResult.data) {
                            setReturnVoucher({
                                isOpen: true,
                                voucher: voucherResult.data.voucher,
                                items: voucherResult.data.items
                            });
                        } else {
                            // Navigate to list if voucher fetch fails
                            setTimeout(() => {
                                navigate('/purchase/return-list');
                            }, 1500);
                        }
                    } catch (error) {
                        console.error('Failed to fetch return voucher:', error);
                        // Navigate to list if voucher fetch fails
                        setTimeout(() => {
                            navigate('/purchase/return-list');
                        }, 1500);
                    }
                } else {
                    // For edit mode, navigate to list after a delay
                    setTimeout(() => {
                        navigate('/purchase/return-list');
                    }, 1500);
                }
            } else {
                setNotification({ 
                    message: result.message || (isEditMode ? 'Failed to update return' : 'Failed to process return'), 
                    type: 'error' 
                });
            }
        } catch (error: any) {
            console.error('Confirm return error:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred. Please try again.';
            setNotification({ message: errorMessage, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const currentDate = formatDate(new Date().toISOString());

    if (isLoadingData) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                    <p className="text-gray-400">Loading purchase return data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            {/* Toast Notification */}
            {notification && (
                <div className={`fixed top-16 sm:top-20 right-2 sm:right-4 left-2 sm:left-auto z-[200] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-lg text-white text-sm sm:text-base font-medium flex items-center animate-in slide-in-from-right duration-300 max-w-sm sm:max-w-none ${
                    notification.type === 'success' ? 'bg-green-600' : 
                    notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                }`}>
                    {notification.type === 'success' ? <CheckCircle size={18} className="sm:w-5 sm:h-5 mr-2 shrink-0"/> : 
                     notification.type === 'error' ? <AlertTriangle size={18} className="sm:w-5 sm:h-5 mr-2 shrink-0"/> : 
                     <AlertCircle size={18} className="sm:w-5 sm:h-5 mr-2 shrink-0"/>}
                    <span className="break-words">{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg p-3 md:p-4 flex items-center justify-between border-b border-blue-500 sticky top-0 z-50 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => navigate('/purchase/return-list')}
                        className="p-2 rounded-full hover:bg-white/20 text-white transition-colors shrink-0"
                    >
                        <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <RefreshCw size={20} className="sm:w-6 sm:h-6" />
                        <h1 className="text-base sm:text-lg md:text-xl font-bold">
                            {isEditMode ? 'Edit Purchase Return' : 'Purchase Return Entry'}
                        </h1>
                    </div>
                </div>
                <div className="text-sm sm:text-base font-medium text-blue-100">
                    {currentDate}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Left Panel - Controls & Summary */}
                <div className="w-full lg:w-96 xl:w-[420px] flex-shrink-0 bg-gray-800 border-r border-gray-700 overflow-y-auto flex flex-col">
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {/* Reference Purchase Invoice No */}
                        <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-700 shadow-lg">
                            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-3 uppercase">
                                <Search size={16} className="inline mr-2" />
                                REF PURCHASE INVOICE NO
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <div className="flex-1 relative">
                                    <SearchableDropdown
                                        value={purchaseInvoiceNo}
                                        onChange={setPurchaseInvoiceNo}
                                        placeholder="Select VNO (e.g., PV-001)"
                                        disabled={isEditMode}
                                        onSelect={(val) => {
                                            // Auto-load on select
                                            setPurchaseInvoiceNo(val);
                                        }}
                                    />
                                </div>
                                {!isEditMode && (
                                    <button
                                        onClick={loadPurchaseInvoice}
                                        disabled={isLoadingInvoice || !purchaseInvoiceNo.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                                    >
                                        {isLoadingInvoice ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} />
                                                <span>Loading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Search size={16} />
                                                <span>Search</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Supplier Information */}
                        {purchaseDetails && (
                            <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-700 shadow-lg">
                                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-3 uppercase">
                                    <Building2 size={16} className="inline mr-2" />
                                    SUPPLIER INFORMATION
                                </label>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/20 rounded-lg">
                                            <Building2 size={20} className="text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base sm:text-lg font-bold text-white truncate">{purchaseDetails.voucher.supplierName}</p>
                                            {purchaseDetails.voucher.supplierCode && (
                                                <p className="text-xs sm:text-sm text-gray-400 truncate">Code: {purchaseDetails.voucher.supplierCode}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                                        <Info size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                                        <p className="text-xs sm:text-sm text-yellow-200 leading-relaxed">
                                            Note: All prices are cost prices. This will generate a Debit Note.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reason Selection */}
                        {purchaseDetails && (
                            <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-700 shadow-lg">
                                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-3 uppercase">
                                    <AlertCircle size={16} className="inline mr-2" />
                                    REASON FOR RETURN
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
                                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 text-left hover:bg-gray-700 transition-colors text-sm sm:text-base ${
                                                        reason === r.value ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300'
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

                        {/* Total Refund Amount */}
                        {purchaseDetails && (
                            <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-700 shadow-lg">
                                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-3 uppercase">
                                    <FileText size={16} className="inline mr-2" />
                                    REFUND SUMMARY
                                </label>
                                <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-lg p-4 sm:p-5 border-2 border-red-500/30">
                                    <p className="text-xs sm:text-sm text-gray-400 mb-2">Total Refund Amount</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-red-400">
                                        {calculateRefundTotal().toLocaleString()} <span className="text-base sm:text-lg text-gray-400">MMK</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {returnItems.filter(item => item.returnQty > 0).length} item(s) to return
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {purchaseDetails && (
                            <div className="space-y-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleConfirmReturn}
                                    disabled={isSubmitting || calculateRefundTotal() === 0}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileText size={18} />
                                            <span>{isEditMode ? 'Update Return' : 'Confirm Return'}</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/purchase/return-list')}
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <X size={18} />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Items Table */}
                <div className="flex-1 overflow-y-auto bg-gray-900">
                    {purchaseDetails && returnItems.length > 0 ? (
                        <div className="p-4 sm:p-6">
                            <div className="mb-4 sm:mb-6">
                                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                    <FileText size={20} />
                                    Return Items ({returnItems.length})
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-400 mt-1">Select quantities to return for each item</p>
                            </div>
                            
                            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[600px]">
                                        <thead className="bg-gray-900/50">
                                            <tr>
                                                <th className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-gray-400 uppercase w-12">#</th>
                                                <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-gray-400 uppercase min-w-[200px]">ITEM</th>
                                                <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-medium text-gray-400 uppercase w-24">PRICE</th>
                                                <th className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-gray-400 uppercase w-20">PURCH</th>
                                                <th className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-gray-400 uppercase w-20">HIST</th>
                                                <th className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-gray-400 uppercase w-32">RETURN QTY</th>
                                                <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-medium text-gray-400 uppercase w-28">SUBTOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {returnItems.map((item, index) => (
                                                <tr key={item.purchaseId} className="hover:bg-gray-750 transition-colors">
                                                    <td className="p-3 sm:p-4 text-center text-gray-500 text-sm">{index + 1}</td>
                                                    <td className="p-3 sm:p-4">
                                                        <div className="min-w-0">
                                                            <p className="text-white font-medium text-sm sm:text-base truncate">{item.itemName}</p>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-wider">{item.codeNo}</span>
                                                                {(item.imei1 || item.imei2) && (
                                                                    <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800/30">
                                                                        IMEI: {item.imei1}{item.imei2 ? ` / ${item.imei2}` : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 sm:p-4 text-right text-gray-300 text-sm sm:text-base whitespace-nowrap">
                                                        {item.costPrice.toLocaleString()}
                                                    </td>
                                                    <td className="p-3 sm:p-4 text-center">
                                                        <span className="bg-gray-700 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium text-gray-300">{item.purchased}</span>
                                                    </td>
                                                    <td className="p-3 sm:p-4 text-center">
                                                        <span className="bg-gray-700 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium text-gray-300">{item.history}</span>
                                                    </td>
                                                    <td className="p-3 sm:p-4">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                                                <button
                                                                    onClick={() => handleDecrementQty(item.purchaseId)}
                                                                    disabled={item.returnQty <= 0}
                                                                    className="p-1.5 sm:p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition-colors"
                                                                    title="Decrease"
                                                                >
                                                                    <Minus size={14} className="sm:w-4 sm:h-4" />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={item.purchased - item.history}
                                                                    value={item.returnQty}
                                                                    onChange={(e) => handleReturnQtyChange(item.purchaseId, e.target.value)}
                                                                    className="w-16 sm:w-20 bg-gray-900 border border-gray-600 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-center text-sm sm:text-base text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                                                />
                                                                <button
                                                                    onClick={() => handleIncrementQty(item.purchaseId)}
                                                                    disabled={item.returnQty >= (item.purchased - item.history)}
                                                                    className="p-1.5 sm:p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition-colors"
                                                                    title="Increase"
                                                                >
                                                                    <Plus size={14} className="sm:w-4 sm:h-4" />
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-gray-500 text-center">Max: {item.purchased - item.history}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 sm:p-4 text-right whitespace-nowrap">
                                                        <span className="text-red-400 font-bold text-sm sm:text-base">{item.refundSubtotal.toLocaleString()}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : purchaseDetails ? (
                        <div className="flex items-center justify-center h-full p-8">
                            <div className="text-center">
                                <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                                <p className="text-gray-400 text-sm sm:text-base">No items found in this purchase invoice</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full p-8">
                            <div className="text-center max-w-md">
                                <Search size={48} className="mx-auto text-gray-600 mb-4" />
                                <p className="text-gray-400 text-sm sm:text-base mb-2">Enter a purchase invoice number to begin</p>
                                <p className="text-gray-500 text-xs sm:text-sm">Search for a purchase voucher VNO to load items for return</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Return Voucher Modal */}
            {returnVoucher && returnVoucher.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Purchase Return Voucher</h3>
                            <button
                                onClick={() => {
                                    setReturnVoucher(null);
                                    navigate('/purchase/return-list');
                                }}
                                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <PurchaseReturnVoucher
                                voucher={returnVoucher.voucher}
                                items={returnVoucher.items}
                            />
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Printer size={18} />
                                Print
                            </button>
                            <button
                                onClick={() => {
                                    setReturnVoucher(null);
                                    navigate('/purchase/return-list');
                                }}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
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

export default PurchaseReturn;

