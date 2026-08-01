const pool = require('../config/database').pool;
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'financial';

// Get financial summary with date filters
const getFinancialSummary = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const { userType, branchId } = req.user;
    const cacheKey = `${CACHE_PREFIX}:summary:${fromDate || 'all'}:${toDate || 'all'}:${branchId || 'all'}`;

    // Try to get from cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    // Build date conditions
    let voucherDateCondition = '1=1';
    let saleDateCondition = '1=1';
    let expenseDateCondition = '1=1';
    let purchaseReturnDateCondition = '1=1';
    const voucherParams = [];
    const saleParams = [];
    const expenseParams = [];
    const purchaseReturnParams = [];

    let branchCondition = '1=1';
    const branchParams = [];

    if (userType !== 'admin' && branchId) {
      branchCondition = 'v.BranchID = ?';
      branchParams.push(branchId);
    }

    if (fromDate) {
      voucherDateCondition += ' AND v.Date >= ?';
      saleDateCondition += ' AND s.Date >= ?';
      expenseDateCondition += ' AND e.Date >= ?';
      purchaseReturnDateCondition += ' AND prv.Date >= ?';
      voucherParams.push(fromDate);
      saleParams.push(fromDate);
      expenseParams.push(fromDate);
      purchaseReturnParams.push(fromDate);
    }

    if (toDate) {
      voucherDateCondition += ' AND v.Date <= ?';
      saleDateCondition += ' AND s.Date <= ?';
      expenseDateCondition += ' AND e.Date <= ?';
      purchaseReturnDateCondition += ' AND prv.Date <= ?';
      voucherParams.push(toDate + ' 23:59:59');
      saleParams.push(toDate + ' 23:59:59');
      expenseParams.push(toDate + ' 23:59:59');
      purchaseReturnParams.push(toDate + ' 23:59:59');
    }

    // 1. Total Sales: Sum of Total from tblvoucher where Chk='Cash' or 'Credit'
    const [salesResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(Total), 0) as totalSales
       FROM tblvoucher v
       WHERE (v.Chk = 'Cash' OR v.Chk = 'Credit') AND ${voucherDateCondition} AND ${branchCondition.replace('v.', 'v.')}`,
      [...voucherParams, ...branchParams]
    );
    const totalSales = Number(salesResult[0]?.totalSales) || 0;

    // 2. Total Purchase Cost: Sum of (Qty * PurchasePrice) from tblsale joined with tblproduct
    const [purchaseResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(s.Qty * r.PurchasePrice), 0) as totalPurchaseCost
       FROM tblsale s
       INNER JOIN tblproduct r ON s.RemainID = r.AID
       WHERE ${saleDateCondition} AND ${branchCondition.replace('v.', 's.')}`,
      [...saleParams, ...branchParams]
    );
    const totalPurchaseCost = Number(purchaseResult[0]?.totalPurchaseCost) || 0;

    // 3. Total Expense: Sum of Amount from tblexpense
    const [expenseResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(e.Amount), 0) as totalExpense
       FROM tblexpense e
       WHERE ${expenseDateCondition} AND ${branchCondition.replace('v.', 'e.')}`,
      [...expenseParams, ...branchParams]
    );
    const totalExpense = Number(expenseResult[0]?.totalExpense) || 0;

    // 4. Total Purchase Return: Sum of ReturnAmount from tblpurchase_return_voucher
    const [purchaseReturnResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(prv.ReturnAmount), 0) as totalPurchaseReturn
       FROM tblpurchase_return_voucher prv
       WHERE ${purchaseReturnDateCondition} AND ${branchCondition.replace('v.', 'prv.')}`,
      [...purchaseReturnParams, ...branchParams]
    );
    const totalPurchaseReturn = Number(purchaseReturnResult[0]?.totalPurchaseReturn) || 0;

    // 5. Total Sale Return: Sum of RefundTotal from tblsale_return_voucher
    let saleReturnDateCondition = '1=1';
    const saleReturnParams = [];
    if (fromDate) {
      saleReturnDateCondition += ' AND Date >= ?';
      saleReturnParams.push(fromDate);
    }
    if (toDate) {
      saleReturnDateCondition += ' AND Date <= ?';
      saleReturnParams.push(toDate + ' 23:59:59');
    }

    const [saleReturnResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(RefundTotal), 0) as totalSaleReturn
       FROM tblsale_return_voucher
       WHERE ${saleReturnDateCondition} AND ${branchCondition.replace('v.', '')}`,
      [...saleReturnParams, ...branchParams]
    );
    const totalSaleReturn = Number(saleReturnResult[0]?.totalSaleReturn) || 0;

    // 5b. Total Sale Return Cost: Sum of (sr.ReturnQty * r.PurchasePrice) from tblsale_return sr joined with tblproduct r
    let srDateCondition = '1=1';
    const srParams = [];
    if (fromDate) {
      srDateCondition += ' AND sr.Date >= ?';
      srParams.push(fromDate);
    }
    if (toDate) {
      srDateCondition += ' AND sr.Date <= ?';
      srParams.push(toDate + ' 23:59:59');
    }

    const [saleReturnCostResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(sr.ReturnQty * r.PurchasePrice), 0) as totalSaleReturnCost
       FROM tblsale_return sr
       INNER JOIN tblproduct r ON sr.RemainID = r.AID
       WHERE ${srDateCondition} AND ${branchCondition.replace('v.', 'sr.')}`,
      [...srParams, ...branchParams]
    );
    const totalSaleReturnCost = Number(saleReturnCostResult[0]?.totalSaleReturnCost) || 0;

    // 5c. Total Service Revenue: Sum of TotalAmount from tblserviceticket s where s.Status = 'Picked-up'
    let serviceDateCondition = 's.Status = \'Picked-up\'';
    const serviceParams = [];
    if (fromDate) {
      serviceDateCondition += ' AND s.UpdatedAt >= ?';
      serviceParams.push(fromDate);
    }
    if (toDate) {
      serviceDateCondition += ' AND s.UpdatedAt <= ?';
      serviceParams.push(toDate + ' 23:59:59');
    }

    const [serviceResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(s.TotalAmount), 0) as totalServiceRevenue
       FROM tblserviceticket s
       WHERE ${serviceDateCondition} AND ${branchCondition.replace('v.BranchID', 's.BranchID')}`,
      [...serviceParams, ...branchParams]
    );
    const totalServiceRevenue = Number(serviceResult[0]?.totalServiceRevenue) || 0;

    // 5d. Total Service Cost (Parts Cost): Sum of (p.Qty * p.Cost) from tblserviceticket_parts p inside s.Status = 'Picked-up'
    const [serviceCostResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(p.Qty * p.Cost), 0) as totalServiceCost
       FROM tblserviceticket_parts p
       INNER JOIN tblserviceticket s ON p.ServiceTicketID = s.AID
       WHERE ${serviceDateCondition} AND ${branchCondition.replace('v.BranchID', 's.BranchID')}`,
      [...serviceParams, ...branchParams]
    );
    const totalServiceCost = Number(serviceCostResult[0]?.totalServiceCost) || 0;

    // Calculate net profit: (Sales - Sale Returns) - (Purchase Cost - Sale Return Cost) - Expense + (Service Revenue - Service Cost)
    const netProfit = (totalSales - totalSaleReturn) - (totalPurchaseCost - totalSaleReturnCost) - totalExpense + (totalServiceRevenue - totalServiceCost);

    let branchBreakdown = [];
    if (userType === 'admin') {
      const [breakdownRows] = await pool.query(
        `SELECT 
          b.AID as branchId,
          b.BranchName as branchName,
          COALESCE((SELECT SUM(Total) FROM tblvoucher WHERE BranchID = b.AID AND (Chk = 'Cash' OR Chk = 'Credit') AND Date >= COALESCE(?, '1000-01-01') AND Date <= COALESCE(?, '9999-12-31')), 0) as sales,
          COALESCE((SELECT SUM(s.Qty * r.PurchasePrice) FROM tblsale s INNER JOIN tblproduct r ON s.RemainID = r.AID WHERE s.BranchID = b.AID AND s.Date >= COALESCE(?, '1000-01-01') AND s.Date <= COALESCE(?, '9999-12-31')), 0) as cost,
          COALESCE((SELECT SUM(Amount) FROM tblexpense WHERE BranchID = b.AID AND Date >= COALESCE(?, '1000-01-01') AND Date <= COALESCE(?, '9999-12-31')), 0) as expense,
          COALESCE((SELECT SUM(RefundTotal) FROM tblsale_return_voucher WHERE BranchID = b.AID AND Date >= COALESCE(?, '1000-01-01') AND Date <= COALESCE(?, '9999-12-31')), 0) as returns,
          COALESCE((SELECT SUM(ReturnAmount) FROM tblpurchase_return_voucher WHERE BranchID = b.AID AND Date >= COALESCE(?, '1000-01-01') AND Date <= COALESCE(?, '9999-12-31')), 0) as purchaseReturns,
          COALESCE((SELECT SUM(sr.ReturnQty * r.PurchasePrice) FROM tblsale_return sr INNER JOIN tblproduct r ON sr.RemainID = r.AID WHERE sr.BranchID = b.AID AND sr.Date >= COALESCE(?, '1000-01-01') AND sr.Date <= COALESCE(?, '9999-12-31')), 0) as returnsCost,
          COALESCE((SELECT SUM(TotalAmount) FROM tblserviceticket WHERE BranchID = b.AID AND Status = 'Picked-up' AND UpdatedAt >= COALESCE(?, '1000-01-01') AND UpdatedAt <= COALESCE(?, '9999-12-31')), 0) as serviceRevenue,
          COALESCE((SELECT SUM(p.Qty * p.Cost) FROM tblserviceticket_parts p INNER JOIN tblserviceticket s ON p.ServiceTicketID = s.AID WHERE s.BranchID = b.AID AND s.Status = 'Picked-up' AND s.UpdatedAt >= COALESCE(?, '1000-01-01') AND s.UpdatedAt <= COALESCE(?, '9999-12-31')), 0) as serviceCost
         FROM tblbranch b`,
        [
          fromDate || null, toDate ? toDate + ' 23:59:59' : null,
          fromDate || null, toDate ? toDate + ' 23:59:59' : null,
          fromDate || null, toDate ? toDate + ' 23:59:59' : null,
          fromDate || null, toDate ? toDate + ' 23:59:59' : null,
          fromDate || null, toDate ? toDate + ' 23:59:59' : null,
          fromDate || null, toDate ? toDate + ' 23:59:59' : null,
          fromDate || null, toDate ? toDate + ' 23:59:59' : null,
          fromDate || null, toDate ? toDate + ' 23:59:59' : null
        ]
      );
      branchBreakdown = breakdownRows.map(row => ({
        ...row,
        sales: Number(row.sales) || 0,
        cost: Number(row.cost) || 0,
        expense: Number(row.expense) || 0,
        returns: Number(row.returns) || 0,
        purchaseReturns: Number(row.purchaseReturns) || 0,
        returnsCost: Number(row.returnsCost) || 0,
        serviceRevenue: Number(row.serviceRevenue) || 0,
        serviceCost: Number(row.serviceCost) || 0,
        profit: (Number(row.sales) - Number(row.returns)) - (Number(row.cost) - Number(row.returnsCost || 0)) - Number(row.expense) + (Number(row.serviceRevenue) - Number(row.serviceCost))
      }));
    }

    const data = {
      totalSales,
      totalPurchaseCost,
      totalExpense,
      totalPurchaseReturn,
      totalSaleReturn,
      totalSaleReturnCost,
      totalServiceRevenue,
      totalServiceCost,
      netProfit,
      branchBreakdown,
      dateRange: {
        from: fromDate || null,
        to: toDate || null
      }
    };

    // Store in cache for 5 minutes
    await cache.set(cacheKey, data, 300);

    res.json({
      success: true,
      data,
      fromCache: false
    });
  } catch (error) {
    console.error('getFinancialSummary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial summary'
    });
  }
};

