# Open Implementation Points

> Items identified during development that need investigation and implementation.
> Created: 2026-04-20

---

## 1. Generated Document — Link to Correct Dossier

**Issue:**
When an org admin or lawyer generates a document from a template, the generated document must be attached exactly to the dossier of the organization that is creating it — not stored generically.

**What to check:**
- Verify the `dossier_id` and `organization_id` are correctly passed and saved when generating a document from a template
- Confirm the document appears under the correct dossier in the dossier's document list
- Ensure the multi-tenant isolation is respected (organization_id enforced on the generated document row)

---

## 2. Billing Option When Generating Document from Template

**Issue:**
When uploading a document manually, there is an existing billing option (attach billing entry, hours, rate, etc.). This same billing option is missing when generating a document from a template.

**What to implement:**
- Add the same billing fields to the "Generate Document" modal in `DocumentsList.js`
- On generation, create the corresponding billing/timeline entry just as the manual upload flow does
- Keep it optional (not all generated documents need billing)

---

## 3. Search — Stops After First Letter Match

**Issue:**
The search functionality currently stops or filters incorrectly after the first letter is typed — it does not continue refining results as the user types more characters.

**What to investigate:**
- Check the search input debounce and query logic across pages (Clients, Dossiers, Documents)
- Verify the `Op.iLike` pattern is using `%term%` correctly on each keystroke
- Check if there is a state reset or early return interrupting the search after the first character
- Test across all pages where search is present

---

## 4. Quick Actions Buttons — Review and Fix

**Issue:**
Quick Actions buttons need a full review. Behavior or routing may be incorrect, missing, or inconsistent.

**What to investigate:**
- Check all Quick Action buttons on the Dashboard
- Verify each button routes to the correct page or triggers the correct modal
- Check permissions — buttons should respect role-based access (admin, lawyer, secretary)
- Check that disabled states are applied when the user lacks the required permission

---

## 5. Mobile / Tablet Adaptation

**Issue:**
The current UI is built primarily for desktop. Layout, navigation, and interactions need to be adapted for mobile and tablet screen sizes.

**What to implement:**
- Audit all pages for responsive breakpoints (sm, md, lg) using Tailwind classes
- Sidebar navigation — convert to a collapsible drawer/hamburger menu on mobile
- Tables (Clients, Dossiers, Invoices) — adapt to card-based layout or horizontal scroll on small screens
- Modals — ensure they are full-screen or properly sized on mobile
- Forms — input fields, date pickers, and dropdowns must be touch-friendly
- Document preview modal — adapt for mobile viewport
- Test on common breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop)

---

## 6. Multilanguage Support

**Issue:**
LexBox currently only supports English. Law firms in Luxembourg and surrounding regions may require French, German, or Luxembourgish interfaces.

**What to implement:**
- Integrate an i18n library (e.g. `react-i18next`) on the frontend
- Extract all UI strings into translation files (e.g. `en.json`, `fr.json`, `de.json`)
- Add a language selector in user Settings or the top navigation bar
- Store the user's preferred language in their profile or localStorage
- Backend error messages and email templates should also support multiple languages
- Priority languages: English (default), French, German

---
