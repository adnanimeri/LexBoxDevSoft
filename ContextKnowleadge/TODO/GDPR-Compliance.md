# LexBox — GDPR Compliance & Anonymization Strategy

## Status: Planned — Not Yet Implemented

---

## 1. Chosen Approach: Option A — Pure Anonymization

LexBox implements GDPR's Right to Erasure (Article 17) through **pure anonymization** — no database records or document metadata rows are deleted. Personal data is replaced with anonymous placeholders, making the data subject no longer identifiable. Anonymized data falls entirely outside the scope of GDPR.

This approach is chosen over hard deletion because:
- Law firms have **statutory record-keeping obligations** (typically 5–10 years depending on jurisdiction)
- Financial/invoice records must be retained for tax authority compliance
- Hard deletion breaks referential integrity (foreign key chains across dossiers, invoices, timeline nodes)
- Anonymization provides a provable GDPR compliance trail

> **Warning displayed to org admin before requesting deletion:**
> *"Deleting client dossiers may conflict with statutory record-keeping obligations. Ensure compliance with applicable law before proceeding."*

---

## 2. Deletion Request Workflow

### From the Organization Side (Org Admin)

1. Org admin navigates to **Settings → Danger Zone** tab
2. Reads the legal warning about statutory retention obligations
3. Clicks **"Request Account Deletion"**
4. Confirms by typing the organization name exactly
5. Optionally provides a reason (e.g. "Switching to another platform", "GDPR erasure request")
6. Submits the request
7. Receives on-screen confirmation: *"Your deletion request has been received. Our team will process it within 30 days as required by GDPR."*
8. Email notification sent to the org admin confirming the request was received
9. The org account remains **fully functional** while the request is pending

### From the Super Admin Side

1. Super admin sees a **Deletion Requests** queue in the Super Admin panel
2. Each request shows:
   - Organization name and contact email
   - Date of request and reason provided
   - Summary: number of users, clients, dossiers, documents, invoices
   - Outstanding invoices (if any — must be settled before deletion)
3. Super admin reviews the request
4. Super admin either:
   - **Approves** → anonymization executes immediately
   - **Rejects** → provides a reason, notification sent back to org admin
5. On approval, a confirmation prompt requires typing `ANONYMIZE` to proceed
6. Anonymization runs as a single database transaction
7. Super admin receives a completion report showing what was anonymized

---

## 3. What Happens to Each Piece of Data

| Data | Before Anonymization | After Anonymization |
|---|---|---|
| Organization name | Jadaco Law Firm | `[Deleted Organization]` |
| Organization email | jadaco@firm.com | `deleted-{uuid}@removed.com` |
| Organization phone | +352 123 456 | `[deleted]` |
| Organization address | 12 Rue de la Loi | `[deleted]` |
| Organization tax ID | LU12345678 | `[deleted]` |
| Organization status | active | `deleted` |
| User first/last name | John Smith | `[Deleted User]` |
| User username | jsmith | `deleted-{uuid}` |
| User email | john@jadaco.com | `deleted-{uuid}@removed.com` |
| User account | active | `is_active: false` |
| Client first/last name | Marie Dupont | `[Deleted Client]` |
| Client email | marie@email.com | `[deleted]` |
| Client phone | +352 987 654 | `[deleted]` |
| Client personal number | 1984052312345 | `[deleted]` |
| Client address | 5 Avenue de la Gare | `[deleted]` |
| Client notes | Free text about the client | `[deleted]` |
| Dossier title | "Case for Marie Dupont" | `[Deleted Dossier]` |
| Dossier description | Free text (may contain personal data) | `[deleted]` |
| Dossier number | DOS-2024-001 | Intact (non-personal reference code) |
| Dossier status/type/priority | Intact | Intact (no personal data) |
| Dossier assigned lawyer (FK) | User record anonymized | Resolved via anonymized user |
| Dossier client (FK) | Client record anonymized | Resolved via anonymized client |
| Invoice number/amounts/dates | INV-2024-001, €2,400 | Intact (financial records required by law) |
| Invoice notes/description | May reference client name | `[deleted]` |
| Invoice line item description | "Consultation for Marie Dupont" | `[deleted]` |
| Invoice line item amounts | €150/hr, 4hrs | Intact (financial records required by law) |
| Payment reference number | REF-2024-XYZ | `[deleted]` |
| Payment notes | Free text, may contain personal data | `[deleted]` |
| Payment amount/date/method | Intact | Intact (financial records required by law) |
| Calendar event title | "Meeting with Marie Dupont" | `[Deleted Event]` |
| Calendar event description | Free text, may contain personal data | `[deleted]` |
| Calendar event location | "12 Avenue de la Gare" | `[deleted]` |
| Calendar event dates/type | Intact | Intact (no personal data) |
| Timeline node title/notes | May contain personal data | `[deleted]` |
| Timeline node type/date | Intact | Intact (no personal data) |
| Document original filename | "Marie_Dupont_Contract.pdf" | `[deleted]` |
| Document system filename | uuid-based filename | `[deleted]` |
| Document file path | /uploads/org-uuid/file.pdf | `[deleted]` |
| Document physical location | "Shelf B, Tray 3" | `[deleted]` |
| Document description | Free text, may contain personal data | `[deleted]` |
| Document metadata (JSONB) | Encryption keys, tags, etc. | `{}` (cleared) |
| Document files on disk | PDF/DOCX bytes on filesystem | **Permanently deleted from disk** |
| Document Template title/body | Generic templates created by org | `[Deleted Template]` / `[deleted]` |
| Document Template category | Intact | Intact (no personal data) |
| Subscription Invoice number/amounts | INV-SUB-2024-001, €49/mo | Intact (LexBox billing records, required by law) |
| Subscription Invoice notes | Free text payment notes | `[deleted]` |
| Subscription Invoice payment reference | REF-XYZ-2024 | `[deleted]` |
| Subscription Invoice payment notes | Free text | `[deleted]` |
| Subscription Invoice plan/dates/amounts | Intact | Intact (financial records required by law) |
| Settings (SMTP email/credentials) | smtp@jadaco.com, credentials | `[deleted]` |
| Settings (other config values) | App preferences, toggles | `[deleted]` (entire settings row removed) |
| Organization requests | status: approved | status: rejected, contact fields anonymized |
| Audit log entries | Intact | Intact (events preserved, identities anonymized) |

