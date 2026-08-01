import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Plus, 
    Search, 
    Download, 
    Edit, 
    Trash2, 
    ChevronLeft, 
    ChevronRight,
    X,
    Upload,
    ChevronDown,
    Check,
    Image as ImageIcon,
    LayoutGrid,
    Building2,
    ShoppingBag,
    Tags,
    Phone,
    Mail,
    MapPin,
    Loader2,
    RefreshCw,
    DollarSign,
    CreditCard,
    History,
    Eye,
    Smartphone,
    Cpu,
    Box,
    Filter,
    Wrench
} from 'lucide-react';
import { PurchaseItem, Category, Supplier, MasterProduct } from '../../types';
import { MOCK_PURCHASE_LIST, MOCK_CATEGORIES, MOCK_SUPPLIERS } from '../../constants';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, getImageUrl, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';
import * as XLSX from 'xlsx';

// --- Shared Components ---

// Confirm Modal Component
interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    isLoading = false,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'bg-red-900/50 text-red-400',
            button: 'bg-red-600 hover:bg-red-500'
        },
        warning: {
            icon: 'bg-yellow-900/50 text-yellow-400',
            button: 'bg-yellow-600 hover:bg-yellow-500'
        },
        info: {
            icon: 'bg-blue-900/50 text-blue-400',
            button: 'bg-blue-600 hover:bg-blue-500'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    {/* Icon */}
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${styles.icon}`}>
                        <Trash2 size={32} />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    
                    {/* Message */}
                    <p className="text-gray-400 mb-6">{message}</p>
                    
                    {/* Buttons */}
                    <div className="flex gap-3 justify-center">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-5 py-2.5 rounded-xl text-white font-bold shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50 ${styles.button}`}
                        >
                            {isLoading && <Loader2 className="animate-spin" size={18} />}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Custom Searchable Dropdown
