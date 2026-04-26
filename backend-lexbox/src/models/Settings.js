// ===================================================================
// SETTINGS MODEL
// ===================================================================
// src/models/Settings.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'general'
  },
  label: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_sensitive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'settings',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Settings;