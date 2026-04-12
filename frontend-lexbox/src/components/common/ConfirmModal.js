// ===================================================================
// CONFIRM MODAL — platform-style confirmation dialog
// Usage: <ConfirmModal isOpen={!!confirm} onCancel={() => setConfirm(null)}
//           onConfirm={confirm?.onConfirm} title={confirm?.title}
//           message={confirm?.message} danger={confirm?.danger} />
// ===================================================================
import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-150">
        {/* Icon + title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            danger ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            {danger
              ? <AlertTriangle className="w-5 h-5 text-red-600" />
              : <Info className="w-5 h-5 text-blue-600" />
            }
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {message && (
              <p className="mt-1 text-sm text-gray-500">{message}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm?.(); onCancel?.(); }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
