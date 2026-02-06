// src/components/timeline/TimelineNodeModal.js
import React, { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { timelineService } from '../../services/timelineService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Modal for creating/editing timeline nodes
 */
const TimelineNodeModal = ({ dossierId, node, onClose, onSuccess }) => {
  const { showSuccess, showError } = useNotification();
  const isEditing = !!node;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      node_type: node?.node_type || 'activity',
      activity_type: node?.activity_type || '',
      title: node?.title || '',
      description: node?.description || '',
      activity_date: node?.activity_date 
        ? new Date(node.activity_date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      hours_worked: node?.hours_worked || '',
      hourly_rate: node?.hourly_rate || '150',
      is_billable: node?.is_billable ?? true,
      status: node?.status || 'completed',
      priority: node?.priority || 'medium'
    }
  });

  //const nodeType = watch('node_type');
  //const hoursWorked = watch('hours_worked');
  //const hourlyRate = watch('hourly_rate');
  const [nodeType, setNodeType] = React.useState(node?.node_type || 'activity');
  const hoursWorked = watch('hours_worked');
  const hourlyRate = watch('hourly_rate');


  // Calculate billing amount
  const billingAmount = (parseFloat(hoursWorked) || 0) * (parseFloat(hourlyRate) || 0);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => timelineService.createTimelineNode(dossierId, data),
    onSuccess: () => {
      showSuccess('Activity created successfully');
      onSuccess();
    },
    onError: (error) => {
      showError(error.response?.data?.message || 'Failed to create activity');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => timelineService.updateTimelineNode(node.id, data),
    onSuccess: () => {
      showSuccess('Activity updated successfully');
      onSuccess();
    },
    onError: (error) => {
      showError(error.response?.data?.message || 'Failed to update activity');
    }
  });
const onSubmit = (data) => {
  // Clean up data
  const submitData = {
    node_type: data.node_type,
    title: data.title,
    description: data.description || null,
    activity_date: data.activity_date ? new Date(data.activity_date).toISOString() : new Date().toISOString(),
    hours_worked: parseFloat(data.hours_worked) || 0,
    hourly_rate: parseFloat(data.hourly_rate) || 0,
    billing_amount: billingAmount,
    is_billable: data.is_billable,
    status: data.status,
    priority: data.priority
  };

  // Only add activity_type if node_type is 'activity' and it has a value
  if (data.node_type === 'activity' && data.activity_type) {
    submitData.activity_type = data.activity_type;
  }

  if (isEditing) {
    updateMutation.mutate(submitData);
  } else {
    createMutation.mutate(submitData);
  }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Activity' : 'Add Activity'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
            {/* Node Type & Activity Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  {...register('node_type', { required: 'Type is required' })}
                  onChange={(e) => {
                    setValue('node_type', e.target.value);
                    setNodeType(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="activity">Activity</option>
                  <option value="registration">Registration</option>
                  <option value="legal_classification">Legal Classification</option>
                  <option value="document">Document</option>
                  <option value="milestone">Milestone</option>
                  <option value="billing_event">Billing Event</option>
                </select>
              </div>

              {nodeType === 'activity' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Type
                  </label>
                  <select
                    {...register('activity_type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type...</option>
                    <option value="consultation">Consultation</option>
                    <option value="court_hearing">Court Hearing</option>
                    <option value="document_filing">Document Filing</option>
                    <option value="phone_call">Phone Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="research">Research</option>
                    <option value="drafting">Drafting</option>
                    <option value="review">Review</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              ): null}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                {...register('title', { required: 'Title is required' })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter activity title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows="3"
                {...register('description')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description..."
              />
            </div>

            {/* Date & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  {...register('activity_date', { required: 'Date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Billing Section */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Billing Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    {...register('hours_worked')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('hourly_rate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="150.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount
                  </label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                    €{billingAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    {...register('is_billable')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">This activity is billable</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                {isEditing ? 'Save Changes' : 'Add Activity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TimelineNodeModal;