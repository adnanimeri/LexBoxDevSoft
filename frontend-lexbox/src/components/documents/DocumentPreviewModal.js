// ===================================================================
// DOCUMENT PREVIEW MODAL
// ===================================================================
// src/components/documents/DocumentPreviewModal.js
import React, { useState, useEffect } from 'react';
import { X, Download, Edit, ExternalLink } from 'lucide-react';
import { documentService } from '../../services/documentService';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Modal for previewing documents
 * Supports PDF preview and metadata display
 */
const DocumentPreviewModal = ({ isOpen, onClose, document: doc }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const canPreview = doc?.mime_type === 'application/pdf' || 
                    doc?.mime_type?.startsWith('image/');

  useEffect(() => {
    if (isOpen && doc && canPreview) {
      setLoading(true);
      documentService.getPreviewBlob(doc.id)
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          setPreviewUrl(url);
        })
        .catch(err => {
          console.error('Failed to load preview:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, doc?.id]);

  if (!isOpen || !doc) return null;

  /**
   * Handle document download
   */
  const handleDownload = async () => {
    try {
      const blob = await documentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.original_filename || doc.filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {doc.original_filename || doc.filename}
              </h3>
              <p className="text-sm text-gray-500">
                {doc.category || doc.document_category} • {new Date(doc.createdAt || doc.uploaded_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
              
              <button
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Edit metadata"
              >
                <Edit className="h-5 w-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-96 sm:h-[600px]">
            {/* Preview area */}
            <div className="flex-1 bg-gray-100 flex items-center justify-center">
              {loading ? (
                <LoadingSpinner size="lg" />
              ) : canPreview && previewUrl ? (
                <div className="w-full h-full">
                  {doc.mime_type === 'application/pdf' ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border-0"
                      title="Document Preview"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt={doc.original_filename}
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <ExternalLink className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Preview not available</p>
                  <p className="text-sm">
                    This file type cannot be previewed in the browser
                  </p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download to View
                  </button>
                </div>
              )}
            </div>

            {/* Metadata sidebar */}
            <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Document Details</h4>
              
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Original Filename</dt>
                  <dd className="mt-1 text-sm text-gray-900 break-all">
                    {doc.original_filename || doc.filename}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">File Size</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {doc.file_size ? (
                      (() => {
                        const bytes = doc.file_size;
                        if (bytes === 0) return '0 Bytes';
                        const k = 1024;
                        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                        const i = Math.floor(Math.log(bytes) / Math.log(k));
                        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                      })()
                    ) : (
                      'Unknown'
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">File Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {doc.mime_type || 'Unknown'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {doc.category || doc.document_category || 'Uncategorized'}
                  </dd>
                </div>

                {doc.physical_location && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Physical Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {doc.physical_location}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">Uploaded</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(doc.createdAt || doc.uploaded_at).toLocaleString()}
                  </dd>
                </div>

                {doc.uploader && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Uploaded By</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {doc.uploader.first_name} {doc.uploader.last_name}
                    </dd>
                  </div>
                )}

                {doc.is_confidential && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Security</dt>
                    <dd className="mt-1">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Confidential
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;