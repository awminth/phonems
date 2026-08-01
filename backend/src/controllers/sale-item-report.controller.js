const { pool } = require('../config/database');

const saleItemReportController = {
  async getSaleItemsReport(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const categoryId = req.query.categoryId || '';
      const fromDate = req.query.fromDate || '';
      const toDate = req.query.toDate || '';
      
      const { userType, branchId: userBranchId } = req.user;
      const isAdmin = userType === 'admin';
      
      // Branch Filtering: Admin can filter by any branch, others only their own
      const filterBranchId = isAdmin ? (req.query.branchId || 'all') : userBranchId;
      const customerId = req.query.customerId || '';
      const type = req.query.type || 'all'; // all, phone, accessory, service

      let whereConditions = ['1=1'];
      let params = [];

      if (type === 'phone') {
        whereConditions.push('p.isSerialized = 1');
      } else if (type === 'spare') {
        whereConditions.push('p.IsSparePart = 1');
      } else if (type === 'accessory') {
        whereConditions.push('(p.isSerialized = 0 OR p.isSerialized IS NULL) AND s.CodeNo != "SRV" AND (p.IsSparePart = 0 OR p.IsSparePart IS NULL)');
      } else if (type === 'service') {
        whereConditions.push('s.CodeNo = "SRV"');
      }

      if (search) {
        whereConditions.push('(s.ItemName LIKE ? OR s.VNO LIKE ? OR s.CodeNo LIKE ? OR cust.Name LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (customerId && customerId !== 'all') {
        whereConditions.push('v.CustomerID = ?');
        params.push(customerId);
      }

      if (categoryId) {
        if (categoryId === 'none') {
          whereConditions.push('(p.CategoryID IS NULL OR p.CategoryID = 0)');
        } else {
          whereConditions.push('p.CategoryID = ?');
          params.push(categoryId);
        }
      }

      if (fromDate) {
        whereConditions.push('DATE(v.Date) >= ?');
        params.push(fromDate);
      }

      if (toDate) {
        whereConditions.push('DATE(v.Date) <= ?');
        params.push(toDate);
      }

      if (filterBranchId !== 'all') {
        whereConditions.push('v.BranchID = ?');
        params.push(filterBranchId);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count and aggregated sums
      const [totals] = await pool.query(
        `SELECT 
          COUNT(*) as totalCount,
          SUM(s.Qty) as totalQty,
          SUM(s.Qty * s.SellPrice) as totalAmount,
          SUM(s.Qty * COALESCE(p.PurchasePrice, 0)) as totalPurchasePrice,
          SUM(s.Qty * (s.SellPrice - COALESCE(p.PurchasePrice, 0))) as totalProfit
        FROM tblsale s
        JOIN tblvoucher v ON s.VNO = v.VNO
        LEFT JOIN tblproduct p ON s.RemainID = p.AID
        LEFT JOIN tblcustomer cust ON v.CustomerID = cust.AID
        WHERE ${whereClause}`,
        params
      );

      const total = totals[0].totalCount || 0;
      const offset = (page - 1) * limit;

      // Get paginated data
      const [rows] = await pool.query(
        `SELECT 
          s.AID as id,
          s.VNO as vno,
          s.ItemName as itemName,
          s.CodeNo as code,
          s.Qty as qty,
          s.SellPrice as sellPrice,
          (s.Qty * s.SellPrice) as total,
          v.Date as date,
          v.BranchID as branchId,
          b.BranchName as branchName,
          cat.Category as categoryName,
          cust.Name as customerName,
          COALESCE(p.PurchasePrice, 0) as purchasePrice,
          (s.Qty * (s.SellPrice - COALESCE(p.PurchasePrice, 0))) as profit,
          pi.specification as specification
        FROM tblsale s
        JOIN tblvoucher v ON s.VNO = v.VNO
        LEFT JOIN tblbranch b ON v.BranchID = b.AID
        LEFT JOIN tblproduct p ON s.RemainID = p.AID
        LEFT JOIN tblcategory cat ON p.CategoryID = cat.AID
        LEFT JOIN tblcustomer cust ON v.CustomerID = cust.AID
        LEFT JOIN tblpurchase_items pi ON (s.RegisterKey = pi.imei_1 OR s.RegisterKey = pi.imei_2) AND s.RegisterKey IS NOT NULL AND s.RegisterKey != ''
        WHERE ${whereClause}
        ORDER BY v.Date DESC, s.AID DESC
        LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      res.json({
        success: true,
        data: rows,
        totals: {
          qty: totals[0].totalQty || 0,
          amount: totals[0].totalAmount || 0,
          purchasePrice: totals[0].totalPurchasePrice || 0,
          profit: totals[0].totalProfit || 0
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('getSaleItemsReport error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sale items report: ' + error.message
      });
    }
  }
};

module.exports = saleItemReportController;
