const { Client, Dossier, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class ClientService {

  
  async getClients(filters = {}) {
    const {
      search = '',
      status = null,
      page = 1,
      limit = 20,
      sortBy = 'registration_date',
      sortOrder = 'DESC'
    } = filters;

    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { personal_number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { rows: clients, count: total } = await Client.findAndCountAll({
      where,
      include: [
        {
          model: Dossier,
          as: 'dossiers',
          attributes: ['id', 'dossier_number', 'status', 'legal_issue_type', 'priority']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      data: clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getClientById(clientId) {
    const client = await Client.findByPk(clientId, {
      include: [
        {
          model: Dossier,
          as: 'dossiers',
          include: [
            {
              model: User,
              as: 'assignedLawyer',
              attributes: ['id', 'first_name', 'last_name', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!client) {
      throw new Error('Client not found');
    }

    return client;
  }

  async createClient(clientData, userId = null) {
    const transaction = await sequelize.transaction();

    try {
      const dataWithAudit = {
        ...clientData,
        created_by: userId,
        registration_date: new Date()
      };

      const client = await Client.create(dataWithAudit, { transaction });

      if (clientData.dossier_number) {
        await Dossier.create({
          client_id: client.id,
          dossier_number: clientData.dossier_number,
          title: clientData.dossier_title || `Case for ${client.first_name} ${client.last_name}`,
          legal_issue_type: clientData.legal_issue_type || 'other',
          assigned_to: clientData.assigned_to || null,
          priority: clientData.priority || 'medium',
          created_by: userId
        }, { transaction });
      }

      await transaction.commit();
      return await this.getClientById(client.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateClient(clientId, updateData, userId = null) {
    const client = await Client.findByPk(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    const { dossier_number, dossier_title, legal_issue_type, assigned_to, ...clientFields } = updateData;

    await client.update(clientFields, { userId });

    return await this.getClientById(client.id);
  }

  async archiveClient(clientId, userId = null) {
    const client = await Client.findByPk(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    await client.update({ status: 'archived' }, { userId });

    await Dossier.update(
      { 
        status: 'archived',
        updated_by: userId 
      },
      { 
        where: { client_id: clientId },
        userId 
      }
    );

    return await this.getClientById(client.id);
  }

  

  async deleteClient(clientId) {
    const client = await Client.findByPk(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    await client.destroy();
    return { message: 'Client deleted successfully' };
  }

  async assignDossierNumber(clientId, dossierNumber, dossierData = {}, userId = null) {
    const transaction = await sequelize.transaction();

    try {
      const client = await Client.findByPk(clientId);

      if (!client) {
        throw new Error('Client not found');
      }

      const existingDossier = await Dossier.findOne({
        where: { dossier_number: dossierNumber }
      });

      if (existingDossier) {
        throw new Error('Dossier number already exists');
      }

      await Dossier.create({
        client_id: clientId,
        dossier_number: dossierNumber,
        title: dossierData.title || `Case for ${client.first_name} ${client.last_name}`,
        description: dossierData.description || null,
        legal_issue_type: dossierData.legal_issue_type || 'other',
        assigned_to: dossierData.assigned_to || null,
        priority: dossierData.priority || 'medium',
        created_by: userId
      }, { transaction });

      await transaction.commit();
      return await this.getClientById(clientId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async searchClients(searchTerm, limit = 10) {
    const clients = await Client.findAll({
      where: {
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${searchTerm}%` } },
          { last_name: { [Op.iLike]: `%${searchTerm}%` } },
          { email: { [Op.iLike]: `%${searchTerm}%` } }
        ],
        status: 'active'
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'personal_number'],
      limit: parseInt(limit),
      order: [['first_name', 'ASC']]
    });

    return clients;
  }

  async getClientStats() {
    const [totalClients, activeClients, archivedClients] = await Promise.all([
      Client.count(),
      Client.count({ where: { status: 'active' } }),
      Client.count({ where: { status: 'archived' } })
    ]);

    const activeDossiers = await Dossier.count({
      where: { status: { [Op.in]: ['open', 'in_progress'] } }
    });

    const financialStats = await Dossier.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_billed')), 'total_billed'],
        [sequelize.fn('SUM', sequelize.col('total_paid')), 'total_paid']
      ],
      where: {
        status: { [Op.in]: ['open', 'in_progress', 'pending'] }
      },
      raw: true
    });

    return {
      totalClients,
      activeClients,
      archivedClients,
      activeDossiers,
      financial: {
        totalBilled: parseFloat(financialStats[0]?.total_billed || 0),
        totalPaid: parseFloat(financialStats[0]?.total_paid || 0),
        outstanding: parseFloat(financialStats[0]?.total_billed || 0) - parseFloat(financialStats[0]?.total_paid || 0)
      }
    };
  }

  async getRecentClients(limit = 5) {
    const clients = await Client.findAll({
      limit: parseInt(limit),
      order: [['registration_date', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['first_name', 'last_name']
        }
      ]
    });

    return clients;
  }
}

module.exports = new ClientService();