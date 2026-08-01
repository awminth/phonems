const adjustmentModel = require('../models/adjustment.model');
const { cache } = require('../config/redis');

const adjustmentController = {
    async adjustStock(req, res) {
        try {
            const { productId, branchId, qty, reason, imei, stockId } = req.body;
            const userId = req.user?.id;

            if (!productId || !branchId || qty === undefined) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const result = await adjustmentModel.create({
                productId,
                branchId,
                qty,
                reason,
                userId,
                imei,
                stockId
            });

            // Clear inventory and pos caches
            await cache.delPattern('inventory:*');
            await cache.delPattern('pos:*');

            res.json({
                success: true,
                message: 'Stock adjusted successfully',
                data: result
            });
        } catch (error) {
            console.error('Stock adjustment error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    },

    async getHistory(req, res) {
        try {
            const { productId } = req.params;
            const { branchId } = req.query;
            const history = await adjustmentModel.getByProduct(productId, branchId);
            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('Fetch adjustment history error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    async getAdjustments(req, res) {
        try {
            const { page, limit, search, fromDate, toDate } = req.query;
            const { userType, branchId: userBranchId } = req.user;
            
            // Admin can see all branches or filter by branch, others see only their own
            const branchId = userType === 'admin' ? (req.query.branchId || null) : userBranchId;

            const result = await adjustmentModel.findAll({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search,
                fromDate,
                toDate,
                branchId
            });

            res.json({ success: true, ...result });
        } catch (error) {
            console.error('getAdjustments error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch adjustment records' });
        }
    }
};

module.exports = adjustmentController;
