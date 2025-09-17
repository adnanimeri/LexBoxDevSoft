# LexBox Software Specification

## 1. System Overview

**Product Name:** LexBox  
**Product Type:** Web-based Legal Document Management System  
**Target Users:** Lawyers, Legal Secretaries, Law Firm Administrators  
**Platform:** Web Application (Browser-based)

### 1.1 Purpose
LexBox is a comprehensive legal document management application designed to help lawyers and law firms manage client dossiers, track case timelines, handle document storage, and manage billing throughout the legal process lifecycle.

### 1.2 Key Features
- Client registration and dossier management
- Timeline-based case tracking
- Document upload and physical storage tracking
- Legal issue categorization
- Activity logging and billing
- Role-based access control
- Mobile-responsive web interface

## 2. Functional Requirements

### 2.1 Client Registration and Management

#### 2.1.1 Initial Client Registration
- **Input Fields:**
  - Client personal name & personal number (required)
  - Contact information (phone, email, address)
  - Registration date (auto-generated)
  - Notes field
- **Process:**
  - Creates new client record without dossier number
  - Generates unique internal client ID
  - Initializes empty/genesis node timeline for client dossier
  - Records first timeline node: "Client Registration"
  - Client is searchable via personal number (unique field)
  - Allow document upload if client has already some documents

#### 2.1.2 Dossier Number Assignment
- **Trigger:** When client receives official dossier number (numrin e landes)
- **Process:**
  - Update existing client record with dossier number
  - Create second timeline node: "Dossier Number Assigned"
  - Enable document upload functionality
  - Enable physical tray assignment

### 2.2 Document Management

#### 2.2.1 Document Upload
- **Supported Formats:** PDF, DOC, DOCX, JPG, PNG, TIFF
- **Maximum File Size:** 50MB per file
- **Features:**
  - Drag-and-drop interface
  - Batch upload capability
  - Document categorization
  - Version control
  - Document preview

#### 2.2.2 Physical Document Tracking
- **Tray Assignment:**
  - Alphanumeric tray identification system
  - Physical location mapping
  - Document-to-tray relationship tracking
- **Search Capability:**
  - Find documents by tray number
  - Find tray by document name
  - Find document by personal number
  - Find document by dossier number

### 2.3 Legal Issue Classification

#### 2.3.1 Legal Categories
- **Predefined Categories:**
  - Penal Law
  - Supreme Court
  - Appeal Court
  - Civil Law
  - Administrative Law
  - Commercial Law
  - Family Law
  - Custom categories (admin-configurable)

#### 2.3.2 Classification Process
- Lawyer selects appropriate legal issue type
- Creates timeline node: "Legal Issue Determined"
- Associates category with entire dossier
- Enables category-specific workflow templates

### 2.4 Timeline Management System

#### 2.4.1 Timeline Structure
- **Chronological Node-based System**
- **Node Types:**
  1. **Registration Node** (Green) - Initial client registration
  2. **Dossier Assignment Node** (Blue) - Official dossier number received
  3. **Legal Classification Node** (Purple) - Legal issue type determined
  4. **Activity Node** (Orange) - Work performed for client
  5. **Document Node** (Yellow) - Documents uploaded/received
  6. **Process Node** (Red) - Court processes, hearings, etc.
  7. **Billing Node** (Dark Blue) - Invoice/payment activities

#### 2.4.2 Node Properties
- **Common Properties:**
  - Timestamp
  - Node type
  - Description
  - Created by (user)
  - Status (Active, Completed, Pending)
- **Activity-Specific Properties:**
  - Work description
  - Time spent (hours) (not mondatory)
  - Associated documents
  - Billing amount
  - Required/pending documents list
  - Process type and status

#### 2.4.3 Timeline Visualization
- **Interactive Timeline Dashboard**
- **Color-coded nodes** for quick identification
- **Expandable node details**
- **Filter options** by date range, activity type, status
- **Export functionality** (PDF timeline report)

### 2.5 Billing and Invoice Management

#### 2.5.1 Per-Node Billing
- **Billing Association:** Each timeline node can have associated charges
- **Amount Range:** €0 to unlimited
- **Billing Types:**
  - Hourly rate billing
  - Fixed fee billing
  - Expense reimbursement
  - Court fees
- **Invoice Generation:**
  - Automatic invoice creation
  - Custom invoice templates
  - PDF export capability

#### 2.5.2 Financial Tracking
- **Client Balance Tracking**
- **Payment Status Monitoring**
- **Outstanding Invoices Dashboard**
- **Financial Reports** (admin only)

### 2.6 Search and Access Features

#### 2.6.1 Global Search
- **Search Scope:**
  - Client names
  - Dossier numbers
  - Document names
  - Timeline activities
  - Legal issue types
- **Advanced Filters:**
  - Date ranges
  - Legal categories
  - Client status
  - Billing status

#### 2.6.2 Mobile Access
- **Responsive Web Design**
- **Mobile-optimized Timeline View**
- **Quick Client Lookup**
- **Document Preview on Mobile**
- **Offline Mode** (limited functionality)

## 3. User Roles and Permissions

### 3.1 Administrator Role
**Full System Access**
- **User Management:**
  - Create, edit, delete user accounts
  - Assign roles and permissions
  - Create custom roles
- **System Configuration:**
  - Customize legal issue categories
  - Configure billing rates
  - System settings and preferences
- **Financial Access:**
  - View all billing information
  - Generate financial reports
  - Access payment details
- **Data Management:**
  - Export system data
  - Backup and restore
  - System analytics

