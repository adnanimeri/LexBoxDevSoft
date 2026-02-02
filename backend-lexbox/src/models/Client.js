const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Client Model
 * Matches the exact schema from LexBox specification
 */
const Client = sequelize.define('Client', {
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
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  personal_number: {
  type: DataTypes.STRING(50),
  allowNull: true,
  unique: true,
  validate: {
    len: [0, 50],
    isNumeric: {
      msg: 'Personal number must contain only numbers'
    }
  }
},
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
  type: DataTypes.STRING(20),
  allowNull: false,
  validate: {
    notEmpty: {
      msg: 'Phone number is required'
    },
    is: {
      args: /^\+[0-9]{8,15}$/,
      msg: 'Phone must start with + followed by 8-15 digits'
    }
  }
},
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_of_birth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // NEW: Separate registration date field as per specification
  registration_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    allowNull: false,
    validate: {
      isIn: [['active', 'archived', 'inactive']]
    }
  },
  // Metadata as JSONB for flexible storage
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  // NEW: Audit fields as per specification
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
  tableName: 'clients',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['personal_number']
    },
    {
      fields: ['status']
    },
    {
      fields: ['registration_date']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['created_by']
    }
  ],
  // Automatically update updated_at timestamp
  hooks: {
    beforeUpdate: (client, options) => {
      // Update the updated_by field if user is in options
      if (options.userId) {
        client.updated_by = options.userId;
      }
    }
  }
});

module.exports = Client;