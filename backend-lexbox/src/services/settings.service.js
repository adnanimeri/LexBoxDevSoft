// ===================================================================
// SETTINGS SERVICE
// ===================================================================
// src/services/settings.service.js

const { Settings } = require('../models');
const { Op } = require('sequelize');

class SettingsService {
  // Cache for settings
  constructor() {
    this.cache = new Map();
    this.cacheLoaded = false;
  }

  /**
   * Load all settings into cache
   */
  async loadCache() {
    const settings = await Settings.findAll();
    settings.forEach(s => {
      this.cache.set(s.key, this._parseValue(s.value, s.type));
    });
    this.cacheLoaded = true;
  }

  /**
   * Parse value based on type
   */
  _parseValue(value, type) {
    if (value === null || value === undefined) return null;
    
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true' || value === true;
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * Get a single setting value
   */
  async get(key, defaultValue = null) {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const setting = await Settings.findOne({ where: { key } });
    if (setting) {
      const value = this._parseValue(setting.value, setting.type);
      this.cache.set(key, value);
      return value;
    }

    return defaultValue;
  }

  /**
   * Get multiple settings by category
   */
  async getByCategory(category) {
    const settings = await Settings.findAll({
      where: { category },
      attributes: { exclude: ['created_at', 'updated_at'] }
    });

    return settings.map(s => ({
      ...s.toJSON(),
      value: s.is_sensitive ? '********' : this._parseValue(s.value, s.type)
    }));
  }

  /**
   * Get all settings (grouped by category)
   */
  async getAll() {
    const settings = await Settings.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    const grouped = {};
    settings.forEach(s => {
      if (!grouped[s.category]) {
        grouped[s.category] = [];
      }
      grouped[s.category].push({
        ...s.toJSON(),
        value: s.is_sensitive ? '********' : this._parseValue(s.value, s.type)
      });
    });

    return grouped;
  }

  /**
   * Set a single setting
   */
  async set(key, value, options = {}) {
    const [setting, created] = await Settings.findOrCreate({
      where: { key },
      defaults: {
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        type: options.type || 'string',
        category: options.category || 'general',
        label: options.label || key,
        description: options.description || null,
        is_sensitive: options.is_sensitive || false
      }
    });

    if (!created) {
      await setting.update({
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        ...(options.label && { label: options.label }),
        ...(options.description && { description: options.description })
      });
    }

    // Update cache
    this.cache.set(key, this._parseValue(value, setting.type));

    return setting;
  }

  /**
   * Update multiple settings at once
   */
  async setMultiple(settings) {
    const results = [];
    for (const [key, value] of Object.entries(settings)) {
      const result = await this.set(key, value);
      results.push(result);
    }
    return results;
  }

  /**
   * Delete a setting
   */
  async delete(key) {
    const result = await Settings.destroy({ where: { key } });
    this.cache.delete(key);
    return result > 0;
  }

  /**
   * Initialize default settings
   */
  async initializeDefaults() {
    const defaults = [
      // Company settings — intentionally blank so each org fills in their own info
      { key: 'company_name',    value: '', category: 'company', label: 'Company Name',       description: 'Your law firm name' },
      { key: 'company_address', value: '', category: 'company', label: 'Company Address',    description: 'Full business address' },
      { key: 'company_phone',   value: '', category: 'company', label: 'Phone Number',       description: 'Contact phone number' },
      { key: 'company_email',   value: '', category: 'company', label: 'Company Email',      description: 'General contact email' },
      { key: 'company_website', value: '', category: 'company', label: 'Website',            description: 'Company website URL' },
      { key: 'company_tax_id',  value: '', category: 'company', label: 'Tax ID / VAT Number', description: 'Tax identification number' },
      
      // Invoice settings
      { key: 'invoice_prefix', value: 'INV', category: 'invoice', label: 'Invoice Prefix', description: 'Prefix for invoice numbers' },
      { key: 'default_tax_rate', value: '0', category: 'invoice', label: 'Default Tax Rate (%)', description: 'Default tax rate for invoices', type: 'number' },
      { key: 'default_payment_terms', value: 'Payment due within 30 days', category: 'invoice', label: 'Default Payment Terms', description: 'Default payment terms text' },
      { key: 'default_due_days', value: '30', category: 'invoice', label: 'Default Due Days', description: 'Days until invoice is due', type: 'number' },
      { key: 'currency_symbol', value: '€', category: 'invoice', label: 'Currency Symbol', description: 'Currency symbol to display' },
      
      // Billing settings
      { key: 'default_hourly_rate', value: '150', category: 'billing', label: 'Default Hourly Rate', description: 'Default rate for billable hours', type: 'number' }
    ];

    for (const setting of defaults) {
      const exists = await Settings.findOne({ where: { key: setting.key } });
      if (!exists) {
        await Settings.create({
          key: setting.key,
          value: setting.value,
          type: setting.type || 'string',
          category: setting.category,
          label: setting.label,
          description: setting.description,
          is_sensitive: setting.is_sensitive || false
        });
      }
    }

    // Reload cache
    await this.loadCache();
  }
}

module.exports = new SettingsService();