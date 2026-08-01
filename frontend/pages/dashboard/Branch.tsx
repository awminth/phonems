import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import { apiClient, API_ENDPOINTS, getImageUrl } from '../../config';
import { Branch } from '../../types';

const BranchPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    branchId: '',
    name: '',
    invoiceHeaderName: '',
    address: '',
    phoneNo: '',
    logo: '',
    includeLogo: false,
    footerMessage: '',
    warrantyPolicy: ''
  });
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.BRANCHES);
      if (response.success) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setSelectedBranch(branch);
      setFormData({
        branchId: branch.branchId || '',
        name: branch.name || '',
        invoiceHeaderName: branch.invoiceHeaderName || '',
        address: branch.address || '',
        phoneNo: branch.phoneNo || '',
        logo: branch.logo || '',
        includeLogo: branch.includeLogo || false,
        footerMessage: branch.footerMessage || '',
        warrantyPolicy: branch.warrantyPolicy || ''
      });
      setLogoPreview(getImageUrl(branch.logo));
    } else {
      setSelectedBranch(null);
      setFormData({
        branchId: '',
        name: '',
        invoiceHeaderName: '',
        address: '',
        phoneNo: '',
        logo: '',
        includeLogo: false,
        footerMessage: '',
        warrantyPolicy: ''
      });
      setLogoPreview(null);
    }
    setLogoFile(null);
    setIsModalOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      let finalLogoPath = formData.logo;
      
      // Upload logo if changed
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);
        const uploadRes = await apiClient.postFormData(API_ENDPOINTS.BRANCH_UPLOAD_LOGO, logoFormData);
        if (uploadRes.success) {
          finalLogoPath = uploadRes.data.logoPath;
        } else {
          throw new Error(uploadRes.message || 'Logo upload failed');
        }
      }

      const submissionData = { ...formData, logo: finalLogoPath };

      let response;
      if (selectedBranch) {
        response = await apiClient.put(API_ENDPOINTS.BRANCH_BY_ID(selectedBranch.id), submissionData);
      } else {
        response = await apiClient.post(API_ENDPOINTS.BRANCHES, submissionData);
      }

      if (response.success) {
        setIsModalOpen(false);
        fetchBranches();
      } else {
        alert(response.message || 'Failed to save branch');
      }
    } catch (error: any) {
      console.error('Save branch error:', error);
      alert(error.message || 'An error occurred while saving branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    
    try {
      setIsDeleting(true);
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_BY_ID(id));
      if (response.success) {
        fetchBranches();
      }
    } catch (error) {
      console.error('Failed to delete branch:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.branchId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-900 min-h-screen text-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Building2 className="text-amber-500" size={32} />
            Branch Management
          </h1>
          <p className="text-gray-400 mt-1">Manage shop branches and their invoice settings</p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-900/20 active:scale-95 h-fit"
        >
          <Plus size={20} />
          Add New Branch
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search branches by name or ID..."
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-amber-500/50 focus:bg-gray-800 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full lg:w-64 bg-gray-800 border border-gray-700 rounded-xl px-6 py-3 flex items-center justify-between lg:justify-center lg:flex-col gap-1">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Branches</span>
          <span className="text-2xl font-black text-amber-500">{branches.length}</span>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading branches...</p>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-3xl py-20 flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
            <Building2 className="text-gray-500" size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-300">No branches found</h3>
          <p className="text-gray-500 mt-2 max-w-xs">
            {searchQuery ? "No branches match your search criteria." : "Start by adding your first shop branch."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <div 
              key={branch.id} 
              className="bg-gray-800 border border-gray-700 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all group shadow-xl"
            >
              <div className="h-2 bg-amber-600"></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-600">
                      {branch.logo ? (
                        <img src={getImageUrl(branch.logo) || ''} alt={branch.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="text-gray-500" size={32} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-amber-500 transition-colors">{branch.name}</h3>
                      <span className="text-xs font-mono text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded-full">{branch.branchId}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(branch)}
                      className="p-2 bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(branch.id)}
                      className="p-2 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="text-gray-500 mt-1 flex-shrink-0" size={16} />
                    <span className="text-gray-300 line-clamp-2">{branch.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="text-gray-500 flex-shrink-0" size={16} />
                    <span className="text-gray-300">{branch.phoneNo}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="text-gray-500 flex-shrink-0" size={16} />
                    <span className="text-gray-300 italic truncate">"{branch.invoiceHeaderName}"</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {branch.includeLogo ? (
                      <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                        <CheckCircle2 size={14} />
                        Logo Included
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                        <AlertCircle size={14} />
                        Logo Hidden
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Branch ID: {branch.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700 flex items-center justify-between bg-gray-850">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                {selectedBranch ? <Edit2 className="text-amber-500" /> : <Plus className="text-amber-500" />}
                {selectedBranch ? 'Edit Branch' : 'Create New Branch'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Branch Details</label>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Branch ID (e.g., BR-001)"
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          value={formData.branchId}
                          onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Branch Name (e.g., Downtown Shop)"
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Invoice Header Name (Display Name)"
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          value={formData.invoiceHeaderName}
                          onChange={(e) => setFormData({ ...formData, invoiceHeaderName: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Contact Information</label>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Phone Numbers"
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          value={formData.phoneNo}
                          onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                        />
                      </div>
                      <div>
                        <textarea
                          required
                          placeholder="Detailed Address"
                          rows={3}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Logo & Invoice Settings */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Shop Logo</label>
                    <div className="flex items-center gap-6">
                      <div className="w-28 h-28 bg-gray-900 border-2 border-dashed border-gray-700 rounded-3xl flex items-center justify-center overflow-hidden relative group">
                        {logoPreview ? (
                          <>
                            <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <label className="cursor-pointer p-2 bg-amber-600 rounded-full text-white">
                                <Plus size={20} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                              </label>
                            </div>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-amber-500 transition-colors">
                            <ImageIcon size={32} className="mb-2" />
                            <span className="text-[10px] font-bold">UPLOAD</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                          </label>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={`
                            w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                            ${formData.includeLogo ? 'bg-amber-600 border-amber-600' : 'border-gray-600 group-hover:border-amber-500'}
                          `}>
                            {formData.includeLogo && <Save size={14} className="text-white" />}
                          </div>
                          <span className="text-sm font-bold text-gray-300">Include Logo on Invoice</span>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={formData.includeLogo}
                            onChange={(e) => setFormData({ ...formData, includeLogo: e.target.checked })}
                          />
                        </label>
                        <p className="text-[10px] text-gray-500 mt-2 italic leading-relaxed">
                          When enabled, the shop logo will be printed at the top of the voucher.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Invoice Messages</label>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          placeholder="Footer Message (e.g., Thank you for shopping)"
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          value={formData.footerMessage}
                          onChange={(e) => setFormData({ ...formData, footerMessage: e.target.value })}
                        />
                      </div>
                      <div>
                        <textarea
                          placeholder="Warranty Policy (Terms & Conditions)"
                          rows={4}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                          value={formData.warrantyPolicy}
                          onChange={(e) => setFormData({ ...formData, warrantyPolicy: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-700 bg-gray-850 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 font-bold hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-lg shadow-amber-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {selectedBranch ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchPage;
