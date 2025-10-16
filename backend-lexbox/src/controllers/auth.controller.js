const User = require('../models/User');
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

module.exports = {
  register,
  login,
  getCurrentUser,
  logout
};
