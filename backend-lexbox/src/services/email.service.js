// ===================================================================
// EMAIL SERVICE
// ===================================================================
// src/services/email.service.js

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create transporter - configure with your SMTP settings
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.fromEmail = process.env.SMTP_FROM || 'noreply@lexbox.com';
    this.companyName = process.env.COMPANY_NAME || 'LexBox Legal Services';
  }

  /**
   * Send invoice email to client
   */
  async sendInvoiceEmail(invoice, client, pdfBuffer) {
    if (!client.email) {
      throw new Error('Client does not have an email address');
    }

    const clientName = `${client.first_name} ${client.last_name}`;
    const dueDate = new Date(invoice.due_date).toLocaleDateString();
    const totalAmount = parseFloat(invoice.total_amount).toFixed(2);

    const mailOptions = {
      from: `"${this.companyName}" <${this.fromEmail}>`,
      to: client.email,
      subject: `Invoice ${invoice.invoice_number} - ${this.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
            </div>
            <div class="content">
              <p>Dear ${clientName},</p>
              
              <p>Please find attached your invoice <strong>${invoice.invoice_number}</strong>.</p>
              
              <div class="invoice-details">
                <table style="width: 100%;">
                  <tr>
                    <td><strong>Invoice Number:</strong></td>
                    <td>${invoice.invoice_number}</td>
                  </tr>
                  <tr>
                    <td><strong>Issue Date:</strong></td>
                    <td>${new Date(invoice.issue_date).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Due Date:</strong></td>
                    <td>${dueDate}</td>
                  </tr>
                  <tr>
                    <td><strong>Amount Due:</strong></td>
                    <td class="amount">€${totalAmount}</td>
                  </tr>
                </table>
              </div>
              
              <p>${invoice.payment_terms || 'Payment is due within 30 days.'}</p>
              
              <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
              
              <p>Thank you for your business!</p>
              
              <p>Best regards,<br>${this.companyName}</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Invoice-${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const result = await this.transporter.sendMail(mailOptions);
    return result;
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(invoice, client, payment) {
    if (!client.email) {
      throw new Error('Client does not have an email address');
    }

    const clientName = `${client.first_name} ${client.last_name}`;
    const paymentAmount = parseFloat(payment.amount).toFixed(2);
    const balance = (parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid)).toFixed(2);

    const mailOptions = {
      from: `"${this.companyName}" <${this.fromEmail}>`,
      to: client.email,
      subject: `Payment Received - Invoice ${invoice.invoice_number}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #10b981; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received</h1>
            </div>
            <div class="content">
              <p>Dear ${clientName},</p>
              
              <p>Thank you! We have received your payment for invoice <strong>${invoice.invoice_number}</strong>.</p>
              
              <div class="payment-details">
                <table style="width: 100%;">
                  <tr>
                    <td><strong>Payment Amount:</strong></td>
                    <td class="amount">€${paymentAmount}</td>
                  </tr>
                  <tr>
                    <td><strong>Payment Date:</strong></td>
                    <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Payment Method:</strong></td>
                    <td>${payment.payment_method}</td>
                  </tr>
                  ${payment.reference_number ? `
                  <tr>
                    <td><strong>Reference:</strong></td>
                    <td>${payment.reference_number}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td><strong>Remaining Balance:</strong></td>
                    <td>€${balance}</td>
                  </tr>
                </table>
              </div>
              
              ${parseFloat(balance) <= 0 ? '<p><strong>This invoice is now fully paid. Thank you!</strong></p>' : ''}
              
              <p>Best regards,<br>${this.companyName}</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await this.transporter.sendMail(mailOptions);
    return result;
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();