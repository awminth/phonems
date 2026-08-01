const { pool } = require('../config/database');

// Table: tblpurchase_return_voucher (AID, VNO, SupplierID, OriginalAmount, ReturnAmount, UserID, Reason, Date)
// Table: tblpurchase_return (AID, VNO, PurchaseID, SupplierID, OriginalQty, Price, ReturnQty, Date, SubTotal)

const purchaseReturnModel = {
  // Get purchase invoice details by VNO from tblpurchases (New Schema)
  async getPurchaseInvoiceDetails(purchaseInvoiceNo) {
    try {
      // Search by VNO in tblpurchases
      const [voucherRows] = await pool.query(`
        SELECT 
          p.purchase_id as voucherId,
          p.invoice_no as vno,
          p.supplier_id as supplierId,
          s.Supplier as supplierName,
          p.net_amount as totalAmount,
          p.purchase_date as voucherDate,
          NULL as userId
        FROM tblpurchases p
        LEFT JOIN tblsupplier s ON p.supplier_id = s.AID
        WHERE p.invoice_no = ?
      `, [purchaseInvoiceNo]);

      if (voucherRows.length === 0) {
        return null;
      }

      const voucher = voucherRows[0];

      // Get all purchase items for this VNO from tblpurchase_items
      const [purchaseRows] = await pool.query(`
        SELECT 
          pi.p_item_id as purchaseId,
          prod.CodeNo as codeNo,
          prod.Name as itemName,
          pi.quantity as qty,
          pi.cost_price as costPrice,
          COALESCE(pi.sell_price, prod.SellingPrice) as sellPrice,
          prod.CategoryID as categoryId,
          prod.SupplierID as supplierId,
          p.purchase_date as purchaseDate,
          prod.AID as remainId,
          prod.StockQty as currentQty,
          pi.imei_1 as imei1,
          pi.imei_2 as imei2
        FROM tblpurchase_items pi
        JOIN tblpurchases p ON pi.purchase_id = p.purchase_id
        JOIN tblproduct prod ON pi.product_id = prod.AID
        WHERE p.invoice_no = ? AND (pi.Status IS NULL OR pi.Status NOT IN (1, 3, 4, 5))
        ORDER BY pi.p_item_id
      `, [purchaseInvoiceNo]);

    // Get return history for each purchase item
    let returnHistoryMap = {};
    if (purchaseRows.length > 0) {
      const purchaseIds = purchaseRows.map(p => p.purchaseId);
      const placeholders = purchaseIds.map(() => '?').join(',');
      
      if (placeholders) {
        const [historyRows] = await pool.query(`
          SELECT PurchaseID, SUM(ReturnQty) as totalReturned
          FROM tblpurchase_return
          WHERE PurchaseID IN (${placeholders})
          GROUP BY PurchaseID
        `, purchaseIds);

        historyRows.forEach(row => {
          returnHistoryMap[row.PurchaseID] = parseFloat(row.totalReturned) || 0;
        });
      }
    }

    // Format items with return history
    const items = purchaseRows.map(purchase => {
      const totalReturned = returnHistoryMap[purchase.purchaseId] || 0;
      const availableQty = purchase.qty - totalReturned;

      return {
        purchaseId: purchase.purchaseId.toString(),
        codeNo: purchase.codeNo,
        itemName: purchase.itemName,
        qty: purchase.qty,
        costPrice: purchase.costPrice,
        sellPrice: purchase.sellPrice,
        categoryId: purchase.categoryId?.toString() || '',
        supplierId: purchase.supplierId?.toString() || '',
        purchaseDate: purchase.purchaseDate,
        remainId: purchase.remainId?.toString() || '',
        currentQty: purchase.currentQty || 0,
        totalReturned: totalReturned,
        availableQty: availableQty,
        imei1: purchase.imei1 || '',
        imei2: purchase.imei2 || ''
      };
    });

      return {
        voucher: {
          voucherId: voucher.voucherId.toString(),
          vno: voucher.vno,
          supplierId: voucher.supplierId?.toString() || '',
          supplierName: voucher.supplierName || '',
          supplierCode: '',
          totalAmount: parseFloat(voucher.totalAmount) || 0,
          voucherDate: voucher.voucherDate,
          userId: voucher.userId?.toString() || ''
        },
        items: items
      };
    } catch (error) {
      console.error('getPurchaseInvoiceDetails model error:', error);
      throw error;
    }
  },

  // Get all purchase items for a supplier (New Schema)
  async getPurchaseItemsBySupplier(supplierId, date) {
    const [rows] = await pool.query(`
      SELECT 
        pi.p_item_id as purchaseId,
        prod.CodeNo as codeNo,
        prod.Name as itemName,
        pi.quantity as qty,
        pi.cost_price as costPrice,
        COALESCE(pi.sell_price, prod.SellingPrice) as sellPrice,
        prod.CategoryID as categoryId,
        p.supplier_id as supplierId,
        s.Supplier as supplierName,
        s.AID as supplierCode,
        p.purchase_date as purchaseDate,
        prod.AID as remainId,
        prod.StockQty as currentQty
      FROM tblpurchase_items pi
      JOIN tblpurchases p ON pi.purchase_id = p.purchase_id
      LEFT JOIN tblsupplier s ON p.supplier_id = s.AID
      JOIN tblproduct prod ON pi.product_id = prod.AID
      WHERE p.supplier_id = ? AND DATE(p.purchase_date) = DATE(?)
      ORDER BY pi.p_item_id
    `, [supplierId, date]);

    return rows.map(async (row) => {
      // Get return history for each purchase item
      const [historyRows] = await pool.query(`
        SELECT SUM(ReturnQty) as totalReturned
        FROM tblpurchase_return pr
        WHERE pr.PurchaseID = ?
      `, [row.purchaseId]);

      const totalReturned = historyRows[0]?.totalReturned || 0;
      return {
        purchaseId: row.purchaseId.toString(),
        codeNo: row.codeNo,
        itemName: row.itemName,
        qty: row.qty,
        costPrice: row.costPrice,
        sellPrice: row.sellPrice,
        categoryId: row.categoryId?.toString() || '',
        supplierId: row.supplierId?.toString() || '',
        supplierName: row.supplierName || '',
        supplierCode: row.supplierCode.toString() || '',
        purchaseDate: row.purchaseDate,
        remainId: row.remainId?.toString() || '',
        currentQty: row.currentQty || 0,
        totalReturned: totalReturned,
        availableQty: row.qty - totalReturned
      };
    });
  },

  // Get purchase vouchers for dropdown (New Schema)
  async getPurchaseVouchersDropdown(search = '') {
    try {
      let query = 'SELECT DISTINCT invoice_no as id, invoice_no as name FROM tblpurchases';
      const params = [];

      if (search) {
        query += ' WHERE invoice_no LIKE ?';
        params.push(`%${search}%`);
      }

      query += ' ORDER BY invoice_no DESC LIMIT 50';
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('getPurchaseVouchersDropdown model error:', error);
      throw error;
    }
  },

  // Create purchase return
  async create({ purchaseInvoiceNo, supplierId, items, reason, refundTotal, userId }) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // Get original purchase total
      let originalTotal = 0;
      for (const item of items) {
        const [purchaseRow] = await connection.query(
          'SELECT cost_price as PurchasePrice, quantity as Qty FROM tblpurchase_items WHERE p_item_id = ?',
          [item.purchaseId]
        );
        if (purchaseRow.length > 0) {
          originalTotal += (parseFloat(purchaseRow[0].PurchasePrice) || 0) * (parseInt(purchaseRow[0].Qty) || 0);
        }
      }

      // Insert into tblpurchase_return_voucher
      const [voucherResult] = await connection.query(
        `INSERT INTO tblpurchase_return_voucher 
         (VNO, SupplierID, OriginalAmount, ReturnAmount, UserID, Reason, Date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [purchaseInvoiceNo, supplierId, originalTotal, refundTotal, userId, reason, currentDate]
      );

      const returnVoucherId = voucherResult.insertId;

      // Insert into tblpurchase_return for each item
      for (const item of items) {
        if (item.returnQty > 0) {
          await connection.query(
            `INSERT INTO tblpurchase_return 
             (ReturnVoucherID, VNO, PurchaseID, SupplierID, OriginalQty, Price, ReturnQty, Date, SubTotal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              returnVoucherId,
              purchaseInvoiceNo,
              item.purchaseId, // Now points to tblpurchase_items.id
              supplierId,
              item.oldQty,
              item.costPrice,
              item.returnQty,
              currentDate,
              item.refundSubtotal
            ]
          );

          // Update tblproduct: StockQty = StockQty - ReturnQty
          // We use product_id from tblpurchase_items if remainId is not provided
          let productId = item.remainId;
          if (!productId) {
            const [itemRow] = await connection.query('SELECT product_id FROM tblpurchase_items WHERE p_item_id = ?', [item.purchaseId]);
            if (itemRow.length > 0) productId = itemRow[0].product_id;
          }

          if (productId) {
            // Update tblproduct: StockQty = StockQty - ReturnQty
            await connection.query(
              'UPDATE tblproduct SET StockQty = StockQty - ? WHERE AID = ?',
              [item.returnQty, productId]
            );

            // Set Status = 2 only if fully returned
            const [checkQty] = await connection.query(
              `SELECT quantity, (SELECT COALESCE(SUM(ReturnQty), 0) FROM tblpurchase_return WHERE PurchaseID = ?) as returned 
               FROM tblpurchase_items WHERE p_item_id = ?`,
              [item.purchaseId, item.purchaseId]
            );
            if (checkQty.length > 0 && checkQty[0].returned >= checkQty[0].quantity) {
              await connection.query(
                'UPDATE tblpurchase_items SET Status = 2 WHERE p_item_id = ?',
                [item.purchaseId]
              );
            }
          }
        }
      }

      // Record in tblsupplierpay
      await connection.query(
        `INSERT INTO tblsupplierpay (SupplierID, Amt, Date, UserID, VNO, Rmk) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [supplierId, refundTotal, currentDate, userId, purchaseInvoiceNo, `Purchase Return (Voucher: ${purchaseInvoiceNo})`]
      );

      await connection.commit();
      return returnVoucherId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get all purchase returns with pagination
  async findAll({ page = 1, limit = 10, search = '', fromDate = '', toDate = '' }) {
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params = [];
    
    if (search) {
      whereClause += ' AND (prv.VNO LIKE ? OR s.Supplier LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }
    
    if (fromDate) {
      whereClause += ' AND DATE(prv.Date) >= ?';
      params.push(fromDate);
    }
    
    if (toDate) {
      whereClause += ' AND DATE(prv.Date) <= ?';
      params.push(toDate);
    }

    // Count query
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM tblpurchase_return_voucher prv
       LEFT JOIN tblsupplier s ON prv.SupplierID = s.AID
       WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get purchase returns
    const [rows] = await pool.query(
      `SELECT 
        prv.AID as id,
        prv.VNO as vno,
        prv.SupplierID as supplierId,
        s.Supplier as supplierName,
        prv.OriginalAmount as originalAmount,
        prv.ReturnAmount as returnAmount,
        prv.Reason as reason,
        prv.Date as date,
        prv.UserID as userId,
        u.UserName as userName,
        COALESCE(SUM(pr.ReturnQty), 0) as totalQty,
        COALESCE(SUM(pr.SubTotal), 0) as subTotal
       FROM tblpurchase_return_voucher prv
       LEFT JOIN tblsupplier s ON prv.SupplierID = s.AID
       LEFT JOIN tbluser u ON prv.UserID = u.AID
       LEFT JOIN tblpurchase_return pr ON prv.AID = pr.ReturnVoucherID
       WHERE ${whereClause}
       GROUP BY prv.AID, prv.VNO, prv.SupplierID, s.Supplier, 
                prv.Reason, prv.OriginalAmount, prv.ReturnAmount, prv.Date, prv.UserID, u.UserName
       ORDER BY prv.Date DESC, prv.AID DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: rows.map(row => ({
        id: row.id.toString(),
        vno: row.vno,
        supplierId: row.supplierId?.toString() || '',
        supplierName: row.supplierName || '',
        reason: row.reason,
        originalAmount: parseFloat(row.originalAmount) || 0,
        returnAmount: parseFloat(row.returnAmount) || 0,
        date: row.date,
        userId: row.userId?.toString() || '',
        userName: row.userName || '',
        totalQty: parseFloat(row.totalQty) || 0,
        subTotal: parseFloat(row.subTotal) || 0
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  },

  // Get purchase return by ID
  async findById(id) {
    const [voucherRows] = await pool.query(
      `SELECT 
        prv.AID as id,
        prv.VNO as vno,
        prv.SupplierID as supplierId,
        s.Supplier as supplierName,
        prv.OriginalAmount as originalAmount,
        prv.ReturnAmount as returnAmount,
        prv.Reason as reason,
        prv.Date as date,
        prv.UserID as userId,
        u.UserName as userName
       FROM tblpurchase_return_voucher prv
       LEFT JOIN tblsupplier s ON prv.SupplierID = s.AID
       LEFT JOIN tbluser u ON prv.UserID = u.AID
       WHERE prv.AID = ?`,
      [id]
    );

    if (voucherRows.length === 0) {
      return null;
    }

    const voucher = voucherRows[0];

    // Get return items
    const [itemRows] = await pool.query(
      `SELECT 
        pr.AID as id,
        pr.PurchaseID as purchaseId,
        prod.CodeNo as codeNo,
        prod.Name as itemName,
        pr.OriginalQty as originalQty,
        pr.Price as price,
        pr.ReturnQty as returnQty,
        pr.SubTotal as subTotal,
        pr.Date as date,
        pi.imei_1 as imei1,
        pi.imei_2 as imei2
       FROM tblpurchase_return pr
       LEFT JOIN tblpurchase_items pi ON pr.PurchaseID = pi.p_item_id
       LEFT JOIN tblproduct prod ON pi.product_id = prod.AID
       WHERE pr.ReturnVoucherID = ?
       ORDER BY pr.AID`,
      [voucher.id]
    );

    return {
      voucher: {
        id: voucher.id.toString(),
        vno: voucher.vno,
        supplierId: voucher.supplierId?.toString() || '',
        supplierName: voucher.supplierName || '',
        reason: voucher.reason,
        originalAmount: parseFloat(voucher.originalAmount) || 0,
        returnAmount: parseFloat(voucher.returnAmount) || 0,
        date: voucher.date,
        userId: voucher.userId?.toString() || '',
        userName: voucher.userName || ''
      },
      items: itemRows.map(row => ({
        id: row.id.toString(),
        purchaseId: row.purchaseId?.toString() || '',
        itemName: row.itemName || '',
        codeNo: row.codeNo || '',
        originalQty: parseFloat(row.originalQty) || 0,
        price: parseFloat(row.price) || 0,
        returnQty: parseFloat(row.returnQty) || 0,
        subTotal: parseFloat(row.subTotal) || 0,
        date: row.date,
        imei1: row.imei1 || '',
        imei2: row.imei2 || ''
      }))
    };
  },

  // Update purchase return
  async update(id, { purchaseInvoiceNo, supplierId, items, reason, refundTotal, userId }) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get existing return data to restore quantities
      const [existingVoucher] = await connection.query(
        'SELECT VNO FROM tblpurchase_return_voucher WHERE AID = ?',
        [id]
      );

      if (existingVoucher.length === 0) {
        await connection.rollback();
        throw new Error('Purchase return not found');
      }

      const oldVNO = existingVoucher[0].VNO;

      // Get existing return items to restore quantities
      const [existingItems] = await connection.query(
        `SELECT pr.PurchaseID, pr.ReturnQty, prod.CodeNo 
         FROM tblpurchase_return pr
         LEFT JOIN tblpurchase_items pi ON pr.PurchaseID = pi.p_item_id
         LEFT JOIN tblproduct prod ON pi.product_id = prod.AID
         WHERE pr.ReturnVoucherID = ?`,
        [id]
      );

      // Restore quantities in tblproduct
      for (const item of existingItems) {
        if (item.CodeNo) {
          const [remainRows] = await connection.query(
            'SELECT AID FROM tblproduct WHERE CodeNo = ?',
            [item.CodeNo]
          );
          if (remainRows.length > 0) {
            await connection.query(
              'UPDATE tblproduct SET StockQty = StockQty + ? WHERE AID = ?',
              [item.ReturnQty, remainRows[0].AID]
            );

            // Reset Status = 0 in tblpurchase_items when restoring
            await connection.query(
              'UPDATE tblpurchase_items SET Status = 0 WHERE p_item_id = ?',
              [item.PurchaseID]
            );
          }
        }
      }

      // Delete existing return items
      await connection.query(
        'DELETE FROM tblpurchase_return WHERE ReturnVoucherID = ?',
        [id]
      );

      const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // Get original purchase total (OriginalAmount)
      let originalTotal = 0;
      for (const item of items) {
        const [purchaseRow] = await connection.query(
          'SELECT cost_price as PurchasePrice, quantity as Qty FROM tblpurchase_items WHERE p_item_id = ?',
          [item.purchaseId]
        );
        if (purchaseRow.length > 0) {
          originalTotal += (parseFloat(purchaseRow[0].PurchasePrice) || 0) * (parseInt(purchaseRow[0].Qty) || 0);
        }
      }

      // Update tblpurchase_return_voucher
      await connection.query(
        `UPDATE tblpurchase_return_voucher 
         SET VNO = ?, SupplierID = ?, OriginalAmount = ?, ReturnAmount = ?, Reason = ?, Date = ?
         WHERE AID = ?`,
        [purchaseInvoiceNo, supplierId, originalTotal, refundTotal, reason, currentDate, id]
      );

      // Insert new return items
      for (const item of items) {
        if (item.returnQty > 0) {
          await connection.query(
            `INSERT INTO tblpurchase_return 
             (ReturnVoucherID, VNO, PurchaseID, SupplierID, OriginalQty, Price, ReturnQty, Date, SubTotal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              purchaseInvoiceNo,
              item.purchaseId,
              supplierId,
              item.oldQty,
              item.costPrice,
              item.returnQty,
              currentDate,
              item.refundSubtotal
            ]
          );

          if (item.remainId) {
            // Update tblproduct: StockQty = StockQty - ReturnQty
            await connection.query(
              'UPDATE tblproduct SET StockQty = StockQty - ? WHERE AID = ?',
              [item.returnQty, item.remainId]
            );

            // Set Status = 2 only if fully returned
            const [checkQty] = await connection.query(
              `SELECT quantity, (SELECT COALESCE(SUM(ReturnQty), 0) FROM tblpurchase_return WHERE PurchaseID = ?) as returned 
               FROM tblpurchase_items WHERE p_item_id = ?`,
              [item.purchaseId, item.purchaseId]
            );
            if (checkQty.length > 0 && checkQty[0].returned >= checkQty[0].quantity) {
              await connection.query(
                'UPDATE tblpurchase_items SET Status = 2 WHERE p_item_id = ?',
                [item.purchaseId]
              );
            }
          }
        }
      }

      // Update tblsupplierpay record
      const [existingPay] = await connection.query(
        `SELECT AID FROM tblsupplierpay WHERE Rmk LIKE ?`,
        [`Purchase Return (ID: ${id})%`]
      );

      if (existingPay.length > 0) {
        await connection.query(
          `UPDATE tblsupplierpay 
           SET SupplierID = ?, Amt = ?, Date = ?, UserID = ?, VNO = ? 
           WHERE AID = ?`,
          [supplierId, refundTotal, currentDate, userId, purchaseInvoiceNo, existingPay[0].AID]
        );
      } else {
        await connection.query(
          `INSERT INTO tblsupplierpay (SupplierID, Amt, Date, UserID, VNO, Rmk) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [supplierId, refundTotal, currentDate, userId, purchaseInvoiceNo, `Purchase Return (ID: ${id})`]
        );
      }

      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Delete purchase return
  async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get purchase return voucher
      const [voucherRows] = await connection.query(
        'SELECT VNO FROM tblpurchase_return_voucher WHERE AID = ?',
        [id]
      );

      if (voucherRows.length === 0) {
        await connection.rollback();
        return false;
      }

      const vno = voucherRows[0].VNO;

      // Get return items with PurchaseID to find RemainID
      const [itemRows] = await connection.query(
        `SELECT pr.PurchaseID, pr.ReturnQty, prod.CodeNo 
         FROM tblpurchase_return pr
         LEFT JOIN tblpurchase_items pi ON pr.PurchaseID = pi.p_item_id
         LEFT JOIN tblproduct prod ON pi.product_id = prod.AID
         WHERE pr.ReturnVoucherID = ?`,
        [id]
      );

      // Restore quantities in tblproduct: StockQty = StockQty + ReturnQty
      for (const item of itemRows) {
        if (item.CodeNo) {
          // Find RemainID by CodeNo
          const [remainRows] = await connection.query(
            'SELECT AID FROM tblproduct WHERE CodeNo = ?',
            [item.CodeNo]
          );
          if (remainRows.length > 0) {
            await connection.query(
              'UPDATE tblproduct SET StockQty = StockQty + ? WHERE AID = ?',
              [item.ReturnQty, remainRows[0].AID]
            );

            // Reset Status = 0 in tblpurchase_items when deleting return
            await connection.query(
              'UPDATE tblpurchase_items SET Status = 0 WHERE p_item_id = ?',
              [item.PurchaseID]
            );
          }
        }
      }

      // Delete from tblpurchase_return
      await connection.query(
        'DELETE FROM tblpurchase_return WHERE ReturnVoucherID = ?',
        [id]
      );

      // Delete from tblpurchase_return_voucher
      await connection.query(
        'DELETE FROM tblpurchase_return_voucher WHERE AID = ?',
        [id]
      );

      // Delete corresponding record from tblsupplierpay (New)
      // Search by Remark containing the ID
      await connection.query(
        `DELETE FROM tblsupplierpay WHERE Rmk LIKE ?`,
        [`Purchase Return (ID: ${id})%`]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = purchaseReturnModel;

