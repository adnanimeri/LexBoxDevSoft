// ===================================================================
// BILLING SERVICE
// ===================================================================
// src/services/billing.service.js

const { Invoice, InvoiceLineItem, Payment, Dossier, TimelineNode, Client, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class BillingService {
  /**
   * Generate unique invoice number
   */
  async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    
    const lastInvoice = await Invoice.findOne({
      where: {
        invoice_number: {
          [Op.like]: `${prefix}%`
        }
      },
      order: [['invoice_number', 'DESC']]
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoice_number.replace(prefix, ''));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Get all invoices for a dossier
   */
  async getInvoicesByDossier(dossierId, filters = {}) {
    const { status, startDate, endDate } = filters;
    
    const where = { dossier_id: dossierId };
    
    if (status) where.status = status;
    if (startDate || endDate) {
      where.issue_date = {};
      if (startDate) where.issue_date[Op.gte] = startDate;
      if (endDate) where.issue_date[Op.lte] = endDate;
    }

    const invoices = await Invoice.findAll({
      where,
      include: [
        {
          model: InvoiceLineItem,
          as: 'lineItems'
        },
        {
          model: Payment,
          as: 'payments'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      order: [['issue_date', 'DESC']]
    });

    return invoices;
  }

  /**
   * Get single invoice by ID
   */
  async getInvoiceById(invoiceId) {
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        {
          model: InvoiceLineItem,
          as: 'lineItems',
          include: [
            {
              model: TimelineNode,
              as: 'timelineNode',
              attributes: ['id', 'title', 'activity_date', 'node_type']
            }
          ]
        },
        {
          model: Payment,
          as: 'payments',
          include: [
            {
              model: User,
              as: 'recorder',
              attributes: ['id', 'first_name', 'last_name']
            }
          ]
        },
        {
          model: Dossier,
          as: 'dossier',
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'address']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return invoice;
  }

  /**
   * Get unbilled timeline nodes for a dossier
   */
  async getUnbilledItems(dossierId) {
    const unbilledNodes = await TimelineNode.findAll({
      where: {
        dossier_id: dossierId,
        is_billable: true,
        is_billed: false
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      order: [['activity_date', 'ASC']]
    });

    return unbilledNodes;
  }

  /**
   * Create invoice from unbilled timeline activities
   */
  async createInvoice(dossierId, data, userId) {
    const transaction = await sequelize.transaction();

    try {
      // Verify dossier exists
      const dossier = await Dossier.findByPk(dossierId);
      if (!dossier) {
        throw new Error('Dossier not found');
      }

      // Get selected timeline nodes or all unbilled
      let timelineNodeIds = data.timeline_node_ids || [];
      
      if (timelineNodeIds.length === 0) {
        // Get all unbilled items
        const unbilledNodes = await this.getUnbilledItems(dossierId);
        timelineNodeIds = unbilledNodes.map(n => n.id);
      }

      if (timelineNodeIds.length === 0) {
        throw new Error('No billable items to invoice');
      }

      // Get timeline nodes
      const timelineNodes = await TimelineNode.findAll({
        where: {
          id: { [Op.in]: timelineNodeIds },
          dossier_id: dossierId,
          is_billable: true,
          is_billed: false
        },
        transaction
      });

      if (timelineNodes.length === 0) {
        throw new Error('No valid billable items found');
      }

      // Calculate subtotal
      const subtotal = timelineNodes.reduce((sum, node) => {
        return sum + (parseFloat(node.billing_amount) || 0);
      }, 0);

      // Calculate tax
      const taxRate = parseFloat(data.tax_rate) || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Calculate due date (default 30 days)
      const issueDate = data.issue_date ? new Date(data.issue_date) : new Date();
      const dueDays = data.due_days || 30;
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + dueDays);

      // Create invoice
      const invoice = await Invoice.create({
        dossier_id: dossierId,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal: subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        amount_paid: 0,
        status: 'draft',
        notes: data.notes || null,
        payment_terms: data.payment_terms || 'Payment due within 30 days',
        created_by: userId
      }, { transaction });

      // Create line items from timeline nodes
      const lineItems = [];
      for (const node of timelineNodes) {
        const lineItem = await InvoiceLineItem.create({
          invoice_id: invoice.id,
          timeline_node_id: node.id,
          description: node.title + (node.description ? ` - ${node.description}` : ''),
          quantity: parseFloat(node.hours_worked) || 1,
          unit_price: parseFloat(node.hourly_rate) || parseFloat(node.billing_amount) || 0,
          amount: parseFloat(node.billing_amount) || 0,
          activity_date: node.activity_date
        }, { transaction });

        lineItems.push(lineItem);

        // Mark timeline node as billed
        await node.update({ is_billed: true }, { transaction });
      }

      // Update dossier total_billed
      await this.updateDossierBilling(dossierId, transaction);

      await transaction.commit();

      return await this.getInvoiceById(invoice.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(invoiceId, data, userId) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Only allow updates to draft invoices
    if (invoice.status !== 'draft' && !['sent', 'overdue'].includes(invoice.status)) {
      throw new Error('Cannot update a paid or cancelled invoice');
    }

    const allowedUpdates = ['issue_date', 'due_date', 'tax_rate', 'notes', 'payment_terms', 'status'];
    const updateData = {};

    for (const key of allowedUpdates) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    // Recalculate tax if tax_rate changed
    if (data.tax_rate !== undefined) {
      const taxAmount = parseFloat(invoice.subtotal) * (parseFloat(data.tax_rate) / 100);
      updateData.tax_amount = taxAmount;
      updateData.total_amount = parseFloat(invoice.subtotal) + taxAmount;
    }

    await invoice.update(updateData);

    return await this.getInvoiceById(invoiceId);
  }

  /**
   * Send invoice (change status to sent)
   */
  async sendInvoice(invoiceId) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'draft') {
      throw new Error('Only draft invoices can be sent');
    }

    await invoice.update({ status: 'sent' });

    return await this.getInvoiceById(invoiceId);
  }

  /**
   * Cancel invoice and unbill timeline items
   */
  async cancelInvoice(invoiceId) {
    const transaction = await sequelize.transaction();

    try {
      const invoice = await Invoice.findByPk(invoiceId, {
        include: [{ model: InvoiceLineItem, as: 'lineItems' }]
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'paid') {
        throw new Error('Cannot cancel a paid invoice');
      }

      // Unbill timeline nodes
      for (const lineItem of invoice.lineItems) {
        if (lineItem.timeline_node_id) {
          await TimelineNode.update(
            { is_billed: false },
            { where: { id: lineItem.timeline_node_id }, transaction }
          );
        }
      }

      // Update invoice status
      await invoice.update({ status: 'cancelled' }, { transaction });

      // Update dossier billing
      await this.updateDossierBilling(invoice.dossier_id, transaction);

      await transaction.commit();

      return await this.getInvoiceById(invoiceId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Record a payment
   */
  async recordPayment(invoiceId, paymentData, userId) {
    const transaction = await sequelize.transaction();

    try {
      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'cancelled') {
        throw new Error('Cannot record payment for cancelled invoice');
      }

      const paymentAmount = parseFloat(paymentData.amount);
      if (paymentAmount <= 0) {
        throw new Error('Payment amount must be positive');
      }

      // Create payment record
      const payment = await Payment.create({
        invoice_id: invoiceId,
        amount: paymentAmount,
        payment_date: paymentData.payment_date || new Date(),
        payment_method: paymentData.payment_method || 'cash',
        reference_number: paymentData.reference_number || null,
        notes: paymentData.notes || null,
        recorded_by: userId
      }, { transaction });

      // Update invoice amount_paid and status
      const newAmountPaid = parseFloat(invoice.amount_paid) + paymentAmount;
      const balance = parseFloat(invoice.total_amount) - newAmountPaid;

      let newStatus = invoice.status;
      if (balance <= 0) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partial';
      }

      await invoice.update({
        amount_paid: newAmountPaid,
        status: newStatus
      }, { transaction });

      // Update dossier total_paid
      await this.updateDossierPaid(invoice.dossier_id, transaction);

      await transaction.commit();

      return await this.getInvoiceById(invoiceId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete a payment
   */
  async deletePayment(paymentId) {
    const transaction = await sequelize.transaction();

    try {
      const payment = await Payment.findByPk(paymentId, {
        include: [{ model: Invoice, as: 'invoice' }]
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      const invoice = payment.invoice;
      const paymentAmount = parseFloat(payment.amount);

      // Delete payment
      await payment.destroy({ transaction });

      // Update invoice
      const newAmountPaid = parseFloat(invoice.amount_paid) - paymentAmount;
      let newStatus = invoice.status;

      if (newAmountPaid <= 0) {
        newStatus = 'sent';
      } else if (newAmountPaid < parseFloat(invoice.total_amount)) {
        newStatus = 'partial';
      }

      await invoice.update({
        amount_paid: Math.max(0, newAmountPaid),
        status: newStatus
      }, { transaction });

      // Update dossier
      await this.updateDossierPaid(invoice.dossier_id, transaction);

      await transaction.commit();

      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update dossier total_billed from invoices
   */
  async updateDossierBilling(dossierId, transaction = null) {
    const invoices = await Invoice.findAll({
      where: {
        dossier_id: dossierId,
        status: { [Op.notIn]: ['cancelled', 'draft'] }
      },
      attributes: ['total_amount']
    });

    const totalBilled = invoices.reduce((sum, inv) => {
      return sum + parseFloat(inv.total_amount);
    }, 0);

    await Dossier.update(
      { total_billed: totalBilled },
      { where: { id: dossierId }, transaction }
    );
  }

  /**
   * Update dossier total_paid from payments
   */
  async updateDossierPaid(dossierId, transaction = null) {
    const invoices = await Invoice.findAll({
      where: {
        dossier_id: dossierId,
        status: { [Op.notIn]: ['cancelled'] }
      },
      attributes: ['amount_paid']
    });

    const totalPaid = invoices.reduce((sum, inv) => {
      return sum + parseFloat(inv.amount_paid);
    }, 0);

    await Dossier.update(
      { total_paid: totalPaid },
      { where: { id: dossierId }, transaction }
    );
  }

  /**
   * Get billing summary for a dossier
   */
  async getBillingSummary(dossierId) {
    const [invoices, unbilledNodes] = await Promise.all([
      Invoice.findAll({
        where: { dossier_id: dossierId },
        attributes: ['status', 'total_amount', 'amount_paid']
      }),
      this.getUnbilledItems(dossierId)
    ]);

    const summary = {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalUnbilled: 0,
      invoiceCount: {
        draft: 0,
        sent: 0,
        partial: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0
      }
    };

    invoices.forEach(inv => {
      summary.invoiceCount[inv.status] = (summary.invoiceCount[inv.status] || 0) + 1;
      
      if (inv.status !== 'cancelled') {
        summary.totalInvoiced += parseFloat(inv.total_amount);
        summary.totalPaid += parseFloat(inv.amount_paid);
      }
    });

    summary.totalOutstanding = summary.totalInvoiced - summary.totalPaid;

    summary.totalUnbilled = unbilledNodes.reduce((sum, node) => {
      return sum + (parseFloat(node.billing_amount) || 0);
    }, 0);

    return summary;
  }

  /**
   * Check for overdue invoices and update status
   */
  async updateOverdueInvoices() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Invoice.update(
      { status: 'overdue' },
      {
        where: {
          status: 'sent',
          due_date: { [Op.lt]: today }
        }
      }
    );
  }
}

module.exports = new BillingService();