// ===================================================================
// MODEL ASSOCIATIONS — Multi-Tenant
// ===================================================================

const Organization = require('./Organization');
const OrganizationRequest = require('./OrganizationRequest');
const SubscriptionPlan = require('./SubscriptionPlan');
const User = require('./User');
const Client = require('./Client');
const Dossier = require('./Dossier');
const TimelineNode = require('./TimelineNode');
const Document = require('./Document');
const Invoice = require('./Invoice');
const InvoiceLineItem = require('./InvoiceLineItem');
const Payment = require('./Payment');
const Settings = require('./Settings');
const SubscriptionInvoice = require('./SubscriptionInvoice');
const CalendarEvent = require('./CalendarEvent');
const DocumentTemplate = require('./DocumentTemplate');

// ===================================================================
// ORGANIZATION ASSOCIATIONS
// ===================================================================

// Organization <-> SubscriptionPlan
Organization.belongsTo(SubscriptionPlan, {
  foreignKey: 'subscription_plan_id',
  as: 'subscriptionPlan'
});
SubscriptionPlan.hasMany(Organization, {
  foreignKey: 'subscription_plan_id',
  as: 'organizations'
});

// Organization <-> User (members)
Organization.hasMany(User, {
  foreignKey: 'organization_id',
  as: 'users'
});
User.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// Organization <-> Client
Organization.hasMany(Client, {
  foreignKey: 'organization_id',
  as: 'clients'
});
Client.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// Organization <-> Dossier
Organization.hasMany(Dossier, {
  foreignKey: 'organization_id',
  as: 'dossiers'
});
Dossier.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// Organization <-> Document
Organization.hasMany(Document, {
  foreignKey: 'organization_id',
  as: 'documents'
});
Document.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// Organization <-> Invoice
Organization.hasMany(Invoice, {
  foreignKey: 'organization_id',
  as: 'invoices'
});
Invoice.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// Organization <-> SubscriptionInvoice
Organization.hasMany(SubscriptionInvoice, {
  foreignKey: 'organization_id',
  as: 'subscriptionInvoices'
});
SubscriptionInvoice.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// User <-> SubscriptionInvoice
User.hasMany(SubscriptionInvoice, {
  foreignKey: 'created_by',
  as: 'created_subscription_invoices'
});
SubscriptionInvoice.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// OrganizationRequest <-> Organization (approved request → created org)
OrganizationRequest.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'createdOrganization'
});

// OrganizationRequest <-> User (reviewed_by super admin)
OrganizationRequest.belongsTo(User, {
  foreignKey: 'reviewed_by',
  as: 'reviewer'
});

// ===================================================================
// CLIENT ASSOCIATIONS
// ===================================================================

Client.hasMany(Dossier, {
  foreignKey: 'client_id',
  as: 'dossiers'
});
Dossier.belongsTo(Client, {
  foreignKey: 'client_id',
  as: 'client'
});

// ===================================================================
// DOSSIER ASSOCIATIONS
// ===================================================================

Dossier.hasMany(TimelineNode, {
  foreignKey: 'dossier_id',
  as: 'timelineNodes'
});
TimelineNode.belongsTo(Dossier, {
  foreignKey: 'dossier_id',
  as: 'dossier'
});

Dossier.hasMany(Document, {
  foreignKey: 'dossier_id',
  as: 'documents'
});
Document.belongsTo(Dossier, {
  foreignKey: 'dossier_id',
  as: 'dossier'
});

Dossier.hasMany(Invoice, {
  foreignKey: 'dossier_id',
  as: 'invoices'
});
Invoice.belongsTo(Dossier, {
  foreignKey: 'dossier_id',
  as: 'dossier'
});

// ===================================================================
// DOCUMENT & TIMELINE ASSOCIATIONS
// ===================================================================

Document.hasMany(TimelineNode, {
  foreignKey: 'document_id',
  as: 'timelineNodes'
});
TimelineNode.belongsTo(Document, {
  foreignKey: 'document_id',
  as: 'document'
});

