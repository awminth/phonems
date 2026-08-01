import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    ShieldCheck, 
    Key, 
    Eye, 
    EyeOff,
    Search,
    ChevronLeft,
    ChevronRight,
    History,
    Loader2,
    RefreshCw,
    Printer,
    Upload,
    X
} from 'lucide-react';
import { ActivityLog } from '../../types';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, getImageUrl, sessionManager } from '../../config';

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface LogsResponse {
    success: boolean;
    data: ActivityLog[];
    pagination: PaginationInfo;
    fromCache: boolean;
}

interface PrintSettings {
    AID: number | null;
    ShopName: string;
    Address: string;
    PhoneNo: string;
    Logo: string;
    ChkLogo: number;
}

interface PrintSettingsResponse {
    success: boolean;
    data: PrintSettings;
    fromCache: boolean;
}

const Security: React.FC = () => {
  const navigate = useNavigate();
  
  // Get current user from session
  const currentUserId = sessionManager.getUserId();
  const currentUsername = sessionManager.getUsername();
  const currentUserType = sessionManager.getUserType();
  
  // Change Password State
  const [passwordForm, setPasswordForm] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Print Settings State
  const [printSettingsForm, setPrintSettingsForm] = useState<PrintSettings>({
    AID: null,
    ShopName: '',
    Address: '',
    PhoneNo: '',
    Logo: '',
    ChkLogo: 0
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Activity Log State
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
  const [limit, setLimit] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);

  // Build query string for logs
  const buildLogsQuery = () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (currentUserId) params.append('userId', currentUserId);
      return `${API_ENDPOINTS.LOGS}?${params.toString()}`;
  };

  // SWR for print settings
  const { data: printSettingsData, error: printSettingsError, isLoading: printSettingsLoading, mutate: mutatePrintSettings } = useSWR<PrintSettingsResponse>(
      API_ENDPOINTS.SETTINGS_PRINT,
      fetcher,
      { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  // Update form when settings are loaded
  useEffect(() => {
      if (printSettingsData?.data) {
          setPrintSettingsForm({
              ...printSettingsData.data,
              ChkLogo: printSettingsData.data.ChkLogo || 0
          });
          if (printSettingsData.data.Logo) {
              setLogoPreview(getImageUrl(printSettingsData.data.Logo));
          }
      }
  }, [printSettingsData]);

  // SWR for activity logs
  const { data: logsData, error: logsError, isLoading: logsLoading, mutate: mutateLogs } = useSWR<LogsResponse>(
      (currentUserId && currentUserType !== 'user') ? buildLogsQuery() : null,
      fetcher,
      { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const logs = logsData?.data || [];
  const pagination = logsData?.pagination;

  // --- Handlers ---

  const handlePasswordSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          alert("New passwords do not match!");
          return;
      }
      
      if (!currentUserId) {
          alert("Please login first!");
          navigate('/');
          return;
      }
      
      setIsChangingPassword(true);
      
      try {
          const result = await apiClient.post(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, {
              userId: currentUserId,
              currentPassword: passwordForm.currentPassword,
              newPassword: passwordForm.newPassword
          });
          
          if (result.success) {
              alert("Password changed successfully!");
              setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              // Refresh logs to show password change entry
              mutateLogs();
          } else {
              alert(result.message || "Failed to change password");
          }
      } catch (error) {
          console.error('Change password error:', error);
          alert("An error occurred. Please try again.");
      } finally {
          setIsChangingPassword(false);
      }
  };

  // Print Settings Handlers
  const validateImageFile = (file: File): boolean => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(file.type)) {
          alert('Only image files (JPG, PNG, GIF, WEBP) are allowed!');
          return false;
      }
      
      if (file.size > maxSize) {
          alert('File size must be less than 5MB!');
          return false;
      }
      
      return true;
  };

  const processLogoFile = (file: File) => {
      if (!validateImageFile(file)) return;
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
          setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          processLogoFile(file);
      }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
          processLogoFile(file);
      }
  };

  const handleRemoveLogo = () => {
      setLogoFile(null);
      setLogoPreview(null);
      setPrintSettingsForm({ ...printSettingsForm, Logo: '' });
  };

  const handleUploadLogo = async () => {
      if (!logoFile) return;

      setIsUploadingLogo(true);
      try {
          const formData = new FormData();
          formData.append('logo', logoFile);

          const result = await apiClient.postFormData(API_ENDPOINTS.SETTINGS_PRINT_LOGO, formData);
          
          if (result.success) {
              alert("Logo uploaded successfully!");
              setLogoFile(null);
              // Fetch updated settings and update session
              const updatedSettings = await apiClient.get(API_ENDPOINTS.SETTINGS_PRINT);
              if (updatedSettings.success && updatedSettings.data) {
                  sessionManager.setPrintSettings(updatedSettings.data);
              }
              mutatePrintSettings();
          } else {
              alert(result.message || "Failed to upload logo");
          }
      } catch (error) {
          console.error('Upload logo error:', error);
          alert("An error occurred while uploading logo.");
      } finally {
          setIsUploadingLogo(false);
      }
  };

  const handlePrintSettingsSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      setIsUpdatingSettings(true);
      
      try {
          let logoPath = printSettingsForm.Logo;
          
          // If there's a new logo file, upload it first
          if (logoFile) {
              setIsUploadingLogo(true);
              try {
                  const formData = new FormData();
                  formData.append('logo', logoFile);

                  const uploadResult = await apiClient.postFormData(API_ENDPOINTS.SETTINGS_PRINT_LOGO, formData);
                  
                  if (uploadResult.success) {
                      logoPath = uploadResult.data.Logo;
                      setLogoFile(null);
                      setLogoPreview(null);
                  } else {
                      alert(uploadResult.message || "Failed to upload logo");
                      setIsUpdatingSettings(false);
                      setIsUploadingLogo(false);
                      return;
                  }
              } catch (uploadError) {
                  console.error('Upload logo error:', uploadError);
                  alert("An error occurred while uploading logo.");
                  setIsUpdatingSettings(false);
                  setIsUploadingLogo(false);
                  return;
              } finally {
                  setIsUploadingLogo(false);
              }
          }
          
          // Update print settings with the logo path
          const result = await apiClient.put(API_ENDPOINTS.SETTINGS_PRINT, {
              ShopName: printSettingsForm.ShopName,
              Address: printSettingsForm.Address,
              PhoneNo: printSettingsForm.PhoneNo,
              Logo: logoPath,
              ChkLogo: printSettingsForm.ChkLogo
          });
          
          if (result.success) {
              alert("Print settings updated successfully!");
              // Update session with new settings
              sessionManager.setPrintSettings(result.data);
              mutatePrintSettings();
              mutateLogs();
          } else {
              alert(result.message || "Failed to update print settings");
          }
      } catch (error) {
          console.error('Update print settings error:', error);
          alert("An error occurred. Please try again.");
      } finally {
          setIsUpdatingSettings(false);
      }
  };

  const handleSearch = useCallback(() => {
      setSearchTerm(searchInput);
      setPage(1);
  }, [searchInput]);

  const resetFilters = () => {
      setSearchInput('');
      setSearchTerm('');
      setPage(1);
      mutateLogs();
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-700 sticky top-0 z-40 shrink-0 h-16">
        <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
        >
            <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
            <div className="bg-gray-600/20 p-2 rounded-lg text-gray-400">
                <ShieldCheck size={20} />
            </div>
            <h1 className="text-xl font-bold">Security Settings</h1>
        </div>
        
        {/* Current User Info */}
        {currentUsername && (
            <div className="ml-auto text-sm text-gray-400">
                Logged in as: <span className="text-white font-medium">{currentUsername}</span>
            </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          
          {/* Section 1: Change Password */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden max-w-4xl mx-auto">
              <div className="p-5 border-b border-gray-700 bg-gray-750 flex items-center gap-2">
                  <Key className="text-blue-500" size={20}/>
                  <h2 className="text-lg font-bold">Change Password</h2>
              </div>
              <div className="p-6">
                  <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                          <div className="relative">
                              <input 
                                  type={showCurrent ? "text" : "password"}
                                  value={passwordForm.currentPassword}
                                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                                  placeholder="Enter current password"
                                  required
                                  disabled={isChangingPassword}
                              />
                              <button 
                                  type="button" 
                                  onClick={() => setShowCurrent(!showCurrent)}
                                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
                              >
                                  {showCurrent ? <EyeOff size={18}/> : <Eye size={18}/>}
                              </button>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                          <div className="relative">
                              <input 
                                  type={showNew ? "text" : "password"}
                                  value={passwordForm.newPassword}
                                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                                  placeholder="Enter new password"
                                  required
                                  disabled={isChangingPassword}
                              />
                              <button 
                                  type="button" 
                                  onClick={() => setShowNew(!showNew)}
                                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
                              >
                                  {showNew ? <EyeOff size={18}/> : <Eye size={18}/>}
                              </button>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
                          <div className="relative">
                              <input 
                                  type={showConfirm ? "text" : "password"}
                                  value={passwordForm.confirmPassword}
                                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                                  placeholder="Confirm new password"
                                  required
                                  disabled={isChangingPassword}
                              />
                              <button 
                                  type="button" 
                                  onClick={() => setShowConfirm(!showConfirm)}
                                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
                              >
                                  {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                              </button>
                          </div>
                      </div>
                      <div className="md:col-span-3 flex justify-end">
                          <button 
                              type="submit"
                              disabled={isChangingPassword}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-lg shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                              {isChangingPassword && <Loader2 className="animate-spin" size={18} />}
                              Update Password
                          </button>
                      </div>
                  </form>
              </div>
          </div>

          {/* Section 2: Print Settings */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden max-w-4xl mx-auto">
              <div className="p-5 border-b border-gray-700 bg-gray-750 flex items-center gap-2">
                  <Printer className="text-purple-500" size={20}/>
                  <h2 className="text-lg font-bold">Print Settings</h2>
              </div>
              <div className="p-6">
                  {printSettingsLoading ? (
                      <div className="flex items-center justify-center py-10">
                          <Loader2 className="animate-spin text-purple-500" size={32} />
                      </div>
                  ) : printSettingsError ? (
                      <div className="p-4 text-center text-red-400">
                          <p>Failed to load print settings.</p>
                          <button onClick={() => mutatePrintSettings()} className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm">Retry</button>
                      </div>
                  ) : (
                      <form onSubmit={handlePrintSettingsSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-sm font-medium text-gray-400 mb-1">Shop Name</label>
                                  <input 
                                      type="text"
                                      value={printSettingsForm.ShopName}
                                      onChange={(e) => setPrintSettingsForm({...printSettingsForm, ShopName: e.target.value})}
                                      className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                      placeholder="Enter shop name"
                                      disabled={isUpdatingSettings}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                                  <input 
                                      type="text"
                                      value={printSettingsForm.PhoneNo}
                                      onChange={(e) => setPrintSettingsForm({...printSettingsForm, PhoneNo: e.target.value})}
                                      className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                      placeholder="Enter phone number"
                                      disabled={isUpdatingSettings}
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                              <textarea 
                                  value={printSettingsForm.Address}
                                  onChange={(e) => setPrintSettingsForm({...printSettingsForm, Address: e.target.value})}
                                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                  placeholder="Enter shop address"
                                  rows={3}
                                  disabled={isUpdatingSettings}
                              />
                          </div>
                          
                          {/* Logo Upload Section */}
                          <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">Shop Logo</label>
                              <div className="flex flex-col md:flex-row gap-4 items-start">
                                  {/* Logo Preview */}
                                  <div className="relative">
                                      {(logoPreview || printSettingsForm.Logo) && (
                                          <div className="relative w-32 h-32 border-2 border-gray-600 rounded-lg overflow-hidden bg-gray-900">
                                              <img 
                                                  src={logoPreview || getImageUrl(printSettingsForm.Logo)} 
                                                  alt="Logo preview" 
                                                  className="w-full h-full object-contain"
                                              />
                                              {logoFile && (
                                                  <button
                                                      type="button"
                                                      onClick={handleRemoveLogo}
                                                      className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-500 rounded-full text-white"
                                                      title="Remove"
                                                  >
                                                      <X size={16} />
                                                  </button>
                                              )}
                                          </div>
                                      )}
                                  </div>
                                  
                                  {/* Drag & Drop Upload Zone */}
                                  <div className="flex-1 space-y-3">
                                      <div
                                          onDragOver={handleDragOver}
                                          onDragLeave={handleDragLeave}
                                          onDrop={handleDrop}
                                          className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                                              isDragging
                                                  ? 'border-purple-500 bg-purple-500/10'
                                                  : 'border-gray-600 bg-gray-900/50 hover:border-gray-500'
                                          }`}
                                      >
                                          <input 
                                              type="file"
                                              accept="image/*"
                                              onChange={handleLogoChange}
                                              className="hidden"
                                              id="logo-upload"
                                              disabled={isUploadingLogo || isUpdatingSettings}
                                          />
                                          
                                          <div className="flex flex-col items-center justify-center text-center">
                                              {logoFile ? (
                                                  <>
                                                      <div className="mb-3">
                                                          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-2">
                                                              <Upload className="text-purple-400" size={32} />
                                                          </div>
                                                          <p className="text-sm text-white font-medium">{logoFile.name}</p>
                                                          <p className="text-xs text-gray-400 mt-1">
                                                              {(logoFile.size / 1024).toFixed(2)} KB
                                                          </p>
                                                          <p className="text-xs text-purple-400 mt-2">
                                                              Logo will be uploaded when you save settings
                                                          </p>
                                                      </div>
                                                      <label
                                                          htmlFor="logo-upload"
                                                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
                                                      >
                                                          Change Logo
                                                      </label>
                                                  </>
                                              ) : (
                                                  <>
                                                      <div className="mb-3">
                                                          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                                                              <Upload className="text-gray-400" size={32} />
                                                          </div>
                                                          <p className="text-sm text-gray-300 font-medium mb-1">
                                                              Drag & Drop your logo here
                                                          </p>
                                                          <p className="text-xs text-gray-500">or</p>
                                                      </div>
                                                      <label
                                                          htmlFor="logo-upload"
                                                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2"
                                                      >
                                                          <Upload size={18} />
                                                          Browse Files
                                                      </label>
                                                  </>
                                              )}
                                          </div>
                                      </div>
                                      <p className="text-xs text-gray-500 text-center">
                                          Supported formats: JPG, PNG, GIF, WEBP (Max 5MB)
                                      </p>
                                  </div>
                              </div>
                              {/* Include Logo Checkbox */}
                              <div className="mt-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                          type="checkbox"
                                          checked={printSettingsForm.ChkLogo === 1}
                                          onChange={(e) => setPrintSettingsForm({...printSettingsForm, ChkLogo: e.target.checked ? 1 : 0})}
                                          className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                          disabled={isUpdatingSettings}
                                      />
                                      <span className="text-sm text-gray-300">Include Logo</span>
                                  </label>
                              </div>
                          </div>
                          
                          <div className="flex justify-end pt-4 border-t border-gray-700">
                              <button 
                                  type="submit"
                                  disabled={isUpdatingSettings}
                                  className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-6 rounded-lg shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                              >
                                  {isUpdatingSettings && <Loader2 className="animate-spin" size={18} />}
                                  Update Settings
                              </button>
                          </div>
                      </form>
                  )}
              </div>
          </div>

          {/* Section 3: Activity Log */}
          {currentUserType !== 'user' && (
              <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden max-w-6xl mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="p-5 border-b border-gray-700 bg-gray-750 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                      <History className="text-emerald-500" size={20}/>
                      <h2 className="text-lg font-bold">Activity Log History</h2>
                      {pagination && (
                          <span className="text-sm text-gray-500">({pagination.total} records)</span>
                      )}
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="relative w-full md:w-64">
                          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          <input 
                              type="text" 
                              placeholder="Search logs..." 
                              value={searchInput}
                              onChange={(e) => setSearchInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                              className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                      </div>
                      <button 
                          onClick={handleSearch}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                      >
                          Search
                      </button>
                      <button 
                          onClick={resetFilters}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                          title="Refresh"
                      >
                          <RefreshCw size={18} className={logsLoading ? 'animate-spin' : ''} />
                      </button>
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
              </div>

              {/* Loading State */}
              {logsLoading && (
                  <div className="flex items-center justify-center py-20">
                      <Loader2 className="animate-spin text-emerald-500" size={40} />
                  </div>
              )}

              {/* Error State */}
              {logsError && (
                  <div className="p-8 text-center">
                      <p className="text-red-400">Failed to load activity logs.</p>
                      <button onClick={() => mutateLogs()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Retry</button>
                  </div>
              )}

              {/* Table */}
              {!logsLoading && !logsError && (
                  <>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold border-b border-gray-700">
                                      <th className="p-4 w-16 text-center">No</th>
                                      <th className="p-4">Date/Time</th>
                                      <th className="p-4">User</th>
                                      <th className="p-4">Action</th>
                                      <th className="p-4">Description</th>
                                      <th className="p-4">IP Address</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700">
                                  {logs.length > 0 ? (
                                      logs.map((log, index) => (
                                          <tr key={log.id} className="hover:bg-gray-750 transition-colors">
                                              <td className="p-4 text-center text-gray-500">
                                                  {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                                              </td>
                                              <td className="p-4 text-sm text-gray-300 whitespace-nowrap">{log.date}</td>
                                              <td className="p-4 text-sm font-medium text-white">
                                                  <span className="bg-gray-700 px-2 py-1 rounded text-xs border border-gray-600">
                                                      {log.user}
                                                  </span>
                                              </td>
                                              <td className="p-4 text-sm text-emerald-400 font-medium">{log.action}</td>
                                              <td className="p-4 text-sm text-gray-300">{log.description}</td>
                                              <td className="p-4 text-sm text-gray-500 font-mono">{log.ip}</td>
                                          </tr>
                                      ))
                                  ) : (
                                      <tr>
                                          <td colSpan={6} className="p-8 text-center text-gray-500">
                                              No logs found.
                                          </td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>

                      {/* Pagination */}
                      {pagination && pagination.total > 0 && (
                          <div className="p-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800">
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
                                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                                                      page === pageNum 
                                                          ? 'bg-emerald-600 text-white scale-105 shadow-lg' 
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
                  </>
              )}
          </div>
          )}
      </div>
    </div>
  );
};

export default Security;
