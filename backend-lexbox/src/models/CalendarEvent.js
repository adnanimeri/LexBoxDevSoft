// ===================================================================
// CALENDAR EVENT MODEL
// ===================================================================
// Standalone calendar events (not linked to timeline/invoice)

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CalendarEvent = sequelize.define('CalendarEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  organization_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true }
  },
  description: {
    type: DataTypes.TEXT
  },
  event_type: {
    type: DataTypes.ENUM(
      'court_hearing',
      'meeting',
      'consultation',
      'filing_deadline',
      'milestone',
      'invoice_due',
      'task'
    ),
    allowNull: false,
    defaultValue: 'task'
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE
  },
  is_all_day: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  location: {
    type: DataTypes.STRING(255)
  },
  dossier_id: {
    type: DataTypes.INTEGER,
    references: { model: 'dossiers', key: 'id' },
    onDelete: 'SET NULL'
  },
  client_id: {
    type: DataTypes.INTEGER,
    references: { model: 'clients', key: 'id' },
    onDelete: 'SET NULL'
  },
  color: {
    type: DataTypes.STRING(7) // hex color override
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'calendar_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['start_date'] },
    { fields: ['dossier_id'] }
  ]
});

module.exports = CalendarEvent;
