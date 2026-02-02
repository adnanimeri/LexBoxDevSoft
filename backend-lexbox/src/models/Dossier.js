const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dossier = sequelize.define('Dossier', {
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
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  dossier_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  legal_issue_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [[
        'family_law',
        'criminal_law',
        'civil_law',
        'immigration',
        'property_law',
        'business_law',
        'labor_law',
        'other'
      ]]
    }
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'open',
    allowNull: false,
    validate: {
      isIn: [['open', 'in_progress', 'pending', 'closed', 'archived']]
    }
  },
  priority: {
    type: DataTypes.STRING(20),
    defaultValue: 'medium',
    allowNull: false,
    validate: {
      isIn: [['low', 'medium', 'high', 'urgent']]
    }
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  opened_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  closed_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_billed: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  total_paid: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'dossiers',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['client_id'] },
    { fields: ['dossier_number'] },
    { fields: ['status'] },
    { fields: ['assigned_to'] },
    { fields: ['legal_issue_type'] },
    { fields: ['opened_date'] },
    { fields: ['priority'] }
  ],
  hooks: {
    beforeUpdate: (dossier, options) => {
      if (options.userId) {
        dossier.updated_by = options.userId;
      }
    }
  }
});

Dossier.prototype.getBalance = function() {
  return parseFloat(this.total_billed) - parseFloat(this.total_paid);
};

Dossier.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values.balance = this.getBalance();
  return values;
};

module.exports = Dossier;