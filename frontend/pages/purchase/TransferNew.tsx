import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
    Plus, 
    Trash2, 
    Loader2, 
    Check, 
    Box, 
    Smartphone,
    Info,
    AlertCircle
} from 'lucide-react';
import { MasterProduct, Branch } from '../../types';
import { API_ENDPOINTS, fetcher, apiClient, sessionManager } from '../../config';

interface TransferItem {
    productId: string;
    productCode: string;
    productName: string;
    imei: string | null;
    qty: number;
    stockId?: string;
    isSerialized: boolean;
}

interface TransferNewProps {
    onComplete: () => void;
    onCancel: () => void;
}

const TransferNew: React.FC<TransferNewProps> = ({ onComplete, onCancel }) => {
    const userBranchId = sessionManager.getBranchId();
    const [toBranchId, setToBranchId] = useState('');
    const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
    const [remark, setRemark] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Fetch branches
    const { data: branchesData } = useSWR<{ success: boolean, data: any[] }>(API_ENDPOINTS.BRANCHES, fetcher);
    const branches = branchesData?.data || [];
    const destinationBranches = branches.filter(b => b.id !== userBranchId);

    // Fetch products
    const { data: dropdownsData } = useSWR(API_ENDPOINTS.PURCHASE_DROPDOWNS, fetcher);
    const products: any[] = dropdownsData?.products || [];

    // Search state
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedImei, setSelectedImei] = useState('');
    const [qty, setQty] = useState(1);
    const [availableStock, setAvailableStock] = useState(0);
    const [availableImeis, setAvailableImeis] = useState<any[]>([]);
    const [isLoadingStock, setIsLoadingStock] = useState(false);

    const selectedProduct = products.find(p => p.id === selectedProductId);

    useEffect(() => {
        const fetchStockInfo = async () => {
            if (!selectedProductId) {
                setAvailableStock(0);
                setAvailableImeis([]);
                return;
            }

            setIsLoadingStock(true);
            try {
                if (selectedProduct?.isSerialized) {
                    const res = await apiClient.get(API_ENDPOINTS.POS_IMEIS(selectedProductId));
                    if (res.success) {
                        setAvailableImeis(res.data || []);
                        setAvailableStock(res.data?.length || 0);
                    }
                } else {
                    const res = await apiClient.get(API_ENDPOINTS.INVENTORY_BY_ID(selectedProductId));
                    if (res.id) {
                        setAvailableStock(res.qty || 0);
                    }
                }
            } catch (error) {
                console.error('Fetch stock error:', error);
            } finally {
                setIsLoadingStock(false);
            }
        };
        fetchStockInfo();
    }, [selectedProductId, selectedProduct]);

    const handleAddItem = () => {
        if (!selectedProductId) return;

        // Check if item is already in list (for non-serialized, we'll add to qty instead of alert)
        const existingIndex = transferItems.findIndex(item => item.productId === selectedProductId && item.imei === (selectedImei || null));
        
        let currentInListQty = 0;
        if (existingIndex >= 0) {
            // For serialized, we already alert below. For non-serialized, we check total qty.
            if (!selectedProduct?.isSerialized) {
                currentInListQty = transferItems[existingIndex].qty;
            }
        }

        const requestedQty = selectedProduct?.isSerialized ? 1 : qty;
        
        if (currentInListQty + requestedQty > availableStock) {
            alert(`Cannot add more than available stock (${availableStock} units). Already have ${currentInListQty} in list.`);
            return;
        }

        if (selectedProduct?.isSerialized && !selectedImei) {
            alert('Please select an IMEI');
            return;
        }

        const imeiData = availableImeis.find(i => i.imei_1 === selectedImei);

        if (existingIndex >= 0) {
            if (selectedProduct?.isSerialized) {
                alert('This IMEI is already in the list');
                return;
            } else {
                const newItems = [...transferItems];
                newItems[existingIndex].qty += requestedQty;
                setTransferItems(newItems);
            }
        } else {
            const newItem: TransferItem = {
                productId: selectedProductId,
                productCode: selectedProduct!.codeNo,
                productName: selectedProduct!.name,
                imei: selectedImei || null,
                qty: requestedQty,
                stockId: imeiData?.id,
                isSerialized: !!selectedProduct?.isSerialized
            };
            setTransferItems([...transferItems, newItem]);
        }

        setSelectedProductId('');
        setSelectedImei('');
        setQty(1);
    };

    const handleRemoveItem = (index: number) => {
        setTransferItems(transferItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!toBranchId) {
            alert('Please select a destination branch');
            return;
        }
        if (transferItems.length === 0) {
            alert('Please add at least one item');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await apiClient.post(API_ENDPOINTS.TRANSFERS, {
                toBranchId,
                remark,
                items: transferItems
            });

            if (res.success) {
                onComplete();
            } else {
                setNotification({ message: res.message || 'Failed to initiate transfer', type: 'error' });
            }
        } catch (error: any) {
            setNotification({ message: error.message || 'An error occurred', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Destination Branch</label>
                        <select 
                            value={toBranchId}
                            onChange={(e) => setToBranchId(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            <option value="">Select Branch</option>
                            {destinationBranches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Remark</label>
                        <input 
                            type="text"
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="Add notes..."
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-lg">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Add Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Product</label>
                        <select 
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Select Product</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>[{p.codeNo}] {p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        {selectedProduct?.isSerialized ? (
                            <>
                                <label className="block text-xs text-gray-500 mb-1">
                                    IMEI {isLoadingStock ? '...' : `(Available: ${availableStock})`}
                                </label>
                                <select 
                                    value={selectedImei}
                                    onChange={(e) => setSelectedImei(e.target.value)}
                                    disabled={isLoadingStock}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                                >
                                    <option value="">{isLoadingStock ? 'Loading...' : 'Select IMEI'}</option>
                                    {availableImeis.map(i => (
                                        <option key={i.id} value={i.imei_1}>{i.imei_1}</option>
                                    ))}
                                </select>
                            </>
                        ) : (
                            <>
                                <label className="block text-xs text-gray-500 mb-1">
                                    Qty {isLoadingStock ? '...' : `(Max: ${availableStock})`}
                                </label>
                                <input 
                                    type="number"
                                    min="1"
                                    max={availableStock}
                                    value={qty}
                                    onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </>
                        )}
                    </div>
                    <button 
                        onClick={handleAddItem}
                        disabled={!selectedProductId}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Add
                    </button>
                </div>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden min-h-[200px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 font-bold text-gray-500">Item</th>
                            <th className="px-6 py-3 font-bold text-gray-500 text-center">Serial / Qty</th>
                            <th className="px-6 py-3 font-bold text-gray-500 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {transferItems.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-800/50">
                                <td className="px-6 py-3">
                                    <div className="text-white font-medium">{item.productName}</div>
                                    <div className="text-xs text-gray-500">{item.productCode}</div>
                                </td>
                                <td className="px-6 py-3 text-center">
                                    {item.imei ? (
                                        <code className="text-emerald-400 font-mono text-xs">{item.imei}</code>
                                    ) : (
                                        <span className="font-bold text-white">{item.qty}</span>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button onClick={() => handleRemoveItem(index)} className="text-gray-500 hover:text-red-400 p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-inner">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-900/30 rounded-lg text-blue-400"><Info size={20} /></div>
                    <div className="text-sm font-bold text-white">{transferItems.length} Items Selected</div>
                </div>
                <div className="flex gap-4">
                    <button onClick={onCancel} className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all">Cancel</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || transferItems.length === 0 || !toBranchId}
                        className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        Confirm Transfer
                    </button>
                </div>
            </div>

            {notification && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white z-[200]`}>
                    <AlertCircle size={20} /> {notification.message}
                </div>
            )}
        </div>
    );
};

export default TransferNew;
