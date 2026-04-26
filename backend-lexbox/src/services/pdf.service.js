// ===================================================================
// PDF SERVICE - Invoice Generation
// ===================================================================
// src/services/pdf.service.js

const PDFDocument = require('pdfkit');

class PDFService {
  constructor() {
    this.initialized = false;
    this.companyName = 'LexBox Legal Services';
    this.companyAddress = '';
    this.companyPhone = '';
    this.companyEmail = '';
    this.currencySymbol = '€';
  }

  /**
   * Load settings from database
   */
  async loadSettings() {
    try {
      const settingsService = require('./settings.service');
      
      this.companyName = await settingsService.get('company_name', 'LexBox Legal Services');
      this.companyAddress = await settingsService.get('company_address', '');
      this.companyPhone = await settingsService.get('company_phone', '');
      this.companyEmail = await settingsService.get('company_email', '');
      this.currencySymbol = await settingsService.get('currency_symbol', '€');
      
      this.initialized = true;
    } catch (error) {
      console.error('Error loading PDF settings:', error);
      // Fallback to env
      this.companyName = process.env.COMPANY_NAME || 'LexBox Legal Services';
      this.companyAddress = process.env.COMPANY_ADDRESS || '';
      this.companyPhone = process.env.COMPANY_PHONE || '';
      this.companyEmail = process.env.COMPANY_EMAIL || '';
      this.currencySymbol = '€';
      this.initialized = true;
    }
  }

  /**
   * Ensure settings are loaded
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.loadSettings();
    }
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(invoice, client, lineItems) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Generate PDF content
        this._generateHeader(doc);
        this._generateClientInfo(doc, client, invoice);
        this._generateInvoiceTable(doc, lineItems);
        this._generateTotals(doc, invoice);
        this._generateFooter(doc, invoice);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate PDF header with company info
   */
  _generateHeader(doc) {
    doc
      .fillColor('#2563eb')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(this.companyName, 40, 40);

    let y = 65;
    doc.fillColor('#666').fontSize(9).font('Helvetica');
    if (this.companyAddress) { doc.text(this.companyAddress, 40, y); y += 13; }
    if (this.companyPhone)   { doc.text(`Phone: ${this.companyPhone}`, 40, y); y += 13; }
    if (this.companyEmail)   { doc.text(`Email: ${this.companyEmail}`, 40, y); }

    doc
      .fillColor('#333')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('INVOICE', 390, 40, { align: 'right', width: 170 });

    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(40, 118)
      .lineTo(560, 118)
      .stroke();
  }

  /**
   * Generate client info and invoice details
   */
  _generateClientInfo(doc, client, invoice) {
    const startY = 132;
    let currentY = startY;

    doc.fillColor('#666').fontSize(9).font('Helvetica-Bold').text('BILL TO:', 40, currentY);
    currentY += 13;

    doc.fillColor('#333').fontSize(10).font('Helvetica-Bold')
      .text(`${client.first_name} ${client.last_name}`, 40, currentY);
    currentY += 13;

    doc.font('Helvetica').fontSize(9).fillColor('#555');
    if (client.address) {
      client.address.split('\n').forEach(line => {
        doc.text(line.trim(), 40, currentY); currentY += 11;
      });
    }
    if (client.email) { doc.text(client.email, 40, currentY); currentY += 11; }
    if (client.phone) { doc.text(client.phone, 40, currentY); }

    // Invoice meta — right column
    const statusColors = {
      draft: '#6b7280', sent: '#2563eb', partial: '#f59e0b',
      paid: '#10b981',  overdue: '#ef4444', cancelled: '#ef4444'
    };
    const dx = 350; const row = 18;
    doc.fillColor('#666').fontSize(9).font('Helvetica')
      .text('Invoice Number:', dx, startY,         { width: 105 })
      .text('Issue Date:',     dx, startY + row,    { width: 105 })
      .text('Due Date:',       dx, startY + row*2,  { width: 105 })
      .text('Status:',         dx, startY + row*3,  { width: 105 });
    doc.fillColor('#333').fontSize(9).font('Helvetica-Bold')
      .text(invoice.invoice_number,                            dx + 105, startY,        { width: 105, align: 'right' })
      .text(new Date(invoice.issue_date).toLocaleDateString(), dx + 105, startY + row,  { width: 105, align: 'right' })
      .text(new Date(invoice.due_date).toLocaleDateString(),   dx + 105, startY + row*2,{ width: 105, align: 'right' });
    doc.fillColor(statusColors[invoice.status] || '#333')
      .text(invoice.status.toUpperCase(), dx + 105, startY + row*3, { width: 105, align: 'right' });
  }

