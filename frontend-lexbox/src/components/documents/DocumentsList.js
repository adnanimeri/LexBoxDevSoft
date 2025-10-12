// ===================================================================
// DOCUMENTS LIST COMPONENT
// ===================================================================
// src/components/documents/DocumentsList.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Edit,
  Search,
  File,
  Image,
  Archive
} from 'lucide-react';
import { documentService } from '../../services/documentService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';
import DocumentPreviewModal from './DocumentPreviewModal';
import UploadDocumentsModal from './UploadDocumentsModal';

/**
 * Documents list component with upload, preview, and management capabilities
 * Supports drag-and-drop uploads and document categorization
 */
const DocumentsList = ({ dossierId, canUpload = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Fetch documents
 const { data: documents, isLoading, error } = useQuery({
  queryKey: ['documents', dossierId],
  queryFn: () => dossierId ? documentService.getDocuments(dossierId) : [],
  enabled: !!dossierId,
  staleTime: 60000
});

  // Delete document mutation
const deleteDocumentMutation = useMutation({
  mutationFn: (documentId) => documentService.deleteDocument(documentId),
  onSuccess: () => {
    queryClient.invalidateQueries(['documents', dossierId]);
    showSuccess('Document deleted successfully');
  },
  onError: () => {
    showError('Failed to delete document');
  }
});

  /**
   * Get file type icon
   */
  const getFileTypeIcon = (mimeType, filename) => {
    if (mimeType?.startsWith('image/')) {
      return Image;
    } else if (mimeType?.includes('pdf')) {
      return FileText;
    } else if (filename?.toLowerCase().includes('.zip') || filename?.toLowerCase().includes('.rar')) {
      return Archive;
    }
    return File;
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

  /**
   * Handle document download
   */
  const handleDownload = async (document) => {
    try {
      const blob = await documentService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.original_filename || document.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('Document downloaded successfully');
    } catch (error) {
      showError('Failed to download document');
    }
  };

  /**
   * Handle document preview
   */
  const handlePreview = (document) => {
    setSelectedDocument(document);
    setShowPreviewModal(true);
  };

  /**
   * Handle document deletion
   */
  const handleDelete = (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  // Filter documents based on search and category
  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
      doc.document_category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories for filter
  const categories = [...new Set(documents?.map(doc => doc.document_category).filter(Boolean))] || [];

 if (!dossierId) {
  return (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
      <p className="text-lg font-medium text-gray-700 mb-2">
        No Dossier Assigned to This Client
      </p>
      <p className="text-sm text-gray-500 mb-4">
        Documents can only be uploaded after a dossier number has been assigned.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-sm text-blue-800">
          💡 To upload documents, first assign a dossier number to this client from the client details page.
        </p>
      </div>
    </div>
  );
}

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Error loading documents</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Category filter */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}

          {/* Upload button */}
          {canUpload && hasPermission('documents:create') && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </button>
          )}
        </div>
      </div>

      {/* Documents grid/list */}
       {filteredDocuments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          {!dossierId ? (
            <>
              <p className="text-lg font-medium text-gray-700">No Dossier Assigned</p>
              <p className="text-sm mt-2">Documents will be available after dossier number is assigned to this client</p>
            </>
          ) : searchTerm || categoryFilter !== 'all' ? (
            <>
              <p className="text-lg font-medium text-gray-700">No Matching Documents</p>
              <p className="text-sm mt-2">No documents match your search criteria for this dossier</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">No Documents for This Dossier</p>
              <p className="text-sm mt-2">No documents have been uploaded for this dossier yet</p>
            </>
          )}
          {canUpload && hasPermission('documents:create') && !searchTerm && categoryFilter === 'all' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload your first document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => {
            const FileIcon = getFileTypeIcon(document.mime_type, document.original_filename);
            
            return (
              <div
                key={document.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Document header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <FileIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {document.original_filename || document.filename}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(document.file_size)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document metadata */}
                <div className="space-y-2 mb-4">
                  {document.document_category && (
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                        {document.document_category}
                      </span>
                    </div>
                  )}
                  
                  {document.physical_location && (
                    <div className="flex items-center text-xs text-gray-500">
                      <span>Physical: {document.physical_location}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Uploaded {new Date(document.uploaded_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Document actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    {/* Preview button */}
                    <button
                      onClick={() => handlePreview(document)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Download button */}
                    <button
                      onClick={() => handleDownload(document)}
                      className="p-1 text-gray-400 hover:text-green-600 rounded"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    {/* Edit button */}
                    {hasPermission('documents:update') && (
                      <button
                        className="p-1 text-gray-400 hover:text-orange-600 rounded"
                        title="Edit metadata"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Delete button */}
                  {hasPermission('documents:delete') && (
                    <button
                      onClick={() => handleDelete(document.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadDocumentsModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          dossierId={dossierId}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedDocument && (
        <DocumentPreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
        />
      )}
    </div>
  );
};

export default DocumentsList;