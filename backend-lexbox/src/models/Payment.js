// ===================================================================
// PAYMENT MODEL
// ===================================================================
// src/models/Payment.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
    allowNull: false
  },
  invoice_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'invoices',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'cash',
    validate: {
      isIn: [['cash', 'bank_transfer', 'credit_card', 'check', 'other']]
    }
  },
  reference_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recorded_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true
});

module.exports = Payment;