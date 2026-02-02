// ===================================================================
// TIMELINE NODE MODEL
// ===================================================================
// src/models/TimelineNode.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * TimelineNode Model
 * Tracks all activities and events for a dossier
 */
const TimelineNode = sequelize.define('TimelineNode', {
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
  dossier_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'dossiers',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  // Node types: registration, legal_classification, activity, document, milestone, billing_event
  node_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [[
        'registration',
        'legal_classification',
        'activity',
        'document',
        'milestone',
        'billing_event'
      ]]
    }
  },
  // Activity subtypes for 'activity' node_type
  activity_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [[
        'consultation',
        'court_hearing',
        'document_filing',
        'phone_call',
        'email',
        'meeting',
        'research',
        'drafting',
        'review',
        'negotiation',
        'other'
      ]]
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // When the activity occurred
  activity_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  // Time tracking
  hours_worked: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 999.99
    }
  },
  // Billing
  hourly_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  billing_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  is_billable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_billed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Status tracking
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'completed',
    allowNull: false,
    validate: {
      isIn: [['pending', 'in_progress', 'completed', 'cancelled']]
    }
  },
  // Priority for milestones
  priority: {
    type: DataTypes.STRING(20),
    defaultValue: 'medium',
    validate: {
      isIn: [['low', 'medium', 'high', 'urgent']]
    }
  },
  // Color for timeline display
  color: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  // Reference to related document (if node_type is 'document')
  document_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Reference to related invoice (if node_type is 'billing_event')
  invoice_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Flexible metadata
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  // Audit fields
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'timeline_nodes',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['dossier_id'] },
    { fields: ['node_type'] },
    { fields: ['activity_type'] },
    { fields: ['activity_date'] },
    { fields: ['status'] },
    { fields: ['is_billable'] },
    { fields: ['is_billed'] },
    { fields: ['created_by'] }
  ],
  hooks: {
    beforeCreate: (node, options) => {
      // Auto-calculate billing amount
      if (node.hours_worked && node.hourly_rate) {
        node.billing_amount = parseFloat(node.hours_worked) * parseFloat(node.hourly_rate);
      }
      // Auto-assign color based on node type
      if (!node.color) {
        node.color = TimelineNode.getDefaultColor(node.node_type);
      }
    },
    beforeUpdate: (node, options) => {
      // Recalculate billing amount
      if (node.changed('hours_worked') || node.changed('hourly_rate')) {
        node.billing_amount = parseFloat(node.hours_worked || 0) * parseFloat(node.hourly_rate || 0);
      }
      if (options.userId) {
        node.updated_by = options.userId;
      }
    }
  }
});

/**
 * Get default color for node type
 */
TimelineNode.getDefaultColor = function(nodeType) {
  const colors = {
    registration: 'blue',
    legal_classification: 'purple',
    activity: 'green',
    document: 'yellow',
    milestone: 'orange',
    billing_event: 'red'
  };
  return colors[nodeType] || 'gray';
};

/**
 * Instance method to get formatted data
 */
TimelineNode.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Add computed fields
  if (!values.color) {
    values.color = TimelineNode.getDefaultColor(values.node_type);
  }
  
  return values;
};

module.exports = TimelineNode;