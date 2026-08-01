// API Configuration
// export const API_CONFIG = {
//   BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
//   IMAGE_BASE_URL: import.meta.env.VITE_IMAGE_URL || 'http://localhost:3001',
//   TIMEOUT: 10000,
// };

// Detect if we're in development mode
const isDev = import.meta.env.DEV;
const backendPort = import.meta.env.VITE_BACKEND_PORT || '1501';
const devBackendUrl = `http://localhost:${backendPort}`;

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  IMAGE_BASE_URL: import.meta.env.VITE_IMAGE_URL || (isDev ? devBackendUrl : '/'),
  TIMEOUT: 10000,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Categories
  CATEGORIES: '/categories',
  CATEGORY_BY_ID: (id) => `/categories/${id}`,

  // Suppliers
  SUPPLIERS: '/suppliers',
  SUPPLIER_BY_ID: (id) => `/suppliers/${id}`,
  SUPPLIER_TRANSACTIONS: (id) => `/suppliers/${id}/transactions`,
  SUPPLIER_PAYMENTS: (id) => `/suppliers/${id}/payments`,
  SUPPLIER_PAYMENT_CREATE: (id) => `/suppliers/${id}/payments`,
  SUPPLIER_PAYMENT_UPDATE: (id, paymentId) => `/suppliers/${id}/payments/${paymentId}`,
  SUPPLIER_PAYMENT_DELETE: (id, paymentId) => `/suppliers/${id}/payments/${paymentId}`,
  SUPPLIER_PURCHASES: (id) => `/suppliers/${id}/purchases`,

  // Purchases
  PURCHASES: '/purchases',
  PURCHASE_BY_ID: (id) => `/purchases/${id}`,
  PURCHASE_DROPDOWNS: '/purchases/dropdowns',

  // Purchase Returns
  PURCHASE_RETURNS: '/purchase-returns',
  PURCHASE_RETURN_BY_ID: (id) => `/purchase-returns/${id}`,
  PURCHASE_RETURN_INVOICE: (invoiceNo) => `/purchase-returns/invoice/${invoiceNo}`,
  PURCHASE_RETURNS_VOUCHERS_DROPDOWN: '/purchase-returns/vouchers/dropdown',

  // Purchase Vouchers
  PURCHASE_VOUCHERS: '/purchase-vouchers',
  PURCHASE_VOUCHER_BY_ID: (id) => `/purchase-vouchers/${id}`,
  PURCHASE_VOUCHER_NEXT_VNO: '/purchase-vouchers/next-vno',
  PURCHASE_VOUCHER_UPLOAD_IMAGE: '/purchase-vouchers/upload-image',
  PURCHASE_VOUCHER_UPDATE: (id) => `/purchase-vouchers/${id}`,

  // Inventory
  INVENTORY: '/inventory',
  INVENTORY_BY_ID: (id) => `/inventory/${id}`,
  INVENTORY_DROPDOWNS: '/inventory/dropdowns',
  INVENTORY_LOW_STOCK: '/inventory/low-stock',
  INVENTORY_IMEI: (id) => `/inventory/${id}/imei`,
  INVENTORY_PRICE_HISTORY: (id) => `/inventory/${id}/price-history`,
  INVENTORY_SELLING_PRICE_HISTORY: (id) => `/inventory/${id}/selling-price-history`,
  INVENTORY_SELLING_PRICE_HISTORY_ALL: '/inventory/selling-price-history',


  // Expenses
  EXPENSES: '/expenses',
  EXPENSE_BY_ID: (id) => `/expenses/${id}`,
  EXPENSE_TOTAL: '/expenses/total',

  // Expense Categories
  EXPENSE_CATEGORIES: '/expense-categories',
  EXPENSE_CATEGORY_BY_ID: (id) => `/expense-categories/${id}`,
  EXPENSE_CATEGORIES_DROPDOWN: '/expense-categories/dropdown',

  // Users
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,

  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_CHANGE_PASSWORD: '/auth/change-password',
  AUTH_LOGOUT: '/auth/logout',

  // Logs
  LOGS: '/logs',
  LOGS_BY_USER: (userId) => `/logs/user/${userId}`,

  // POS
  POS_CATEGORIES: '/pos/categories',
  POS_ITEMS: '/pos/items',
  POS_ITEMS_SEARCH: '/pos/items/search',
  POS_ITEM_BY_CODE: (code) => `/pos/items/${code}`,
  POS_IMEIS: (productId) => `/pos/imeis/${productId}`,

  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_BY_ID: (id) => `/customers/${id}`,
  CUSTOMERS_DROPDOWN: '/customers/dropdown',

  // Sales
  SALES_CHECKOUT: '/sales/checkout',
  SALES_VOUCHERS: '/sales/vouchers',
  SALES_VOUCHER_BY_VNO: (vno) => `/sales/vouchers/${vno}`,
  SALES_NEXT_VNO: '/sales/vouchers/next-vno',

  // Reports
  REPORT_CREDIT: '/reports/credit',
  REPORT_CREDIT_VOUCHER: (vno) => `/reports/credit/${vno}`,
  REPORT_CREDIT_PAYMENTS: (vno) => `/reports/credit/payments/${vno}`,
  REPORT_CASH: '/reports/cash',
  REPORT_CASH_VOUCHER: (vno) => `/reports/cash/${vno}`,
  REPORT_RETURN: '/reports/return',
  REPORT_RETURN_VOUCHER: (vno) => `/reports/return/${vno}`,
  REPORT_BALANCE_PAYABLE: '/reports/balance/payable',
  REPORT_BALANCE_RECEIVABLE: '/reports/balance/receivable',
  REPORT_BALANCE_PAYABLE_HISTORY: (id) => `/reports/balance/payable/${id}/history`,
  REPORT_BALANCE_RECEIVABLE_HISTORY: (id) => `/reports/balance/receivable/${id}/history`,
  REPORT_IMEI_HISTORY: (imei) => `/reports/imei-history/${imei}`,
  REPORT_IMEI_SUGGESTIONS: '/reports/imei-history/suggestions',
  REPORT_IMEI_LIST: '/reports/imei-history/list',
  REPORT_BRAND_ANALYTICS: '/reports/brand-analytics',
  REPORT_BRANCH_COMPARISON: '/reports/brand-analytics/branch-comparison',
  REPORT_BRAND_ANALYTICS_DROPDOWNS: '/reports/brand-analytics/dropdowns',
  REPORT_SALE_ITEMS: '/reports/sale-items',
  REPORT_EXTERNAL_PURCHASES: '/reports/external-purchases',
  REPORT_SERVICE_TICKETS: '/reports/services',



  // Top Items Report
  REPORT_TOP_ITEMS: '/reports/top-items',
  REPORT_PAYMENT_SUMMARY: '/reports/payment/summary',
  REPORT_TOP_ITEMS_DROPDOWNS: '/reports/top-items/dropdowns',
  REPORT_TOP_ITEMS_DETAIL: (remainId) => `/reports/top-items/${remainId}`,

  // Sale List
  SALE_LIST_CASH: '/sale-list/cash',
  SALE_LIST_CREDIT: '/sale-list/credit',
  REPORT_SALESPERSON: '/sale-list/salesperson-report',
  SALE_LIST_CREDIT_PAY: '/sale-list/credit/pay',
  SALE_LIST_CREDIT_HISTORY: (vno) => `/sale-list/credit/history/${vno}`,
  SALE_LIST_RETURN: '/sale-list/return',
  SALE_LIST_VOUCHER: (vno) => `/sale-list/voucher/${vno}`,
  SALE_LIST_DELETE: (vno) => `/sale-list/voucher/${vno}`,
  SALE_LIST_CUSTOMERS_DROPDOWN: '/sale-list/customers/dropdown',
  SALE_LIST_VOUCHERS_DROPDOWN: '/sale-list/vouchers/dropdown',

  // Customer Payments
  CUSTOMER_PAYMENTS: '/sale-list/customer-payments',
  CUSTOMER_PAYMENTS_DETAIL: (vno) => `/sale-list/customer-payments/${vno}`,
  CUSTOMER_PAYMENTS_DELETE: (id) => `/sale-list/customer-payments/payment/${id}`,

  // Financial Reports
  FINANCIAL_SUMMARY: '/financial/summary',
  FINANCIAL_DETAILS: '/financial/details',

  // Settings
  SETTINGS_PRINT: '/settings/print',
  SETTINGS_PRINT_LOGO: '/settings/print/logo',

  // Health Check
  HEALTH: '/health',

  // Future endpoints
  PRODUCTS: '/products',

  // Branches
  BRANCHES: '/branches',
  BRANCH_BY_ID: (id) => `/branches/${id}`,
  BRANCH_UPLOAD_LOGO: '/branches/upload-logo',

  // Services
  SERVICES: '/services',
  SERVICE_BY_ID: (id) => `/services/${id}`,

  // Technicians / Service Providers
  TECHNICIANS: '/technicians',
  TECHNICIANS_DROPDOWN: '/technicians/dropdown',
  TECHNICIAN_BY_ID: (id) => `/technicians/${id}`,

  // Service Tickets
  SERVICE_TICKETS: '/servicetickets',
  SERVICE_TICKET_BY_ID: (id) => `/servicetickets/${id}`,
  SERVICE_TICKET_UPLOAD: '/servicetickets/upload',
  SERVICE_TICKET_STATUS: (id) => `/servicetickets/${id}/status`,

  // Damages
  DAMAGES: '/damages',
  DAMAGE_BY_ID: (id) => `/damages/${id}`,

  // Stock Adjustments
  ADJUSTMENTS: '/inventory/adjustments',

  // Transfers
  TRANSFERS: '/transfers',
  TRANSFER_BY_ID: (id) => `/transfers/${id}`,
  TRANSFER_INCOMING: '/transfers/incoming',
  TRANSFER_RECEIVE: (id) => `/transfers/${id}/receive`,
};

