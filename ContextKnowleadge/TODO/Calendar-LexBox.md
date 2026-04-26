# 2. Calendar Integration

## 2.1 Overview

A visual calendar displaying all scheduled events, deadlines, court dates, and appointments across all dossiers. Provides an at-a-glance view of upcoming activities and helps prevent scheduling conflicts.

## 2.2 Calendar Views

### 2.2.1 Month View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📅 Calendar                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐                                                           │
│  │ [Today]      │  [<]  April 2024  [>]     [Month] [Week] [Day] [Agenda]  │
│  └──────────────┘                                                           │
│                                                                             │
│  Filters: [All Types ▼] [All Lawyers ▼] [All Clients ▼]                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    Sun       Mon       Tue       Wed       Thu       Fri       Sat         │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐   │
│  │    31   │    1    │    2    │    3    │    4    │    5    │    6    │   │
│  │         │         │         │ ┌─────┐ │         │         │         │   │
│  │         │         │         │ │🔴Crt│ │         │         │         │   │
│  │         │         │         │ │Smith│ │         │         │         │   │
│  │         │         │         │ └─────┘ │         │         │         │   │
│  ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤   │
│  │    7    │    8    │    9    │   10    │   11    │   12    │   13    │   │
│  │         │ ┌─────┐ │         │         │ ┌─────┐ │ ┌─────┐ │         │   │
│  │         │ │🟡Mtg│ │         │         │ │🔴Crt│ │ │⚫Due│ │         │   │
│  │         │ │ABC  │ │         │         │ │Doe  │ │ │Inv #│ │         │   │
│  │         │ └─────┘ │         │         │ └─────┘ │ └─────┘ │         │   │
│  ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤   │
│  │   14    │   15    │   16    │   17    │   18    │   19    │   20    │   │
│  │         │ ┌─────┐ │ ┌─────┐ │         │         │         │         │   │
│  │         │ │🟢Apt│ │ │🔵Fil│ │         │         │         │         │   │
│  │         │ │Jane │ │ │Court│ │         │         │         │         │   │
│  │         │ │10:00│ │ │     │ │         │         │         │         │   │
│  │         │ └─────┘ │ └─────┘ │         │         │         │         │   │
│  ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤   │
│  │   21    │   22    │   23    │   24    │   25    │   26    │   27    │   │
│  │         │ ┌─────┐ │         │         │ ┌─────┐ │         │         │   │
│  │         │ │🟣Mls│ │         │         │ │🟡Mtg│ │         │         │   │
│  │         │ │Trial│ │         │         │ │NewCl│ │         │         │   │
│  │         │ └─────┘ │         │         │ └─────┘ │         │         │   │
│  ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤   │
│  │   28    │   29    │   30    │    1    │    2    │    3    │    4    │   │
│  │         │         │ ┌─────┐ │         │         │         │         │   │
│  │         │         │ │⚫Due│ │         │         │         │         │   │
│  │         │         │ │Pay  │ │         │         │         │         │   │
│  │         │         │ └─────┘ │         │         │         │         │   │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘   │
│                                                                             │
│  Legend: 🔴 Court  🟡 Meeting  🟢 Consultation  🔵 Filing  🟣 Milestone  ⚫ Due│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2.2 Week View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📅 Calendar - Week of April 8-14, 2024                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│        │ Mon 8    │ Tue 9    │ Wed 10   │ Thu 11   │ Fri 12   │ Sat 13   │ │
│  ──────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤ │
│  08:00 │          │          │          │          │          │          │ │
│  ──────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤ │
│  09:00 │ ┌──────┐ │          │          │ ┌──────┐ │          │          │ │
│        │ │ 🟡   │ │          │          │ │ 🔴   │ │          │          │ │
│  10:00 │ │ Mtg  │ │          │          │ │ Crt  │ │          │          │ │
│        │ │ ABC  │ │          │          │ │ Doe  │ │          │          │ │
│  11:00 │ │ Corp │ │          │          │ │ Case │ │          │          │ │
│        │ └──────┘ │          │          │ └──────┘ │          │          │ │
│  12:00 │          │          │          │          │          │          │ │
│  ──────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤ │
│  13:00 │          │          │          │          │          │          │ │
│  ──────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤ │
│  14:00 │          │ ┌──────┐ │          │          │ ┌──────┐ │          │ │
│        │          │ │ 🟢   │ │          │          │ │ 🔵   │ │          │ │
│  15:00 │          │ │ Appt │ │          │          │ │ File │ │          │ │
│        │          │ │ Smith│ │          │          │ │ Motio│ │          │ │
│  16:00 │          │ └──────┘ │          │          │ └──────┘ │          │ │
│  ──────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤ │
│  17:00 │          │          │          │          │          │          │ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2.3 Day View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📅 Thursday, April 11, 2024                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  08:00  ─────────────────────────────────────────────────────────    │  │
│  │                                                                      │  │
│  │  09:00  ┌────────────────────────────────────────────────────────┐   │  │
│  │         │ 🔴 Court Hearing                                       │   │  │
│  │  09:30  │                                                        │   │  │
│  │         │ 📋 Doe vs. State                                       │   │  │
│  │  10:00  │ 📁 DOS-2024-002                                        │   │  │
│  │         │ 👤 Client: Jane Doe                                    │   │  │
│  │  10:30  │ 📍 District Court, Room 5A                             │   │  │
│  │         │ ⚖️ Assigned: John Lawyer                               │   │  │
│  │  11:00  │                                                        │   │  │
│  │         │ Notes: Bring evidence folder A-3                       │   │  │
│  │  11:30  └────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │  12:00  ─────────────────────────────────────────────────────────    │  │
│  │                                                                      │  │
│  │  13:00  ─────────────────────────────────────────────────────────    │  │
│  │                                                                      │  │
│  │  14:00  ┌────────────────────────────────────────────────────────┐   │  │
│  │         │ 🟡 Client Meeting                                      │   │  │
│  │  14:30  │                                                        │   │  │
│  │         │ 📋 Contract Review                                     │   │  │
│  │  15:00  │ 📁 DOS-2024-005                                        │   │  │
│  │         │ 👤 Client: ABC Corporation                             │   │  │
│  │  15:30  │ 📍 Office - Meeting Room 2                             │   │  │
│  │         └────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │  16:00  ─────────────────────────────────────────────────────────    │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2.4 Agenda View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📅 Upcoming Events                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TODAY - Thursday, April 11                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  │                                                                          │
│  │  🔴 09:00 - 11:30  Court Hearing - Doe vs. State                        │
│  │     📁 DOS-2024-002 • 👤 Jane Doe • 📍 District Court, Room 5A          │
│  │                                                                          │
│  │  🟡 14:00 - 15:30  Client Meeting - Contract Review                     │
│  │     📁 DOS-2024-005 • 👤 ABC Corporation • 📍 Office - Meeting Room 2   │
│  │                                                                          │
│                                                                             │
│  TOMORROW - Friday, April 12                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  │                                                                          │
│  │  ⚫ All Day       Invoice Due - INV-2024-008                            │
│  │     📁 DOS-2024-001 • 👤 John Smith • €1,500.00                         │
│  │                                                                          │
│  │  🔵 14:00 - 15:00  Filing Deadline - Motion to Dismiss                  │
│  │     📁 DOS-2024-003 • 👤 XYZ Corp                                       │
│  │                                                                          │
│                                                                             │
│  NEXT WEEK - April 15-21                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  │                                                                          │
│  │  Mon 15  🟢 10:00  Initial Consultation - New Client Intake             │
│  │  Tue 16  🔵 All Day Filing Deadline - Appeal Brief                      │
│  │  Wed 17  🟡 14:00  Meeting - Case Strategy Review                       │
│  │  Thu 18  🔴 09:00  Court Hearing - Smith vs. Johnson                    │
│  │                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.3 Event Details Sidebar

