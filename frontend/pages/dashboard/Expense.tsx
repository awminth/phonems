import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { 
    DollarSign, 
    Tags, 
    Plus, 
    Edit, 
    Trash2, 
    Search, 
    Download, 
    ChevronLeft, 
    ChevronRight,
    X,
    Check,
    ChevronDown,
    Calendar,
    FileText,
    ArrowLeft,
    Filter,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../../types';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, sessionManager } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

// --- Confirm Modal Component ---
interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    isLoading = false,
    confirmText = 'Delete',
    cancelText = 'Cancel'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-900/50 text-red-400">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 mb-6">{message}</p>
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
                            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50"
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

// --- Shared: Searchable Dropdown ---
interface SearchableDropdownProps {
    options: { id: string, name: string }[];
    value: string;
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

// --- Interfaces ---
interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface ExpensesResponse {
    success: boolean;
    data: Expense[];
    pagination: PaginationInfo;
    fromCache: boolean;
}

interface ExpenseCategoriesResponse {
    success: boolean;
    data: ExpenseCategory[];
    pagination: PaginationInfo;
    fromCache: boolean;
}

interface CategoriesDropdownResponse {
    success: boolean;
    data: ExpenseCategory[];
}

// --- Component: Expense List Tab ---

const ExpenseListTab: React.FC = () => {
    const isAdmin = sessionManager.getUserType() === 'admin';
    // Filter State
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryInput, setCategoryInput] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [fromDateInput, setFromDateInput] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDateInput, setToDateInput] = useState('');
    const [toDate, setToDate] = useState('');
    
    // Pagination State
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Expense | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; description: string }>({
        isOpen: false,
        id: '',
        description: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Form State
    const initialForm: Expense = {
        id: '',
        categoryId: '',
        categoryName: '',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0]
    };
    const [formData, setFormData] = useState<Expense>(initialForm);

    // Build query string
    const buildQueryString = () => {
        const branchId = sessionManager.getBranchId() || 'all';

        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        params.append('branchId', branchId);

        if (searchTerm) params.append('search', searchTerm);
        if (categoryFilter) params.append('categoryId', categoryFilter);
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        return `${API_ENDPOINTS.EXPENSES}?${params.toString()}`;
    };

    // SWR for expenses data
    const { data, error, isLoading, mutate } = useSWR<ExpensesResponse>(
        buildQueryString(),
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    // SWR for categories dropdown
    const { data: categoriesData } = useSWR<CategoriesDropdownResponse>(
        API_ENDPOINTS.EXPENSE_CATEGORIES_DROPDOWN,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

    const expenses = data?.data || [];
    const pagination = data?.pagination;
    const categories = categoriesData?.data || [];

    // Apply filters
    const applyFilters = useCallback(() => {
        setSearchTerm(searchInput);
        setCategoryFilter(categoryInput);
        setFromDate(fromDateInput);
        setToDate(toDateInput);
        setPage(1);
    }, [searchInput, categoryInput, fromDateInput, toDateInput]);

    // Export Excel (UTF-8)
    const exportToExcel = () => {
        if (expenses.length === 0) return;

        const title = `Expense Report (${fromDate || 'All'} to ${toDate || 'Today'})`;
        const headers = ["Date", "Category", "Description", "Amount"];
        
        const excelData = expenses.map(item => [
            item.date,
            item.categoryName || '',
            item.description,
            item.amount
        ]);

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `expenses_${timestamp}.xlsx`, 'Expenses');
    };

    const handleOpenModal = (item?: Expense) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData({ ...initialForm });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                description: formData.description,
                amount: formData.amount,
                date: formData.date,
                categoryId: formData.categoryId || null
            };

            if (editingItem) {
                const result = await apiClient.put(API_ENDPOINTS.EXPENSE_BY_ID(editingItem.id), payload);
                if (result.success) {
                    mutate();
                    setIsModalOpen(false);
                } else {
                    alert(result.message || 'Failed to update expense');
                }
            } else {
                const result = await apiClient.post(API_ENDPOINTS.EXPENSES, payload);
                if (result.success) {
                    mutate();
                    setIsModalOpen(false);
                } else {
                    alert(result.message || 'Failed to create expense');
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteConfirm = (id: string, description: string) => {
        setDeleteConfirm({ isOpen: true, id, description });
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirm({ isOpen: false, id: '', description: '' });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await apiClient.delete(API_ENDPOINTS.EXPENSE_BY_ID(deleteConfirm.id));
            if (result.success) {
                mutate();
                closeDeleteConfirm();
            } else {
                alert(result.message || 'Failed to delete expense');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const resetFilters = () => {
        setSearchInput('');
        setSearchTerm('');
        setCategoryInput('');
        setCategoryFilter('');
        setFromDateInput('');
        setFromDate('');
        setToDateInput('');
        setToDate('');
        setPage(1);
        mutate();
    };

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* LEFT PANEL - Filters */}
            <aside className="w-full lg:w-80 bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto shrink-0 z-30 shadow-xl max-h-[35vh] lg:max-h-full">
                <div className="flex items-center gap-2 text-red-400 border-b border-gray-700 pb-2 sticky top-0 bg-gray-800 z-10">
                    <Filter size={20} />
                    <h2 className="font-bold text-lg">Expense Filters</h2>
                </div>

                <div className="space-y-4">
                    {/* Search */}
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Search Description</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="e.g. Electricity" 
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Category</label>
                        <select 
                            value={categoryInput}
                            onChange={(e) => setCategoryInput(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">From Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-500" size={18} />
                            <input 
                                type="date"
                                value={fromDateInput}
                                onChange={(e) => setFromDateInput(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">To Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-500" size={18} />
                            <input 
                                type="date"
                                value={toDateInput}
                                onChange={(e) => setToDateInput(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-2 space-y-3">
                        <button 
                            onClick={applyFilters}
                            className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-red-900/30"
                        >
                            Apply Search
                        </button>
                        <button 
                            onClick={resetFilters}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2.5 rounded-lg font-medium transition-colors border border-gray-600 flex items-center justify-center gap-2"
                        >
                            <X size={16} /> Reset Filters
                        </button>
                    </div>
                </div>
            </aside>

            {/* RIGHT PANEL - Table */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-900 relative">
                {/* Top Action Bar in Right Panel */}
                <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900 z-20 shrink-0">
                    <h3 className="text-lg font-semibold text-gray-200">
                        Expense List <span className="text-sm font-normal text-gray-500 ml-2">({pagination?.total || 0} records)</span>
                    </h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                            onClick={exportToExcel} 
                            disabled={expenses.length === 0}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            <Download size={18} /> Export
                        </button>
                        <button 
                            style={{ display: isAdmin ? "none" : "flex" }} onClick={() => handleOpenModal()} 
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            <Plus size={18} /> Add New
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin text-red-500" size={40} />
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                            <p className="text-red-400">Failed to load expenses.</p>
                            <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Retry</button>
                        </div>
                    </div>
                )}

                {/* Table Area */}
                {!isLoading && !error && (
                    <div className="flex-1 overflow-auto p-4">
                        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden min-w-[600px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Category</th>
                                        {sessionManager.getUserType() === 'admin' && <th className="p-4">Branch</th>}
                                        <th className="p-4">Description</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {expenses.length > 0 ? (
                                        expenses.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                                <td className="p-4 text-sm text-gray-300 whitespace-nowrap">{item.date}</td>
                                                <td className="p-4 text-sm">
                                                    <span className="bg-gray-700 text-blue-300 px-2 py-1 rounded text-xs border border-gray-600">
                                                        {item.categoryName || '-'}
                                                    </span>
                                                </td>
                                                {sessionManager.getUserType() === 'admin' && (
                                                    <td className="p-4 text-sm font-bold text-blue-400">
                                                        {item.branchName || '-'}
                                                    </td>
                                                )}
                                                <td className="p-4 text-sm text-white">{item.description}</td>
                                                <td className="p-4 text-sm text-right font-medium text-red-400">-{item.amount?.toLocaleString()}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button style={{ display: isAdmin ? "none" : "flex" }} onClick={() => handleOpenModal(item)} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"><Edit size={16} /></button>
                                                        <button style={{ display: isAdmin ? "none" : "flex" }} onClick={() => openDeleteConfirm(item.id, item.description)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={sessionManager.getUserType() === 'admin' ? 6 : 5} className="p-8 text-center text-gray-500">
                                                No expense records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.total > 0 && (
                            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">Rows per page:</span>
                                    <select 
                                        value={limit}
                                        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                        className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                    >
                                        {PAGINATION_CONFIG.LIMIT_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setPage(page - 1)} 
                                        disabled={!pagination.hasPrev} 
                                        className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors"
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
                                                            ? 'bg-red-600 text-white'
                                                            : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
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
                                        className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <DollarSign className="text-red-500"/> {editingItem ? 'Edit Expense' : 'New Expense'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Expense Category</label>
                                <SearchableDropdown 
                                    options={categories}
                                    value={formData.categoryId}
                                    onChange={(id, name) => setFormData({...formData, categoryId: id, categoryName: name})}
                                    placeholder="Select Category"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700" disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Expense"
                message={`Are you sure you want to delete "${deleteConfirm.description}"?`}
                onConfirm={handleDelete}
                onCancel={closeDeleteConfirm}
                isLoading={isDeleting}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

// --- Component: Category List Tab ---

const CategoryListTab: React.FC = () => {
    const isAdmin = sessionManager.getUserType() === 'admin';
    const { mutate: globalMutate } = useSWRConfig();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
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

    // SWR for categories
    const { data, error, isLoading, mutate } = useSWR<ExpenseCategoriesResponse>(
        `${API_ENDPOINTS.EXPENSE_CATEGORIES}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 5000 }
    );

    const categories = data?.data || [];
    const pagination = data?.pagination;

    // Function to invalidate dropdown cache
    const invalidateDropdownCache = () => {
        globalMutate(API_ENDPOINTS.EXPENSE_CATEGORIES_DROPDOWN);
    };

    const handleSearch = useCallback(() => {
        setSearch(searchInput);
        setPage(1);
    }, [searchInput]);

    const handleOpenModal = (category?: ExpenseCategory) => {
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
                const result = await apiClient.put(API_ENDPOINTS.EXPENSE_CATEGORY_BY_ID(editingCategory.id), { name });
                if (result.success) {
                    mutate();
                    invalidateDropdownCache(); // Update dropdown immediately
                    setIsModalOpen(false);
                } else {
                    alert(result.message || 'Failed to update category');
                }
            } else {
                const result = await apiClient.post(API_ENDPOINTS.EXPENSE_CATEGORIES, { name });
                if (result.success) {
                    mutate();
                    invalidateDropdownCache(); // Update dropdown immediately
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
            const result = await apiClient.delete(API_ENDPOINTS.EXPENSE_CATEGORY_BY_ID(deleteConfirm.id));
            if (result.success) {
                mutate();
                invalidateDropdownCache(); // Update dropdown immediately
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

    const resetFilters = () => {
        setSearchInput('');
        setSearch('');
        setPage(1);
        mutate();
    };

    return (
        <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300 p-6">
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
                    <button onClick={resetFilters} className="p-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors" title="Refresh">
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button style={{ display: isAdmin ? "none" : "flex" }} onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg">
                        <Plus size={20} /> Add Category
                    </button>
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
                                                <button style={{ display: isAdmin ? 'none' : 'flex' }} onClick={() => handleOpenModal(cat)} className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg"><Edit size={18} /></button>
                                                <button style={{ display: isAdmin ? 'none' : 'flex' }} onClick={() => openDeleteConfirm(cat.id, cat.name)} className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg"><Trash2 size={18} /></button>
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

            {/* Category Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
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
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700" disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                                    Save
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
                message={`Are you sure you want to delete "${deleteConfirm.name}"?`}
                onConfirm={handleDelete}
                onCancel={closeDeleteConfirm}
                isLoading={isDeleting}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

// --- Main Page Component ---

const ExpensePage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'expenses' | 'categories'>('expenses');

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
             {/* Header - Fixed Top */}
            <div className="bg-gray-800 shadow-md border-b border-gray-700 sticky top-0 z-40 shrink-0">
                <div className="p-4 flex items-center">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <div className="bg-red-500/20 p-2 rounded-lg text-red-500"><DollarSign size={24}/></div>
                        Expense Management
                    </h1>
                </div>

                {/* Tabs */}
                <div className="flex px-6 gap-8">
                    <button 
                        onClick={() => setActiveTab('expenses')}
                        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'expenses' ? 'border-red-500 text-red-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        <FileText size={18} /> Expense List
                    </button>
                    <button 
                        onClick={() => setActiveTab('categories')}
                        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'categories' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        <Tags size={18} /> Expense Categories
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-gray-900">
                {activeTab === 'expenses' ? (
                    <ExpenseListTab />
                ) : (
                    <div className="h-full overflow-y-auto">
                        <CategoryListTab />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpensePage;
