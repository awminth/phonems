const userModel = require('../models/user.model');
const logModel = require('../models/log.model');
const branchModel = require('../models/branch.model');

// Helper to get client IP address
const getClientIP = (req) => {
  // Check for forwarded IP (when behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // Check for real IP header
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  // Fallback to connection remote address
  return req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';
};

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = getClientIP(req);

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username
    const user = await userModel.findByUsername(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check password (plain text comparison - in production use bcrypt!)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account is inactive. Please contact administrator.'
      });
    }

    // Log the login activity with IP address
    await logModel.create({
      description: `User "${username}" logged in`,
      userId: user.id,
      ipAddress: clientIP
    });

    // Fetch branch info if assigned
    let branchInfo = null;
    if (user.branchId) {
      branchInfo = await branchModel.findById(user.branchId);
    }

    // Return user data (without password)
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        username: user.username,
        isActive: user.isActive,
        permissions: user.permissions,
        userType: user.userType,
        branchId: user.branchId,
        branch: branchInfo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const clientIP = getClientIP(req);

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Find user by ID with password
    const user = await userModel.findByIdWithPassword(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    if (user.password !== currentPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await userModel.updatePassword(userId, newPassword);

    // Log the password change activity with IP address
    await logModel.create({
      description: `User "${user.username}" changed password`,
      userId: userId,
      ipAddress: clientIP
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password. Please try again.'
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { userId, username } = req.body;
    const clientIP = getClientIP(req);

    if (!userId || !username) {
      return res.status(400).json({
        success: false,
        message: 'userId and username are required'
      });
    }

    // Log the logout activity with IP address
    await logModel.create({
      description: `User "${username}" logged out`,
      userId,
      ipAddress: clientIP
    });

    return res.json({
      success: true,
      message: 'Logout logged'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed. Please try again.'
    });
  }
};

module.exports = {
  login,
  changePassword,
  logout
};

