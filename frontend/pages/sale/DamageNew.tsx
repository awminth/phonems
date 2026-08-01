import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Search, 
    Loader2, 
    CheckCircle, 
    AlertTriangle, 
    Package, 
    Info, 
    ChevronDown, 
    Check,
    Wrench
} from 'lucide-react';
import { API_ENDPOINTS, apiClient, sessionManager } from '../../config';

interface Product {
    id: string;
    code: string;
    name: string;
    stock: number;
    isSerialized: number;
}

const DamageNew: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isAdmin = sessionManager.getUserType() === 'admin';

    const [form, setForm] = useState({
        qty: 1,
        reason: '',
        date: new Date().toISOString().split('T')[0],
        stockId: '',
        imei: ''
    });

    const [availableImeis, setAvailableImeis] = useState<any[]>([]);
    const [isLoadingImeis, setIsLoadingImeis] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search products
    useEffect(() => {
        const searchProducts = async () => {
            if (!searchQuery.trim()) {
                setProducts([]);
                return;
            }
            setIsSearching(true);
            try {
                const result = await apiClient.get(`${API_ENDPOINTS.POS_ITEMS}?search=${searchQuery}&limit=10`);
                if (result.success) {
                    setProducts(result.data);
                }
            } catch (error) {
                console.error('Search products error:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(searchProducts, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch IMEIs if product is serialized
    useEffect(() => {
        const fetchImeis = async () => {
            if (!selectedProduct || selectedProduct.isSerialized !== 1) return;
            setIsLoadingImeis(true);
            try {
                const result = await apiClient.get(API_ENDPOINTS.POS_IMEIS(selectedProduct.id));
                if (result.success) {
                    setAvailableImeis(result.data);
                }
            } catch (error) {
                console.error('Fetch IMEIs error:', error);
            } finally {
                setIsLoadingImeis(false);
            }
        };
        fetchImeis();
    }, [selectedProduct]);

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setSearchQuery(product.name);
        setIsDropdownOpen(false);
        setForm(prev => ({ ...prev, qty: 1, stockId: '', imei: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        // Validation
        if (form.qty <= 0) {
            setNotification({ message: 'Quantity must be greater than 0', type: 'error' });
            return;
        }
        if (form.qty > selectedProduct.stock && selectedProduct.isSerialized !== 1) {
             setNotification({ message: 'Quantity exceeds available stock', type: 'error' });
             return;
        }
        if (selectedProduct.isSerialized && !form.stockId) {
            setNotification({ message: 'Please select an IMEI for serialized items', type: 'error' });
            return;
        }
        if (!form.reason.trim()) {
            setNotification({ message: 'Please provide a reason', type: 'error' });
            return;
        }

        setIsLoading(true);
        try {
            const result = await apiClient.post(API_ENDPOINTS.DAMAGES, {
                productId: selectedProduct.id,
                qty: selectedProduct.isSerialized ? 1 : form.qty,
                reason: form.reason,
                date: form.date,
                stockId: form.stockId,
                imei: form.imei
            });

            if (result.success) {
                setNotification({ message: 'Damage reported successfully', type: 'success' });
                setTimeout(() => navigate('/sale/damage'), 1500);
            } else {
                setNotification({ message: result.message || 'Failed to report damage', type: 'error' });
            }
        } catch (error) {
            console.error('Submit damage error:', error);
            setNotification({ message: 'An error occurred', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            <header className="bg-gray-800 shadow-md p-4 flex items-center gap-4 border-b border-gray-700 h-16 shrink-0">
                <button onClick={() => navigate('/sale/damage')} className="p-2 rounded-full hover:bg-gray-700 text-gray-300">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">Report Damaged Inventory</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-10 flex justify-center bg-gray-900">
                <div className="w-full max-w-2xl">
                    {notification && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300 ${
                            notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                            <span className="font-medium">{notification.message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-700 space-y-6">
                        {/* Product Search */}
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Select Product</label>
                            <div className="relative">
                                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setIsDropdownOpen(true);
                                        if (selectedProduct) setSelectedProduct(null);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    placeholder="Search by name or code..."
                                    className="w-full bg-gray-900 border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 size={18} className="animate-spin text-orange-500" />
                                    </div>
                                )}
                            </div>

                            {isDropdownOpen && products.length > 0 && (
                                <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                    {products.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handleProductSelect(p)}
                                            className="w-full p-4 text-left hover:bg-gray-700 border-b border-gray-700 last:border-0 flex justify-between items-center transition-colors"
                                        >
                                            <div>
                                                <div className="font-bold text-white">{p.name}</div>
                                                <div className="text-xs text-gray-400">{p.code}</div>
                                            </div>
                                            <div className="text-sm text-orange-400 font-bold">Stock: {p.stock}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedProduct && (
                            <div className="animate-in fade-in slide-in-from-top duration-300 space-y-6">
                                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 flex items-start gap-3">
                                    <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-300">
                                            Reporting damage for <span className="text-white font-bold">{selectedProduct.name}</span>. 
                                            Stock will be deducted from <span className="text-orange-400 font-bold">{selectedProduct.stock}</span> units.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Quantity</label>
                                        <input 
                                            type="number"
                                            value={form.qty}
                                            min="1"
                                            disabled={selectedProduct.isSerialized}
                                            onChange={(e) => setForm(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50"
                                        />
                                        {selectedProduct.isSerialized && (
                                            <p className="text-[10px] text-gray-500 mt-1">Serialized items are reported 1 by 1.</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                                        <input 
                                            type="date"
                                            value={form.date}
                                            onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {selectedProduct.isSerialized && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Select IMEI</label>
                                        {isLoadingImeis ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-500 p-3">
                                                <Loader2 size={16} className="animate-spin" /> Loading available IMEIs...
                                            </div>
                                        ) : availableImeis.length === 0 ? (
                                            <div className="text-red-400 text-sm p-3 bg-red-900/10 rounded-lg border border-red-900/30">
                                                No available IMEIs found for this product.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {availableImeis.map(imei => (
                                                    <button
                                                        key={imei.id}
                                                        type="button"
                                                        onClick={() => setForm(prev => ({ ...prev, stockId: imei.id, imei: imei.imei_1 }))}
                                                        className={`p-3 text-left rounded-xl border text-sm transition-all flex justify-between items-center ${
                                                            form.stockId === imei.id 
                                                            ? 'bg-orange-600/20 border-orange-500 text-white' 
                                                            : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="font-mono">{imei.imei_1}</div>
                                                            {imei.imei_2 && <div className="text-[10px] opacity-60">SIM2: {imei.imei_2}</div>}
                                                        </div>
                                                        {form.stockId === imei.id && <Check size={16} />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Reason / Description</label>
                                    <textarea 
                                        rows={3}
                                        value={form.reason}
                                        onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                                        placeholder="e.g. Cracked screen, Water damage, Factory defect..."
                                        className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                                    />
                                </div>

                                {isAdmin && (
                                    <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2 text-red-400">
                                        <AlertTriangle size={18} />
                                        <span className="text-sm font-medium">Administrator account cannot report damage. View only mode.</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || isAdmin || (selectedProduct.isSerialized && !form.stockId)}
                                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-orange-900/30 transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={24} className="animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Wrench size={24} />
                                            Submit Damage Report
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DamageNew;
