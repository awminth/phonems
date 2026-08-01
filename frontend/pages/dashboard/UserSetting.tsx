import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Plus, 
    Edit, 
    Trash2, 
    Search, 
    Download, 
    ChevronLeft, 
    ChevronRight,
    X,
    UserCog,
    Eye,
    EyeOff,
    Shield,
    Check,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { User } from '../../types';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, sessionManager } from '../../config';

// Sidebar items definition for permission mapping
const PERMISSIONS_LIST = [
    { id: 'sale', label: 'Sale' },
    { id: 'sale-return', label: 'Sale Return' },
    { id: 'purchase', label: 'Purchase' },
    { id: 'reports', label: 'Reports' },
    { id: 'setting', label: 'Setting' },
    { id: 'expense', label: 'Expense' },
    { id: 'user', label: 'User Setting' },
    { id: 'financial', label: 'Financial' },
    { id: 'customer', label: 'Customer' },
    { id: 'ai', label: 'Post Creator AI' },
    { id: 'services', label: 'Services' },
];

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

interface UsersResponse {
    success: boolean;
    data: User[];
    pagination: PaginationInfo;
    fromCache: boolean;
}

const UserSetting: React.FC = () => {
  const navigate = useNavigate();
  const currentUserType = sessionManager.getUserType();
  
  // Search & Pagination State
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
  const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; username: string }>({
      isOpen: false,
      id: '',
      username: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const initialForm = { 
      username: '', 
      password: '', 
      confirmPassword: '', 
      isActive: true, 
      permissions: [] as string[],
      userType: 'user' as 'admin' | 'user' | 'manager',
      branchId: '' as string
  };
  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Build query string for SWR
  const buildQueryString = () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (searchTerm) params.append('search', searchTerm);
      return `${API_ENDPOINTS.USERS}?${params.toString()}`;
  };

  // SWR for users data
  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
      buildQueryString(),
      fetcher,
      { revalidateOnFocus: false, dedupingInterval: 5000 }
  );
  
  // SWR for branches (for dropdown)
  const { data: branchesData } = useSWR<{success: boolean, data: any[]}>(
      API_ENDPOINTS.BRANCHES,
      fetcher,
      { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  const branches = branchesData?.data || [];

  const users = data?.data || [];
  const pagination = data?.pagination;

  // Search handler
  const handleSearch = useCallback(() => {
      setSearchTerm(searchInput);
      setPage(1);
  }, [searchInput]);

  // Export Excel (UTF-8)
  const exportToExcel = () => {
    // Helper function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ["Username", "Status", "Permissions"];
    const rows = [
      headers.map(escapeCSV).join(','),
      ...users.map(user => [
        escapeCSV(user.username),
        escapeCSV(user.isActive ? 'Active' : 'Inactive'),
        escapeCSV(user.permissions.join(', '))
      ].join(','))
    ];

    const csvContent = rows.join("\r\n");
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `users_list_${timestamp}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  // Modal Handlers
  const handleOpenModal = (user?: User) => {
      if (user) {
          setEditingUser(user);
          setFormData({
              username: user.username,
              password: '',
              confirmPassword: '',
              isActive: user.isActive,
              permissions: [...user.permissions],
              userType: user.userType || 'user',
              branchId: user.branchId || ''
          });
      } else {
          setEditingUser(null);
          setFormData({
              ...initialForm,
              branchId: currentUserType === 'manager' ? (sessionManager.getBranchId() || '') : ''
          });
      }
      setShowPassword(false);
      setShowConfirmPassword(false);
      setIsModalOpen(true);
  };

  const handlePermissionChange = (permId: string) => {
      setFormData(prev => {
          if (prev.permissions.includes(permId)) {
              return { ...prev, permissions: prev.permissions.filter(p => p !== permId) };
          } else {
              return { ...prev, permissions: [...prev.permissions, permId] };
          }
      });
  };

  const handleSelectAllPermissions = () => {
      if (formData.permissions.length === PERMISSIONS_LIST.length) {
          setFormData({ ...formData, permissions: [] });
      } else {
          setFormData({ ...formData, permissions: PERMISSIONS_LIST.map(p => p.id) });
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!editingUser && !formData.password) {
          alert("Password is required for new users");
          return;
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
          alert("Passwords do not match");
          return;
      }

      setIsSubmitting(true);

      try {
          const payload = {
              username: formData.username,
              password: formData.password || undefined,
              isActive: formData.isActive,
              permissions: formData.permissions,
              userType: formData.userType,
              branchId: formData.userType === 'admin' ? null : formData.branchId
          };

          if (editingUser) {
              const result = await apiClient.put(API_ENDPOINTS.USER_BY_ID(editingUser.id), payload);
              if (result.success) {
                  mutate();
                  setIsModalOpen(false);
              } else {
                  alert(result.message || 'Failed to update user');
              }
          } else {
              const result = await apiClient.post(API_ENDPOINTS.USERS, payload);
              if (result.success) {
                  mutate();
                  setIsModalOpen(false);
              } else {
                  alert(result.message || 'Failed to create user');
              }
          }
      } catch (error) {
          console.error('Submit error:', error);
          alert('An error occurred. Please try again.');
      } finally {
          setIsSubmitting(false);
      }
  };

  const openDeleteConfirm = (id: string, username: string) => {
      setDeleteConfirm({ isOpen: true, id, username });
  };

  const closeDeleteConfirm = () => {
      setDeleteConfirm({ isOpen: false, id: '', username: '' });
  };

  const handleDelete = async () => {
      setIsDeleting(true);
      try {
          const result = await apiClient.delete(API_ENDPOINTS.USER_BY_ID(deleteConfirm.id));
          if (result.success) {
              mutate();
              closeDeleteConfirm();
          } else {
              alert(result.message || 'Failed to delete user');
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
      setPage(1);
      mutate();
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex flex-col font-sans overflow-hidden">
      {/* Header - Fixed Top */}
      <header className="bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-700 z-40 shrink-0 h-16">
        <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
        >
            <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
            <div className="bg-purple-500/20 p-2 rounded-lg text-purple-500">
                <UserCog size={20} />
            </div>
            <h1 className="text-xl font-bold">User Setting</h1>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={resetFilters}
          className="ml-auto p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
          title="Refresh & Reset"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8 flex flex-col">
          
          {/* Action Bar */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-700 shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search username..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    <button onClick={handleSearch} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">Search</button>
                    <select 
                        value={limit}
                        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                        className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    >
                        {PAGINATION_CONFIG.LIMIT_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt} rows</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={exportToExcel}
                        disabled={users.length === 0}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Download size={18} /> Export
                    </button>
                    {(currentUserType === 'admin' || currentUserType === 'manager') && (
                        <button 
                            onClick={() => handleOpenModal()}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            <Plus size={18} /> Add User
                        </button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-purple-500" size={40} />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                        <p className="text-red-400">Failed to load users.</p>
                        <button onClick={() => mutate()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Retry</button>
                    </div>
                </div>
            )}

            {/* Table */}
            {!isLoading && !error && (
                <div className="flex-1 bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                     <th className="p-4 w-16 text-center">No</th>
                                     <th className="p-4">Username</th>
                                     <th className="p-4">Type</th>
                                     <th className="p-4">Branch</th>
                                     <th className="p-4 text-center">Status</th>
                                     <th className="p-4">Permissions</th>
                                     <th className="p-4 text-center w-32">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {users.length > 0 ? (
                                    users.map((user, index) => (
                                        <tr key={user.id} className="hover:bg-gray-750 transition-colors">
                                            <td className="p-4 text-center text-gray-500">
                                                {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                                            </td>
                                            <td className="p-4 font-medium text-white flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 text-xs font-bold border border-blue-800">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                 {user.username}
                                             </td>
                                             <td className="p-4">
                                                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                     user.userType === 'admin' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 
                                                     user.userType === 'manager' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' :
                                                     'bg-blue-500/20 text-blue-500 border border-blue-500/50'
                                                 }`}>
                                                     {user.userType}
                                                 </span>
                                             </td>
                                             <td className="p-4 text-sm text-gray-300">
                                                 {user.userType === 'admin' ? (
                                                     <span className="text-gray-500 italic">All Branches</span>
                                                 ) : (
                                                     (user as any).branchName || <span className="text-red-400/50">Not Assigned</span>
                                                 )}
                                             </td>
                                            <td className="p-4 text-center">
                                                {user.isActive ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-800">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-800">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-gray-300">
                                                {user.permissions.length === PERMISSIONS_LIST.length ? (
                                                    <span className="text-purple-400 font-medium">All Permissions</span>
                                                ) : (
                                                    <span className="line-clamp-1" title={user.permissions.join(', ')}>
                                                        {user.permissions.length > 3 
                                                            ? `${user.permissions.slice(0,3).join(', ')} +${user.permissions.length - 3} more`
                                                            : user.permissions.join(', ') || 'No Permissions'
                                                        }
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {(currentUserType === 'admin' || currentUserType === 'manager') && (
                                                        <>
                                                            <button onClick={() => handleOpenModal(user)} className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg" title="Edit"><Edit size={16} /></button>
                                                            <button onClick={() => openDeleteConfirm(user.id, user.username)} className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.total > 0 && (
                        <div className="mt-auto p-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800">
                            <span className="text-sm text-gray-400">
                                Page <span className="text-white font-medium">{pagination.page}</span> of <span className="text-white font-medium">{pagination.totalPages}</span>
                                <span className="ml-2">({pagination.total} total)</span>
                            </span>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setPage(page - 1)} 
                                    disabled={!pagination.hasPrev} 
                                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
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
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
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
                                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200 my-8">
                <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserCog className="text-purple-500"/> {editingUser ? 'Edit User' : 'New User'}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Enter username"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    {editingUser ? 'New Password (Optional)' : 'Password'}
                                </label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-purple-500 outline-none pr-10"
                                        placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
                                        disabled={isSubmitting}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-purple-500 outline-none pr-10"
                                        placeholder="Confirm password"
                                        disabled={isSubmitting}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">User Type</label>
                                    <select
                                        value={formData.userType}
                                        onChange={(e) => setFormData({...formData, userType: e.target.value as 'admin' | 'user' | 'manager'})}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        disabled={isSubmitting}
                                    >
                                        <option value="user">User</option>
                                        <option value="manager">Manager</option>
                                        {currentUserType !== 'manager' && <option value="admin">Admin</option>}
                                    </select>
                                </div>
                                {formData.userType !== 'admin' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Branch</label>
                                        <select
                                            required={formData.userType !== 'admin'}
                                            value={formData.branchId}
                                            onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
                                            disabled={isSubmitting || currentUserType === 'manager'}
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map((b: any) => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <label className="flex items-center cursor-pointer select-none group">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                            disabled={isSubmitting}
                                        />
                                        <div className={`block w-12 h-7 rounded-full transition-colors ${formData.isActive ? 'bg-green-600' : 'bg-gray-600'}`}></div>
                                        <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formData.isActive ? 'transform translate-x-5' : ''}`}></div>
                                    </div>
                                    <div className="ml-3 text-sm font-medium text-gray-300 group-hover:text-white">
                                        {formData.isActive ? 'User is Active' : 'User is Inactive'}
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Right Column: Permissions */}
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
                                <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    <Shield size={16} className="text-purple-400"/> Permissions
                                </h3>
                                <button 
                                    type="button"
                                    onClick={handleSelectAllPermissions}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                                    disabled={isSubmitting}
                                >
                                    {formData.permissions.length === PERMISSIONS_LIST.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            
                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {PERMISSIONS_LIST.map(perm => (
                                    <label key={perm.id} className="flex items-center p-2 rounded hover:bg-gray-800 cursor-pointer transition-colors group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${formData.permissions.includes(perm.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-500 group-hover:border-purple-400'}`}>
                                            {formData.permissions.includes(perm.id) && <Check size={14} className="text-white" />}
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="hidden"
                                            checked={formData.permissions.includes(perm.id)}
                                            onChange={() => handlePermissionChange(perm.id)}
                                            disabled={isSubmitting}
                                        />
                                        <span className={`text-sm ${formData.permissions.includes(perm.id) ? 'text-white font-medium' : 'text-gray-400'}`}>
                                            {perm.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700" disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-500 font-bold shadow-lg shadow-purple-900/30 flex items-center gap-2 disabled:opacity-50" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                            {editingUser ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Delete User"
          message={`Are you sure you want to delete "${deleteConfirm.username}"?`}
          onConfirm={handleDelete}
          onCancel={closeDeleteConfirm}
          isLoading={isDeleting}
          confirmText="Delete"
          cancelText="Cancel"
      />
    </div>
  );
};

export default UserSetting;
