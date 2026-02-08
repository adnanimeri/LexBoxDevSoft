// src/components/documents/DocumentEditModal.js
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Save, AlertCircle } from 'lucide-react';
import { documentService } from '../../services/documentService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Modal for editing document metadata
 */
const DocumentEditModal = ({ document, onClose, onSuccess }) => {
  const [category, setCategory] = useState(document.category || 'other');
  const [physicalLocation, setPhysicalLocation] = useState(document.physical_location || '');
  const [isConfidential, setIsConfidential] = useState(document.is_confidential || false);
  const [description, setDescription] = useState(document.description || '');

  const { showSuccess, showError } = useNotification();

  const updateMutation = useMutation({
    mutationFn: (data) => documentService.updateDocument(document.id, data),
    onSuccess: () => {
      showSuccess('Document updated successfully');
      onSuccess();
    },
    onError: (error) => {
      showError(error.response?.data?.message || 'Failed to update document');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      category,
      physical_location: physicalLocation || null,
      is_confidential: isConfidential,
      description: description || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Edit Document</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Filename (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filename
              </label>
              <p className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                {document.original_filename}
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="contract">Contract</option>
                <option value="evidence">Evidence</option>
                <option value="correspondence">Correspondence</option>
                <option value="court_document">Court Document</option>
                <option value="identification">Identification</option>
                <option value="financial">Financial</option>
                <option value="legal_brief">Legal Brief</option>
                <option value="witness_statement">Witness Statement</option>
                <option value="medical_record">Medical Record</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Physical Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Physical Location (Tray/Shelf)
              </label>
              <input
                type="text"
                value={physicalLocation}
                onChange={(e) => setPhysicalLocation(e.target.value)}
                placeholder="e.g., Tray A-1, Shelf B-3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the document..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Confidential */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="confidential"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="confidential" className="ml-2 text-sm text-gray-700 flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                Mark as confidential
              </label>
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
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {updateMutation.isPending ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditModal;