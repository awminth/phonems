const { pool } = require('../config/database');

const productModel = {
  // Find all products with pagination and search
  async findAll({ page = 1, limit = 10, search = '' }) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, c.Category as CategoryName, s.Supplier as SupplierName 
      FROM tblproduct p
      LEFT JOIN tblcategory c ON p.CategoryID = c.AID
      LEFT JOIN tblsupplier s ON p.SupplierID = s.AID
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM tblproduct p';
    const params = [];
    const countParams = [];
    
    if (search) {
      const searchCondition = ' WHERE p.CodeNo LIKE ? OR p.Name LIKE ?';
      query += searchCondition;
      countQuery += searchCondition;
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY p.AID DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: rows.map(row => ({
        id: row.AID.toString(),
        code: row.CodeNo,
        name: row.Name,
        categoryId: row.CategoryID ? row.CategoryID.toString() : '',
        categoryName: row.CategoryName || '',
        supplierId: row.SupplierID ? row.SupplierID.toString() : '',
        supplierName: row.SupplierName || '',
        isSerialized: !!row.IsSerialized,
        isService: !!row.IsService,
        isSparePart: !!row.IsSparePart,
        sellingPrice: parseFloat(row.SellingPrice),
        sellPrice: parseFloat(row.SellingPrice),
        minStockQty: row.MinStockQty
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

  // Find product by ID
  async findById(id) {
    const query = `
      SELECT p.*, c.Category as CategoryName, s.Supplier as SupplierName 
      FROM tblproduct p
      LEFT JOIN tblcategory c ON p.CategoryID = c.AID
      LEFT JOIN tblsupplier s ON p.SupplierID = s.AID
      WHERE p.AID = ?
    `;
    const [rows] = await pool.query(query, [id]);
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.AID.toString(),
      code: row.CodeNo,
      name: row.Name,
      categoryId: row.CategoryID ? row.CategoryID.toString() : '',
      categoryName: row.CategoryName || '',
      supplierId: row.SupplierID ? row.SupplierID.toString() : '',
      supplierName: row.SupplierName || '',
      isSerialized: !!row.IsSerialized,
      isService: !!row.IsService,
      isSparePart: !!row.IsSparePart,
      sellingPrice: parseFloat(row.SellingPrice),
      sellPrice: parseFloat(row.SellingPrice),
      minStockQty: row.MinStockQty
    };
  },

  // Create new product
  async create(data) {
    const { code, name, categoryId, supplierId, isSerialized, isService, isSparePart, sellingPrice, sellPrice, minStockQty } = data;
    const price = sellingPrice !== undefined ? sellingPrice : (sellPrice !== undefined ? sellPrice : 0);
    const [result] = await pool.query(
      'INSERT INTO tblproduct (CodeNo, Name, CategoryID, SupplierID, IsSerialized, IsService, IsSparePart, SellingPrice, MinStockQty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [code, name, categoryId || null, supplierId || null, isSerialized ? 1 : 0, isService ? 1 : 0, isSparePart ? 1 : 0, price || 0, minStockQty || 0]
    );
    
    return this.findById(result.insertId);
  },

  // Update product
  async update(id, data) {
    const { code, name, categoryId, supplierId, isSerialized, isService, isSparePart, sellingPrice, sellPrice, minStockQty, userId, branchId } = data;
    const price = sellingPrice !== undefined ? sellingPrice : (sellPrice !== undefined ? sellPrice : 0);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Get current price
      const [current] = await connection.query(
        'SELECT SellingPrice FROM tblproduct WHERE AID = ?',
        [id]
      );
      const oldPrice = current[0]?.SellingPrice || 0;

      // 2. Update product
      const [result] = await connection.query(
        'UPDATE tblproduct SET CodeNo = ?, Name = ?, CategoryID = ?, SupplierID = ?, IsSerialized = ?, IsService = ?, IsSparePart = ?, SellingPrice = ?, MinStockQty = ? WHERE AID = ?',
        [code, name, categoryId || null, supplierId || null, isSerialized ? 1 : 0, isService ? 1 : 0, isSparePart ? 1 : 0, price || 0, minStockQty || 0, id]
      );
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        return null;
      }

      // 3. Record price history if price changed
      if (oldPrice !== parseFloat(price)) {
        await connection.query(
          'INSERT INTO tblselling_price_history (ProductID, OldPrice, NewPrice, UserID, BranchID) VALUES (?, ?, ?, ?, ?)',
          [id, oldPrice, price, userId || null, branchId || null]
        );
      }

      await connection.commit();
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },


  // Bulk create/update products (Upsert)
  async bulkCreate(products) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      let insertedCount = 0;
      let updatedCount = 0;
      
      for (const item of products) {
        const { code, name, categoryId, supplierId, isSerialized, isService, isSparePart, sellingPrice, sellPrice, minStockQty } = item;
        const price = sellingPrice !== undefined ? sellingPrice : (sellPrice !== undefined ? sellPrice : 0);
        
        // Check if CodeNo already exists
        const [existing] = await connection.query(
          'SELECT AID, SellingPrice FROM tblproduct WHERE CodeNo = ?',
          [code]
        );
        
        if (existing.length > 0) {
          const productId = existing[0].AID;
          const oldPrice = parseFloat(existing[0].SellingPrice) || 0;
          
          await connection.query(
            'UPDATE tblproduct SET Name = ?, CategoryID = ?, SupplierID = ?, IsSerialized = ?, IsService = ?, IsSparePart = ?, SellingPrice = ?, MinStockQty = ? WHERE AID = ?',
            [name, categoryId || null, supplierId || null, isSerialized ? 1 : 0, isService ? 1 : 0, isSparePart ? 1 : 0, price || 0, minStockQty || 0, productId]
          );
          
          // Record price history if price changed
          if (oldPrice !== parseFloat(price)) {
            await connection.query(
              'INSERT INTO tblselling_price_history (ProductID, OldPrice, NewPrice, UserID, BranchID) VALUES (?, ?, ?, ?, ?)',
              [productId, oldPrice, price, null, null]
            );
          }
          updatedCount++;
        } else {
          // Insert new product
          await connection.query(
            'INSERT INTO tblproduct (CodeNo, Name, CategoryID, SupplierID, IsSerialized, IsService, IsSparePart, SellingPrice, MinStockQty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [code, name, categoryId || null, supplierId || null, isSerialized ? 1 : 0, isService ? 1 : 0, isSparePart ? 1 : 0, price || 0, minStockQty || 0]
          );
          insertedCount++;
        }
      }
      
      await connection.commit();
      return { insertedCount, updatedCount };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Delete product
  async delete(id) {
    const [result] = await pool.query('DELETE FROM tblproduct WHERE AID = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = productModel;
