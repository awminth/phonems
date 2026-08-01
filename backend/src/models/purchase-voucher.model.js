const { pool } = require('../config/database');

// Table: tblpurchase_voucher (AID, VNO, SupplierID, Amount, Date, UserID)
// Table: tblpurchase (AID, VNO, CodeNo, ItemName, Qty, PurchasePrice, SellPrice, CategoryID, SupplierID, Date, Img)

const purchaseVoucherModel = {
  // Get all purchase vouchers with pagination
  async findAll({ page = 1, limit = 10, search = '', fromDate = '', toDate = '', userType, branchId }) {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = '1=1';
      const params = [];

      if (userType !== 'admin' && branchId) {
        whereClause += ' AND p.BranchID = ?';
        params.push(branchId);
      }
      
      if (search) {
        whereClause += ' AND (p.invoice_no LIKE ? OR s.Supplier LIKE ?)';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }
      
      if (fromDate) {
        whereClause += ' AND DATE(p.purchase_date) >= ?';
        params.push(fromDate);
      }
      
      if (toDate) {
        whereClause += ' AND DATE(p.purchase_date) <= ?';
        params.push(toDate);
      }

      // Count query
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total 
         FROM tblpurchases p
         LEFT JOIN tblsupplier s ON p.supplier_id = s.AID
         WHERE ${whereClause}`,
        params
      );
      const total = countResult[0]?.total || 0;

      // Get purchase vouchers
      const [rows] = await pool.query(
        `SELECT 
          p.purchase_id as id,
          p.invoice_no as vno,
          p.supplier_id as supplierId,
          COALESCE(s.Supplier, '') as supplierName,
          p.net_amount as amount,
          p.purchase_date as date,
          COALESCE((SELECT SUM(Amt) FROM tblsupplierpay WHERE VNO = p.invoice_no), p.paid_amount, 0) as totalPaid,
          p.status,
          COALESCE(b.BranchName, 'Unknown') as branchName
         FROM tblpurchases p
         LEFT JOIN tblsupplier s ON p.supplier_id = s.AID
         LEFT JOIN tblbranch b ON p.BranchID = b.AID
         WHERE ${whereClause}
         ORDER BY p.purchase_date DESC, p.purchase_id DESC
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
          amount: parseFloat(row.amount) || 0,
          date: row.date,
          totalPaid: parseFloat(row.totalPaid) || 0,
          status: row.status,
          branchName: row.branchName
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
    } catch (error) {
      console.error('purchaseVoucherModel.findAll error:', error);
      throw error;
    }
  },

  // Get purchase voucher by ID with items
  async findById(id, { userType, branchId } = {}) {
    const [voucherRows] = await pool.query(
      `SELECT 
        p.purchase_id as id,
        p.invoice_no as vno,
        p.supplier_id as supplierId,
        COALESCE(s.Supplier, '') as supplierName,
        p.net_amount as netAmount,
        p.total_amount as totalAmount,
        p.tax_amount as taxAmount,
        p.discount,
        p.purchase_date as date,
        COALESCE((SELECT SUM(Amt) FROM tblsupplierpay WHERE VNO = p.invoice_no), p.paid_amount, 0) as totalPaid,
        p.status,
        p.BranchID
       FROM tblpurchases p
       LEFT JOIN tblsupplier s ON p.supplier_id = s.AID
       WHERE p.purchase_id = ?`,
      [id]
    );


    if (voucherRows.length === 0) {
      return null;
    }

    const voucher = voucherRows[0];

    // Branch check for non-admin
    if (userType !== 'admin' && branchId && voucher.BranchID && voucher.BranchID != branchId) {
       return null;
    }

    // Get purchase items
    const [itemRows] = await pool.query(
      `SELECT 
        pi.p_item_id as id,
        pi.product_id as productId,
        prod.CodeNo as codeNo,
        prod.Name as itemName,
        pi.quantity as qty,
        pi.cost_price as purchasePrice,
        COALESCE(pi.sell_price, prod.SellingPrice) as sellPrice,
        prod.CategoryID as categoryId,
        c.Category as categoryName,
        pi.imei_1 as imei1,
        pi.imei_2 as imei2,
        pi.specification as specification,
        prod.IsSerialized as isSerialized
       FROM tblpurchase_items pi
       JOIN tblproduct prod ON pi.product_id = prod.AID
       LEFT JOIN tblcategory c ON prod.CategoryID = c.AID
       WHERE pi.purchase_id = ?`,
      [voucher.id]
    );

    return {
      voucher: {
        vno: voucher.vno,
        supplierId: voucher.supplierId?.toString() || '',
        supplierName: voucher.supplierName,
        date: voucher.date,
        totalAmount: parseFloat(voucher.totalAmount) || 0,
        taxAmount: parseFloat(voucher.taxAmount) || 0,
        discount: parseFloat(voucher.discount) || 0,
        netAmount: parseFloat(voucher.netAmount) || 0,
        totalPaid: parseFloat(voucher.totalPaid) || 0,
        status: voucher.status
      },
      items: itemRows.map(row => ({
        id: row.id.toString(),
        codeNo: row.codeNo,
        itemName: row.itemName,
        qty: parseInt(row.qty) || 0,
        purchasePrice: parseFloat(row.purchasePrice) || 0,
        sellPrice: parseFloat(row.sellPrice) || 0,
        categoryId: row.categoryId?.toString() || '',
        categoryName: row.categoryName || '',
        imei1: row.imei1 || '',
        imei2: row.imei2 || '',
        specification: row.specification || '',
        isSerialized: !!row.isSerialized,
        productId: row.productId?.toString() || ''
      }))
    };
  },

  // Get purchase voucher by VNO
  async findByVNO(vno, { userType, branchId } = {}) {
    let query = `SELECT purchase_id as id FROM tblpurchases WHERE invoice_no = ?`;
    let params = [vno];
    if (userType !== 'admin' && branchId) {
      query += ' AND BranchID = ?';
      params.push(branchId);
    }
    const [rows] = await pool.query(query, params);
    if (rows.length === 0) return null;
    return this.findById(rows[0].id, { userType, branchId });
  },

  // Create purchase voucher with items
  async create({ vno, supplierId, items, userId, taxAmount = 0, discount = 0, paidAmount = 0, totalAmount = 0, netAmount = 0, balanceAmount = 0, status = 'Paid', branchId }) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // Calculate total amount if not provided
      if (!totalAmount) {
        totalAmount = items.reduce((sum, item) => sum + (item.qty * item.purchasePrice), 0);
      }
      
      if (!netAmount) {
        netAmount = totalAmount + taxAmount - discount;
      }
      
      if (!balanceAmount && balanceAmount !== 0) {
        balanceAmount = netAmount - paidAmount;
      }

      // 1. Insert into tblpurchases (New Schema) - This tracks the voucher header
      const [newPurchaseResult] = await connection.query(
        `INSERT INTO tblpurchases (invoice_no, supplier_id, purchase_date, total_amount, tax_amount, discount, net_amount, paid_amount, balance_amount, status, BranchID)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [vno, supplierId, currentDate, totalAmount, taxAmount, discount, netAmount, paidAmount, balanceAmount, status, branchId]
      );
      const newPurchaseId = newPurchaseResult.insertId;

      // 1.1 Insert initial payment into tblsupplierpay if any
      if (paidAmount > 0) {
        await connection.query(
          'INSERT INTO tblsupplierpay (SupplierID, Amt, Date, UserID, VNO, Rmk, BranchID) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [supplierId, paidAmount, currentDate, userId || null, vno, 'Initial payment at purchase', branchId]
        );
      }

      // ----------------------------------------------------
      // VALIDATE IMEIs UNIQUENESS
      // ----------------------------------------------------
      const allImeisInBatch = new Set();
      for (const item of items) {
        if (item.imei1) {
          if (allImeisInBatch.has(item.imei1)) {
            throw new Error(`Duplicate IMEI found in current batch: ${item.imei1}`);
          }
          allImeisInBatch.add(item.imei1);
        }
        if (item.imei2) {
          if (allImeisInBatch.has(item.imei2)) {
            throw new Error(`Duplicate IMEI found in current batch: ${item.imei2}`);
          }
          allImeisInBatch.add(item.imei2);
        }
      }

      if (allImeisInBatch.size > 0) {
        const imeiArray = Array.from(allImeisInBatch);
        const placeholders = imeiArray.map(() => '?').join(',');
        const [duplicateRows] = await connection.query(
          `SELECT imei_1, imei_2 FROM tblpurchase_items 
           WHERE imei_1 IN (${placeholders}) OR imei_2 IN (${placeholders})`,
          [...imeiArray, ...imeiArray]
        );

        if (duplicateRows.length > 0) {
          const dup = duplicateRows[0].imei_1 || duplicateRows[0].imei_2;
          throw new Error(`IMEI ${dup} already exists in database.`);
        }
      }

      // ----------------------------------------------------
      // PROCESS EACH ITEM (SINGLE UNIFIED LOOP)
      // ----------------------------------------------------
      for (const item of items) {
        const subTotal = item.qty * item.purchasePrice;

        // Step 1: Resolve productId from tblproduct (create or update)
        let productId = null;
        const [existingProduct] = await connection.query(
          'SELECT AID, SellingPrice FROM tblproduct WHERE CodeNo = ?',
          [item.codeNo]
        );


        if (existingProduct.length > 0) {
          productId = existingProduct[0].AID;
          const oldPrice = existingProduct[0].SellingPrice || 0;

          await connection.query(
            `UPDATE tblproduct SET 
              StockQty = StockQty + ?,
              Name = ?,
              PurchasePrice = ?,
              SellingPrice = ?,
              CategoryID = ?,
              SupplierID = ?,
              Img = COALESCE(?, Img)
            WHERE AID = ?`,
            [item.qty, item.itemName, item.purchasePrice, item.sellPrice, item.categoryId || null, supplierId, item.image || null, productId]
          );

          // Record price history if price changed
          if (parseFloat(oldPrice) !== parseFloat(item.sellPrice)) {
            await connection.query(
              'INSERT INTO tblselling_price_history (ProductID, OldPrice, NewPrice, UserID, BranchID) VALUES (?, ?, ?, ?, ?)',
              [productId, oldPrice, item.sellPrice, userId || null, branchId || null]
            );
          }
        } else {

          const [newProductResult] = await connection.query(
            `INSERT INTO tblproduct (CodeNo, Name, StockQty, PurchasePrice, SellingPrice, CategoryID, SupplierID, Img)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [item.codeNo, item.itemName, item.qty, item.purchasePrice, item.sellPrice, item.categoryId || null, supplierId, item.image || null]
          );
          productId = newProductResult.insertId;
        }

        // Step 2: Insert into tblpurchase_items (New Schema) with correct productId
        await connection.query(
          `INSERT INTO tblpurchase_items (purchase_id, product_id, imei_1, imei_2, specification, cost_price, sell_price, quantity, sub_total, BranchID)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newPurchaseId, productId, item.imei1 || null, item.imei2 || null, item.specification || null, item.purchasePrice, item.sellPrice || 0, item.qty, subTotal, branchId]
        );
      }

      await connection.commit();
      return vno;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update purchase voucher
  async update(id, { supplierId, items, userId, taxAmount = 0, discount = 0, paidAmount = 0, totalAmount, netAmount, balanceAmount, status = 'Paid', userType, branchId }) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 1. Get existing purchase header
      const [oldPurchaseRows] = await connection.query(
        'SELECT purchase_id, invoice_no FROM tblpurchases WHERE purchase_id = ?',
        [id]
      );
      
      if (oldPurchaseRows.length === 0) {
        await connection.rollback();
        return null;
      }
      
      const purchaseId = oldPurchaseRows[0].purchase_id;
      const vno = oldPurchaseRows[0].invoice_no;

      // 2. Calculate amounts if not provided
      if (!totalAmount) {
        totalAmount = items.reduce((sum, item) => sum + (item.qty * item.purchasePrice), 0);
      }
      if (!netAmount) {
        netAmount = totalAmount + taxAmount - discount;
      }
      if (!balanceAmount && balanceAmount !== 0) {
        balanceAmount = netAmount - paidAmount;
      }

      // 3. Reverse stock for old items
      const [oldItems] = await connection.query(
        'SELECT product_id, quantity FROM tblpurchase_items WHERE purchase_id = ?',
        [purchaseId]
      );
      
      for (const item of oldItems) {
        await connection.query(
          'UPDATE tblproduct SET StockQty = StockQty - ? WHERE AID = ?',
          [item.quantity, item.product_id]
        );
      }
      
      // Delete existing items only
      await connection.query('DELETE FROM tblpurchase_items WHERE purchase_id = ?', [purchaseId]);

      // 4. Update the existing header instead of re-inserting
      let updateWhere = 'purchase_id = ?';
      let updateParams = [supplierId, totalAmount, taxAmount, discount, netAmount, paidAmount, balanceAmount, status, purchaseId];

      if (userType !== 'admin' && branchId) {
        updateWhere += ' AND BranchID = ?';
        updateParams.push(branchId);
      }

      const [updateResult] = await connection.query(
        `UPDATE tblpurchases SET 
          supplier_id = ?, 
          total_amount = ?, 
          tax_amount = ?, 
          discount = ?, 
          net_amount = ?, 
          paid_amount = ?, 
          balance_amount = ?, 
          status = ?
         WHERE ${updateWhere}`,
        updateParams
      );

      if (updateResult.affectedRows === 0) {
        throw new Error('Purchase not found or permission denied');
      }

      // ----------------------------------------------------
      // VALIDATE IMEIs UNIQUENESS
      // ----------------------------------------------------
      const allImeisInBatch = new Set();
      for (const item of items) {
        if (item.imei1) {
          if (allImeisInBatch.has(item.imei1)) {
            throw new Error(`Duplicate IMEI found in current batch: ${item.imei1}`);
          }
          allImeisInBatch.add(item.imei1);
        }
        if (item.imei2) {
          if (allImeisInBatch.has(item.imei2)) {
            throw new Error(`Duplicate IMEI found in current batch: ${item.imei2}`);
          }
          allImeisInBatch.add(item.imei2);
        }
      }

      if (allImeisInBatch.size > 0) {
        const imeiArray = Array.from(allImeisInBatch);
        const placeholders = imeiArray.map(() => '?').join(',');
        // Old items are already deleted from tblpurchase_items
        const [duplicateRows] = await connection.query(
          `SELECT imei_1, imei_2 FROM tblpurchase_items 
           WHERE imei_1 IN (${placeholders}) OR imei_2 IN (${placeholders})`,
          [...imeiArray, ...imeiArray]
        );

        if (duplicateRows.length > 0) {
          const dup = duplicateRows[0].imei_1 || duplicateRows[0].imei_2;
          throw new Error(`IMEI ${dup} already exists in database.`);
        }
      }

      for (const item of items) {
        const subTotal = item.qty * item.purchasePrice;
        
        let productId = null;
        const [existingProduct] = await connection.query(
          'SELECT AID, SellingPrice FROM tblproduct WHERE CodeNo = ?',
          [item.codeNo]
        );

        if (existingProduct.length > 0) {
          productId = existingProduct[0].AID;
          const oldPrice = existingProduct[0].SellingPrice || 0;

          await connection.query(
            `UPDATE tblproduct SET 
              StockQty = StockQty + ?,
              Name = ?,
              PurchasePrice = ?,
              SellingPrice = ?,
              CategoryID = ?,
              SupplierID = ?,
              Img = COALESCE(?, Img)
            WHERE AID = ?`,
            [item.qty, item.itemName, item.purchasePrice, item.sellPrice, item.categoryId || null, supplierId, item.image || null, productId]
          );

          // Record price history if price changed
          if (parseFloat(oldPrice) !== parseFloat(item.sellPrice)) {
            await connection.query(
              'INSERT INTO tblselling_price_history (ProductID, OldPrice, NewPrice, UserID, BranchID) VALUES (?, ?, ?, ?, ?)',
              [productId, oldPrice, item.sellPrice, userId || null, branchId || null]
            );
          }
        } else {

          const [newProductResult] = await connection.query(
            `INSERT INTO tblproduct (CodeNo, Name, StockQty, PurchasePrice, SellingPrice, CategoryID, SupplierID, Img)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [item.codeNo, item.itemName, item.qty, item.purchasePrice, item.sellPrice, item.categoryId || null, supplierId, item.image || null]
          );
          productId = newProductResult.insertId;
        }

        await connection.query(
          `INSERT INTO tblpurchase_items (purchase_id, product_id, imei_1, imei_2, specification, cost_price, sell_price, quantity, sub_total, BranchID)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [purchaseId, productId, item.imei1 || null, item.imei2 || null, item.specification || null, item.purchasePrice, item.sellPrice || 0, item.qty, subTotal, branchId]
        );
      }


      await connection.commit();
      return vno;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Delete purchase voucher
  async delete(id, { userType, branchId } = {}) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
        // 1. Get purchase header to find items and reverse stock
        const [voucherRows] = await connection.query(
          'SELECT purchase_id, invoice_no, BranchID FROM tblpurchases WHERE purchase_id = ?',
          [id]
        );

        if (voucherRows.length > 0) {
          const purchaseId = voucherRows[0].purchase_id;
          const vno = voucherRows[0].invoice_no;
          const headerBranchId = voucherRows[0].BranchID;

          if (userType !== 'admin' && branchId && headerBranchId && headerBranchId != branchId) {
            await connection.rollback();
            return false;
          }

          // 2. Get items to reverse stock
          const [items] = await connection.query(
            `SELECT pi.product_id, pi.quantity, prod.CodeNo 
             FROM tblpurchase_items pi
             JOIN tblproduct prod ON pi.product_id = prod.AID
             WHERE pi.purchase_id = ?`,
            [purchaseId]
          );

          for (const item of items) {
            await connection.query(
              'UPDATE tblproduct SET StockQty = StockQty - ? WHERE AID = ?',
              [item.quantity, item.product_id]
            );
          }

          // 3. Delete from related tables
          await connection.query('DELETE FROM tblpurchase_items WHERE purchase_id = ?', [purchaseId]);
          await connection.query('DELETE FROM tblsupplierpay WHERE VNO = ? AND BranchID = ?', [vno, headerBranchId || branchId]);
          await connection.query('DELETE FROM tblpurchases WHERE purchase_id = ?', [purchaseId]);
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

  // Get next VNO
  async getNextVNO() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const prefix = `PUR${dateStr}`;
    
    const [result] = await pool.query(
      `SELECT invoice_no as VNO FROM tblpurchases WHERE invoice_no LIKE ? ORDER BY invoice_no DESC LIMIT 1`,
      [`${prefix}%`]
    );
    
    let counter = 1;
    if (result.length > 0) {
      const lastVNO = result[0].VNO;
      const lastCounter = parseInt(lastVNO.substring(prefix.length)) || 0;
      counter = lastCounter + 1;
    }
    
    return `${prefix}${counter.toString().padStart(4, '0')}`;
  }
};

module.exports = purchaseVoucherModel;

