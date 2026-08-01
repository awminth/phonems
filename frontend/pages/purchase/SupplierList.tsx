import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { ArrowLeft, Plus, Edit, Trash2, X, Building2, Phone, Mail, MapPin, Loader2, RefreshCw, Search, ChevronLeft, ChevronRight, DollarSign, Download } from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';
import { Supplier } from '../../types';

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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SuppliersResponse {
  success: boolean;
  data: Supplier[];
  pagination: PaginationInfo;
  fromCache: boolean;
}

const SupplierList: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialForm = { name: '', address: '', email: '', phone: '', remark: '' };
  const [formData, setFormData] = useState(initialForm);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
  const [limit, setLimit] = useState(12);
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

  const openDeleteConfirm = (id: string, supplierName: string) => {
    setDeleteConfirm({ isOpen: true, id, name: supplierName });
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
  const exportToExcel = () => {
    if (suppliers.length === 0) return;

    const title = `Supplier List (${search ? `Search: ${search}` : 'All Suppliers'})`;
    const headers = ["Name", "Phone", "Email", "Address", "Remark"];
    
    const excelData = suppliers.map(s => [
      s.name,
      s.phone || '-',
      s.email || '-',
      s.address || '-',
      s.remark || '-'
    ]);

    const timestamp = new Date().toISOString().split('T')[0];
    exportStyledExcel(title, headers, excelData, `supplier_list_${timestamp}.xlsx`, 'Suppliers');
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
        <h1 className="text-xl font-bold">Supplier Management</h1>
        
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

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Search and Add Section */}
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
            <button
              onClick={handleSearch}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
            >
              Search
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={exportToExcel}
              disabled={suppliers.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
            >
              <Download size={20} /> Export
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
            >
              <Plus size={20} /> Add Supplier
            </button>
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
            <p className="text-red-400">Failed to load suppliers. Please try again.</p>
            <button
              onClick={() => mutate()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              Retry
            </button>
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
                      <button 
                        onClick={() => handleOpenModal(supplier)}
                        className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => openDeleteConfirm(supplier.id, supplier.name)}
                        className="p-1.5 text-red-400 hover:bg-red-900/30 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
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
                  <p>No companies found. Add one to get started.</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.total > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Show</span>
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="text-indigo-500"/> {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Supplier Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter company name"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="09..."
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="example@mail.com"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                  placeholder="Enter full address"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Remark</label>
                <textarea 
                  value={formData.remark}
                  onChange={(e) => setFormData({...formData, remark: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                  placeholder="Optional notes..."
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold shadow-lg shadow-indigo-900/30 flex items-center gap-2 disabled:opacity-50"
                  disabled={isSubmitting}
                >
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
      />
    </div>
  );
};

export default SupplierList;
