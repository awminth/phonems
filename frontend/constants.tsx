


import React from 'react';
import { Product, Category, Supplier, PurchaseItem, InventoryItem, Expense, ExpenseCategory, User, Customer, CustomerPayment, ActivityLog, SaleReportItem, TopSellingItem, SupplierTransaction, SupplierDetailItem } from './types';

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Shoes' },
  { id: '2', name: 'Bags' },
  { id: '3', name: 'Wallets' },
  { id: '4', name: 'Belts' },
  { id: '5', name: 'Cosmetic' },
  { id: '6', name: 'Accessories' },
];

export const MOCK_SUPPLIERS: Supplier[] = [
  { 
    id: 's1', 
    name: 'Global Fashion Ltd', 
    address: '123 Fashion St, Yangon', 
    email: 'contact@globalfashion.com', 
    phone: '0912345678', 
    remark: 'Main bag supplier' 
  },
  { 
    id: 's2', 
    name: 'Yangon Leather Co', 
    address: '45 Leather Rd, Mandalay', 
    email: 'sales@ygnleather.com', 
    phone: '0987654321', 
    remark: 'Leather goods only' 
  },
  { 
    id: 's3', 
    name: 'Beauty World Import', 
    address: '78 Cosmetic Ave, Yangon', 
    email: 'info@beautyworld.com', 
    phone: '0911223344', 
    remark: 'Imported cosmetics' 
  },
  { 
    id: 's4', 
    name: 'Mandalay Textiles', 
    address: '89 Textile Zone, Mandalay', 
    email: 'support@mdytextile.com', 
    phone: '0955667788', 
    remark: 'Fabrics and textiles' 
  },
  {
    id: 's5',
    name: 'MMS Branded Collection',
    address: 'Yangon',
    email: 'mms@gmail.com',
    phone: '0999887766',
    remark: ''
  }
];

export const MOCK_PURCHASE_LIST: PurchaseItem[] = [
  {
    id: '1',
    code: 'PUR-001',
    name: 'Bonia Bag Luxury',
    qty: 10,
    purchasePrice: 850000,
    sellPrice: 960000,
    categoryId: '2',
    categoryName: 'Bags',
    supplierId: 's1',
    supplierName: 'Global Fashion Ltd',
    date: '2023-10-01',
    image: 'https://picsum.photos/200/200?random=1',
  },
  {
    id: '2',
    code: 'PUR-002',
    name: 'Fitflop Sandals',
    qty: 25,
    purchasePrice: 300000,
    sellPrice: 388000,
    categoryId: '1',
    categoryName: 'Shoes',
    supplierId: 's2',
    supplierName: 'Yangon Leather Co',
    date: '2023-10-05',
    image: 'https://picsum.photos/200/200?random=3',
  },
  {
    id: '3',
    code: 'PUR-003',
    name: 'Pink Perfume',
    qty: 50,
    purchasePrice: 90000,
    sellPrice: 120000,
    categoryId: '5',
    categoryName: 'Cosmetic',
    supplierId: 's3',
    supplierName: 'Beauty World Import',
    date: '2023-10-12',
    image: 'https://picsum.photos/200/200?random=7',
  },
  {
    id: '4',
    code: 'PUR-004',
    name: 'Leather Belt',
    qty: 15,
    purchasePrice: 40000,
    sellPrice: 65000,
    categoryId: '4',
    categoryName: 'Belts',
    supplierId: 's2',
    supplierName: 'Yangon Leather Co',
    date: '2023-10-15',
    image: null,
  },
   {
    id: '5',
    code: 'PUR-005',
    name: 'MK Wallet',
    qty: 5,
    purchasePrice: 400000,
    sellPrice: 450000,
    categoryId: '3',
    categoryName: 'Wallets',
    supplierId: 's1',
    supplierName: 'Global Fashion Ltd',
    date: '2023-10-18',
    image: null,
  },
];

