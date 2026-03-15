// ===================================================================
// EMAIL SERVICE
// ===================================================================
// src/services/email.service.js

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.fromEmail = null;
    this.companyName = null;
    this.initialized = false;
  }

  /**
   * Initialize or refresh email configuration from settings
   */
  async refreshConfig() {
    try {
      const settingsService = require('./settings.service');
      
      const host = await settingsService.get('smtp_host', 'smtp.gmail.com');
      const port = await settingsService.get('smtp_port', 587);
      const secure = await settingsService.get('smtp_secure', false);
      const user = await settingsService.get('smtp_user', '');
      const pass = await settingsService.get('smtp_pass', '');
      
      this.fromEmail = await settingsService.get('smtp_from', 'noreply@lexbox.com');
      this.companyName = await settingsService.get('company_name', 'LexBox Legal Services');

      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: secure === true || secure === 'true',
        auth: {
          user,
          pass
        }
      });

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing email service:', error);
      // Fallback to env variables
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
      this.initialized = true;
      return false;
    }
  }

  /**
   * Ensure service is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.refreshConfig();
    }
  }

  /**
   * Send invoice email to client
   */
  async sendInvoiceEmail(invoice, client, pdfBuffer) {
    await this.ensureInitialized();

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
   * Send test email
   */
  async sendTestEmail(toEmail) {
    await this.refreshConfig(); // Always refresh for test

    const mailOptions = {
      from: `"${this.companyName}" <${this.fromEmail}>`,
      to: toEmail,
      subject: `Test Email - ${this.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">Email Configuration Test</h2>
          <p>This is a test email from <strong>${this.companyName}</strong>.</p>
          <p>If you received this email, your email settings are configured correctly!</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Sent from LexBox</p>
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
    await this.ensureInitialized();
    
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
