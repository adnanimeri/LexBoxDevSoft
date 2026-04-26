const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  is_system_role: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'roles',
  timestamps: true,
  underscored: true
});

module.exports = Role;