export const MOCK_INVENTORY: InventoryItem[] = [
    {
      id: 'inv1',
      code: 'BA-280902',
      name: 'Bonia Bag Luxury',
      qty: 12,
      purchasePrice: 850000,
      sellPrice: 960000,
      categoryName: 'Bags',
      supplierName: 'Global Fashion Ltd',
      image: 'https://picsum.photos/200/200?random=1',
    },
    {
      id: 'inv2',
      code: 'BA-280901',
      name: 'Bonia Handbag Gold',
      qty: 4,
      purchasePrice: 800000,
      sellPrice: 895000,
      categoryName: 'Bags',
      supplierName: 'Global Fashion Ltd',
      image: 'https://picsum.photos/200/200?random=2',
    },
    {
      id: 'inv3',
      code: 'FF-260902',
      name: 'Fitflop Sandals',
      qty: 8,
      purchasePrice: 300000,
      sellPrice: 388000,
      categoryName: 'Shoes',
      supplierName: 'Yangon Leather Co',
      image: 'https://picsum.photos/200/200?random=3',
    },
    {
      id: 'inv4',
      code: 'MK-260902',
      name: 'MK Tote Black',
      qty: 2,
      purchasePrice: 600000,
      sellPrice: 675000,
      categoryName: 'Bags',
      supplierName: 'Beauty World Import',
      image: 'https://picsum.photos/200/200?random=4',
    },
    {
      id: 'inv5',
      code: 'CQ-190901',
      name: 'Pink Perfume',
      qty: 45,
      purchasePrice: 90000,
      sellPrice: 120000,
      categoryName: 'Cosmetic',
      supplierName: 'Beauty World Import',
      image: 'https://picsum.photos/200/200?random=7',
    },
  ];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    code: 'BA-280902',
    name: 'Bonia Bag Luxury',
    price: 960000,
    category: 'Bags',
    imageUrl: 'https://picsum.photos/200/200?random=1',
  },
  {
    id: 'p2',
    code: 'BA-280901',
    name: 'Bonia Handbag Gold',
    price: 895000,
    category: 'Bags',
    imageUrl: 'https://picsum.photos/200/200?random=2',
  },
  {
    id: 'p3',
    code: 'FF-260902',
    name: 'Fitflop Sandals',
    price: 388000,
    category: 'Shoes',
    imageUrl: 'https://picsum.photos/200/200?random=3',
  },
  {
    id: 'p4',
    code: 'MK-260902',
    name: 'MK Tote Black',
    price: 675000,
    category: 'Bags',
    imageUrl: 'https://picsum.photos/200/200?random=4',
  },
  {
    id: 'p5',
    code: 'MK-190902',
    name: 'MK Belt Silver',
    price: 450000,
    category: 'Belts',
    imageUrl: 'https://picsum.photos/200/200?random=5',
  },
  {
    id: 'p6',
    code: 'MK-190901',
    name: 'MK Wallet New',
    price: 450000,
    category: 'Wallets',
    imageUrl: 'https://picsum.photos/200/200?random=6',
  },
  {
    id: 'p7',
    code: 'CQ-190901',
    name: 'Pink Perfume',
    price: 120000,
    category: 'Cosmetic',
    imageUrl: 'https://picsum.photos/200/200?random=7',
  },
  {
    id: 'p8',
    code: 'BA-190908',
    name: 'Bonia Clutch',
    price: 250000,
    category: 'Bags',
    imageUrl: 'https://picsum.photos/200/200?random=8',
  },
  {
    id: 'p9',
    code: 'BA-020917',
    name: 'Leather Loafers',
    price: 310000,
    category: 'Shoes',
    imageUrl: 'https://picsum.photos/200/200?random=9',
  },
];

export const MOCK_EXPENSE_CATEGORIES: ExpenseCategory[] = [
    { id: 'ec1', name: 'Utility Bills' },
    { id: 'ec2', name: 'Staff Salary' },
    { id: 'ec3', name: 'Maintenance' },
    { id: 'ec4', name: 'Office Supplies' },
    { id: 'ec5', name: 'Transportation' },
];

