// ===================================================================
// DOCUMENT TEMPLATE MODEL
// ===================================================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentTemplate = sequelize.define('DocumentTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  organization_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'organizations', key: 'id' }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Body stored as plain text with {{variable}} placeholders
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'other'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'document_templates',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DocumentTemplate;
