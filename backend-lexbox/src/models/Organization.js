
// ===================================================================
// ORGANIZATION MODEL (Multi-Tenant)
// ===================================================================
// src/models/Organization.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  // Contact Info
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  tax_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  // Encryption - auto-generated salt for key derivation
  encryption_salt: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  // Storage
  storage_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  storage_used_bytes: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  // Subscription
  subscription_plan_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'subscription_plans',
      key: 'id'
    }
  },
  subscription_status: {
    type: DataTypes.ENUM('trial', 'active', 'past_due', 'cancelled', 'suspended'),
    defaultValue: 'trial'
  },
  subscription_started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscription_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  trial_ends_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  billing_cycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    defaultValue: 'monthly'
  },
  // Status
  status: {
    type: DataTypes.ENUM('pending', 'active', 'suspended', 'deleted'),
    defaultValue: 'pending'
  },
  // Metadata
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'organizations',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    // Must use beforeValidate — allowNull checks run before beforeCreate
    beforeValidate: (org) => {
      if (!org.encryption_salt) {
        org.encryption_salt = crypto.randomBytes(32).toString('hex');
      }
      if (!org.slug) {
        const base = (org.name || 'org')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        org.slug = base + '-' + Date.now().toString(36);
      }
      if (!org.storage_path) {
        // id may not be set yet; use slug as path key (unique per org)
        org.storage_path = `organizations/${org.slug}`;
      }
      if (!org.trial_ends_at) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        org.trial_ends_at = trialEnd;
      }
    }
  }
});

module.exports = Organization;
