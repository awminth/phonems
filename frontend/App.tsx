
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Loading Component
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

// Lazy loaded components
const Login = lazy(() => import('./pages/auth/Login'));
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const POS = lazy(() => import('./pages/dashboard/POS'));
const Expense = lazy(() => import('./pages/dashboard/Expense'));
const UserSetting = lazy(() => import('./pages/dashboard/UserSetting'));
const Customers = lazy(() => import('./pages/dashboard/Customers'));
const Security = lazy(() => import('./pages/dashboard/Security'));
const Reports = lazy(() => import('./pages/dashboard/Reports'));
const Financial = lazy(() => import('./pages/dashboard/Financial'));
const Services = lazy(() => import('./pages/dashboard/Services'));
const CashReport = lazy(() => import('./pages/reports/CashReport'));
const CreditReport = lazy(() => import('./pages/reports/CreditReport'));
const SaleReturnReport = lazy(() => import('./pages/reports/SaleReturnReport'));
const PaymentReport = lazy(() => import('./pages/reports/PaymentReport'));
const TopItemsReport = lazy(() => import('./pages/reports/TopItemsReport'));
const PayableReport = lazy(() => import('./pages/reports/PayableReport'));
const ReceivableReport = lazy(() => import('./pages/reports/ReceivableReport'));
const ImeiHistoryReport = lazy(() => import('./pages/reports/ImeiHistoryReport'));
const BrandPerformanceReport = lazy(() => import('./pages/reports/BrandPerformanceReport'));
const DamageReport = lazy(() => import('./pages/reports/StockDamageReport'));
const TransferReport = lazy(() => import('./pages/reports/StockTransferReport'));
const ReceiveReport = lazy(() => import('./pages/reports/StockReceiveReport'));
const StockAdjustmentReport = lazy(() => import('./pages/reports/StockAdjustmentReport'));
const SaleItemsReport = lazy(() => import('./pages/reports/SaleItemsReport'));
const SellingPriceReport = lazy(() => import('./pages/reports/SellingPriceReport'));
const ProductCategoryReport = lazy(() => import('./pages/reports/ProductCategoryReport'));
const ExternalPurchasesReport = lazy(() => import('./pages/reports/ExternalPurchasesReport'));
const ServiceReport = lazy(() => import('./pages/reports/ServiceReport'));
const SalespersonReport = lazy(() => import('./pages/reports/SalespersonReport'));


const Purchase = lazy(() => import('./pages/purchase/Purchase'));
const PurchaseList = lazy(() => import('./pages/purchase/PurchaseList'));
const InventoryList = lazy(() => import('./pages/purchase/InventoryList'));
const CategoryList = lazy(() => import('./pages/purchase/CategoryList'));
const SupplierList = lazy(() => import('./pages/purchase/SupplierList'));
const RemainderList = lazy(() => import('./pages/purchase/RemainderList'));
const SupplierInOut = lazy(() => import('./pages/purchase/SupplierInOut'));
const PurchaseReturn = lazy(() => import('./pages/purchase/PurchaseReturn'));
const PurchaseReturnList = lazy(() => import('./pages/purchase/PurchaseReturnList'));
const PurchaseVoucherNew = lazy(() => import('./pages/purchase/PurchaseVoucherNew'));
const TransferPage = lazy(() => import('./pages/purchase/TransferPage'));
const ReceivePage = lazy(() => import('./pages/purchase/ReceivePage'));
const SaleDashboard = lazy(() => import('./pages/sale/SaleDashboard'));
const CashSaleList = lazy(() => import('./pages/sale/CashSaleList'));
const CreditSaleList = lazy(() => import('./pages/sale/CreditSaleList'));
const SaleReturnList = lazy(() => import('./pages/sale/SaleReturnList'));
const SaleReturn = lazy(() => import('./pages/sale/SaleReturn'));
const DamageList = lazy(() => import('./pages/sale/DamageList'));
const DamageNew = lazy(() => import('./pages/sale/DamageNew'));
const PostCreatorAI = lazy(() => import('./pages/dashboard/PostCreatorAI'));
const Branch = lazy(() => import('./pages/dashboard/Branch'));