// ===================================================================
// INVOICE ASSOCIATIONS
// ===================================================================

Invoice.hasMany(InvoiceLineItem, {
  foreignKey: 'invoice_id',
  as: 'lineItems',
  onDelete: 'CASCADE'
});
InvoiceLineItem.belongsTo(Invoice, {
  foreignKey: 'invoice_id',
  as: 'invoice'
});

Invoice.hasMany(Payment, {
  foreignKey: 'invoice_id',
  as: 'payments',
  onDelete: 'CASCADE'
});
Payment.belongsTo(Invoice, {
  foreignKey: 'invoice_id',
  as: 'invoice'
});

TimelineNode.hasOne(InvoiceLineItem, {
  foreignKey: 'timeline_node_id',
  as: 'invoiceLineItem'
});
InvoiceLineItem.belongsTo(TimelineNode, {
  foreignKey: 'timeline_node_id',
  as: 'timelineNode'
});

// ===================================================================
// USER ASSOCIATIONS
// ===================================================================

User.hasMany(Document, {
  foreignKey: 'uploaded_by',
  as: 'uploaded_documents'
});
Document.belongsTo(User, {
  foreignKey: 'uploaded_by',
  as: 'uploader'
});

User.hasMany(Dossier, {
  foreignKey: 'assigned_to',
  as: 'assigned_dossiers'
});
Dossier.belongsTo(User, {
  foreignKey: 'assigned_to',
  as: 'assignedLawyer'
});

User.hasMany(Client, {
  foreignKey: 'created_by',
  as: 'created_clients'
});
Client.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(Client, {
  foreignKey: 'updated_by',
  as: 'updated_clients'
});
Client.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

User.hasMany(Dossier, {
  foreignKey: 'created_by',
  as: 'created_dossiers'
});
Dossier.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'dossierCreator'
});

User.hasMany(TimelineNode, {
  foreignKey: 'created_by',
  as: 'created_timeline_nodes'
});
TimelineNode.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(TimelineNode, {
  foreignKey: 'updated_by',
  as: 'updated_timeline_nodes'
});
TimelineNode.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

User.hasMany(Invoice, {
  foreignKey: 'created_by',
  as: 'created_invoices'
});
Invoice.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(Payment, {
  foreignKey: 'recorded_by',
  as: 'recorded_payments'
});
Payment.belongsTo(User, {
  foreignKey: 'recorded_by',
  as: 'recorder'
});

// ===================================================================
// CALENDAR EVENT ASSOCIATIONS
// ===================================================================

Organization.hasMany(CalendarEvent, { foreignKey: 'organization_id', as: 'calendarEvents' });
CalendarEvent.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

CalendarEvent.belongsTo(Dossier, { foreignKey: 'dossier_id', as: 'eventDossier' });
Dossier.hasMany(CalendarEvent, { foreignKey: 'dossier_id', as: 'calendarEvents' });

CalendarEvent.belongsTo(Client, { foreignKey: 'client_id', as: 'eventClient' });
Client.hasMany(CalendarEvent, { foreignKey: 'client_id', as: 'calendarEvents' });

CalendarEvent.belongsTo(User, { foreignKey: 'created_by', as: 'eventCreator' });
User.hasMany(CalendarEvent, { foreignKey: 'created_by', as: 'created_calendar_events' });

// ===================================================================
// DOCUMENT TEMPLATE ASSOCIATIONS
// ===================================================================

Organization.hasMany(DocumentTemplate, { foreignKey: 'organization_id', as: 'documentTemplates' });
DocumentTemplate.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

User.hasMany(DocumentTemplate, { foreignKey: 'created_by', as: 'created_templates' });
DocumentTemplate.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = {
  Organization,
  OrganizationRequest,
  SubscriptionPlan,
  User,
  Client,
  Dossier,
  TimelineNode,
  Document,
  DocumentTemplate,
  Invoice,
  InvoiceLineItem,
  Payment,
  Settings,
  SubscriptionInvoice,
  CalendarEvent
};
