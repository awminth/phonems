import React, { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import {
    Trash2,
    Plus,
    Minus,
    Search,
    CreditCard,
    RotateCcw,
    Printer,
    LayoutGrid,
    ShoppingBag,
    BellOff,
    X,
    CheckCircle,
    FileCheck,
    AlertCircle,
    Clock,
    ArrowRightCircle,
    Loader2,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    Package,
    Banknote,
    Wallet,
    User,
    Percent,
    Receipt,
    Smartphone,
    Settings,
    HelpCircle,
    Cpu
} from 'lucide-react';
import { Category } from '../../types';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, getImageUrl, apiClient, sessionManager } from '../../config';
import Voucher from '../../components/Voucher';

// Customer interface
interface Customer {
    id: string;
    name: string;
    phone: string;
}

// Interfaces
interface POSItem {
    id: string;
    code: string;
    name: string;
    price: number;
    stock: number;
    categoryId: string;
    categoryName: string;
    image: string | null;
    imageUrl: string | null;
    isSerialized?: number;
    isService?: boolean;
}

interface CartItem extends POSItem {
    qty: number;
    remainId: string;
    userId: string;
    date: string;
    vno: string;
    imei?: string;
    imei2?: string;
    stock_id?: string;
    specification?: string;
}

interface HeldOrder {
    id: number;
    timestamp: Date;
    items: CartItem[];
    totalAmount: number;
    totalQty: number;
}

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
    fromCache: boolean;
}

interface ItemsResponse {
    success: boolean;
    data: POSItem[];
    pagination: PaginationInfo;
    fromCache: boolean;
}

interface CustomersDropdownResponse {
    success: boolean;
    data: Customer[];
    fromCache: boolean;
}

// Default image path
const DEFAULT_IMAGE = '/assets/icon.jpg';

// Cart storage key
const CART_STORAGE_KEY = 'pos_cart_items';
const VNO_COUNTER_KEY = 'pos_vno_counter';

// Generate VNO (Fallback)
const generateVNO = (): string => {
    return '0000001';
};

// Get today's date in YYYY-MM-DD format
const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Save cart to session
const saveCartToSession = (cart: CartItem[]) => {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
};

// Load cart from session
const loadCartFromSession = (): CartItem[] => {
    const saved = sessionStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return [];
        }
    }
    return [];
};