  /**
   * Generate invoice line items table
   */
  _generateInvoiceTable(doc, lineItems) {
    const tableTop = 242;
    const ROW_H = 20;
    const columnWidths = [215, 78, 48, 72, 82];
    const columnX     = [40, 255, 333, 381, 453];
    const tableW      = 520;

    // Header background
    doc.fillColor('#f3f4f6').rect(40, tableTop, tableW, 22).fill();

    doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold');
    ['Description', 'Date', 'Qty', 'Rate', 'Amount'].forEach((h, i) => {
      doc.text(h, columnX[i], tableTop + 7, { width: columnWidths[i], align: i >= 2 ? 'right' : 'left' });
    });

    let y = tableTop + 28;
    doc.font('Helvetica').fontSize(8.5).fillColor('#333');

    lineItems.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.fillColor('#f9fafb').rect(40, y - 3, tableW, ROW_H).fill();
      }
      doc.fillColor('#333');

      const desc = item.description.length > 42
        ? item.description.substring(0, 42) + '…'
        : item.description;
      const dateStr = item.activity_date
        ? new Date(item.activity_date).toLocaleDateString()
        : '—';

      doc.text(desc,    columnX[0], y, { width: columnWidths[0] });
      doc.text(dateStr, columnX[1], y, { width: columnWidths[1] });
      doc.text(String(item.quantity),                                        columnX[2], y, { width: columnWidths[2], align: 'right' });
      doc.text(`${this.currencySymbol}${parseFloat(item.unit_price).toFixed(2)}`, columnX[3], y, { width: columnWidths[3], align: 'right' });
      doc.text(`${this.currencySymbol}${parseFloat(item.amount).toFixed(2)}`,     columnX[4], y, { width: columnWidths[4], align: 'right' });

