// ===================================================================
// DOCUMENT MODEL
// ===================================================================
// src/models/Document.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dossier_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'dossiers',
      key: 'id'
    }
  },
  original_filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'other'
  },
  physical_location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Physical storage location (tray, shelf, etc.)'
  },
  is_confidential: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  document_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'documents',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Document;