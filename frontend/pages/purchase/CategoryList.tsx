import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { ArrowLeft, Plus, Edit, Trash2, X, Tags, Loader2, ChevronLeft, ChevronRight, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient } from '../../config';
import { Category } from '../../types';

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
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-900/50 text-red-400">
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

const CategoryList: React.FC = () => {
  const navigate = useNavigate();
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

  // SWR for data fetching with pagination
  const { data, error, isLoading, mutate } = useSWR<CategoriesResponse>(
    `${API_ENDPOINTS.CATEGORIES}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const categories = data?.data || [];
  const pagination = data?.pagination;

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

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
        // Update category
        const result = await apiClient.put(API_ENDPOINTS.CATEGORY_BY_ID(editingCategory.id), { name });
        if (result.success) {
          mutate(); // Revalidate data
          setIsModalOpen(false);
        } else {
          alert(result.message || 'Failed to update category');
        }
      } else {
        // Create category
        const result = await apiClient.post(API_ENDPOINTS.CATEGORIES, { name });
        if (result.success) {
          mutate(); // Revalidate data
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
        mutate(); // Revalidate data
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      <header className="bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-700 sticky top-0 z-40">
        <button 
          onClick={() => navigate('/purchase')}
          className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Category Management</h1>
        
        {/* Refresh Button */}
        <button
          onClick={() => {
            setSearchInput('');
            setSearch('');
            setPage(1);
            mutate();
          }}
          className="ml-auto p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
          title="Refresh data"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {/* Search and Add Section */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          {/* Search */}
          <div className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search categories..."
                className="w-full bg-gray-800 border border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
            >
              Search
            </button>
          </div>

          {/* Add Button */}
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
          >
            <Plus size={20} /> Add Category
          </button>
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
            <p className="text-red-400">Failed to load categories. Please try again.</p>
            <button
              onClick={() => mutate()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              Retry
            </button>
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
                          <button 
                            onClick={() => handleOpenModal(cat)}
                            className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => openDeleteConfirm(cat.id, cat.name)}
                            className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.total > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Items per page */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Show</span>
                  <select
                    value={limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {PAGINATION_CONFIG.LIMIT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <span>of {pagination.total} entries</span>
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
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
                          onClick={() => handlePageChange(pageNum)}
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
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!pagination.hasNext}
                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Tags className="text-blue-500"/> {editingCategory ? 'Edit Category' : 'New Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
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
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg shadow-blue-900/30 flex items-center gap-2 disabled:opacity-50"
                  disabled={isSubmitting}
                >
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
      />
    </div>
  );
};

export default CategoryList;
