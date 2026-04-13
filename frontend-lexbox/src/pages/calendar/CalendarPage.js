// ===================================================================
// CALENDAR PAGE
// ===================================================================
import React, { useState, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { calendarService } from '../../services/calendarService';
import { useNotification } from '../../context/NotificationContext';
import EventDetailModal from '../../components/calendar/EventDetailModal';
import AddEventModal from '../../components/calendar/AddEventModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// ----------------------------------------------------------------
// Legend / filter constants
// ----------------------------------------------------------------
const ALL_TYPES = [
  { value: '',               label: 'All Types',      color: '#6B7280' },
  { value: 'court_hearing',  label: 'Court Hearing',  color: '#EF4444' },
  { value: 'meeting',        label: 'Meeting',        color: '#F59E0B' },
  { value: 'consultation',   label: 'Consultation',   color: '#10B981' },
  { value: 'filing_deadline',label: 'Filing Deadline',color: '#3B82F6' },
  { value: 'milestone',      label: 'Milestone',      color: '#8B5CF6' },
  { value: 'invoice_due',    label: 'Invoice Due',    color: '#374151' },
  { value: 'task',           label: 'Task',           color: '#6B7280' }
];

// ----------------------------------------------------------------
// CalendarPage
// ----------------------------------------------------------------
const CalendarPage = () => {
  const calRef = useRef(null);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  // Filters
  const [typeFilter, setTypeFilter]     = useState('');
  const [dateRange, setDateRange]       = useState({ start: null, end: null });

  // Modals
  const [selectedEvent, setSelectedEvent]     = useState(null); // EventDetailModal
  const [addModal, setAddModal]               = useState({ open: false, date: null, edit: null });
  const [confirmModal, setConfirmModal]       = useState(null);

  // ----------------------------------------------------------------
  // Fetch events whenever dateRange or filter changes
  // ----------------------------------------------------------------
  const eventsQuery = useQuery({
    queryKey: ['calendar-events', dateRange, typeFilter],
    queryFn: () => calendarService.getEvents({
      start: dateRange.start,
      end:   dateRange.end,
      type:  typeFilter || undefined
    }),
    enabled: !!(dateRange.start && dateRange.end),
    select: (res) => res.data?.data || []
  });

  // ----------------------------------------------------------------
  // Mutations
  // ----------------------------------------------------------------
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['calendar-events'] });

  const createMutation = useMutation({
    mutationFn: calendarService.createEvent,
    onSuccess: () => { showSuccess('Event created'); invalidate(); },
    onError: (err) => showError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create event')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => calendarService.updateEvent(id, data),
    onSuccess: () => { showSuccess('Event updated'); invalidate(); setSelectedEvent(null); },
    onError: (err) => showError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update event')
  });

  const deleteMutation = useMutation({
    mutationFn: calendarService.deleteEvent,
    onSuccess: () => { showSuccess('Event deleted'); invalidate(); setSelectedEvent(null); },
    onError: (err) => showError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete event')
  });

  // ----------------------------------------------------------------
  // FullCalendar callbacks
  // ----------------------------------------------------------------
  const handleDatesSet = useCallback((info) => {
    setDateRange({ start: info.startStr, end: info.endStr });
  }, []);

  const handleEventClick = useCallback((info) => {
    setSelectedEvent(info.event);
  }, []);

  const handleDateClick = useCallback((info) => {
    setAddModal({ open: true, date: info.date, edit: null });
  }, []);

  // ----------------------------------------------------------------
  // Calendar navigation helpers (custom toolbar)
  // ----------------------------------------------------------------
  const calApi = () => calRef.current?.getApi();
  const prev   = () => calApi()?.prev();
  const next   = () => calApi()?.next();
  const today  = () => calApi()?.today();
  const setView = (view) => calApi()?.changeView(view);

  // ----------------------------------------------------------------
  // Save handler (create or update)
  // ----------------------------------------------------------------
  const handleSave = async (formData) => {
    try {
      if (addModal.edit) {
        const eventId = addModal.edit.extendedProps?.calendarEventId;
        await updateMutation.mutateAsync({ id: eventId, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch {
      // onError on each mutation already shows the notification — suppress re-throw
    }
  };

  // ----------------------------------------------------------------
  // Delete handler
  // ----------------------------------------------------------------
  const handleDeleteClick = () => {
    const eventId = selectedEvent?.extendedProps?.calendarEventId;
    if (!eventId) return;
    setConfirmModal({
      title: 'Delete Event',
      message: `Are you sure you want to delete "${selectedEvent.title}"?`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        setConfirmModal(null);
        deleteMutation.mutate(eventId);
      }
    });
  };

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-500">Court dates, meetings, deadlines, and invoice dues</p>
          </div>
        </div>
        <button
          onClick={() => setAddModal({ open: true, date: new Date(), edit: null })}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Type filter */}
        <div className="flex flex-wrap gap-2">
          {ALL_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                typeFilter === t.value
                  ? 'text-white border-transparent'
                  : 'text-gray-600 border-gray-200 bg-white hover:border-gray-300'
              }`}
              style={typeFilter === t.value ? { backgroundColor: t.color, borderColor: t.color } : {}}
            >
              <span
                className="w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: typeFilter === t.value ? 'white' : t.color }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom toolbar + Calendar */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Custom nav toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          {/* Prev / Today / Next */}
          <div className="flex items-center space-x-2">
            <button onClick={prev} className="p-1.5 rounded hover:bg-gray-100 text-gray-600">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={today} className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Today
            </button>
            <button onClick={next} className="p-1.5 rounded hover:bg-gray-100 text-gray-600">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* View switcher */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {[
              { key: 'dayGridMonth', label: 'Month' },
              { key: 'timeGridWeek', label: 'Week' },
              { key: 'timeGridDay',  label: 'Day' },
              { key: 'listMonth',    label: 'Agenda' }
            ].map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 border-r border-gray-200 last:border-0"
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading overlay */}
        {eventsQuery.isLoading && (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="md" />
          </div>
        )}

        {/* FullCalendar */}
        <div className="p-2">
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            height="auto"
            events={eventsQuery.data || []}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkClick="popover"
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            nowIndicator
            eventMouseEnter={(info) => { info.el.style.cursor = 'pointer'; }}
            listDayFormat={{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }}
            listDaySideFormat={false}
            noEventsContent={() => (
              <div className="text-center py-8 text-gray-400">
                No events in this period
              </div>
            )}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {ALL_TYPES.filter(t => t.value).map(t => (
          <div key={t.value} className="flex items-center space-x-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: t.color }} />
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => {
            setAddModal({ open: true, date: null, edit: selectedEvent });
            setSelectedEvent(null);
          }}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Add / Edit Modal */}
      <AddEventModal
        isOpen={addModal.open}
        onClose={() => setAddModal({ open: false, date: null, edit: null })}
        onSave={handleSave}
        initialDate={addModal.date}
        editEvent={addModal.edit}
      />

      {/* Confirm Delete Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default CalendarPage;
