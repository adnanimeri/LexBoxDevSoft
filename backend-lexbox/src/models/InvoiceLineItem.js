// ===================================================================
// INVOICE LINE ITEM MODEL
// ===================================================================
// src/models/InvoiceLineItem.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InvoiceLineItem = sequelize.define('InvoiceLineItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoice_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'invoices',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  timeline_node_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'timeline_nodes',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1.00
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  activity_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'invoice_line_items',
  timestamps: true,
  underscored: true
});

module.exports = InvoiceLineItem;