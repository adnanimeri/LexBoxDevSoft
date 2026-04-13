// ===================================================================
// EVENT DETAIL MODAL / SIDE PANEL
// ===================================================================
import React from 'react';
import {
  X, Calendar, Clock, MapPin, FileText, User, Tag,
  DollarSign, Edit2, Trash2, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TYPE_LABELS = {
  court_hearing:   'Court Hearing',
  meeting:         'Meeting',
  consultation:    'Consultation',
  filing_deadline: 'Filing Deadline',
  milestone:       'Milestone',
  invoice_due:     'Invoice Due',
  task:            'Task / Reminder'
};

const SOURCE_LABELS = {
  calendar: 'Calendar Event',
  timeline: 'Timeline Activity',
  invoice:  'Invoice'
};

const formatDate = (dateStr, allDay) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (allDay) return d.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return d.toLocaleString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const EventDetailModal = ({ event, onClose, onEdit, onDelete }) => {
  const navigate = useNavigate();

  if (!event) return null;

  const { title, start, end, allDay, backgroundColor, extendedProps } = event;
  const {
    type, source, description, location,
    dossier, client, createdBy, canEdit,
    activityType, hoursWorked, status,
    invoiceNumber, amount, invoiceStatus
  } = extendedProps || {};

  const clientName = client ? `${client.first_name} ${client.last_name}` : null;
  const creatorName = createdBy ? `${createdBy.first_name} ${createdBy.last_name}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-30" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200" style={{ borderTop: `4px solid ${backgroundColor}` }}>
          <div className="flex-1 min-w-0 pr-3">
            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2"
              style={{ backgroundColor: `${backgroundColor}20`, color: backgroundColor }}>
              {TYPE_LABELS[type] || type}
            </span>
            <h2 className="text-lg font-semibold text-gray-900 leading-snug">{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{SOURCE_LABELS[source] || source}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 space-y-4">
          {/* Date/Time */}
          <div className="flex items-start space-x-3">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-900">{formatDate(start, allDay)}</p>
              {end && !allDay && (
                <p className="text-xs text-gray-500">to {formatDate(end, false)}</p>
              )}
              {allDay && <p className="text-xs text-gray-500">All day</p>}
            </div>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-900">{location}</p>
            </div>
          )}

          {/* Client */}
          {clientName && (
            <div className="flex items-start space-x-3">
              <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-900">{clientName}</p>
            </div>
          )}

          {/* Dossier */}
          {dossier && (
            <div className="flex items-start space-x-3">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-900">{dossier.title}</p>
                <p className="text-xs text-gray-500">{dossier.dossier_number}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="flex items-start space-x-3">
              <Tag className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 whitespace-pre-line">{description}</p>
            </div>
          )}

          {/* Timeline-specific */}
          {source === 'timeline' && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              {status && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium capitalize text-gray-800">{status}</span>
                </div>
              )}
              {hoursWorked > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Hours worked</span>
                  <span className="font-medium text-gray-800">{hoursWorked}h</span>
                </div>
              )}
              {activityType && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Activity type</span>
                  <span className="font-medium capitalize text-gray-800">{activityType.replace(/_/g, ' ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Invoice-specific */}
          {source === 'invoice' && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Invoice</span>
                <span className="font-medium text-gray-800">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium text-gray-800">€{parseFloat(amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium capitalize ${invoiceStatus === 'overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                  {invoiceStatus}
                </span>
              </div>
            </div>
          )}

          {/* Creator */}
          {creatorName && (
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500">Created by {creatorName}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-gray-200 flex flex-wrap gap-2">
          {dossier && (
            <button
              onClick={() => { navigate(client?.id ? `/clients/${client.id}` : '/clients'); onClose(); }}
              className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              View Dossier
            </button>
          )}

          {canEdit && (
            <>
              <button
                onClick={onEdit}
                className="inline-flex items-center px-3 py-1.5 text-sm border border-blue-300 rounded-lg hover:bg-blue-50 text-blue-700"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </button>
              <button
                onClick={onDelete}
                className="inline-flex items-center px-3 py-1.5 text-sm border border-red-300 rounded-lg hover:bg-red-50 text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
