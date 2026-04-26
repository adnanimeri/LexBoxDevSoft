// ===================================================================
// BILLING CONTROLLER
// ===================================================================
// src/controllers/billing.controller.js

const billingService = require('../services/billing.service');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');
const { Client, Dossier } = require('../models');

class BillingController {
  /**
   * Get all invoices for a dossier
   * GET /api/dossiers/:dossierId/invoices
   */
  async getInvoices(req, res) {
    try {
      const { dossierId } = req.params;
      const filters = {
        status: req.query.status,
        startDate: req.query.start_date,
        endDate: req.query.end_date
      };

      const invoices = await billingService.getInvoicesByDossier(dossierId, filters);

      res.json({
        success: true,
        data: invoices
      });
    } catch (error) {
      console.error('Error getting invoices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve invoices',
        error: error.message
      });
    }
  }

  /**
   * Get unbilled timeline items
   * GET /api/dossiers/:dossierId/unbilled
   */
  async getUnbilledItems(req, res) {
    try {
      const { dossierId } = req.params;
      const unbilledItems = await billingService.getUnbilledItems(dossierId);

      res.json({
        success: true,
        data: unbilledItems
      });
    } catch (error) {
      console.error('Error getting unbilled items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve unbilled items',
        error: error.message
      });
    }
  }

  /**
   * Get billing summary for a dossier
   * GET /api/dossiers/:dossierId/billing-summary
   */
  async getBillingSummary(req, res) {
    try {
      const { dossierId } = req.params;
      const summary = await billingService.getBillingSummary(dossierId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting billing summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve billing summary',
        error: error.message
      });
    }
  }

  /**
   * Create invoice
   * POST /api/dossiers/:dossierId/invoices
   */
  async createInvoice(req, res) {
    try {
      const { dossierId } = req.params;
      const userId = req.user?.id || null;

      const invoice = await billingService.createInvoice(dossierId, req.body, userId);

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      
      if (error.message === 'Dossier not found') {
        return res.status(404).json({
          success: false,
          message: 'Dossier not found'
        });
      }
      
      if (error.message === 'No billable items to invoice') {
        return res.status(400).json({
          success: false,
          message: 'No billable items to invoice'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create invoice',
        error: error.message
      });
    }
  }

  /**
   * Get single invoice
   * GET /api/invoices/:invoiceId
   */
  async getInvoice(req, res) {
    try {
      const invoice = await billingService.getInvoiceById(req.params.invoiceId);

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      console.error('Error getting invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve invoice',
        error: error.message
      });
    }
  }

  /**
   * Update invoice
   * PUT /api/invoices/:invoiceId
   */
  async updateInvoice(req, res) {
    try {
      const userId = req.user?.id || null;
      const invoice = await billingService.updateInvoice(req.params.invoiceId, req.body, userId);

      res.json({
        success: true,
        message: 'Invoice updated successfully',
        data: invoice
      });
    } catch (error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      console.error('Error updating invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update invoice',
        error: error.message
      });
    }
  }

  /**
   * Send invoice (mark as sent)
   * POST /api/invoices/:invoiceId/send
   */
  async sendInvoice(req, res) {
    try {
      const invoice = await billingService.sendInvoice(req.params.invoiceId);

      res.json({
        success: true,
        message: 'Invoice marked as sent',
        data: invoice
      });
    } catch (error) {
      console.error('Error sending invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send invoice',
        error: error.message
      });
    }
  }

  /**
   * Cancel invoice
   * POST /api/invoices/:invoiceId/cancel
   */
  async cancelInvoice(req, res) {
    try {
      const invoice = await billingService.cancelInvoice(req.params.invoiceId);

      res.json({
        success: true,
        message: 'Invoice cancelled successfully',
        data: invoice
      });
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel invoice',
        error: error.message
      });
    }
  }

  /**
   * Record payment
   * POST /api/invoices/:invoiceId/payments
   */
  async recordPayment(req, res) {
    try {
      const userId = req.user?.id || null;
      const invoice = await billingService.recordPayment(req.params.invoiceId, req.body, userId);

      res.json({
        success: true,
        message: 'Payment recorded successfully',
        data: invoice
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record payment',
        error: error.message
      });
    }
  }

  /**
   * Delete payment
   * DELETE /api/payments/:paymentId
   */
  async deletePayment(req, res) {
    try {
      await billingService.deletePayment(req.params.paymentId);

      res.json({
        success: true,
        message: 'Payment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payment',
        error: error.message
      });
    }
  }

  /**
   * Generate and download invoice PDF
   * GET /api/invoices/:invoiceId/pdf
   */
  async downloadInvoicePDF(req, res) {
    try {
      const invoice = await billingService.getInvoiceById(req.params.invoiceId);
      
      // Get client info
      const dossier = await Dossier.findByPk(invoice.dossier_id, {
        include: [{ model: Client, as: 'client' }]
      });

      if (!dossier || !dossier.client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      const lineItems = invoice.lineItems || [];
      const pdfBuffer = await pdfService.generateInvoicePDF(invoice, dossier.client, lineItems);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  }

  /**
   * Send invoice via email
   * POST /api/invoices/:invoiceId/email
   */
  async emailInvoice(req, res) {
    try {
      const invoice = await billingService.getInvoiceById(req.params.invoiceId);
      
      // Get client info
      const dossier = await Dossier.findByPk(invoice.dossier_id, {
        include: [{ model: Client, as: 'client' }]
      });

      if (!dossier || !dossier.client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      const client = dossier.client;

      if (!client.email) {
        return res.status(400).json({
          success: false,
          message: 'Client does not have an email address'
        });
      }

      // Generate PDF
      const lineItems = invoice.lineItems || [];
      const pdfBuffer = await pdfService.generateInvoicePDF(invoice, client, lineItems);

      // Send email
      await emailService.sendInvoiceEmail(invoice, client, pdfBuffer);

      // Update invoice status to sent if it was draft
      if (invoice.status === 'draft') {
        await billingService.sendInvoice(invoice.id);
      }

      res.json({
        success: true,
        message: `Invoice sent to ${client.email}`
      });
    } catch (error) {
      console.error('Error emailing invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to email invoice',
        error: error.message
      });
    }
  }
  /**
   * GET /api/billing/invoices
   * All invoices for the org (global view, paginated)
   */
  async getGlobalInvoices(req, res) {
    try {
      const orgId = req.user.organization_id;
      const filters = {
        status: req.query.status,
        search: req.query.search,
        startDate: req.query.start_date,
        endDate: req.query.end_date,
        page: req.query.page || 1,
        limit: req.query.limit || 20
      };
      const result = await billingService.getGlobalInvoices(orgId, filters);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error getting global invoices:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve invoices', error: error.message });
    }
  }

  /**
   * GET /api/billing/summary
   * Summary stats for the org
   */
  async getGlobalSummary(req, res) {
    try {
      const orgId = req.user.organization_id;
      const summary = await billingService.getGlobalSummary(orgId);
      res.json({ success: true, data: summary });
    } catch (error) {
      console.error('Error getting global summary:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve summary', error: error.message });
    }
  }
}

module.exports = new BillingController();