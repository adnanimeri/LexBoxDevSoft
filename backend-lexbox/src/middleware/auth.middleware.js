const { verifyAccessToken } = require('../utils/jwt.util');
const User = require('../models/User');
const Organization = require('../models/Organization');

/**
 * Authenticate user with JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_USER',
          message: 'User not found or inactive'
        }
      });
    }

    // Non-super-admin users must belong to an active organization
    if (user.role !== 'super_admin') {
      if (!user.organization_id) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NO_ORGANIZATION',
            message: 'Your account is not linked to any organization. Please contact support.'
          }
        });
      }
      const org = await Organization.findByPk(user.organization_id, {
        attributes: ['id', 'status']
      });
      if (!org || org.status === 'deleted') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Your organization no longer exists. Please register a new account.'
          }
        });
      }
      if (org.status === 'suspended') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ORG_SUSPENDED',
            message: 'Your organization has been suspended. Please contact support.'
          }
        });
      }
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
};

/**
 * Authorize user based on role
 * Supports both: authorize('admin', 'lawyer') and authorize(['admin', 'lawyer'])
 */
const authorize = (...allowedRoles) => {
  // Flatten in case an array is passed
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
};

/**
 * Check specific permission
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // TODO: Implement granular permission checking
    // For now, we'll use role-based authorization
    next();
  };
};

/**
 * Require super_admin role
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Super admin access required' }
    });
  }
  next();
};

/**
 * Require user to belong to an organization
 */
const requireOrg = (req, res, next) => {
  if (!req.user || !req.user.organization_id) {
    return res.status(403).json({
      success: false,
      error: { code: 'NO_ORG', message: 'Organization membership required' }
    });
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  requireSuperAdmin,
  requireOrg
};