// Get detailed breakdown
const getFinancialDetails = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const { userType, branchId } = req.user;
    const cacheKey = `${CACHE_PREFIX}:details:${fromDate || 'all'}:${toDate || 'all'}:${branchId || 'all'}`;

    // Try to get from cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    // Build date conditions
    let dateCondition = '1=1';
    const params = [];

    let branchCondition = '1=1';
    const branchParams = [];

    if (userType !== 'admin' && branchId) {
      branchCondition = 'BranchID = ?';
      branchParams.push(branchId);
    }

    if (fromDate) {
      dateCondition += ' AND Date >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      dateCondition += ' AND Date <= ?';
      params.push(toDate + ' 23:59:59');
    }

    // Cash Sales Total
    const [cashSalesResult] = await pool.query(
      `SELECT COALESCE(SUM(Total), 0) as total FROM tblvoucher WHERE Chk = 'Cash' AND ${dateCondition} AND ${branchCondition}`,
      [...params, ...branchParams]
    );
    const cashSalesTotal = Number(cashSalesResult[0]?.total) || 0;

    // Credit Sales Total
    const [creditSalesResult] = await pool.query(
      `SELECT COALESCE(SUM(Total), 0) as total FROM tblvoucher WHERE Chk = 'Credit' AND ${dateCondition} AND ${branchCondition}`,
      [...params, ...branchParams]
    );
    const creditSalesTotal = Number(creditSalesResult[0]?.total) || 0;

    // Return/Refund Total (Sale Returns)
    const [returnResult] = await pool.query(
      `SELECT COALESCE(SUM(RefundTotal), 0) as total FROM tblsale_return_voucher WHERE ${dateCondition} AND ${branchCondition}`,
      [...params, ...branchParams]
    );
    const returnTotal = Number(returnResult[0]?.total) || 0;

    // Outstanding Credit (remaining credit)
    const [outstandingCreditResult] = await pool.query(
      `SELECT COALESCE(SUM(Credit), 0) as total FROM tblvoucher WHERE Chk = 'Credit' AND Credit > 0 AND ${dateCondition} AND ${branchCondition}`,
      [...params, ...branchParams]
    );
    const outstandingCredit = Number(outstandingCreditResult[0]?.total) || 0;

    // Purchase Returns Total
    const [purchaseReturnResult] = await pool.query(
      `SELECT COALESCE(SUM(ReturnAmount), 0) as total FROM tblpurchase_return_voucher WHERE ${dateCondition} AND ${branchCondition}`,
      [...params, ...branchParams]
    );
    const purchaseReturnTotal = Number(purchaseReturnResult[0]?.total) || 0;

    // Sale Return Cost (purchase price of returned sales)
    let srDateCondition = '1=1';
    const srParams = [];
    if (fromDate) {
      srDateCondition += ' AND sr.Date >= ?';
      srParams.push(fromDate);
    }
    if (toDate) {
      srDateCondition += ' AND sr.Date <= ?';
      srParams.push(toDate + ' 23:59:59');
    }

    const [saleReturnCostResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(sr.ReturnQty * r.PurchasePrice), 0) as totalSaleReturnCost
       FROM tblsale_return sr
       INNER JOIN tblproduct r ON sr.RemainID = r.AID
       WHERE ${srDateCondition} AND ${branchCondition.replace('BranchID', 'sr.BranchID')}`,
      [...srParams, ...branchParams]
    );
    const totalSaleReturnCost = Number(saleReturnCostResult[0]?.totalSaleReturnCost) || 0;

    // Service Revenue Total
    let serviceDateCondition = 's.Status = \'Picked-up\'';
    const serviceParams = [];
    if (fromDate) {
      serviceDateCondition += ' AND s.UpdatedAt >= ?';
      serviceParams.push(fromDate);
    }
    if (toDate) {
      serviceDateCondition += ' AND s.UpdatedAt <= ?';
      serviceParams.push(toDate + ' 23:59:59');
    }

    const [serviceResult] = await pool.query(
      `SELECT COALESCE(SUM(s.TotalAmount), 0) as total FROM tblserviceticket s WHERE ${serviceDateCondition} AND ${branchCondition.replace('BranchID', 's.BranchID')}`,
      [...serviceParams, ...branchParams]
    );
    const serviceRevenueTotal = Number(serviceResult[0]?.total) || 0;

    // Service Cost (Parts Cost) Total
    const [serviceCostResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(p.Qty * p.Cost), 0) as total
       FROM tblserviceticket_parts p
       INNER JOIN tblserviceticket s ON p.ServiceTicketID = s.AID
       WHERE ${serviceDateCondition} AND ${branchCondition.replace('BranchID', 's.BranchID')}`,
      [...serviceParams, ...branchParams]
    );
    const serviceCostTotal = Number(serviceCostResult[0]?.total) || 0;

    const data = {
      cashSalesTotal,
      creditSalesTotal,
      returnTotal,
      outstandingCredit,
      purchaseReturnTotal,
      totalSaleReturnCost,
      grandTotalSales: cashSalesTotal + creditSalesTotal,
      serviceRevenueTotal,
      serviceCostTotal
    };

    // Store in cache for 5 minutes
    await cache.set(cacheKey, data, 300);

    res.json({
      success: true,
      data,
      fromCache: false
    });
  } catch (error) {
    console.error('getFinancialDetails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial details'
    });
  }
};

module.exports = {
  getFinancialSummary,
  getFinancialDetails
};

