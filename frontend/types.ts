
import React from 'react';

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  remark: string;
}

export interface PurchaseItem {
  id: string;
  code: string;
  name: string;
  qty: number;
  purchasePrice: number;
  sellPrice: number;
  categoryId: string;
  categoryName: string;
  supplierId: string;
  supplierName: string;
  date: string;
  image: string | null; // Base64 or URL
  branchName?: string;
  specification?: string;
}

export interface InventoryItem {
    id: string;
    code: string;
    name: string;
    qty: number;
    purchasePrice: number;
    sellPrice: number;
    categoryName: string;
    supplierName: string;
    image: string | null;
    isSerialized?: boolean;
    isService?: boolean;
    isSparePart?: boolean;
    branchName?: string;
    minStockQty?: number;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  color?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  }

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  date: string;
  branchName?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string; // Optional for display, required for creation
  isActive: boolean;
  permissions: string[]; // IDs of the sidebar items
  userType: 'admin' | 'user' | 'manager';
  branchId: string | null;
  branchName?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email: string;
}

export interface CustomerPayment {
  id: string;
  date: string;
  vno: string; // Voucher No
  customerId: string;
  customerName: string;
  total: number;
  pay: number;
  amount: number; // Balance or Net Amount
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  description: string;
  date: string;
  ip: string;
}

export interface SaleReportItem {
  id: string;
  date: string;
  vno: string;
  customerName: string;
  subTotal: number;
  discount: number;
  tax: number;
  total: number;
  cash: number;
  refund: number;
  cashier: string;
  branchName?: string;
}

export interface TopSellingItem {
  id: string;
  code: string;
  name: string;
  qty: number;
  total: number;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  date: string;
}

export interface SupplierDetailItem {
  id: string;
  supplierId: string;
  supplierName: string;
  itemName: string;
  totalAmount: number;
  date: string;
}
export interface MasterProduct {
    id: string;
    code: string;
    name: string;
    categoryId: string;
    categoryName: string;
    supplierId: string;
    supplierName: string;
    isSerialized: boolean;
    isService?: boolean;
    isSparePart?: boolean;
    sellingPrice: number;
    sellPrice?: number;
    minStockQty: number;
}

export interface Branch {
  id: string;
  branchId: string;
  name: string;
  invoiceHeaderName: string;
  address: string;
  phoneNo: string;
  logo: string;
  includeLogo: boolean;
  footerMessage: string;
  warrantyPolicy: string;
}

export interface Transfer {
  id: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  transferDate: string;
  receiveDate: string | null;
  status: 'Pending' | 'Shipped' | 'Received' | 'Cancelled';
  senderId: string;
  senderName: string;
  receiverId: string | null;
  receiverName: string | null;
  remark: string | null;
  itemCount: number;
  items?: TransferDetail[];
}

export interface TransferDetail {
  id: string;
  transferId: string;
  productId: string;
  productCode: string;
  productName: string;
  imei: string | null;
  qty: number;
  stockId?: string; // p_item_id from tblpurchase_items
}

export interface Service {
  id: string;
  serviceCode: string;
  serviceName: string;
  price: number;
  description: string;
  status: 'Active' | 'Inactive';
  branchId: string | null;
  branchName?: string;
  isActive: boolean;
}

export interface Technician {
  id: string;
  name: string;
  phone?: string | null;
  specialty?: string | null;
  note?: string | null;
  status: 'Active' | 'Inactive';
  branchId: string | null;
  branchName?: string;
  isActive: boolean;
}
