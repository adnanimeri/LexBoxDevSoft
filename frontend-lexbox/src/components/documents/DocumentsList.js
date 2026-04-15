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
  Archive,
  Grid,
  List,
  Lock,
  Wand2,
  X
} from 'lucide-react';
import { documentService } from '../../services/documentService';
import { templateService } from '../../services/templateService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';
import DocumentPreviewModal from './DocumentPreviewModal';
import DocumentUploadModal from './DocumentUploadModal';
import ConfirmModal from '../common/ConfirmModal';

/**
 * Documents list component with upload, preview, and management capabilities
 */
const DocumentsList = ({ dossierId, canUpload = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [generateFormat, setGenerateFormat] = useState('pdf');
  const [generateEncrypt, setGenerateEncrypt] = useState(false);

  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Fetch available templates for "Generate from Template"
  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: templateService.getTemplates,
    staleTime: 60000,
    enabled: !!dossierId
  });
  const templates = templatesData?.data || [];

  // Generate document from template mutation
  const generateMutation = useMutation({
    mutationFn: ({ templateId, dossierId: dId, format, encrypt }) =>
      templateService.generateDocument(templateId, dId, format, encrypt),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', dossierId]);
      showSuccess('Document generated successfully');
      setShowTemplateModal(false);
      setSelectedTemplateId('');
      setGenerateFormat('pdf');
      setGenerateEncrypt(false);
    },
    onError: (err) => {
      showError(err.response?.data?.message || 'Failed to generate document');
    }
  });

  // Fetch documents
  const { data: documentsData, isLoading, error } = useQuery({
    queryKey: ['documents', dossierId],
    queryFn: () => dossierId ? documentService.getDocuments(dossierId) : { data: [] },
    enabled: !!dossierId,
    staleTime: 60000
  });

  // Extract documents array from response
  const documents = documentsData?.data || [];

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
  const handleDownload = async (doc) => {
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
      showSuccess('Document downloaded successfully');
    } catch (error) {
      showError('Failed to download document');
    }
  };

  /**
   * Handle document preview
   */
  const handlePreview = (doc) => {
    setSelectedDocument(doc);
    setShowPreviewModal(true);
  };

  /**
   * Handle document deletion
   */
  const handleDelete = (documentId) => {
    setConfirmModal({
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => deleteDocumentMutation.mutate(documentId),
    });
  };

  // Filter documents based on search and category
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
      doc.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = [...new Set(documents.map(doc => doc.category).filter(Boolean))];

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
      {/* Header with search, filters, and view toggle */}
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
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

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

          {/* Generate from Template button */}
          {canUpload && hasPermission('documents:create') && templates.length > 0 && (
            <button
              onClick={() => setShowTemplateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate
            </button>
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

      {/* Documents display */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          {searchTerm || categoryFilter !== 'all' ? (
            <>
              <p className="text-lg font-medium text-gray-700">No Matching Documents</p>
              <p className="text-sm mt-2">No documents match your search criteria</p>
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
              <p className="text-lg font-medium text-gray-700">No Documents Yet</p>
              <p className="text-sm mt-2">No documents have been uploaded for this dossier</p>
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
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const FileIcon = getFileTypeIcon(doc.mime_type, doc.original_filename);
            const isEncrypted = doc.metadata?.encryption === 'aes256';
            
            return (
              <div
                key={doc.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Document header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 relative">
                      <FileIcon className="h-8 w-8 text-blue-500" />
                      {isEncrypted && (
                        <Lock className="h-3 w-3 text-red-500 absolute -bottom-1 -right-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {doc.original_filename || doc.filename}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.file_size)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document metadata */}
                <div className="space-y-2 mb-4">
                  {doc.category && (
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                        {doc.category}
                      </span>
                      {isEncrypted && (
                        <span className="ml-2 inline-flex px-2 py-1 bg-red-100 text-red-800 rounded-full">
                          Encrypted
                        </span>
                      )}
                    </div>
                  )}
                  
                  {doc.physical_location && (
                    <div className="flex items-center text-xs text-gray-500">
                      <span>Physical: {doc.physical_location}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Uploaded {new Date(doc.createdAt || doc.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Document actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePreview(doc)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1 text-gray-400 hover:text-green-600 rounded"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {hasPermission('documents:update') && (
                      <button
                        className="p-1 text-gray-400 hover:text-orange-600 rounded"
                        title="Edit metadata"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {hasPermission('documents:delete') && (
                    <button
                      onClick={() => handleDelete(doc.id)}
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
      ) : (
        /* List View */
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => {
                const FileIcon = getFileTypeIcon(doc.mime_type, doc.original_filename);
                const isEncrypted = doc.metadata?.encryption === 'aes256';
                
                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 relative">
                          <FileIcon className="h-6 w-6 text-blue-500" />
                          {isEncrypted && (
                            <Lock className="h-3 w-3 text-red-500 absolute -bottom-1 -right-1" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {doc.original_filename || doc.filename}
                          </p>
                          {isEncrypted && (
                            <span className="text-xs text-red-600">Encrypted</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.category && (
                        <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          {doc.category}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.physical_location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.createdAt || doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handlePreview(doc)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1 text-gray-400 hover:text-green-600 rounded"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {hasPermission('documents:update') && (
                          <button
                            className="p-1 text-gray-400 hover:text-orange-600 rounded"
                            title="Edit metadata"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {hasPermission('documents:delete') && (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate from Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowTemplateModal(false)}>
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-blue-600" />
                Generate from Template
              </h2>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Select a template to generate a pre-filled document into this dossier.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(String(t.id))}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      selectedTemplateId === String(t.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">{t.title}</p>
                    {t.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{t.description}</p>
                    )}
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {t.category}
                    </span>
                  </button>
                ))}
              </div>
              {/* Format selector */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Output Format</label>
                <div className="flex gap-3">
                  {[
                    { value: 'pdf',  label: 'PDF',  hint: 'Previewable in browser' },
                    { value: 'docx', label: 'DOCX', hint: 'Editable in Word' },
                  ].map(f => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setGenerateFormat(f.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        generateFormat === f.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="font-medium">{f.label}</span>
                      <span className="block text-xs text-gray-400 mt-0.5">{f.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Encryption toggle */}
              <label className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                <input
                  type="checkbox"
                  checked={generateEncrypt}
                  onChange={e => setGenerateEncrypt(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <p className="text-sm font-medium text-amber-800">Encrypt document (AES-256)</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Document will be encrypted at rest. Marked confidential automatically.
                    Download and preview still work transparently.
                  </p>
                </div>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setShowTemplateModal(false); setSelectedTemplateId(''); setGenerateFormat('pdf'); setGenerateEncrypt(false); }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => generateMutation.mutate({ templateId: selectedTemplateId, dossierId, format: generateFormat, encrypt: generateEncrypt })}
                  disabled={!selectedTemplateId || generateMutation.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {generateMutation.isPending ? 'Generating…' : `Generate ${generateFormat.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          dossierId={dossierId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            queryClient.invalidateQueries(['documents', dossierId]);
          }}
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

      <ConfirmModal
        isOpen={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmLabel={confirmModal?.confirmLabel}
        danger={confirmModal?.danger}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  );
};

export default DocumentsList;