const clientService = require('../services/client.service');

class ClientController {
  async getClients(req, res) {
    try {
      const filters = {
        search: req.query.search || '',
        status: req.query.status || null,
        page: req.query.page || 1,
        limit: req.query.limit || 20,
        sortBy: req.query.sortBy || 'registration_date',
        sortOrder: req.query.sortOrder || 'DESC',
        organization_id: req.user.organization_id
      };

      const result = await clientService.getClients(filters);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error getting clients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve clients',
        error: error.message
      });
    }
  }

  async getClient(req, res) {
    try {
      const client = await clientService.getClientById(req.params.id, req.user.organization_id);

      res.json({
        success: true,
        data: client
      });
    } catch (error) {
      if (error.message === 'Client not found') {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      console.error('Error getting client:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve client', error: error.message });
    }
  }

  async createClient(req, res) {
    try {
      const client = await clientService.createClient(
        req.body,
        req.user.id,
        req.user.organization_id
      );

      res.status(201).json({
        success: true,
        message: 'Client created successfully',
        data: client
      });
    } catch (error) {
      console.error('Error creating client:', error);

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(e => ({ field: e.path, message: e.message }))
        });
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors?.[0]?.path || '';
        const which = field.includes('email') ? 'email address' : 'personal number';
        return res.status(409).json({
          success: false,
          message: `A client with this ${which} already exists in your organization`
        });
      }

      res.status(500).json({ success: false, message: 'Failed to create client', error: error.message });
    }
  }

  async updateClient(req, res) {
    try {
      const client = await clientService.updateClient(
        req.params.id,
        req.body,
        req.user.id,
        req.user.organization_id
      );

      res.json({ success: true, message: 'Client updated successfully', data: client });
    } catch (error) {
      if (error.message === 'Client not found') {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors?.[0]?.path || '';
        const fieldLabel = field.includes('email') ? 'email address' : field.includes('personal_number') ? 'personal number' : field;
        return res.status(409).json({ success: false, message: `Another client in this organization already has the same ${fieldLabel}.` });
      }
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ success: false, message: error.errors.map(e => e.message).join(', ') });
      }
      console.error('Error updating client:', error);
      res.status(500).json({ success: false, message: 'Failed to update client', error: error.message });
    }
  }

  async archiveClient(req, res) {
    try {
      const client = await clientService.archiveClient(
        req.params.id,
        req.user.id,
        req.user.organization_id
      );

      res.json({ success: true, message: 'Client archived successfully', data: client });
    } catch (error) {
      if (error.message === 'Client not found') {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      console.error('Error archiving client:', error);
      res.status(500).json({ success: false, message: 'Failed to archive client', error: error.message });
    }
  }

  async deleteClient(req, res) {
    try {
      await clientService.deleteClient(req.params.id, req.user.organization_id);

      res.json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
      if (error.message === 'Client not found') {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      console.error('Error deleting client:', error);
      res.status(500).json({ success: false, message: 'Failed to delete client', error: error.message });
    }
  }

  async assignDossier(req, res) {
    try {
      const { dossier_number, ...dossierData } = req.body;

      if (!dossier_number) {
        return res.status(400).json({ success: false, message: 'Dossier number is required' });
      }

      const client = await clientService.assignDossierNumber(
        req.params.id,
        dossier_number,
        dossierData,
        req.user.id,
        req.user.organization_id
      );

      res.json({ success: true, message: 'Dossier assigned successfully', data: client });
    } catch (error) {
      if (error.message === 'Client not found') {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      if (error.message === 'Dossier number already exists') {
        return res.status(409).json({ success: false, message: 'Dossier number already exists' });
      }
      console.error('Error assigning dossier:', error);
      res.status(500).json({ success: false, message: 'Failed to assign dossier', error: error.message });
    }
  }

  async searchClients(req, res) {
    try {
      const clients = await clientService.searchClients(
        req.query.q || '',
        req.query.limit || 10,
        req.user.organization_id
      );

      res.json({ success: true, data: clients });
    } catch (error) {
      console.error('Error searching clients:', error);
      res.status(500).json({ success: false, message: 'Failed to search clients', error: error.message });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await clientService.getClientStats(req.user.organization_id);

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error getting client stats:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve statistics', error: error.message });
    }
  }

  async getRecentClients(req, res) {
    try {
      const clients = await clientService.getRecentClients(
        req.query.limit || 5,
        req.user.organization_id
      );

      res.json({ success: true, data: clients });
    } catch (error) {
      console.error('Error getting recent clients:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve recent clients', error: error.message });
    }
  }
}

module.exports = new ClientController();
