const pool = require('../config/database').pool;

let tablesChecked = false;

async function ensureTablesExist() {
  if (tablesChecked) return;
  try {
    // 1. tblserviceticket
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tblserviceticket (
        AID INT AUTO_INCREMENT PRIMARY KEY,
        TicketNo VARCHAR(50) NOT NULL,
        CustomerID INT NULL,
        DeviceBrandModel VARCHAR(255) NOT NULL,
        DeviceColor VARCHAR(100) NULL,
        SerialNumberIMEI VARCHAR(100) NULL,
        Password VARCHAR(100) NULL,
        ProblemType VARCHAR(255) NOT NULL,
        TechnicianRemark TEXT NULL,
        EstimatedCompletionDate DATETIME NULL,
        TotalAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        Deposit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        Status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        DeviceImage VARCHAR(255) NULL,
        ScratchCondition TEXT NULL,
        BranchID INT NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_ticket_no (TicketNo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. tblserviceticket_accessories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tblserviceticket_accessories (
        AID INT AUTO_INCREMENT PRIMARY KEY,
        ServiceTicketID INT NOT NULL,
        ProductID INT NOT NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_ticket_id FOREIGN KEY (ServiceTicketID) REFERENCES tblserviceticket (AID) ON DELETE CASCADE,
        CONSTRAINT fk_product_id FOREIGN KEY (ProductID) REFERENCES tblproduct (AID) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. tblserviceticket_parts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tblserviceticket_parts (
        AID INT AUTO_INCREMENT PRIMARY KEY,
        ServiceTicketID INT NOT NULL,
        ProductID INT NULL,
        PartName VARCHAR(255) NOT NULL,
        Qty INT NOT NULL DEFAULT 1,
        Price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        Cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        IsExternal TINYINT(1) NOT NULL DEFAULT 0,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_parts_ticket_id FOREIGN KEY (ServiceTicketID) REFERENCES tblserviceticket (AID) ON DELETE CASCADE,
        CONSTRAINT fk_parts_product_id FOREIGN KEY (ProductID) REFERENCES tblproduct (AID) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check if PaidAmount column exists in tblserviceticket, if not add it
    const [columns] = await pool.query("SHOW COLUMNS FROM tblserviceticket LIKE 'PaidAmount'");
    if (columns.length === 0) {
      await pool.query("ALTER TABLE tblserviceticket ADD COLUMN PaidAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER Deposit");
      console.log("Column PaidAmount added to tblserviceticket.");
    }

    // Check if TechnicianID column exists in tblserviceticket, if not add it
    const [techCols] = await pool.query("SHOW COLUMNS FROM tblserviceticket LIKE 'TechnicianID'");
    if (techCols.length === 0) {
      await pool.query("ALTER TABLE tblserviceticket ADD COLUMN TechnicianID INT NULL AFTER CustomerID");
      console.log("Column TechnicianID added to tblserviceticket.");
    }
    
    tablesChecked = true;
    console.log('Service ticket tables verified/created successfully.');
  } catch (error) {
    console.error('Error creating service ticket tables:', error.message);
  }
}

const serviceticketModel = {
  // Find all service tickets with filters
  async findAll({ page = 1, limit = 10, search = '', status = '', branchId, userType, customerId, deviceBrandModel, deviceColor, serialNumberImei, completionDate }) {
    await ensureTablesExist();
    const offset = (page - 1) * limit;

    let whereConditions = ['1=1'];
    let params = [];

    // Filter by branch
    if (userType !== 'admin' && branchId) {
      whereConditions.push('(s.BranchID = ? OR s.BranchID IS NULL)');
      params.push(branchId);
    } else if (branchId && branchId !== 'all') {
      whereConditions.push('s.BranchID = ?');
      params.push(branchId);
    }

    // Filter by status
    if (status && status !== 'all') {
      whereConditions.push('s.Status = ?');
      params.push(status);
    } else {
      whereConditions.push("s.Status != 'Picked-up'");
    }

    // Search query
    if (search) {
      whereConditions.push('(s.TicketNo LIKE ? OR s.DeviceBrandModel LIKE ? OR s.SerialNumberIMEI LIKE ? OR c.Name LIKE ? OR c.PhoneNo LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Advanced filters
    if (customerId) {
      whereConditions.push('s.CustomerID = ?');
      params.push(customerId);
    }
    if (deviceBrandModel) {
      whereConditions.push('s.DeviceBrandModel LIKE ?');
      params.push(`%${deviceBrandModel}%`);
    }
    if (deviceColor) {
      whereConditions.push('s.DeviceColor LIKE ?');
      params.push(`%${deviceColor}%`);
    }
    if (serialNumberImei) {
      whereConditions.push('s.SerialNumberIMEI LIKE ?');
      params.push(`%${serialNumberImei}%`);
    }
    if (completionDate) {
      whereConditions.push('DATE(s.EstimatedCompletionDate) = ?');
      params.push(completionDate);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM tblserviceticket s 
       LEFT JOIN tblcustomer c ON s.CustomerID = c.AID
       WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated data
    const [rows] = await pool.query(
      `SELECT 
        s.AID as id,
        s.TicketNo as ticketNo,
        s.CustomerID as customerId,
        COALESCE(c.Name, '') as customerName,
        COALESCE(c.PhoneNo, '') as customerPhone,
        COALESCE(c.Address, '') as customerAddress,
        s.TechnicianID as technicianId,
        COALESCE(t.Name, '') as technicianName,
        s.DeviceBrandModel as deviceBrandModel,
        s.DeviceColor as deviceColor,
        s.SerialNumberIMEI as serialNumberImei,
        s.Password as password,
        s.ProblemType as problemType,
        s.TechnicianRemark as technicianRemark,
        s.EstimatedCompletionDate as estimatedCompletionDate,
        s.TotalAmount as totalAmount,
        s.Deposit as deposit,
        s.PaidAmount as paidAmount,
        s.Status as status,
        s.DeviceImage as deviceImage,
        s.ScratchCondition as scratchCondition,
        s.BranchID as branchId,
        b.BranchName as branchName,
        s.CreatedAt as createdAt
       FROM tblserviceticket s
       LEFT JOIN tblcustomer c ON s.CustomerID = c.AID
       LEFT JOIN tbltechnician t ON s.TechnicianID = t.AID
       LEFT JOIN tblbranch b ON s.BranchID = b.AID
       WHERE ${whereClause}
       ORDER BY s.AID DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Format fields
    const formattedRows = rows.map(row => ({
      ...row,
      totalAmount: parseFloat(row.totalAmount || 0),
      deposit: parseFloat(row.deposit || 0),
      paidAmount: parseFloat(row.paidAmount || 0),
      estimatedCompletionDate: row.estimatedCompletionDate ? new Date(row.estimatedCompletionDate).toISOString() : null,
      createdAt: new Date(row.createdAt).toISOString()
    }));

    return {
      data: formattedRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  },

  // Find by ID with its accessories list
  async findById(id, { branchId, userType } = {}) {
    await ensureTablesExist();
    let whereConditions = ['s.AID = ?'];
    let params = [id];

    if (userType !== 'admin' && branchId) {
      whereConditions.push('(s.BranchID = ? OR s.BranchID IS NULL)');
      params.push(branchId);
    }

    const [rows] = await pool.query(
      `SELECT 
        s.AID as id,
        s.TicketNo as ticketNo,
        s.CustomerID as customerId,
        COALESCE(c.Name, '') as customerName,
        COALESCE(c.PhoneNo, '') as customerPhone,
        COALESCE(c.Address, '') as customerAddress,
        s.TechnicianID as technicianId,
        COALESCE(t.Name, '') as technicianName,
        s.DeviceBrandModel as deviceBrandModel,
        s.DeviceColor as deviceColor,
        s.SerialNumberIMEI as serialNumberImei,
        s.Password as password,
        s.ProblemType as problemType,
        s.TechnicianRemark as technicianRemark,
        s.EstimatedCompletionDate as estimatedCompletionDate,
        s.TotalAmount as totalAmount,
        s.Deposit as deposit,
        s.PaidAmount as paidAmount,
        s.Status as status,
        s.DeviceImage as deviceImage,
        s.ScratchCondition as scratchCondition,
        s.BranchID as branchId,
        b.BranchName as branchName,
        s.CreatedAt as createdAt
       FROM tblserviceticket s
       LEFT JOIN tblcustomer c ON s.CustomerID = c.AID
       LEFT JOIN tbltechnician t ON s.TechnicianID = t.AID
       LEFT JOIN tblbranch b ON s.BranchID = b.AID
       WHERE ${whereConditions.join(' AND ')}`,
      params
    );

    if (rows.length === 0) return null;
    const ticket = rows[0];
    ticket.totalAmount = parseFloat(ticket.totalAmount || 0);
    ticket.deposit = parseFloat(ticket.deposit || 0);
    ticket.paidAmount = parseFloat(ticket.paidAmount || 0);
    ticket.estimatedCompletionDate = ticket.estimatedCompletionDate ? new Date(ticket.estimatedCompletionDate).toISOString() : null;
    ticket.createdAt = new Date(ticket.createdAt).toISOString();

    // Fetch accessories
    const [accRows] = await pool.query(
      `SELECT 
        a.ProductID as productId,
        p.CodeNo as code,
        p.Name as name,
        p.Img as image,
        p.SellingPrice as price
       FROM tblserviceticket_accessories a
       JOIN tblproduct p ON a.ProductID = p.AID
       WHERE a.ServiceTicketID = ?`,
      [id]
    );

    ticket.accessories = accRows.map(acc => ({
      ...acc,
      price: parseFloat(acc.price || 0)
    }));

    // Fetch parts
    const [partsRows] = await pool.query(
      `SELECT 
        a.AID as id,
        a.ProductID as productId,
        a.PartName as partName,
        a.Qty as qty,
        a.Price as price,
        a.Cost as cost,
        a.IsExternal as isExternal,
        p.CodeNo as code,
        p.Img as image
       FROM tblserviceticket_parts a
       LEFT JOIN tblproduct p ON a.ProductID = p.AID
       WHERE a.ServiceTicketID = ?`,
      [id]
    );

    ticket.parts = partsRows.map(part => ({
      ...part,
      productId: part.productId ? part.productId.toString() : null,
      qty: parseInt(part.qty || 1),
      price: parseFloat(part.price || 0),
      cost: parseFloat(part.cost || 0),
      isExternal: !!part.isExternal
    }));

    return ticket;
  },

  // Create new service ticket
  async create(data) {
    await ensureTablesExist();
    const { 
      customerId, technicianId, deviceBrandModel, deviceColor, serialNumberImei, 
      password, problemType, technicianRemark, estimatedCompletionDate, 
      totalAmount, deposit, paidAmount, status, deviceImage, scratchCondition, branchId,
      accessories, // Array of product IDs
      parts // Array of part objects: { productId, partName, qty, price, cost, isExternal }
    } = data;

    // Generate temporary unique TicketNo
    const tempTicketNo = `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const calculatedPaidAmount = paidAmount !== undefined ? parseFloat(paidAmount || 0) : (status === 'Picked-up' ? (parseFloat(totalAmount || 0) - parseFloat(deposit || 0)) : 0.00);

      const [result] = await connection.query(
        `INSERT INTO tblserviceticket (
          TicketNo, CustomerID, TechnicianID, DeviceBrandModel, DeviceColor, SerialNumberIMEI, 
          Password, ProblemType, TechnicianRemark, EstimatedCompletionDate, 
          TotalAmount, Deposit, PaidAmount, Status, DeviceImage, ScratchCondition, BranchID
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tempTicketNo, customerId || null, technicianId || null, deviceBrandModel, deviceColor || null, serialNumberImei || null,
          password || null, problemType, technicianRemark || null, estimatedCompletionDate || null,
          totalAmount || 0, deposit || 0, calculatedPaidAmount, status || 'Pending', deviceImage || null, scratchCondition || null, branchId || null
        ]
      );

      const ticketId = result.insertId;
      const finalTicketNo = `st-${999999 + ticketId}`;

      // Update row with final sequential TicketNo
      await connection.query(
        'UPDATE tblserviceticket SET TicketNo = ? WHERE AID = ?',
        [finalTicketNo, ticketId]
      );

      // Insert accessories if any
      if (Array.isArray(accessories) && accessories.length > 0) {
        const values = accessories.map(prodId => [ticketId, prodId]);
        await connection.query(
          'INSERT INTO tblserviceticket_accessories (ServiceTicketID, ProductID) VALUES ?',
          [values]
        );
      }

      // Insert parts if any
      if (Array.isArray(parts) && parts.length > 0) {
        const values = parts.map(p => [
          ticketId, 
          p.productId || null, 
          p.partName, 
          p.qty || 1, 
          p.price || 0, 
          p.cost || 0, 
          p.isExternal ? 1 : 0
        ]);
        await connection.query(
          'INSERT INTO tblserviceticket_parts (ServiceTicketID, ProductID, PartName, Qty, Price, Cost, IsExternal) VALUES ?',
          [values]
        );

        // Deduct from tblproduct stock
        console.log('[CREATE TICKET] Parts for stock deduction:', parts);
        for (const p of parts) {
          console.log('[CREATE TICKET] Part item:', p.productId, p.isExternal, typeof p.isExternal);
          if (p.productId && (p.isExternal === 0 || p.isExternal === false || !p.isExternal)) {
            console.log('[CREATE TICKET] Deducting stock for product AID:', p.productId, 'Qty:', p.qty);
            const [updateRes] = await connection.query(
              'UPDATE tblproduct SET StockQty = StockQty - ? WHERE AID = ?',
              [p.qty || 1, p.productId]
            );
            console.log('[CREATE TICKET] Stock updated result:', updateRes);
          }
        }
      }

      await connection.commit();
      return this.findById(ticketId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update service ticket
  async update(id, data) {
    await ensureTablesExist();
    const { 
      customerId, technicianId, deviceBrandModel, deviceColor, serialNumberImei, 
      password, problemType, technicianRemark, estimatedCompletionDate, 
      totalAmount, deposit, paidAmount, status, deviceImage, scratchCondition, branchId,
      accessories, // Array of product IDs
      parts, // Array of part objects
      userType
    } = data;

    let whereClause = 'AID = ?';
    let whereParams = [id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND (BranchID = ? OR BranchID IS NULL)';
      whereParams.push(branchId);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if ticket exists / belongs to branch
      const [existing] = await connection.query(
        `SELECT AID FROM tblserviceticket WHERE ${whereClause}`,
        whereParams
      );

      if (existing.length === 0) {
        await connection.rollback();
        return null;
      }

      const calculatedPaidAmount = paidAmount !== undefined ? parseFloat(paidAmount || 0) : (status === 'Picked-up' ? (parseFloat(totalAmount || 0) - parseFloat(deposit || 0)) : 0.00);

      // Update fields
      await connection.query(
        `UPDATE tblserviceticket SET 
          CustomerID = ?, 
          TechnicianID = ?, 
          DeviceBrandModel = ?, 
          DeviceColor = ?, 
          SerialNumberIMEI = ?, 
          Password = ?, 
          ProblemType = ?, 
          TechnicianRemark = ?, 
          EstimatedCompletionDate = ?, 
          TotalAmount = ?, 
          Deposit = ?, 
          PaidAmount = ?, 
          Status = ?, 
          DeviceImage = ?, 
          ScratchCondition = ?, 
          BranchID = ?
         WHERE AID = ?`,
        [
          customerId || null, technicianId || null, deviceBrandModel, deviceColor || null, serialNumberImei || null,
          password || null, problemType, technicianRemark || null, estimatedCompletionDate || null,
          totalAmount || 0, deposit || 0, calculatedPaidAmount, status || 'Pending', deviceImage || null, scratchCondition || null, 
          branchId || null, id
        ]
      );

      // Re-populate accessories: Delete old ones and insert new ones
      await connection.query(
        'DELETE FROM tblserviceticket_accessories WHERE ServiceTicketID = ?',
        [id]
      );

      if (Array.isArray(accessories) && accessories.length > 0) {
        const values = accessories.map(prodId => [id, prodId]);
        await connection.query(
          'INSERT INTO tblserviceticket_accessories (ServiceTicketID, ProductID) VALUES ?',
          [values]
        );
      }

      // Fetch old parts to restore stock
      const [oldParts] = await connection.query(
        'SELECT ProductID, Qty, IsExternal FROM tblserviceticket_parts WHERE ServiceTicketID = ?',
        [id]
      );

      console.log('[UPDATE TICKET] Old parts in DB before update:', oldParts);
      for (const p of oldParts) {
        console.log('[UPDATE TICKET] Checking old part to restore stock:', p.ProductID, p.IsExternal);
        if (p.ProductID && (p.IsExternal === 0 || p.IsExternal === false || !p.IsExternal)) {
          console.log('[UPDATE TICKET] Restoring stock for old product AID:', p.ProductID, 'Qty:', p.Qty);
          const [restoreRes] = await connection.query(
            'UPDATE tblproduct SET StockQty = StockQty + ? WHERE AID = ?',
            [p.Qty || 1, p.ProductID]
          );
          console.log('[UPDATE TICKET] Stock restored result:', restoreRes);
        }
      }

      // Re-populate parts: Delete old ones and insert new ones
      await connection.query(
        'DELETE FROM tblserviceticket_parts WHERE ServiceTicketID = ?',
        [id]
      );

      if (Array.isArray(parts) && parts.length > 0) {
        const values = parts.map(p => [
          id, 
          p.productId || null, 
          p.partName, 
          p.qty || 1, 
          p.price || 0, 
          p.cost || 0, 
          p.isExternal ? 1 : 0
        ]);
        await connection.query(
          'INSERT INTO tblserviceticket_parts (ServiceTicketID, ProductID, PartName, Qty, Price, Cost, IsExternal) VALUES ?',
          [values]
        );

        // Deduct new parts stock
        console.log('[UPDATE TICKET] New parts for stock deduction:', parts);
        for (const p of parts) {
          console.log('[UPDATE TICKET] New part item:', p.productId, p.isExternal, typeof p.isExternal);
          if (p.productId && (p.isExternal === 0 || p.isExternal === false || !p.isExternal)) {
            console.log('[UPDATE TICKET] Deducting stock for new product AID:', p.productId, 'Qty:', p.qty);
            const [updateRes] = await connection.query(
              'UPDATE tblproduct SET StockQty = StockQty - ? WHERE AID = ?',
              [p.qty || 1, p.productId]
            );
            console.log('[UPDATE TICKET] Stock updated result:', updateRes);
          }
        }
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

  // Update ticket status
  async updateStatus(id, status, { branchId, userType } = {}) {
    await ensureTablesExist();
    let query;
    let params;

    if (status === 'Picked-up') {
      query = `UPDATE tblserviceticket SET Status = ?, PaidAmount = TotalAmount - Deposit WHERE AID = ?`;
      params = [status, id];
    } else {
      query = `UPDATE tblserviceticket SET Status = ? WHERE AID = ?`;
      params = [status, id];
    }

    let whereClause = '';
    if (userType !== 'admin' && branchId) {
      whereClause += ' AND (BranchID = ? OR BranchID IS NULL)';
      params.push(branchId);
    }

    const [result] = await pool.query(
      `${query}${whereClause}`,
      params
    );

    return result.affectedRows > 0;
  },

  // Delete ticket
  async delete(id, { branchId, userType } = {}) {
    await ensureTablesExist();
    let whereClause = 'AID = ?';
    let params = [id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND (BranchID = ? OR BranchID IS NULL)';
      params.push(branchId);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if ticket exists
      const [existing] = await connection.query(
        `SELECT AID FROM tblserviceticket WHERE ${whereClause}`,
        params
      );

      if (existing.length === 0) {
        await connection.rollback();
        return false;
      }

      // Fetch parts to restore stock
      const [parts] = await connection.query(
        'SELECT ProductID, Qty, IsExternal FROM tblserviceticket_parts WHERE ServiceTicketID = ?',
        [id]
      );

      console.log('[DELETE TICKET] Parts to restore stock:', parts);
      for (const p of parts) {
        console.log('[DELETE TICKET] Checking part to restore stock:', p.ProductID, p.IsExternal);
        if (p.ProductID && (p.IsExternal === 0 || p.IsExternal === false || !p.IsExternal)) {
          console.log('[DELETE TICKET] Restoring stock for product AID:', p.ProductID, 'Qty:', p.Qty);
          const [restoreRes] = await connection.query(
            'UPDATE tblproduct SET StockQty = StockQty + ? WHERE AID = ?',
            [p.Qty || 1, p.ProductID]
          );
          console.log('[DELETE TICKET] Stock restored result:', restoreRes);
        }
      }

      // Accessories and parts are automatically deleted due to foreign key ON DELETE CASCADE
      const [result] = await connection.query(
        `DELETE FROM tblserviceticket WHERE AID = ?`,
        [id]
      );

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = serviceticketModel;
