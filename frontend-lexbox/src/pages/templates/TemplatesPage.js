// ===================================================================
// TEMPLATES PAGE — manage document templates (admin + lawyer)
// ===================================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit2, Trash2, FileText, X, ChevronDown, ChevronUp,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { templateService } from '../../services/templateService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';

// ── Variables ──────────────────────────────────────────────────────
const VARIABLES = [
  { label: 'Client Name',            value: '{{client_name}}' },
  { label: 'Client Email',           value: '{{client_email}}' },
  { label: 'Client Phone',           value: '{{client_phone}}' },
  { label: 'Client Address',         value: '{{client_address}}' },
  { label: 'Client Personal No.',    value: '{{client_personal_number}}' },
  { label: 'Dossier No.',            value: '{{dossier_number}}' },
  { label: 'Dossier Title',          value: '{{dossier_title}}' },
  { label: 'Lawyer Name',            value: '{{lawyer_name}}' },
  { label: 'Date',                   value: '{{date}}' },
  { label: 'Org Name',               value: '{{organization_name}}' },
  { label: 'Org Email',              value: '{{org_email}}' },
  { label: 'Org Address',            value: '{{org_address}}' },
];

const CATEGORIES = [
  { value: 'contract',       label: 'Contract' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'court_document', label: 'Court Document' },
  { value: 'legal_brief',    label: 'Legal Brief' },
  { value: 'identification', label: 'Identification' },
  { value: 'financial',      label: 'Financial' },
  { value: 'other',          label: 'Other' },
];

const FONT_SIZES = [
  { label: 'Small',   cmd: '2' },
  { label: 'Normal',  cmd: '3' },
  { label: 'Large',   cmd: '5' },
  { label: 'Heading', cmd: '6' },
];

// ── Rich Text Editor ───────────────────────────────────────────────
const RichEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);

  // Set initial content only on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Toolbar action — use onMouseDown + preventDefault so editor keeps focus
  const exec = useCallback((cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  // Insert variable text at cursor
  const insertVariable = useCallback((variable) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, variable);
    handleInput();
  }, [handleInput]);

  const ToolBtn = ({ onClick, title, children, className = '' }) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`px-2 py-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors text-sm ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {/* Formatting toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        {/* Bold / Italic / Underline */}
        <ToolBtn onClick={() => exec('bold')} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Underline">
          <Underline className="h-4 w-4" />
        </ToolBtn>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* Font size */}
        <select
          onMouseDown={e => e.stopPropagation()}
          onChange={e => { exec('fontSize', e.target.value); e.target.value = ''; }}
          defaultValue=""
          className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="" disabled>Size</option>
          {FONT_SIZES.map(f => (
            <option key={f.cmd} value={f.cmd}>{f.label}</option>
          ))}
        </select>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* Alignment */}
        <ToolBtn onClick={() => exec('justifyLeft')} title="Align left">
          <AlignLeft className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('justifyCenter')} title="Align center">
          <AlignCenter className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('justifyRight')} title="Align right">
          <AlignRight className="h-4 w-4" />
        </ToolBtn>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* Variables */}
        <div className="flex flex-wrap gap-1">
          {VARIABLES.map(v => (
            <button
              key={v.value}
              type="button"
              title={`Insert ${v.value}`}
              onMouseDown={e => { e.preventDefault(); insertVariable(v.value); }}
              className="px-1.5 py-0.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 font-mono leading-tight"
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="min-h-[260px] max-h-[380px] overflow-y-auto px-4 py-3 text-sm text-gray-900 leading-relaxed outline-none font-serif"
        style={{ wordBreak: 'break-word' }}
        data-placeholder="Write your template here. Select text to format it, or click a variable to insert it at the cursor."
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

// ── Create / Edit Modal ────────────────────────────────────────────
const TemplateModal = ({ template, onClose, onSaved }) => {
  const { showError } = useNotification();
  const [form, setForm] = useState({
    title: template?.title || '',
    description: template?.description || '',
    body: template?.body || '',
    category: template?.category || 'other',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { showError('Title is required'); return; }
    const stripped = form.body.replace(/<[^>]*>/g, '').trim();
    if (!stripped) { showError('Body cannot be empty'); return; }
    setSaving(true);
    try {
      if (template) {
        await templateService.updateTemplate(template.id, form);
      } else {
        await templateService.createTemplate(form);
      }
      onSaved();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {template ? 'Edit Template' : 'New Template'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {/* Title + Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Retainer Agreement"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
              <input
                type="text"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this template"
              />
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Body * — use the toolbar to format text and insert variables
              </label>
              <RichEditor
                value={form.body}
                onChange={v => set('body', v)}
              />
              <p className="text-xs text-gray-400 mt-1">
                Bold, italic, underline and font size are preserved in generated PDF and DOCX files.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : template ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Template Card ──────────────────────────────────────────────────
const TemplateCard = ({ template, canEdit, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const categoryLabel = CATEGORIES.find(c => c.value === template.category)?.label || 'Other';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{template.title}</h3>
            {template.description && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{template.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {categoryLabel}
              </span>
              {template.creator && (
                <span className="text-xs text-gray-400">
                  by {template.creator.first_name} {template.creator.last_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(template)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(template)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Preview toggle */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Hide preview' : 'Show preview'}
      </button>

      {expanded && (
        <div
          className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-700 leading-relaxed max-h-48 overflow-y-auto border border-gray-200 font-serif"
          dangerouslySetInnerHTML={{ __html: template.body }}
        />
      )}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────
const TemplatesPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const canEdit = user?.role === 'admin' || user?.role === 'lawyer';

  const { data, isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: templateService.getTemplates,
    staleTime: 60000
  });

  const templates = data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => templateService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      showSuccess('Template deleted');
      setConfirmModal(null);
    },
    onError: () => showError('Failed to delete template')
  });

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleDelete = (template) => {
    setConfirmModal({
      title: 'Delete Template',
      message: `Delete "${template.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
      onConfirm: () => deleteMutation.mutate(template.id)
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const handleSaved = () => {
    queryClient.invalidateQueries(['templates']);
    showSuccess(editingTemplate ? 'Template updated' : 'Template created');
    handleModalClose();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pre-built document skeletons with variable placeholders. Generate filled documents directly into any dossier.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setEditingTemplate(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">Failed to load templates.</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No templates yet</p>
          {canEdit && (
            <p className="text-sm text-gray-400 mt-1">
              Create your first template to speed up document creation.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              canEdit={canEdit}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          confirmClass={confirmModal.confirmClass}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default TemplatesPage;
