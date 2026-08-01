const pool = require('../config/database').pool;

const adjustmentModel = {
    async create(data) {
        const { productId, branchId, qty, reason, userId, imei, stockId } = data;
        
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Check if item is already sold
            if (imei) {
                const [statusCheck] = await connection.query(
                    'SELECT Status FROM tblpurchase_items WHERE (imei_1 = ? OR imei_2 = ?) AND Status = 1',
                    [imei, imei]
                );
                if (statusCheck.length > 0) {
                    throw new Error('Cannot adjust stock for an IMEI that is already sold.');
                }
            }

            // 1. Insert into adjustment table
            const [result] = await connection.query(
                'INSERT INTO tblstock_adjustment (ProductID, BranchID, Qty, Reason, UserID, Imei, StockID) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [productId, branchId, qty, reason, userId, imei, stockId]
            );

            // 2. If it's a serialized item and we're removing it, update the status in tblpurchase_items
            if (imei && qty < 0) {
                await connection.query(
                    'UPDATE tblpurchase_items SET Status = 5 WHERE product_id = ? AND (imei_1 = ? OR imei_2 = ?) AND BranchID = ? AND Status IN (0, 2, 3) LIMIT 1',
                    [productId, imei, imei, branchId]
                );
            }
            
            // 3. If it's a serialized item and we're adding it
            if (imei && qty > 0) {
                // Check if already exists in any status
                const [existing] = await connection.query(
                    'SELECT p_item_id, Status FROM tblpurchase_items WHERE (imei_1 = ? OR imei_2 = ?)',
                    [imei, imei]
                );
                
                if (existing.length === 0) {
                    // New IMEI, insert as Available
                    await connection.query(
                        'INSERT INTO tblpurchase_items (product_id, imei_1, quantity, BranchID, Status) VALUES (?, ?, 1, ?, 0)',
                        [productId, imei, branchId]
                    );
                } else {
                    const status = existing[0].Status;
                    if (status === 1) {
                        throw new Error('Cannot add stock for an IMEI that is already sold.');
                    }
                    if (status === 0 || status === 2) {
                        throw new Error('This IMEI is already in stock.');
                    }
                    if (status === 4) {
                        throw new Error('This IMEI is currently in-transit.');
                    }
                    
                    // If it was "Adjusted Out" (Status 5) or "Damaged" (Status 3), reactivate it
                    await connection.query(
                        'UPDATE tblpurchase_items SET Status = 0, product_id = ?, BranchID = ? WHERE (imei_1 = ? OR imei_2 = ?) AND Status IN (5, 3)',
                        [productId, branchId, imei, imei]
                    );
                }
            }

            // 4. Update tblproduct.StockQty
            await connection.query(
                'UPDATE tblproduct SET StockQty = StockQty + ? WHERE AID = ?',
                [qty, productId]
            );

            await connection.commit();
            return { success: true, id: result.insertId };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async getByProduct(productId, branchId = null) {
        let query = 'SELECT * FROM tblstock_adjustment WHERE ProductID = ?';
        let params = [productId];
        if (branchId) {
            query += ' AND BranchID = ?';
            params.push(branchId);
        }
        query += ' ORDER BY AdjustDate DESC';
        const [rows] = await pool.query(query, params);
        return rows;
    },

    async findAll({ page = 1, limit = 10, search = '', fromDate = '', toDate = '', branchId = null }) {
        const offset = (page - 1) * limit;
        let whereConditions = ['1=1'];
        let params = [];

        if (branchId) {
            whereConditions.push('a.BranchID = ?');
            params.push(branchId);
        }

        if (search) {
            whereConditions.push('(p.Name LIKE ? OR p.CodeNo LIKE ? OR a.Imei LIKE ?)');
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        if (fromDate) {
            whereConditions.push('DATE(a.AdjustDate) >= ?');
            params.push(fromDate);
        }

        if (toDate) {
            whereConditions.push('DATE(a.AdjustDate) <= ?');
            params.push(toDate);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get total count
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM tblstock_adjustment a 
             LEFT JOIN tblproduct p ON a.ProductID = p.AID 
             WHERE ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Get paginated data
        const [rows] = await pool.query(
            `SELECT 
                a.AID as id,
                a.ProductID as productId,
                p.Name as productName,
                p.CodeNo as codeNo,
                a.Qty as qty,
                a.AdjustDate as date,
                a.Reason as reason,
                a.BranchID as branchId,
                b.BranchName as branchName,
                a.UserID as userId,
                u.UserName as userName,
                a.Imei as imei
             FROM tblstock_adjustment a
             LEFT JOIN tblproduct p ON a.ProductID = p.AID
             LEFT JOIN tblbranch b ON a.BranchID = b.AID
             LEFT JOIN tbluser u ON a.UserID = u.AID
             WHERE ${whereClause}
             ORDER BY a.AdjustDate DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return {
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        };
    }
};

module.exports = adjustmentModel;
