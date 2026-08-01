const { pool } = require('../config/database');

const getImeiHistory = async (req, res) => {
  const { imei } = req.params;
  if (!imei) {
    return res.status(400).json({ success: false, message: 'IMEI is required' });
  }

  try {
    const { userType, branchId } = req.user;
    let branchCondition = '1=1';
    let branchParams = [];

    if (userType !== 'admin' && branchId) {
      branchCondition = 'BranchID = ?';
      branchParams.push(branchId);
    }

    // 1. Get Product Info
    const [productInfo] = await pool.query(
      `SELECT 
        AID as id,
        Name as itemName,
        CodeNo as codeNo,
        SellingPrice as currentPrice
       FROM tblproduct
       WHERE AID = (
         SELECT product_id FROM tblpurchase_items WHERE (imei_1 = ? OR imei_2 = ?) ${branchId ? 'AND BranchID = ?' : ''} LIMIT 1
       ) OR AID = (
         SELECT RemainID FROM tblsale WHERE RegisterKey = ? ${branchId ? 'AND BranchID = ?' : ''} LIMIT 1
       ) OR AID = (
         SELECT ProductID FROM tbldamage WHERE Imei = ? ${branchId ? 'AND BranchID = ?' : ''} LIMIT 1
       )`,
      branchId ? [imei, imei, branchId, imei, branchId, imei, branchId] : [imei, imei, imei, imei]
    );

    // 2. Get Purchase History
    let purchaseQuery = `SELECT 
        p.invoice_no as vno,
        p.purchase_date as date,
        s.Supplier as person,
        pi.cost_price as price,
        'Purchase' as type,
        b.BranchName as branchName,
        FALSE as isReturned
       FROM tblpurchase_items pi
       JOIN tblpurchases p ON pi.purchase_id = p.purchase_id
       LEFT JOIN tblsupplier s ON p.supplier_id = s.AID
       LEFT JOIN tblbranch b ON pi.BranchID = b.AID
       WHERE (pi.imei_1 = ? OR pi.imei_2 = ?)`;
    let purchaseParams = [imei, imei];

    if (userType !== 'admin' && branchId) {
      purchaseQuery += ' AND pi.BranchID = ?';
      purchaseParams.push(branchId);
    }

    const [purchases] = await pool.query(purchaseQuery, purchaseParams);

    // 3. Get Sale History
    let saleQuery = `SELECT 
        s.VNO as vno,
        s.Date as date,
        c.Name as person,
        s.SellPrice as price,
        'Sale' as type,
        b.BranchName as branchName,
        FALSE as isReturned
       FROM tblsale s
       JOIN tblvoucher v ON s.VNO = v.VNO
       LEFT JOIN tblcustomer c ON v.CustomerID = c.AID
       LEFT JOIN tblbranch b ON s.BranchID = b.AID
       WHERE s.RegisterKey = ?`;
    let saleParams = [imei];

    if (userType !== 'admin' && branchId) {
      saleQuery += ' AND s.BranchID = ?';
      saleParams.push(branchId);
    }

    const [sales] = await pool.query(saleQuery, saleParams);

    // 4. Get Damage History
    let damageQuery = `SELECT 
        CONCAT('DAM-', d.AID) as vno,
        d.Date as date,
        u.UserName as person,
        0 as price,
        'Damage' as type,
        b.BranchName as branchName,
        FALSE as isReturned,
        d.Reason as reason
       FROM tbldamage d
       LEFT JOIN tbluser u ON d.UserID = u.AID
       LEFT JOIN tblbranch b ON d.BranchID = b.AID
       WHERE d.Imei = ?`;
    let damageParams = [imei];

    if (userType !== 'admin' && branchId) {
      damageQuery += ' AND d.BranchID = ?';
      damageParams.push(branchId);
    }

    const [damages] = await pool.query(damageQuery, damageParams);

    // Combine and sort logically
    const history = [...purchases, ...sales, ...damages].sort((a, b) => {
      const d1 = new Date(a.date);
      const d2 = new Date(b.date);
      
      const date1 = d1.toISOString().split('T')[0];
      const date2 = d2.toISOString().split('T')[0];
      
      if (date1 !== date2) {
        return d1.getTime() - d2.getTime();
      }
      
      // If same day, enforce logical order: Purchase (1) -> Damage (2) -> Sale (3)
      // Damage usually happens after purchase but before sale, or after a sale return
      const order = { 'Purchase': 1, 'Damage': 2, 'Sale': 3 };
      return (order[a.type] || 0) - (order[b.type] || 0);
    });

    res.json({
      success: true,
      data: {
        product: productInfo[0] || null,
        history: history
      }
    });
  } catch (error) {
    console.error('getImeiHistory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch IMEI history' });
  }
};

