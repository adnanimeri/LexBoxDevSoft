// ===================================================================
// CALENDAR CONTROLLER
// ===================================================================
// Merges: CalendarEvents + TimelineNodes + Invoice due dates

const { Op } = require('sequelize');
const CalendarEvent = require('../models/CalendarEvent');
const TimelineNode = require('../models/TimelineNode');
const Invoice = require('../models/Invoice');
const Dossier = require('../models/Dossier');
const Client = require('../models/Client');
const User = require('../models/User');

// FullCalendar event colors per type
const TYPE_COLORS = {
  court_hearing:   '#EF4444', // red
  meeting:         '#F59E0B', // yellow/amber
  consultation:    '#10B981', // green
  filing_deadline: '#3B82F6', // blue
  milestone:       '#8B5CF6', // purple
  invoice_due:     '#374151', // dark gray
  task:            '#6B7280', // gray
  other:           '#64748B'
};

// Maps timeline activity_type → calendar event_type
const ACTIVITY_TO_EVENT_TYPE = {
  court_hearing:   'court_hearing',
  meeting:         'meeting',
  consultation:    'consultation',
  document_filing: 'filing_deadline',
  phone_call:      'meeting',
  email:           'task',
  research:        'task',
  drafting:        'task',
  review:          'task',
  negotiation:     'meeting',
  other:           'task'
};

function buildFCEvent(id, title, start, end, type, allDay, source, extras, colorOverride) {
  const color = colorOverride || TYPE_COLORS[type] || TYPE_COLORS.task;
  return {
    id,
    title,
    start,
    end: end || undefined,
    allDay: !!allDay,
    backgroundColor: color,
    borderColor: color,
    textColor: '#ffffff',
    extendedProps: { type, source, ...extras }
  };
}

/**
 * GET /api/calendar/events?start=&end=&type=&lawyer_id=
 * Returns merged events from all sources for the org
 */
