
// ===================================================================
// ORGANIZATION REQUEST MODEL
// ===================================================================
// src/models/OrganizationRequest.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrganizationRequest = sequelize.define('OrganizationRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Company Info
  organization_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  // Contact Person
  contact_first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  contact_last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contact_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  // Additional Info
  company_size: {
    type: DataTypes.STRING(50),
    allowNull: true // e.g., "1-5", "6-20", "21-50", "50+"
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Status
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  reviewed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  review_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Plan selected by the firm during registration
  requested_plan_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'subscription_plans',
      key: 'id'
    }
  },
  // If approved, link to created org
  organization_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'organizations',
      key: 'id'
    }
  }
}, {
  tableName: 'organization_requests',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = OrganizationRequest;