const getImeiSuggestions = async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { userType, branchId } = req.user;
    let branchClause = '';
    if (userType !== 'admin' && branchId) {
      branchClause = ' AND BranchID = ?';
    }

    // Search in tblpurchase_items, tblsale, and tbldamage for matching IMEIs
    const [rows] = await pool.query(
      `(SELECT imei_1 as imei FROM tblpurchase_items WHERE imei_1 LIKE ? ${branchClause} LIMIT 5)
       UNION
       (SELECT imei_2 as imei FROM tblpurchase_items WHERE imei_2 LIKE ? ${branchClause} LIMIT 5)
       UNION
       (SELECT RegisterKey as imei FROM tblsale WHERE RegisterKey LIKE ? ${branchClause} LIMIT 5)
       UNION
       (SELECT Imei as imei FROM tbldamage WHERE Imei LIKE ? ${branchClause} LIMIT 5)
       LIMIT 10`,
      branchId ? [`%${query}%`, branchId, `%${query}%`, branchId, `%${query}%`, branchId, `%${query}%`, branchId] : [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
    );

    const suggestions = [...new Set(rows.map(r => r.imei))].filter(Boolean);
    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('getImeiSuggestions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch suggestions' });
  }
};

const getFullImeiList = async (req, res) => {
  const search = req.query.search || '';
  const brandId = req.query.brandId || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    let whereClause = '1=1';
    let params = [];
    if (search) {
      whereClause += ' AND imei LIKE ?';
      params.push(`%${search}%`);
    }
    if (brandId) {
      whereClause += ' AND categoryId = ?';
      params.push(brandId);
    }

    const { userType, branchId: userBranchId } = req.user;
    
    const baseQuery = `
      SELECT DISTINCT imei FROM (
        SELECT pi.imei_1 as imei, pi.BranchID, p.CategoryID as categoryId FROM tblpurchase_items pi LEFT JOIN tblproduct p ON pi.product_id = p.AID WHERE pi.imei_1 IS NOT NULL AND pi.imei_1 != ''
        UNION
        SELECT pi.imei_2 as imei, pi.BranchID, p.CategoryID as categoryId FROM tblpurchase_items pi LEFT JOIN tblproduct p ON pi.product_id = p.AID WHERE pi.imei_2 IS NOT NULL AND pi.imei_2 != ''
        UNION
        SELECT s.RegisterKey as imei, s.BranchID, p.CategoryID as categoryId FROM tblsale s LEFT JOIN tblproduct p ON s.RemainID = p.AID WHERE s.RegisterKey IS NOT NULL AND s.RegisterKey != ''
        UNION
        SELECT d.Imei as imei, d.BranchID, p.CategoryID as categoryId FROM tbldamage d LEFT JOIN tblproduct p ON d.ProductID = p.AID WHERE d.Imei IS NOT NULL AND d.Imei != ''
      ) t
      WHERE ${whereClause} ${userType !== 'admin' && userBranchId ? 'AND BranchID = ?' : ''}
    `;

    const [rows] = await pool.query(
      `${baseQuery} ORDER BY imei ASC LIMIT ? OFFSET ?`,
      userType !== 'admin' && userBranchId ? [...params, userBranchId, limit, offset] : [...params, limit, offset]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(DISTINCT imei) as total FROM (${baseQuery}) t2`,
      userType !== 'admin' && userBranchId ? [...params, userBranchId] : params
    );

    res.json({ 
      success: true, 
      data: rows.map(r => r.imei),
      total: countResult[0].total
    });
  } catch (error) {
    console.error('getFullImeiList error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch IMEI list' });
  }
};

module.exports = { getImeiHistory, getImeiSuggestions, getFullImeiList };
