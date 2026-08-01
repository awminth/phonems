const authMiddleware = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const userType = req.headers['x-user-type'];
    const branchId = req.headers['x-branch-id'];

    // In a real app, you would verify a JWT token here.
    // For now, we trust the headers sent from frontend since there's no token system yet.
    req.user = {
        id: userId ? parseInt(userId) : null,
        userType: userType || 'user',
        branchId: branchId ? parseInt(branchId) : null
    };

    next();
};

module.exports = authMiddleware;
