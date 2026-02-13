// src/components/billing/CreateInvoiceModal.js
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, FileText, Check } from 'lucide-react';
import { billingService } from '../../services/billingService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';

const CreateInvoiceModal = ({ dossierId, onClose, onSuccess }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(true);
  const [taxRate, setTaxRate] = useState(0);
  const [dueDays, setDueDays] = useState(30);
  const [notes, setNotes] = useState('');

  const { showSuccess, showError } = useNotification();

  // Fetch unbilled items
  const { data: unbilledData, isLoading } = useQuery({
    queryKey: ['unbilled-items', dossierId],
    queryFn: () => billingService.getUnbilledItems(dossierId),
    enabled: !!dossierId
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: (invoiceData) => billingService.createInvoice(dossierId, invoiceData),
    onSuccess: () => {
      showSuccess('Invoice created successfully');
      onSuccess();
    },
    onError: (error) => {
      showError(error.response?.data?.message || 'Failed to create invoice');
    }
  });

  const unbilledItems = unbilledData?.data || [];
  const totalUnbilled = unbilledData?.totalUnbilled || 0;

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectAll(false);
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      }
      return [...prev, itemId];
    });
  };

  const getSelectedTotal = () => {
    if (selectAll) {
      return totalUnbilled;
    }
    return unbilledItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + (parseFloat(item.billing_amount) || 0), 0);
  };

  const subtotal = getSelectedTotal();
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const invoiceData = {
      timeline_node_ids: selectAll ? [] : selectedItems,
      tax_rate: taxRate,
      due_days: dueDays,
      notes: notes || null
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const hasItems = selectAll ? unbilledItems.length > 0 : selectedItems.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create Invoice</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : unbilledItems.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No unbilled items available</p>
              <p className="text-sm text-gray-400 mt-1">Add billable activities to the timeline first</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Select Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Items to Invoice
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">Select All</span>
                  </label>
                </div>

                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {unbilledItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center p-3 border-b last:border-b-0 hover:bg-gray-50 ${
                        (selectAll || selectedItems.includes(item.id)) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectAll || selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.activity_date).toLocaleDateString()} 
                          {item.hours_worked && ` • ${item.hours_worked}h`}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        €{parseFloat(item.billing_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dueDays}
                    onChange={(e) => setDueDays(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes for this invoice..."
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">€{subtotal.toFixed(2)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Tax ({taxRate}%)</span>
                    <span className="font-medium">€{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!hasItems || createInvoiceMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {createInvoiceMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create Invoice
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;