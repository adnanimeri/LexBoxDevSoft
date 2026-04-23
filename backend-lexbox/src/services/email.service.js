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
   * Build transporter from environment variables (platform-level SMTP).
   * Called once on first use; transporter is reused across sends.
   */
  _buildTransporter() {
    const host     = process.env.SMTP_HOST;
    const portNum  = parseInt(process.env.SMTP_PORT || '587', 10);
    const isSecure = process.env.SMTP_SECURE === 'true';
    const user     = process.env.SMTP_USER;
    const pass     = process.env.SMTP_PASS;

    this.fromEmail   = process.env.SMTP_FROM || user;
    this.companyName = process.env.COMPANY_NAME || 'LexBox Legal Services';

    console.log(`[EmailService] SMTP: host=${host} port=${portNum} secure=${isSecure} user=${user}`);

    if (!host || !user || !pass) {
      throw new Error(`SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in .env`);
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: portNum,
      secure: isSecure,       // true → direct TLS (port 465); false → STARTTLS (port 587)
      requireTLS: !isSecure,  // enforce STARTTLS upgrade on port 587
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    this.initialized = true;
  }

  /**
   * Ensure transporter is ready
   */
  ensureInitialized() {
    if (!this.initialized) {
      this._buildTransporter();
    }
  }

  /**
   * @deprecated kept for backward compat with settings controller test-email
   */
  async refreshConfig() {
    this._buildTransporter();
  }

  /**
   * Send invoice email to client
   */
  async sendInvoiceEmail(invoice, client, pdfBuffer) {
    this.ensureInitialized();

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
   * Send welcome email with credentials to newly approved org admin
   */
  async sendWelcomeEmail({ toEmail, firstName, lastName, orgName, planName, tempPassword, loginUrl }) {
    this.ensureInitialized();

    const mailOptions = {
      from: `"${this.companyName}" <${this.fromEmail}>`,
      to: toEmail,
      subject: `Welcome to LexBox — Your account is ready`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 24px; background: #f9fafb; }
            .credentials { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .cred-row { display: table; width: 100%; padding: 6px 0; border-bottom: 1px solid #f3f4f6; border-collapse: collapse; }
            .label { display: table-cell; color: #6b7280; font-size: 14px; width: 40%; padding-right: 12px; }
            .value { display: table-cell; font-weight: bold; font-size: 14px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0; }
            .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;">Welcome to LexBox!</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              <p>Your law firm <strong>${orgName}</strong> has been approved${planName ? ` on the <strong>${planName}</strong> plan` : ''}. Your 14-day free trial starts today.</p>

              <div class="credentials">
                <p style="margin:0 0 12px;font-weight:bold;color:#111827;">Your login credentials</p>
                <div class="cred-row">
                  <span class="label">Email:</span>
                  <span class="value">${toEmail}</span>
                </div>
                <div class="cred-row" style="border-bottom:none;">
                  <span class="label">Temporary password: <span style="font-family:monospace;letter-spacing:1px;font-weight:bold;">${tempPassword}</span></span>
                </div>
              </div>

              <p style="color:#dc2626;font-size:13px;">⚠️ Please change your password immediately after logging in.</p>

              ${loginUrl ? `<div style="text-align:center;"><a href="${loginUrl}" class="btn">Sign in to LexBox →</a></div>` : ''}

              <p>If you have any questions, reply to this email and our team will help you get started.</p>
              <p>Best regards,<br>The LexBox Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Do not reply directly to this email.</p>
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
   * Send test email
   */
  async sendTestEmail(toEmail) {
    this.refreshConfig(); // Always refresh for test

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
   * Send subscription invoice PDF to org contact email
   */
  async sendSubscriptionInvoiceEmail(inv, org, pdfBuffer) {
    this.ensureInitialized();

    const period = `${new Date(inv.period_start).toLocaleDateString()} – ${new Date(inv.period_end).toLocaleDateString()}`;
    const total  = parseFloat(inv.total_amount).toFixed(2);
    const cycle  = inv.billing_cycle === 'yearly' ? 'Annual' : 'Monthly';

    const mailOptions = {
      from: `"${this.companyName}" <${this.fromEmail}>`,
      to: org.email,
      subject: `Invoice ${inv.invoice_number} — ${inv.plan_name} ${cycle} Subscription`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { padding: 24px; background: #f9fafb; }
            .box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 16px 0; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
            .label { color: #6b7280; }
            .footer { text-align: center; padding: 16px; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0;">Subscription Invoice</h2>
              <p style="margin:4px 0 0;opacity:.85;">${org.name}</p>
            </div>
            <div class="content">
              <p>Dear ${org.name} team,</p>
              <p>Please find attached your subscription invoice for the period <strong>${period}</strong>.</p>
              <div class="box">
                <div class="row"><span class="label">Invoice #</span><strong>${inv.invoice_number}</strong></div>
                <div class="row"><span class="label">Plan</span><strong>${inv.plan_name} (${cycle})</strong></div>
                <div class="row"><span class="label">Period</span><strong>${period}</strong></div>
                <div class="row"><span class="label">Due Date</span><strong>${new Date(inv.due_date).toLocaleDateString()}</strong></div>
                <div class="row" style="border:0;padding-top:12px;"><span class="label">Total Due</span><strong style="color:#2563eb;font-size:18px;">€${total}</strong></div>
              </div>
              <p>${inv.payment_terms || 'Payment is due within 30 days.'}</p>
              <p>If you have any questions, please contact us.</p>
              <p>Best regards,<br>${this.companyName}</p>
            </div>
            <div class="footer">This is an automated invoice email from LexBox.</div>
          </div>
        </body>
        </html>
      `,
      attachments: [{
        filename: `Invoice-${inv.invoice_number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    return this.transporter.sendMail(mailOptions);
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    this.ensureInitialized();
    
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