export const MOCK_EXPENSES: Expense[] = [
    { id: 'e1', categoryId: 'ec1', categoryName: 'Utility Bills', description: 'Electricity Bill Oct 2023', amount: 150000, date: '2023-10-25' },
    { id: 'e2', categoryId: 'ec4', categoryName: 'Office Supplies', description: 'Printer Paper & Ink', amount: 45000, date: '2023-10-24' },
    { id: 'e3', categoryId: 'ec5', categoryName: 'Transportation', description: 'Delivery Charges', amount: 20000, date: '2023-10-24' },
    { id: 'e4', categoryId: 'ec3', categoryName: 'Maintenance', description: 'AC Repair', amount: 35000, date: '2023-10-22' },
    { id: 'e5', categoryId: 'ec2', categoryName: 'Staff Salary', description: 'Advance for Ma Hla', amount: 50000, date: '2023-10-20' },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', username: 'admin', isActive: true, permissions: ['sale', 'purchase', 'reports', 'setting', 'expense', 'user', 'financial', 'customer', 'ai'], userType: 'admin', branchId: null },
  { id: 'u2', username: 'cashier1', isActive: true, permissions: ['sale', 'customer'], userType: 'user', branchId: null },
  { id: 'u3', username: 'manager', isActive: true, permissions: ['sale', 'purchase', 'reports', 'expense', 'customer'], userType: 'manager', branchId: null },
  { id: 'u4', username: 'staff_temp', isActive: false, permissions: ['sale'], userType: 'user', branchId: null },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'U Ba Hla', phone: '0912345678', address: '123 Sule Rd, Yangon', email: 'bh@gmail.com' },
  { id: 'c2', name: 'Daw Mya Mya', phone: '0988776655', address: '45 Inya Rd, Yangon', email: 'mya@yahoo.com' },
  { id: 'c3', name: 'Ko Aung', phone: '0911221122', address: 'Mandalay', email: '' },
  { id: 'c4', name: 'Ma Su', phone: '0933445566', address: 'Pyin Oo Lwin', email: 'su@gmail.com' },
];

export const MOCK_CUSTOMER_PAYMENTS: CustomerPayment[] = [
  { id: 'cp1', date: '2023-10-25', vno: 'INV-00123', customerId: 'c1', customerName: 'U Ba Hla', total: 150000, pay: 150000, amount: 0 },
  { id: 'cp2', date: '2023-10-24', vno: 'INV-00120', customerId: 'c2', customerName: 'Daw Mya Mya', total: 85000, pay: 50000, amount: 35000 },
  { id: 'cp3', date: '2023-10-23', vno: 'INV-00115', customerId: 'c1', customerName: 'U Ba Hla', total: 200000, pay: 200000, amount: 0 },
  { id: 'cp4', date: '2023-10-22', vno: 'INV-00110', customerId: 'c3', customerName: 'Ko Aung', total: 45000, pay: 0, amount: 45000 },
];

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  { id: '1', user: 'admin', action: 'Login', description: 'User logged in to system', date: '2023-10-26 09:00:00', ip: '192.168.1.10' },
  { id: '2', user: 'admin', action: 'Sale', description: 'Created Invoice INV-00123', date: '2023-10-26 09:15:23', ip: '192.168.1.10' },
  { id: '3', user: 'cashier1', action: 'Login', description: 'User logged in', date: '2023-10-26 10:00:00', ip: '192.168.1.15' },
  { id: '4', user: 'admin', action: 'Update Item', description: 'Updated price for Item P001', date: '2023-10-26 11:30:45', ip: '192.168.1.10' },
  { id: '5', user: 'manager', action: 'Report', description: 'Exported Sales Report', date: '2023-10-26 14:20:10', ip: '192.168.1.12' },
  { id: '6', user: 'admin', action: 'User Update', description: 'Changed password for cashier1', date: '2023-10-26 16:05:00', ip: '192.168.1.10' },
  { id: '7', user: 'admin', action: 'Logout', description: 'User logged out', date: '2023-10-26 17:00:00', ip: '192.168.1.10' },
  { id: '8', user: 'cashier1', action: 'Sale', description: 'Created Invoice INV-00124', date: '2023-10-26 10:15:00', ip: '192.168.1.15' },
  { id: '9', user: 'cashier1', action: 'Sale', description: 'Created Invoice INV-00125', date: '2023-10-26 10:30:00', ip: '192.168.1.15' },
  { id: '10', user: 'admin', action: 'Login', description: 'User logged in', date: '2023-10-27 08:55:00', ip: '192.168.1.10' },
  { id: '11', user: 'admin', action: 'Inventory', description: 'Added 50 qty to Item P002', date: '2023-10-27 09:10:00', ip: '192.168.1.10' },
  { id: '12', user: 'manager', action: 'Login', description: 'User logged in', date: '2023-10-27 09:30:00', ip: '192.168.1.12' },
];

