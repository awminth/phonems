const pool = require('../config/database').pool;
const damageModel = require('../models/damage.model');
const logModel = require('../models/log.model');

// Helper to get client IP address
const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.connection?.remoteAddress || req.ip || '127.0.0.1';
};

const damageController = {
  // Create damage record and adjust stock
  async createDamage(req, res) {
    const connection = await pool.getConnection();
    try {
      const { productId, qty, reason, date, stockId, imei } = req.body;
      const { userId, branchId } = req.user;

      if (!productId || !qty || !reason) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      await connection.beginTransaction();

      // 1. Create damage record using transaction connection
      const damageId = await damageModel.create({
        productId,
        qty,
        date,
        reason,
        branchId,
        userId,
        stockId,
        imei
      }, connection);

      // 2. Decrement stock in tblproduct using transaction connection
      await connection.query(
        'UPDATE tblproduct SET StockQty = StockQty - ? WHERE AID = ?',
        [qty, productId]
      );

      // 3. If serialized, update tblpurchase_items status to 3 (Damaged) using transaction connection
      if (stockId) {
        await connection.query(
          'UPDATE tblpurchase_items SET status = 3 WHERE p_item_id = ?',
          [stockId]
        );
      }

      await connection.commit();

      // Log the action (can be outside transaction or using pool as it's separate)
      await logModel.create({
        description: `Damage reported: Product ID ${productId}, Qty ${qty}, Reason: ${reason}`,
        userId,
        ipAddress: getClientIP(req)
      });

      res.status(201).json({
        success: true,
        message: 'Damage reported successfully',
        data: { damageId }
      });

    } catch (error) {
      await connection.rollback();
      console.error('createDamage error:', error);
      res.status(500).json({ success: false, message: 'Failed to report damage' });
    } finally {
      connection.release();
    }
  },

  // Get damage list with pagination and filters
  async getDamages(req, res) {
    try {
      const { page, limit, search, fromDate, toDate } = req.query;
      const { userType, branchId: userBranchId } = req.user;
      
      // Admin can see all branches or filter by branch, others see only their own
      const branchId = userType === 'admin' ? (req.query.branchId || null) : userBranchId;

      const result = await damageModel.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        fromDate,
        toDate,
        branchId
      });

      res.json({ success: true, ...result });
    } catch (error) {
      console.error('getDamages error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch damage records' });
    }
  },

  // Delete damage record and restore stock
  async deleteDamage(req, res) {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      const { userId } = req.user;

      const damage = await damageModel.findById(id);
      if (!damage) {
        return res.status(404).json({ success: false, message: 'Damage record not found' });
      }

      await connection.beginTransaction();

      // 1. Restore stock in tblproduct using transaction connection
      await connection.query(
        'UPDATE tblproduct SET StockQty = StockQty + ? WHERE AID = ?',
        [damage.Qty, damage.ProductID]
      );

      // 2. If serialized, restore status in tblpurchase_items to 0 (Available) using transaction connection
      if (damage.StockID) {
        await connection.query(
          'UPDATE tblpurchase_items SET status = 0 WHERE p_item_id = ?',
          [damage.StockID]
        );
      }

      // 3. Delete damage record using transaction connection
      await damageModel.delete(id, connection);

      await connection.commit();

      // Log the action
      await logModel.create({
        description: `Damage record deleted: ID ${id}, Stock restored for Product ID ${damage.ProductID}`,
        userId,
        ipAddress: getClientIP(req)
      });

      res.json({ success: true, message: 'Damage record deleted and stock restored' });

    } catch (error) {
      await connection.rollback();
      console.error('deleteDamage error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete damage record' });
    } finally {
      connection.release();
    }
  }
};

module.exports = damageController;
