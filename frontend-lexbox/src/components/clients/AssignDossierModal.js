// ===================================================================
// ASSIGN DOSSIER MODAL
// ===================================================================
// src/components/clients/AssignDossierModal.js
import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Save } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Modal for assigning dossier number to a client
 * Validates dossier number format and handles assignment
 */
const AssignDossierModal = ({ isOpen, onClose, clientId, onAssign, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      dossier_number: ''
    }
  });

  /**
   * Handle form submission
   */
  const onSubmit = (data) => {
    onAssign(data.dossier_number.trim());
    reset();
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Assign Dossier Number
            </h3>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dossier Number (Numrin e Landes) *
              </label>
              <input
                type="text"
                {...register('dossier_number', {
                  required: 'Dossier number is required',
                  minLength: { value: 3, message: 'Dossier number must be at least 3 characters' },
                  pattern: {
                    value: /^[A-Z0-9\-\/]+$/i,
                    message: 'Dossier number can only contain letters, numbers, hyphens, and slashes'
                  }
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.dossier_number ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter official dossier number"
                autoFocus
              />
              {errors.dossier_number && (
                <p className="mt-1 text-sm text-red-600">{errors.dossier_number.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                This is the official dossier number received from the court system
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Assign Dossier
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignDossierModal;