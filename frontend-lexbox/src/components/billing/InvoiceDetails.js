// src/components/billing/InvoiceDetails.js
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Download, 
  Send, 
  CreditCard,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { billingService } from '../../services/billingService';
import LoadingSpinner from '../common/LoadingSpinner';

const InvoiceDetails = ({ invoiceId, onBack, onPayment }) => {
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => billingService.getInvoice(invoiceId),
    enabled: !!invoiceId
  });

  const invoice = invoiceData?.data;

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
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-800">
          Go Back
        </button>
      </div>
    );
  }

  const balance = parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid);
  const client = invoice.dossier?.client;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{invoice.invoice_number}</h2>
            <p className="text-sm text-gray-500">
              Issued {new Date(invoice.issue_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(invoice.status)}
          {['sent', 'partial', 'overdue'].includes(invoice.status) && (
            <button
              onClick={() => onPayment(invoice.id)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {/* Client Info */}
        {client && (
          <div className="mb-6 pb-6 border-b">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To</h3>
            <p className="font-medium text-gray-900">{client.first_name} {client.last_name}</p>
            {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
            {client.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
            {client.address && <p className="text-sm text-gray-500">{client.address}</p>}
          </div>
        )}

        {/* Invoice Details */}
        <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b">
          <div>
            <p className="text-sm text-gray-500">Invoice Date</p>
            <p className="font-medium">{new Date(invoice.issue_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Terms</p>
            <p className="font-medium">{invoice.payment_terms || 'Net 30'}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Items</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Description</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">Qty</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">Rate</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems?.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-3">
                    <p className="text-sm text-gray-900">{item.description}</p>
                    {item.activity_date && (
                      <p className="text-xs text-gray-500">
                        {new Date(item.activity_date).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="text-right text-sm text-gray-900 py-3">
                    {parseFloat(item.quantity).toFixed(2)}
                  </td>
                  <td className="text-right text-sm text-gray-900 py-3">
                    €{parseFloat(item.unit_price).toFixed(2)}
                  </td>
                  <td className="text-right text-sm font-medium text-gray-900 py-3">
                    €{parseFloat(item.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">€{parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(invoice.tax_rate) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                <span className="font-medium">€{parseFloat(invoice.tax_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>€{parseFloat(invoice.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Paid</span>
              <span>€{parseFloat(invoice.amount_paid).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-orange-600 border-t pt-2">
              <span>Balance Due</span>
              <span>€{balance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-500">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payments */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Method</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Reference</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((payment) => (
                <tr key={payment.id} className="border-b">
                  <td className="py-3 text-sm text-gray-900">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-sm text-gray-900 capitalize">
                    {payment.payment_method.replace('_', ' ')}
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {payment.reference_number || '-'}
                  </td>
                  <td className="py-3 text-sm font-medium text-green-600 text-right">
                    €{parseFloat(payment.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetails;