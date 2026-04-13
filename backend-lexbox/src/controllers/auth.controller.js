const User = require('../models/User');
const Organization = require('../models/Organization');
const { generateTokenPair } = require('../utils/jwt.util');

/**
 * Register new user (admin only)
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, first_name, last_name, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Hash password
    const password_hash = await User.hashPassword(password);

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash,
      first_name,
      last_name,
      role: role || 'lawyer'
    });

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON()
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Validate password
    const isValid = await user.validatePassword(password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check if the user's organization is suspended
    if (user.organization_id) {
      const org = await Organization.findByPk(user.organization_id, {
        attributes: ['status']
      });
      if (org && org.status === 'suspended') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ORG_SUSPENDED',
            message: 'Your account has been suspended. Please contact support to reactivate it.'
          }
        });
      }
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token: accessToken,
        refreshToken
      },
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 */
const getCurrentUser = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
const logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token. Here we just confirm the action.
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password for the currently logged-in user
 * POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    // Re-fetch user with password hash (toJSON strips it)
    const user = await User.findByPk(req.user.id);

    const isValid = await user.validatePassword(current_password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const password_hash = await User.hashPassword(new_password);
    await user.update({ password_hash });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  changePassword
};
