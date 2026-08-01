const { pool } = require('../config/database');

const transferModel = {
  // Create a new transfer
  async create({ fromBranchId, toBranchId, transferDate, status = 'Shipped', senderId, remark, items }, connection) {
    const conn = connection || await pool.getConnection();
    let shouldRelease = !connection;

    try {
      if (shouldRelease) await conn.beginTransaction();

      // 1. Insert header
      const [headerResult] = await conn.query(
        `INSERT INTO tbl_transfer (from_branch_id, to_branch_id, transfer_date, status, sender_id, remark)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [fromBranchId, toBranchId, transferDate, status, senderId, remark]
      );
      const transferId = headerResult.insertId;

      // 2. Process items
      for (const item of items) {
        // Insert into details
        await conn.query(
          `INSERT INTO tbl_transfer_details (transfer_id, product_id, imei, qty)
           VALUES (?, ?, ?, ?)`,
          [transferId, item.productId, item.imei || null, item.qty || 1]
        );

        // Update stock/status
        if (item.imei) {
          // Serialized: mark status as 4 (In-Transit)
          // We also need to know which tblpurchase_items record it is. 
          // Assuming we have the p_item_id (stockId) from frontend
          if (item.stockId) {
            await conn.query(
              'UPDATE tblpurchase_items SET status = 4 WHERE p_item_id = ? AND BranchID = ?',
              [item.stockId, fromBranchId]
            );
          } else {
            // Fallback: find by imei and productId
            await conn.query(
              'UPDATE tblpurchase_items SET status = 4 WHERE product_id = ? AND (imei_1 = ? OR imei_2 = ?) AND BranchID = ?',
              [item.productId, item.imei, item.imei, fromBranchId]
            );
          }
          
          // Also decrement total StockQty in tblproduct for this product (optional, but keep consistent)
          // Actually, StockQty in tblproduct is global? Let's check inventory.model.js again.
          // inventory.model.js calculates branch stock by summing tblpurchase_items.
          // But it ALSO has r.StockQty which seems global.
          // Let's decrement the global one too if it's used.
          await conn.query(
            'UPDATE tblproduct SET StockQty = StockQty - ? WHERE AID = ?',
            [1, item.productId]
          );
        } else {
          // Non-serialized: decrement global StockQty
          await conn.query(
            'UPDATE tblproduct SET StockQty = StockQty - ? WHERE AID = ?',
            [item.qty, item.productId]
          );
          
          // We don't have individual records in tblpurchase_items for accessories usually, 
          // but we might need to decrement from SOME record there if we track branch stock that way.
          // In this system, branch stock is calculated from tblpurchase_items.
          // For non-serialized, we should probably find a record with enough qty in this branch and reduce it.
          const [purchaseItems] = await conn.query(
            'SELECT p_item_id, quantity FROM tblpurchase_items WHERE product_id = ? AND BranchID = ? AND quantity >= ? LIMIT 1',
            [item.productId, fromBranchId, item.qty]
          );
          
          if (purchaseItems.length > 0) {
            await conn.query(
              'UPDATE tblpurchase_items SET quantity = quantity - ? WHERE p_item_id = ?',
              [item.qty, purchaseItems[0].p_item_id]
            );
          }
        }
      }

      if (shouldRelease) await conn.commit();
      return transferId;
    } catch (error) {
      if (shouldRelease) await conn.rollback();
      throw error;
    } finally {
      if (shouldRelease) conn.release();
    }
  },

  // Find all transfers with filters
  async findAll({ page = 1, limit = 10, search = '', fromBranchId, toBranchId, status, fromDate, toDate }) {
    const offset = (page - 1) * limit;
    let whereConditions = ['1=1'];
    let params = [];

    if (fromBranchId) {
      whereConditions.push('t.from_branch_id = ?');
      params.push(fromBranchId);
    }
    if (toBranchId) {
      whereConditions.push('t.to_branch_id = ?');
      params.push(toBranchId);
    }
    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }
    if (search) {
      whereConditions.push('(t.remark LIKE ? OR u.username LIKE ? OR fb.BranchName LIKE ? OR tb.BranchName LIKE ? OR EXISTS (SELECT 1 FROM tbl_transfer_details td WHERE td.transfer_id = t.transfer_id AND (td.imei LIKE ? OR EXISTS (SELECT 1 FROM tblproduct p WHERE p.AID = td.product_id AND (p.Name LIKE ? OR p.CodeNo LIKE ?)))))');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (fromDate) {
      whereConditions.push('DATE(t.transfer_date) >= ?');
      params.push(fromDate);
    }
    if (toDate) {
      whereConditions.push('DATE(t.transfer_date) <= ?');
      params.push(toDate);
    }

    const whereClause = whereConditions.join(' AND ');

    const [rows] = await pool.query(
      `SELECT 
        t.transfer_id as id,
        t.from_branch_id,
        t.to_branch_id,
        t.transfer_date as transferDate,
        t.receive_date as receiveDate,
        t.status,
        t.sender_id as senderId,
        t.receiver_id as receiverId,
        t.remark,
        fb.BranchName as fromBranchName,
        tb.BranchName as toBranchName,
        u.username as senderName,
        (SELECT COUNT(*) FROM tbl_transfer_details WHERE transfer_id = t.transfer_id) as itemCount
      FROM tbl_transfer t
      LEFT JOIN tblbranch fb ON t.from_branch_id = fb.AID
      LEFT JOIN tblbranch tb ON t.to_branch_id = tb.AID
      LEFT JOIN tbluser u ON t.sender_id = u.AID
      WHERE ${whereClause}
      ORDER BY t.transfer_id DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tbl_transfer t WHERE ${whereClause}`,
      params
    );

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    };
  },

  // Get transfer details
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT 
        t.transfer_id as id,
        t.from_branch_id,
        t.to_branch_id,
        t.transfer_date as transferDate,
        t.receive_date as receiveDate,
        t.status,
        t.sender_id as senderId,
        t.receiver_id as receiverId,
        t.remark,
        fb.BranchName as fromBranchName,
        tb.BranchName as toBranchName,
        u.username as senderName,
        ru.username as receiverName
      FROM tbl_transfer t
      LEFT JOIN tblbranch fb ON t.from_branch_id = fb.AID
      LEFT JOIN tblbranch tb ON t.to_branch_id = tb.AID
      LEFT JOIN tbluser u ON t.sender_id = u.AID
      LEFT JOIN tbluser ru ON t.receiver_id = ru.AID
      WHERE t.transfer_id = ?`,
      [id]
    );

    if (rows.length === 0) return null;

    const [items] = await pool.query(
      `SELECT 
        td.id as id,
        td.transfer_id as transferId,
        td.product_id as productId,
        td.imei,
        td.qty,
        p.Name as productName,
        p.CodeNo as productCode
      FROM tbl_transfer_details td
      JOIN tblproduct p ON td.product_id = p.AID
      WHERE td.transfer_id = ?`,
      [id]
    );

    return {
      ...rows[0],
      items
    };
  },

  // Confirm receive
  async receive(id, { receiverId, receiveDate, items }, connection) {
    const conn = connection || await pool.getConnection();
    let shouldRelease = !connection;

    try {
      if (shouldRelease) await conn.beginTransaction();

      // 1. Update header
      await conn.query(
        `UPDATE tbl_transfer SET 
          status = 'Received',
          receive_date = ?,
          receiver_id = ?
         WHERE transfer_id = ?`,
        [receiveDate, receiverId, id]
      );

      // 2. Get transfer info to know branches
      const [transfer] = await conn.query('SELECT from_branch_id, to_branch_id FROM tbl_transfer WHERE transfer_id = ?', [id]);
      const toBranchId = transfer[0].to_branch_id;

      // 3. Process items
      for (const item of items) {
        if (item.imei) {
          // Serialized: update tblpurchase_items record
          // We need to find the record that was marked as status 4
          await conn.query(
            'UPDATE tblpurchase_items SET status = 0, BranchID = ? WHERE product_id = ? AND (imei_1 = ? OR imei_2 = ?) AND status = 4',
            [toBranchId, item.productId, item.imei, item.imei]
          );

          // Restore global StockQty
          await conn.query(
            'UPDATE tblproduct SET StockQty = StockQty + 1 WHERE AID = ?',
            [item.productId]
          );
        } else {
          // Non-serialized: increment global StockQty
          await conn.query(
            'UPDATE tblproduct SET StockQty = StockQty + ? WHERE AID = ?',
            [item.qty, item.productId]
          );

          // Get the latest cost_price for this product
          const [priceRows] = await conn.query(
            'SELECT cost_price FROM tblpurchase_items WHERE product_id = ? ORDER BY p_item_id DESC LIMIT 1',
            [item.productId]
          );
          const costPrice = priceRows.length > 0 ? priceRows[0].cost_price : 0;

          await conn.query(
            `INSERT INTO tblpurchase_items (product_id, quantity, cost_price, sub_total, BranchID, status)
             VALUES (?, ?, ?, ?, ?, 0)`,
            [item.productId, item.qty, costPrice, costPrice * item.qty, toBranchId]
          );
        }
      }

      if (shouldRelease) await conn.commit();
      return true;
    } catch (error) {
      if (shouldRelease) await conn.rollback();
      throw error;
    } finally {
      if (shouldRelease) conn.release();
    }
  },

  // Cancel a transfer
  async delete(id, connection) {
    const conn = connection || await pool.getConnection();
    let shouldRelease = !connection;

    try {
      if (shouldRelease) await conn.beginTransaction();

      // 1. Get transfer and items
      const [transferRows] = await conn.query('SELECT from_branch_id, status FROM tbl_transfer WHERE transfer_id = ?', [id]);
      if (transferRows.length === 0) throw new Error('Transfer not found');
      
      const transfer = transferRows[0];
      if (transfer.status === 'Received') throw new Error('Cannot cancel a received transfer');
      if (transfer.status === 'Cancelled') throw new Error('Transfer already cancelled');

      const [items] = await conn.query('SELECT * FROM tbl_transfer_details WHERE transfer_id = ?', [id]);

      // 2. Rollback stock changes
      for (const item of items) {
        if (item.imei) {
          // Serialized: reset status to 0
          await conn.query(
            'UPDATE tblpurchase_items SET status = 0 WHERE product_id = ? AND (imei_1 = ? OR imei_2 = ?) AND status = 4 AND BranchID = ?',
            [item.product_id, item.imei, item.imei, transfer.from_branch_id]
          );

          // Increment global StockQty
          await conn.query(
            'UPDATE tblproduct SET StockQty = StockQty + 1 WHERE AID = ?',
            [item.product_id]
          );
        } else {
          // Non-serialized: increment global StockQty
          await conn.query(
            'UPDATE tblproduct SET StockQty = StockQty + ? WHERE AID = ?',
            [item.qty, item.product_id]
          );

          // We need to restore the quantity in the from branch's tblpurchase_items
          const [purchaseItems] = await conn.query(
            'SELECT p_item_id FROM tblpurchase_items WHERE product_id = ? AND BranchID = ? LIMIT 1',
            [item.product_id, transfer.from_branch_id]
          );
          
          if (purchaseItems.length > 0) {
            await conn.query(
              'UPDATE tblpurchase_items SET quantity = quantity + ? WHERE p_item_id = ?',
              [item.qty, purchaseItems[0].p_item_id]
            );
          } else {
            const [product] = await conn.query('SELECT PurchasePrice FROM tblproduct WHERE AID = ?', [item.product_id]);
            await conn.query(
              'INSERT INTO tblpurchase_items (product_id, quantity, cost_price, sub_total, BranchID, status) VALUES (?, ?, ?, ?, ?, 0)',
              [item.product_id, item.qty, product[0].PurchasePrice || 0, (product[0].PurchasePrice || 0) * item.qty, transfer.from_branch_id]
            );
          }
        }
      }

      // 3. Update status to Cancelled
      await conn.query('UPDATE tbl_transfer SET status = "Cancelled" WHERE transfer_id = ?', [id]);

      if (shouldRelease) await conn.commit();
      return true;
    } catch (error) {
      if (shouldRelease) await conn.rollback();
      throw error;
    } finally {
      if (shouldRelease) conn.release();
    }
  }
};

module.exports = transferModel;
