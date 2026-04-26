Three roles is the right number. The current ones are correct. Here's why each is justified:

Admin
The firm owner or managing partner. Full access to everything — users, settings, billing, all client data regardless of assignment. Only one or two per firm. This is already correct.

Lawyer (the core user)
Manages their own caseload. Creates/edits clients, dossiers, timeline entries, invoices. Should only see dossiers assigned to them (or all, depending on firm preference). This is the most common role.

Secretary (support role)
View-only on clients/dossiers. Can upload documents, schedule calendar events, create timeline entries. Cannot create invoices, change client data, or touch settings. This maps cleanly to a real legal secretary.

What I'd reconsider from the spec:

The spec gives Secretary "create timeline entries" — that's reasonable since they log meetings/calls. But I'd not give them invoice access at all, not even view. Billing is sensitive.

One role I'd add if the firm grows: Paralegal — between Lawyer and Secretary (can edit dossiers, draft invoices but not send). But for a small/medium firm, three roles is sufficient and keeps it simple.

Summary recommendation:

Admin	Lawyer	Secretary
Users & Settings	Full	None	None
Clients	Full	Full	View only
Dossiers	Full	Own + assigned	View only
Documents	Full	Full	Upload only
Timeline	Full	Full	Create only
Invoices	Full	Full	None
Calendar	Full	Full	Full
The current ENUM('admin', 'lawyer', 'secretary') is exactly right. The main work is enforcing these permissions properly — both backend middleware and frontend UI hiding — which is really the core of the user management feature.