```
┌────────────────────────────────────────┐
│  🔴 Court Hearing                  [X] │
├────────────────────────────────────────┤
│                                        │
│  Doe vs. State                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                        │
│  📅 Date                               │
│  Thursday, April 11, 2024              │
│                                        │
│  🕐 Time                               │
│  9:00 AM - 11:30 AM (2.5 hours)        │
│                                        │
│  📍 Location                           │
│  District Court                        │
│  123 Justice Street, Room 5A           │
│                                        │
│  📁 Dossier                            │
│  DOS-2024-002                          │
│                                        │
│  👤 Client                             │
│  Jane Doe                              │
│  📧 jane@example.com                   │
│  📱 +1 555-123-4567                    │
│                                        │
│  ⚖️ Assigned Lawyer                    │
│  John Lawyer                           │
│                                        │
│  📝 Notes                              │
│  ──────────────────────────────────    │
│  - Bring evidence folder A-3           │
│  - Witness: Mary Johnson confirmed     │
│  - Review deposition transcript        │
│                                        │
│  🔗 Related Documents                  │
│  ──────────────────────────────────    │
│  📄 Evidence_Folder_A3.pdf             │
│  📄 Witness_Statement_MJ.pdf           │
│  📄 Deposition_Transcript.pdf          │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  [View Dossier] [Edit] [Delete]        │
│                                        │
└────────────────────────────────────────┘
```

