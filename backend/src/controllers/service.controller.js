const serviceModel = require('../models/service.model');

// Get all services
const getServices = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const userType = req.user?.userType;
    const branchId = req.user?.branchId;

    const result = await serviceModel.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search: search || '',
      userType,
      branchId
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('getServices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services: ' + error.message
    });
  }
};

// Get service by ID
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userType = req.user?.userType;
    const branchId = req.user?.branchId;

    const service = await serviceModel.findById(id, { userType, branchId });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('getServiceById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service'
    });
  }
};

// Create new service
const createService = async (req, res) => {
  try {
    const { serviceCode, serviceName, price, description, status, branchId } = req.body;
    const currentUserBranchId = req.user?.branchId;
    const currentUserType = req.user?.userType;

    if (!serviceCode || !serviceName) {
      return res.status(400).json({
        success: false,
        message: 'Service code and name are required'
      });
    }

    // Check code duplication
    const codeExists = await serviceModel.codeExists(serviceCode);
    if (codeExists) {
      return res.status(400).json({
        success: false,
        message: 'Service code already exists. Please use a unique code.'
      });
    }

    // Non-admin can only create services for their own branch or global (null)
    const targetBranchId = currentUserType === 'admin' ? branchId : currentUserBranchId;

    const result = await serviceModel.create({
      serviceCode,
      serviceName,
      price,
      description,
      status,
      branchId: targetBranchId
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: result
    });
  } catch (error) {
    console.error('createService error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service: ' + error.message
    });
  }
};

// Update service
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceCode, serviceName, price, description, status, branchId } = req.body;
    const currentUserBranchId = req.user?.branchId;
    const currentUserType = req.user?.userType;

    if (!serviceCode || !serviceName) {
      return res.status(400).json({
        success: false,
        message: 'Service code and name are required'
      });
    }

    // Check code duplication excluding current service
    const codeExists = await serviceModel.codeExists(serviceCode, id);
    if (codeExists) {
      return res.status(400).json({
        success: false,
        message: 'Service code already exists. Please use a unique code.'
      });
    }

    const targetBranchId = currentUserType === 'admin' ? branchId : currentUserBranchId;

    const result = await serviceModel.update(id, {
      serviceCode,
      serviceName,
      price,
      description,
      status,
      userType: currentUserType,
      branchId: targetBranchId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: result
    });
  } catch (error) {
    console.error('updateService error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service: ' + error.message
    });
  }
};

// Delete service
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserType = req.user?.userType;
    const currentUserBranchId = req.user?.branchId;

    const result = await serviceModel.delete(id, {
      userType: currentUserType,
      branchId: currentUserBranchId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('deleteService error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service'
    });
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