interface SearchableDropdownProps {
    options: { id: string, name: string }[];
    value: string; // ID
    onChange: (id: string, name: string) => void;
    placeholder: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative" ref={dropdownRef}>
            <div 
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 flex justify-between items-center cursor-pointer text-sm focus-within:ring-2 focus-within:ring-blue-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDown size={16} className="text-gray-400"/>
            </div>
            
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800">
                        <div className="flex items-center bg-gray-700 rounded px-2">
                            <Search size={14} className="text-gray-400 mr-2"/>
                            <input 
                                type="text"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm py-1.5 text-white placeholder-gray-500 outline-none"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <div 
                                    key={option.id}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-600 hover:text-white flex justify-between items-center ${option.id === value ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300'}`}
                                    onClick={() => {
                                        onChange(option.id, option.name);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    {option.name}
                                    {option.id === value && <Check size={14} />}
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-sm text-gray-500 text-center">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub-Components (Tabs) ---

interface PurchasesResponse {
    success: boolean;
    data: PurchaseItem[];
    totals: {
        qty: number;
        amount: number;
    };
    pagination: PaginationInfo;
    fromCache: boolean;
}

interface DropdownsResponse {
    success: boolean;
    categories: { id: string; name: string }[];
    suppliers: { id: string; name: string }[];
}

interface PurchaseVoucher {
    id: string; // AID
    vno: string; // VNO
    supplierId: string; // SupplierID
    supplierName: string;
    supplierCode: string;
    amount: number; // Amount
    date: string; // Date
    userId: string;
    userName: string;
    itemCount: number;
    totalPaid: number;
    branchName?: string;
}

interface PurchaseVouchersResponse {
    success: boolean;
    data: PurchaseVoucher[];
    pagination: PaginationInfo;
    fromCache: boolean;
}

const PurchaseDetailTab: React.FC<{ type: 'phone' | 'accessory' | 'service' | 'spare' }> = ({ type }) => {
    const isAdmin = sessionManager.getUserType() === 'admin';
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PurchaseItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
        isOpen: false,
        id: '',
        name: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Pagination & Search state
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    
    // Expandable filters state
    const [showFilters, setShowFilters] = useState(false);
    const [filterCode, setFilterCode] = useState('');
    const [filterName, setFilterName] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('');
    const [filterFromDate, setFilterFromDate] = useState('');
    const [filterToDate, setFilterToDate] = useState('');

    const [activeFilterCode, setActiveFilterCode] = useState('');
    const [activeFilterName, setActiveFilterName] = useState('');
    const [activeFilterCategory, setActiveFilterCategory] = useState('');
    const [activeFilterSupplier, setActiveFilterSupplier] = useState('');
    const [activeFilterFromDate, setActiveFilterFromDate] = useState('');
    const [activeFilterToDate, setActiveFilterToDate] = useState('');

    // Form State
    const initialFormState: PurchaseItem = {
        id: '',
        code: '',
        name: '',
        qty: 1,
        purchasePrice: 0,
        sellPrice: 0,
        categoryId: '',
        categoryName: '',
        supplierId: '',
        supplierName: '',
        date: new Date().toISOString().split('T')[0],
        image: null
    };
    const [formData, setFormData] = useState<PurchaseItem>(initialFormState);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    // SWR for purchases data
    const { data, error, isLoading, mutate } = useSWR<PurchasesResponse>(
        `${API_ENDPOINTS.PURCHASES}?page=${page}&limit=${limit}&type=${type}&search=${encodeURIComponent(search)}&code=${encodeURIComponent(activeFilterCode)}&name=${encodeURIComponent(activeFilterName)}&categoryId=${activeFilterCategory}&supplierId=${activeFilterSupplier}&fromDate=${activeFilterFromDate}&toDate=${activeFilterToDate}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    // SWR for dropdown options
    const { data: dropdownData } = useSWR<DropdownsResponse>(
        API_ENDPOINTS.PURCHASE_DROPDOWNS,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

    const purchases = data?.data || [];
    const totals = data?.totals || { qty: 0, amount: 0 };
    const pagination = data?.pagination;
    const categories = dropdownData?.categories || [];
    const suppliers = dropdownData?.suppliers || [];

    const handleSearch = useCallback(() => {
        setSearch(searchInput);
        setPage(1);
    }, [searchInput]);

    const handleApplyFilters = () => {
        setActiveFilterCode(filterCode);
        setActiveFilterName(filterName);
        setActiveFilterCategory(filterCategory);
        setActiveFilterSupplier(filterSupplier);
        setActiveFilterFromDate(filterFromDate);
        setActiveFilterToDate(filterToDate);
        setPage(1);
    };

    const handleResetFilters = () => {
        setFilterCode('');
        setFilterName('');
        setFilterCategory('');
        setFilterSupplier('');
        setFilterFromDate('');
        setFilterToDate('');
        setActiveFilterCode('');
        setActiveFilterName('');
        setActiveFilterCategory('');
        setActiveFilterSupplier('');
        setActiveFilterFromDate('');
        setActiveFilterToDate('');
        setPage(1);
    };

    // Export to Excel with UTF-8 encoding
    const exportToExcel = () => {
        if (purchases.length === 0) return;

        const typeLabel = type === 'phone' ? 'Phones' : type === 'accessory' ? 'Accessories' : type === 'service' ? 'Service Items' : 'Spare Parts';
        const title = `Purchase Items Report - ${typeLabel}`;
        
        const headers = type === 'phone'
            ? ["Code", "Item Name", "Specification", "Category", "Supplier", "Qty", "Purchase Price", "Total Cost", "Sell Price", "Date"]
            : ["Code", "Item Name", "Category", "Supplier", "Qty", "Purchase Price", "Total Cost", "Sell Price", "Date"];
        
        const excelData = purchases.map(item => type === 'phone' ? [
            item.code,
            item.name,
            item.specification || '-',
            item.categoryName || '',
            item.supplierName || '',
            item.qty,
            item.purchasePrice,
            item.qty * (item.purchasePrice || 0),
            item.sellPrice,
            item.date
        ] : [
            item.code,
            item.name,
            item.categoryName || '',
            item.supplierName || '',
            item.qty,
            item.purchasePrice,
            item.qty * (item.purchasePrice || 0),
            item.sellPrice,
            item.date
        ]);

        excelData.push(type === 'phone' ? [
            '', '', '', '', 'TOTAL:', 
            totals.qty, 
            '', 
            totals.amount || 0, 
            '', 
            ''
        ] : [
            '', '', '', 'TOTAL:', 
            totals.qty, 
            '', 
            totals.amount || 0, 
            '', 
            ''
        ]);

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `purchase_${type}_report_${timestamp}.xlsx`, typeLabel);
    };

    // Handlers
    const handleOpenModal = (item?: PurchaseItem) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
            setImagePreview(item.image ? getImageUrl(item.image) : null);
        } else {
            setEditingItem(null);
            setFormData({ ...initialFormState, code: `PUR-${Math.floor(1000 + Math.random() * 9000)}` });
            setImagePreview(null);
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Create FormData for file upload
            const submitData = new FormData();
            submitData.append('code', formData.code);
            submitData.append('name', formData.name);
            submitData.append('qty', formData.qty.toString());
            submitData.append('purchasePrice', formData.purchasePrice.toString());
            submitData.append('sellPrice', formData.sellPrice.toString());
            submitData.append('categoryId', formData.categoryId || '');
            submitData.append('supplierId', formData.supplierId || '');
            submitData.append('date', formData.date);
            
            // Append image file if selected
            if (imageFile) {
                submitData.append('image', imageFile);
            }

            if (editingItem) {
                const result = await apiClient.putFormData(API_ENDPOINTS.PURCHASE_BY_ID(editingItem.id), submitData);
                if (result.success) {
                    mutate();
                    setIsModalOpen(false);
                    setImageFile(null);
                    setImagePreview(null);
                } else {
                    alert(result.message || 'Failed to update purchase');
                }
            } else {
                const result = await apiClient.postFormData(API_ENDPOINTS.PURCHASES, submitData);
                if (result.success) {
                    mutate();
                    setIsModalOpen(false);
                    setImageFile(null);
                    setImagePreview(null);
                } else {
                    alert(result.message || 'Failed to create purchase');
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteConfirm = (id: string, itemName: string) => {
        setDeleteConfirm({ isOpen: true, id, name: itemName });
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirm({ isOpen: false, id: '', name: '' });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await apiClient.delete(API_ENDPOINTS.PURCHASE_BY_ID(deleteConfirm.id));
            if (result.success) {
                mutate();
                closeDeleteConfirm();
            } else {
                alert(result.message || 'Failed to delete purchase');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFile = (file: File) => {
        // Store the file for upload
        setImageFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Actions Bar */}
            <div className="bg-gray-800 rounded-xl p-4 shadow-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-700">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search items..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <button onClick={handleSearch} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">Search</button>
                    <button onClick={() => {
                        setSearchInput('');
                        setSearch('');
                        setPage(1);
                        mutate();
                    }} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors" title="Refresh">
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowFilters(!showFilters)} 
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors text-sm font-medium border ${
                            showFilters 
                                ? 'bg-blue-600/20 text-blue-400 border-blue-500 hover:bg-blue-600/30' 
                                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-650'
                        }`} 
                        title="Toggle Filters"
                    >
                        <Filter size={18} />
                        <span>Filters</span>
                        {(activeFilterCode || activeFilterName || activeFilterCategory || activeFilterSupplier || activeFilterFromDate || activeFilterToDate) ? (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        ) : null}
                    </button>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={exportToExcel}
                        disabled={purchases.length === 0}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Download size={18} /> Export
                    </button>
                </div>
            </div>

            {/* Collapsible Filters Panel */}
            {showFilters && (
                <div className="bg-gray-800 rounded-xl p-5 shadow-lg mb-6 border border-gray-700 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <Filter size={16} className="text-blue-500" />
                            Filter Purchase Details
                        </h3>
                        {(filterCode || filterName || filterCategory || filterSupplier || filterFromDate || filterToDate) ? (
                            <button
                                onClick={handleResetFilters}
                                className="text-xs text-red-400 hover:text-red-300 hover:underline transition-colors"
                            >
                                Clear All
                            </button>
                        ) : null}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* Product Code */}
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Product Code</label>
                            <input
                                type="text"
                                placeholder="Search code..."
                                value={filterCode}
                                onChange={(e) => setFilterCode(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-650 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Item Name */}
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Item Name</label>
                            <input
                                type="text"
                                placeholder="Search name..."
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-650 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Category (Dropdown & Search) */}
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</label>
                            <SearchableDropdown
                                options={[{ id: '', name: 'All Categories' }, ...categories]}
                                value={filterCategory}
                                onChange={(id, name) => setFilterCategory(id)}
                                placeholder="Select Category"
                            />
                        </div>

                        {/* Supplier (Dropdown & Search) */}
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Supplier</label>
                            <SearchableDropdown
                                options={[{ id: '', name: 'All Suppliers' }, ...suppliers]}
                                value={filterSupplier}
                                onChange={(id, name) => setFilterSupplier(id)}
                                placeholder="Select Supplier"
                            />
                        </div>

                        {/* Purchase From Date */}
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">From Date</label>
                            <input
                                type="date"
                                value={filterFromDate}
                                onChange={(e) => setFilterFromDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-650 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Purchase To Date */}
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">To Date</label>
                            <input
                                type="date"
                                value={filterToDate}
                                onChange={(e) => setFilterToDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-650 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-700">
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="px-4 py-2 bg-gray-750 text-gray-300 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors text-sm font-medium"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={handleApplyFilters}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-bold shadow-md shadow-blue-900/30 flex items-center gap-1.5"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                    <p className="text-red-400">Failed to load purchases.</p>
                    <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Retry</button>
                </div>
            )}

            {/* Table */}
            {!isLoading && !error && (
                <>
                    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                        <th className="p-4 w-16">Image</th>
                                        <th className="p-4">Code</th>
                                        <th className="p-4">Item Name</th>
                                        {type === 'phone' && <th className="p-4">Specification</th>}
                                        <th className="p-4 text-center">Qty</th>
                                        <th className="p-4 text-right">Purchase Price</th>
                                        <th className="p-4 text-right font-bold">Total</th>
                                        <th className="p-4 text-right">Sell Price</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Supplier</th>
                                        {sessionManager.getUserType() === 'admin' && <th className="p-4 text-center">Shop / Branch</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {purchases.length > 0 ? (
                                        purchases.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                                <td className="p-4">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden border border-gray-600">
                                                        <img 
                                                            src={item.image ? getImageUrl(item.image) : getImageUrl('/assets/icon.jpg')} 
                                                            alt={item.name} 
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = getImageUrl('/assets/icon.jpg');
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-gray-300">{item.code}</td>
                                                <td className="p-4 text-sm font-medium text-white">{item.name}</td>
                                                {type === 'phone' && <td className="p-4 text-sm text-gray-300 font-medium">{item.specification || '-'}</td>}
                                                <td className="p-4 text-sm text-center">
                                                    <span className="bg-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-bold">{item.qty}</span>
                                                </td>
                                                <td className="p-4 text-sm text-right text-emerald-400">{item.purchasePrice?.toLocaleString()}</td>
                                                <td className="p-4 text-sm text-right font-bold text-white">{(item.qty * (item.purchasePrice || 0)).toLocaleString()}</td>
                                                <td className="p-4 text-sm text-right text-blue-400">{item.sellPrice?.toLocaleString()}</td>
                                                <td className="p-4 text-sm text-gray-400">{item.categoryName || '-'}</td>
                                                <td className="p-4 text-sm text-gray-400">{item.supplierName || '-'}</td>
                                                {sessionManager.getUserType() === 'admin' && (
                                                    <td className="p-4 text-center">
                                                        <span className="px-2 py-1 bg-indigo-900/30 text-indigo-400 border border-indigo-800 rounded-lg text-xs font-medium">
                                                            {item.branchName || 'Unknown'}
                                                        </span>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={type === 'phone' ? (sessionManager.getUserType() === 'admin' ? 11 : 10) : (sessionManager.getUserType() === 'admin' ? 10 : 9)} className="p-8 text-center text-gray-500">
                                                No items found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    {/* Page Total */}
                                    <tr className="bg-gray-950/30 font-bold border-t border-gray-750 text-sm">
                                        <td colSpan={type === 'phone' ? 4 : 3} className="p-4 text-right text-gray-400">Page Total:</td>
                                        <td className="p-4 text-center text-gray-200">
                                            {purchases.reduce((sum, item) => sum + (item.qty || 0), 0)}
                                        </td>
                                        <td className="p-4"></td>
                                        <td className="p-4 text-right text-emerald-400">
                                            {purchases.reduce((sum, item) => sum + (item.qty * (item.purchasePrice || 0)), 0).toLocaleString()}
                                        </td>
                                        <td colSpan={sessionManager.getUserType() === 'admin' ? 4 : 3}></td>
                                    </tr>
                                    {/* Grand Total */}
                                    <tr className="bg-gray-900/60 font-bold border-t border-gray-700 text-sm">
                                        <td colSpan={type === 'phone' ? 4 : 3} className="p-4 text-right text-gray-400">Grand Total:</td>
                                        <td className="p-4 text-center text-emerald-400">
                                            {totals.qty}
                                        </td>
                                        <td className="p-4"></td>
                                        <td className="p-4 text-right text-blue-400">
                                            {(totals.amount || 0).toLocaleString()}
                                        </td>
                                        <td colSpan={sessionManager.getUserType() === 'admin' ? 4 : 3}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {/* Pagination */}
                        {pagination && pagination.total > 0 && (
                            <div className="p-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span>Show</span>
                                    <select
                                        value={limit}
                                        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                        className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-white outline-none"
                                    >
                                        {PAGINATION_CONFIG.LIMIT_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <span>of {pagination.total} entries</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setPage(page - 1)}
                                        disabled={!pagination.hasPrev}
                                        className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (page <= 3) {
                                                pageNum = i + 1;
                                            } else if (page >= pagination.totalPages - 2) {
                                                pageNum = pagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = page - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPage(pageNum)}
                                                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                                        page === pageNum
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-800 border border-gray-600 hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button 
                                        onClick={() => setPage(page + 1)}
                                        disabled={!pagination.hasNext}
                                        className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200 my-8">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white">
                                {editingItem ? 'Edit Purchase Item' : 'New Purchase Entry'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Code No</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Item Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Qty</label>
                                            <input 
                                                type="number" 
                                                required
                                                min="1"
                                                value={formData.qty}
                                                onChange={(e) => setFormData({...formData, qty: Number(e.target.value)})}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                                            <input 
                                                type="date" 
                                                required
                                                value={formData.date}
                                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Purchase Price</label>
                                            <input 
                                                type="number" 
                                                required
                                                value={formData.purchasePrice}
                                                onChange={(e) => setFormData({...formData, purchasePrice: Number(e.target.value)})}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Sell Price</label>
                                            <input 
                                                type="number" 
                                                required
                                                value={formData.sellPrice}
                                                onChange={(e) => setFormData({...formData, sellPrice: Number(e.target.value)})}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                                        <SearchableDropdown 
                                            options={categories}
                                            value={formData.categoryId}
                                            onChange={(id, name) => setFormData({...formData, categoryId: id, categoryName: name})}
                                            placeholder="Select Category"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Supplier</label>
                                        <SearchableDropdown 
                                            options={suppliers}
                                            value={formData.supplierId}
                                            onChange={(id, name) => setFormData({...formData, supplierId: id, supplierName: name})}
                                            placeholder="Select Supplier"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Item Image</label>
                                        <div 
                                            className={`
                                                border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                                                ${dragActive ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'}
                                            `}
                                            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                                            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                            onDrop={(e) => { 
                                                e.preventDefault(); 
                                                setDragActive(false);
                                                if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                                            }}
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            <input 
                                                id="file-upload" 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                                            />
                                            {imagePreview ? (
                                                <div className="relative group w-full h-32">
                                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <Upload size={24} className="text-gray-400 mb-2" />
                                                    <span className="text-sm text-gray-300">Upload Image</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-700">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700" disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                                    {editingItem ? 'Update' : 'Save Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Item"
                message={`Are you sure you want to delete "${deleteConfirm.name}"? This will also update the inventory.`}
                onConfirm={handleDelete}
                onCancel={closeDeleteConfirm}
                isLoading={isDeleting}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
};

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface CategoriesResponse {
    success: boolean;
    data: Category[];
    pagination: PaginationInfo;
    fromCache: boolean;
}

const CategoryTab: React.FC = () => {
    const isAdmin = sessionManager.getUserType() === 'admin';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
        isOpen: false,
        id: '',
        name: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Pagination state
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // SWR for data fetching
    const { data, error, isLoading, mutate } = useSWR<CategoriesResponse>(
        `${API_ENDPOINTS.CATEGORIES}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    const categories = data?.data || [];
    const pagination = data?.pagination;

    const handleSearch = useCallback(() => {
        setSearch(searchInput);
        setPage(1);
    }, [searchInput]);

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setName(category.name);
        } else {
            setEditingCategory(null);
            setName('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingCategory) {
                const result = await apiClient.put(API_ENDPOINTS.CATEGORY_BY_ID(editingCategory.id), { name });
                if (result.success) {
                    mutate();
                    setIsModalOpen(false);
                } else {
                    alert(result.message || 'Failed to update category');
                }
            } else {
                const result = await apiClient.post(API_ENDPOINTS.CATEGORIES, { name });
                if (result.success) {
                    mutate();
                    setIsModalOpen(false);
                } else {
                    alert(result.message || 'Failed to create category');
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteConfirm = (id: string, categoryName: string) => {
        setDeleteConfirm({ isOpen: true, id, name: categoryName });
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirm({ isOpen: false, id: '', name: '' });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await apiClient.delete(API_ENDPOINTS.CATEGORY_BY_ID(deleteConfirm.id));
            if (result.success) {
                mutate();
                closeDeleteConfirm();
            } else {
                alert(result.message || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="flex gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search categories..."
                            className="w-full bg-gray-800 border border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    <button onClick={handleSearch} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors">Search</button>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => {
                        setSearchInput('');
                        setSearch('');
                        setPage(1);
                        mutate();
                    }} className="p-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors" title="Refresh">
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    {sessionManager.getUserType() !== 'user' && (
                        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg">
                            <Plus size={20} /> Add Category
                        </button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                    <p className="text-red-400">Failed to load categories.</p>
                    <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Retry</button>
                </div>
            )}

            {/* Data Table */}
            {!isLoading && !error && (
                <>
                    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs font-bold border-b border-gray-700">
                                <tr>
                                    <th className="p-4 w-20 text-center">No</th>
                                    <th className="p-4">Category Name</th>
                                    <th className="p-4 text-center w-32">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {categories.map((cat, index) => (
                                    <tr key={cat.id} className="hover:bg-gray-750 transition-colors">
                                        <td className="p-4 text-center text-gray-500">
                                            {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                                        </td>
                                        <td className="p-4 font-medium text-white">{cat.name}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {sessionManager.getUserType() !== 'user' && (
                                                    <>
                                                        <button onClick={() => handleOpenModal(cat)} className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg"><Edit size={18} /></button>
                                                        <button onClick={() => openDeleteConfirm(cat.id, cat.name)} className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg"><Trash2 size={18} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-gray-500">No categories found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.total > 0 && (
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>Show</span>
                                <select
                                    value={limit}
                                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                    className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white outline-none"
                                >
                                    {PAGINATION_CONFIG.LIMIT_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <span>of {pagination.total} entries</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= pagination.totalPages - 2) {
                                            pageNum = pagination.totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                                    page === pageNum
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-800 border border-gray-600 hover:bg-gray-700'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={!pagination.hasNext}
                                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Tags className="text-blue-500"/> {editingCategory ? 'Edit Category' : 'New Category'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Category Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Enter category name"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700" disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                                    {editingCategory ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Category"
                message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                onCancel={closeDeleteConfirm}
                isLoading={isDeleting}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
};

interface ProductsResponse {
    success: boolean;
    data: MasterProduct[];
    pagination: PaginationInfo;
    fromCache: boolean;
}

interface SuppliersResponse {
    success: boolean;
    data: Supplier[];
    pagination: PaginationInfo;
    fromCache: boolean;
}

const ProductTab: React.FC = () => {
    const isAdmin = sessionManager.getUserType() === 'admin';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<MasterProduct | null>(null);
    const initialForm = { 
        code: '', 
        name: '', 
        categoryId: '', 
        supplierId: '', 
        isSerialized: false, 
        isService: false,
        isSparePart: false,
        sellingPrice: 0, 
        minStockQty: 0 
    };
    const [formData, setFormData] = useState(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
        isOpen: false,
        id: '',
        name: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Pagination state
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [parsedProducts, setParsedProducts] = useState<any[]>([]);
    const [importError, setImportError] = useState<string | null>(null);

    // SWR for products
    const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
        `${API_ENDPOINTS.PRODUCTS}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    // SWR for categories and suppliers (for dropdowns)
    const { data: categoriesData } = useSWR<{ success: boolean; data: Category[] }>(`${API_ENDPOINTS.CATEGORIES}?limit=999999`, fetcher);
    const { data: suppliersData } = useSWR<{ success: boolean; data: Supplier[] }>(`${API_ENDPOINTS.SUPPLIERS}?limit=999999`, fetcher);

    const products = data?.data || [];
    const pagination = data?.pagination;
    const categories = categoriesData?.data || [];
    const suppliers = suppliersData?.data || [];

    const handleSearch = useCallback(() => {
        setSearch(searchInput);
        setPage(1);
    }, [searchInput]);

    const handleDownloadTemplate = () => {
        const headers = [
            "Code No", 
            "Item Name", 
            "Category", 
            "Brand (Supplier)", 
            "Selling Price", 
            "Min Stock Limit", 
            "Serialized (Yes/No)", 
            "Service Item (Yes/No)", 
            "Spare Part (Yes/No)"
        ];
        
        const sampleRows = [
            ["IP15P-128", "iPhone 15 Pro 128GB", categories[0]?.name || "Phones", suppliers[0]?.name || "Apple", 3500000, 5, "Yes", "No", "No"],
            ["CH-20W", "20W USB-C Power Adapter", categories[1]?.name || "Accessories", suppliers[1]?.name || "Apple", 45000, 10, "No", "No", "No"],
            ["SRV-SCRN", "Screen Replacement Service", categories[2]?.name || "Services", suppliers[2]?.name || "Apple", 150000, 0, "No", "Yes", "No"],
            ["SP-IP15BAT", "iPhone 15 Battery Part", categories[3]?.name || "Spare Parts", suppliers[3]?.name || "Apple", 250000, 2, "No", "No", "Yes"]
        ];

        const wb = XLSX.utils.book_new();

        // 1. Create Import Sheet
        const wsImport = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
        const wscolsImport = headers.map((h, i) => {
            let maxLen = h.length;
            sampleRows.forEach(row => {
                const cellVal = row[i] ? row[i].toString() : '';
                if (cellVal.length > maxLen) maxLen = cellVal.length;
            });
            return { wch: Math.min(maxLen + 4, 30) };
        });
        wsImport['!cols'] = wscolsImport;
        XLSX.utils.book_append_sheet(wb, wsImport, "Import Template");

        // 2. Create Reference Sheet with Category and Brand options
        const refHeaders = ["Available Categories", "Available Brands/Suppliers"];
        const refRows: any[][] = [];
        const maxRefLen = Math.max(categories.length, suppliers.length);
        
        for (let i = 0; i < maxRefLen; i++) {
            refRows.push([
                categories[i] ? categories[i].name : "",
                suppliers[i] ? suppliers[i].name : ""
            ]);
        }
        
        const wsRef = XLSX.utils.aoa_to_sheet([refHeaders, ...refRows]);
        const wscolsRef = refHeaders.map((h, i) => {
            let maxLen = h.length;
            refRows.forEach(row => {
                const cellVal = row[i] ? row[i].toString() : '';
                if (cellVal.length > maxLen) maxLen = cellVal.length;
            });
            return { wch: Math.min(maxLen + 4, 35) };
        });
        wsRef['!cols'] = wscolsRef;
        XLSX.utils.book_append_sheet(wb, wsRef, "Categories & Brands Reference");

        XLSX.writeFile(wb, "master_item_import_template.xlsx");
    };

    const handleImportExcelClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const parseExcelFile = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                    if (jsonData.length < 2) {
                        reject(new Error('Excel file must have at least a header row and one data row'));
                        return;
                    }

                    // Filter out empty rows
                    const rows = jsonData.filter(row => row.length > 0 && row.some((cell: any) => cell !== undefined && cell !== null && cell !== ''));

                    if (rows.length < 2) {
                        reject(new Error('Excel file must have at least a header row and one data row'));
                        return;
                    }

                    // Parse header row
                    const headerRow = rows[0];
                    const headers = headerRow.map((h: any) => String(h).trim().toLowerCase());

                    // Find column indices
                    const codeIndex = headers.findIndex((h: string) => h.includes('code') || h.includes('codeno') || h.includes('code no'));
                    const nameIndex = headers.findIndex((h: string) => h.includes('item') || h.includes('name') || h.includes('product'));
                    const categoryIndex = headers.findIndex((h: string) => h.includes('category'));
                    const brandIndex = headers.findIndex((h: string) => h.includes('brand') || h.includes('supplier'));
                    const priceIndex = headers.findIndex((h: string) => h.includes('price') || h.includes('selling') || h.includes('sell'));
                    const minStockIndex = headers.findIndex((h: string) => h.includes('min') && h.includes('stock'));
                    const serializedIndex = headers.findIndex((h: string) => h.includes('serialized') || h.includes('serial'));
                    const serviceIndex = headers.findIndex((h: string) => h.includes('service'));
                    const sparePartIndex = headers.findIndex((h: string) => h.includes('spare') || h.includes('part'));

                    if (codeIndex === -1 || nameIndex === -1) {
                        reject(new Error('Excel file must have "Code" and "Name" columns'));
                        return;
                    }

                    const parsedData: any[] = [];
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        const codeVal = row[codeIndex] ? String(row[codeIndex]).trim() : '';
                        const nameVal = row[nameIndex] ? String(row[nameIndex]).trim() : '';

                        if (!codeVal || !nameVal) continue; // Skip empty rows

                        // Parse flags
                        const parseBoolVal = (val: any) => {
                            if (val === undefined || val === null) return false;
                            const str = String(val).trim().toLowerCase();
                            return str === 'true' || str === 'yes' || str === '1' || str === 'y';
                        };

                        parsedData.push({
                            code: codeVal,
                            name: nameVal,
                            categoryText: categoryIndex !== -1 && row[categoryIndex] ? String(row[categoryIndex]).trim() : '',
                            brandText: brandIndex !== -1 && row[brandIndex] ? String(row[brandIndex]).trim() : '',
                            sellingPrice: priceIndex !== -1 && row[priceIndex] ? parseFloat(String(row[priceIndex]).replace(/,/g, '')) || 0 : 0,
                            minStockQty: minStockIndex !== -1 && row[minStockIndex] ? parseInt(String(row[minStockIndex])) || 0 : 0,
                            isSerialized: serializedIndex !== -1 ? parseBoolVal(row[serializedIndex]) : false,
                            isService: serviceIndex !== -1 ? parseBoolVal(row[serviceIndex]) : false,
                            isSparePart: sparePartIndex !== -1 ? parseBoolVal(row[sparePartIndex]) : false
                        });
                    }

                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input value
        e.target.value = '';

        if (!file.name.match(/\.(xls|xlsx|csv)$/i)) {
            alert('Please select a valid Excel file (.xls, .xlsx, .csv)');
            return;
        }

        try {
            const parsed = await parseExcelFile(file);
            if (parsed.length === 0) {
                alert('No valid items found in Excel file');
                return;
            }

            // Map category and supplier names to IDs
            const mapped = parsed.map(item => {
                let categoryId = '';
                let categoryName = '';
                if (item.categoryText) {
                    const cat = categories.find(c => c.name.toLowerCase() === item.categoryText.toLowerCase());
                    if (cat) {
                        categoryId = cat.id;
                        categoryName = cat.name;
                    }
                }

                let supplierId = '';
                let supplierName = '';
                if (item.brandText) {
                    const sup = suppliers.find(s => s.name.toLowerCase() === item.brandText.toLowerCase());
                    if (sup) {
                        supplierId = sup.id;
                        supplierName = sup.name;
                    }
                }

                return {
                    ...item,
                    categoryId,
                    categoryName,
                    supplierId,
                    supplierName
                };
            });

            setParsedProducts(mapped);
            setImportError(null);
            setIsImportModalOpen(true);
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Failed to parse Excel file');
        }
    };

    const handleConfirmImport = async () => {
        setIsImporting(true);
        try {
            const result = await apiClient.post(`${API_ENDPOINTS.PRODUCTS}/bulk`, parsedProducts);
            if (result.success) {
                mutate();
                setIsImportModalOpen(false);
                setParsedProducts([]);
                alert(result.message || 'Bulk import completed successfully');
            } else {
                setImportError(result.message || 'Failed to import products');
            }
        } catch (error: any) {
            console.error('Confirm import error:', error);
            setImportError(error.message || 'Failed to connect to the server');
        } finally {
            setIsImporting(false);
        }
    };

    const handleOpenModal = (product?: MasterProduct) => {
        if (product) {
            setEditingProduct(product);
            const price = product.sellingPrice !== undefined ? product.sellingPrice : (product.sellPrice !== undefined ? product.sellPrice : 0);
            setFormData({
                code: product.code,
                name: product.name,
                categoryId: product.categoryId,
                supplierId: product.supplierId,
                isSerialized: product.isSerialized,
                isService: product.isService || false,
                isSparePart: product.isSparePart || false,
                sellingPrice: price,
                minStockQty: product.minStockQty
            });
        } else {
            setEditingProduct(null);
            setFormData(initialForm);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.categoryId) {
            alert('Please select a category');
            return;
        }
        setIsSubmitting(true);

        try {
            if (editingProduct) {
                const result = await apiClient.put(`${API_ENDPOINTS.PRODUCTS}/${editingProduct.id}`, formData);
                if (result.success) {
                    mutate();
                    setIsModalOpen(false);
                } else {
                    alert(result.message || 'Failed to update product');
                }
            } else {
                const result = await apiClient.post(API_ENDPOINTS.PRODUCTS, formData);
                if (result.success) {
                    mutate();
                    setIsModalOpen(false);
                } else {
                    alert(result.message || 'Failed to create product');
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteConfirm = (id: string, name: string) => {
        setDeleteConfirm({ isOpen: true, id, name });
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirm({ isOpen: false, id: '', name: '' });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await apiClient.delete(`${API_ENDPOINTS.PRODUCTS}/${deleteConfirm.id}`);
            if (result.success) {
                mutate();
                closeDeleteConfirm();
            } else {
                alert(result.message || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="flex gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search products..."
                            className="w-full bg-gray-800 border border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    <button onClick={handleSearch} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors text-white">Search</button>
                </div>

                <div className="flex gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImportExcel} 
                        className="hidden" 
                        accept=".xlsx,.xls,.csv" 
                    />
                    <button onClick={() => {
                        setSearchInput('');
                        setSearch('');
                        setPage(1);
                        mutate();
                    }} className="p-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors text-gray-400" title="Refresh">
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    {sessionManager.getUserType() !== 'user' && (
                        <>
                            <button 
                                type="button"
                                onClick={handleDownloadTemplate} 
                                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 px-4 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 text-sm"
                            >
                                <Download size={18} /> Download Template
                            </button>
                            <button 
                                type="button"
                                onClick={handleImportExcelClick} 
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-750 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 text-sm"
                            >
                                <Upload size={18} /> Import Excel
                            </button>
                            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 text-sm">
                                <Plus size={20} /> Add Product
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                    <p className="text-red-400">Failed to load products.</p>
                    <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white">Retry</button>
                </div>
            )}

            {/* Products List */}
            {!isLoading && !error && (
                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-750 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                    <th className="p-4 text-center w-16">No</th>
                                    <th className="p-4">Product Info</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Brand (Supplier)</th>
                                    <th className="p-4 text-center">Type</th>
                                    <th className="p-4 text-center">Min Stock</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {products.map((product, index) => (
                                    <tr key={product.id} className="hover:bg-gray-750 transition-colors group">
                                        <td className="p-4 text-center text-gray-500 font-mono text-sm">
                                            {(page - 1) * limit + index + 1}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${product.isService ? 'bg-purple-900/30 text-purple-400' : product.isSparePart ? 'bg-amber-900/30 text-amber-400' : product.isSerialized ? 'bg-blue-900/30 text-blue-400' : 'bg-orange-900/30 text-orange-400'}`}>
                                                    {product.isService ? <Wrench size={20} /> : product.isSparePart ? <Cpu size={20} /> : product.isSerialized ? <Smartphone size={20} /> : <Box size={20} />}
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold">{product.name}</div>
                                                    <div className="text-gray-500 text-xs font-mono">{product.code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-full bg-gray-700 text-gray-300 text-xs font-medium">
                                                {product.categoryName || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Building2 size={14} className="text-gray-500" />
                                                <span>{product.supplierName || 'No Supplier'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {product.isService ? (
                                                <span className="text-[10px] uppercase font-black bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">Service</span>
                                            ) : product.isSparePart ? (
                                                <span className="text-[10px] uppercase font-black bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">Spare Part</span>
                                            ) : product.isSerialized ? (
                                                <span className="text-[10px] uppercase font-black bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/20">Serialized</span>
                                            ) : (
                                                <span className="text-[10px] uppercase font-black bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded border border-gray-500/20">Standard</span>
                                            )}
                                        </td>

                                        <td className="p-4 text-center">
                                            <div className="text-gray-400 font-medium">{product.minStockQty}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {sessionManager.getUserType() !== 'user' && (
                                                    <>
                                                        <button onClick={() => handleOpenModal(product)} className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button onClick={() => openDeleteConfirm(product.id, product.name)} className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-20 text-center text-gray-500">
                                            <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                                            <p>No products found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.total > 0 && (
                        <div className="p-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>Show</span>
                                <select
                                    value={limit}
                                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-white outline-none"
                                >
                                    {PAGINATION_CONFIG.LIMIT_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <span>of {pagination.total} entries</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setPage(page - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors text-white"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-400 px-3">Page {page} of {pagination.totalPages}</span>
                                </div>
                                <button 
                                    onClick={() => setPage(page + 1)}
                                    disabled={!pagination.hasNext}
                                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors text-white"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {editingProduct ? <Edit className="text-blue-500"/> : <Plus className="text-blue-500"/>} 
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Code No (SKU)</label>
                                    <input type="text" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" disabled={isSubmitting} placeholder="e.g. IP15-001" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Product Name</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" disabled={isSubmitting} placeholder="e.g. iPhone 15 Pro" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                                    <SearchableDropdown 
                                        options={categories}
                                        value={formData.categoryId}
                                        onChange={(id, name) => setFormData({...formData, categoryId: id})}
                                        placeholder="Select Category"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Brand (Supplier)</label>
                                    <select 
                                        required 
                                        value={formData.supplierId} 
                                        onChange={(e) => setFormData({...formData, supplierId: e.target.value})} 
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Select Brand</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Min Stock Limit</label>
                                    <input type="number" required min="0" value={formData.minStockQty} onChange={(e) => setFormData({...formData, minStockQty: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" disabled={isSubmitting} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-2">
                                <div className="flex items-center">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.isSerialized} 
                                                onChange={(e) => setFormData({...formData, isSerialized: e.target.checked, isService: e.target.checked ? false : formData.isService, isSparePart: e.target.checked ? false : formData.isSparePart})} 
                                                className="sr-only peer"
                                                disabled={isSubmitting}
                                            />
                                            <div className="w-12 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 transition-colors border border-gray-600"></div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                                        </div>
                                        <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                            Serialized (IMEI Required)
                                        </div>
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.isService} 
                                                onChange={(e) => setFormData({...formData, isService: e.target.checked, isSerialized: e.target.checked ? false : formData.isSerialized, isSparePart: e.target.checked ? false : formData.isSparePart})} 
                                                className="sr-only peer"
                                                disabled={isSubmitting}
                                            />
                                            <div className="w-12 h-6 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 transition-colors border border-gray-600"></div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                                        </div>
                                        <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                            Service Item
                                        </div>
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.isSparePart} 
                                                onChange={(e) => setFormData({...formData, isSparePart: e.target.checked, isSerialized: e.target.checked ? false : formData.isSerialized, isService: e.target.checked ? false : formData.isService})} 
                                                className="sr-only peer"
                                                disabled={isSubmitting}
                                            />
                                            <div className="w-12 h-6 bg-gray-700 rounded-full peer peer-checked:bg-amber-600 transition-colors border border-gray-600"></div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                                        </div>
                                        <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                            Spare Part
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700" disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                                    {editingProduct ? 'Update Product' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Product"
                message={`Are you sure you want to delete "${deleteConfirm.name}"? This will remove the item from the master list.`}
                onConfirm={handleDelete}
                onCancel={closeDeleteConfirm}
                isLoading={isDeleting}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />

            {/* Excel Import Preview Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-5xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200 my-8 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl shrink-0">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Upload className="text-emerald-500" /> Excel Import Preview
                            </h2>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        {importError && (
                            <div className="p-4 bg-red-900/30 border-b border-red-700/50 text-red-400 text-sm shrink-0">
                                {importError}
                            </div>
                        )}
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <p className="text-gray-400 text-sm mb-4">
                                Below is a preview of the items loaded from the Excel sheet. Items with existing codes will be updated, others will be inserted.
                            </p>
                            <div className="border border-gray-700 rounded-xl overflow-hidden">
                                <table className="w-full text-left border-collapse text-xs md:text-sm">
                                    <thead className="bg-gray-900/50 text-gray-400 uppercase font-bold tracking-wider border-b border-gray-700">
                                        <tr>
                                            <th className="p-3 w-12 text-center">#</th>
                                            <th className="p-3">Code</th>
                                            <th className="p-3">Item Name</th>
                                            <th className="p-3">Category</th>
                                            <th className="p-3">Brand (Supplier)</th>
                                            <th className="p-3 text-right">Price</th>
                                            <th className="p-3 text-center">Min Stock</th>
                                            <th className="p-3 text-center">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {parsedProducts.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-750 transition-colors">
                                                <td className="p-3 text-center text-gray-500">{index + 1}</td>
                                                <td className="p-3 font-mono text-gray-300 font-bold">{item.code}</td>
                                                <td className="p-3 text-white font-bold">{item.name}</td>
                                                <td className="p-3">
                                                    {item.categoryName ? (
                                                        <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 text-xs">
                                                            {item.categoryName}
                                                        </span>
                                                    ) : item.categoryText ? (
                                                        <span className="px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-300 text-xs" title="Will default to uncategorized">
                                                            {item.categoryText} (Not Found)
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500">-</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {item.supplierName ? (
                                                        <span className="px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 text-xs">
                                                            {item.supplierName}
                                                        </span>
                                                    ) : item.brandText ? (
                                                        <span className="px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-300 text-xs" title="Will default to none">
                                                            {item.brandText} (Not Found)
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500">-</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right text-emerald-400 font-medium">
                                                    {item.sellingPrice?.toLocaleString()}
                                                </td>
                                                <td className="p-3 text-center text-gray-300">
                                                    {item.minStockQty}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex gap-1 justify-center">
                                                        {item.isSerialized && <span className="px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-400 text-[10px] font-bold">Serial</span>}
                                                        {item.isService && <span className="px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-400 text-[10px] font-bold">Service</span>}
                                                        {item.isSparePart && <span className="px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-400 text-[10px] font-bold">Spare</span>}
                                                        {!item.isSerialized && !item.isService && !item.isSparePart && <span className="px-1.5 py-0.5 rounded bg-gray-900/50 text-gray-400 text-[10px] font-bold">Accessory</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className="p-5 border-t border-gray-700 bg-gray-750 rounded-b-2xl flex justify-between gap-3 shrink-0">
                            <span className="text-sm text-gray-400 self-center">
                                Total processed items: <strong>{parsedProducts.length}</strong>
                            </span>
                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsImportModalOpen(false)} 
                                    className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700" 
                                    disabled={isImporting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleConfirmImport} 
                                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50" 
                                    disabled={isImporting}
                                >
                                    {isImporting && <Loader2 className="animate-spin" size={18} />}
                                    Confirm Import
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SupplierTab: React.FC = () => {
    const isAdmin = sessionManager.getUserType() === 'admin';
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const initialForm = { name: '', address: '', email: '', phone: '', remark: '' };
    const [formData, setFormData] = useState(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
        isOpen: false,
        id: '',
        name: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Pagination state
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // SWR for data fetching
    const { data, error, isLoading, mutate } = useSWR<SuppliersResponse>(
        `${API_ENDPOINTS.SUPPLIERS}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    const suppliers = data?.data || [];
    const pagination = data?.pagination;

    const handleSearch = useCallback(() => {
        setSearch(searchInput);
        setPage(1);
    }, [searchInput]);

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                address: supplier.address || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                remark: supplier.remark || ''
            });
        } else {
            setEditingSupplier(null);
            setFormData(initialForm);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingSupplier) {
                const result = await apiClient.put(API_ENDPOINTS.SUPPLIER_BY_ID(editingSupplier.id), formData);
                if (result.success) {
                    mutate();
                    setIsModalOpen(false);
                } else {
                    alert(result.message || 'Failed to update supplier');
                }
            } else {
                const result = await apiClient.post(API_ENDPOINTS.SUPPLIERS, formData);
                if (result.success) {
                    mutate();
                    setIsModalOpen(false);
                } else {
                    alert(result.message || 'Failed to create supplier');
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteConfirm = (id: string, companyName: string) => {
        setDeleteConfirm({ isOpen: true, id, name: companyName });
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirm({ isOpen: false, id: '', name: '' });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await apiClient.delete(API_ENDPOINTS.SUPPLIER_BY_ID(deleteConfirm.id));
            if (result.success) {
                mutate();
                closeDeleteConfirm();
            } else {
                alert(result.message || 'Failed to delete supplier');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="flex gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search suppliers..."
                            className="w-full bg-gray-800 border border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    <button onClick={handleSearch} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors">Search</button>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => {
                        setSearchInput('');
                        setSearch('');
                        setPage(1);
                        mutate();
                    }} className="p-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors" title="Refresh">
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    {sessionManager.getUserType() !== 'user' && (
                        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg">
                            <Plus size={20} /> Add Supplier
                        </button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-500" size={40} />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                    <p className="text-red-400">Failed to load suppliers.</p>
                    <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Retry</button>
                </div>
            )}

            {/* Supplier Cards */}
            {!isLoading && !error && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suppliers.map((supplier) => (
                            <div key={supplier.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg hover:shadow-xl transition-shadow group">
                                <div className="p-5 border-b border-gray-700 flex justify-between items-start bg-gray-750">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-400">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white leading-tight">{supplier.name}</h3>
                                            <p className="text-xs text-gray-400">ID: {supplier.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => navigate(`/purchase/supplier-in-out?id=${supplier.id}`)}
                                            className="p-1.5 text-indigo-400 hover:bg-indigo-900/30 rounded"
                                            title="Supplier In/Out"
                                        >
                                            <DollarSign size={16} />
                                        </button>
                                        {sessionManager.getUserType() !== 'user' && (
                                            <>
                                                <button onClick={() => handleOpenModal(supplier)} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded"><Edit size={16} /></button>
                                                <button onClick={() => openDeleteConfirm(supplier.id, supplier.name)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded"><Trash2 size={16} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="p-5 space-y-3 text-sm">
                                    <div className="flex items-start gap-3 text-gray-300">
                                        <MapPin size={16} className="mt-0.5 text-gray-500 shrink-0"/>
                                        <span className="line-clamp-2">{supplier.address || 'No address provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Phone size={16} className="text-gray-500 shrink-0"/>
                                        <span>{supplier.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Mail size={16} className="text-gray-500 shrink-0"/>
                                        <span>{supplier.email || 'N/A'}</span>
                                    </div>
                                    {supplier.remark && (
                                        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-xs text-gray-400 italic border border-gray-700/50">
                                            "{supplier.remark}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {suppliers.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-500">
                                <Building2 size={48} className="mx-auto mb-4 opacity-20"/>
                                <p>No suppliers found. Add one to get started.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.total > 0 && (
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>Show</span>
                                <select
                                    value={limit}
                                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                    className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white outline-none"
                                >
                                    {PAGINATION_CONFIG.LIMIT_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <span>of {pagination.total} entries</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= pagination.totalPages - 2) {
                                            pageNum = pagination.totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                                    page === pageNum
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-gray-800 border border-gray-600 hover:bg-gray-700'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={!pagination.hasNext}
                                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Building2 className="text-indigo-500"/> {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Supplier Name</label>
                                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" disabled={isSubmitting} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-400 mb-1">Phone</label><input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white outline-none" disabled={isSubmitting} /></div>
                                <div><label className="block text-sm font-medium text-gray-400 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white outline-none" disabled={isSubmitting} /></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                                <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white outline-none resize-none h-20" disabled={isSubmitting} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Remark</label>
                                <textarea value={formData.remark} onChange={(e) => setFormData({...formData, remark: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white outline-none resize-none h-20" placeholder="Optional notes..." disabled={isSubmitting} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700" disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                                    {editingSupplier ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Supplier"
                message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                onCancel={closeDeleteConfirm}
                isLoading={isDeleting}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
};

// Purchase Voucher Tab
const PurchaseVoucherTab: React.FC = () => {
    const isAdmin = sessionManager.getUserType() === 'admin';
    const navigate = useNavigate();
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; vno: string }>({
        isOpen: false,
        id: '',
        vno: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<PurchaseVoucher | null>(null);

    // Payment State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState<PurchaseVoucher | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [paymentRemark, setPaymentRemark] = useState<string>('');
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    // Payment History State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const { data: paymentHistory, mutate: mutateHistory, isLoading: isLoadingHistory } = useSWR(
        isHistoryModalOpen && selectedVoucher 
            ? `${API_ENDPOINTS.SUPPLIER_PAYMENTS(selectedVoucher.supplierId)}?vno=${selectedVoucher.vno}` 
            : null,
        fetcher
    );

    const { data, error, isLoading, mutate } = useSWR<PurchaseVouchersResponse>(
        `${API_ENDPOINTS.PURCHASE_VOUCHERS}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        fetcher,
        { 
            revalidateOnFocus: false, 
            dedupingInterval: 5000,
            onError: (err) => {
                console.error('Purchase vouchers fetch error:', err);
            }
        }
    );

    const vouchers = data?.data || [];
    const pagination = data?.pagination;
    
    // Debug logging
    useEffect(() => {
        if (error) {
            console.error('Purchase Vouchers Error:', error);
            console.error('Error details:', error?.info || error?.message);
        }
        if (data) {
            console.log('Purchase Vouchers Data:', data);
        }
    }, [error, data]);

    const handleSearch = useCallback(() => {
        setSearch(searchInput);
        setPage(1);
    }, [searchInput]);

    const openDeleteConfirm = (id: string, vno: string) => {
        setDeleteConfirm({ isOpen: true, id, vno });
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirm({ isOpen: false, id: '', vno: '' });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await apiClient.delete(API_ENDPOINTS.PURCHASE_VOUCHER_BY_ID(deleteConfirm.id));
            if (result.success) {
                mutate();
                closeDeleteConfirm();
            } else {
                alert(result.message || 'Failed to delete purchase voucher');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (voucher: PurchaseVoucher) => {
        // Navigate to edit page with voucher ID
        navigate(`/purchase/voucher/edit/${voucher.id}`);
    };

    const handleOpenPayment = (voucher: PurchaseVoucher) => {
        setSelectedVoucher(voucher);
        setPaymentAmount(0);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentRemark(`Payment for Voucher ${voucher.vno}`);
        setIsPaymentModalOpen(true);
    };

    const handleOpenHistory = (voucher: PurchaseVoucher) => {
        setSelectedVoucher(voucher);
        setIsHistoryModalOpen(true);
    };

    const handleCreatePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVoucher) return;
        if (paymentAmount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }

        setIsSubmittingPayment(true);
        try {
            const result = await apiClient.post(API_ENDPOINTS.SUPPLIER_PAYMENT_CREATE(selectedVoucher.supplierId), {
                amount: paymentAmount,
                date: paymentDate,
                userId: sessionStorage.getItem('userId'), // From session manager
                vno: selectedVoucher.vno,
                remark: paymentRemark
            });

            if (result.success) {
                alert('Payment saved successfully');
                setIsPaymentModalOpen(false);
                mutate(); // Refresh vouchers list (if we show balance)
            } else {
                alert(result.message || 'Failed to save payment');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('An error occurred');
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!selectedVoucher) return;
        if (!window.confirm('Are you sure you want to delete this payment?')) return;

        try {
            const result = await apiClient.delete(API_ENDPOINTS.SUPPLIER_PAYMENT_DELETE(selectedVoucher.supplierId, paymentId));
            if (result.success) {
                mutateHistory();
                mutate(); // Refresh vouchers list
            } else {
                alert(result.message || 'Failed to delete payment');
            }
        } catch (error) {
            console.error('Delete payment error:', error);
            alert('An error occurred');
        }
    };

    const exportToExcel = () => {
        if (vouchers.length === 0) return;

        const title = `Purchase Vouchers (${search ? `Search: ${search}` : 'All Vouchers'})`;
        const headers = ["VNO", "Supplier", "Amount", "Items", "Date", "User"];
        
        const excelData = vouchers.map(v => [
            v.vno,
            v.supplierName || '',
            v.amount,
            v.itemCount,
            v.date,
            v.userName || ''
        ]);

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `purchase_vouchers_${timestamp}.xlsx`, 'Purchase Vouchers');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Actions Bar */}
            <div className="bg-gray-800 rounded-xl p-4 shadow-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-700">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search vouchers..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <button onClick={handleSearch} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">Search</button>
                    <button onClick={() => {
                        setSearchInput('');
                        setSearch('');
                        setPage(1);
                        mutate();
                    }} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors" title="Refresh">
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={exportToExcel}
                        disabled={vouchers.length === 0}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Download size={18} /> Export
                    </button>
                    {sessionManager.getUserType() !== 'user' && (
                        <button 
                            onClick={() => navigate('/purchase/voucher/new')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            <Plus size={18} /> New
                        </button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                    <p className="text-red-400 font-medium mb-2">Failed to load purchase vouchers.</p>
                    <p className="text-red-300 text-sm mb-2">
                        {error?.info?.message || error?.message || 'Unknown error occurred'}
                    </p>
                    {error?.info?.sqlMessage && (
                        <p className="text-red-400 text-xs mb-4 font-mono">
                            SQL Error: {error.info.sqlMessage}
                        </p>
                    )}
                    {error?.info?.errorCode && (
                        <p className="text-red-400 text-xs mb-4">
                            Error Code: {error.info.errorCode}
                        </p>
                    )}
                    <button onClick={() => mutate()} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors">Retry</button>
                </div>
            )}

            {/* Table */}
            {!isLoading && !error && (
                <>
                    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                        <th className="p-4 w-20">AID</th>
                                        <th className="p-4">VNO</th>
                                        <th className="p-4">Supplier</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-right">Total Paid</th>
                                        <th className="p-4 text-right">Remain</th>
                                        <th className="p-4">Date</th>
                                        {sessionManager.getUserType() === 'admin' && <th className="p-4 text-center">Shop / Branch</th>}
                                        <th className="p-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {vouchers.length > 0 ? (
                                        vouchers.map((voucher, index) => (
                                            <tr key={voucher.id} className="hover:bg-gray-750 transition-colors">
                                                <td className="p-4 text-sm text-gray-400">
                                                    {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                                                </td>
                                                <td className="p-4 text-sm font-medium text-blue-400">{voucher.vno}</td>
                                                <td className="p-4 text-sm text-white">
                                                    <div>
                                                        <p className="font-medium">{voucher.supplierName || '-'}</p>
                                                        {voucher.supplierCode && (
                                                            <p className="text-xs text-gray-400">{voucher.supplierCode}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-right text-white font-medium">
                                                    {voucher.amount.toLocaleString()}
                                                </td>
                                                <td className="p-4 text-sm text-right text-emerald-400 font-medium">
                                                    {voucher.totalPaid.toLocaleString()}
                                                </td>
                                                <td className="p-4 text-sm text-right text-red-400 font-bold">
                                                    {Math.max(0, voucher.amount - voucher.totalPaid).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-sm text-gray-300">
                                                    {voucher.date ? new Date(voucher.date).toLocaleDateString() : '-'}
                                                </td>
                                                {sessionManager.getUserType() === 'admin' && (
                                                    <td className="p-4 text-center">
                                                        <span className="px-2 py-1 bg-indigo-900/30 text-indigo-400 border border-indigo-800 rounded-lg text-xs font-medium">
                                                            {voucher.branchName || 'Unknown'}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {voucher.amount - voucher.totalPaid > 0 && (
                                                            <button 
                                                                onClick={() => handleOpenPayment(voucher)}
                                                                className="p-1.5 text-emerald-400 hover:bg-emerald-900/30 rounded transition-colors"
                                                                title="Payment"
                                                            >
                                                                <CreditCard size={16} />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleOpenHistory(voucher)}
                                                            className="p-1.5 text-amber-400 hover:bg-amber-900/30 rounded transition-colors"
                                                            title="Payment History"
                                                        >
                                                            <History size={16} />
                                                        </button>
                                                        {sessionManager.getUserType() !== 'user' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleEdit(voucher)}
                                                                    className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => openDeleteConfirm(voucher.id, voucher.vno)}
                                                                    className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-gray-500">
                                                No vouchers found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {pagination && pagination.total > 0 && (
                            <div className="p-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span>Show</span>
                                    <select
                                        value={limit}
                                        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                        className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-white outline-none"
                                    >
                                        {PAGINATION_CONFIG.LIMIT_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <span>of {pagination.total} entries</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setPage(page - 1)}
                                        disabled={!pagination.hasPrev}
                                        className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (page <= 3) {
                                                pageNum = i + 1;
                                            } else if (page >= pagination.totalPages - 2) {
                                                pageNum = pagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = page - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPage(pageNum)}
                                                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                                        page === pageNum
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-800 border border-gray-600 hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button 
                                        onClick={() => setPage(page + 1)}
                                        disabled={!pagination.hasNext}
                                        className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Purchase Voucher"
                message={`Are you sure you want to delete voucher "${deleteConfirm.vno}"? This will also delete all associated purchase items and update inventory.`}
                onConfirm={handleDelete}
                onCancel={closeDeleteConfirm}
                isLoading={isDeleting}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />

            {/* Payment Modal */}
            {isPaymentModalOpen && selectedVoucher && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <CreditCard className="text-emerald-500" /> Supplier Payment
                            </h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreatePayment} className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Voucher No</label>
                                    <div className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-2 text-blue-400 text-xs font-bold truncate">
                                        {selectedVoucher.vno}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Total</label>
                                    <div className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-2 text-white text-xs font-bold">
                                        {selectedVoucher.amount.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1 text-red-400">Remain</label>
                                    <div className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-2 text-red-400 text-xs font-bold">
                                        {(selectedVoucher.amount - selectedVoucher.totalPaid).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Supplier</label>
                                <div className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm">
                                    {selectedVoucher.supplierName}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Payment Amount</label>
                                <input 
                                    type="number" 
                                    required 
                                    value={paymentAmount} 
                                    onChange={(e) => setPaymentAmount(Number(e.target.value))} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg" 
                                    disabled={isSubmittingPayment}
                                    placeholder="Enter amount..."
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={paymentDate} 
                                    onChange={(e) => setPaymentDate(e.target.value)} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white outline-none" 
                                    disabled={isSubmittingPayment} 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Remark</label>
                                <textarea 
                                    value={paymentRemark} 
                                    onChange={(e) => setPaymentRemark(e.target.value)} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-white outline-none resize-none h-20 text-sm" 
                                    disabled={isSubmittingPayment} 
                                    placeholder="Optional notes..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700" disabled={isSubmittingPayment}>Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50" disabled={isSubmittingPayment}>
                                    {isSubmittingPayment && <Loader2 className="animate-spin" size={18} />}
                                    Save Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment History Modal */}
            {isHistoryModalOpen && selectedVoucher && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl shrink-0">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <History className="text-amber-500" /> Payment History - {selectedVoucher.vno}
                            </h2>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            {/* Summary Info - Use live data from vouchers list if available */}
                            {(() => {
                                const liveVoucher = vouchers.find(v => v.id === selectedVoucher.id) || selectedVoucher;
                                return (
                                    <div className="flex gap-4 mb-6">
                                        <div className="flex-1 bg-gray-900/50 p-3 rounded-xl border border-gray-700/50 text-center">
                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">Total</div>
                                            <div className="text-sm font-bold text-white">{liveVoucher.amount.toLocaleString()}</div>
                                        </div>
                                        <div className="flex-1 bg-gray-900/50 p-3 rounded-xl border border-gray-700/50 text-center">
                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">Paid</div>
                                            <div className="text-sm font-bold text-emerald-400">{liveVoucher.totalPaid.toLocaleString()}</div>
                                        </div>
                                        <div className="flex-1 bg-gray-900/50 p-3 rounded-xl border border-gray-700/50 text-center">
                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold text-red-400">Remain</div>
                                            <div className="text-sm font-bold text-red-400">{Math.max(0, liveVoucher.amount - liveVoucher.totalPaid).toLocaleString()}</div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {isLoadingHistory ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="animate-spin text-amber-500" size={32} />
                                </div>
                            ) : paymentHistory?.data && paymentHistory.data.length > 0 ? (
                                <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-800 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                                <th className="p-3">Date</th>
                                                <th className="p-3 text-right">Amount</th>
                                                <th className="p-3">User</th>
                                                <th className="p-3">Remark</th>
                                                <th className="p-3 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {paymentHistory.data.map((payment: any) => (
                                                <tr key={payment.id} className="hover:bg-gray-850 transition-colors">
                                                    <td className="p-3 text-sm text-gray-300">{new Date(payment.date).toLocaleDateString()}</td>
                                                    <td className="p-3 text-sm text-right text-emerald-400 font-bold">{payment.amount.toLocaleString()}</td>
                                                    <td className="p-3 text-sm text-gray-400">{payment.userName}</td>
                                                    <td className="p-3 text-sm text-gray-500 italic truncate max-w-[150px]" title={payment.remark}>{payment.remark || '-'}</td>
                                                    <td className="p-3 text-center">
                                                        {sessionManager.getUserType() !== 'user' && (
                                                            <button 
                                                                onClick={() => handleDeletePayment(payment.id)}
                                                                className="p-1 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                                                                title="Delete Payment"
                                                            >
                                                                    <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <p>No payment records found for this voucher.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-700 flex justify-end shrink-0">
                            <button onClick={() => setIsHistoryModalOpen(false)} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Layout ---

const PurchaseList: React.FC = () => {
    const isAdmin = sessionManager.getUserType() === 'admin';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'purchase' | 'category' | 'supplier' | 'product'>('purchase');
  const [activeSubTab, setActiveSubTab] = useState<'voucher' | 'phone' | 'accessory' | 'service' | 'spare'>('voucher');

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      
      {/* Header - Fixed Top */}
      <div className="sticky top-0 z-40 bg-gray-800 shadow-md border-b border-gray-700">
          <div className="p-4 flex items-center">
            <button 
                onClick={() => navigate('/purchase')}
                className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
            >
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold">Purchase Management</h1>
          </div>

          {/* Tabs */}
          <div className="flex px-4 gap-6">
              <button 
                onClick={() => setActiveTab('purchase')}
                className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'purchase' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
              >
                  <ShoppingBag size={18} /> Purchase List
              </button>
              <button 
                onClick={() => setActiveTab('category')}
                className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'category' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
              >
                  <Tags size={18} /> Category
              </button>
              <button 
                onClick={() => setActiveTab('supplier')}
                className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'supplier' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
              >
                  <Building2 size={18} /> Supplier
              </button>
              <button 
                onClick={() => setActiveTab('product')}
                className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'product' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
              >
                  <Tags size={18} /> Master Item
              </button>
          </div>
      </div>

      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
         {activeTab === 'purchase' && (
            <>
                {/* Sub-tabs for Purchase */}
                <div className="mb-6 flex gap-4 border-b border-gray-700">
                    <button 
                        onClick={() => setActiveSubTab('voucher')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                            activeSubTab === 'voucher' 
                                ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        Purchase Voucher
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('phone')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                            activeSubTab === 'phone' 
                                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        Purchase by Phone
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('accessory')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                            activeSubTab === 'accessory' 
                                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        Purchase by Accessories
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('service')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                            activeSubTab === 'service' 
                                ? 'border-purple-500 text-purple-400 bg-purple-500/5' 
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        Purchase by Service Item
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('spare')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                            activeSubTab === 'spare' 
                                ? 'border-amber-500 text-amber-400 bg-amber-500/5' 
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        Purchase by Spare Part
                    </button>
                </div>
                {activeSubTab === 'voucher' && <PurchaseVoucherTab />}
                {activeSubTab === 'phone' && <PurchaseDetailTab type="phone" />}
                {activeSubTab === 'accessory' && <PurchaseDetailTab type="accessory" />}
                {activeSubTab === 'service' && <PurchaseDetailTab type="service" />}
                {activeSubTab === 'spare' && <PurchaseDetailTab type="spare" />}
            </>
         )}
         {activeTab === 'category' && <CategoryTab />}
         {activeTab === 'supplier' && <SupplierTab />}
         {activeTab === 'product' && <ProductTab />}
      </div>
    </div>
  );
};

export default PurchaseList;