export const MOCK_SALE_REPORTS: SaleReportItem[] = [
    { id: '1', date: '23-10-2025', vno: '20251023-131818', customerName: 'Thae Thae', subTotal: 12000, discount: 0, tax: 0, total: 12000, cash: 15000, refund: 3000, cashier: 'admin' },
    { id: '2', date: '22-10-2025', vno: '20251022-143051', customerName: 'Mg Ba', subTotal: 942840, discount: 0, tax: 69840, total: 942840, cash: 942840, refund: 0, cashier: 'admin' },
    { id: '3', date: '22-10-2025', vno: '20251022-143001', customerName: 'Cherry San', subTotal: 1058400, discount: 0, tax: 78400, total: 1058400, cash: 1058400, refund: 0, cashier: 'admin' },
    { id: '4', date: '11-10-2025', vno: '20251011-221038', customerName: 'Myat Myo', subTotal: 1397500, discount: 0, tax: 0, total: 1397500, cash: 1500000, refund: 102500, cashier: 'admin' },
    { id: '5', date: '09-10-2025', vno: '20251009-223924', customerName: 'Myat Myo', subTotal: 1885000, discount: 0, tax: 0, total: 1885000, cash: 2000000, refund: 115000, cashier: 'admin' },
    { id: '6', date: '29-09-2025', vno: '20250929-222752', customerName: 'Myat Myo', subTotal: 125000, discount: 0, tax: 0, total: 125000, cash: 125000, refund: 0, cashier: 'admin' },
    { id: '7', date: '29-09-2025', vno: '20250929-221346', customerName: 'Myat Myo', subTotal: 1155000, discount: 0, tax: 0, total: 1155000, cash: 1155000, refund: 0, cashier: 'admin' },
    { id: '8', date: '29-09-2025', vno: '20250929-221124', customerName: 'Myat Myo', subTotal: 450000, discount: 0, tax: 0, total: 450000, cash: 450000, refund: 0, cashier: 'admin' },
    { id: '9', date: '28-09-2025', vno: '20250928-214158', customerName: 'Myat Myo', subTotal: 625000, discount: 0, tax: 0, total: 625000, cash: 700000, refund: 75000, cashier: 'admin' },
    { id: '10', date: '28-09-2025', vno: '20250928-105109', customerName: 'New Customer', subTotal: 325000, discount: 0, tax: 0, total: 325000, cash: 320000, refund: 5000, cashier: 'admin' },
];

export const MOCK_CREDIT_REPORTS: SaleReportItem[] = [
    { id: 'c1', date: '23-10-2025', vno: '20251023-CRED01', customerName: 'U Ba Hla', subTotal: 250000, discount: 0, tax: 0, total: 250000, cash: 50000, refund: 0, cashier: 'admin' },
    { id: 'c2', date: '22-10-2025', vno: '20251022-CRED02', customerName: 'Daw Mya', subTotal: 150000, discount: 5000, tax: 0, total: 145000, cash: 0, refund: 0, cashier: 'cashier1' },
    { id: 'c3', date: '21-10-2025', vno: '20251021-CRED03', customerName: 'Ko Aung', subTotal: 300000, discount: 0, tax: 0, total: 300000, cash: 100000, refund: 0, cashier: 'admin' },
];

