const pool = require('../config/database').pool;
const { cache } = require('../config/redis');

// Get payment summary by method (Cash, KPay, WavePay)
const getPaymentSummary = async (req, res) => {
    try {
        const { fromDate, toDate, branchId: queryBranchId } = req.query;

        // Default to today if no date provided
        const start = fromDate ? `${fromDate} 00:00:00` : new Date().toISOString().split('T')[0] + ' 00:00:00';
        const end = toDate ? `${toDate} 23:59:59` : new Date().toISOString().split('T')[0] + ' 23:59:59';

        const { userType, branchId: userBranchId } = req.user;
        
        // Admin can filter by branch, others are restricted to their own
        const effectiveBranchId = (userType === 'admin') ? (queryBranchId || 'all') : userBranchId;

        const cacheKey = `payment_report:${start}:${end}:${effectiveBranchId}`;

        // Try cache first
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            return res.json({ success: true, data: cachedData, fromCache: true });
        }

        let branchCondition = '1=1';
        let branchParams = [];
        if (effectiveBranchId && effectiveBranchId !== 'all') {
            branchCondition = 'BranchID = ?';
            branchParams.push(effectiveBranchId);
        }

        // 1. Get totals from Sales (tblvoucher)
        const [voucherRows] = await pool.query(
            `SELECT 
        PaymentMethod, 
        SUM(Total) as total 
       FROM tblvoucher 
       WHERE Date BETWEEN ? AND ? 
       AND (Chk = 'Cash' OR Chk = 'Credit') 
       AND PaymentMethod IN ('Cash', 'KPay', 'WavePay')
       AND ${branchCondition}
       GROUP BY PaymentMethod`,
            [start, end, ...branchParams]
        );

        // 2. Get totals from Credit Payments (tblcreditdetail)
        const [creditRows] = await pool.query(
            `SELECT 
        PaymentMethod, 
        SUM(Amt) as total 
       FROM tblcreditdetail 
       WHERE Date BETWEEN ? AND ? 
       AND PaymentMethod IN ('Cash', 'KPay', 'WavePay')
       AND ${branchCondition}
       GROUP BY PaymentMethod`,
            [start, end, ...branchParams]
        );

        // 3. Aggregate results
        const summary = {
            'Cash': 0,
            'KPay': 0,
            'WavePay': 0
        };

        // Add sales totals
        voucherRows.forEach(row => {
            if (summary[row.PaymentMethod] !== undefined) {
                summary[row.PaymentMethod] += Number(row.total || 0);
            }
        });

        // Add credit payment totals
        creditRows.forEach(row => {
            if (summary[row.PaymentMethod] !== undefined) {
                summary[row.PaymentMethod] += Number(row.total || 0);
            }
        });

        const result = {
            summary,
            breakdown: {
                sales: voucherRows,
                creditPayments: creditRows
            },
            period: { from: start, to: end }
        };

        // Cache for 1 minute
        await cache.set(cacheKey, result, 60);

        res.json({ success: true, data: result, fromCache: false });

    } catch (error) {
        console.error('getPaymentSummary error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate payment report' });
    }
};

module.exports = {
    getPaymentSummary
};
