// ===================================================================
// GLOBAL BILLING PAGE  —  /billing
// Org-wide view of all invoices across all clients
// ===================================================================
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, DollarSign, AlertCircle, Clock,
  Search, Download, Mail, CreditCard, Eye,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { billingService } from '../../services/billingService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import RecordPaymentModal from '../../components/billing/RecordPaymentModal';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  draft:     'bg-gray-100 text-gray-700',
  sent:      'bg-blue-100 text-blue-700',
  partial:   'bg-yellow-100 text-yellow-700',
  paid:      'bg-green-100 text-green-700',
  overdue:   'bg-red-100   text-red-700',
  cancelled: 'bg-gray-100 text-gray-400 line-through',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SummaryCard({ label, value, color, icon: Icon }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 text-blue-900',
    green:  'bg-green-50 text-green-600 text-green-900',
    orange: 'bg-orange-50 text-orange-600 text-orange-900',
    red:    'bg-red-50 text-red-600 text-red-900',
  };
  const [bg, label_c, val_c] = colors[color].split(' ');
  return (
    <div className={`${bg} p-4 rounded-lg flex items-center gap-3`}>
      <Icon className={`h-8 w-8 ${label_c} flex-shrink-0`} />
      <div>
        <p className={`text-sm ${label_c}`}>{label}</p>
        <p className={`text-xl font-bold ${val_c}`}>€{value.toFixed(2)}</p>
      </div>
    </div>
  );
}

// ─── date range helpers ──────────────────────────────────────────────────────

function dateRange(key) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case 'this_month':
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0) };
    case 'last_month':
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) };
    case 'this_quarter': {
      const q = Math.floor(m / 3);
      return { start: new Date(y, q * 3, 1), end: new Date(y, q * 3 + 3, 0) };
    }
    case 'this_year':
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
    default:
      return { start: null, end: null };
  }
}

function fmt(d) {
  if (!d) return undefined;
  return d.toISOString().slice(0, 10);
}

// ─── main component ──────────────────────────────────────────────────────────