export const MOCK_SALE_RETURN_REPORTS: SaleReportItem[] = [
    { id: 'r1', date: '23-10-2025', vno: '20251023-RET01', customerName: 'Thae Thae', subTotal: 12000, discount: 0, tax: 0, total: 12000, cash: 0, refund: 12000, cashier: 'admin' },
    { id: 'r2', date: '20-10-2025', vno: '20251020-RET02', customerName: 'New Customer', subTotal: 50000, discount: 0, tax: 0, total: 50000, cash: 0, refund: 50000, cashier: 'cashier1' },
];

export const MOCK_TOP_SELLING_ITEMS: TopSellingItem[] = [
  { id: '1', code: 'MK-190901', name: 'MK Wallet New (Black) (Silver)', qty: 3, total: 3840000 },
  { id: '2', code: 'MK-110904', name: 'MK Wallet (White) (Brown) (Black)', qty: 2, total: 1552000 },
  { id: '3', code: 'BA-280902', name: 'Boniaအနက်ကွပ်ညိုလေး', qty: 2, total: 3840000 },
  { id: '4', code: 'BA-30004', name: 'Bonia Wallet (White) (Black)', qty: 2, total: 1700000 },
  { id: '5', code: 'BA-020913', name: 'Bonia Shoe (Logo) Cream', qty: 2, total: 2060000 },
  { id: '6', code: 'FF-020907', name: 'Fitflop (ကျောက်ပါအပါး) (36) (37) Black', qty: 2, total: 1260000 },
  { id: '7', code: 'DJ-25002', name: 'David Jones Beige (ပုံ့း)', qty: 1, total: 170000 },
  { id: '8', code: 'VS-110901', name: 'Versace Belt ရွှေ', qty: 1, total: 1550000 },
  { id: '9', code: 'BA-30007', name: 'Bonia New နက်', qty: 1, total: 985000 },
  { id: '10', code: 'MK-25010', name: 'MK Black (ရေပုံး)', qty: 1, total: 570000 },
];

export const MOCK_SUPPLIER_TRANSACTIONS: SupplierTransaction[] = [
  { id: 'st1', supplierId: 's5', supplierName: 'MMS Branded Collection', totalAmount: 500000, date: '10-10-2025' },
  { id: 'st2', supplierId: 's5', supplierName: 'MMS Branded Collection', totalAmount: 500000, date: '10-10-2025' },
  { id: 'st3', supplierId: 's5', supplierName: 'MMS Branded Collection', totalAmount: 1, date: '16-03-2025' },
];

export const MOCK_SUPPLIER_DETAILS: SupplierDetailItem[] = [
  { id: 'sd1', supplierId: 's5', supplierName: 'MMS Branded Collection', itemName: 'Shirt', totalAmount: 80000, date: '23-10-2025' },
  { id: 'sd2', supplierId: 's5', supplierName: 'MMS Branded Collection', itemName: 'Shirt', totalAmount: 8000, date: '23-10-2025' },
  { id: 'sd3', supplierId: 's5', supplierName: 'MMS Branded Collection', itemName: 'Boniaအနက်ကွပ်ညိုလေး', totalAmount: 730000, date: '28-09-2025' },
  { id: 'sd4', supplierId: 's5', supplierName: 'MMS Branded Collection', itemName: 'Boniaညိုနှစ်ရောင်စပ်', totalAmount: 795000, date: '28-09-2025' },
  { id: 'sd5', supplierId: 's5', supplierName: 'MMS Branded Collection', itemName: 'Fitflop အမြင့် အဖြူ', totalAmount: 268000, date: '26-09-2025' },
  { id: 'sd6', supplierId: 's5', supplierName: 'MMS Branded Collection', itemName: 'MK ရေပုံးလေးထောင့်', totalAmount: 570000, date: '26-09-2025' },
];
