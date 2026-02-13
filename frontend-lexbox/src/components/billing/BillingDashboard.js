// src/components/billing/BillingDashboard.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, 
  FileText, 
  Plus, 
  Send, 
  XCircle,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { billingService } from '../../services/billingService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';
import CreateInvoiceModal from './CreateInvoiceModal';
import InvoiceDetails from './InvoiceDetails';
import RecordPaymentModal from './RecordPaymentModal';

const BillingDashboard = ({ dossierId }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState(null);

  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Fetch billing summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['billing-summary', dossierId],
    queryFn: () => billingService.getBillingSummary(dossierId),
    enabled: !!dossierId
  });

  // Fetch invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', dossierId],
    queryFn: () => billingService.getInvoices(dossierId),
    enabled: !!dossierId
  });

  // Send invoice mutation
  const sendInvoiceMutation = useMutation({
    mutationFn: (invoiceId) => billingService.sendInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices', dossierId]);
      queryClient.invalidateQueries(['billing-summary', dossierId]);
      showSuccess('Invoice sent successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.message || 'Failed to send invoice');
    }
  });

  // Cancel invoice mutation
  const cancelInvoiceMutation = useMutation({
    mutationFn: (invoiceId) => billingService.cancelInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices', dossierId]);
      queryClient.invalidateQueries(['billing-summary', dossierId]);
      showSuccess('Invoice cancelled successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.message || 'Failed to cancel invoice');
    }
  });

  const handleRecordPayment = (invoiceId) => {
    setPaymentInvoiceId(invoiceId);
    setShowPaymentModal(true);
  };

  const summary = summaryData?.data || {};
  const invoices = invoicesData?.data || [];

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      partial: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-500'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (summaryLoading || invoicesLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If viewing invoice details
  if (selectedInvoice) {
    return (
      <InvoiceDetails 
        invoiceId={selectedInvoice} 
        onBack={() => setSelectedInvoice(null)}
        onPayment={handleRecordPayment}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-blue-600">Total Invoiced</p>
              <p className="text-xl font-bold text-blue-900">
                €{(summary.totalInvoiced || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-green-600">Total Paid</p>
              <p className="text-xl font-bold text-green-900">
                €{(summary.totalPaid || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm text-orange-600">Outstanding</p>
              <p className="text-xl font-bold text-orange-900">
                €{(summary.totalOutstanding || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm text-purple-600">Unbilled Work</p>
              <p className="text-xl font-bold text-purple-900">
                €{(summary.totalUnbilled || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Invoice Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </button>
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No invoices yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first invoice from unbilled activities</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedInvoice(invoice.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {invoice.invoice_number}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.issue_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    €{parseFloat(invoice.total_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    €{parseFloat(invoice.amount_paid).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => sendInvoiceMutation.mutate(invoice.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Send Invoice"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {['sent', 'partial', 'overdue'].includes(invoice.status) && (
                        <button
                          onClick={() => handleRecordPayment(invoice.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Record Payment"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                      )}
                      {['draft', 'sent'].includes(invoice.status) && (
                        <button
                          onClick={() => cancelInvoiceMutation.mutate(invoice.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Cancel Invoice"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          dossierId={dossierId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['invoices', dossierId]);
            queryClient.invalidateQueries(['billing-summary', dossierId]);
          }}
        />
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && paymentInvoiceId && (
        <RecordPaymentModal
          invoiceId={paymentInvoiceId}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentInvoiceId(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setPaymentInvoiceId(null);
            queryClient.invalidateQueries(['invoices', dossierId]);
            queryClient.invalidateQueries(['billing-summary', dossierId]);
          }}
        />
      )}
    </div>
  );
};

export default BillingDashboard;