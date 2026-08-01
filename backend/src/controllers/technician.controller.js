const technicianModel = require('../models/technician.model');

// Get all technicians
const getTechnicians = async (req, res) => {
  try {
    const { page, limit, search, branchId } = req.query;
    const userType = req.user?.userType;
    const currentUserBranchId = req.user?.branchId;

    const result = await technicianModel.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search: search || '',
      userType,
      branchId: userType === 'admin' ? (branchId || null) : currentUserBranchId
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('getTechnicians error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch technicians: ' + error.message
    });
  }
};

// Get active technicians for dropdown
const getTechnicianDropdown = async (req, res) => {
  try {
    const userType = req.user?.userType;
    const branchId = req.user?.branchId;

    const technicians = await technicianModel.findActive({ userType, branchId });

    res.json({
      success: true,
      data: technicians
    });
  } catch (error) {
    console.error('getTechnicianDropdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch technician dropdown list: ' + error.message
    });
  }
};

// Get technician by ID
const getTechnicianById = async (req, res) => {
  try {
    const { id } = req.params;
    const userType = req.user?.userType;
    const branchId = req.user?.branchId;

    const technician = await technicianModel.findById(id, { userType, branchId });

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    res.json({
      success: true,
      data: technician
    });
  } catch (error) {
    console.error('getTechnicianById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch technician details: ' + error.message
    });
  }
};

// Create technician
const createTechnician = async (req, res) => {
  try {
    const { name, phone, specialty, note, status, branchId } = req.body;
    const currentUserType = req.user?.userType;
    const currentUserBranchId = req.user?.branchId;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Technician name is required'
      });
    }

    const targetBranchId = currentUserType === 'admin' ? branchId : currentUserBranchId;

    const result = await technicianModel.create({
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      specialty: specialty ? specialty.trim() : null,
      note: note ? note.trim() : null,
      status: status || 'Active',
      branchId: targetBranchId
    });

    res.status(201).json({
      success: true,
      message: 'Technician created successfully',
      data: result
    });
  } catch (error) {
    console.error('createTechnician error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create technician: ' + error.message
    });
  }
};

// Update technician
const updateTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, specialty, note, status, branchId } = req.body;
    const currentUserType = req.user?.userType;
    const currentUserBranchId = req.user?.branchId;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Technician name is required'
      });
    }

    const targetBranchId = currentUserType === 'admin' ? branchId : currentUserBranchId;

    const result = await technicianModel.update(id, {
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      specialty: specialty ? specialty.trim() : null,
      note: note ? note.trim() : null,
      status: status || 'Active',
      branchId: targetBranchId,
      userType: currentUserType
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Technician updated successfully',
      data: result
    });
  } catch (error) {
    console.error('updateTechnician error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update technician: ' + error.message
    });
  }
};

// Delete technician
const deleteTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserType = req.user?.userType;
    const currentUserBranchId = req.user?.branchId;

    const result = await technicianModel.delete(id, {
      userType: currentUserType,
      branchId: currentUserBranchId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Technician deleted successfully'
    });
  } catch (error) {
    console.error('deleteTechnician error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete technician: ' + error.message
    });
  }
};

module.exports = {
  getTechnicians,
  getTechnicianDropdown,
  getTechnicianById,
  createTechnician,
  updateTechnician,
  deleteTechnician
};