// Pagination Defaults
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 20, 50, 100, 200, 500],
};

// SWR Configuration
export const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
};

// Get full image URL from path
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;

  // Handle double slash issue: if IMAGE_BASE_URL ends with / and imagePath starts with /
  const baseUrl = API_CONFIG.IMAGE_BASE_URL.endsWith('/')
    ? API_CONFIG.IMAGE_BASE_URL.slice(0, -1)
    : API_CONFIG.IMAGE_BASE_URL;
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  return `${baseUrl}${path}`;
};

// Helper to get auth headers from session
const getAuthHeaders = () => {
  const userId = sessionStorage.getItem('userId');
  const userType = sessionStorage.getItem('userType');
  const branchId = sessionStorage.getItem('branchId');
  
  return {
    'X-User-ID': userId || '',
    'X-User-Type': userType || 'user',
    'X-Branch-ID': branchId || '',
  };
};

// Fetcher function for SWR
export const fetcher = async (url) => {
  const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }

  return response.json();
};

// API Helper Functions
export const apiClient = {
  async get(endpoint, params = {}) {
    // Build URL - handle relative paths
    let urlString = `${API_CONFIG.BASE_URL}${endpoint}`;

    // If BASE_URL is relative, use it as-is; otherwise construct full URL
    if (API_CONFIG.BASE_URL.startsWith('http')) {
      const url = new URL(urlString);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
      urlString = url.toString();
    } else {
      // For relative paths, manually append query params
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key]);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        urlString += (urlString.includes('?') ? '&' : '?') + queryString;
      }
    }

    const response = await fetch(urlString, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async put(endpoint, data) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async delete(endpoint, data) {
    const options = {
      method: 'DELETE',
      headers: {
        ...(data ? { 'Content-Type': 'application/json' } : {}),
        ...getAuthHeaders()
      },
      body: data ? JSON.stringify(data) : undefined,
    };
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
    return response.json();
  },

  // Upload with FormData (for file uploads)
  async postFormData(endpoint, formData) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData, // Don't set Content-Type header, let browser set it with boundary
    });
    return response.json();
  },

  async putFormData(endpoint, formData) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'PUT',
      body: formData,
    });
    return response.json();
  },
};

