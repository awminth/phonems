import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    X,
    Loader2,
    Upload,
    Download,
    Trash2,
    FileText,
    Building2,
    ChevronDown,
    Check,
    Search,
    FileSpreadsheet
} from 'lucide-react';
import { API_ENDPOINTS, fetcher, apiClient, getImageUrl, sessionManager } from '../../config';
import useSWR from 'swr';
import * as XLSX from 'xlsx';

interface PurchaseVoucherItem {
    id: string; // Unique ID for each item
    codeNo: string;
    itemName: string;
    qty: number;
    purchasePrice: number;
    sellPrice: number;
    categoryId: string;
    categoryName: string;
    supplierId: string;
    supplierName: string;
    image: File | null;
    imagePreview: string | null;
    imagePath: string | null; // For stored image path
    productId?: string;
    isSerialized?: boolean;
    isService?: boolean;
    imei1?: string;
    imei2?: string;
    specification?: string;
}

interface DropdownsResponse {
    success: boolean;
    categories: { id: string; name: string }[];
    suppliers: { id: string; name: string }[];
    products: { 
        id: string; 
        codeNo: string; 
        name: string; 
        sellPrice: number;
        categoryId: string;
        categoryName: string;
        supplierId: string;
        supplierName: string;
        isSerialized: boolean;
        isService?: boolean;
    }[];
}

