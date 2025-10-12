// ===================================================================
// UPLOAD DOCUMENTS MODAL
// ===================================================================
// src/components/documents/UploadDocumentsModal.js
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, File, AlertCircle } from 'lucide-react';
import { documentService } from '../../services/documentService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Modal for uploading multiple documents with drag-and-drop support
 * Includes progress tracking and metadata assignment
 */
const UploadDocumentsModal = ({ isOpen, onClose, dossierId }) => {
  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState({
    physical_location: '',
    document_category: 'General',
    is_confidential: false
  });

  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Upload documents mutation
const uploadMutation = useMutation({
  mutationFn: ({ files, metadata }) => documentService.uploadDocuments(dossierId, files, metadata),
  onSuccess: () => {
    queryClient.invalidateQueries(['documents', dossierId]);
    showSuccess(`${files.length} document(s) uploaded successfully`);
    handleClose();
  },
  onError: (error) => {
    showError('Failed to upload documents');
  }
});

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: 'pending' // pending, uploading, success, error
      }));
      setFiles(prev => [...prev, ...newFiles]);
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10
  });

  /**
   * Remove file from upload list
   */
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  /**
   * Handle form submission
   */
  const handleUpload = () => {
    if (files.length === 0) return;
    
    const filesToUpload = files.map(f => f.file);
    uploadMutation.mutate({ files: filesToUpload, metadata });
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    setFiles([]);
    setMetadata({
      physical_location: '',
      document_category: 'General',
      is_confidential: false
    });
    onClose();
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  const documentCategories = [
    'General',
    'Legal Documents',
    'Court Filings',
    'Evidence',
    'Contracts',
    'Correspondence',
    'Financial',
    'Medical Records',
    'Other'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Upload Documents
            </h3>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File upload area */}
            <div className="lg:col-span-2">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  {isDragActive 
                    ? 'Drop the files here...' 
                    : 'Drag & drop files here, or click to select files'
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Supported: PDF, DOC, DOCX, JPG, PNG, TIFF (max 50MB each)
                </p>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Files to Upload ({files.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {files.map((fileItem) => (
                      <div
                        key={fileItem.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {fileItem.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(fileItem.file.size)}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeFile(fileItem.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          disabled={uploadMutation.isLoading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata form */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Document Information</h4>
              
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={metadata.document_category}
                  onChange={(e) => setMetadata(prev => ({ ...prev, document_category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {documentCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Physical location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Physical Location
                </label>
                <input
                  type="text"
                  value={metadata.physical_location}
                  onChange={(e) => setMetadata(prev => ({ ...prev, physical_location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Tray A-12, Cabinet 3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Where physical documents are stored
                </p>
              </div>

              {/* Confidential checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="confidential"
                  checked={metadata.is_confidential}
                  onChange={(e) => setMetadata(prev => ({ ...prev, is_confidential: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="confidential" className="ml-2 text-sm text-gray-700">
                  Mark as confidential
                </label>
              </div>

              {/* Upload info */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium">Upload Info</p>
                    <p className="text-blue-700 mt-1">
                      All files will be assigned the same metadata. You can edit individual files later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={uploadMutation.isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploadMutation.isLoading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadMutation.isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload {files.length} Document{files.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentsModal;