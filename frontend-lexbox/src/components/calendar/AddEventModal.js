// ===================================================================
// ADD / EDIT CALENDAR EVENT MODAL
// ===================================================================
import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/apiService';

const EVENT_TYPES = [
  { value: 'court_hearing',   label: 'Court Hearing' },
  { value: 'meeting',         label: 'Meeting' },
  { value: 'consultation',    label: 'Consultation' },
  { value: 'filing_deadline', label: 'Filing Deadline' },
  { value: 'milestone',       label: 'Milestone' },
  { value: 'task',            label: 'Task / Reminder' }
];

// ----------------------------------------------------------------
// Helpers: split ISO string ↔ date + time parts
// ----------------------------------------------------------------
const pad = n => String(n).padStart(2, '0');

const toDatePart = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toTimePart = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Combine date + time into ISO-like string for the API
const combine = (datePart, timePart) => {
  if (!datePart) return '';
  return timePart ? `${datePart}T${timePart}` : datePart;
};

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
const AddEventModal = ({ isOpen, onClose, onSave, initialDate, editEvent }) => {
  const isEdit = !!editEvent;

  // Split start/end into date + time parts for better UX
  const [form, setForm] = useState({
    title:       '',
    event_type:  'meeting',
    start_date:  '',   // date part: YYYY-MM-DD
    start_time:  '',   // time part: HH:MM
    end_date:    '',
    end_time:    '',
    is_all_day:  false,
    location:    '',
    description: '',
    dossier_id:  '',
    color:       ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load dossiers for linking
  const { data: dossiersData } = useQuery({
    queryKey: ['dossiers-for-calendar'],
    queryFn: () => apiClient.get('/dossiers'),
    enabled: isOpen,
    select: (res) => res.data?.data || []
  });
  const dossiers = dossiersData || [];

  // Populate form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setErrors({});

    if (isEdit && editEvent) {
      const ep = editEvent.extendedProps || {};
      setForm({
        title:       editEvent.title || '',
        event_type:  ep.type || 'meeting',
        start_date:  toDatePart(editEvent.start),
        start_time:  editEvent.allDay ? '' : toTimePart(editEvent.start),
        end_date:    editEvent.end ? toDatePart(editEvent.end) : '',
        end_time:    editEvent.end && !editEvent.allDay ? toTimePart(editEvent.end) : '',
        is_all_day:  editEvent.allDay || false,
        location:    ep.location    || '',
        description: ep.description || '',
        dossier_id:  ep.dossier?.id || '',
        color:       editEvent.backgroundColor || ''
      });
    } else {
      const startDate = initialDate ? toDatePart(initialDate) : '';
      const startTime = initialDate ? toTimePart(initialDate) : '';
      setForm({
        title: '', event_type: 'meeting',
        start_date: startDate, start_time: startTime,
        end_date:   startDate, end_time:   startTime,   // pre-fill end = start
        is_all_day: false,
        location: '', description: '', dossier_id: '', color: ''
      });
    }
  }, [isOpen, isEdit, editEvent, initialDate]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // When start date/time changes → mirror to end if end is still empty or equals old start
  const handleStartDateChange = (val) => {
    setForm(prev => ({
      ...prev,
      start_date: val,
      // auto-fill end date if it was blank or identical to old start
      end_date: (!prev.end_date || prev.end_date === prev.start_date) ? val : prev.end_date
    }));
    setErrors(p => ({ ...p, start_date: '' }));
  };

  const handleStartTimeChange = (val) => {
    setForm(prev => ({
      ...prev,
      start_time: val,
      // auto-fill end time if it was blank or identical to old start time
      end_time: (!prev.end_time || prev.end_time === prev.start_time) ? val : prev.end_time
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title      = 'Title is required';
    if (!form.start_date)   errs.start_date = 'Start date is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    try {
      const startISO = combine(form.start_date, form.is_all_day ? '' : form.start_time);
      const endISO   = combine(form.end_date,   form.is_all_day ? '' : form.end_time);
      const payload = {
        title:       form.title,
        event_type:  form.event_type,
        start_date:  startISO || null,
        end_date:    endISO   || null,
        is_all_day:  form.is_all_day,
        location:    form.location    || null,
        description: form.description || null,
        dossier_id:  form.dossier_id  || null,
        color:       form.color       || null
      };
      await onSave(payload);
      onClose();
    } catch {
      // error already shown via mutation onError
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit Event' : 'Add Calendar Event'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={form.event_type}
              onChange={e => set('event_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {EVENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => { set('title', e.target.value); setErrors(p => ({ ...p, title: '' })); }}
              placeholder="Event title"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />{errors.title}
              </p>
            )}
          </div>

          {/* All-day toggle */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_all_day}
              onChange={e => set('is_all_day', e.target.checked)}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">All-day event</span>
          </label>

          {/* Start */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start *</label>
            <div className={`flex ${form.is_all_day ? '' : 'space-x-2'}`}>
              <input
                type="date"
                value={form.start_date}
                onChange={e => handleStartDateChange(e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.start_date ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {!form.is_all_day && (
                <input
                  type="time"
                  value={form.start_time}
                  onChange={e => handleStartTimeChange(e.target.value)}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
            {errors.start_date && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />{errors.start_date}
              </p>
            )}
          </div>

          {/* End */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
            <div className={`flex ${form.is_all_day ? '' : 'space-x-2'}`}>
              <input
                type="date"
                value={form.end_date}
                onChange={e => set('end_date', e.target.value)}
                min={form.start_date}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {!form.is_all_day && (
                <input
                  type="time"
                  value={form.end_time}
                  onChange={e => set('end_time', e.target.value)}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. District Court, Room 5A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Linked Dossier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link to Dossier</label>
            <select
              value={form.dossier_id}
              onChange={e => set('dossier_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">— None —</option>
              {Array.isArray(dossiers) && dossiers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.dossier_number} — {d.title}
                  {d.client ? ` (${d.client.first_name} ${d.client.last_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;
