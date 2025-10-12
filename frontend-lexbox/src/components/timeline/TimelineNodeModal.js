// ===================================================================
// TIMELINE NODE MODAL (EDIT/VIEW)
// ===================================================================
// src/components/timeline/TimelineNodeModal.js
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Clock, DollarSign } from 'lucide-react';
import { timelineService } from '../../services/timelineService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Modal for editing timeline nodes
 * Supports viewing and updating timeline node details
 */
const TimelineNodeModal = ({ isOpen, onClose, node, dossierId, mode = 'edit' }) => {
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      title: node?.title || '',
      description: node?.description || '',
      status: node?.status || 'active',
      billing_amount: node?.billing_amount || '',
      hours_worked: node?.hours_worked || '',
      scheduled_date: node?.scheduled_date ? new Date(node.scheduled_date).toISOString().slice(0, 16) : ''
    }
  });

  // Update timeline node mutation
const updateNodeMutation = useMutation({
  mutationFn: (nodeData) => timelineService.updateTimelineNode(node.id, nodeData),
  onSuccess: () => {
    queryClient.invalidateQueries(['timeline', dossierId]);
    showSuccess('Timeline activity updated successfully');
    onClose();
  },
  onError: (error) => {
    showError('Failed to update timeline activity');
  }
});

  /**
   * Handle form submission
   */
  const onSubmit = (data) => {
    if (mode === 'view' || !hasPermission('timeline:update')) return;

    const cleanData = {
      ...data,
      billing_amount: data.billing_amount ? parseFloat(data.billing_amount) : 0,
      hours_worked: data.hours_worked ? parseFloat(data.hours_worked) : null,
      scheduled_date: data.scheduled_date || null
    };

    updateNodeMutation.mutate(cleanData);
  };

  if (!isOpen || !node) return null;

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const isReadOnly = mode === 'view' || !hasPermission('timeline:update');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {mode === 'view' ? 'View' : 'Edit'} Timeline Activity
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Node info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {node.node_type.replace('_', ' ').toUpperCase()}
                </p>
                <p className="text-xs text-gray-500">
                  Created {new Date(node.created_at).toLocaleString()}
                  {node.created_by_name && ` by ${node.created_by_name}`}
                </p>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {node.hours_worked && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{node.hours_worked}h</span>
                  </div>
                )}
                {node.billing_amount && parseFloat(node.billing_amount) > 0 && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>€{parseFloat(node.billing_amount).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  {...register('title', { 
                    required: 'Title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' }
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  readOnly={isReadOnly}
                  placeholder="Enter activity title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  {...register('status', { required: 'Status is required' })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.status ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isReadOnly}
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="datetime-local"
                  {...register('scheduled_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly={isReadOnly}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows="4"
                {...register('description')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the activity details..."
                readOnly={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hours Worked */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours Worked
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  {...register('hours_worked', {
                    min: { value: 0, message: 'Hours must be positive' }
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.hours_worked ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  readOnly={isReadOnly}
                />
                {errors.hours_worked && (
                  <p className="mt-1 text-sm text-red-600">{errors.hours_worked.message}</p>
                )}
              </div>

              {/* Billing Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Amount (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('billing_amount', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.billing_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  readOnly={isReadOnly || !hasPermission('billing:update')}
                />
                {errors.billing_amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.billing_amount.message}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {mode === 'view' ? 'Close' : 'Cancel'}
              </button>
              
              {!isReadOnly && (
                <button
                  type="submit"
                  disabled={updateNodeMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateNodeMutation.isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TimelineNodeModal;