// Searchable Dropdown Component
interface SearchableDropdownProps {
    options: { id: string, name: string }[];
    value: string;
    onChange: (id: string, name: string) => void;
    placeholder: string;
    disabled?: boolean;
    onAddClick?: () => void;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ options, value, onChange, placeholder, disabled = false, onAddClick }) => {
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
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const filteredOptions = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className={`w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 flex justify-between items-center cursor-pointer text-sm focus-within:ring-2 focus-within:ring-blue-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800">
                        <div className="flex gap-2">
                            <div className="flex items-center bg-gray-700 rounded px-2 flex-1">
                                <Search size={14} className="text-gray-400 mr-2" />
                                <input
                                    type="text"
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm py-1.5 text-white placeholder-gray-500 outline-none"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            {onAddClick && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onAddClick();
                                        setIsOpen(false);
                                    }}
                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors flex items-center justify-center"
                                    title="Add New"
                                >
                                    <Plus size={16} />
                                </button>
                            )}
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

const PURCHASE_VOUCHER_ITEMS_KEY = 'purchase_voucher_items';

const PurchaseVoucherNew: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const isEditMode = !!id;
    const [vno, setVno] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [taxPercent, setTaxPercent] = useState<number>(0);
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [isLoadingVNO, setIsLoadingVNO] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [items, setItems] = useState<PurchaseVoucherItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PurchaseVoucherItem | null>(null);
    const [formData, setFormData] = useState<Omit<PurchaseVoucherItem, 'id'>>({
        codeNo: '',
        itemName: '',
        qty: 1,
        purchasePrice: 0,
        sellPrice: 0,
        categoryId: '',
        categoryName: '',
        supplierId: '',
        supplierName: '',
        image: null,
        imagePreview: null,
        imagePath: null,
        productId: '',
        isSerialized: false,
        isService: false,
        imei1: '',
        imei2: '',
        specification: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    // SWR for dropdown options
    const { data: dropdownData, mutate: mutateDropdowns } = useSWR<DropdownsResponse>(
        API_ENDPOINTS.PURCHASE_DROPDOWNS,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

    // Quick Add Modals State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [supplierForm, setSupplierForm] = useState({ name: '', address: '', email: '', phone: '', remark: '' });
    const [isAddingSupplier, setIsAddingSupplier] = useState(false);

    // Quick Add Product State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [productForm, setProductForm] = useState({
        code: '',
        name: '',
        categoryId: '',
        supplierId: '',
        sellingPrice: 0,
        isSerialized: false,
        isService: false,
        isSparePart: false,
        minStockQty: 0
    });
    
    // Auto-fill logic for Code No
    const [isCheckingCode, setIsCheckingCode] = useState(false);
    const searchTimeout = useRef<any>(null);
    const excelInputRef = useRef<HTMLInputElement>(null);

    const checkItemByCode = async (code: string) => {
        if (!code || code.trim() === '') return;
        
        // First check in master products list (faster)
        const matchedProduct = masterProducts.find(p => p.codeNo === code);
        if (matchedProduct) {
            const isPhoneCategory = matchedProduct.categoryName?.toLowerCase().includes('phone') || 
                                   matchedProduct.categoryName?.toLowerCase().includes('mobile');
            
            setFormData(prev => ({
                ...prev,
                itemName: matchedProduct.name,
                categoryId: matchedProduct.categoryId,
                categoryName: matchedProduct.categoryName,
                sellPrice: matchedProduct.sellPrice,
                supplierId: matchedProduct.supplierId || prev.supplierId,
                supplierName: matchedProduct.supplierName || prev.supplierName,
                imagePath: null,
                imagePreview: null,
                productId: matchedProduct.id,
                isSerialized: !!matchedProduct.isSerialized || isPhoneCategory,
                imei1: '',
                imei2: '',
                qty: (matchedProduct.isSerialized || isPhoneCategory) ? 1 : prev.qty
            }));
            return;
        }

        setIsCheckingCode(true);
        try {
            const result = await apiClient.get(`${API_ENDPOINTS.POS_ITEM_BY_CODE(code)}`);
            if (result.success && result.data) {
                const item = result.data;
                const isPhoneCategory = item.categoryName?.toLowerCase().includes('phone') || 
                                       item.categoryName?.toLowerCase().includes('mobile');
                
                setFormData(prev => ({
                    ...prev,
                    itemName: item.name,
                    categoryId: item.categoryId?.toString() || '',
                    categoryName: item.categoryName || '',
                    sellPrice: item.price || 0,
                    imagePath: item.image || null,
                    imagePreview: item.image ? getImageUrl(item.image) : prev.imagePreview,
                    productId: item.id?.toString() || '',
                    isSerialized: !!item.isSerialized || isPhoneCategory,
                    qty: (item.isSerialized || isPhoneCategory) ? 1 : prev.qty,
                    imei1: '',
                    imei2: ''
                }));
            }
        } catch (error) {
            console.error('Check item error:', error);
        } finally {
            setIsCheckingCode(false);
        }
    };
    const debouncedCheckItem = (code: string) => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => {
            checkItemByCode(code);
        }, 800);
    };

    const categories = dropdownData?.categories || [];
    const suppliers = dropdownData?.suppliers || [];
    const masterProducts = dropdownData?.products || [];

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Load data on mount
    useEffect(() => {
        if (isEditMode && id) {
            loadVoucherData(id);
        } else {
            loadNextVNO();
            loadItemsFromSession();
        }
    }, [id, isEditMode]);

    // Save items to session storage whenever items change (only for new vouchers, not edit mode)
    useEffect(() => {
        if (!isEditMode && items.length > 0) {
            // Store items without File objects (File objects can't be serialized)
            // Store imagePreview as base64 string for display
            const itemsToStore = items.map(item => ({
                id: item.id,
                codeNo: item.codeNo,
                itemName: item.itemName,
                qty: item.qty,
                purchasePrice: item.purchasePrice,
                sellPrice: item.sellPrice,
                categoryId: item.categoryId,
                categoryName: item.categoryName,
                supplierId: item.supplierId,
                supplierName: item.supplierName,
                imagePreview: item.imagePreview, // Base64 string for preview
                imagePath: item.imagePath,
                isSerialized: item.isSerialized,
                isService: item.isService,
                imei1: item.imei1,
                imei2: item.imei2,
                specification: item.specification
            }));
            sessionStorage.setItem(PURCHASE_VOUCHER_ITEMS_KEY, JSON.stringify(itemsToStore));
        } else if (!isEditMode && items.length === 0) {
            sessionStorage.removeItem(PURCHASE_VOUCHER_ITEMS_KEY);
        }
    }, [items, isEditMode]);

    const loadItemsFromSession = () => {
        try {
            const stored = sessionStorage.getItem(PURCHASE_VOUCHER_ITEMS_KEY);
            if (stored) {
                const parsedItems = JSON.parse(stored);
                // Restore items (File objects will be null, but imagePreview is preserved)
                setItems(parsedItems.map((item: any) => ({
                    ...item,
                    image: null // File objects can't be restored from sessionStorage
                })));
            }
        } catch (error) {
            console.error('Error loading items from session:', error);
        }
    };

    const loadNextVNO = async () => {
        setIsLoadingVNO(true);
        try {
            const result = await apiClient.get(API_ENDPOINTS.PURCHASE_VOUCHER_NEXT_VNO);
            if (result.success && result.data) {
                setVno(result.data.vno);
            }
        } catch (error) {
            console.error('Load VNO error:', error);
        } finally {
            setIsLoadingVNO(false);
        }
    };

    const loadVoucherData = async (voucherId: string) => {
        setIsLoadingData(true);
        try {
            const result = await apiClient.get(API_ENDPOINTS.PURCHASE_VOUCHER_BY_ID(voucherId));
            if (result.success && result.data) {
                const { voucher, items: voucherItems } = result.data;
                setVno(voucher.vno);
                setSupplierId(voucher.supplierId);

                // Calculate percentages back from absolute values
                const total = voucher.totalAmount || 0;
                if (total > 0) {
                    setTaxPercent(Math.round((voucher.taxAmount * 100) / total));
                    setDiscountPercent(Math.round((voucher.discount * 100) / total));
                }
                setPaidAmount(voucher.totalPaid || voucher.paidAmount || 0);

                // Convert voucher items to PurchaseVoucherItem format
                const formattedItems: PurchaseVoucherItem[] = voucherItems.map((item: any) => ({
                    id: item.id?.toString() || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    codeNo: item.codeNo,
                    itemName: item.itemName,
                    qty: item.qty,
                    purchasePrice: item.purchasePrice,
                    sellPrice: item.sellPrice,
                    categoryId: item.categoryId?.toString() || '',
                    categoryName: item.categoryName || '',
                    supplierId: item.supplierId?.toString() || voucher.supplierId?.toString() || '',
                    supplierName: item.supplierName || voucher.supplierName || '',
                    image: null,
                    imagePreview: item.image ? getImageUrl(item.image) : null,
                    imagePath: item.image || null,
                    imei1: item.imei1 || '',
                    imei2: item.imei2 || '',
                    isSerialized: !!item.isSerialized,
                    productId: item.productId?.toString() || '',
                    specification: item.specification || ''
                }));

                setItems(formattedItems);

            } else {
                setNotification({ message: 'Failed to load voucher data', type: 'error' });
                setTimeout(() => navigate('/purchase/list'), 2000);
            }
        } catch (error) {
            console.error('Load voucher error:', error);
            setNotification({ message: 'Failed to load voucher data', type: 'error' });
            setTimeout(() => navigate('/purchase/list'), 2000);
        } finally {
            setIsLoadingData(false);
        }
    };

    // Generate random 13-digit code
    const generateRandomCode = (): string => {
        // Generate 13 random digits
        let code = '';
        for (let i = 0; i < 13; i++) {
            code += Math.floor(Math.random() * 10).toString();
        }
        return code;
    };

    const openModal = (item?: PurchaseVoucherItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                codeNo: item.codeNo,
                itemName: item.itemName,
                qty: item.qty,
                purchasePrice: item.purchasePrice,
                sellPrice: item.sellPrice,
                categoryId: item.categoryId,
                categoryName: item.categoryName,
                supplierId: item.supplierId,
                supplierName: item.supplierName,
                image: null,
                imagePreview: item.imagePreview,
                imagePath: item.imagePath,
                productId: item.productId,
                isSerialized: item.isSerialized,
                isService: item.isService || false,
                imei1: item.imei1,
                imei2: item.imei2,
                specification: item.specification || ''
            });
            setImageFile(null);
        } else {
            setEditingItem(null);
            setFormData({
                codeNo: generateRandomCode(), // Auto-generate 13-digit random code
                itemName: '',
                qty: 1,
                purchasePrice: 0,
                sellPrice: 0,
                categoryId: '',
                categoryName: '',
                supplierId: supplierId || '',
                supplierName: suppliers.find(s => s.id === supplierId)?.name || '',
                image: null,
                imagePreview: null,
                imagePath: null,
                productId: '',
                isSerialized: false,
                isService: false,
                imei1: '',
                imei2: '',
                specification: ''
            });
            setImageFile(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({
            codeNo: '',
            itemName: '',
            qty: 1,
            purchasePrice: 0,
            sellPrice: 0,
            categoryId: '',
            categoryName: '',
            supplierId: '',
            supplierName: '',
            image: null,
            imagePreview: null,
            imagePath: null,
            productId: '',
            isSerialized: false,
            isService: false,
            imei1: '',
            imei2: '',
            specification: ''
        });
        setImageFile(null);
        setDragActive(false);
    };

    const handleFile = (file: File) => {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imagePreview: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSaveItem = async (e?: React.MouseEvent) => {
        // Prevent form submission if event is provided
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Validation
        if (!formData.codeNo.trim() || !formData.itemName.trim()) {
            setNotification({ message: 'Code No and Item Name are required', type: 'error' });
            return;
        }
        if (formData.qty <= 0 || formData.purchasePrice <= 0 || formData.sellPrice <= 0) {
            setNotification({ message: 'Qty and Prices must be greater than 0', type: 'error' });
            return;
        }

        if (formData.isSerialized) {
            if (!formData.imei1 || !formData.imei1.trim()) {
                setNotification({ message: 'IMEI 1 is required for serialized items', type: 'error' });
                return;
            }
            // Check for duplicate IMEI in current items
            const duplicateImei = items.find(item => 
                item.id !== editingItem?.id && 
                (item.imei1 === formData.imei1 || (item.imei2 && item.imei2 === formData.imei1) ||
                (formData.imei2 && (item.imei1 === formData.imei2 || item.imei2 === formData.imei2)))
            );
            if (duplicateImei) {
                setNotification({ message: 'This IMEI is already in the voucher', type: 'error' });
                return;
            }
        }

        let finalImagePath = formData.imagePath || null;
        let finalImagePreview = formData.imagePreview;

        // Upload image if a new file was selected
        if (imageFile && !formData.imagePath) {
            try {
                setIsSubmitting(true);
                const uploadFormData = new FormData();
                uploadFormData.append('image', imageFile);

                const uploadResult = await apiClient.postFormData(
                    API_ENDPOINTS.PURCHASE_VOUCHER_UPLOAD_IMAGE,
                    uploadFormData
                );

                if (uploadResult.success && uploadResult.data?.imagePath) {
                    finalImagePath = uploadResult.data.imagePath;
                    finalImagePreview = formData.imagePreview; // Keep the preview
                } else {
                    setNotification({ message: 'Failed to upload image. Item saved without image.', type: 'error' });
                }
            } catch (error) {
                console.error('Image upload error:', error);
                setNotification({ message: 'Failed to upload image. Item saved without image.', type: 'error' });
            } finally {
                setIsSubmitting(false);
            }
        }

        if (editingItem) {
            // Update existing item
            setItems(items.map(item =>
                item.id === editingItem.id
                    ? {
                        ...item,
                        codeNo: formData.codeNo,
                        itemName: formData.itemName,
                        qty: formData.qty,
                        purchasePrice: formData.purchasePrice,
                        sellPrice: formData.sellPrice,
                        categoryId: formData.categoryId,
                        categoryName: formData.categoryName,
                        supplierId: formData.supplierId,
                        supplierName: formData.supplierName,
                        image: imageFile || item.image, // Keep existing file if no new one
                        imagePreview: finalImagePreview || item.imagePreview,
                        imagePath: finalImagePath || item.imagePath,
                        productId: formData.productId,
                        isSerialized: formData.isSerialized,
                        isService: formData.isService,
                        imei1: formData.imei1,
                        imei2: formData.imei2,
                        specification: formData.specification
                    }
                    : item
            ));
            setNotification({ message: 'Item updated successfully', type: 'success' });
        } else {
            // Add new item
            const newItem: PurchaseVoucherItem = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                codeNo: formData.codeNo,
                itemName: formData.itemName,
                qty: formData.qty,
                purchasePrice: formData.purchasePrice,
                sellPrice: formData.sellPrice,
                categoryId: formData.categoryId,
                categoryName: formData.categoryName,
                supplierId: formData.supplierId,
                supplierName: formData.supplierName,
                image: imageFile,
                imagePreview: finalImagePreview,
                imagePath: finalImagePath,
                productId: formData.productId,
                isSerialized: formData.isSerialized,
                isService: formData.isService,
                imei1: formData.imei1,
                imei2: formData.imei2,
                specification: formData.specification
            };
            setItems([...items, newItem]);
            setNotification({ message: 'Item added successfully', type: 'success' });
        }
        closeModal();
    };

    const handleDeleteItem = (id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            setItems(items.filter(item => item.id !== id));
            setNotification({ message: 'Item deleted successfully', type: 'success' });
        }
    };

    // Parse Excel file
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
                    const codeNoIndex = headers.findIndex((h: string) => h.includes('code') || h.includes('code no'));
                    const itemNameIndex = headers.findIndex((h: string) => h.includes('item') && h.includes('name'));
                    const qtyIndex = headers.findIndex((h: string) => h.includes('qty') || h.includes('quantity'));
                    const purchasePriceIndex = headers.findIndex((h: string) => h.includes('purchase') && h.includes('price'));
                    const sellPriceIndex = headers.findIndex((h: string) => h.includes('sell') && h.includes('price'));
                    const categoryIndex = headers.findIndex((h: string) => h.includes('category'));
                    const supplierIndex = headers.findIndex((h: string) => h.includes('supplier'));
                    const imei1Index = headers.findIndex((h: string) => h.includes('imei1') || h.includes('imei 1'));
                    const imei2Index = headers.findIndex((h: string) => h.includes('imei2') || h.includes('imei 2'));
                    const specIndex = headers.findIndex((h: string) => h.includes('spec') || h.includes('specification'));

                    if (codeNoIndex === -1 || itemNameIndex === -1) {
                        reject(new Error('Excel file must have "Code No" and "Item Name" columns'));
                        return;
                    }

                    // Parse data rows
                    const parsedData: any[] = [];
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        const codeNo = row[codeNoIndex] ? String(row[codeNoIndex]).trim() : '';
                        const itemName = row[itemNameIndex] ? String(row[itemNameIndex]).trim() : '';

                        if (!codeNo || !itemName) continue; // Skip empty rows

                        parsedData.push({
                            codeNo: codeNo || generateRandomCode(),
                            itemName: itemName,
                            qty: qtyIndex !== -1 ? parseFloat(String(row[qtyIndex] || '1').trim()) : 1,
                            purchasePrice: purchasePriceIndex !== -1 ? parseFloat(String(row[purchasePriceIndex] || '0').trim()) : 0,
                            sellPrice: sellPriceIndex !== -1 ? parseFloat(String(row[sellPriceIndex] || '0').trim()) : 0,
                            categoryName: categoryIndex !== -1 ? String(row[categoryIndex] || '').trim() : '',
                            supplierName: supplierIndex !== -1 ? String(row[supplierIndex] || '').trim() : '',
                            imei1: imei1Index !== -1 ? String(row[imei1Index] || '').trim() : '',
                            imei2: imei2Index !== -1 ? String(row[imei2Index] || '').trim() : '',
                            specification: specIndex !== -1 ? String(row[specIndex] || '').trim() : ''
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

    const handleDownloadTemplate = () => {
        const headers = [
            "Code No", 
            "Item Name", 
            "Qty",
            "Purchase Price",
            "Sell Price",
            "Category", 
            "Supplier",
            "IMEI 1",
            "IMEI 2",
            "Specification"
        ];
        
        const sampleRows = [
            ["IP15P-128", "iPhone 15 Pro 128GB", 1, 3500000, 3800000, categories[0]?.name || "Phones", suppliers[0]?.name || "Apple", "351234567890123", "351234567890124", "A17 Pro, 8GB RAM, 128GB Storage, Blue Titanium"],
            ["CH-20W", "20W USB-C Power Adapter", 5, 45000, 55000, categories[1]?.name || "Accessories", suppliers[1]?.name || "Apple", "", "", "White Color, Fast Charger"]
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
        XLSX.utils.book_append_sheet(wb, wsImport, "Voucher Items Template");

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

        XLSX.writeFile(wb, "purchase_voucher_items_template.xlsx");
    };

    const handleImportExcelClick = () => {
        if (excelInputRef.current) {
            excelInputRef.current.click();
        }
    };

    // Handle Excel import
    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input
        e.target.value = '';

        if (!file.name.match(/\.(xls|xlsx|csv|tsv)$/i)) {
            setNotification({ message: 'Please select a valid Excel file (.xls, .xlsx, .csv, .tsv)', type: 'error' });
            return;
        }

        setIsImporting(true);
        try {
            const parsedData = await parseExcelFile(file);

            if (parsedData.length === 0) {
                setNotification({ message: 'No valid data found in Excel file', type: 'error' });
                setIsImporting(false);
                return;
            }

            // Map parsed data to PurchaseVoucherItem format
            const newItems: PurchaseVoucherItem[] = parsedData.map((row) => {
                // Find category by name
                let categoryId = '';
                let categoryName = '';
                if (row.categoryName) {
                    const category = categories.find(c =>
                        c.name.toLowerCase() === row.categoryName.toLowerCase()
                    );
                    if (category) {
                        categoryId = category.id;
                        categoryName = category.name;
                    } else {
                        categoryName = row.categoryName;
                    }
                }

                // Check if serialized based on IMEI or Category Name
                const isPhoneCategory = categoryName.toLowerCase().includes('phone') || 
                                       categoryName.toLowerCase().includes('mobile');
                const isSerialized = !!row.imei1 || isPhoneCategory;

                // Find supplier by name
                let itemSupplierId = supplierId || '';
                let itemSupplierName = '';
                if (row.supplierName) {
                    const supplier = suppliers.find(s =>
                        s.name.toLowerCase() === row.supplierName.toLowerCase()
                    );
                    if (supplier) {
                        itemSupplierId = supplier.id;
                        itemSupplierName = supplier.name;
                    } else {
                        itemSupplierName = row.supplierName;
                    }
                } else if (supplierId) {
                    const supplier = suppliers.find(s => s.id === supplierId);
                    itemSupplierName = supplier?.name || '';
                }

                return {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    codeNo: row.codeNo,
                    itemName: row.itemName,
                    qty: isSerialized ? 1 : (row.qty || 1),
                    purchasePrice: row.purchasePrice || 0,
                    sellPrice: row.sellPrice || 0,
                    categoryId: categoryId,
                    categoryName: categoryName,
                    supplierId: itemSupplierId,
                    supplierName: itemSupplierName,
                    image: null,
                    imagePreview: null,
                    imagePath: null,
                    isSerialized: isSerialized,
                    isService: false,
                    imei1: row.imei1 || '',
                    imei2: row.imei2 || '',
                    specification: row.specification || ''
                };
            });

            // Validate imported items
            const validItems = newItems.filter(item => {
                if (!item.codeNo.trim() || !item.itemName.trim()) {
                    return false;
                }
                if (item.qty <= 0 || item.purchasePrice <= 0 || item.sellPrice <= 0) {
                    return false;
                }
                return true;
            });

            if (validItems.length === 0) {
                setNotification({ message: 'No valid items found. Please check your Excel file format.', type: 'error' });
                setIsImporting(false);
                return;
            }

            // Add imported items to existing items
            setItems([...items, ...validItems]);
            setNotification({
                message: `Successfully imported ${validItems.length} item(s) from Excel`,
                type: 'success'
            });

            // Show warning if some items were skipped
            if (validItems.length < newItems.length) {
                setTimeout(() => {
                    setNotification({
                        message: `${newItems.length - validItems.length} item(s) were skipped due to invalid data`,
                        type: 'info'
                    });
                }, 3500);
            }
        } catch (error: any) {
            console.error('Import Excel error:', error);
            setNotification({
                message: error.message || 'Failed to import Excel file. Please check the file format.',
                type: 'error'
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleQuickAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setIsAddingCategory(true);
        try {
            const result = await apiClient.post(API_ENDPOINTS.CATEGORIES, { name: newCategoryName });
            if (result.success) {
                setNotification({ message: 'Category added successfully!', type: 'success' });
                await mutateDropdowns();
                setFormData(prev => ({ ...prev, categoryId: result.data.id, categoryName: result.data.name }));
                setNewCategoryName('');
                setIsCategoryModalOpen(false);
            } else {
                setNotification({ message: result.message || 'Failed to add category', type: 'error' });
            }
        } catch (error) {
            setNotification({ message: 'Error adding category', type: 'error' });
        } finally {
            setIsAddingCategory(false);
        }
    };

    const handleQuickAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierForm.name.trim()) return;

        setIsAddingSupplier(true);
        try {
            const result = await apiClient.post(API_ENDPOINTS.SUPPLIERS, supplierForm);
            if (result.success) {
                setNotification({ message: 'Supplier added successfully!', type: 'success' });
                await mutateDropdowns();
                
                // If we are in the main voucher supplier selection
                setSupplierId(result.data.id);
                
                // If we are in the item modal supplier selection
                setFormData(prev => ({ ...prev, supplierId: result.data.id, supplierName: result.data.name }));
                
                setSupplierForm({ name: '', address: '', email: '', phone: '', remark: '' });
                setIsSupplierModalOpen(false);
            } else {
                setNotification({ message: result.message || 'Failed to add supplier', type: 'error' });
            }
        } catch (error) {
            setNotification({ message: 'Error adding supplier', type: 'error' });
        } finally {
            setIsAddingSupplier(false);
        }
    };

    const handleQuickAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productForm.name.trim() || !productForm.code.trim()) {
            setNotification({ message: 'Code and Name are required', type: 'error' });
            return;
        }

        setIsAddingProduct(true);
        try {
            const result = await apiClient.post(API_ENDPOINTS.PRODUCTS, productForm);
            if (result.success) {
                setNotification({ message: 'Product added successfully!', type: 'success' });
                await mutateDropdowns();
                
                // Auto-select the newly added product in the item modal
                const p = result.data;
                const isPhoneCategory = p.categoryName?.toLowerCase().includes('phone') || 
                                       p.categoryName?.toLowerCase().includes('mobile');

                setFormData(prev => ({
                    ...prev,
                    codeNo: p.code,
                    itemName: p.name,
                    sellPrice: p.sellingPrice,
                    categoryId: p.categoryId,
                    categoryName: p.categoryName,
                    supplierId: p.supplierId || prev.supplierId,
                    supplierName: p.supplierName || prev.supplierName,
                    productId: p.id,
                    isSerialized: !!p.isSerialized || isPhoneCategory,
                    isService: !!p.isService,
                    qty: (p.isSerialized || isPhoneCategory) ? 1 : prev.qty,
                    imei1: '',
                    imei2: ''
                }));
                
                setIsProductModalOpen(false);
                setProductForm({ 
                    code: '', 
                    name: '', 
                    categoryId: '', 
                    supplierId: '', 
                    sellingPrice: 0, 
                    isSerialized: false,
                    isService: false,
                    isSparePart: false,
                    minStockQty: 0
                });
            } else {
                setNotification({ message: result.message || 'Failed to add product', type: 'error' });
            }
        } catch (error) {
            setNotification({ message: 'Error adding product', type: 'error' });
        } finally {
            setIsAddingProduct(false);
        }
    };

    const calculateTotal = () => {
        const total = items.reduce((sum, item) => sum + (item.qty * item.purchasePrice), 0);
        const taxAmount = (total * taxPercent) / 100;
        const discountAmount = (total * discountPercent) / 100;
        const netAmount = total + taxAmount - discountAmount;
        const balanceAmount = netAmount - paidAmount;
        return { total, netAmount, balanceAmount, taxAmount, discountAmount };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Prevent accidental submission
        if (isSubmitting) {
            return;
        }

        if (!vno.trim()) {
            setNotification({ message: 'VNO is required', type: 'error' });
            return;
        }

        if (!supplierId) {
            setNotification({ message: 'Please select a supplier', type: 'error' });
            return;
        }

        if (items.length === 0) {
            setNotification({ message: 'Please add at least one item', type: 'error' });
            return;
        }

        // Validate items
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.codeNo.trim() || !item.itemName.trim()) {
                setNotification({ message: `Item ${i + 1}: Code and Name are required`, type: 'error' });
                return;
            }
            if (item.qty <= 0 || item.purchasePrice <= 0 || item.sellPrice <= 0) {
                setNotification({ message: `Item ${i + 1}: Qty and Prices must be greater than 0`, type: 'error' });
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const userId = sessionManager.getUserId();
            if (!userId) {
                setNotification({ message: 'User session expired. Please login again.', type: 'error' });
                setTimeout(() => navigate('/'), 2000);
                return;
            }

            // Upload images first, then prepare items data
            const itemsData = await Promise.all(items.map(async (item, index) => {
                let imagePath = item.imagePath || null;

                // If item has a File object but no path, upload it
                if (item.image && !item.imagePath) {
                    try {
                        const formData = new FormData();
                        formData.append('image', item.image);

                        // Upload image using dedicated upload endpoint
                        const uploadResult = await apiClient.postFormData(
                            API_ENDPOINTS.PURCHASE_VOUCHER_UPLOAD_IMAGE,
                            formData
                        );

                        // Extract image path from response
                        if (uploadResult.success && uploadResult.data?.imagePath) {
                            imagePath = uploadResult.data.imagePath;
                        }
                    } catch (error) {
                        console.error(`Error uploading image for item ${index + 1}:`, error);
                        setNotification({
                            message: `Failed to upload image for item ${index + 1}. Continuing without image.`,
                            type: 'error'
                        });
                        // Continue without image if upload fails
                    }
                }

                return {
                    codeNo: item.codeNo,
                    itemName: item.itemName,
                    qty: item.qty,
                    purchasePrice: item.purchasePrice,
                    sellPrice: item.sellPrice,
                    categoryId: item.categoryId || null,
                    image: imagePath, // Image path or null
                    productId: item.productId || null,
                    isSerialized: item.isSerialized || false,
                    isService: item.isService || false,
                    imagePath: item.imagePath || null,
                    imei1: item.imei1,
                    imei2: item.imei2,
                    specification: item.specification || null
                };
            }));

            const { total, netAmount, balanceAmount, taxAmount, discountAmount } = calculateTotal();

            const payload = {
                vno: vno.trim(),
                supplierId,
                items: itemsData,
                userId,
                taxAmount,
                discount: discountAmount,
                paidAmount: paidAmount,
                totalAmount: total,
                netAmount: netAmount,
                balanceAmount: balanceAmount,
                status: balanceAmount <= 0 ? 'Paid' : 'Unpaid'
            };

            let result;
            if (isEditMode && id) {
                result = await apiClient.put(API_ENDPOINTS.PURCHASE_VOUCHER_BY_ID(id), payload);
            } else {
                result = await apiClient.post(API_ENDPOINTS.PURCHASE_VOUCHERS, payload);
            }

            if (result.success) {
                // Clear session storage
                sessionStorage.removeItem(PURCHASE_VOUCHER_ITEMS_KEY);
                setNotification({
                    message: isEditMode
                        ? 'Purchase voucher updated successfully!'
                        : 'Purchase voucher created successfully!',
                    type: 'success'
                });
                setTimeout(() => navigate('/purchase/list'), 1500);
            } else {
                setNotification({
                    message: result.message || (isEditMode ? 'Failed to update purchase voucher' : 'Failed to create purchase voucher'),
                    type: 'error'
                });
            }
        } catch (error: any) {
            console.error('Submit error:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred. Please try again.';
            setNotification({ message: errorMessage, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                    <p className="text-gray-400">Loading voucher data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
            {/* Toast Notification */}
            {notification && (
                <div className={`fixed top-16 sm:top-20 right-2 sm:right-4 left-2 sm:left-auto z-[200] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-lg text-white text-sm sm:text-base font-medium flex items-center animate-in slide-in-from-right duration-300 max-w-sm sm:max-w-none ${notification.type === 'success' ? 'bg-green-600' :
                        notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                    <span className="break-words">{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <header className="bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-700 sticky top-0 z-50">
                <button
                    onClick={() => navigate('/purchase/list')}
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">{isEditMode ? 'Edit Purchase Voucher' : 'New Purchase Voucher'}</h1>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
                    {/* VNO and Supplier */}
                    <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Voucher Number (VNO)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={vno}
                                        onChange={(e) => setVno(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                            }
                                        }}
                                        className="flex-1 bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        disabled={isLoadingVNO || isSubmitting || isEditMode}
                                    />
                                    <button
                                        type="button"
                                        onClick={loadNextVNO}
                                        disabled={isLoadingVNO || isSubmitting}
                                        className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isLoadingVNO ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Supplier</label>
                                <SearchableDropdown
                                    options={suppliers}
                                    value={supplierId}
                                    onChange={(id, name) => setSupplierId(id)}
                                    placeholder="Select Supplier"
                                    disabled={isSubmitting || isEditMode}
                                    onAddClick={() => setIsSupplierModalOpen(true)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Items ({items.length})</h2>
                            <div className="flex gap-2">
                                <input 
                                    type="file" 
                                    ref={excelInputRef} 
                                    onChange={handleImportExcel} 
                                    className="hidden" 
                                    accept=".xlsx,.xls,.csv" 
                                />
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-650 text-white border border-gray-600 px-4 py-2 rounded-lg font-medium transition-colors active:scale-95 text-sm"
                                >
                                    <Download size={18} /> Template
                                </button>
                                <button
                                    type="button"
                                    onClick={handleImportExcelClick}
                                    disabled={isSubmitting || !supplierId || isImporting}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 active:scale-95 text-sm"
                                >
                                    {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />} Import Excel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openModal()}
                                    disabled={isSubmitting || !supplierId}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 active:scale-95 text-sm"
                                >
                                    <Plus size={18} /> Add Item
                                </button>
                            </div>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>No items added. Click "Add Item" to start.</p>
                                {!supplierId && (
                                    <p className="text-sm text-yellow-400 mt-2">Please select a supplier first</p>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                                <th className="p-4 w-16">Image</th>
                                                <th className="p-4">Code</th>
                                                <th className="p-4">Item Name</th>
                                                <th className="p-4">IMEI</th>
                                                <th className="p-4">Specification</th>
                                                <th className="p-4 text-center">Qty</th>
                                                <th className="p-4 text-right">Purchase Price</th>
                                                <th className="p-4 text-right">Sell Price</th>
                                                <th className="p-4">Category</th>
                                                <th className="p-4 text-right">Subtotal</th>
                                                <th className="p-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {items.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                                    <td className="p-4">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden border border-gray-600">
                                                            {item.imagePreview ? (
                                                                <img
                                                                    src={item.imagePreview}
                                                                    alt={item.itemName}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                                    <FileText size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-medium text-gray-300">{item.codeNo}</td>
                                                    <td className="p-4 text-sm font-medium text-white">
                                                        <div>{item.itemName}</div>
                                                        {item.isService ? (
                                                            <div className="text-[10px] text-purple-400 font-mono mt-0.5">SERVICE</div>
                                                        ) : item.isSerialized ? (
                                                            <div className="text-[10px] text-blue-400 font-mono mt-0.5">SERIALIZED</div>
                                                        ) : null}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-400 font-mono">
                                                        {item.isSerialized ? (
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-[9px] text-gray-500 w-8">IMEI 1:</span>
                                                                    <span className="text-blue-300">{item.imei1 || '-'}</span>
                                                                </div>
                                                                {item.imei2 && (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-[9px] text-gray-500 w-8">IMEI 2:</span>
                                                                        <span className="text-blue-300">{item.imei2}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-600">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-300 font-medium">
                                                        {item.isSerialized ? (item.specification || '-') : '-'}
                                                    </td>
                                                    <td className="p-4 text-sm text-center">
                                                        <span className="bg-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-bold">{item.qty}</span>
                                                    </td>
                                                    <td className="p-4 text-sm text-right text-emerald-400">{item.purchasePrice?.toLocaleString()}</td>
                                                    <td className="p-4 text-sm text-right text-blue-400">{item.sellPrice?.toLocaleString()}</td>
                                                    <td className="p-4 text-sm text-gray-400">{item.categoryName || '-'}</td>
                                                    <td className="p-4 text-sm text-right text-emerald-400 font-medium">
                                                        {(item.qty * item.purchasePrice).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    openModal(item);
                                                                }}
                                                                disabled={isSubmitting}
                                                                className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition-colors disabled:opacity-50"
                                                                title="Edit"
                                                            >
                                                                <FileText size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                disabled={isSubmitting}
                                                                className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Total Summary */}
                    <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 shadow-lg space-y-4">
                        <div className="flex justify-between items-center text-gray-400">
                            <span>Sub Total:</span>
                            <span className="font-medium">{calculateTotal().total.toLocaleString()} MMK</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Tax (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={taxPercent}
                                        onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Discount (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={discountPercent}
                                        onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Paid Amount</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-blue-900/10 border border-blue-900/30 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold"
                                        placeholder="0"
                                        disabled={isEditMode}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">MMK</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-800">
                                <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Total Amount</span>
                                <span className="text-lg font-semibold text-white">{calculateTotal().total.toLocaleString()}</span>
                            </div>
                            <div className="bg-red-900/20 p-3 rounded-lg border border-red-900/30">
                                <span className="block text-xs text-red-400 uppercase tracking-wider mb-1">Tax ({taxPercent}%)</span>
                                <span className="text-lg font-semibold text-red-400">{calculateTotal().taxAmount.toLocaleString()}</span>
                            </div>
                            <div className="bg-green-900/20 p-3 rounded-lg border border-green-900/30">
                                <span className="block text-xs text-green-400 uppercase tracking-wider mb-1">Discount ({discountPercent}%)</span>
                                <span className="text-lg font-semibold text-green-400">{calculateTotal().discountAmount.toLocaleString()}</span>
                            </div>
                            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-900/30">
                                <span className="block text-xs text-blue-400 uppercase tracking-wider mb-1">Net Amount</span>
                                <span className="text-lg font-bold text-blue-400">{calculateTotal().netAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/purchase/list')}
                            disabled={isSubmitting}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || items.length === 0}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <FileText size={18} />
                                    {isEditMode ? 'Update Voucher' : 'Create Voucher'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Add/Edit Item Modal - Outside form to prevent auto-submit */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            closeModal();
                        }
                    }}
                >
                    <div className="bg-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200 my-8">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white">
                                {editingItem ? 'Edit Item' : 'Add New Item'}
                            </h2>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    closeModal();
                                }}
                                className="text-gray-400 hover:text-white transition-colors"
                                disabled={isSubmitting}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 bg-blue-900/20 border border-blue-800/50 p-4 rounded-xl">
                                <label className="block text-sm font-bold text-blue-300 mb-2">Select Master Product (Optional)</label>
                                <SearchableDropdown
                                    options={masterProducts.map(p => ({ id: p.id, name: `${p.name} (${p.codeNo})` }))}
                                    value=""
                                    onChange={(id) => {
                                        const p = masterProducts.find(prod => prod.id === id) as any;
                                        if (p) {
                                            setFormData(prev => ({
                                                ...prev,
                                                codeNo: p.codeNo,
                                                itemName: p.name,
                                                sellPrice: p.sellPrice,
                                                categoryId: p.categoryId,
                                                categoryName: p.categoryName,
                                                supplierId: p.supplierId || prev.supplierId,
                                                supplierName: p.supplierName || prev.supplierName,
                                                productId: p.id,
                                                isSerialized: p.isSerialized,
                                                isService: p.isService || false,
                                                qty: p.isSerialized ? 1 : prev.qty,
                                                imei1: '',
                                                imei2: ''
                                            }));
                                        }
                                    }}
                                    placeholder="Search by name or scan code..."
                                    onAddClick={() => {
                                        setProductForm(prev => ({
                                            ...prev,
                                            code: generateRandomCode(),
                                            supplierId: formData.supplierId || supplierId || ''
                                        }));
                                        setIsProductModalOpen(true);
                                    }}
                                />
                                <p className="text-[10px] text-gray-500 mt-2">Selecting a master product will auto-fill the details below.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Code No</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                value={formData.codeNo}
                                                onChange={(e) => {
                                                    const code = e.target.value;
                                                    setFormData({ ...formData, codeNo: code });
                                                    if (code.length >= 3) { // Trigger search if code is at least 3 chars
                                                        debouncedCheckItem(code);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    if (formData.codeNo) {
                                                        checkItemByCode(formData.codeNo);
                                                    }
                                                }}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                                                disabled={isSubmitting}
                                            />
                                            {isCheckingCode && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="animate-spin text-blue-500" size={16} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-end mb-1">
                                            <label className="block text-sm font-medium text-gray-400">Item Name</label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Is Phone? (Requires IMEI)</span>
                                                <div className="relative">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formData.isSerialized} 
                                                        onChange={(e) => {
                                                            const isSerialized = e.target.checked;
                                                            setFormData({
                                                                ...formData, 
                                                                isSerialized, 
                                                                qty: isSerialized ? 1 : formData.qty,
                                                                imei1: '',
                                                                imei2: ''
                                                            });
                                                        }} 
                                                        className="sr-only peer"
                                                        disabled={isSubmitting}
                                                    />
                                                    <div className={`w-9 h-5 rounded-full transition-colors border ${formData.isSerialized ? 'bg-blue-600 border-blue-500' : 'bg-gray-700 border-gray-600'} peer`}></div>
                                                    <div className={`absolute left-[2px] top-[2px] w-4 h-4 bg-white rounded-full transition-transform ${formData.isSerialized ? 'translate-x-4' : ''}`}></div>
                                                </div>
                                            </label>
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={formData.itemName}
                                            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    {formData.isSerialized && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-1">IMEI 1 (Required)</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.imei1 || ''}
                                                        onChange={(e) => setFormData({ ...formData, imei1: e.target.value })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                        disabled={isSubmitting}
                                                        placeholder="Enter first IMEI"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-1">IMEI 2 (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={formData.imei2 || ''}
                                                        onChange={(e) => setFormData({ ...formData, imei2: e.target.value })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                        disabled={isSubmitting}
                                                        placeholder="Enter second IMEI"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Specification (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={formData.specification || ''}
                                                    onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                    disabled={isSubmitting}
                                                    placeholder="e.g. 8GB/256GB Black"
                                                />
                                            </div>
                                        </>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Qty</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={formData.qty}
                                                onChange={(e) => setFormData({ ...formData, qty: Number(e.target.value) })}
                                                className={`w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none ${formData.isSerialized ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={isSubmitting || formData.isSerialized}
                                                readOnly={formData.isSerialized}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={new Date().toISOString().split('T')[0]}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                disabled={true}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Purchase Price</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                step="0.01"
                                                value={formData.purchasePrice}
                                                onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Sell Price</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                step="0.01"
                                                value={formData.sellPrice}
                                                onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
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
                                            onChange={(id, name) => setFormData({ ...formData, categoryId: id, categoryName: name })}
                                            placeholder="Select Category"
                                            disabled={isSubmitting}
                                            onAddClick={() => setIsCategoryModalOpen(true)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Supplier</label>
                                        <SearchableDropdown
                                            options={suppliers}
                                            value={formData.supplierId || supplierId}
                                            onChange={(id, name) => {
                                                setFormData({ ...formData, supplierId: id, supplierName: name });
                                                if (!supplierId) {
                                                    setSupplierId(id);
                                                }
                                            }}
                                            placeholder="Select Supplier"
                                            disabled={isSubmitting || !!supplierId}
                                            onAddClick={() => setIsSupplierModalOpen(true)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Item Image</label>
                                        <div
                                            className={`
                                                border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                                                ${dragActive ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'}
                                                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                            onDragEnter={(e) => { e.preventDefault(); if (!isSubmitting) setDragActive(true); }}
                                            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                                            onDragOver={(e) => { e.preventDefault(); if (!isSubmitting) setDragActive(true); }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setDragActive(false);
                                                if (e.dataTransfer.files[0] && !isSubmitting) handleFile(e.dataTransfer.files[0]);
                                            }}
                                            onClick={() => !isSubmitting && document.getElementById('modal-file-upload')?.click()}
                                        >
                                            <input
                                                id="modal-file-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => e.target.files && !isSubmitting && handleFile(e.target.files[0])}
                                                disabled={isSubmitting}
                                            />
                                            {formData.imagePreview ? (
                                                <div className="relative group w-full h-32">
                                                    <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
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
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        closeModal();
                                    }}
                                    className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSaveItem(e);
                                    }}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                                    {editingItem ? 'Update Item' : 'Save Item'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Quick Add Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus size={20} className="text-blue-500" /> New Category
                            </h2>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleQuickAddCategory} className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Category Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter category name"
                                    disabled={isAddingCategory}
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                                    disabled={isAddingCategory}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50"
                                    disabled={isAddingCategory}
                                >
                                    {isAddingCategory && <Loader2 className="animate-spin" size={18} />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Add Supplier Modal */}
            {isSupplierModalOpen && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 my-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Building2 size={20} className="text-blue-500" /> New Supplier
                            </h2>
                            <button onClick={() => setIsSupplierModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleQuickAddSupplier} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Supplier Name</label>
                                <input
                                    type="text"
                                    required
                                    value={supplierForm.name}
                                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter name"
                                    disabled={isAddingSupplier}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={supplierForm.phone}
                                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter phone number"
                                    disabled={isAddingSupplier}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={supplierForm.email}
                                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter email address"
                                    disabled={isAddingSupplier}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                                <textarea
                                    value={supplierForm.address}
                                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                                    placeholder="Enter address"
                                    disabled={isAddingSupplier}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Remark</label>
                                <input
                                    type="text"
                                    value={supplierForm.remark}
                                    onChange={(e) => setSupplierForm({ ...supplierForm, remark: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Any notes?"
                                    disabled={isAddingSupplier}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsSupplierModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                                    disabled={isAddingSupplier}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50"
                                    disabled={isAddingSupplier}
                                >
                                    {isAddingSupplier && <Loader2 className="animate-spin" size={18} />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Add Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700 my-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus size={20} className="text-blue-500" /> Add New Product
                            </h2>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleQuickAddProduct} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Code No (SKU)</label>
                                    <input
                                        type="text"
                                        required
                                        value={productForm.code}
                                        onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. IP15-001"
                                        disabled={isAddingProduct}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Product Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={productForm.name}
                                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. iPhone 15 Pro"
                                        disabled={isAddingProduct}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Category</label>
                                    <select
                                        value={productForm.categoryId}
                                        onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                        disabled={isAddingProduct}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Brand (Supplier)</label>
                                    <select
                                        value={productForm.supplierId}
                                        onChange={(e) => setProductForm({ ...productForm, supplierId: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                        disabled={isAddingProduct}
                                    >
                                        <option value="">Select Brand</option>
                                        {suppliers.map(sup => (
                                            <option key={sup.id} value={sup.id}>{sup.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Selling Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-sm">$</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={productForm.sellingPrice}
                                            onChange={(e) => setProductForm({ ...productForm, sellingPrice: Number(e.target.value) })}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 pl-7 pr-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                            placeholder="0"
                                            disabled={isAddingProduct}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Min Stock Limit</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={productForm.minStockQty}
                                        onChange={(e) => setProductForm({ ...productForm, minStockQty: Number(e.target.value) })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        placeholder="0"
                                        disabled={isAddingProduct}
                                    />
                                </div>
                            </div>

                             <div className="grid grid-cols-3 gap-4 bg-gray-900/50 border border-gray-700 p-2.5 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={productForm.isSerialized} 
                                            onChange={(e) => setProductForm({ ...productForm, isSerialized: e.target.checked, isService: e.target.checked ? false : productForm.isService, isSparePart: e.target.checked ? false : productForm.isSparePart })} 
                                            className="sr-only peer"
                                            disabled={isAddingProduct}
                                        />
                                        <div className={`w-9 h-5 rounded-full transition-colors border ${productForm.isSerialized ? 'bg-blue-600 border-blue-500' : 'bg-gray-700 border-gray-600'} peer`}></div>
                                        <div className={`absolute left-[2px] top-[2px] w-4 h-4 bg-white rounded-full transition-transform ${productForm.isSerialized ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-300">Serialized</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={productForm.isService} 
                                            onChange={(e) => setProductForm({ ...productForm, isService: e.target.checked, isSerialized: e.target.checked ? false : productForm.isSerialized, isSparePart: e.target.checked ? false : productForm.isSparePart })} 
                                            className="sr-only peer"
                                            disabled={isAddingProduct}
                                        />
                                        <div className={`w-9 h-5 rounded-full transition-colors border ${productForm.isService ? 'bg-purple-600 border-purple-500' : 'bg-gray-700 border-gray-600'} peer`}></div>
                                        <div className={`absolute left-[2px] top-[2px] w-4 h-4 bg-white rounded-full transition-transform ${productForm.isService ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-300">Service</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={productForm.isSparePart} 
                                            onChange={(e) => setProductForm({ ...productForm, isSparePart: e.target.checked, isSerialized: e.target.checked ? false : productForm.isSerialized, isService: e.target.checked ? false : productForm.isService })} 
                                            className="sr-only peer"
                                            disabled={isAddingProduct}
                                        />
                                        <div className={`w-9 h-5 rounded-full transition-colors border ${productForm.isSparePart ? 'bg-amber-600 border-amber-500' : 'bg-gray-700 border-gray-600'} peer`}></div>
                                        <div className={`absolute left-[2px] top-[2px] w-4 h-4 bg-white rounded-full transition-transform ${productForm.isSparePart ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-300">Spare Part</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                                    disabled={isAddingProduct}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg shadow-blue-900/30 flex items-center gap-2 disabled:opacity-50"
                                    disabled={isAddingProduct}
                                >
                                    {isAddingProduct && <Loader2 className="animate-spin" size={18} />}
                                    Save Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseVoucherNew;

