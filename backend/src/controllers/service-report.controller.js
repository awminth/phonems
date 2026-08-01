const { pool } = require('../config/database');

const serviceReportController = {
  async getServiceReport(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const view = req.query.view || 'voucher'; // 'voucher' or 'item'
      const search = req.query.search || '';
      const fromDate = req.query.fromDate || '';
      const toDate = req.query.toDate || '';
      const customerId = req.query.customerId || '';
      const deviceBrandModel = req.query.deviceBrandModel || '';
      const serialNumberImei = req.query.serialNumberImei || '';
      const ticketNo = req.query.ticketNo || '';

      const { userType, branchId: userBranchId } = req.user;
      const isAdmin = userType === 'admin';
      
      // Branch Filtering: Admin can filter by any branch, others only their own
      const filterBranchId = isAdmin ? (req.query.branchId || 'all') : userBranchId;

      if (view === 'voucher') {
        // --- VOUCHER-WISE VIEW ---
        let whereConditions = ["s.Status = 'Picked-up'"];
        let params = [];

        if (search) {
          whereConditions.push('(s.TicketNo LIKE ? OR c.Name LIKE ? OR c.PhoneNo LIKE ? OR s.DeviceBrandModel LIKE ? OR s.SerialNumberIMEI LIKE ?)');
          const searchPattern = `%${search}%`;
          params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (ticketNo) {
          whereConditions.push('s.TicketNo LIKE ?');
          params.push(`%${ticketNo}%`);
        }

        if (customerId && customerId !== 'all') {
          whereConditions.push('s.CustomerID = ?');
          params.push(customerId);
        }

        if (deviceBrandModel) {
          whereConditions.push('s.DeviceBrandModel LIKE ?');
          params.push(`%${deviceBrandModel}%`);
        }

        if (serialNumberImei) {
          whereConditions.push('s.SerialNumberIMEI LIKE ?');
          params.push(`%${serialNumberImei}%`);
        }

        if (fromDate) {
          whereConditions.push('DATE(s.UpdatedAt) >= ?');
          params.push(fromDate);
        }

        if (toDate) {
          whereConditions.push('DATE(s.UpdatedAt) <= ?');
          params.push(toDate);
        }

        if (filterBranchId !== 'all') {
          whereConditions.push('s.BranchID = ?');
          params.push(filterBranchId);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get count and totals
        const [totals] = await pool.query(
          `SELECT 
            COUNT(*) as totalCount,
            SUM(s.TotalAmount) as totalAmount,
            SUM(s.Deposit) as totalDeposit,
            SUM(COALESCE((SELECT SUM(Qty * Cost) FROM tblserviceticket_parts WHERE ServiceTicketID = s.AID), 0)) as totalPartsCost,
            SUM(s.TotalAmount - COALESCE((SELECT SUM(Qty * Cost) FROM tblserviceticket_parts WHERE ServiceTicketID = s.AID), 0)) as totalProfit
          FROM tblserviceticket s
          LEFT JOIN tblcustomer c ON s.CustomerID = c.AID
          WHERE ${whereClause}`,
          params
        );

        const total = totals[0].totalCount || 0;
        const offset = (page - 1) * limit;

        // Get rows
        const [rows] = await pool.query(
          `SELECT 
            s.AID as id,
            s.TicketNo as ticketNo,
            s.CustomerID as customerId,
            COALESCE(c.Name, '') as customerName,
            COALESCE(c.PhoneNo, '') as customerPhone,
            s.DeviceBrandModel as deviceBrandModel,
            s.DeviceColor as deviceColor,
            s.SerialNumberIMEI as serialNumberImei,
            s.ProblemType as problemType,
            s.EstimatedCompletionDate as estimatedCompletionDate,
            s.TotalAmount as totalAmount,
            s.Deposit as deposit,
            (s.TotalAmount - s.Deposit) as balanceAmount,
            s.Status as status,
            s.UpdatedAt as date,
            b.BranchName as branchName,
            COALESCE((SELECT SUM(Qty * Cost) FROM tblserviceticket_parts WHERE ServiceTicketID = s.AID), 0) as partsCost,
            COALESCE((SELECT SUM(Qty * Price) FROM tblserviceticket_parts WHERE ServiceTicketID = s.AID), 0) as partsPrice,
            (s.TotalAmount - COALESCE((SELECT SUM(Qty * Cost) FROM tblserviceticket_parts WHERE ServiceTicketID = s.AID), 0)) as profit
          FROM tblserviceticket s
          LEFT JOIN tblcustomer c ON s.CustomerID = c.AID
          LEFT JOIN tblbranch b ON s.BranchID = b.AID
          WHERE ${whereClause}
          ORDER BY s.UpdatedAt DESC
          LIMIT ? OFFSET ?`,
          [...params, limit, offset]
        );

        return res.json({
          success: true,
          data: rows,
          totals: {
            qty: total, // For voucher view, total quantity is total count of vouchers
            amount: totals[0].totalAmount || 0,
            deposit: totals[0].totalDeposit || 0,
            partsCost: totals[0].totalPartsCost || 0,
            profit: totals[0].totalProfit || 0
          },
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });

      } else {
        // --- SERVICE ITEMS-WISE VIEW ---
        // We compile a UNION query inside reportTable
        const unionQuery = `
          SELECT 
            CONCAT('part_', p.AID) as uniqueId,
            s.TicketNo as ticketNo,
            s.UpdatedAt as date,
            COALESCE(cust.Name, '') as customerName,
            p.PartName as itemName,
            p.Qty as qty,
            p.Price as price,
            p.Cost as cost,
            (p.Qty * p.Price) as total,
            (p.Qty * (p.Price - p.Cost)) as profit,
            CASE WHEN p.IsExternal = 1 THEN 'External Part' ELSE 'Shop Part' END as itemType,
            s.DeviceBrandModel as deviceBrandModel,
            s.SerialNumberIMEI as serialNumberImei,
            s.CustomerID as customerId,
            s.BranchID as branchId,
            b.BranchName as branchName
          FROM tblserviceticket_parts p
          JOIN tblserviceticket s ON p.ServiceTicketID = s.AID
          LEFT JOIN tblcustomer cust ON s.CustomerID = cust.AID
          LEFT JOIN tblbranch b ON s.BranchID = b.AID
          WHERE s.Status = 'Picked-up'

          UNION ALL

          SELECT 
            CONCAT('labor_', s.AID) as uniqueId,
            s.TicketNo as ticketNo,
            s.UpdatedAt as date,
            COALESCE(cust.Name, '') as customerName,
            'Service / Labor Fee' as itemName,
            1 as qty,
            (s.TotalAmount - COALESCE((SELECT SUM(Qty * Price) FROM tblserviceticket_parts WHERE ServiceTicketID = s.AID), 0)) as price,
            0 as cost,
            (s.TotalAmount - COALESCE((SELECT SUM(Qty * Price) FROM tblserviceticket_parts WHERE ServiceTicketID = s.AID), 0)) as total,
            (s.TotalAmount - COALESCE((SELECT SUM(Qty * Price) FROM tblserviceticket_parts WHERE ServiceTicketID = s.AID), 0)) as profit,
            'Service / Labor' as itemType,
            s.DeviceBrandModel as deviceBrandModel,
            s.SerialNumberIMEI as serialNumberImei,
            s.CustomerID as customerId,
            s.BranchID as branchId,
            b.BranchName as branchName
          FROM tblserviceticket s
          LEFT JOIN tblcustomer cust ON s.CustomerID = cust.AID
          LEFT JOIN tblbranch b ON s.BranchID = b.AID
          WHERE s.Status = 'Picked-up'
            AND (s.TotalAmount - COALESCE((SELECT SUM(Qty * Price) FROM tblserviceticket_parts WHERE ServiceTicketID = s.AID), 0)) > 0
        `;

        let whereConditions = ['1=1'];
        let params = [];

        if (search) {
          whereConditions.push('(ticketNo LIKE ? OR customerName LIKE ? OR itemName LIKE ? OR deviceBrandModel LIKE ? OR serialNumberImei LIKE ?)');
          const searchPattern = `%${search}%`;
          params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (ticketNo) {
          whereConditions.push('ticketNo LIKE ?');
          params.push(`%${ticketNo}%`);
        }

        if (customerId && customerId !== 'all') {
          whereConditions.push('customerId = ?');
          params.push(customerId);
        }

        if (deviceBrandModel) {
          whereConditions.push('deviceBrandModel LIKE ?');
          params.push(`%${deviceBrandModel}%`);
        }

        if (serialNumberImei) {
          whereConditions.push('serialNumberImei LIKE ?');
          params.push(`%${serialNumberImei}%`);
        }

        if (fromDate) {
          whereConditions.push('DATE(date) >= ?');
          params.push(fromDate);
        }

        if (toDate) {
          whereConditions.push('DATE(date) <= ?');
          params.push(toDate);
        }

        if (filterBranchId !== 'all') {
          whereConditions.push('branchId = ?');
          params.push(filterBranchId);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get count and totals
        const [totals] = await pool.query(
          `SELECT 
            COUNT(*) as totalCount,
            SUM(qty) as totalQty,
            SUM(total) as totalAmount,
            SUM(profit) as totalProfit
          FROM (${unionQuery}) AS reportTable
          WHERE ${whereClause}`,
          params
        );

        const total = totals[0].totalCount || 0;
        const offset = (page - 1) * limit;

        // Get rows
        const [rows] = await pool.query(
          `SELECT * FROM (${unionQuery}) AS reportTable
          WHERE ${whereClause}
          ORDER BY date DESC, uniqueId DESC
          LIMIT ? OFFSET ?`,
          [...params, limit, offset]
        );

        return res.json({
          success: true,
          data: rows,
          totals: {
            qty: totals[0].totalQty || 0,
            amount: totals[0].totalAmount || 0,
            profit: totals[0].totalProfit || 0
          },
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }

    } catch (error) {
      console.error('getServiceReport error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch service report: ' + error.message
      });
    }
  }
};

module.exports = serviceReportController;
