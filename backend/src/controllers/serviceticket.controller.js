const serviceticketModel = require('../models/serviceticket.model');
const customerModel = require('../models/customer.model');
const { uploadServiceImage, getServiceImagePath, deleteOldImage } = require('../config/upload');
const pool = require('../config/database').pool;
const { cache } = require('../config/redis');

// Upload condition photo
const uploadTicketImage = async (req, res) => {
  uploadServiceImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const imagePath = getServiceImagePath(req.file.filename);

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          imagePath: imagePath,
          filename: req.file.filename
        }
      });
    } catch (error) {
      console.error('uploadTicketImage error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image: ' + error.message
      });
    }
  });
};

// Get all tickets
const getTickets = async (req, res) => {
  try {
    const { 
      page, limit, search, status, branchId,
      customerId, deviceBrandModel, deviceColor, serialNumberImei, completionDate 
    } = req.query;
    const userType = req.user?.userType;
    const currentBranchId = req.user?.branchId;

    const result = await serviceticketModel.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search: search || '',
      status: status || '',
      branchId: userType === 'admin' ? branchId : currentBranchId,
      userType,
      customerId: customerId ? parseInt(customerId) : undefined,
      deviceBrandModel,
      deviceColor,
      serialNumberImei,
      completionDate
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('getTickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service tickets'
    });
  }
};

// Get ticket by ID
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const userType = req.user?.userType;
    const branchId = req.user?.branchId;

    const ticket = await serviceticketModel.findById(id, { userType, branchId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Service ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('getTicketById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service ticket'
    });
  }
};

// Create a new ticket
const createTicket = async (req, res) => {
  try {
    const { 
      customerId, technicianId, customerName, customerPhone, customerAddress,
      deviceBrandModel, deviceColor, serialNumberImei, password,
      problemType, technicianRemark, estimatedCompletionDate,
      totalAmount, deposit, status, deviceImage, scratchCondition,
      branchId, accessories, parts
    } = req.body;

    const userType = req.user?.userType;
    const currentBranchId = req.user?.branchId;
    const targetBranchId = userType === 'admin' ? (branchId || null) : currentBranchId;

    if (!deviceBrandModel || !problemType) {
      return res.status(400).json({
        success: false,
        message: 'Device Brand/Model and Problem Type are required'
      });
    }

    let finalCustomerId = customerId ? parseInt(customerId) : null;

    // Auto-create customer if details are entered and ID is empty
    if (!finalCustomerId && customerName && customerPhone) {
      // Check if phone already exists in tblcustomer
      const [rows] = await pool.query('SELECT AID FROM tblcustomer WHERE PhoneNo = ? LIMIT 1', [customerPhone]);
      if (rows.length > 0) {
        finalCustomerId = rows[0].AID;
      } else {
        const newCustomer = await customerModel.create({
          name: customerName,
          phone: customerPhone,
          address: customerAddress || '',
          email: '',
          branchId: targetBranchId
        });
        finalCustomerId = parseInt(newCustomer.id);
      }
    }

    const ticket = await serviceticketModel.create({
      customerId: finalCustomerId,
      technicianId: technicianId ? parseInt(technicianId) : null,
      deviceBrandModel,
      deviceColor,
      serialNumberImei,
      password,
      problemType,
      technicianRemark,
      estimatedCompletionDate: estimatedCompletionDate || null,
      totalAmount: parseFloat(totalAmount || 0),
      deposit: parseFloat(deposit || 0),
      status: status || 'Pending',
      deviceImage,
      scratchCondition,
      branchId: targetBranchId,
      accessories: Array.isArray(accessories) ? accessories.map(id => parseInt(id)) : [],
      parts: Array.isArray(parts) ? parts : []
    });

    await cache.delPattern('financial:*');
    res.status(201).json({
      success: true,
      message: 'Service ticket created successfully',
      data: ticket
    });
  } catch (error) {
    console.error('createTicket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service ticket: ' + error.message
    });
  }
};

// Update ticket
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customerId, technicianId, customerName, customerPhone, customerAddress,
      deviceBrandModel, deviceColor, serialNumberImei, password,
      problemType, technicianRemark, estimatedCompletionDate,
      totalAmount, deposit, status, deviceImage, scratchCondition,
      branchId, accessories, parts
    } = req.body;

    const userType = req.user?.userType;
    const currentBranchId = req.user?.branchId;
    const targetBranchId = userType === 'admin' ? (branchId || null) : currentBranchId;

    if (!deviceBrandModel || !problemType) {
      return res.status(400).json({
        success: false,
        message: 'Device Brand/Model and Problem Type are required'
      });
    }

    let finalCustomerId = customerId ? parseInt(customerId) : null;

    // Auto-create customer if details are entered and ID is empty
    if (!finalCustomerId && customerName && customerPhone) {
      const [rows] = await pool.query('SELECT AID FROM tblcustomer WHERE PhoneNo = ? LIMIT 1', [customerPhone]);
      if (rows.length > 0) {
        finalCustomerId = rows[0].AID;
      } else {
        const newCustomer = await customerModel.create({
          name: customerName,
          phone: customerPhone,
          address: customerAddress || '',
          email: '',
          branchId: targetBranchId
        });
        finalCustomerId = parseInt(newCustomer.id);
      }
    }

    // Delete old image if new image is uploaded
    const oldTicket = await serviceticketModel.findById(id, { userType, branchId: currentBranchId });
    if (oldTicket && oldTicket.deviceImage && deviceImage && oldTicket.deviceImage !== deviceImage) {
      deleteOldImage(oldTicket.deviceImage);
    }

    const ticket = await serviceticketModel.update(id, {
      customerId: finalCustomerId,
      technicianId: technicianId ? parseInt(technicianId) : null,
      deviceBrandModel,
      deviceColor,
      serialNumberImei,
      password,
      problemType,
      technicianRemark,
      estimatedCompletionDate: estimatedCompletionDate || null,
      totalAmount: parseFloat(totalAmount || 0),
      deposit: parseFloat(deposit || 0),
      status: status || 'Pending',
      deviceImage,
      scratchCondition,
      branchId: targetBranchId,
      accessories: Array.isArray(accessories) ? accessories.map(id => parseInt(id)) : [],
      parts: Array.isArray(parts) ? parts : [],
      userType
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Service ticket not found or unauthorized'
      });
    }

    await cache.delPattern('financial:*');
    res.json({
      success: true,
      message: 'Service ticket updated successfully',
      data: ticket
    });
  } catch (error) {
    console.error('updateTicket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service ticket: ' + error.message
    });
  }
};