### 3.2 Lawyer Role
**Full Client and Case Management**
- **Client Management:**
  - Register new clients
  - Update client information
  - Access all client dossiers
- **Timeline Management:**
  - Create and edit timeline nodes
  - Upload documents
  - Set billing amounts
- **Limited Financial Access:**
  - View own billing activities
  - Generate client invoices
  - Cannot access financial summaries

### 3.3 Secretary/Access User Role
**Limited Access**
- **Client Management:**
  - Register new clients
  - Update basic client information
  - View client dossiers
- **Document Management:**
  - Upload documents
  - Organize physical documents
- **Restricted Access:**
  - Cannot view billing information
  - Cannot set invoice amounts
  - Cannot access financial reports
  - Cannot delete timeline nodes

### 3.4 Custom Roles
- **Admin-Configurable Permissions**
- **Granular Access Control**
- **Role Templates for Different Law Firm Structures**

## 4. Technical Requirements

### 4.1 Architecture
- **Type:** Web Application (SPA - Single Page Application)
- **Frontend:** React.js or Vue.js with responsive design
- **Backend:** Node.js with Express.js or Python Django/Flask
- **Database:** PostgreSQL or MySQL for structured data
- **File Storage:** Cloud storage (AWS S3, Google Cloud) for documents
- **Authentication:** JWT-based authentication system

### 4.2 Performance Requirements
- **Page Load Time:** < 3 seconds
- **File Upload Speed:** Support for files up to 50MB
- **Concurrent Users:** Support for 50+ simultaneous users
- **Database Response Time:** < 1 second for queries
- **Mobile Responsiveness:** Works on devices 320px width and above

### 4.3 Security Requirements
- **Data Encryption:** All sensitive data encrypted at rest and in transit
- **Secure Authentication:** Multi-factor authentication option
- **Role-based Access Control:** Strict permission enforcement
- **Audit Logging:** All user actions logged with timestamps
- **GDPR Compliance:** Data protection and privacy compliance
- **Legal Confidentiality:** Attorney-client privilege protection

### 4.4 Browser Compatibility
- **Modern Browsers:** Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile Browsers:** iOS Safari, Android Chrome
- **Progressive Web App:** Offline capability for basic functions

## 5. User Interface Requirements

### 5.1 Main Dashboard
- **Client List View** with search and filters
- **Recent Activity Feed**
- **Quick Action Buttons** (New Client, Upload Document)
- **Statistics Overview** (total clients, active cases)

### 5.2 Client Dossier View
- **Client Information Panel**
- **Interactive Timeline** (main feature)
- **Document Library** with preview
- **Quick Actions Sidebar**
- **Billing Summary** (role-dependent visibility)

### 5.3 Timeline Interface
- **Vertical Timeline Layout**
- **Color-coded Node System**
- **Expandable Node Details**
- **Add New Node Interface**
- **Node Editing Capabilities**
- **Timeline Export Options**

### 5.4 Document Management Interface
- **File Upload Area** with drag-and-drop
- **Document Grid/List View**
- **Document Preview Modal**
- **Physical Location Assignment**
- **Document Categorization**

## 6. Data Model

### 6.1 Core Entities
- **User** (id, name, email, role, permissions)
- **Client** (id, name, contact_info, registration_date, dossier_number)
- **Dossier** (id, client_id, legal_issue_type, status, created_date)
- **TimelineNode** (id, dossier_id, type, description, timestamp, created_by, billing_amount)
- **Document** (id, dossier_id, filename, file_path, physical_location, upload_date)
- **Invoice** (id, dossier_id, amount, status, generated_date, due_date)

### 6.2 Relationships
- One Client can have multiple Dossiers
- One Dossier has multiple Timeline Nodes
- One Dossier has multiple Documents
- One Timeline Node can have multiple associated Documents
- One Dossier can have multiple Invoices

## 7. Integration Requirements

### 7.1 External Systems
- **Email Integration:** Automated notifications and reminders
- **Calendar Integration:** Court dates and appointment scheduling
- **Backup Systems:** Automated daily backups
- **Payment Gateways:** Online payment processing (optional)

### 7.2 Export Capabilities
- **PDF Reports:** Timeline reports, client summaries
- **Data Export:** CSV/Excel exports for accounting systems
- **Document Archives:** Bulk document downloads

## 8. Deployment and Maintenance

### 8.1 Deployment Requirements
- **Cloud Hosting:** AWS, Google Cloud, or Azure
- **SSL Certificate:** HTTPS encryption required
- **Domain Management:** Custom domain support
- **CDN Integration:** Fast global content delivery

### 8.2 Maintenance
- **Regular Updates:** Monthly security and feature updates
- **Data Backup:** Daily automated backups
- **System Monitoring:** 24/7 uptime monitoring
- **User Support:** Help documentation and support system

## 9. Success Criteria

### 9.1 Functional Success
- Lawyers can manage complete client lifecycle from registration to case completion
- Timeline accurately tracks all case activities with appropriate billing
- Document management integrates seamlessly with physical file organization
- Role-based access successfully protects sensitive information

### 9.2 Performance Success
- System handles peak usage without performance degradation
- Mobile access provides full functionality on smartphones and tablets
- Search and retrieval operations complete within acceptable time limits
- Data integrity maintained across all user operations

### 9.3 User Adoption Success
- Intuitive interface requires minimal training
- Lawyers can access critical information while in court
- Administrative overhead is reduced compared to paper-based systems
- Client service quality improves through better organization and tracking