const POS: React.FC = () => {
    const [cart, setCart] = useState<CartItem[]>(() => loadCartFromSession());
    const [searchQuery, setSearchQuery] = useState('');
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = React.useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'selection' | 'bill'>('selection');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [page, setPage] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [limit] = useState(20);
    const [saleType, setSaleType] = useState<'cash' | 'credit'>('cash'); // Keeps track of Cash vs Credit logic (Paid vs Unpaid)
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'KPay' | 'WavePay' | 'Credit'>('Cash'); // Specific method
    const [currentVNO, setCurrentVNO] = useState<string>('0000001');
    const [posViewMode, setPosViewMode] = useState<'phones' | 'products' | 'services' | 'spare'>('phones');
    const [saleDate, setSaleDate] = useState<string>(() => getTodayDateString());

    // Refs
    const tenderedInputRef = React.useRef<HTMLInputElement>(null);
    const barcodeInputRef = React.useRef<HTMLInputElement>(null);

    // Barcode Scanner State
    const [barcodeMode, setBarcodeMode] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState('');

    // Handle barcode input debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            const trimmedCode = barcodeInput.trim();
            if ([9, 10, 13].includes(trimmedCode.length)) {
                handleBarcodeInput(trimmedCode);
            }
        }, 300); // 300ms debounce to wait for scanner to finish

        return () => {
            clearTimeout(handler);
        };
    }, [barcodeInput]);

    // Auto-focus barcode input when mode is enabled
    useEffect(() => {
        if (barcodeMode && barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, [barcodeMode]);

    // Held / Silent Orders State
    const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
    const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);

    // Modal States
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [isImeiModalOpen, setIsImeiModalOpen] = useState(false);
    const [selectedProductForImei, setSelectedProductForImei] = useState<POSItem | null>(null);
    const [availableImeis, setAvailableImeis] = useState<any[]>([]);
    const [imeiSearchQuery, setImeiSearchQuery] = useState('');
    const [serviceForm, setServiceForm] = useState({ name: '', price: '' });

    // Payment Logic States
    const [tenderedAmount, setTenderedAmount] = useState<string>('');
    const [changeAmount, setChangeAmount] = useState<number>(0);
    const [lastOrder, setLastOrder] = useState<CartItem[]>([]);
    const [lastOrderTotal, setLastOrderTotal] = useState(0);

    // Customer & Discount/Tax States
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
    const [discountValue, setDiscountValue] = useState<string>('');
    const [taxType, setTaxType] = useState<'percent' | 'amount'>('percent');
    const [taxValue, setTaxValue] = useState<string>('');
    const [otherType, setOtherType] = useState<'percent' | 'amount'>('percent');
    const [otherValue, setOtherValue] = useState<string>('');
    const [lastCustomerName, setLastCustomerName] = useState<string>('');
    const [lastDiscount, setLastDiscount] = useState<number>(0);
    const [lastTax, setLastTax] = useState<number>(0);
    const [lastOther, setLastOther] = useState<number>(0);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [lastVNO, setLastVNO] = useState<string>('');
    const [lastTenderedAmount, setLastTenderedAmount] = useState<number>(0);
    const [lastChangeAmount, setLastChangeAmount] = useState<number>(0);
    const [lastVoucherData, setLastVoucherData] = useState<any>(null);

    // Fetch Next VNO from server
    const fetchNextVNO = useCallback(async () => {
        try {
            const result = await apiClient.get(API_ENDPOINTS.SALES_NEXT_VNO);
            if (result.success && result.data?.vno) {
                setCurrentVNO(result.data.vno);
            }
        } catch (error) {
            console.error('Fetch Next VNO error:', error);
        }
    }, []);

    useEffect(() => {
        fetchNextVNO();
    }, [fetchNextVNO]);

    // Handle outside clicks to close category dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Add Customer States
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '', email: '' });

    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
    const isAdmin = sessionManager.getUserType() === 'admin';

    // Build query string for items
    const buildItemsQuery = useCallback(() => {
        if (posViewMode === 'services') return null;

        const user = sessionManager.getUser();
        const branchId = user?.branchId || 'all';

        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        params.append('branchId', branchId); // Include branchId for SWR cache isolation
        
        if (selectedCategory) params.append('categoryId', selectedCategory);
        if (searchQuery) params.append('search', searchQuery);
        
        // Add isSerialized or isSparePart filter based on mode
        if (posViewMode === 'phones') {
            params.append('isSerialized', '1');
        } else if (posViewMode === 'products') {
            params.append('isSerialized', '0');
        } else if (posViewMode === 'spare') {
            params.append('isSparePart', '1');
        }
        
        return `${API_ENDPOINTS.POS_ITEMS}?${params.toString()}`;
    }, [page, limit, selectedCategory, searchQuery, posViewMode]);

    // Build query string for categories
    const buildCategoriesQuery = useCallback(() => {
        const params = new URLSearchParams();
        if (posViewMode === 'phones') {
            params.append('isSerialized', '1');
        } else if (posViewMode === 'products') {
            params.append('isSerialized', '0');
        } else if (posViewMode === 'spare') {
            params.append('isSparePart', '1');
        }
        return `${API_ENDPOINTS.POS_CATEGORIES}?${params.toString()}`;
    }, [posViewMode]);

    // SWR for categories
    const { data: categoriesData, isLoading: categoriesLoading } = useSWR<CategoriesResponse>(
        buildCategoriesQuery(),
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 } // Cache for 1 min
    );

    // SWR for items
    const { data: itemsData, isLoading: itemsLoading, mutate: mutateItems } = useSWR<ItemsResponse>(
        buildItemsQuery(),
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 10000 } // Cache for 10 sec
    );

    // SWR for customers dropdown
    const { data: customersData, mutate: mutateCustomers } = useSWR<CustomersDropdownResponse>(
        API_ENDPOINTS.CUSTOMERS_DROPDOWN,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

    const categories = categoriesData?.data || [];
    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );
    const items = itemsData?.data || [];
    const pagination = itemsData?.pagination;
    const customers = customersData?.data || [];

    // Filter customers based on search
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        c.phone.includes(customerSearchQuery)
    );

    // Get selected customer name
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    // Set default customer when customers data loads
    useEffect(() => {
        if (customers.length > 0 && !selectedCustomerId) {
            // Set first customer as default
            setSelectedCustomerId(customers[0].id);
        }
    }, [customers, selectedCustomerId]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Save cart to session whenever it changes
    useEffect(() => {
        saveCartToSession(cart);
    }, [cart]);

    // Reset page when category or search changes
    useEffect(() => {
        setPage(1);
    }, [selectedCategory, searchQuery]);

    // Barcode scanner handler
    const handleBarcodeInput = async (code: string) => {
        const trimmedCode = code.trim();
        const validLengths = [9, 10, 13];

        if (!validLengths.includes(trimmedCode.length)) {
            return;
        }

        try {
            // Search for item by code
            const result = await apiClient.get(`${API_ENDPOINTS.POS_ITEMS}?search=${trimmedCode}&limit=1`);

            if (result.success && result.data && result.data.length > 0) {
                const item = result.data[0];

                // Check if item matches the barcode exactly
                if (item.code === trimmedCode || item.code.includes(trimmedCode)) {
                    addToCart(item);
                    setNotification({ message: `Added: ${item.name}`, type: 'success' });
                    setBarcodeInput(''); // Clear only on success
                } else {
                    // Don't clear, let user type more?
                    // setNotification({ message: 'Item not found', type: 'info' });
                }
            } else {
                // setNotification({ message: 'Item not found', type: 'info' });
            }
        } catch (error) {
            console.error('Barcode scan error:', error);
            // setNotification({ message: 'Scan failed', type: 'info' });
        }
    };

    // Handle barcode input on Enter
    const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // User requested NO action on Enter
            // handleBarcodeInput(barcodeInput); 
        }
    };

    const fetchAvailableImeis = async (productId: string) => {
        try {
            const result = await apiClient.get(API_ENDPOINTS.POS_IMEIS(productId));
            if (result.success) {
                setAvailableImeis(result.data);
            }
        } catch (error) {
            console.error('Fetch IMEIs error:', error);
        }
    };

    const handleImeiSelect = (imeiData: any) => {
        if (!selectedProductForImei) return;

        const userId = sessionManager.getUserId() || '';
        const currentDate = new Date().toISOString();

        setCart(prev => {
            // Serialized items are added individually with unique cart IDs
            const uniqueId = `${selectedProductForImei.id}-${imeiData.imei_1}`;
            
            // Check if already in cart (should not happen if imei is unique and unsold)
            if (prev.find(item => item.id === uniqueId)) {
                return prev;
            }

            const newCartItem: CartItem = {
                ...selectedProductForImei,
                id: uniqueId, // Make unique in cart
                qty: 1,
                remainId: selectedProductForImei.id,
                userId: userId,
                date: currentDate,
                vno: currentVNO,
                imei: imeiData.imei_1,
                imei2: imeiData.imei_2,
                stock_id: imeiData.id,
                price: parseFloat(imeiData.sell_price) || selectedProductForImei.price,
                specification: imeiData.specification || ''
            };
            return [...prev, newCartItem];
        });

        setIsImeiModalOpen(false);
        setSelectedProductForImei(null);
        setNotification({ message: `Added: ${selectedProductForImei.name} (IMEI: ${imeiData.imei_1})`, type: 'success' });
    };

    const handleAddService = (e: React.FormEvent) => {
        e.preventDefault();
        if (!serviceForm.name || !serviceForm.price) {
            setNotification({ message: 'Name and Price are required', type: 'info' });
            return;
        }

        const userId = sessionManager.getUserId() || '';
        const currentDate = new Date().toISOString();
        const serviceId = `service-${Date.now()}`;

        const newCartItem: CartItem = {
            id: serviceId,
            code: 'SRV',
            name: serviceForm.name,
            price: parseFloat(serviceForm.price) || 0,
            stock: 999999, // Unlimited stock for services
            categoryId: 'service',
            categoryName: 'Service',
            image: null,
            imageUrl: null,
            qty: 1,
            remainId: serviceId,
            userId: userId,
            date: currentDate,
            vno: currentVNO
        };

        setCart(prev => [...prev, newCartItem]);
        setServiceForm({ name: '', price: '' });
        setNotification({ message: 'Service added to cart', type: 'success' });
    };

    const addToCart = (product: POSItem) => {
        // Handle Serialized Phones
        if (product.isSerialized) {
            setSelectedProductForImei(product);
            fetchAvailableImeis(product.id);
            setIsImeiModalOpen(true);
            return;
        }

        // Check stock for general products
        const existingInCart = cart.filter(item => item.id === product.id).reduce((sum, item) => sum + item.qty, 0);

        if (existingInCart >= product.stock) {
            setNotification({ message: 'Not enough stock!', type: 'info' });
            return;
        }

        const userId = sessionManager.getUserId() || '';
        const currentDate = new Date().toISOString();

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id && !item.imei); // Non-serialized items group together
            if (existing) {
                return prev.map(item =>
                    (item.id === product.id && !item.imei) ? { ...item, qty: item.qty + 1 } : item
                );
            }
            // New item with additional fields
            const newCartItem: CartItem = {
                ...product,
                qty: 1,
                remainId: product.id,
                userId: userId,
                date: currentDate,
                vno: currentVNO
            };
            return [...prev, newCartItem];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, Math.min(item.stock, item.qty + delta));
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    // Clear cart only (for Reset button)
    const clearCart = () => {
        setCart([]);
        setTenderedAmount('');
        setChangeAmount(0);
        setSelectedCustomerId('');
        setCustomerSearchQuery('');
        setDiscountType('percent');
        setDiscountValue('');
        setTaxType('percent');
        setTaxValue('');
        setOtherType('percent');
        setOtherValue('');
        setSaleDate(getTodayDateString());
        sessionStorage.removeItem(CART_STORAGE_KEY);
    };

    // Reset cart with new VNO (after checkout)
    const resetCart = async (newVNO?: string) => {
        clearCart();

        // Set new VNO
        if (newVNO) {
            setCurrentVNO(newVNO);
        } else {
            // Fetch next VNO from server
            try {
                const result = await apiClient.get(API_ENDPOINTS.SALES_NEXT_VNO);
                if (result.success) {
                    setCurrentVNO(result.data.vno);
                } else {
                    setCurrentVNO(generateVNO());
                }
            } catch {
                setCurrentVNO(generateVNO());
            }
        }
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

    // Calculate discount
    const discountAmount = discountType === 'percent'
        ? (subtotal * (parseFloat(discountValue) || 0) / 100)
        : (parseFloat(discountValue) || 0);

    // Calculate tax on subtotal after discount
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = taxType === 'percent'
        ? (afterDiscount * (parseFloat(taxValue) || 0) / 100)
        : (parseFloat(taxValue) || 0);

    const otherAmount = otherType === 'percent'
        ? (afterDiscount * (parseFloat(otherValue) || 0) / 100)
        : (parseFloat(otherValue) || 0);

    const totalAmount = afterDiscount + taxAmount + otherAmount;

    // Category selection
    const handleCategoryClick = (categoryId: string | null) => {
        setSelectedCategory(categoryId);
        setSearchQuery('');
        setPage(Page => 1);
    };

    // --- Silent / Hold Logic ---
    const handleSilentClick = () => {
        if (cart.length > 0) {
            const newOrder: HeldOrder = {
                id: Date.now(),
                timestamp: new Date(),
                items: [...cart],
                totalAmount: totalAmount,
                totalQty: totalQty
            };
            setHeldOrders([...heldOrders, newOrder]);
            setCart([]);
            setNotification({ message: 'Order held silently', type: 'info' });
        } else if (heldOrders.length > 0) {
            setIsHeldOrdersModalOpen(true);
        } else {
            setNotification({ message: 'Cart is empty', type: 'info' });
        }
    };

    const restoreHeldOrder = (orderId: number) => {
        const orderToRestore = heldOrders.find(o => o.id === orderId);
        if (orderToRestore) {
            if (cart.length > 0) {
                const currentToHold: HeldOrder = {
                    id: Date.now(),
                    timestamp: new Date(),
                    items: [...cart],
                    totalAmount: totalAmount,
                    totalQty: totalQty
                };
                setHeldOrders(prev => [...prev.filter(o => o.id !== orderId), currentToHold]);
            } else {
                setHeldOrders(prev => prev.filter(o => o.id !== orderId));
            }

            setCart(orderToRestore.items);
            setIsHeldOrdersModalOpen(false);
            setNotification({ message: 'Order restored', type: 'success' });
        }
    };

    const deleteHeldOrder = (e: React.MouseEvent, orderId: number) => {
        e.stopPropagation();
        setHeldOrders(prev => prev.filter(o => o.id !== orderId));
    };

    // --- Payment Logic ---
    const handlePayClick = () => {
        if (cart.length === 0) return;
        setIsPaymentModalOpen(true);
        setTenderedAmount('');
        if (saleType === 'credit') {
            setPaymentMethod('Credit');
        } else {
            setPaymentMethod('Cash');
        }
    };

    const handlePaymentMethodSelect = (method: 'Cash' | 'KPay' | 'WavePay' | 'Credit') => {
        setPaymentMethod(method);
        if (method === 'Credit') {
            setSaleType('credit');
        } else {
            setSaleType('cash');
            setTimeout(() => {
                if (tenderedInputRef.current) {
                    tenderedInputRef.current.focus();
                    tenderedInputRef.current.select();
                }
            }, 50);
        }
        if (method === 'KPay' || method === 'WavePay') {
            setTenderedAmount(totalAmount.toString());
        } else {
            setTenderedAmount('');
        }
    };

    // Calculate final amounts for payment modal
    const getPaymentTotals = () => {
        const disc = discountType === 'percent'
            ? (subtotal * (parseFloat(discountValue) || 0) / 100)
            : (parseFloat(discountValue) || 0);
        const afterDisc = subtotal - disc;
        const tax = taxType === 'percent'
            ? (afterDisc * (parseFloat(taxValue) || 0) / 100)
            : (parseFloat(taxValue) || 0);
        const other = otherType === 'percent'
            ? (afterDisc * (parseFloat(otherValue) || 0) / 100)
            : (parseFloat(otherValue) || 0);
        return {
            subtotal,
            discount: disc,
            tax: tax,
            other: other,
            total: afterDisc + tax + other
        };
    };

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomerForm.name) {
            setNotification({ message: 'Name is required', type: 'info' });
            return;
        }
        setIsAddingCustomer(true);
        try {
            const result = await apiClient.post(API_ENDPOINTS.CUSTOMERS, newCustomerForm);
            if (result.success) {
                setNotification({ message: 'Customer added successfully', type: 'success' });
                setIsAddCustomerModalOpen(false);
                setNewCustomerForm({ name: '', phone: '', address: '', email: '' });
                // Refresh customers list
                await mutateCustomers();
                // Select the new customer
                if (result.data && result.data.id) {
                    setSelectedCustomerId(result.data.id);
                    setCustomerSearchQuery('');
                }
            } else {
                setNotification({ message: result.message || 'Failed to add customer', type: 'info' });
            }
        } catch (error) {
            console.error('Add customer error:', error);
            setNotification({ message: 'An error occurred', type: 'info' });
        } finally {
            setIsAddingCustomer(false);
        }
    };

    const handleConfirmPayment = async () => {
        const paymentTotals = getPaymentTotals();
        const tendered = Math.round(parseFloat(tenderedAmount) || 0);

        // Validate customer selection - required for both Cash and Credit sales
        if (!selectedCustomerId) {
            setNotification({ message: 'Please select a customer', type: 'info' });
            return;
        }

        if (saleType === 'cash' && tendered < paymentTotals.total) {
            setNotification({ message: 'Insufficient amount', type: 'info' });
            return;
        }

        setIsCheckingOut(true);

        try {
            const userId = sessionManager.getUserId() || '';
            // Round all monetary values to avoid floating point issues
            const roundedSubtotal = Math.round(paymentTotals.subtotal);
            const roundedDiscount = Math.round(paymentTotals.discount);
            const roundedTax = Math.round(paymentTotals.tax);
            const roundedOther = Math.round(paymentTotals.other);
            const roundedTotal = Math.round(paymentTotals.total);
            const roundedRefund = Math.round(tendered - roundedTotal);

            const checkoutData = {
                items: cart.map(item => ({
                    remainId: item.remainId,
                    itemName: item.name,
                    qty: item.qty,
                    sellPrice: item.price,
                    codeNo: item.code,
                    imei: item.imei,
                    imei2: item.imei2,
                    stockId: item.stock_id,
                    isService: item.isService || item.remainId.toString().includes('service')
                })),
                vno: currentVNO,
                customerId: selectedCustomerId || null,
                totalQty: totalQty,
                subtotal: roundedSubtotal,
                discount: roundedDiscount,
                tax: roundedTax,
                otherAmt: roundedOther,
                otherType: otherType,
                otherValue: parseFloat(otherValue) || 0,
                total: roundedTotal,
                cash: saleType === 'cash' ? tendered : 0,
                refund: saleType === 'cash' ? roundedRefund : 0,
                credit: saleType === 'credit' ? roundedTotal : 0,
                paymentType: saleType === 'credit' ? 'Credit' : paymentMethod, // 'Credit' for functionality, specific for others
                userId: sessionManager.getUserId(),
                date: saleDate
            };

            const result = await apiClient.post(API_ENDPOINTS.SALES_CHECKOUT, checkoutData);

            if (result.success) {
                // Save for voucher display using consistent rounded values
                setLastOrder([...cart]);
                setLastOrderTotal(roundedTotal);
                setLastCustomerName(selectedCustomer?.name || '');
                setLastDiscount(roundedDiscount);
                setLastTax(roundedTax);
                setLastOther(roundedOther);
                setChangeAmount(roundedRefund);
                setLastVNO(currentVNO);
                setLastTenderedAmount(tendered);
                setLastChangeAmount(roundedRefund);
                setLastVoucherData(result.data.voucher);

                setIsPaymentModalOpen(false);
                setIsVoucherModalOpen(true);

                // Reset cart with new VNO from server
                if (result.data?.nextVNO) {
                    await resetCart(result.data.nextVNO);
                } else {
                    await resetCart();
                }

                // Refresh items to update stock
                mutateItems();
            } else {
                setNotification({ message: result.message || 'Checkout failed', type: 'info' });
            }
        } catch (error) {
            console.error('Checkout error:', error);
            setNotification({ message: 'Checkout failed. Please try again.', type: 'info' });
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handlePrintVoucher = () => {
        window.print();
    };

    // Get image URL with fallback
    const getItemImageUrl = (item: POSItem) => {
        if (item.image) {
            return getImageUrl(item.image);
        }
        return getImageUrl(DEFAULT_IMAGE);
    };

    return (
        <div className="h-full flex flex-col lg:flex-row overflow-hidden relative bg-gray-900">

            {/* Toast Notification */}
            {notification && (
                <div className={`fixed top-20 right-4 z-[80] px-6 py-3 rounded-lg shadow-lg text-white font-medium flex items-center animate-bounce ${notification.type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`}>
                    {notification.type === 'success' ? <CheckCircle size={20} className="mr-2" /> : <BellOff size={20} className="mr-2" />}
                    {notification.message}
                </div>
            )}

            {/* Mobile/Tablet Tab Navigation (Visible only < lg) */}
            <div className="lg:hidden flex h-14 bg-gray-800 border-b border-gray-700 shrink-0 z-30">
                <button
                    className={`flex-1 flex items-center justify-center text-sm font-medium transition-colors relative ${activeTab === 'selection' ? 'text-blue-400 bg-gray-750 border-b-2 border-blue-500' : 'text-gray-400 hover:bg-gray-750 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('selection')}
                >
                    <LayoutGrid size={18} className="mr-2" />
                    <span>Items & Menu</span>
                </button>
                <button
                    className={`flex-1 flex items-center justify-center text-sm font-medium transition-colors relative ${activeTab === 'bill' ? 'text-blue-400 bg-gray-750 border-b-2 border-blue-500' : 'text-gray-400 hover:bg-gray-750 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('bill')}
                >
                    <ShoppingBag size={18} className="mr-2" />
                    <span>Bill / Cart</span>
                    {totalQty > 0 && (
                        <span className="ml-2 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white ring-2 ring-gray-800 animate-pulse">
                            {totalQty}
                        </span>
                    )}
                </button>
            </div>

            {/* LEFT PANEL: CART / BILL */}
            <div className={`
        lg:w-[380px] xl:w-[420px] flex-col bg-gray-800 border-r border-gray-700 z-20 shadow-xl
        ${activeTab === 'bill' ? 'flex flex-1 lg:flex-initial lg:static w-full' : 'hidden lg:flex'}
      `}>
                {/* Cart Header */}
                <div className="p-3 border-b border-gray-700 bg-gray-800 shadow-sm z-10">
                    {/* Sale Type Cards */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                            onClick={() => setSaleType('cash')}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${saleType === 'cash'
                                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-900/30'
                                : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500 hover:bg-gray-700'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${saleType === 'cash' ? 'bg-emerald-600' : 'bg-gray-600'}`}>
                                <Banknote size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                                <p className={`text-sm font-bold ${saleType === 'cash' ? 'text-emerald-400' : 'text-gray-300'}`}>Cash Sale</p>
                                <p className="text-[10px] text-gray-500">Instant payment</p>
                            </div>
                            {saleType === 'cash' && (
                                <div className="ml-auto">
                                    <CheckCircle size={18} className="text-emerald-400" />
                                </div>
                            )}
                        </button>

                        <button
                            onClick={() => setSaleType('credit')}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${saleType === 'credit'
                                ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-900/30'
                                : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500 hover:bg-gray-700'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${saleType === 'credit' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                <Wallet size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                                <p className={`text-sm font-bold ${saleType === 'credit' ? 'text-blue-400' : 'text-gray-300'}`}>Credit</p>
                                <p className="text-[10px] text-gray-500">Pay later</p>
                            </div>
                            {saleType === 'credit' && (
                                <div className="ml-auto">
                                    <CheckCircle size={18} className="text-blue-400" />
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Barcode Input */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={barcodeMode}
                                    onChange={(e) => setBarcodeMode(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-xs text-gray-400">Barcode Scanner</span>
                            </label>
                            {barcodeMode && (
                                <span className="text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded animate-pulse">Active</span>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                placeholder={barcodeMode ? "Scan barcode (9/10/13 digits)..." : "Scan barcode or type..."}
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                onKeyDown={handleBarcodeKeyDown}
                                autoFocus={barcodeMode}
                                className={`w-full bg-gray-700 border rounded-lg p-2.5 pl-9 text-sm text-white focus:ring-2 focus:outline-none ${barcodeMode ? 'border-green-500 focus:ring-green-500' : 'border-gray-600 focus:ring-blue-500'
                                    }`}
                            />
                            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                            <button
                                onClick={() => barcodeInput && handleBarcodeInput(barcodeInput)}
                                className="absolute right-1.5 top-1.5 bg-green-600 hover:bg-green-700 p-1.5 rounded-lg text-white transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-gray-600">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-700 text-gray-300 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3 font-medium">Item</th>
                                <th className="p-3 font-medium text-center">Qty</th>
                                <th className="p-3 font-medium text-right">Total</th>
                                <th className="p-3 w-8"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {cart.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-750 group transition-colors">
                                    <td className="p-3">
                                        <div className="font-medium text-white line-clamp-1">{item.name}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 font-mono">{item.code}</span>
                                            {item.imei && (
                                                <span className="text-[10px] bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                                    IMEI: {item.imei}{item.specification ? ` (${item.specification})` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className={`flex items-center justify-center border border-gray-600 rounded-lg bg-gray-900 w-fit mx-auto ${item.imei ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                            <button
                                                onClick={() => updateQty(item.id, -1)}
                                                className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-red-400 rounded-l transition-colors active:bg-gray-800"
                                                disabled={!!item.imei}
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium text-white">{item.qty}</span>
                                            <button
                                                onClick={() => updateQty(item.id, 1)}
                                                className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-green-400 rounded-r transition-colors active:bg-gray-800"
                                                disabled={item.qty >= item.stock || !!item.imei}
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-3 text-right font-medium text-emerald-400 whitespace-nowrap">
                                        {(item.price * item.qty).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-gray-500 hover:text-red-500 p-1.5 rounded hover:bg-red-900/20 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {cart.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-gray-500">
                                        <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>Cart is empty</p>
                                        <p className="text-xs mt-2">Select items to start sale</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Cart Footer / Totals */}
                <div className="p-4 bg-gray-800 border-t border-gray-700 space-y-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-20">
                    <div className="flex justify-between items-center text-sm text-gray-400">
                        <span>Total Qty: {totalQty}</span>
                        <span>Folio No: <span className="text-blue-400 font-mono">{currentVNO}</span></span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="text-white">{subtotal.toLocaleString()} MMK</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Discount {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
                            <span className="text-red-400">-{discountAmount.toLocaleString()} MMK</span>
                        </div>
                    )}
                    {taxAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Tax {taxType === 'percent' ? `(${taxValue}%)` : ''}</span>
                            <span className="text-yellow-400">+{taxAmount.toLocaleString()} MMK</span>
                        </div>
                    )}
                    {otherAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Other {otherType === 'percent' ? `(${otherValue}%)` : ''}</span>
                            <span className="text-blue-400">+{otherAmount.toLocaleString()} MMK</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                        <span className="text-lg font-bold text-white">Total</span>
                        <span className="text-2xl font-bold text-emerald-400">{totalAmount.toLocaleString()} <span className="text-sm font-normal text-gray-500">MMK</span></span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <button
                            onClick={handleSilentClick}
                            className="bg-purple-700 hover:bg-purple-600 text-white py-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 transform relative"
                        >
                            <BellOff size={18} />
                            <span className="text-xs font-medium">Silent</span>
                            {heldOrders.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-800">
                                    {heldOrders.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={clearCart}
                            className="bg-red-700 hover:bg-red-600 text-white py-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 transform"
                        >
                            <RotateCcw size={18} />
                            <span className="text-xs font-medium">Reset</span>
                        </button>
                        <button
                            onClick={handlePayClick}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors shadow-lg shadow-emerald-900/50 active:scale-95 transform"
                        >
                            <CreditCard size={18} />
                            <span className="text-xs font-bold">PAY</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: SELECTION (Products + Categories) */}
            <div className={`
        flex-1 flex flex-col overflow-hidden bg-gray-900
        ${activeTab === 'selection' ? 'flex w-full' : 'hidden lg:flex'}
      `}>

                {/* View Mode Toggle (Phones, Products, Services) */}
                <div className="bg-gray-800 border-b border-gray-700 p-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                    <button
                        onClick={() => { setPosViewMode('phones'); setSelectedCategory(null); setCategorySearchQuery(''); }}
                        className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${posViewMode === 'phones' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                    >
                        <Smartphone size={18} />
                        <span className="text-sm font-bold">Phones</span>
                    </button>
                    <button
                        onClick={() => { setPosViewMode('products'); setSelectedCategory(null); setCategorySearchQuery(''); }}
                        className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${posViewMode === 'products' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                    >
                        <Package size={18} />
                        <span className="text-sm font-bold">Accessories</span>
                    </button>
                    <button
                        onClick={() => { setPosViewMode('spare'); setSelectedCategory(null); setCategorySearchQuery(''); }}
                        className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${posViewMode === 'spare' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                    >
                        <Cpu size={18} />
                        <span className="text-sm font-bold">Spare Part</span>
                    </button>
                    <button
                        onClick={() => { setPosViewMode('services'); setSelectedCategory(null); setCategorySearchQuery(''); }}
                        className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${posViewMode === 'services' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                    >
                        <Settings size={18} />
                        <span className="text-sm font-bold">Other Services</span>
                    </button>
                </div>

                {/* Categories & Search Input Row - Hide in Service Mode */}
                {posViewMode !== 'services' && (
                    <div className="bg-gray-850 border-b border-gray-700 p-3 z-30 shrink-0">
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            
                            {/* Searchable Category Dropdown */}
                            <div className="relative w-full sm:w-64 shrink-0" ref={categoryDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                    className="w-full bg-gray-900 border border-gray-600 hover:border-gray-500 text-white rounded-lg px-3 py-2 flex items-center justify-between text-xs transition-all outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.99]"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <LayoutGrid size={14} className="text-blue-400 shrink-0" />
                                        <span className="truncate font-semibold">
                                            {selectedCategory
                                                ? categories.find(c => c.id === selectedCategory)?.name || 'Select Category'
                                                : 'All Categories'}
                                        </span>
                                    </div>
                                    <ChevronDown
                                        size={14}
                                        className="text-gray-400 transition-transform duration-200 shrink-0"
                                        style={{ transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                                    />
                                </button>

                                {isCategoryDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-gray-800 border border-gray-650 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-155">
                                        {/* Category Search Input */}
                                        <div className="p-2 border-b border-gray-750 bg-gray-850">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={categorySearchQuery}
                                                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                                                    placeholder="Search category..."
                                                    className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded px-2.5 py-1.5 pl-7 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                    onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on input click
                                                />
                                                <Search className="absolute left-2 top-2 text-gray-500" size={12} />
                                                {categorySearchQuery && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCategorySearchQuery('');
                                                        }}
                                                        className="absolute right-2 top-1.5 text-gray-400 hover:text-white text-xs font-bold"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Category Options List */}
                                        <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-700">
                                            {/* All Categories Option */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleCategoryClick(null);
                                                    setIsCategoryDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-700 transition-colors ${selectedCategory === null ? 'text-blue-400 font-bold bg-blue-900/10' : 'text-gray-300'}`}
                                            >
                                                <LayoutGrid size={12} />
                                                <span>All Categories</span>
                                            </button>

                                            {/* Loading State */}
                                            {categoriesLoading && (
                                                <div className="flex items-center justify-center p-3">
                                                    <Loader2 className="animate-spin text-gray-500" size={16} />
                                                </div>
                                            )}

                                            {/* Filtered Categories */}
                                            {!categoriesLoading && filteredCategories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => {
                                                        handleCategoryClick(cat.id);
                                                        setIsCategoryDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-700 transition-colors ${selectedCategory === cat.id ? 'text-blue-400 font-bold bg-blue-900/10' : 'text-gray-300'}`}
                                                >
                                                    <span className="truncate">{cat.name}</span>
                                                </button>
                                            ))}

                                            {/* Empty State */}
                                            {!categoriesLoading && filteredCategories.length === 0 && (
                                                <div className="px-3 py-2 text-center text-xs text-gray-500">
                                                    No categories found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Item Search Input */}
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={`Search ${posViewMode === 'phones' ? 'phones' : posViewMode === 'spare' ? 'spare parts' : 'accessories'}...`}
                                    className="w-full bg-gray-900 border border-gray-655 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-inner text-xs"
                                />
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                            </div>

                        </div>
                    </div>
                )}

                {/* Product Grid Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-900 scrollbar-thin scrollbar-thumb-gray-700">
                                        {/* OTHER SERVICES MODE (Manual Form Only) */}
                    {posViewMode === 'services' && (
                        <div className="flex w-full justify-center py-6">
                            {/* Manual Service Form */}
                            <div className="w-full max-w-md bg-gray-800 rounded-2xl border border-gray-750 p-8 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl">
                                        <Plus size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Custom Service</h3>
                                        <p className="text-xs text-gray-400">Add custom service name & price</p>
                                    </div>
                                </div>

                                <form onSubmit={handleAddService} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Service Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={serviceForm.name}
                                            onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                                            placeholder="e.g. Battery Replacement"
                                            className="w-full bg-gray-900 border border-gray-650 text-white rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Price (MMK)</label>
                                        <input
                                            type="number"
                                            required
                                            value={serviceForm.price}
                                            onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                                            placeholder="0"
                                            className="w-full bg-gray-900 border border-gray-650 text-white rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-md shadow-purple-950/30 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Plus size={16} />
                                        <span>Add Custom Service</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* PHONES AND PRODUCTS MODE */}
                    {posViewMode !== 'services' && (
                        <>
                            {/* Loading State */}
                            {itemsLoading && (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-blue-500" size={40} />
                                </div>
                            )}

                            {/* Empty State */}
                            {!itemsLoading && items.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                    <Package size={64} className="mb-4 opacity-20" />
                                    <p className="text-lg">No items found</p>
                                    <p className="text-sm mt-2">Try a different category or search</p>
                                </div>
                            )}

                            {/* Products Grid */}
                            {!itemsLoading && items.length > 0 && (
                                <>                                    <div className="grid grid-cols-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-1.5 sm:gap-4 pb-4">
                                        {items.map(product => (
                                            <div
                                                key={product.id}
                                                onClick={() => addToCart(product)}
                                                className={`bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 overflow-hidden cursor-pointer group flex flex-col h-full border border-gray-200 ${product.stock <= 0 ? 'opacity-50 pointer-events-none' : ''
                                                    }`}
                                            >
                                                <div className="h-16 xs:h-20 sm:h-32 w-full bg-gray-100 relative overflow-hidden">
                                                    <img
                                                        src={getItemImageUrl(product) || ''}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = getImageUrl(DEFAULT_IMAGE) || '';
                                                        }}
                                                    />
                                                    <div className="absolute top-1 right-1 bg-black/60 text-white text-[7px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded backdrop-blur-md font-mono">
                                                        {product.code}
                                                    </div>
                                                    
                                                    {/* Serialized Badge */}
                                                    {product.isSerialized && (
                                                        <div className="absolute top-1 left-1 bg-blue-600 text-white p-0.5 sm:px-1.5 sm:py-0.5 rounded-full flex items-center gap-1 shadow-lg text-[7px] sm:text-[10px] font-bold">
                                                            <Smartphone size={8} className="sm:w-2.5 sm:h-2.5" />
                                                            <span className="hidden sm:inline">SERIALIZED</span>
                                                        </div>
                                                    )}
 
                                                    {/* Stock Qty Badge */}
                                                    <div className={`absolute bottom-1 right-1 text-[7px] sm:text-[10px] px-1 sm:px-2 py-0.5 rounded font-medium shadow-md ${product.stock <= 3
                                                        ? 'bg-red-500 text-white'
                                                        : product.stock <= 10
                                                            ? 'bg-yellow-500 text-white'
                                                            : 'bg-green-500 text-white'
                                                        }`}>
                                                        Qty: {product.stock}
                                                    </div>
                                                    {product.stock <= 0 && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                                                            <span className="bg-red-600 text-white text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-lg font-bold shadow-lg">OUT OF STOCK</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-1.5 sm:p-2.5 flex flex-col flex-1 justify-between bg-white text-gray-800">
                                                    <div>
                                                        <h3 className="text-[10px] sm:text-sm font-semibold line-clamp-2 leading-tight mb-0.5 text-blue-900 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                                                        <p className="text-[7px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold">{product.categoryName}</p>
                                                    </div>
                                                    <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-100 flex justify-between items-center">
                                                        {!product.isSerialized ? (
                                                            <span className="font-black text-emerald-600 text-[9px] sm:text-sm">Ks {product.price.toLocaleString()}</span>
                                                        ) : (
                                                            <span className="text-[7px] sm:text-[10px] text-gray-400 italic">Select IMEI to view price</span>
                                                        )}
                                                        <div className="bg-blue-50 text-blue-600 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 hidden sm:block">
                                                            <Plus size={10} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {pagination && pagination.totalPages > 1 && (
                                        <div className="sticky bottom-0 bg-gray-900/90 backdrop-blur border-t border-gray-800 py-3 px-4 mt-4 -mx-4 mb-0 z-10">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={!pagination.hasPrev}
                                                    className="p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 border border-gray-700 transition-all"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>

                                                <span className="text-sm text-gray-400 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 font-mono">
                                                    <span className="text-white font-bold">{pagination.page}</span> / <span className="text-white font-bold">{pagination.totalPages}</span>
                                                </span>

                                                <button
                                                    onClick={() => setPage(p => p + 1)}
                                                    disabled={!pagination.hasNext}
                                                    className="p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 border border-gray-700 transition-all"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* PAYMENT MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200 my-4 flex flex-col max-h-[90vh]">
                        <div className="bg-gray-750 border-b border-gray-700 p-4 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <CreditCard className="text-emerald-500" /> Checkout
                            </h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} disabled={isCheckingOut} className="text-gray-400 hover:text-white disabled:opacity-50">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                                {/* LEFT COLUMN: Customer & Details */}
                                <div className="space-y-6">
                                    {/* Sale Date (Back date option) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                            <Clock size={16} className="text-blue-400" /> Sale Date
                                        </label>
                                        <input
                                            type="date"
                                            value={saleDate}
                                            onChange={(e) => setSaleDate(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>

                                    {/* Customer Name */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <User size={16} className="text-gray-400" /> Customer Name <span className="text-red-500">*</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddCustomerModalOpen(true)}
                                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                            >
                                                <Plus size={12} /> Add New
                                            </button>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={selectedCustomer ? selectedCustomer.name : customerSearchQuery}
                                                onChange={(e) => {
                                                    setCustomerSearchQuery(e.target.value);
                                                    setSelectedCustomerId('');
                                                    setIsCustomerDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsCustomerDropdownOpen(true)}
                                                className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-4 pr-10 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                placeholder="Search customer name..."
                                            />
                                            <Search size={16} className="absolute right-3 top-3 text-gray-500" />

                                            {/* Dropdown */}
                                            {isCustomerDropdownOpen && (
                                                <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto left-0 top-full">
                                                    {filteredCustomers.length > 0 ? (
                                                        filteredCustomers.slice(0, 10).map(customer => (
                                                            <button
                                                                key={customer.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedCustomerId(customer.id);
                                                                    setCustomerSearchQuery('');
                                                                    setIsCustomerDropdownOpen(false);
                                                                }}
                                                                className="w-full px-4 py-2 text-left hover:bg-gray-800 flex justify-between items-center"
                                                            >
                                                                <span className="text-white">{customer.name}</span>
                                                                <span className="text-xs text-gray-500">{customer.phone}</span>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-3 text-gray-500 text-sm text-center">
                                                            No customers found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {selectedCustomer && (
                                            <p className="text-xs text-blue-400 mt-1">Selected: {selectedCustomer.name} ({selectedCustomer.phone})</p>
                                        )}
                                    </div>

                                    {/* Discount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                            <Percent size={16} className="text-red-400" /> Discount
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="flex bg-gray-900 rounded-lg border border-gray-600 overflow-hidden shrink-0">
                                                <button
                                                    onClick={() => setDiscountType('percent')}
                                                    className={`px-3 py-2 text-sm font-medium transition-colors ${discountType === 'percent' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    %
                                                </button>
                                                <button
                                                    onClick={() => setDiscountType('amount')}
                                                    className={`px-3 py-2 text-sm font-medium transition-colors ${discountType === 'amount' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    MMK
                                                </button>
                                            </div>
                                            <input
                                                type="number"
                                                value={discountValue}
                                                onChange={(e) => setDiscountValue(e.target.value)}
                                                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                                placeholder={discountType === 'percent' ? 'Enter %' : 'Enter amount'}
                                            />
                                        </div>
                                        {discountAmount > 0 && (
                                            <p className="text-xs text-red-400 mt-1">Discount: -{discountAmount.toLocaleString()} MMK</p>
                                        )}
                                    </div>

                                    {/* Tax */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                            <Receipt size={16} className="text-yellow-400" /> Tax
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="flex bg-gray-900 rounded-lg border border-gray-600 overflow-hidden shrink-0">
                                                <button
                                                    onClick={() => setTaxType('percent')}
                                                    className={`px-3 py-2 text-sm font-medium transition-colors ${taxType === 'percent' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    %
                                                </button>
                                                <button
                                                    onClick={() => setTaxType('amount')}
                                                    className={`px-3 py-2 text-sm font-medium transition-colors ${taxType === 'amount' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    MMK
                                                </button>
                                            </div>
                                            <input
                                                type="number"
                                                value={taxValue}
                                                onChange={(e) => setTaxValue(e.target.value)}
                                                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                                                placeholder={taxType === 'percent' ? 'Enter %' : 'Enter amount'}
                                            />
                                        </div>
                                        {taxAmount > 0 && (
                                            <p className="text-xs text-yellow-400 mt-1">Tax: +{taxAmount.toLocaleString()} MMK</p>
                                        )}
                                    </div>

                                    {/* Other */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                            <Settings size={16} className="text-blue-400" /> Other Percent (%/mmk)
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="flex bg-gray-900 rounded-lg border border-gray-600 overflow-hidden shrink-0">
                                                <button
                                                    onClick={() => setOtherType('percent')}
                                                    className={`px-3 py-2 text-sm font-medium transition-colors ${otherType === 'percent' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    %
                                                </button>
                                                <button
                                                    onClick={() => setOtherType('amount')}
                                                    className={`px-3 py-2 text-sm font-medium transition-colors ${otherType === 'amount' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    MMK
                                                </button>
                                            </div>
                                            <input
                                                type="number"
                                                value={otherValue}
                                                onChange={(e) => setOtherValue(e.target.value)}
                                                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                placeholder={otherType === 'percent' ? 'Enter %' : 'Enter amount'}
                                            />
                                        </div>
                                        {otherAmount > 0 && (
                                            <p className="text-xs text-blue-400 mt-1">Other: +{otherAmount.toLocaleString()} MMK</p>
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Payment Method & Totals */}
                                <div className="space-y-6 flex flex-col">
                                    {/* Payment Methods Grid */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">Payment Method</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handlePaymentMethodSelect('Cash')}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'Cash'
                                                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-emerald-900/20'
                                                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500'
                                                    }`}
                                            >
                                                <Banknote size={24} />
                                                <span className="font-bold">Cash</span>
                                            </button>

                                            <button
                                                onClick={() => handlePaymentMethodSelect('KPay')}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'KPay'
                                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-blue-900/20'
                                                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500'
                                                    }`}
                                            >
                                                <CreditCard size={24} />
                                                <span className="font-bold">KPay</span>
                                            </button>

                                            <button
                                                onClick={() => handlePaymentMethodSelect('WavePay')}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'WavePay'
                                                    ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400 shadow-yellow-900/20'
                                                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500'
                                                    }`}
                                            >
                                                <Wallet size={24} />
                                                <span className="font-bold">WavePay</span>
                                            </button>

                                            <button
                                                onClick={() => handlePaymentMethodSelect('Credit')}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'Credit'
                                                    ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-purple-900/20'
                                                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500'
                                                    }`}
                                            >
                                                <FileCheck size={24} />
                                                <span className="font-bold">Credit / Debt</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Summary Box */}
                                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 space-y-2 mt-auto">
                                        <div className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                                            <span className="text-gray-400">Customer</span>
                                            <span className="font-medium text-white">{selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Subtotal</span>
                                            <span className="text-white">{subtotal.toLocaleString()} MMK</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Discount</span>
                                                <span className="text-red-400">-{discountAmount.toLocaleString()} MMK</span>
                                            </div>
                                        )}
                                        {taxAmount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Tax</span>
                                                <span className="text-yellow-400">+{taxAmount.toLocaleString()} MMK</span>
                                            </div>
                                        )}
                                        {otherAmount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Other</span>
                                                <span className="text-blue-400">+{otherAmount.toLocaleString()} MMK</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-gray-700">
                                            <span className="text-white font-bold text-lg">Total</span>
                                            <span className="text-2xl font-bold text-emerald-400">{totalAmount.toLocaleString()} MMK</span>
                                        </div>
                                    </div>

                                    {/* Tendered Logic */}
                                    {saleType === 'cash' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    {paymentMethod === 'Cash' ? 'Cash Tendered' : 'Amount Received'}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        ref={tenderedInputRef}
                                                        type="number"
                                                        autoFocus
                                                        value={tenderedAmount}
                                                        onChange={(e) => setTenderedAmount(e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        onClick={(e) => e.currentTarget.select()}
                                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 text-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-4 top-4 text-gray-500 text-sm">MMK</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center p-4 bg-gray-900 rounded-lg border border-gray-700">
                                                <span className="text-gray-400">Change</span>
                                                <span className={`text-xl font-bold ${(parseFloat(tenderedAmount || '0') - totalAmount) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                                    {Math.max(0, parseFloat(tenderedAmount || '0') - totalAmount).toLocaleString()} MMK
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {saleType === 'credit' && (
                                        <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-700 text-center">
                                            <p className="text-purple-400 font-medium">Credit Sale</p>
                                            <p className="text-xs text-gray-400 mt-1">Amount will be recorded as outstanding debt</p>
                                        </div>
                                    )}

                                    {isAdmin && (
                                        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2 text-red-400">
                                            <AlertCircle size={18} />
                                            <span className="text-sm font-medium">Administrator account cannot perform sales. View only mode.</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleConfirmPayment}
                                        disabled={isCheckingOut || isAdmin}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                                    >
                                        {isCheckingOut ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Processing...
                                            </>
                                        ) : (
                                            'Confirm Payment'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD CUSTOMER MODAL */}
            {isAddCustomerModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-750">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <User size={18} className="text-blue-400" /> Add New Customer
                            </h3>
                            <button onClick={() => setIsAddCustomerModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={newCustomerForm.name}
                                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter customer name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={newCustomerForm.phone}
                                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                                <textarea
                                    value={newCustomerForm.address}
                                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none h-20"
                                    placeholder="Enter address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newCustomerForm.email}
                                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddCustomerModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAddingCustomer}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isAddingCustomer ? <Loader2 size={16} className="animate-spin" /> : 'Save Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VOUCHER / RECEIPT MODAL */}
            {
                isVoucherModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-white text-gray-900 rounded-lg w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                            <div className="p-4 bg-gray-100 border-b flex justify-between items-center print:hidden">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <FileCheck size={18} /> Receipt Preview
                                </h3>
                                <button onClick={() => setIsVoucherModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 min-h-0">
                                <Voucher
                                    voucher={{
                                        vno: lastVoucherData?.vno || lastVNO || 'N/A',
                                        customerName: lastVoucherData?.customerName || lastCustomerName || undefined,
                                        totalQty: lastVoucherData?.totalQty || lastOrder.reduce((sum, item) => sum + item.qty, 0),
                                        subTotal: lastVoucherData?.subTotal || lastOrder.reduce((sum, item) => sum + (item.price * item.qty), 0),
                                        discount: lastVoucherData?.discount || lastDiscount,
                                        tax: lastVoucherData?.tax || lastTax,
                                        otherAmt: lastVoucherData?.otherAmt || lastOther,
                                        total: lastVoucherData?.total || lastOrderTotal,
                                        cash: lastVoucherData?.cash || lastTenderedAmount || undefined,
                                        refund: lastVoucherData?.refund || lastChangeAmount || undefined,
                                        cashier: lastVoucherData?.cashier || sessionManager.getUsername() || 'Admin',
                                        date: lastVoucherData?.date || new Date().toISOString(),
                                        paymentType: lastVoucherData?.paymentType || paymentMethod,
                                        paymentMethod: lastVoucherData?.paymentMethod || paymentMethod,
                                        branchName: lastVoucherData?.branchName,
                                        branchInvoiceName: lastVoucherData?.branchInvoiceName,
                                        branchAddress: lastVoucherData?.branchAddress,
                                        branchPhone: lastVoucherData?.branchPhone,
                                        branchLogo: lastVoucherData?.branchLogo,
                                        branchIncludeLogo: lastVoucherData?.branchIncludeLogo
                                    }}
                                    items={lastOrder.map(item => ({
                                        itemName: item.name,
                                        qty: item.qty,
                                        sellPrice: item.price,
                                        amount: item.price * item.qty,
                                        imei: item.imei,
                                        specification: item.specification
                                    }))}
                                />
                            </div>

                            <div className="p-4 bg-gray-50 border-t flex gap-3 print:hidden">
                                <button
                                    onClick={() => setIsVoucherModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 text-sm font-medium"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handlePrintVoucher}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Printer size={16} /> Print
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* HELD ORDERS MODAL */}
            {
                isHeldOrdersModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                            <div className="bg-gray-750 border-b border-gray-700 p-4 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Clock className="text-purple-400" /> Held Orders
                                </h2>
                                <button onClick={() => setIsHeldOrdersModalOpen(false)} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                {heldOrders.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <BellOff size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>No held orders found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {heldOrders.map((order) => (
                                            <div key={order.id} className="bg-gray-700 rounded-xl p-4 border border-gray-600 hover:border-gray-500 transition-colors group relative">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-xs text-gray-400 mb-1">
                                                            {order.timestamp.toLocaleTimeString()} - {order.timestamp.toLocaleDateString()}
                                                        </p>
                                                        <p className="text-lg font-bold text-white">{order.totalAmount.toLocaleString()} <span className="text-xs font-normal text-gray-400">MMK</span></p>
                                                    </div>
                                                    <div className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300 border border-gray-600">
                                                        {order.totalQty} items
                                                    </div>
                                                </div>
                                                <div className="space-y-1 mb-4">
                                                    {order.items.slice(0, 2).map((item, i) => (
                                                        <div key={i} className="text-xs text-gray-300 flex justify-between">
                                                            <span>{item.qty}x {item.name}</span>
                                                        </div>
                                                    ))}
                                                    {order.items.length > 2 && (
                                                        <div className="text-xs text-gray-500 italic">+ {order.items.length - 2} more items</div>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => deleteHeldOrder(e, order.id)}
                                                        className="flex-1 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                    <button
                                                        onClick={() => restoreHeldOrder(order.id)}
                                                        className="flex-[2] py-2 bg-purple-600 text-white hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        Restore <ArrowRightCircle size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* IMEI SELECTION MODAL */}
            {isImeiModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-750 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Select IMEI Number</h3>
                                    <p className="text-xs text-gray-400">Available units for {selectedProductForImei?.name}</p>
                                </div>
                            </div>
                            <button onClick={() => { setIsImeiModalOpen(false); setSelectedProductForImei(null); }} className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-4 bg-gray-800 shrink-0">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={imeiSearchQuery}
                                    onChange={(e) => setImeiSearchQuery(e.target.value)}
                                    placeholder="Search IMEI or Serial Number..."
                                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                                    autoFocus
                                />
                                <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {availableImeis
                                    .filter(i => 
                                        i.imei_1?.toLowerCase().includes(imeiSearchQuery.toLowerCase()) || 
                                        i.imei_2?.toLowerCase().includes(imeiSearchQuery.toLowerCase())
                                    )
                                    .map((imeiData) => (
                                        <button
                                            key={imeiData.id}
                                            onClick={() => handleImeiSelect(imeiData)}
                                            className="flex flex-col gap-1 p-4 bg-gray-900 hover:bg-blue-600/10 border border-gray-700 hover:border-blue-500/50 rounded-xl text-left transition-all group relative overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Available</span>
                                                <span className="text-xs font-bold text-emerald-400 font-mono">
                                                    Ks {parseFloat(imeiData.sell_price || selectedProductForImei?.price || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="text-white font-mono font-bold text-lg">{imeiData.imei_1}</div>
                                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs">
                                                {imeiData.imei_2 && (
                                                    <span className="text-gray-500 font-mono">SIM2: {imeiData.imei_2}</span>
                                                )}
                                                {imeiData.specification && (
                                                    <span className="text-blue-300 font-medium">({imeiData.specification})</span>
                                                )}
                                            </div>
                                            <div className="absolute bottom-0 right-0 p-1 bg-blue-600/10 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus size={12} className="text-blue-400" />
                                            </div>
                                        </button>
                                    ))}
                                
                                {availableImeis.length === 0 && (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 bg-gray-900/50 rounded-2xl border border-dashed border-gray-700">
                                        <BellOff size={48} className="mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No available units found</p>
                                        <p className="text-sm">Please check your inventory for this product</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-700 bg-gray-750 flex justify-between items-center shrink-0">
                            <span className="text-sm text-gray-400">Total Available: <span className="text-white font-bold">{availableImeis.length}</span></span>
                            <button
                                onClick={() => { setIsImeiModalOpen(false); setSelectedProductForImei(null); }}
                                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default POS;
