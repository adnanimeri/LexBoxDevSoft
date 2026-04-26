// ===================================================================
// SETTINGS CONTROLLER
// ===================================================================
// src/controllers/settings.controller.js

const settingsService = require('../services/settings.service');

class SettingsController {
  /**
   * Get all settings (grouped by category)
   * GET /api/settings
   */
  async getAllSettings(req, res) {
    try {
      const settings = await settingsService.getAll();
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve settings',
        error: error.message
      });
    }
  }

  /**
   * Get settings by category
   * GET /api/settings/:category
   */
  async getByCategory(req, res) {
    try {
      const { category } = req.params;
      const settings = await settingsService.getByCategory(category);
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve settings',
        error: error.message
      });
    }
  }

  /**
   * Update settings
   * PUT /api/settings
   */
  async updateSettings(req, res) {
    try {
      const updates = req.body;
      
      for (const [key, value] of Object.entries(updates)) {
        // Skip sensitive fields if they contain masked value
        if (value === '********') continue;
        await settingsService.set(key, value);
      }

      res.json({
        success: true,
        message: 'Settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update settings',
        error: error.message
      });
    }
  }

  /**
   * Get billing defaults (for invoice/timeline forms)
   * GET /api/settings/defaults/billing
   */
  async getBillingDefaults(req, res) {
    try {
      const defaults = {
        default_tax_rate: await settingsService.get('default_tax_rate', 0),
        default_hourly_rate: await settingsService.get('default_hourly_rate', 150),
        default_payment_terms: await settingsService.get('default_payment_terms', 'Payment due within 30 days'),
        default_due_days: await settingsService.get('default_due_days', 30),
        currency_symbol: await settingsService.get('currency_symbol', '€')
      };

      res.json({
        success: true,
        data: defaults
      });
    } catch (error) {
      console.error('Error getting billing defaults:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve billing defaults',
        error: error.message
      });
    }
  }

  /**
   * Test email configuration
   * POST /api/settings/test-email
   */
  async testEmail(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required'
        });
      }

      // Get email service and refresh config
      const emailService = require('../services/email.service');
      emailService.refreshConfig();
      
      const isConnected = await emailService.verifyConnection();
      if (!isConnected) {
        return res.status(400).json({
          success: false,
          message: 'Could not connect to email server. Please check your SMTP settings.'
        });
      }

      // Send test email
      await emailService.sendTestEmail(email);

      res.json({
        success: true,
        message: `Test email sent to ${email}`
      });
    } catch (error) {
      console.error('Error testing email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test email: ' + error.message,
        error: error.message
      });
    }
  }
}

module.exports = new SettingsController();