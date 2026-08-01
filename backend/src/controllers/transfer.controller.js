const transferModel = require('../models/transfer.model');
const logModel = require('../models/log.model');

const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.connection?.remoteAddress || req.ip || '127.0.0.1';
};

const transferController = {
  // Create a new transfer
  async createTransfer(req, res) {
    try {
      const { toBranchId, transferDate, remark, items } = req.body;
      const { id: senderId, branchId: fromBranchId } = req.user;

      if (!toBranchId || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const transferId = await transferModel.create({
        fromBranchId,
        toBranchId,
        transferDate: transferDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
        senderId,
        remark,
        items
      });

      await logModel.create({
        description: `Items transferred: ID ${transferId} from Branch ${fromBranchId} to ${toBranchId}`,
        userId: senderId,
        ipAddress: getClientIP(req)
      });

      res.status(201).json({
        success: true,
        message: 'Transfer initiated successfully',
        data: { transferId }
      });
    } catch (error) {
      console.error('createTransfer error:', error);
      res.status(500).json({ success: false, message: 'Failed to initiate transfer: ' + error.message });
    }
  },

  // Get transfer list
  async getTransfers(req, res) {
    try {
      const { page, limit, status, fromBranchId, toBranchId, search, fromDate, toDate } = req.query;
      const { userType, branchId: userBranchId } = req.user;

      // Filter logic: admins see all, others see what they sent or should receive
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        status,
        search,
        fromDate,
        toDate
      };

      if (userType !== 'admin') {
        // If not admin, we either filter by what we sent OR what we should receive
        // But usually, the "Transfer" tab shows sent items and "Receive" tab shows incoming items.
        // The controller will handle both based on query params.
        if (fromBranchId) filters.fromBranchId = fromBranchId;
        if (toBranchId) filters.toBranchId = toBranchId;
        
        // If no specific branch filter provided by query, default to user's branch as sender
        if (!fromBranchId && !toBranchId) {
            filters.fromBranchId = userBranchId;
        }
      } else {
        if (fromBranchId) filters.fromBranchId = fromBranchId;
        if (toBranchId) filters.toBranchId = toBranchId;
      }

      const result = await transferModel.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('getTransfers error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch transfers' });
    }
  },

  // Get transfer by ID
  async getTransferById(req, res) {
    try {
      const { id } = req.params;
      const transfer = await transferModel.findById(id);

      if (!transfer) {
        return res.status(404).json({ success: false, message: 'Transfer not found' });
      }

      res.json({ success: true, data: transfer });
    } catch (error) {
      console.error('getTransferById error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch transfer details' });
    }
  },

  // Receive transfer
  async receiveTransfer(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body;
      const { id: receiverId, branchId } = req.user;

      const transfer = await transferModel.findById(id);
      if (!transfer) {
        return res.status(404).json({ success: false, message: 'Transfer not found' });
      }

      if (transfer.to_branch_id != branchId && req.user.userType !== 'admin') {
        return res.status(403).json({ success: false, message: 'Permission denied. Only receiving branch can confirm.' });
      }

      if (transfer.status === 'Received') {
        return res.status(400).json({ success: false, message: 'Transfer already received' });
      }

      await transferModel.receive(id, {
        receiverId,
        receiveDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        items: items || transfer.items
      });

      await logModel.create({
        description: `Items received: Transfer ID ${id} at Branch ${branchId}`,
        userId: receiverId,
        ipAddress: getClientIP(req)
      });

      res.json({ success: true, message: 'Transfer received successfully' });
    } catch (error) {
      console.error('receiveTransfer error:', error);
      res.status(500).json({ success: false, message: 'Failed to receive transfer: ' + error.message });
    }
  },

  // Get incoming transfers for current branch
  async getIncomingTransfers(req, res) {
    try {
      const { userType, branchId: userBranchId } = req.user;
      const { page, limit, search, fromDate, toDate, toBranchId } = req.query;

      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        status: 'Shipped', // Only show pending/shipped ones for receiving
        search,
        fromDate,
        toDate
      };

      // If admin, they can see all incoming or filter by specific branch
      // If not admin, strictly show what's for their branch
      if (userType !== 'admin') {
        filters.toBranchId = userBranchId;
      } else if (toBranchId) {
        filters.toBranchId = toBranchId;
      }

      const result = await transferModel.findAll(filters);

      res.json({ success: true, ...result });
    } catch (error) {
      console.error('getIncomingTransfers error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch incoming transfers' });
    }
  },

  // Cancel/Delete transfer
  async deleteTransfer(req, res) {
    try {
      const { id } = req.params;
      const { branchId, userType } = req.user;

      const transfer = await transferModel.findById(id);
      if (!transfer) {
        return res.status(404).json({ success: false, message: 'Transfer not found' });
      }

      // Only sender branch or admin can cancel
      if (transfer.from_branch_id != branchId && userType !== 'admin') {
        return res.status(403).json({ success: false, message: 'Permission denied. Only sending branch can cancel.' });
      }

      await transferModel.delete(id);

      await logModel.create({
        description: `Transfer cancelled: ID ${id}`,
        userId: req.user.id,
        ipAddress: getClientIP(req)
      });

      res.json({ success: true, message: 'Transfer cancelled successfully' });
    } catch (error) {
      console.error('deleteTransfer error:', error);
      res.status(500).json({ success: false, message: 'Failed to cancel transfer: ' + error.message });
    }
  }
};

module.exports = transferController;