      y += ROW_H;
    });

    doc._tableEndY = y + 8;
  }

  /**
   * Generate totals section
   */
  _generateTotals(doc, invoice) {
    const startY = doc._tableEndY || 400;
    const labelX = 370;
    const valueX = 455;
    const width  = 105;

    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(340, startY).lineTo(560, startY).stroke();

    let y = startY + 12;

    doc.fillColor('#666').fontSize(9).font('Helvetica')
      .text('Subtotal:', labelX, y, { width: 80, align: 'right' });
    doc.fillColor('#333')
      .text(`${this.currencySymbol}${parseFloat(invoice.subtotal).toFixed(2)}`, valueX, y, { width, align: 'right' });
    y += 17;

    if (parseFloat(invoice.tax_rate) > 0) {
      doc.fillColor('#666')
        .text(`Tax (${invoice.tax_rate}%):`, labelX, y, { width: 80, align: 'right' });
      doc.fillColor('#333')
        .text(`${this.currencySymbol}${parseFloat(invoice.tax_amount).toFixed(2)}`, valueX, y, { width, align: 'right' });
      y += 17;
    }

    doc.strokeColor('#2563eb').lineWidth(2).moveTo(370, y).lineTo(560, y).stroke();
    y += 9;

    doc.fillColor('#2563eb').fontSize(12).font('Helvetica-Bold')
      .text('TOTAL:', labelX, y, { width: 80, align: 'right' });
    doc.text(`${this.currencySymbol}${parseFloat(invoice.total_amount).toFixed(2)}`, valueX, y, { width, align: 'right' });
    y += 20;

    if (parseFloat(invoice.amount_paid) > 0) {
      doc.fillColor('#10b981').fontSize(9).font('Helvetica')
        .text('Amount Paid:', labelX, y, { width: 80, align: 'right' });
      doc.text(`${this.currencySymbol}${parseFloat(invoice.amount_paid).toFixed(2)}`, valueX, y, { width, align: 'right' });
      y += 17;

      const balance = parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid);
      doc.fillColor(balance > 0 ? '#ef4444' : '#10b981').fontSize(11).font('Helvetica-Bold')
        .text('Balance Due:', labelX, y, { width: 80, align: 'right' });
      doc.text(`${this.currencySymbol}${balance.toFixed(2)}`, valueX, y, { width, align: 'right' });
      y += 17;
    }

    doc._totalsEndY = y;
  }

  /**
   * Generate subscription invoice PDF (org billing)
   */
  async generateSubscriptionInvoicePDF(inv, org) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // ── Header ──
        doc.fillColor('#2563eb').fontSize(24).font('Helvetica-Bold').text(this.companyName, 50, 50);
        let y = 80;
        doc.fillColor('#666').fontSize(10).font('Helvetica');
        if (this.companyAddress) { doc.text(this.companyAddress, 50, y); y += 15; }
        if (this.companyPhone)   { doc.text(`Phone: ${this.companyPhone}`, 50, y); y += 15; }
        if (this.companyEmail)   { doc.text(`Email: ${this.companyEmail}`, 50, y); }
        doc.fillColor('#333').fontSize(28).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
        doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 140).lineTo(550, 140).stroke();

        // ── Bill To ──
        const startY = 160;
        doc.fillColor('#666').fontSize(10).font('Helvetica-Bold').text('BILL TO:', 50, startY);
        doc.fillColor('#333').fontSize(11).font('Helvetica').text(org.name, 50, startY + 15);
        let addrY = startY + 30;
        if (org.address) { doc.text(org.address, 50, addrY); addrY += 15; }
        if (org.email)   { doc.text(org.email, 50, addrY); addrY += 15; }
        if (org.phone)   { doc.text(org.phone, 50, addrY); }
        if (org.tax_id)  { doc.text(`Tax ID: ${org.tax_id}`, 50, addrY + 15); }

        // ── Invoice meta (right side) ──
        const dx = 350;
        doc.fillColor('#666').fontSize(10).font('Helvetica')
          .text('Invoice Number:', dx, startY,      { width: 100 })
          .text('Issue Date:',     dx, startY + 20, { width: 100 })
          .text('Due Date:',       dx, startY + 40, { width: 100 })
          .text('Period:',         dx, startY + 60, { width: 100 })
          .text('Status:',         dx, startY + 80, { width: 100 });
        const statusColors = { draft: '#6b7280', sent: '#2563eb', paid: '#10b981' };
        doc.fillColor('#333').fontSize(10).font('Helvetica-Bold')
          .text(inv.invoice_number,                              dx + 100, startY,      { width: 100, align: 'right' })
          .text(new Date(inv.issue_date).toLocaleDateString(),   dx + 100, startY + 20, { width: 100, align: 'right' })
          .text(new Date(inv.due_date).toLocaleDateString(),     dx + 100, startY + 40, { width: 100, align: 'right' })
          .text(`${new Date(inv.period_start).toLocaleDateString()} – ${new Date(inv.period_end).toLocaleDateString()}`, dx + 100, startY + 60, { width: 100, align: 'right' });
        doc.fillColor(statusColors[inv.status] || '#333')
          .text(inv.status.toUpperCase(), dx + 100, startY + 80, { width: 100, align: 'right' });

        // ── Line items table ──
        const tableTop = 295;
        doc.fillColor('#f3f4f6').rect(50, tableTop, 500, 25).fill();
        doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold')
          .text('Description',  50,  tableTop + 8, { width: 320 })
          .text('Cycle',        370, tableTop + 8, { width: 80 })
          .text('Amount',       450, tableTop + 8, { width: 100, align: 'right' });

        const rowY = tableTop + 35;
        doc.fillColor('#f9fafb').rect(50, rowY - 5, 500, 25).fill();
        doc.fillColor('#333').fontSize(10).font('Helvetica')
          .text(`${inv.plan_name} Subscription`, 50, rowY, { width: 320 })
          .text(inv.billing_cycle === 'yearly' ? 'Annual' : 'Monthly', 370, rowY, { width: 80 })
          .text(`${this.currencySymbol}${parseFloat(inv.subtotal).toFixed(2)}`, 450, rowY, { width: 100, align: 'right' });

        // ── Totals ──
        const totY = rowY + 40;
        doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(350, totY).lineTo(550, totY).stroke();
        let ty = totY + 15;
        doc.fillColor('#666').fontSize(10).font('Helvetica')
          .text('Subtotal:', 380, ty, { width: 80, align: 'right' });
        doc.fillColor('#333').text(`${this.currencySymbol}${parseFloat(inv.subtotal).toFixed(2)}`, 460, ty, { width: 90, align: 'right' });
        ty += 20;
        if (parseFloat(inv.tax_rate) > 0) {
          doc.fillColor('#666').text(`Tax (${inv.tax_rate}%):`, 380, ty, { width: 80, align: 'right' });
          doc.fillColor('#333').text(`${this.currencySymbol}${parseFloat(inv.tax_amount).toFixed(2)}`, 460, ty, { width: 90, align: 'right' });
          ty += 20;
        }
        doc.strokeColor('#2563eb').lineWidth(2).moveTo(380, ty).lineTo(550, ty).stroke();
        ty += 10;
        doc.fillColor('#2563eb').fontSize(14).font('Helvetica-Bold')
          .text('TOTAL:', 380, ty, { width: 80, align: 'right' })
          .text(`${this.currencySymbol}${parseFloat(inv.total_amount).toFixed(2)}`, 460, ty, { width: 90, align: 'right' });

        // ── Footer ──
        let footerY = ty + 28;
        if (inv.payment_terms) {
          doc.fillColor('#666').fontSize(8.5).font('Helvetica-Bold').text('Payment Terms:', 40, footerY);
          footerY += 11;
          doc.font('Helvetica').fillColor('#555').text(inv.payment_terms, 40, footerY, { width: 520 });
          footerY += 22;
        }
        if (inv.notes) {
          doc.fillColor('#666').fontSize(8.5).font('Helvetica-Bold').text('Notes:', 40, footerY);
          footerY += 11;
          doc.font('Helvetica').fillColor('#555').text(inv.notes, 40, footerY, { width: 520 });
          footerY += 22;
        }
        footerY += 8;
        doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, footerY).lineTo(560, footerY).stroke();
        doc.fillColor('#888').fontSize(9).font('Helvetica')
          .text('Thank you for your collaboration!', 40, footerY + 10, { align: 'center', width: 520 });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate footer — flows dynamically after totals
   */
  _generateFooter(doc, invoice) {
    let y = (doc._totalsEndY || doc._tableEndY || 500) + 22;

    if (invoice.payment_terms) {
      doc.fillColor('#666').fontSize(8.5).font('Helvetica-Bold').text('Payment Terms:', 40, y);
      y += 11;
      doc.font('Helvetica').fillColor('#555').text(invoice.payment_terms, 40, y, { width: 520 });
      y += 11 + Math.ceil(invoice.payment_terms.length / 90) * 11;
    }

    if (invoice.notes) {
      doc.fillColor('#666').fontSize(8.5).font('Helvetica-Bold').text('Notes:', 40, y);
      y += 11;
      doc.font('Helvetica').fillColor('#555').text(invoice.notes, 40, y, { width: 520 });
      y += 11 + Math.ceil(invoice.notes.length / 90) * 11;
    }

    y += 10;
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, y).lineTo(560, y).stroke();
    y += 10;
    doc.fillColor('#888').fontSize(9).font('Helvetica')
      .text('Thank you for your collaboration!', 40, y, { align: 'center', width: 520 });
  }
}

module.exports = new PDFService();