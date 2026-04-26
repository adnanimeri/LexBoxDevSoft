// src/models/SubscriptionPlan.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price_monthly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  price_yearly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  // Limits
  max_users: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  max_storage_gb: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  max_clients: {
    type: DataTypes.INTEGER,
    allowNull: true // null = unlimited
  },
  max_dossiers: {
    type: DataTypes.INTEGER,
    allowNull: true // null = unlimited
  },
  // Features
  features: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      document_encryption: true,
      email_invoices: true,
      pdf_export: true,
      api_access: false,
      priority_support: false,
      custom_branding: false,
      audit_logs: false
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'subscription_plans',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = SubscriptionPlan;
