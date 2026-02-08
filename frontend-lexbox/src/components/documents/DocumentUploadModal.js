// src/components/documents/DocumentUploadModal.js
import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Upload, File, Trash2, AlertCircle, Clock } from 'lucide-react';
import { documentService } from '../../services/documentService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Document upload modal with drag & drop and timeline integration
 */
const DocumentUploadModal = ({ dossierId, onClose, onSuccess }) => {
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState('other');
  const [physicalLocation, setPhysicalLocation] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Timeline integration
  const [createTimelineEntry, setCreateTimelineEntry] = useState(false);
  const [timelineTitle, setTimelineTitle] = useState('');
  const [isBillable, setIsBillable] = useState(false);
  const [hoursWorked, setHoursWorked] = useState('');
  const [hourlyRate, setHourlyRate] = useState('150');

  const { showSuccess, showError } = useNotification();

  const uploadMutation = useMutation({
    mutationFn: () => documentService.uploadDocuments(dossierId, files, {
      category,
      physical_location: physicalLocation,
      is_confidential: isConfidential,
      description,
      create_timeline_entry: createTimelineEntry,
      timeline_title: timelineTitle,
      is_billable: isBillable,
      hours_worked: parseFloat(hoursWorked) || 0,
      hourly_rate: parseFloat(hourlyRate) || 0
    }),
    onSuccess: (data) => {
      showSuccess(`${data.data.length} document(s) uploaded successfully`);
      onSuccess();
    },
    onError: (error) => {
      showError(error.response?.data?.message || 'Failed to upload documents');
    }
  });

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length === 0) {
      showError('Please select at least one file');
      return;
    }
    uploadMutation.mutate();
  };

  // Calculate billing amount
  const billingAmount = (parseFloat(hoursWorked) || 0) * (parseFloat(hourlyRate) || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop files here, or{' '}
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                  browse
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500">
                PDF, DOC, XLS, Images, ZIP (max 50MB each)
              </p>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center">
                      <File className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the document(s)..."
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

            {/* Timeline Integration Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="createTimeline"
                  checked={createTimelineEntry}
                  onChange={(e) => setCreateTimelineEntry(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="createTimeline" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                  <Clock className="h-4 w-4 text-blue-500 mr-1" />
                  Create Timeline Entry
                </label>
              </div>

              {createTimelineEntry && (
                <div className="ml-6 space-y-3 p-4 bg-blue-50 rounded-lg">
                  {/* Timeline Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeline Title
                    </label>
                    <input
                      type="text"
                      value={timelineTitle}
                      onChange={(e) => setTimelineTitle(e.target.value)}
                      placeholder="e.g., Filed court documents"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  {/* Billable checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isBillable"
                      checked={isBillable}
                      onChange={(e) => setIsBillable(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isBillable" className="ml-2 text-sm text-gray-700">
                      This activity is billable
                    </label>
                  </div>

                  {/* Billing fields (show if billable) */}
                  {isBillable && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hours
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={hoursWorked}
                          onChange={(e) => setHoursWorked(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rate (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                          placeholder="150"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total
                        </label>
                        <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium">
                          €{billingAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                disabled={files.length === 0 || uploadMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {uploadMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {files.length} File{files.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;