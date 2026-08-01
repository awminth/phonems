require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const { pool, testConnection } = require('./config/database');
const redis = require('./config/redis');
const { createUploadDir } = require('./config/upload');

// Import Routes
const categoryRoutes = require('./routes/category.routes');
const supplierRoutes = require('./routes/supplier.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const expenseRoutes = require('./routes/expense.routes');
const expenseCategoryRoutes = require('./routes/expense-category.routes');
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const logRoutes = require('./routes/log.routes');
const posRoutes = require('./routes/pos.routes');
const customerRoutes = require('./routes/customer.routes');
const saleRoutes = require('./routes/sale.routes');
const creditReportRoutes = require('./routes/credit-report.routes');
const cashReportRoutes = require('./routes/cash-report.routes');
const returnReportRoutes = require('./routes/return-report.routes');
const topItemsReportRoutes = require('./routes/top-items-report.routes');
const externalPurchasesReportRoutes = require('./routes/external-purchases-report.routes');
const saleListRoutes = require('./routes/sale-list.routes');
const financialRoutes = require('./routes/financial.routes');
const settingRoutes = require('./routes/setting.routes');
const purchaseReturnRoutes = require('./routes/purchase-return.routes');
const purchaseVoucherRoutes = require('./routes/purchase-voucher.routes');
const paymentReportRoutes = require('./routes/payment-report.routes');
const balanceReportRoutes = require('./routes/balance-report.routes');
const productRoutes = require('./routes/product.routes');
const imeiHistoryRoutes = require('./routes/imei-history.routes');
const branchRoutes = require('./routes/branch.routes');
const brandAnalyticsRoutes = require('./routes/brand-analytics.routes');
const damageRoutes = require('./routes/damage.routes');
const transferRoutes = require('./routes/transfer.routes');
const saleItemReportRoutes = require('./routes/sale-item-report.routes');
const serviceReportRoutes = require('./routes/service-report.routes');
const serviceRoutes = require('./routes/service.routes');
const serviceticketRoutes = require('./routes/serviceticket.routes');
const technicianRoutes = require('./routes/technician.routes');
const authMiddleware = require('./middlewares/auth');


const app = express();
const PORT = Number(process.env.BACKEND_PORT) || Number(process.env.PORT) || 1501;

// Ensure upload directories exist
createUploadDir('public/assets/purchase');
createUploadDir('public/assets/printsetting');
createUploadDir('public/assets/service');

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 1. Frontend Build Static Files (Must come first to serve dist/assets)
app.use(express.static(path.join(__dirname, '../dist')));
// 2. Public Assets (for uploaded files like purchase images)
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// 3. API Routes
app.use('/api', authMiddleware);

app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports/credit', creditReportRoutes);
app.use('/api/reports/cash', cashReportRoutes);
app.use('/api/reports/return', returnReportRoutes);
app.use('/api/reports/top-items', topItemsReportRoutes);
app.use('/api/reports/external-purchases', externalPurchasesReportRoutes);
app.use('/api/sale-list', saleListRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/purchase-returns', purchaseReturnRoutes);
app.use('/api/purchase-vouchers', purchaseVoucherRoutes);
app.use('/api/reports/payment', paymentReportRoutes);
app.use('/api/reports/balance', balanceReportRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reports/imei-history', imeiHistoryRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/reports/brand-analytics', brandAnalyticsRoutes);
app.use('/api/damages', damageRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/reports/sale-items', saleItemReportRoutes);
app.use('/api/reports/services', serviceReportRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/servicetickets', serviceticketRoutes);
app.use('/api/technicians', technicianRoutes);


// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    const redisStatus = redis.status === 'ready';
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. API 404 Handler (Only for /api/* routes that don't match above)
// ဒီကောင်က API route အမှားရိုက်ရင် JSON နဲ့ပြန်ဖို့ပါ
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API Route not found'
  });
});

// 4. Frontend Catch-all Handler (For SPA Routing - React/Vue/Angular)
// API မဟုတ်တဲ့ တခြား route တွေကို index.html ပြန်ပေးပါမယ်
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// 5. Global Error Handler (Should be last)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  // If the error happens in an API route, send JSON
  if (req.url.startsWith('/api')) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  } else {
    // If error happens elsewhere, generic response
    res.status(500).send('Something went wrong!');
  }
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('✅ Database connected successfully');
  } else {
    console.log('❌ Database connection failed');
  }

  // Optional chaining check in case redis isn't ready immediately
  console.log(`📦 Redis status: ${redis?.status || 'unknown'}`);
});

module.exports = app;