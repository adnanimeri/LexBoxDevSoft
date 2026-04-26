# LexBox - Global Billing & Export/Reporting Specification

## Table of Contents
1. [Global Billing Page](#1-global-billing-page)
2. [Export & Reporting](#2-export--reporting)
3. [Implementation Plan](#3-implementation-plan)
4. [Database Queries](#4-database-queries)
5. [API Endpoints](#5-api-endpoints)

---

## 1. Global Billing Page

### 1.1 Overview

A centralized dashboard accessible from the main sidebar that displays **all invoices across all clients** in one unified view. This replaces the need to navigate into each client's page to view their invoices.

### 1.2 User Interface Mockup

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  💰 Billing & Invoices                                     [+ New Invoice]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   €45,230   │  │   €32,150   │  │   €13,080   │  │   €4,500    │        │
│  │   ───────   │  │   ───────   │  │   ───────   │  │   ───────   │        │
│  │   Total     │  │   Paid      │  │ Outstanding │  │   Overdue   │        │
│  │  Invoiced   │  │             │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Filters:                                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │ All Status ▼ │ │ All Clients▼ │ │ This Month ▼ │ │ 🔍 Search...      │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └───────────────────┘  │
│                                                                             │
│  [Export CSV] [Export PDF] [Print]                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Invoice #    │ Client         │ Issue Date │ Due Date  │ Amount    │   │
│  │              │                │            │           │           │   │
│  │ Status       │ Paid           │ Balance    │           │ Actions   │   │
│  ├──────────────┼────────────────┼────────────┼───────────┼───────────┤   │
│  │ INV-2024-015 │ John Smith     │ Apr 10     │ May 10    │ €1,500.00 │   │
│  │ ● Paid       │ €1,500.00      │ €0.00      │           │ 📄 ✉️ 👁️  │   │
│  ├──────────────┼────────────────┼────────────┼───────────┼───────────┤   │
│  │ INV-2024-014 │ ABC Company    │ Apr 08     │ May 08    │ €3,200.00 │   │
│  │ ● Sent       │ €0.00          │ €3,200.00  │           │ 📄 ✉️ 💳 👁️│   │
│  ├──────────────┼────────────────┼────────────┼───────────┼───────────┤   │
│  │ INV-2024-013 │ Jane Doe       │ Mar 15     │ Apr 14    │ €800.00   │   │
│  │ ● Overdue    │ €0.00          │ €800.00    │           │ 📄 ✉️ 💳 👁️│   │
│  ├──────────────┼────────────────┼────────────┼───────────┼───────────┤   │
│  │ INV-2024-012 │ XYZ Corp       │ Apr 01     │ May 01    │ €5,000.00 │   │
│  │ ● Partial    │ €2,000.00      │ €3,000.00  │           │ 📄 ✉️ 💳 👁️│   │
│  └──────────────┴────────────────┴────────────┴───────────┴───────────┘   │
│                                                                             │
│  Showing 1-10 of 45 invoices                    [< Prev] [1] [2] [3] [Next>]│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Summary Cards

| Card | Description | Color | Calculation |
|------|-------------|-------|-------------|
| **Total Invoiced** | Sum of all invoice amounts | Blue | `SUM(total_amount)` |
| **Paid** | Total payments received | Green | `SUM(amount_paid)` |
| **Outstanding** | Unpaid balance | Orange | `Total - Paid` |
| **Overdue** | Past due date & unpaid | Red | `WHERE due_date < NOW() AND status NOT IN ('paid', 'cancelled')` |

### 1.4 Filters

| Filter | Options | Default |
|--------|---------|---------|
| **Status** | All, Draft, Sent, Partial, Paid, Overdue, Cancelled | All |
| **Client** | Dropdown with search | All Clients |
| **Date Range** | This Month, Last Month, This Quarter, This Year, Custom | This Month |
| **Search** | Invoice number, client name | - |

### 1.5 Table Columns

| Column | Description | Sortable |
|--------|-------------|----------|
| Invoice # | Invoice number (clickable → details) | ✅ |
| Client | Client name (clickable → client page) | ✅ |
| Issue Date | When invoice was created | ✅ |
| Due Date | Payment deadline | ✅ |
| Amount | Total invoice amount | ✅ |
| Status | Draft/Sent/Partial/Paid/Overdue/Cancelled | ✅ |
| Paid | Amount paid so far | ✅ |
| Balance | Remaining amount due | ✅ |
| Actions | PDF, Email, Payment, View | - |

### 1.6 Actions

| Icon | Action | Available When |
|------|--------|----------------|
| 📄 | Download PDF | Always |
| ✉️ | Email to client | Client has email |
| 💳 | Record payment | Status: Sent, Partial, Overdue |
| 👁️ | View details | Always |
| ✏️ | Edit | Status: Draft |
| ❌ | Cancel | Status: Draft, Sent |

### 1.7 Status Colors

```css
Draft:     bg-gray-100  text-gray-800
Sent:      bg-blue-100  text-blue-800
Partial:   bg-yellow-100 text-yellow-800
Paid:      bg-green-100 text-green-800
Overdue:   bg-red-100   text-red-800
Cancelled: bg-gray-100  text-gray-500 (strikethrough)
```

---

## 2. Export & Reporting

### 2.1 Overview

Generate downloadable reports in various formats (PDF, Excel, CSV) for accounting, tax filing, and business analysis purposes.

### 2.2 Available Reports

#### A. Invoice List Export

**Purpose:** Export all invoices for accounting/bookkeeping

**Formats:** CSV, Excel (XLSX)

**Fields Included:**
- Invoice Number
- Client Name
- Client Email
- Dossier Number
- Issue Date
- Due Date
- Subtotal
- Tax Rate
- Tax Amount
- Total Amount
- Amount Paid
- Balance Due
- Status
- Payment Terms

**Filters:**
- Date range
- Status
- Client

---

#### B. Payment Report

**Purpose:** Track all payments received within a period

**Formats:** PDF, Excel

**Content:**
```
┌─────────────────────────────────────────────────────────────┐
│              PAYMENT REPORT                                 │
│              Period: March 1 - March 31, 2024               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SUMMARY                                                    │
│  ─────────────────────────────────────────────────────      │
│  Total Payments Received:     €12,350.00                    │
│  Number of Payments:          15                            │
│  Average Payment:             €823.33                       │
│                                                             │
│  BY PAYMENT METHOD                                          │
│  ─────────────────────────────────────────────────────      │
│  Bank Transfer:               €8,500.00  (68.8%)            │
│  Credit Card:                 €2,350.00  (19.0%)            │
│  Cash:                        €1,500.00  (12.2%)            │
│                                                             │
│  PAYMENT DETAILS                                            │
│  ─────────────────────────────────────────────────────      │
│  Date       │ Invoice    │ Client      │ Method  │ Amount  │
│  ───────────┼────────────┼─────────────┼─────────┼─────────│
│  Mar 05     │ INV-2024-01│ John Smith  │ Bank    │ €500.00 │
│  Mar 08     │ INV-2024-02│ ABC Corp    │ Card    │ €1,200  │
│  Mar 12     │ INV-2024-03│ Jane Doe    │ Cash    │ €350.00 │
│  ...        │ ...        │ ...         │ ...     │ ...     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### C. Revenue Report (Monthly/Quarterly/Yearly)

**Purpose:** Financial overview for management and tax purposes

**Formats:** PDF, Excel

**Content:**
```
┌─────────────────────────────────────────────────────────────┐
│              REVENUE REPORT                                 │
│              Q1 2024 (Jan - Mar)                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REVENUE SUMMARY                                            │
│  ─────────────────────────────────────────────────────      │
│  Total Invoiced:              €45,000.00                    │
│  Total Collected:             €38,500.00                    │
│  Outstanding:                 €6,500.00                     │
│  Collection Rate:             85.6%                         │
│                                                             │
│  MONTHLY BREAKDOWN                                          │
│  ─────────────────────────────────────────────────────      │
│  Month     │ Invoiced   │ Collected  │ Outstanding │        │
│  ──────────┼────────────┼────────────┼─────────────│        │
│  January   │ €12,000.00 │ €11,500.00 │ €500.00     │ ██████ │
│  February  │ €15,000.00 │ €14,000.00 │ €1,000.00   │ ████████│
│  March     │ €18,000.00 │ €13,000.00 │ €5,000.00   │ █████████│
│                                                             │
│  BY SERVICE TYPE                                            │
│  ─────────────────────────────────────────────────────      │
│  Consultations:               €18,000.00  (40%)             │
│  Court Appearances:           €15,000.00  (33%)             │
│  Document Preparation:        €8,000.00   (18%)             │
│  Other Services:              €4,000.00   (9%)              │
│                                                             │
│  TAX SUMMARY                                                │
│  ─────────────────────────────────────────────────────      │
│  Net Amount:                  €37,500.00                    │
│  VAT Collected (20%):         €7,500.00                     │
│  Gross Amount:                €45,000.00                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### D. Aging Report (Accounts Receivable)

**Purpose:** Track overdue invoices by age for collections

**Formats:** PDF, Excel

**Content:**
```
┌─────────────────────────────────────────────────────────────┐
│              AGING REPORT                                   │
│              As of: April 12, 2024                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AGING SUMMARY                                              │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Current (not yet due):       €8,500.00   ████████████      │
│  1-30 days overdue:           €3,200.00   █████             │
│  31-60 days overdue:          €1,800.00   ███               │
│  61-90 days overdue:          €500.00     █                 │
│  Over 90 days:                €200.00     ▌                 │
│  ─────────────────────────────────────────────────────      │
│  TOTAL OUTSTANDING:           €14,200.00                    │
│                                                             │
│  DETAIL BY CLIENT                                           │
│  ─────────────────────────────────────────────────────      │
│  Client       │ Current │ 1-30  │ 31-60 │ 61-90 │ 90+  │Total│
│  ─────────────┼─────────┼───────┼───────┼───────┼──────┼─────│
│  ABC Company  │ €2,000  │ €1,500│ €0    │ €0    │ €0   │€3,500│
│  John Smith   │ €1,500  │ €0    │ €800  │ €0    │ €0   │€2,300│
│  Jane Doe     │ €0      │ €1,200│ €500  │ €300  │ €0   │€2,000│
│  XYZ Corp     │ €3,000  │ €0    │ €0    │ €0    │ €200 │€3,200│
│  Other (5)    │ €2,000  │ €500  │ €500  │ €200  │ €0   │€3,200│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### E. Client Statement

**Purpose:** Statement for individual client showing all transactions

**Formats:** PDF

**Content:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [COMPANY LOGO]           CLIENT STATEMENT                  │
│                                                             │
│  LexBox Legal Services    Statement Date: April 12, 2024    │
│  123 Legal Street         Statement Period: Jan - Mar 2024  │
│  City, Country                                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  BILL TO:                                                   │
│  ─────────                                                  │
│  John Smith                                                 │
│  456 Client Avenue                                          │
│  City, Country                                              │
│  Email: john@example.com                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ACCOUNT SUMMARY                                            │
│  ─────────────────────────────────────────────────────      │
│  Previous Balance:            €500.00                       │
│  New Charges:                 €2,500.00                     │
│  Payments Received:           €2,000.00                     │
│  ─────────────────────────────────────────────────────      │
│  BALANCE DUE:                 €1,000.00                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  TRANSACTION DETAIL                                         │
│  ─────────────────────────────────────────────────────      │
│  Date       │ Description              │ Charges │ Payments│
│  ───────────┼──────────────────────────┼─────────┼─────────│
│  Jan 01     │ Balance Forward          │         │         │
│  Jan 15     │ Invoice INV-2024-001     │ €800.00 │         │
│  Jan 20     │ Payment - Bank Transfer  │         │ €800.00 │
│  Feb 10     │ Invoice INV-2024-005     │ €1,200  │         │
│  Feb 25     │ Payment - Credit Card    │         │ €1,200  │
│  Mar 15     │ Invoice INV-2024-012     │ €1,000  │         │
│  ───────────┼──────────────────────────┼─────────┼─────────│
│             │ TOTALS                   │ €3,000  │ €2,000  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Payment is due within 30 days.                             │
│  Thank you for your business!                               │
└─────────────────────────────────────────────────────────────┘
```

---

#### F. Time Tracking Report

**Purpose:** Track billable hours by lawyer/activity type

**Formats:** PDF, Excel

**Content:**
```
┌─────────────────────────────────────────────────────────────┐
│              TIME TRACKING REPORT                           │
│              Period: March 2024                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SUMMARY                                                    │
│  ─────────────────────────────────────────────────────      │
│  Total Hours Logged:          145.5 hours                   │
│  Billable Hours:              128.0 hours (88%)             │
│  Non-Billable Hours:          17.5 hours  (12%)             │
│  Total Billing Value:         €19,200.00                    │
│                                                             │
│  BY LAWYER                                                  │
│  ─────────────────────────────────────────────────────      │
│  Lawyer          │ Hours  │ Billable │ Rate   │ Value      │
│  ────────────────┼────────┼──────────┼────────┼────────────│
│  John Lawyer     │ 80.0   │ 72.0     │ €150   │ €10,800    │
│  Jane Attorney   │ 45.5   │ 40.0     │ €175   │ €7,000     │
│  Bob Associate   │ 20.0   │ 16.0     │ €100   │ €1,600     │
│                                                             │
│  BY ACTIVITY TYPE                                           │
│  ─────────────────────────────────────────────────────      │
│  Consultations:               52.0 hours  (36%)             │
│  Court Appearances:           35.0 hours  (24%)             │
│  Document Preparation:        28.0 hours  (19%)             │
│  Research:                    18.5 hours  (13%)             │
│  Communications:              12.0 hours  (8%)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.3 Export Formats

| Format | Use Case | Library |
|--------|----------|---------|
| **CSV** | Simple data export, Excel compatible | Native JS |
| **XLSX** | Excel with formatting | `exceljs` |
| **PDF** | Professional reports, print-ready | `pdfkit` (already installed) |

---

### 2.4 Export UI Integration

#### In Global Billing Page Header:
```
[📥 Export ▼]
  ├── Export Invoices (CSV)
  ├── Export Invoices (Excel)
  ├── Payment Report (PDF)
  ├── Revenue Report (PDF)
  └── Aging Report (PDF)
```

#### In Client Page:
```
[📥 Export ▼]
  ├── Client Statement (PDF)
  └── All Invoices (Excel)
```

#### In Dashboard:
```
[📊 Reports ▼]
  ├── Monthly Revenue Report
  ├── Quarterly Summary
  ├── Time Tracking Report
  └── Aging Report
```

---

## 3. Implementation Plan

### Phase 1: Global Billing Page (Estimated: 1-2 days)

| Step | Task | Backend | Frontend |
|------|------|---------|----------|
| 1 | Create API endpoint for all invoices | ✅ | |
| 2 | Add summary statistics endpoint | ✅ | |
| 3 | Create GlobalBilling page component | | ✅ |
| 4 | Add filters and search | ✅ | ✅ |
| 5 | Add pagination | ✅ | ✅ |
| 6 | Add quick actions (PDF, Email, Payment) | | ✅ |
| 7 | Add to sidebar navigation | | ✅ |

### Phase 2: Export Features (Estimated: 1-2 days)

| Step | Task | Backend | Frontend |
|------|------|---------|----------|
| 1 | Install exceljs package | ✅ | |
| 2 | Create ExportService | ✅ | |
| 3 | Invoice list CSV/Excel export | ✅ | ✅ |
| 4 | Payment report PDF | ✅ | ✅ |
| 5 | Aging report PDF | ✅ | ✅ |
| 6 | Revenue report PDF | ✅ | ✅ |
| 7 | Client statement PDF | ✅ | ✅ |

---

## 4. Database Queries

### All Invoices with Client Info
```sql
SELECT 
  i.*,
  c.first_name || ' ' || c.last_name AS client_name,
  c.email AS client_email,
  d.dossier_number
FROM invoices i
JOIN dossiers d ON i.dossier_id = d.id
JOIN clients c ON d.client_id = c.id
WHERE i.organization_id = :orgId
ORDER BY i.issue_date DESC;
```

### Billing Summary
```sql
SELECT 
  COUNT(*) AS total_invoices,
  SUM(total_amount) AS total_invoiced,
  SUM(amount_paid) AS total_paid,
  SUM(total_amount - amount_paid) AS outstanding,
  SUM(CASE WHEN due_date < NOW() AND status NOT IN ('paid', 'cancelled') 
      THEN total_amount - amount_paid ELSE 0 END) AS overdue
FROM invoices
WHERE organization_id = :orgId;
```

### Aging Report
```sql
SELECT 
  CASE 
    WHEN due_date >= CURRENT_DATE THEN 'current'
    WHEN due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30'
    WHEN due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60'
    WHEN due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90'
    ELSE '90+'
  END AS aging_bucket,
  SUM(total_amount - amount_paid) AS amount
FROM invoices
WHERE status NOT IN ('paid', 'cancelled')
  AND organization_id = :orgId
GROUP BY aging_bucket;
```

---

## 5. API Endpoints

### Global Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/billing/invoices` | All invoices (paginated, filtered) |
| GET | `/api/billing/summary` | Summary statistics |
| GET | `/api/billing/overdue` | Overdue invoices |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/invoices?format=csv` | Export invoices as CSV |
| GET | `/api/export/invoices?format=xlsx` | Export invoices as Excel |
| GET | `/api/export/payments?format=pdf` | Payment report PDF |
| GET | `/api/export/revenue?period=monthly` | Revenue report PDF |
| GET | `/api/export/aging` | Aging report PDF |
| GET | `/api/export/client/:id/statement` | Client statement PDF |
| GET | `/api/export/timetracking` | Time tracking report |

---

## Notes

- All exports should include the company header/branding from Settings
- PDF exports should use the same styling as invoice PDFs
- Consider adding scheduled report generation (daily/weekly email)
- Multi-tenant: All queries must filter by `organization_id`