**Document files on disk are the only data permanently deleted.** This is required by GDPR because uploaded files (contracts, IDs, letters) directly contain personal data and cannot be anonymized in-place.

---

## 4. Why LexBox is GDPR Compliant

### Right to Erasure — Article 17

GDPR does not require physical deletion of data. It requires that data is **no longer attributable to an identified or identifiable natural person**. Anonymized data is explicitly excluded from GDPR scope (Recital 26). By replacing all personal identifiers with `[Deleted]` placeholders:

- No individual can be identified from the remaining data
- The right to erasure is fully satisfied
- No personal data remains in the system

### Lawful Basis for Processing — Article 6

LexBox processes organization data under:
- **Article 6(1)(b)** — processing necessary for the performance of a contract (subscription agreement)
- **Article 6(1)(c)** — processing necessary for compliance with a legal obligation (invoicing, VAT records)

### Data Minimization — Article 5(1)(c)

LexBox only collects data necessary for the platform to function:
- Organization contact info (for account management)
- User credentials (for authentication)
- Client personal data (entered by the law firm for their own legal work)

### Right of Access — Article 15

Organization admins can export their organization's data at any time (planned: data export feature).

### Data Retention

LexBox retains anonymized structural records (invoices, dossiers) for the minimum period required by applicable law:
- Financial records: retained as anonymized records (no personal data) to comply with accounting law
- Personal data: anonymized immediately upon approved deletion request, within 30 days of request as required by GDPR Article 17

### Data Processing Agreement

Law firms using LexBox act as **data controllers** for their clients' personal data. LexBox acts as a **data processor**. A Data Processing Agreement (DPA) should be in place between LexBox and each law firm subscriber, as required by Article 28.

### Security — Article 32

LexBox implements:
- AES-256-GCM encryption for sensitive documents (per-organization encryption keys)
- JWT authentication with short-lived access tokens
- Role-based access control (admin, lawyer, secretary)
- Multi-tenant data isolation (organization_id enforced at every query)
- HTTPS in production

---

## 5. Implementation Plan (When Ready to Build)

### Backend

1. Add `deletion_requested_at`, `deletion_request_reason`, `deletion_status` fields to `Organization` model
2. `POST /api/org/request-deletion` — org admin submits deletion request
3. `GET /api/super-admin/deletion-requests` — super admin views pending requests
4. `POST /api/super-admin/organizations/:id/anonymize` — triggers full anonymization transaction
5. `POST /api/super-admin/organizations/:id/reject-deletion` — rejects with reason
6. Anonymization service: single DB transaction replacing all personal fields, deletes files from disk
7. Email notifications: confirmation to org admin on request, outcome notification on approval/rejection

### Frontend

1. **Settings → Danger Zone tab** (org admin only)
   - Legal warning banner
   - Reason text field
   - Confirm by typing org name
   - Submit button
2. **Super Admin → Deletion Requests section**
   - Queue of pending requests with org summary
   - Approve (type `ANONYMIZE` to confirm) / Reject (with reason) actions
   - Completion report after anonymization

---

## 6. GDPR Timeline Requirements

| Event | Deadline |
|---|---|
| Acknowledge deletion request | Immediately (automated) |
| Complete anonymization | Within 30 days of request |
| Notify org admin of outcome | Within 30 days of request |
| Document the action (audit log) | At time of action |