const GlobalBilling = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  // ── filters ──
  const [status, setStatus]     = useState('all');
  const [period, setPeriod]     = useState('this_month');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);

  // ── modals ──
  const [confirmModal, setConfirmModal]   = useState(null);
  const [payModal, setPayModal]           = useState(null); // invoiceId

  // build query params
  const { start, end } = dateRange(period);
  const params = {
    status:     status !== 'all' ? status : undefined,
    search:     search || undefined,
    start_date: fmt(start),
    end_date:   fmt(end),
    page,
    limit: 20,
  };

  // ── queries ──
  const { data: summaryData } = useQuery({
    queryKey: ['billing-global-summary'],
    queryFn: billingService.getGlobalSummary,
    staleTime: 60_000,
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: ['billing-global', params],
    queryFn: () => billingService.getGlobalInvoices(params),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  // ── mutations ──
  const emailMutation = useMutation({
    mutationFn: (id) => billingService.emailInvoice(id),
    onSuccess: () => {
      showSuccess('Invoice sent by email');
      queryClient.invalidateQueries(['billing-global']);
      queryClient.invalidateQueries(['billing-global-summary']);
    },
    onError: (e) => showError(e.response?.data?.message || 'Failed to send email'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => billingService.cancelInvoice(id),
    onSuccess: () => {
      showSuccess('Invoice cancelled');
      queryClient.invalidateQueries(['billing-global']);
      queryClient.invalidateQueries(['billing-global-summary']);
    },
    onError: () => showError('Failed to cancel invoice'),
  });

  // ── handlers ──
  const handleDownload = useCallback(async (inv) => {
    try {
      const blob = await billingService.downloadPDF(inv.id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `Invoice-${inv.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('PDF downloaded');
    } catch {
      showError('Failed to download PDF');
    }
  }, [showSuccess, showError]);

  const handleEmail = useCallback((inv) => {
    const client = inv.dossier?.client;
    setConfirmModal({
      title: 'Send Invoice by Email',
      message: `Send ${inv.invoice_number} to ${client?.email || 'client'}?`,
      confirmLabel: 'Send',
      danger: false,
      onConfirm: () => emailMutation.mutate(inv.id),
    });
  }, [emailMutation]);

  const handleCancel = useCallback((inv) => {
    setConfirmModal({
      title: 'Cancel Invoice',
      message: `Cancel invoice ${inv.invoice_number}? This cannot be undone.`,
      confirmLabel: 'Cancel Invoice',
      danger: true,
      onConfirm: () => cancelMutation.mutate(inv.id),
    });
  }, [cancelMutation]);

  const handleExportCSV = useCallback(async () => {
    try {
      // fetch all matching invoices (no pagination) for export
      const all = await billingService.getGlobalInvoices({ ...params, limit: 10000, page: 1 });
      billingService.exportCSV(all.invoices || []);
      showSuccess('CSV exported');
    } catch {
      showError('Failed to export CSV');
    }
  }, [params, showSuccess, showError]);

  // ── filter change resets page ──
  const changeStatus = (v) => { setStatus(v); setPage(1); };
  const changePeriod = (v) => { setPeriod(v); setPage(1); };
  const changeSearch = (v) => { setSearch(v); setPage(1); };

  const summary   = summaryData?.data || {};
  const invoices  = listData?.invoices || [];
  const totalPages = listData?.pages || 1;
  const totalCount = listData?.total  || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">All invoices across all clients</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Invoiced" value={summary.totalInvoiced  || 0} color="blue"   icon={FileText}    />
        <SummaryCard label="Paid"           value={summary.totalPaid       || 0} color="green"  icon={DollarSign}  />
        <SummaryCard label="Outstanding"    value={summary.totalOutstanding || 0} color="orange" icon={Clock}       />
        <SummaryCard label="Overdue"        value={summary.totalOverdue    || 0} color="red"    icon={AlertCircle} />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        {/* Status */}
        <select
          value={status}
          onChange={(e) => changeStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Period */}
        <select
          value={period}
          onChange={(e) => changePeriod(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_quarter">This Quarter</option>
          <option value="this_year">This Year</option>
          <option value="all">All Time</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice number…"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <span className="ml-auto text-sm text-gray-500">{totalCount} invoice{totalCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No invoices found for the selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Amount', 'Paid', 'Balance', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((inv) => {
                  const client  = inv.dossier?.client;
                  const balance = Math.max(0, parseFloat(inv.total_amount) - parseFloat(inv.amount_paid));
                  const canPay  = ['sent', 'partial', 'overdue'].includes(inv.status);
                  const canEmail = inv.status !== 'cancelled' && client?.email;
                  const canCancel = ['draft', 'sent'].includes(inv.status) && hasPermission('billing:update');

                  return (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      {/* Invoice # */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">{inv.invoice_number}</span>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {client ? (
                          <button
                            onClick={() => navigate(`/clients/${client.id}`)}
                            className="text-sm text-gray-900 hover:text-blue-600 font-medium"
                          >
                            {client.first_name} {client.last_name}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                        {inv.dossier?.dossier_number && (
                          <p className="text-xs text-gray-400">{inv.dossier.dossier_number}</p>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inv.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>

                      {/* Amounts */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        €{parseFloat(inv.total_amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">
                        €{parseFloat(inv.amount_paid).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-orange-600">
                        €{balance.toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={inv.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* Download PDF */}
                          <button onClick={() => handleDownload(inv)} title="Download PDF"
                            className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors">
                            <Download className="h-4 w-4" />
                          </button>

                          {/* Email */}
                          {canEmail && (
                            <button onClick={() => handleEmail(inv)} title="Send by Email"
                              disabled={emailMutation.isPending}
                              className="p-1 text-purple-400 hover:text-purple-700 rounded transition-colors disabled:opacity-50">
                              <Mail className="h-4 w-4" />
                            </button>
                          )}

                          {/* Record payment */}
                          {canPay && (
                            <button onClick={() => setPayModal(inv.id)} title="Record Payment"
                              className="p-1 text-green-500 hover:text-green-700 rounded transition-colors">
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}

                          {/* View client */}
                          {client && (
                            <button onClick={() => navigate(`/clients/${client.id}`)} title="View Client"
                              className="p-1 text-blue-400 hover:text-blue-700 rounded transition-colors">
                              <Eye className="h-4 w-4" />
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Record Payment modal */}
      {payModal && (
        <RecordPaymentModal
          invoiceId={payModal}
          onClose={() => setPayModal(null)}
          onSuccess={() => {
            setPayModal(null);
            queryClient.invalidateQueries(['billing-global']);
            queryClient.invalidateQueries(['billing-global-summary']);
            showSuccess('Payment recorded');
          }}
        />
      )}

      {/* Confirm modal */}
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

export default GlobalBilling;
