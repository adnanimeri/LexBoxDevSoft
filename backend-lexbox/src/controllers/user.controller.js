// ===================================================================
// USER CONTROLLER (org-level user management — admin only)
// ===================================================================
const { Op } = require('sequelize');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Dossier = require('../models/Dossier');
const TimelineNode = require('../models/TimelineNode');
const Document = require('../models/Document');
const Invoice = require('../models/Invoice');
const emailService = require('../services/email.service');

const SAFE_ATTRS = { exclude: ['password_hash'] };

class UserController {
  /**
   * GET /api/users
   * List all users in the org with optional filters
   */
  async listUsers(req, res) {
    try {
      const { search, role, status, page = 1, limit = 50 } = req.query;
      const orgId = req.user.organization_id;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const where = { organization_id: orgId };
      if (role)              where.role      = role;
      if (status === 'active')   where.is_active = true;
      if (status === 'inactive') where.is_active = false;
      if (search) {
        where[Op.or] = [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name:  { [Op.iLike]: `%${search}%` } },
          { email:      { [Op.iLike]: `%${search}%` } },
          { username:   { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: SAFE_ATTRS,
        order: [['first_name', 'ASC'], ['last_name', 'ASC']],
        limit: parseInt(limit),
        offset
      });

      // Stats over the full org (not filtered)
      const allUsers = await User.findAll({
        where: { organization_id: orgId },
        attributes: ['role', 'is_active']
      });
      const stats = {
        total:    allUsers.length,
        active:   allUsers.filter(u => u.is_active).length,
        inactive: allUsers.filter(u => !u.is_active).length,
        admins:   allUsers.filter(u => u.role === 'admin').length,
        lawyers:  allUsers.filter(u => u.role === 'lawyer' && u.is_active).length,
      };

      res.json({
        success: true,
        data: rows,
        stats,
        pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) }
      });
    } catch (error) {
      console.error('Error listing users:', error);
      res.status(500).json({ success: false, message: 'Failed to list users' });
    }
  }

  /**
   * GET /api/users/:id
   * Get a single user with activity counts
   */
  async getUser(req, res) {
    try {
      const user = await User.findOne({
        where: { id: req.params.id, organization_id: req.user.organization_id },
        attributes: SAFE_ATTRS
      });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const [dossiers, timeline, documents, invoices] = await Promise.all([
        Dossier.count({ where: { assigned_to: user.id } }),
        TimelineNode.count({ where: { created_by: user.id } }),
        Document.count({ where: { uploaded_by: user.id } }),
        Invoice.count({ where: { created_by: user.id, organization_id: req.user.organization_id } }),
      ]);

      res.json({
        success: true,
        data: { ...user.toJSON(), activity: { dossiers, timeline, documents, invoices } }
      });
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ success: false, message: 'Failed to get user' });
    }
  }

  /**
   * POST /api/users
   * Create a new org user
   */
  async createUser(req, res) {
    try {
      const { first_name, last_name, email, role, password, send_welcome_email } = req.body;

      if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ success: false, message: 'First name, last name, email and password are required' });
      }
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      }

      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'A user with this email already exists' });
      }

      const password_hash = await User.hashPassword(password);
      const user = await User.create({
        first_name,
        last_name,
        email,
        username: email.split('@')[0],
        password_hash,
        role: role || 'lawyer',
        organization_id: req.user.organization_id,
        is_active: true
      });

      if (send_welcome_email) {
        try {
          const org = await Organization.findByPk(req.user.organization_id, { attributes: ['name'] });
          await emailService.sendWelcomeEmail({
            toEmail: email,
            firstName: first_name,
            lastName: last_name,
            orgName: org?.name || '',
            planName: null,
            tempPassword: password,
            loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
          });
        } catch (emailErr) {
          console.error('[UserController] Welcome email failed:', emailErr.message);
        }
      }

      res.status(201).json({ success: true, message: 'User created successfully', data: user.toJSON() });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors?.[0]?.path || '';
        const label = field.includes('email') ? 'email' : field.includes('username') ? 'username' : field;
        return res.status(409).json({ success: false, message: `This ${label} is already taken` });
      }
      console.error('Error creating user:', error);
      res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
    }
  }

  /**
   * PUT /api/users/:id
   * Update user profile / role
   */
  async updateUser(req, res) {
    try {
      const user = await User.findOne({
        where: { id: req.params.id, organization_id: req.user.organization_id }
      });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const { first_name, last_name, email, role } = req.body;

      // Prevent admin demoting themselves
      if (String(user.id) === String(req.user.id) && role && role !== 'admin') {
        return res.status(400).json({ success: false, message: 'You cannot change your own role' });
      }

      await user.update({ first_name, last_name, email, role });

      res.json({ success: true, message: 'User updated successfully', data: user.toJSON() });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ success: false, message: 'Email or username already in use' });
      }
      console.error('Error updating user:', error);
      res.status(500).json({ success: false, message: 'Failed to update user' });
    }
  }

  /**
   * PATCH /api/users/:id/toggle-status
   * Activate or deactivate a user
   */
  async toggleStatus(req, res) {
    try {
      const user = await User.findOne({
        where: { id: req.params.id, organization_id: req.user.organization_id }
      });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (String(user.id) === String(req.user.id)) {
        return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
      }

      // Protect last active admin
      if (user.role === 'admin' && user.is_active) {
        const adminCount = await User.count({ where: { organization_id: req.user.organization_id, role: 'admin', is_active: true } });
        if (adminCount <= 1) {
          return res.status(400).json({ success: false, message: 'Cannot deactivate the last admin account' });
        }
      }

      await user.update({ is_active: !user.is_active });

      res.json({
        success: true,
        message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
        data: user.toJSON()
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
  }

  /**
   * POST /api/users/:id/reset-password
   * Admin resets another user's password
   */
  async resetPassword(req, res) {
    try {
      const user = await User.findOne({
        where: { id: req.params.id, organization_id: req.user.organization_id }
      });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const { new_password, send_email } = req.body;

      if (!new_password || new_password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      }

      const password_hash = await User.hashPassword(new_password);
      await user.update({ password_hash });

      if (send_email) {
        try {
          const org = await Organization.findByPk(req.user.organization_id, { attributes: ['name'] });
          await emailService.sendWelcomeEmail({
            toEmail: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            orgName: org?.name || '',
            planName: null,
            tempPassword: new_password,
            loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
          });
        } catch (emailErr) {
          console.error('[UserController] Reset password email failed:', emailErr.message);
        }
      }

      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
  }

  /**
   * DELETE /api/users/:id
   */
  async deleteUser(req, res) {
    try {
      const user = await User.findOne({
        where: { id: req.params.id, organization_id: req.user.organization_id }
      });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (String(user.id) === String(req.user.id)) {
        return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
      }

      // Protect last admin
      if (user.role === 'admin') {
        const adminCount = await User.count({ where: { organization_id: req.user.organization_id, role: 'admin', is_active: true } });
        if (adminCount <= 1) {
          return res.status(400).json({ success: false, message: 'Cannot delete the last admin account' });
        }
      }

      await user.destroy();
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
  }
}

module.exports = new UserController();