// Session storage keys
export const SESSION_KEYS = {
  USER_ID: 'userId',
  USERNAME: 'username',
  PERMISSIONS: 'permissions',
  IS_LOGGED_IN: 'isLoggedIn',
  PRINT_SETTINGS: 'printSettings',
  USER_TYPE: 'userType',
  BRANCH_ID: 'branchId',
  BRANCH: 'branch'
};

// Session Management
export const sessionManager = {
  setUser: (user) => {
    sessionStorage.setItem(SESSION_KEYS.USER_ID, user.id);
    sessionStorage.setItem(SESSION_KEYS.USERNAME, user.username);
    sessionStorage.setItem(SESSION_KEYS.PERMISSIONS, JSON.stringify(user.permissions));
    sessionStorage.setItem(SESSION_KEYS.IS_LOGGED_IN, 'true');
    
    if (user.userType) {
      sessionStorage.setItem(SESSION_KEYS.USER_TYPE, user.userType);
    } else {
      sessionStorage.removeItem(SESSION_KEYS.USER_TYPE);
    }
    
    if (user.branchId) {
      sessionStorage.setItem(SESSION_KEYS.BRANCH_ID, user.branchId);
    } else {
      sessionStorage.removeItem(SESSION_KEYS.BRANCH_ID);
    }
    
    if (user.branch) {
      sessionStorage.setItem(SESSION_KEYS.BRANCH, JSON.stringify(user.branch));
    } else {
      sessionStorage.removeItem(SESSION_KEYS.BRANCH);
    }
  },
  
  getUser: () => {
    const userId = sessionStorage.getItem(SESSION_KEYS.USER_ID);
    const username = sessionStorage.getItem(SESSION_KEYS.USERNAME);
    const permissions = sessionStorage.getItem(SESSION_KEYS.PERMISSIONS);
    const isLoggedIn = sessionStorage.getItem(SESSION_KEYS.IS_LOGGED_IN) === 'true';
    
    if (!isLoggedIn || !userId) return null;
    
    return {
      id: userId,
      username: username || '',
      permissions: permissions ? JSON.parse(permissions) : [],
      userType: sessionStorage.getItem(SESSION_KEYS.USER_TYPE),
      branchId: sessionStorage.getItem(SESSION_KEYS.BRANCH_ID),
      branch: sessionStorage.getItem(SESSION_KEYS.BRANCH) ? JSON.parse(sessionStorage.getItem(SESSION_KEYS.BRANCH)) : null
    };
  },
  
  getUserId: () => {
    return sessionStorage.getItem(SESSION_KEYS.USER_ID);
  },
  
  getUsername: () => {
    return sessionStorage.getItem(SESSION_KEYS.USERNAME);
  },
  
  getPermissions: () => {
    const permissions = sessionStorage.getItem(SESSION_KEYS.PERMISSIONS);
    return permissions ? JSON.parse(permissions) : [];
  },
  
  isLoggedIn: () => {
    return sessionStorage.getItem(SESSION_KEYS.IS_LOGGED_IN) === 'true';
  },
  
  hasPermission: (permissionId) => {
    const permissions = sessionManager.getPermissions();
    return permissions.includes(permissionId);
  },
  
  getPrintSettings: () => {
    const settings = sessionStorage.getItem(SESSION_KEYS.PRINT_SETTINGS);
    if (settings) {
      try {
        return JSON.parse(settings);
      } catch {
        return null;
      }
    }
    return null;
  },
  
  getUserType: () => {
    return sessionStorage.getItem(SESSION_KEYS.USER_TYPE);
  },
  
  getBranchId: () => {
    return sessionStorage.getItem(SESSION_KEYS.BRANCH_ID);
  },
  
  setPrintSettings: (settings) => {
    sessionStorage.setItem(SESSION_KEYS.PRINT_SETTINGS, JSON.stringify(settings));
  },
  
  clearSession: () => {
    sessionStorage.removeItem(SESSION_KEYS.USER_ID);
    sessionStorage.removeItem(SESSION_KEYS.USERNAME);
    sessionStorage.removeItem(SESSION_KEYS.PERMISSIONS);
    sessionStorage.removeItem(SESSION_KEYS.IS_LOGGED_IN);
    sessionStorage.removeItem(SESSION_KEYS.PRINT_SETTINGS);
    sessionStorage.removeItem(SESSION_KEYS.USER_TYPE);
    sessionStorage.removeItem(SESSION_KEYS.BRANCH_ID);
    sessionStorage.removeItem(SESSION_KEYS.BRANCH);
  },

  logout: () => {
    sessionManager.clearSession();
    window.location.href = '/login';
  }
};

export default {
  API_CONFIG,
  API_ENDPOINTS,
  PAGINATION_CONFIG,
  SWR_CONFIG,
  fetcher,
  apiClient,
  getImageUrl,
  sessionManager,
};
