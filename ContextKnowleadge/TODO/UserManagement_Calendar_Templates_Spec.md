# LexBox - User Management, Calendar & Templates Specification

## Table of Contents
1. [User Management](#1-user-management)
2. [Calendar Integration](#2-calendar-integration)
3. [Templates Page](#3-templates-page)
4. [Implementation Priority](#4-implementation-priority)

---

# 1. User Management

## 1.1 Overview

A dedicated admin page for managing system users. Allows administrators to create, edit, deactivate, and delete users without direct database access.

## 1.2 Current State vs. Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Create users | Database/seed only | UI form |
| Edit users | Not possible | UI form |
| Deactivate users | Not possible | One-click toggle |
| Reset password | Not possible | Admin action |
| View all users | Not possible | List view |
| Role assignment | Database only | Dropdown selection |

## 1.3 User Interface

### 1.3.1 User List Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  👥 User Management                                        [+ Add User]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │      8      │  │      5      │  │      2      │  │      1      │        │
│  │   ───────   │  │   ───────   │  │   ───────   │  │   ───────   │        │
│  │   Total     │  │   Active    │  │  Inactive   │  │   Admins    │        │
│  │   Users     │  │  Lawyers    │  │   Users     │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Filters:                                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────────────────┐ │
│  │ All Roles  ▼ │ │ All Status ▼ │ │ 🔍 Search by name or email...      │ │
│  └──────────────┘ └──────────────┘ └─────────────────────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────┬──────────────────┬───────────────────┬──────────┬────────┬────┐│
│  │ Avatar │ Name             │ Email             │ Role     │ Status │Act ││
│  ├────────┼──────────────────┼───────────────────┼──────────┼────────┼────┤│
│  │   JD   │ John Doe         │ john@lawfirm.com  │ 👑 Admin │ 🟢 Active│ ⋮ ││
│  │        │ Last login: Today│                   │          │        │    ││
│  ├────────┼──────────────────┼───────────────────┼──────────┼────────┼────┤│
│  │   JS   │ Jane Smith       │ jane@lawfirm.com  │ ⚖️ Lawyer│ 🟢 Active│ ⋮ ││
│  │        │ Last login: Today│                   │          │        │    ││
│  ├────────┼──────────────────┼───────────────────┼──────────┼────────┼────┤│
│  │   BA   │ Bob Anderson     │ bob@lawfirm.com   │ ⚖️ Lawyer│ 🟢 Active│ ⋮ ││
│  │        │ Last login: Apr 10│                  │          │        │    ││
│  ├────────┼──────────────────┼───────────────────┼──────────┼────────┼────┤│
│  │   SK   │ Sarah Kim        │ sarah@lawfirm.com │ 📋 Secty │ 🟢 Active│ ⋮ ││
│  │        │ Last login: Apr 11│                  │          │        │    ││
│  ├────────┼──────────────────┼───────────────────┼──────────┼────────┼────┤│
│  │   MJ   │ Mike Johnson     │ mike@lawfirm.com  │ ⚖️ Lawyer│ 🔴 Inact│ ⋮ ││
│  │        │ Last login: Mar 1 │                  │          │        │    ││
│  └────────┴──────────────────┴───────────────────┴──────────┴────────┴────┘│
│                                                                             │
│  Showing 1-5 of 8 users                              [< Prev] [1] [2] [Next>]│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3.2 Actions Dropdown Menu

```
┌─────────────┐
│  ⋮ Actions  │
├─────────────┤
│ 👁️ View     │
│ ✏️ Edit     │
│ 🔑 Reset PW │
│ ─────────── │
│ 🔴 Deactivate│  (or 🟢 Activate if inactive)
│ 🗑️ Delete   │
└─────────────┘
```

### 1.3.3 Add/Edit User Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  ➕ Add New User                                           [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │ First Name *            │  │ Last Name *             │      │
│  │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │      │
│  │ │ Jane                │ │  │ │ Smith               │ │      │
│  │ └─────────────────────┘ │  │ └─────────────────────┘ │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                 │
│  Email Address *                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ jane.smith@lawfirm.com                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Phone Number                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ +1 (555) 123-4567                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Username *                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ jsmith                                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Role *                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Lawyer                                                ▼ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👑 Admin                                                │   │
│  │    Full system access. Can manage users, settings,      │   │
│  │    and all client data.                                 │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ⚖️ Lawyer                                               │   │
│  │    Can manage clients, dossiers, documents, billing.    │   │
│  │    Cannot manage users or system settings.              │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 📋 Secretary                                            │   │
│  │    View-only access to clients and dossiers.            │   │
│  │    Can upload documents and create timeline entries.    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Password *                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ••••••••••••••••                        [👁️] [🔄 Gen]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Password strength: ████████░░ Strong                           │
│                                                                 │
│  Confirm Password *                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ••••••••••••••••                                   [👁️] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑️ Send welcome email with login credentials            │   │
│  │ ☐ Require password change on first login               │   │
│  │ ☑️ User is active                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              [Cancel]    [Create User]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3.4 View User Details Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  👤 User Details                                           [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ┌──────────┐                                            │
│         │          │                                            │
│         │    JS    │   Jane Smith                               │
│         │          │   ⚖️ Lawyer  •  🟢 Active                  │
│         └──────────┘                                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Contact Information                                            │
│  ─────────────────────────────────────────────────────────────  │
│  📧 Email:        jane.smith@lawfirm.com                        │
│  📱 Phone:        +1 (555) 123-4567                             │
│  👤 Username:     jsmith                                        │
│                                                                 │
│  Account Information                                            │
│  ─────────────────────────────────────────────────────────────  │
│  📅 Created:      January 15, 2024                              │
│  🕐 Last Login:   April 12, 2024 at 9:45 AM                     │
│  🔐 Last PW Change: March 1, 2024                               │
│                                                                 │
│  Activity Summary                                               │
│  ─────────────────────────────────────────────────────────────  │
│  📁 Assigned Dossiers:    12                                    │
│  📝 Timeline Entries:     156                                   │
│  📄 Documents Uploaded:   89                                    │
│  💰 Invoices Created:     34                                    │
│                                                                 │
│                    [Edit User]    [Close]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3.5 Reset Password Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  🔑 Reset Password                                         [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Reset password for: Jane Smith (jane@lawfirm.com)              │
│                                                                 │
│  ○ Generate random password                                     │
│  ● Set custom password                                          │
│                                                                 │
│  New Password *                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ••••••••••••                               [👁️] [🔄]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Confirm Password *                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ••••••••••••                                       [👁️] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ☑️ Send password reset email to user                           │
│  ☑️ Require password change on next login                       │
│                                                                 │
│                         [Cancel]    [Reset Password]            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3.6 Delete Confirmation Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Delete User                                            [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Are you sure you want to delete this user?                     │
│                                                                 │
│  👤 Mike Johnson (mike@lawfirm.com)                             │
│                                                                 │
│  ⚠️ Warning: This action cannot be undone!                      │
│                                                                 │
│  This user has:                                                 │
│  • 5 assigned dossiers                                          │
│  • 45 timeline entries                                          │
│  • 23 uploaded documents                                        │
│                                                                 │
│  These items will be reassigned to: [Select user ▼]             │
│                                                                 │
│  Type "DELETE" to confirm: [____________]                       │
│                                                                 │
│                         [Cancel]    [Delete User]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 1.4 Role Permissions Matrix

| Permission | Admin | Lawyer | Secretary |
|------------|-------|--------|-----------|
| **User Management** |
| View users list | ✅ | ❌ | ❌ |
| Create users | ✅ | ❌ | ❌ |
| Edit users | ✅ | ❌ | ❌ |
| Delete users | ✅ | ❌ | ❌ |
| Reset passwords | ✅ | ❌ | ❌ |
| **Own Profile** |
| View own profile | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ |
| Change own password | ✅ | ✅ | ✅ |
| **Clients** |
| View clients | ✅ | ✅ | ✅ |
| Create clients | ✅ | ✅ | ❌ |
| Edit clients | ✅ | ✅ | ❌ |
| Delete clients | ✅ | ✅ | ❌ |
| **Dossiers** |
| View dossiers | ✅ | ✅ | ✅ |
| Create dossiers | ✅ | ✅ | ❌ |
| Edit dossiers | ✅ | ✅ | ❌ |
| Delete dossiers | ✅ | ❌ | ❌ |
| **Documents** |
| View documents | ✅ | ✅ | ✅ |
| Upload documents | ✅ | ✅ | ✅ |
| Delete documents | ✅ | ✅ | ❌ |
| **Timeline** |
| View timeline | ✅ | ✅ | ✅ |
| Create entries | ✅ | ✅ | ✅ |
| Edit entries | ✅ | ✅ | ❌ |
| Delete entries | ✅ | ✅ | ❌ |
| **Billing** |
| View invoices | ✅ | ✅ | ✅ |
| Create invoices | ✅ | ✅ | ❌ |
| Send invoices | ✅ | ✅ | ❌ |
| Record payments | ✅ | ✅ | ❌ |
| **Settings** |
| View settings | ✅ | ❌ | ❌ |
| Edit settings | ✅ | ❌ | ❌ |

## 1.5 Database Schema

### Users Table (Updated)

```sql
-- Existing fields remain, add these:
ALTER TABLE users ADD COLUMN phone VARCHAR(50);
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN last_password_change TIMESTAMP;
ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;
```

## 1.6 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List all users (paginated, filtered) | Admin |
| GET | `/api/users/:id` | Get user details | Admin |
| POST | `/api/users` | Create new user | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| PATCH | `/api/users/:id/status` | Activate/Deactivate | Admin |
| POST | `/api/users/:id/reset-password` | Reset password | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |
| GET | `/api/users/stats` | User statistics | Admin |
| GET | `/api/profile` | Get own profile | Any |
| PUT | `/api/profile` | Update own profile | Any |
| PUT | `/api/profile/password` | Change own password | Any |

## 1.7 Email Templates

### Welcome Email
```
Subject: Welcome to LexBox - Your Account is Ready

Dear {{first_name}},

Your LexBox account has been created. Here are your login credentials:

Email: {{email}}
Temporary Password: {{password}}

Please log in at: {{login_url}}

For security, please change your password after your first login.

Best regards,
{{company_name}}
```

### Password Reset Email
```
Subject: Your LexBox Password Has Been Reset

Dear {{first_name}},

Your password has been reset by an administrator.

New Password: {{password}}

Please log in at: {{login_url}}

You will be required to change this password on your next login.

Best regards,
{{company_name}}
```

---

# 3. Templates Page

## 3.1 Overview

A document template library that allows users to create, manage, and generate documents from pre-defined templates with variable substitution. Templates can include placeholders that auto-fill with client, dossier, and company data.

## 3.2 Template List Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📄 Document Templates                                  [+ New Template]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │     15      │  │      5      │  │      4      │  │      3      │        │
│  │   ───────   │  │   ───────   │  │   ───────   │  │   ───────   │        │
│  │   Total     │  │  Contracts  │  │   Court     │  │   Letters   │        │
│  │  Templates  │  │             │  │   Docs      │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [All Categories ▼]  [🔍 Search templates...]             [Grid] [List]     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │ │
│  │  │ 📄            │  │  │  │ 📄            │  │  │  │ 📄            │  │ │
│  │  │ ───────────── │  │  │  │ ───────────── │  │  │  │ ───────────── │  │ │
│  │  │ ───────────── │  │  │  │ ───────────── │  │  │  │ ───────────── │  │ │
│  │  │ ─────────     │  │  │  │ ─────────     │  │  │  │ ─────────     │  │ │
│  │  └───────────────┘  │  │  └───────────────┘  │  │  └───────────────┘  │ │
│  │                     │  │                     │  │                     │ │
│  │  Client Engagement  │  │  Power of Attorney  │  │  Court Motion       │ │
│  │  Letter             │  │                     │  │  Template           │ │
│  │                     │  │                     │  │                     │ │
│  │  📁 Contracts       │  │  📁 Legal Forms     │  │  📁 Court Docs      │ │
│  │  Used: 45 times     │  │  Used: 32 times     │  │  Used: 28 times     │ │
│  │                     │  │                     │  │                     │ │
│  │  [Use] [Edit] [⋮]   │  │  [Use] [Edit] [⋮]   │  │  [Use] [Edit] [⋮]   │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │ │
│  │  │ 📄            │  │  │  │ 📄            │  │  │  │ 📄            │  │ │
│  │  │ ───────────── │  │  │  │ ───────────── │  │  │  │ ───────────── │  │ │
│  │  │ ───────────── │  │  │  │ ───────────── │  │  │  │ ───────────── │  │ │
│  │  │ ─────────     │  │  │  │ ─────────     │  │  │  │ ─────────     │  │ │
│  │  └───────────────┘  │  │  └───────────────┘  │  │  └───────────────┘  │ │
│  │                     │  │                     │  │                     │ │
│  │  NDA Agreement      │  │  Invoice Cover      │  │  Witness Statement  │ │
│  │                     │  │  Letter             │  │  Form               │ │
│  │                     │  │                     │  │                     │ │
│  │  📁 Contracts       │  │  📁 Billing         │  │  📁 Legal Forms     │ │
│  │  Used: 15 times     │  │  Used: 120 times    │  │  Used: 22 times     │ │
│  │                     │  │                     │  │                     │ │
│  │  [Use] [Edit] [⋮]   │  │  [Use] [Edit] [⋮]   │  │  [Use] [Edit] [⋮]   │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.3 Template Categories

| Category | Icon | Description | Example Templates |
|----------|------|-------------|-------------------|
| **Contracts** | 📝 | Client agreements | Engagement Letter, Retainer Agreement, NDA, Fee Agreement |
| **Court Documents** | ⚖️ | Court filings | Motion Template, Appeal Brief, Court Order, Complaint |
| **Correspondence** | ✉️ | Letters & notices | Demand Letter, Settlement Offer, Client Update, Closing Letter |
| **Legal Forms** | 📋 | Standard forms | Power of Attorney, Affidavit, Witness Statement, Declaration |
| **Billing** | 💰 | Financial docs | Invoice Cover, Payment Reminder, Receipt, Fee Schedule |
| **Internal** | 🏢 | Internal docs | Case Summary, Legal Memo, Research Brief |

## 3.4 Use Template Wizard

### Step 1: Select Client/Dossier

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📄 Generate: Client Engagement Letter                                 [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1 of 3: Select Client                        ● ─── ○ ─── ○           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search client by name, email, or dossier number...              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Recent Clients:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  ○  👤 John Smith                                                   │   │
│  │     📁 DOS-2024-001 • Immigration                                   │   │
│  │                                                                      │   │
│  │  ●  👤 Jane Doe                                          ← selected │   │
│  │     📁 DOS-2024-002 • Criminal Defense                              │   │
│  │                                                                      │   │
│  │  ○  👤 ABC Corporation                                              │   │
│  │     📁 DOS-2024-003 • Corporate Law                                 │   │
│  │                                                                      │   │
│  │  ○  👤 Robert Johnson                                               │   │
│  │     📁 DOS-2024-004 • Family Law                                    │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                          [Cancel]    [Next: Fill Details]   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Fill Variables

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📄 Generate: Client Engagement Letter                                 [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 2 of 3: Fill Details                         ○ ─── ● ─── ○           │
│                                                                             │
│  Auto-filled from client/dossier (editable):                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Client Name                     Client Email                       │   │
│  │  ┌─────────────────────────┐    ┌─────────────────────────┐        │   │
│  │  │ Jane Doe                │    │ jane@example.com        │        │   │
│  │  └─────────────────────────┘    └─────────────────────────┘        │   │
│  │                                                                      │   │
│  │  Client Address                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ 456 Client Street, City, State 12345                        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  Dossier Number                  Case Type                          │   │
│  │  ┌─────────────────────────┐    ┌─────────────────────────┐        │   │
│  │  │ DOS-2024-002            │    │ Criminal Defense        │        │   │
│  │  └─────────────────────────┘    └─────────────────────────┘        │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Additional variables (template-specific):                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Retainer Fee *                  Hourly Rate                        │   │
│  │  ┌─────────────────────────┐    ┌─────────────────────────┐        │   │
│  │  │ € 2,500.00              │    │ € 150.00 (from settings)│        │   │
│  │  └─────────────────────────┘    └─────────────────────────┘        │   │
│  │                                                                      │   │
│  │  Engagement Start Date           Payment Terms                      │   │
│  │  ┌─────────────────────────┐    ┌─────────────────────────┐        │   │
│  │  │ 📅 April 15, 2024       │    │ Net 30 days           ▼ │        │   │
│  │  └─────────────────────────┘    └─────────────────────────┘        │   │
│  │                                                                      │   │
│  │  Scope of Services                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Representation in criminal defense matter including all    │   │   │
│  │  │ court appearances, document preparation, and negotiations. │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  Special Terms (optional)                                           │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                              │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                              [Back]    [Next: Preview]                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 3: Preview & Generate

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📄 Generate: Client Engagement Letter                                 [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 3 of 3: Preview & Generate                   ○ ─── ○ ─── ●           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │                                                               │  │   │
│  │  │  LEXBOX LEGAL SERVICES                                        │  │   │
│  │  │  123 Legal Street, City, Country                              │  │   │
│  │  │  Phone: +1 555-000-0000 | Email: info@lexbox.com              │  │   │
│  │  │                                                               │  │   │
│  │  │  ─────────────────────────────────────────────────────────    │  │   │
│  │  │                                                               │  │   │
│  │  │  April 15, 2024                                               │  │   │
│  │  │                                                               │  │   │
│  │  │  Jane Doe                                                     │  │   │
│  │  │  456 Client Street                                            │  │   │
│  │  │  City, State 12345                                            │  │   │
│  │  │                                                               │  │   │
│  │  │  RE: Engagement Letter - Criminal Defense                     │  │   │
│  │  │      Dossier: DOS-2024-002                                    │  │   │
│  │  │                                                               │  │   │
│  │  │  Dear Jane Doe,                                               │  │   │
│  │  │                                                               │  │   │
│  │  │  Thank you for choosing LexBox Legal Services for your       │  │   │
│  │  │  Criminal Defense matter. This letter confirms our           │  │   │
│  │  │  engagement under the following terms:                       │  │   │
│  │  │                                                               │  │   │
│  │  │  SCOPE OF SERVICES                                           │  │   │
│  │  │  Representation in criminal defense matter including all     │  │   │
│  │  │  court appearances, document preparation, and negotiations.  │  │   │
│  │  │                                                               │  │   │
│  │  │  FEE ARRANGEMENT                                             │  │   │
│  │  │  • Retainer Fee: €2,500.00                                   │  │   │
│  │  │  • Hourly Rate: €150.00                                      │  │   │
│  │  │  • Payment Terms: Net 30 days                                │  │   │
│  │  │                                                               │  │   │
│  │  │  ...                                                          │  │   │
│  │  │                                                               │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                    [Scroll ↓]       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Output Options:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ☑️ Save to client's documents (in dossier DOS-2024-002)            │   │
│  │ ☑️ Create timeline entry                                            │   │
│  │ ☐ Email document to client                                          │   │
│  │ ☑️ Download copy                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                     [Back]    [Download PDF]    [Generate & Save]           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.5 Template Editor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✏️ Edit Template: Client Engagement Letter                            [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Template Name *                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Client Engagement Letter                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Category *                         Output Format                           │
│  ┌─────────────────────────┐       ┌─────────────────────────┐             │
│  │ Contracts             ▼ │       │ PDF                   ▼ │             │
│  └─────────────────────────┘       └─────────────────────────┘             │
│                                                                             │
│  Description                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Standard engagement letter for new client relationships             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Toolbar:                                                                   │
│  [B] [I] [U] [S] │ [H1] [H2] [H3] │ [• List] [1. List] │ [Link] [Image]    │
│  │ [Align ◀ ▶] │ [Table] │ [Line] │ [Page Break] │ [Insert Variable ▼]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  {{company_name}}                                                   │   │
│  │  {{company_address}}                                                │   │
│  │  Phone: {{company_phone}} | Email: {{company_email}}                │   │
│  │                                                                      │   │
│  │  ─────────────────────────────────────────────────────────          │   │
│  │                                                                      │   │
│  │  {{today_date}}                                                     │   │
│  │                                                                      │   │
│  │  {{client_name}}                                                    │   │
│  │  {{client_address}}                                                 │   │
│  │                                                                      │   │
│  │  RE: Engagement Letter - {{case_type}}                              │   │
│  │      Dossier: {{dossier_number}}                                    │   │
│  │                                                                      │   │
│  │  Dear {{client_name}},                                              │   │
│  │                                                                      │   │
│  │  Thank you for choosing {{company_name}} for your {{case_type}}     │   │
│  │  matter. This letter confirms our engagement under the following    │   │
│  │  terms:                                                              │   │
│  │                                                                      │   │
│  │  **SCOPE OF SERVICES**                                              │   │
│  │  {{scope_of_services}}                                              │   │
│  │                                                                      │   │
│  │  **FEE ARRANGEMENT**                                                │   │
│  │  • Retainer Fee: {{retainer_fee}}                                   │   │
│  │  • Hourly Rate: {{hourly_rate}}                                     │   │
│  │  • Payment Terms: {{payment_terms}}                                 │   │
│  │                                                                      │   │
│  │  {{#if special_terms}}                                              │   │
│  │  **SPECIAL TERMS**                                                  │   │
│  │  {{special_terms}}                                                  │   │
│  │  {{/if}}                                                            │   │
│  │                                                                      │   │
│  │  Please sign below to confirm your agreement.                       │   │
│  │                                                                      │   │
│  │  Sincerely,                                                          │   │
│  │                                                                      │   │
│  │  ______________________________                                     │   │
│  │  {{lawyer_name}}                                                    │   │
│  │  {{company_name}}                                                   │   │
│  │                                                                      │   │
│  │  ─────────────────────────────────────────────────────────          │   │
│  │                                                                      │   │
│  │  CLIENT ACCEPTANCE                                                  │   │
│  │                                                                      │   │
│  │  I, {{client_name}}, agree to the terms outlined above.             │   │
│  │                                                                      │   │
│  │  Signature: ____________________________  Date: ______________      │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📦 Available Variables:                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Client: [client_name] [client_email] [client_address] [client_phone]│   │
│  │ Dossier: [dossier_number] [case_type] [case_description]            │   │
│  │ Company: [company_name] [company_address] [company_phone]           │   │
│  │ Dates: [today_date] [today_date_long] [engagement_date]             │   │
│  │ Billing: [hourly_rate] [retainer_fee] [payment_terms]               │   │
│  │ User: [lawyer_name] [lawyer_email] [lawyer_title]                   │   │
│  │ Custom: [scope_of_services] [special_terms] [+Add Custom...]        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                            [Cancel]    [Preview]    [Save Template]         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.6 Template Variables

### System Variables (Auto-filled)

| Variable | Source | Example |
|----------|--------|---------|
| **Client Variables** |
| `{{client_name}}` | Client first_name + last_name | Jane Doe |
| `{{client_first_name}}` | Client first_name | Jane |
| `{{client_last_name}}` | Client last_name | Doe |
| `{{client_email}}` | Client email | jane@example.com |
| `{{client_phone}}` | Client phone | +1 555-123-4567 |
| `{{client_address}}` | Client address | 456 Client St, City |
| `{{client_personal_number}}` | Client personal_number | 123-45-6789 |
| **Dossier Variables** |
| `{{dossier_number}}` | Dossier dossier_number | DOS-2024-002 |
| `{{case_type}}` | Dossier legal_issue_type | Criminal Defense |
| `{{case_subtype}}` | Dossier legal_issue_subtype | DUI |
| `{{case_title}}` | Dossier title | Doe vs. State |
| `{{case_description}}` | Dossier description | ... |
| `{{case_opened_date}}` | Dossier opened_date | January 15, 2024 |
| **Company Variables** |
| `{{company_name}}` | Settings company_name | LexBox Legal Services |
| `{{company_address}}` | Settings company_address | 123 Legal Street |
| `{{company_phone}}` | Settings company_phone | +1 555-000-0000 |
| `{{company_email}}` | Settings company_email | info@lexbox.com |
| `{{company_website}}` | Settings company_website | www.lexbox.com |
| `{{company_tax_id}}` | Settings company_tax_id | XX-XXXXXXX |
| **Date Variables** |
| `{{today_date}}` | Current date | April 15, 2024 |
| `{{today_date_short}}` | Current date short | 04/15/2024 |
| `{{today_date_iso}}` | Current date ISO | 2024-04-15 |
| **User Variables** |
| `{{lawyer_name}}` | Current user name | John Lawyer |
| `{{lawyer_email}}` | Current user email | john@lawfirm.com |
| `{{lawyer_title}}` | User role formatted | Attorney at Law |
| **Billing Variables** |
| `{{hourly_rate}}` | Settings default_hourly_rate | €150.00 |
| `{{currency_symbol}}` | Settings currency_symbol | € |

### Custom Variables

Templates can define custom variables that users fill during generation:

```javascript
// In template definition:
{
  custom_variables: [
    { 
      key: 'retainer_fee',
      label: 'Retainer Fee',
      type: 'currency',
      required: true,
      default: 2500
    },
    {
      key: 'scope_of_services',
      label: 'Scope of Services',
      type: 'textarea',
      required: true,
      placeholder: 'Describe the services...'
    },
    {
      key: 'special_terms',
      label: 'Special Terms',
      type: 'textarea',
      required: false
    },
    {
      key: 'payment_terms',
      label: 'Payment Terms',
      type: 'select',
      options: ['Net 15 days', 'Net 30 days', 'Net 45 days', 'Due on Receipt'],
      default: 'Net 30 days'
    }
  ]
}
```

### Conditional Blocks

```handlebars
{{#if special_terms}}
**SPECIAL TERMS**
{{special_terms}}
{{/if}}

{{#if client_company_name}}
Company: {{client_company_name}}
{{else}}
Individual: {{client_name}}
{{/if}}
```

## 3.7 Database Schema

### Templates Table

```sql
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  
  -- Content
  content TEXT NOT NULL, -- Markdown/HTML with {{variables}}
  output_format VARCHAR(20) DEFAULT 'pdf', -- pdf, docx
  
  -- Variables
  custom_variables JSONB DEFAULT '[]',
  
  -- Metadata
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- System-provided templates
  
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_org ON templates(organization_id);
CREATE INDEX idx_templates_category ON templates(organization_id, category);
```

### Generated Documents Table

```sql
CREATE TABLE generated_documents (
  id SERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  template_id INTEGER REFERENCES templates(id),
  
  -- Links
  dossier_id INTEGER REFERENCES dossiers(id),
  client_id INTEGER REFERENCES clients(id),
  document_id INTEGER REFERENCES documents(id), -- If saved to docs
  
  -- Snapshot
  template_name VARCHAR(255),
  variables_used JSONB,
  
  -- Output
  output_format VARCHAR(20),
  file_path VARCHAR(500),
  
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 3.8 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List templates (filtered by category) |
| GET | `/api/templates/:id` | Get template details |
| POST | `/api/templates` | Create template |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |
| POST | `/api/templates/:id/generate` | Generate document from template |
| GET | `/api/templates/:id/preview` | Preview with sample data |
| GET | `/api/templates/categories` | List categories with counts |
| POST | `/api/templates/:id/duplicate` | Duplicate template |

## 3.9 Sample Default Templates

### 1. Client Engagement Letter
- Category: Contracts
- Variables: retainer_fee, hourly_rate, scope_of_services, payment_terms

### 2. Power of Attorney
- Category: Legal Forms
- Variables: powers_granted, effective_date, expiration_date

### 3. Demand Letter
- Category: Correspondence
- Variables: demand_amount, demand_reason, deadline_date

### 4. Invoice Cover Letter
- Category: Billing
- Variables: invoice_number, invoice_amount, services_rendered

### 5. Court Motion Template
- Category: Court Documents
- Variables: motion_type, court_name, case_number, arguments

---

# 4. Implementation Priority

## Recommended Order

| Priority | Feature | Effort | Dependencies | Value |
|----------|---------|--------|--------------|-------|
| **1** | User Management | Medium (3-4 days) | None | High - Admin essential |
| **2** | Templates | Medium (3-4 days) | None | High - Productivity |
| **3** | Calendar | Medium (4-5 days) | Timeline exists | Medium - Nice to have |

## Implementation Timeline

### Week 1: User Management
- Day 1-2: Backend (API, service, controller)
- Day 3: Frontend (list page, modals)
- Day 4: Testing & email integration

### Week 2: Templates
- Day 1-2: Backend (model, API, PDF generation)
- Day 3-4: Frontend (list, editor, wizard)
- Day 5: Default templates & testing

### Week 3: Calendar
- Day 1: Install FullCalendar, basic setup
- Day 2: Backend API (events aggregation)
- Day 3-4: Frontend (views, event modals)
- Day 5: Testing & refinements

## Total Estimated Effort

| Feature | Backend | Frontend | Total |
|---------|---------|----------|-------|
| User Management | 2 days | 2 days | 4 days |
| Templates | 2 days | 3 days | 5 days |
| Calendar | 1 day | 3 days | 4 days |
| **TOTAL** | **5 days** | **8 days** | **13 days** |

---

## Notes

- All features should respect multi-tenant architecture (filter by organization_id)
- User Management is prerequisite for proper multi-tenant SaaS
- Calendar can leverage existing Timeline data (no new data entry needed)
- Templates boost productivity significantly for law firms