// Patch status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userType = req.user?.userType;
    const branchId = req.user?.branchId;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const result = await serviceticketModel.updateStatus(id, status, { branchId, userType });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Service ticket not found or unauthorized'
      });
    }

    await cache.delPattern('financial:*');
    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('updateStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

// Delete ticket
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userType = req.user?.userType;
    const branchId = req.user?.branchId;

    const oldTicket = await serviceticketModel.findById(id, { userType, branchId });
    if (oldTicket && oldTicket.deviceImage) {
      deleteOldImage(oldTicket.deviceImage);
    }

    const result = await serviceticketModel.delete(id, { branchId, userType });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Service ticket not found or unauthorized'
      });
    }

    await cache.delPattern('financial:*');
    res.json({
      success: true,
      message: 'Service ticket deleted successfully'
    });
  } catch (error) {
    console.error('deleteTicket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service ticket'
    });
  }
};

// Get external purchases report
const getExternalPurchasesReport = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', fromDate, toDate, branchId } = req.query;
    const userType = req.user?.userType;
    const currentBranchId = req.user?.branchId;
    const effectiveBranchId = userType === 'admin' ? branchId : currentBranchId;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereConditions = ['tp.IsExternal = 1'];
    let params = [];

    // Branch filter
    if (userType !== 'admin' && currentBranchId) {
      whereConditions.push('(st.BranchID = ? OR st.BranchID IS NULL)');
      params.push(currentBranchId);
    } else if (effectiveBranchId && effectiveBranchId !== 'all') {
      whereConditions.push('st.BranchID = ?');
      params.push(effectiveBranchId);
    }

    // Date range filter
    if (fromDate) {
      whereConditions.push('tp.CreatedAt >= ?');
      params.push(`${fromDate} 00:00:00`);
    }
    if (toDate) {
      whereConditions.push('tp.CreatedAt <= ?');
      params.push(`${toDate} 23:59:59`);
    }

    // Text search
    if (search) {
      whereConditions.push('(tp.PartName LIKE ? OR st.TicketNo LIKE ? OR c.Name LIKE ? OR c.PhoneNo LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get count and aggregates
    const [summaryRows] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(tp.Qty) as totalQty,
        SUM(tp.Cost * tp.Qty) as totalCost,
        SUM(tp.Price * tp.Qty) as totalRevenue
       FROM tblserviceticket_parts tp
       JOIN tblserviceticket st ON tp.ServiceTicketID = st.AID
       LEFT JOIN tblcustomer c ON st.CustomerID = c.AID
       WHERE ${whereClause}`,
      params
    );
    const summary = summaryRows[0] || { total: 0, totalQty: 0, totalCost: 0, totalRevenue: 0 };

    // Get rows
    const [rows] = await pool.query(
      `SELECT 
        tp.AID as id,
        tp.ServiceTicketID as ticketId,
        st.TicketNo as ticketNo,
        COALESCE(c.Name, '') as customerName,
        COALESCE(c.PhoneNo, '') as customerPhone,
        tp.PartName as partName,
        tp.Qty as qty,
        tp.Cost as cost,
        tp.Price as price,
        (tp.Price * tp.Qty) as totalAmount,
        (tp.Cost * tp.Qty) as totalCost,
        ((tp.Price - tp.Cost) * tp.Qty) as profit,
        tp.CreatedAt as date,
        b.BranchName as branchName
       FROM tblserviceticket_parts tp
       JOIN tblserviceticket st ON tp.ServiceTicketID = st.AID
       LEFT JOIN tblcustomer c ON st.CustomerID = c.AID
       LEFT JOIN tblbranch b ON st.BranchID = b.AID
       WHERE ${whereClause}
       ORDER BY tp.AID DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        cost: parseFloat(r.cost || 0),
        price: parseFloat(r.price || 0),
        totalAmount: parseFloat(r.totalAmount || 0),
        totalCost: parseFloat(r.totalCost || 0),
        profit: parseFloat(r.profit || 0),
        date: new Date(r.date).toISOString()
      })),
      summary: {
        total: parseInt(summary.total || 0),
        totalQty: parseInt(summary.totalQty || 0),
        totalCost: parseFloat(summary.totalCost || 0),
        totalRevenue: parseFloat(summary.totalRevenue || 0),
        totalProfit: parseFloat((summary.totalRevenue || 0) - (summary.totalCost || 0))
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(summary.total || 0),
        totalPages: Math.ceil(parseInt(summary.total || 0) / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('getExternalPurchasesReport error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate external purchases report'
    });
  }
};

module.exports = {
  uploadTicketImage,
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  updateStatus,
  deleteTicket,
  getExternalPurchasesReport
};
