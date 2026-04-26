// ===================================================================
// USER MANAGEMENT ROUTES — admin only
// ===================================================================
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Assignable users list — accessible to all authenticated users (for dossier assignment dropdowns)
const User = require('../models/User');
router.get('/assignable', authenticate, async (req, res) => {
  try {
    const users = await User.findAll({
      where: { organization_id: req.user.organization_id, is_active: true, role: ['admin', 'lawyer'] },
      attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
      order: [['first_name', 'ASC'], ['last_name', 'ASC']]
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load users' });
  }
});

// All routes below require authentication + admin role
router.use(authenticate, authorize(['admin']));

router.get('/',                         userController.listUsers.bind(userController));
router.post('/',                        userController.createUser.bind(userController));
router.get('/:id',                      userController.getUser.bind(userController));
router.put('/:id',                      userController.updateUser.bind(userController));
router.patch('/:id/toggle-status',      userController.toggleStatus.bind(userController));
router.post('/:id/reset-password',      userController.resetPassword.bind(userController));
router.delete('/:id',                   userController.deleteUser.bind(userController));

module.exports = router;