const App: React.FC = () => {
  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Dashboard Routes - Default to POS */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<POS />} />
          </Route>

          {/* Post Creator AI - Standalone Page */}
          <Route path="/dashboard/ai" element={<PostCreatorAI />} />

          {/* Sale Module */}
          <Route path="/sale" element={<SaleDashboard />} />
          <Route path="/sale/cash" element={<CashSaleList />} />
          <Route path="/sale/credit" element={<CreditSaleList />} />
          <Route path="/sale/return" element={<SaleReturnList />} />
          <Route path="/sale-return/new" element={<SaleReturn />} />
          <Route path="/sale/damage" element={<DamageList />} />
          <Route path="/sale/damage/new" element={<DamageNew />} />
          <Route path="/sale/new" element={<POS />} /> {/* Keep as alias if needed, or for direct access */}

          {/* Standalone Modules */}
          <Route path="/expense" element={<Expense />} />
          <Route path="/users" element={<UserSetting />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/security" element={<Security />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/services" element={<Services />} />
          <Route path="/branches" element={<DashboardLayout />}>
            <Route index element={<Branch />} />
          </Route>

          {/* Reports */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/cash" element={<CashReport />} />
          <Route path="/reports/credit" element={<CreditReport />} />
          <Route path="/reports/return" element={<SaleReturnReport />} />
          <Route path="/reports/payment" element={<PaymentReport />} />
          <Route path="/reports/top-items" element={<TopItemsReport />} />
          <Route path="/reports/payable" element={<PayableReport />} />
          <Route path="/reports/receivable" element={<ReceivableReport />} />
          <Route path="/reports/imei-history" element={<ImeiHistoryReport />} />
          <Route path="/reports/brand-analytics" element={<BrandPerformanceReport />} />
          <Route path="/reports/damage" element={<DamageReport />} />
          <Route path="/reports/transfer" element={<TransferReport />} />
          <Route path="/reports/receive" element={<ReceiveReport />} />
          <Route path="/reports/adjustment" element={<StockAdjustmentReport />} />
          <Route path="/reports/sale-items" element={<SaleItemsReport />} />
          <Route path="/reports/selling-price" element={<SellingPriceReport />} />
          <Route path="/reports/product-category" element={<ProductCategoryReport />} />
          <Route path="/reports/external-purchases" element={<ExternalPurchasesReport />} />
          <Route path="/reports/service" element={<ServiceReport />} />
          <Route path="/reports/salesperson" element={<SalespersonReport />} />



          {/* Purchase Module */}
          <Route path="/purchase" element={<Purchase />} />
          <Route path="/purchase/list" element={<PurchaseList />} />
          <Route path="/purchase/inventory" element={<InventoryList />} />
          <Route path="/purchase/remainder" element={<RemainderList />} />
          <Route path="/purchase/category" element={<CategoryList />} />
          <Route path="/purchase/company" element={<SupplierList />} />
          <Route path="/purchase/supplier-in-out" element={<SupplierInOut />} />
          <Route path="/purchase/return-list" element={<PurchaseReturnList />} />
          <Route path="/purchase/return" element={<PurchaseReturn />} />
          <Route path="/purchase/return/edit/:id" element={<PurchaseReturn />} />
          <Route path="/purchase/voucher/new" element={<PurchaseVoucherNew />} />
          <Route path="/purchase/voucher/edit/:id" element={<PurchaseVoucherNew />} />
          <Route path="/purchase/transfer" element={<TransferPage />} />
          <Route path="/purchase/receive" element={<ReceivePage />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <HelpChat />
      </Suspense>
    </HashRouter>
  );
};

export default App;