## 2.4 Quick Add Event Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  ➕ Add Calendar Event                                     [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Event Type *                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔴 Court Hearing                                      ▼ │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔴 Court Hearing                                        │   │
│  │ 🟡 Client Meeting                                       │   │
│  │ 🟢 Consultation                                         │   │
│  │ 🔵 Filing Deadline                                      │   │
│  │ 🟣 Milestone                                            │   │
│  │ ⚫ Invoice Due                                          │   │
│  │ 📋 Task/Reminder                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Title *                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Doe vs. State - Initial Hearing                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Client/Dossier *                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search client or dossier...                          │   │
│  │                                                          │   │
│  │  Jane Doe (DOS-2024-002)                          ← sel │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Date *                          Time                           │
│  ┌───────────────────────┐      ┌───────────┐ ┌───────────┐    │
│  │ 📅 April 11, 2024     │      │ 09:00 AM  │ │ 11:30 AM  │    │
│  └───────────────────────┘      └───────────┘ └───────────┘    │
│                                 Start          End              │
│                                                                 │
│  ☐ All-day event                                                │
│                                                                 │
│  Location                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ District Court, Room 5A                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Description / Notes                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Bring evidence folder A-3                               │   │
│  │ Witness: Mary Johnson confirmed                         │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Reminder                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1 day before                                          ▼ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ☑️ Add to Timeline                                             │
│  ☐ Recurring event                                              │
│                                                                 │
│                         [Cancel]    [Create Event]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 2.5 Event Types & Colors

| Type | Color | Icon | Source | Description |
|------|-------|------|--------|-------------|
| Court Hearing | 🔴 Red | ⚖️ | Timeline | Court appearances, hearings, trials |
| Meeting | 🟡 Yellow | 👥 | Timeline | Client meetings, internal meetings |
| Consultation | 🟢 Green | 💬 | Timeline | Initial consultations, phone calls |
| Filing Deadline | 🔵 Blue | 📁 | Timeline | Document submission deadlines |
| Milestone | 🟣 Purple | 🎯 | Timeline | Case milestones, important dates |
| Invoice Due | ⚫ Black | 💰 | Invoice | Payment due dates |
| Task/Reminder | ⚪ Gray | ✓ | New | General reminders |

## 2.6 Data Sources

### Events from Timeline Nodes (Existing Data!)
```javascript
// Timeline activities with dates become calendar events
{
  node_type: 'activity',
  activity_type: 'court_hearing', // → 🔴 Court
  activity_type: 'meeting',       // → 🟡 Meeting
  activity_type: 'consultation',  // → 🟢 Consultation
  activity_type: 'filing',        // → 🔵 Filing
  node_type: 'milestone',         // → 🟣 Milestone
  activity_date: '2024-04-11',
  title: 'Court Hearing - Doe vs State',
  description: 'Initial hearing...',
}
```

### Events from Invoices
```javascript
// Invoice due dates become calendar events
{
  type: 'invoice_due',            // → ⚫ Due
  date: invoice.due_date,
  title: `Invoice Due - ${invoice.invoice_number}`,
  amount: invoice.total_amount,
}
```

## 2.7 Database Schema

### Calendar Events Table (Optional - for standalone events)

```sql
CREATE TABLE calendar_events (
  id SERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Event Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL,
  
  -- Timing
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  is_all_day BOOLEAN DEFAULT false,
  
  -- Location
  location VARCHAR(255),
  
  -- Links
  dossier_id INTEGER REFERENCES dossiers(id),
  client_id INTEGER REFERENCES clients(id),
  timeline_node_id INTEGER REFERENCES timeline_nodes(id),
  invoice_id INTEGER REFERENCES invoices(id),
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule VARCHAR(255), -- RRULE format
  
  -- Reminders
  reminder_minutes INTEGER[], -- [1440, 60] = 1 day and 1 hour before
  
  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_org ON calendar_events(organization_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_dossier ON calendar_events(dossier_id);
```

## 2.8 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/events` | Get events (with date range, filters) |
| GET | `/api/calendar/events/:id` | Get single event |
| POST | `/api/calendar/events` | Create event |
| PUT | `/api/calendar/events/:id` | Update event |
| DELETE | `/api/calendar/events/:id` | Delete event |
| GET | `/api/calendar/upcoming` | Upcoming events (next 7 days) |
| GET | `/api/calendar/export/ical` | Export to iCal format |

## 2.9 Frontend Library

Recommended: **FullCalendar** (React)
- https://fullcalendar.io/docs/react
- Month/Week/Day/Agenda views built-in
- Drag & drop support
- Responsive design

```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list @fullcalendar/interaction
```

---