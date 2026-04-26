const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const Organization = require('../models/Organization');

// Middleware: allow secretary if org has granted the given permission key
const allowSecretaryIf = (settingKey) => async (req, res, next) => {
  if (req.user.role !== 'secretary') return next(); // non-secretary: pass through
  try {
    const org = await Organization.findByPk(req.user.organization_id, { attributes: ['settings'] });
    if (org?.settings?.[settingKey]) return next();
    return res.status(403).json({ success: false, message: 'Your role does not have permission for this action' });
  } catch {
    return res.status(500).json({ success: false, message: 'Permission check failed' });
  }
};
//const { validateRequest } = require('../middleware/validation.middleware');
const { validate: validateRequest } = require('../middleware/validation.middleware');
const { body, param } = require('express-validator');

// Validation rules
/*
const createClientValidation = [
  body('first_name').trim().notEmpty().isLength({ min: 1, max: 100 }),
  body('last_name').trim().notEmpty().isLength({ min: 1, max: 100 }),
  body('email').optional().trim().isEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+[0-9]{8,15}$/).withMessage('Phone must start with + followed by 8-15 digits'),
  body('personal_number').optional().trim().isLength({ max: 50 }),
  body('date_of_birth').optional().isISO8601(),
  validateRequest
];
*/

const createClientValidation = [
  body('first_name').trim().notEmpty().isLength({ min: 1, max: 100 }),
  body('last_name').trim().notEmpty().isLength({ min: 1, max: 100 }),
  body('email').optional().trim().isEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+[0-9]{8,15}$/).withMessage('Phone must start with + followed by 8-15 digits'),
  body('personal_number').optional().trim().isLength({ max: 50 }),
  body('date_of_birth').optional().isISO8601(),
  validateRequest
];




const updateClientValidation = [
  param('id').isInt(),
  body('first_name').optional().trim().isLength({ min: 1, max: 100 }),
  body('last_name').optional().trim().isLength({ min: 1, max: 100 }),
  body('email').optional().trim().isEmail(),
  validateRequest
];

const assignDossierValidation = [
  param('id').isInt(),
  body('dossier_number').trim().notEmpty().isLength({ min: 1, max: 50 }),
  body('legal_issue_type').optional().isIn([
    'family_law', 'criminal_law', 'civil_law', 'immigration', 
    'property_law', 'business_law', 'labor_law', 'other'
  ]),
  validateRequest
];

const idParamValidation = [
  param('id').isInt(),
  validateRequest
];

// Routes
router.get('/stats', authenticate, authorize(['admin', 'lawyer']), 
  clientController.getStats.bind(clientController));

router.get('/recent', authenticate,
  clientController.getRecentClients.bind(clientController));

router.get('/search', authenticate,
  clientController.searchClients.bind(clientController));

router.get('/', authenticate,
  clientController.getClients.bind(clientController));

router.get('/:id', authenticate, ...idParamValidation,
  clientController.getClient.bind(clientController));

router.post('/', authenticate, authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryIf('secretary_can_create_clients'),
  ...createClientValidation,
  clientController.createClient.bind(clientController));

router.put('/:id', authenticate, authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryIf('secretary_can_create_clients'),
  ...updateClientValidation,
  clientController.updateClient.bind(clientController));

router.patch('/:id/dossier', authenticate, authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryIf('secretary_can_create_clients'),
  ...assignDossierValidation,
  clientController.assignDossier.bind(clientController));

router.delete('/:id/archive', authenticate, authorize(['admin', 'lawyer']), 
  ...idParamValidation,
  clientController.archiveClient.bind(clientController));

router.delete('/:id', authenticate, authorize(['admin']), 
  ...idParamValidation,
  clientController.deleteClient.bind(clientController));

module.exports = router;