const getEvents = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    if (!orgId) return res.status(403).json({ success: false, message: 'Organization membership required' });

    const { start, end, type, lawyer_id } = req.query;

    const now = new Date();
    const startDate = start ? new Date(start) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate   = end   ? new Date(end)   : new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const events = [];

    // ----------------------------------------------------------------
    // 1. Standalone calendar events
    // ----------------------------------------------------------------
    const calWhere = {
      organization_id: orgId,
      start_date: { [Op.between]: [startDate, endDate] }
    };
    if (type && type !== 'invoice_due') calWhere.event_type = type;

    const calEvents = await CalendarEvent.findAll({
      where: calWhere,
      include: [
        {
          model: Dossier,
          as: 'eventDossier',
          attributes: ['id', 'dossier_number', 'title'],
          required: false,
          include: [{ model: Client, as: 'client', attributes: ['id', 'first_name', 'last_name'], required: false }]
        },
        {
          model: Client,
          as: 'eventClient',
          attributes: ['id', 'first_name', 'last_name'],
          required: false
        },
        {
          model: User,
          as: 'eventCreator',
          attributes: ['id', 'first_name', 'last_name'],
          required: false
        }
      ]
    });

    calEvents.forEach(ev => {
      events.push(buildFCEvent(
        `cal-${ev.id}`,
        ev.title,
        ev.start_date,
        ev.end_date,
        ev.event_type,
        ev.is_all_day,
        'calendar',
        {
          calendarEventId: ev.id,
          description: ev.description,
          location: ev.location,
          dossier: ev.eventDossier,
          client: ev.eventClient || ev.eventDossier?.client || null,
          createdBy: ev.eventCreator,
          canEdit: true
        },
        ev.color
      ));
    });

    // ----------------------------------------------------------------
    // 2. Timeline nodes with dates (activities)
    // ----------------------------------------------------------------
    const tlNodeWhere = {
      activity_date: { [Op.between]: [startDate, endDate] },
      node_type: 'activity'
    };

    // Filter by event type → map back to activity_types
    if (type && type !== 'invoice_due') {
      const matchingActivityTypes = Object.entries(ACTIVITY_TO_EVENT_TYPE)
        .filter(([, evType]) => evType === type)
        .map(([actType]) => actType);

      tlNodeWhere.activity_type = matchingActivityTypes.length > 0
        ? { [Op.in]: matchingActivityTypes }
        : { [Op.in]: ['__none__'] }; // return nothing for type mismatches
    }

    const dossierWhere = { organization_id: orgId };
    if (lawyer_id) dossierWhere.assigned_to = lawyer_id;

    const timelineNodes = await TimelineNode.findAll({
      where: tlNodeWhere,
      include: [{
        model: Dossier,
        as: 'dossier',
        required: true,
        where: dossierWhere,
        attributes: ['id', 'dossier_number', 'title'],
        include: [{
          model: Client,
          as: 'client',
          attributes: ['id', 'first_name', 'last_name']
        }]
      }, {
        model: User,
        as: 'creator',
        attributes: ['id', 'first_name', 'last_name'],
        required: false
      }]
    });

    timelineNodes.forEach(node => {
      const eventType = ACTIVITY_TO_EVENT_TYPE[node.activity_type] || 'task';
      const client = node.dossier?.client;
      const clientName = client ? `${client.first_name} ${client.last_name}` : '';
      events.push(buildFCEvent(
        `tl-${node.id}`,
        `${node.title}${clientName ? ` — ${clientName}` : ''}`,
        node.activity_date,
        null,
        eventType,
        false,
        'timeline',
        {
          timelineNodeId: node.id,
          activityType: node.activity_type,
          description: node.description,
          status: node.status,
          hoursWorked: node.hours_worked,
          dossier: node.dossier,
          client,
          createdBy: node.creator,
          canEdit: false
        }
      ));
    });

    // ----------------------------------------------------------------
    // 3. Invoice due dates
    // ----------------------------------------------------------------
    if (!type || type === 'invoice_due') {
      const invoiceDossierWhere = {};
      if (lawyer_id) invoiceDossierWhere.assigned_to = lawyer_id;

      const invoices = await Invoice.findAll({
        where: {
          organization_id: orgId,
          due_date: { [Op.between]: [startDate, endDate] },
          status: { [Op.notIn]: ['draft', 'cancelled'] }
        },
        include: [{
          model: Dossier,
          as: 'dossier',
          required: true,
          where: invoiceDossierWhere,
          attributes: ['id', 'dossier_number', 'title'],
          include: [{
            model: Client,
            as: 'client',
            attributes: ['id', 'first_name', 'last_name']
          }]
        }]
      });

      invoices.forEach(inv => {
        const client = inv.dossier?.client;
        const clientName = client ? `${client.first_name} ${client.last_name}` : '';
        events.push(buildFCEvent(
          `inv-${inv.id}`,
          `Due: ${inv.invoice_number}${clientName ? ` — ${clientName}` : ''}`,
          inv.due_date,
          null,
          'invoice_due',
          true,
          'invoice',
          {
            invoiceId: inv.id,
            invoiceNumber: inv.invoice_number,
            amount: inv.total_amount,
            invoiceStatus: inv.status,
            dossier: inv.dossier,
            client,
            canEdit: false
          }
        ));
      });
    }

    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/calendar/upcoming
 * Next 7 days events
 */
const getUpcoming = async (req, res, next) => {
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  req.query = { ...req.query, start: now.toISOString(), end: in7.toISOString() };
  return getEvents(req, res, next);
};

/**
 * POST /api/calendar/events
 */
const createEvent = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const { title, description, event_type, start_date, end_date, is_all_day, location, dossier_id, client_id, color } = req.body;

    if (!title || !start_date) {
      return res.status(400).json({ success: false, message: 'Title and start date are required' });
    }

    const event = await CalendarEvent.create({
      organization_id: orgId,
      title,
      description,
      event_type: event_type || 'task',
      start_date,
      end_date: end_date || null,
      is_all_day: !!is_all_day,
      location,
      dossier_id: dossier_id || null,
      client_id: client_id || null,
      color: color || null,
      created_by: req.user.id
    });

    res.status(201).json({ success: true, data: event, message: 'Event created successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/calendar/events/:id
 */
const updateEvent = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const event = await CalendarEvent.findOne({ where: { id: req.params.id, organization_id: orgId } });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const { title, description, event_type, start_date, end_date, is_all_day, location, dossier_id, client_id, color } = req.body;
    await event.update({
      title,
      description: description || null,
      event_type: event_type || event.event_type,
      start_date,
      end_date:   end_date   || null,
      is_all_day: !!is_all_day,
      location:   location   || null,
      dossier_id: dossier_id ? parseInt(dossier_id, 10) : null,
      client_id:  client_id  ? parseInt(client_id,  10) : null,
      color:      color      || null
    });

    res.json({ success: true, data: event, message: 'Event updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/calendar/events/:id
 */
const deleteEvent = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const event = await CalendarEvent.findOne({ where: { id: req.params.id, organization_id: orgId } });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    await event.destroy();
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents, getUpcoming, createEvent, updateEvent, deleteEvent };
