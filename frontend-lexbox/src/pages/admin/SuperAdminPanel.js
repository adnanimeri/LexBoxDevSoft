// ===================================================================
// SUPER ADMIN PANEL
// Tabs: Dashboard | Org Requests | Organizations | Plans
// ===================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { superAdminService } from '../../services/superAdminService';
import {
  LayoutDashboard, ClipboardList, Building2, CreditCard, Settings,
  Check, X, ChevronDown, RefreshCw, AlertCircle, Loader2,
  Users, HardDrive, Clock, CheckCircle2, XCircle, Pause, Pencil,
  Mail, Send, Receipt
} from 'lucide-react';

// ── Shared helpers ──────────────────────────────────────────────────

const Badge = ({ color, children }) => {
  const colors = {
    green:  'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red:    'bg-red-100 text-red-700',
    blue:   'bg-blue-100 text-blue-700',
    gray:   'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-700'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    pending:   { color: 'yellow', label: 'Pending' },
    approved:  { color: 'green',  label: 'Approved' },
    rejected:  { color: 'red',    label: 'Rejected' },
    active:    { color: 'green',  label: 'Active' },
    trial:     { color: 'blue',   label: 'Trial' },
    suspended: { color: 'red',    label: 'Suspended' },
    cancelled: { color: 'gray',   label: 'Cancelled' },
    past_due:  { color: 'red',    label: 'Past Due' },
    deleted:   { color: 'gray',   label: 'Deleted' }
  };
  const s = map[status] || { color: 'gray', label: status };
  return <Badge color={s.color}>{s.label}</Badge>;
};

const StatCard = ({ icon: Icon, label, value, color = 'blue', onClick }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all' : ''}`}
    >
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
};

const ErrorBox = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
    <AlertCircle className="h-8 w-8 text-red-400" />
    <p className="text-sm">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    )}
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
  </div>
);

// ── Tab: Dashboard ──────────────────────────────────────────────────

const DashboardTab = ({ onNavigate }) => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    superAdminService.getDashboard()
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox message={error} onRetry={load} />;

  const orgs  = data.organizations;
  const users = data.users;
  const reqs  = data.requests;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Platform Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Building2}  label="Total Organizations"  value={orgs.total}      color="blue"   />
        <StatCard icon={CheckCircle2} label="Active"             value={orgs.active}     color="green"  />
        <StatCard icon={Clock}      label="On Trial"             value={orgs.trial}      color="yellow" />
        <StatCard icon={Pause}      label="Suspended"            value={orgs.suspended}  color="red"    />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Total Users"           value={users.total}          color="purple" />
        <StatCard icon={ClipboardList} label="Pending Requests"      value={reqs.pending}         color="yellow" />
        <StatCard icon={CreditCard}    label="Active Plans"          value={data.plans.active}    color="blue" />
        <StatCard icon={Receipt}       label="Invoices Pending"      value={data.invoices?.pending ?? 0} color="red" onClick={() => onNavigate('invoices', 'sent')} />
      </div>
    </div>
  );
};

// ── Tab: Org Requests ───────────────────────────────────────────────

const ApproveModal = ({ request, plans, onConfirm, onClose }) => {
  const [planId, setPlanId] = useState(request.requested_plan_id ? String(request.requested_plan_id) : '');
  const [notes, setNotes]   = useState('');
  const [busy, setBusy]     = useState(false);

  const requestedPlan = plans.find(p => p.id === request.requested_plan_id);

  const handleApprove = async () => {
    setBusy(true);
    await onConfirm(request.id, { plan_id: planId ? parseInt(planId) : undefined, review_notes: notes });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Approve Request</h3>
        <p className="text-sm text-gray-500 mb-5">
          This will create the organization <strong>{request.organization_name}</strong> and send credentials to{' '}
          <strong>{request.contact_email}</strong>.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Plan
              {requestedPlan && (
                <span className="ml-2 text-xs font-normal text-blue-600">
                  Client requested: {requestedPlan.name}
                </span>
              )}
            </label>
            <select
              value={planId}
              onChange={e => setPlanId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Default (Starter) —</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.max_users} users / {p.max_storage_gb}GB — €{p.price_monthly}/mo
                  {p.id === request.requested_plan_id ? ' ★ client selected' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Approved after phone verification"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={busy}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

const RejectModal = ({ request, onConfirm, onClose }) => {
  const [notes, setNotes] = useState('');
  const [busy, setBusy]   = useState(false);

  const handleReject = async () => {
    setBusy(true);
    await onConfirm(request.id, notes);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Reject Request</h3>
        <p className="text-sm text-gray-500 mb-5">
          Rejecting <strong>{request.organization_name}</strong>. Optionally provide a reason.
        </p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Reason for rejection (optional)..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={busy}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

const RequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('pending');
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget,  setRejectTarget]  = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = useCallback(() => {
    setLoading(true); setError('');
    Promise.all([
      superAdminService.getOrgRequests(filter),
      superAdminService.getPlans()
    ])
      .then(([reqRes, planRes]) => {
        setRequests(reqRes.data?.requests || []);
        setPlans(planRes.data || []);
      })
      .catch(() => setError('Failed to load requests'))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id, body) => {
    try {
      const res = await superAdminService.approveRequest(id, body);
      const pw  = res.data?.temp_password;
      showToast(`Approved! Temp password: ${pw || '(check email)'}`);
      setApproveTarget(null);
      load();
    } catch (e) {
      showToast(e.response?.data?.error?.message || 'Approve failed');
    }
  };

  const handleReject = async (id, notes) => {
    try {
      await superAdminService.rejectRequest(id, notes);
      showToast('Request rejected');
      setRejectTarget(null);
      load();
    } catch {
      showToast('Reject failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {toast}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No {filter === 'all' ? '' : filter} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{req.organization_name}</h3>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="text-sm text-gray-500 space-y-0.5">
                    <p>{req.contact_first_name} {req.contact_last_name} · {req.contact_email}</p>
                    {req.contact_phone && <p>{req.contact_phone}</p>}
                    {req.company_size   && <p>Team size: {req.company_size}</p>}
                    {req.message        && <p className="text-gray-400 italic mt-1">"{req.message}"</p>}
                    <p className="text-xs text-gray-400 pt-1">
                      Submitted {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setRejectTarget(req)}
                      className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 flex items-center gap-1"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => setApproveTarget(req)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                  </div>
                )}
              </div>

              {req.review_notes && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                  <span className="font-medium">Notes:</span> {req.review_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {approveTarget && (
        <ApproveModal
          request={approveTarget}
          plans={plans}
          onConfirm={handleApprove}
          onClose={() => setApproveTarget(null)}
        />
      )}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
};

// ── Tab: Organizations ──────────────────────────────────────────────

const OrgsTab = () => {
  const [orgs, setOrgs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy]       = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    superAdminService.getOrganizations()
      .then(res => setOrgs(res.data?.organizations || []))
      .catch(() => setError('Failed to load organizations'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkInvoiced = async (e, id) => {
    e.stopPropagation();
    setBusy(id);
    try { await superAdminService.markInvoiced(id); load(); }
    catch (err) { setError(err.response?.data?.error?.message || 'Action failed'); }
    finally { setBusy(''); }
  };

  const handleStatus = async (e, id, status) => {
    e.stopPropagation();
    setBusy(id);
    try { await superAdminService.updateOrgStatus(id, status); load(); }
    catch (err) { setError(err.response?.data?.error?.message || 'Action failed'); }
    finally { setBusy(''); }
  };

  const handleActivate = async (e, org) => {
    e.stopPropagation();
    setBusy(org.id);
    try {
      // Only restore org.status — leave subscription_status (trial/active) unchanged
      await superAdminService.updateOrgStatus(org.id, 'active');
      load();
    } catch (err) { setError(err.response?.data?.error?.message || 'Action failed'); }
    finally { setBusy(''); }
  };


  if (loading) return <Spinner />;
  if (error)   return <ErrorBox message={error} onRetry={load} />;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {orgs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No organizations yet</p>
        </div>
      ) : orgs.map(org => (
        <div key={org.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div
            className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50"
            onClick={() => setExpanded(expanded === org.id ? null : org.id)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700 font-bold text-sm">{org.name[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{org.name}</p>
                <p className="text-sm text-gray-500">{org.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <StatusBadge status={org.status === 'suspended' ? 'suspended' : org.subscription_status} />
              {org.subscriptionPlan && <Badge color="gray">{org.subscriptionPlan.name}</Badge>}
              {org.metadata?.invoice_pending && <Badge color="red">Invoice Pending</Badge>}
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expanded === org.id ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {expanded === org.id && (
            <div className="px-5 pb-5 border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{org.stats?.users ?? 0}</p>
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-0.5">
                    <Users className="h-3 w-3" /> Users
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{org.stats?.clients ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Clients</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{org.stats?.dossiers ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Dossiers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{org.stats?.documents ?? 0}</p>
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-0.5">
                    <HardDrive className="h-3 w-3" /> Docs
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 flex-wrap">
                {/* Mark Invoiced button — only when invoice is pending */}
                {org.metadata?.invoice_pending && (
                  <button
                    disabled={busy === org.id}
                    onClick={(e) => handleMarkInvoiced(e, org.id)}
                    className="px-3 py-1.5 border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg text-sm flex items-center gap-1"
                  >
                    {busy === org.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Receipt className="h-3.5 w-3.5" />}
                    Mark Invoiced
                  </button>
                )}

                {/* Activate button — only when org is suspended */}
                {org.status === 'suspended' && (
                  <button
                    disabled={busy === org.id}
                    onClick={(e) => handleActivate(e, org)}
                    className="px-3 py-1.5 border border-green-200 text-green-700 hover:bg-green-50 rounded-lg text-sm flex items-center gap-1"
                  >
                    {busy === org.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Activate
                  </button>
                )}

                {/* Suspend button — only when org is active (covers trial orgs too) */}
                {org.status === 'active' && (
                  <button
                    disabled={busy === org.id}
                    onClick={(e) => handleStatus(e, org.id, 'suspended')}
                    className="px-3 py-1.5 border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg text-sm flex items-center gap-1"
                  >
                    {busy === org.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Suspend
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Created {new Date(org.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {org.trial_ends_at && ` · Trial ends ${new Date(org.trial_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Plan Edit Modal ─────────────────────────────────────────────────

const FEATURE_KEYS = [
  'document_encryption',
  'email_invoices',
  'pdf_export',
  'api_access',
  'priority_support',
  'custom_branding',
  'audit_logs'
];

const PlanEditModal = ({ plan, onSave, onClose }) => {
  const [form, setForm] = useState({
    name:           plan.name,
    description:    plan.description || '',
    price_monthly:  plan.price_monthly,
    price_yearly:   plan.price_yearly,
    max_users:      plan.max_users,
    max_storage_gb: plan.max_storage_gb,
    max_clients:    plan.max_clients ?? '',
    max_dossiers:   plan.max_dossiers ?? '',
    features:       { ...plan.features }
  });
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setFeature = (key, val) => setForm(f => ({ ...f, features: { ...f.features, [key]: val } }));

  const handleSave = async () => {
    setBusy(true); setError('');
    try {
      await onSave(plan.id, {
        name:           form.name,
        description:    form.description,
        price_monthly:  parseFloat(form.price_monthly),
        price_yearly:   parseFloat(form.price_yearly),
        max_users:      parseInt(form.max_users),
        max_storage_gb: parseInt(form.max_storage_gb),
        max_clients:    form.max_clients !== '' ? parseInt(form.max_clients) : null,
        max_dossiers:   form.max_dossiers !== '' ? parseInt(form.max_dossiers) : null,
        features:       form.features
      });
      onClose();
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const field = (label, key, type = 'text', hint = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {hint && <span className="text-gray-400 font-normal text-xs">{hint}</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Edit Plan — {plan.name}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Basic */}
          {field('Plan Name', 'name')}
          {field('Description', 'description')}

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            {field('Monthly Price (€)', 'price_monthly', 'number')}
            {field('Yearly Price (€)', 'price_yearly', 'number')}
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-3">
            {field('Max Users', 'max_users', 'number')}
            {field('Storage (GB)', 'max_storage_gb', 'number')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('Max Clients', 'max_clients', 'number', '(blank = unlimited)')}
            {field('Max Dossiers', 'max_dossiers', 'number', '(blank = unlimited)')}
          </div>

          {/* Features */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Features</p>
            <div className="space-y-2">
              {FEATURE_KEYS.map(key => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!form.features[key]}
                    onChange={e => setFeature(key, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize group-hover:text-gray-900">
                    {key.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Tab: Subscription Invoices ──────────────────────────────────────

const GenerateInvoiceModal = ({ orgs, onCreated, onClose }) => {
  const [orgId,   setOrgId]   = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [dueDays, setDueDays] = useState('30');
  const [notes,   setNotes]   = useState('');
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState('');

  const selectedOrg = orgs.find(o => o.id === orgId);

  const handle = async () => {
    if (!orgId) { setErr('Select an organization'); return; }
    setBusy(true); setErr('');
    try {
      await superAdminService.createSubscriptionInvoice({
        organization_id: orgId,
        tax_rate: parseFloat(taxRate) || 0,
        due_days: parseInt(dueDays)   || 30,
        notes: notes || undefined
      });
      onCreated();
    } catch (e) {
      setErr(e.response?.data?.error?.message || 'Failed to generate invoice');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Generate Subscription Invoice</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
            <select value={orgId} onChange={e => setOrgId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Select organization —</option>
              {orgs.filter(o => o.subscription_status === 'active').map(o => (
                <option key={o.id} value={o.id}>
                  {o.name} · {o.subscriptionPlan?.name || 'No plan'} · {o.billing_cycle}
                </option>
              ))}
            </select>
          </div>

          {selectedOrg && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 space-y-0.5">
              <p><strong>Plan:</strong> {selectedOrg.subscriptionPlan?.name || '—'}</p>
              <p><strong>Cycle:</strong> {selectedOrg.billing_cycle === 'yearly' ? 'Annual' : 'Monthly'}</p>
              <p><strong>Price:</strong> €{selectedOrg.billing_cycle === 'yearly'
                ? selectedOrg.subscriptionPlan?.price_yearly
                : selectedOrg.subscriptionPlan?.price_monthly}/
                {selectedOrg.billing_cycle === 'yearly' ? 'yr' : 'mo'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input type="number" min="0" max="100" step="0.5" value={taxRate}
                onChange={e => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due (days)</label>
              <input type="number" min="1" value={dueDays}
                onChange={e => setDueDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          <button onClick={handle} disabled={busy || !orgId}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
            Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

const RecordSubPaymentModal = ({ invoice, onPaid, onClose }) => {
  const [amount,    setAmount]    = useState(parseFloat(invoice.total_amount).toFixed(2));
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);
  const [method,    setMethod]    = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes,     setNotes]     = useState('');
  const [busy,      setBusy]      = useState(false);
  const [err,       setErr]       = useState('');

  const handle = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setErr('Enter a valid amount'); return; }
    setBusy(true); setErr('');
    try {
      await superAdminService.markSubscriptionInvoicePaid(invoice.id, {
        payment_date:     date,
        payment_method:   method,
        reference_number: reference || null,
        notes:            notes     || null
      });
      onPaid();
    } catch (e2) {
      setErr(e2.response?.data?.error?.message || 'Failed to record payment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Invoice <strong>{invoice.invoice_number}</strong> · {invoice.organization?.name} ·{' '}
          <strong>€{parseFloat(invoice.total_amount).toFixed(2)}</strong>
        </p>

        <form onSubmit={handle} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 text-sm">€</span>
              <input type="number" min="0.01" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
            <select value={method} onChange={e => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Transaction ID</label>
            <input type="text" value={reference} onChange={e => setReference(e.target.value)}
              placeholder="e.g. TXN-123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const INV_TABS = ['draft', 'sent', 'paid'];

// ── Shared inline toast for the invoices tab ──
const InvToast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast.msg) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast.msg) return null;
  return (
    <div className={`fixed top-5 right-5 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${toast.ok ? 'bg-gray-900' : 'bg-red-600'}`}>
      {toast.ok ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
      {toast.msg}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
};

// ── Shared confirm dialog for the invoices tab ──
const InvConfirm = ({ config, onConfirm, onCancel }) => {
  if (!config) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[55] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${config.danger ? 'bg-red-50' : 'bg-blue-50'}`}>
          {config.danger
            ? <AlertCircle className={`h-6 w-6 text-red-500`} />
            : <Send className="h-6 w-6 text-blue-500" />}
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">{config.title}</h3>
        <p className="text-sm text-gray-500 mb-6">{config.message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${config.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {config.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SubscriptionInvoicesTab = ({ defaultFilter = 'draft' }) => {
  const [invoices,    setInvoices]    = useState([]);
  const [orgs,        setOrgs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [busy,        setBusy]        = useState('');
  const [filter,      setFilter]      = useState(defaultFilter);
  const [showGen,     setShowGen]     = useState(false);
  const [payTarget,   setPayTarget]   = useState(null);
  const [toast,       setToast]       = useState({ msg: '', ok: true });
  const [confirm,     setConfirm]     = useState(null); // { title, message, danger, confirmLabel, onConfirm }

  const showToast = (msg, ok = true) => setToast({ msg, ok });
  const closeToast = useCallback(() => setToast({ msg: '', ok: true }), []);

  const load = useCallback(() => {
    setLoading(true); setError('');
    Promise.all([
      superAdminService.getSubscriptionInvoices(),
      superAdminService.getOrganizations({ limit: 200 })
    ])
      .then(([inv, org]) => {
        setInvoices(inv.data || []);
        setOrgs(org.data?.organizations || []);
      })
      .catch(() => setError('Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = (inv) => {
    setConfirm({
      title:        'Send Invoice',
      message:      `Send invoice ${inv.invoice_number} to ${inv.organization?.email}? The PDF will be attached to the email.`,
      danger:       false,
      confirmLabel: 'Send Invoice',
      onConfirm:    async () => {
        setConfirm(null);
        setBusy(inv.id + '-send');
        try {
          await superAdminService.sendSubscriptionInvoice(inv.id);
          showToast(`Invoice ${inv.invoice_number} sent to ${inv.organization?.email}`);
          load();
        } catch (e) {
          showToast(e.response?.data?.error?.message || 'Failed to send invoice', false);
        } finally {
          setBusy('');
        }
      }
    });
  };

  const handleDownload = async (inv) => {
    try {
      await superAdminService.downloadSubscriptionInvoicePdf(inv.id, inv.invoice_number);
      showToast(`Invoice ${inv.invoice_number} downloaded`);
    } catch {
      showToast('Failed to download PDF', false);
    }
  };

  const handleDelete = (inv) => {
    setConfirm({
      title:        'Delete Draft Invoice',
      message:      `Delete invoice ${inv.invoice_number} for ${inv.organization?.name}? This action cannot be undone.`,
      danger:       true,
      confirmLabel: 'Delete',
      onConfirm:    async () => {
        setConfirm(null);
        setBusy(inv.id + '-del');
        try {
          await superAdminService.deleteSubscriptionInvoice(inv.id);
          showToast(`Invoice ${inv.invoice_number} deleted`);
          load();
        } catch (e) {
          showToast(e.response?.data?.error?.message || 'Failed to delete invoice', false);
        } finally {
          setBusy('');
        }
      }
    });
  };

  const filtered = invoices.filter(i => i.status === filter);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <InvToast toast={toast} onClose={closeToast} />
      <InvConfirm config={confirm} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />

      {showGen && (
        <GenerateInvoiceModal
          orgs={orgs}
          onCreated={() => { setShowGen(false); load(); }}
          onClose={() => setShowGen(false)}
        />
      )}
      {payTarget && (
        <RecordSubPaymentModal
          invoice={payTarget}
          onPaid={() => { setPayTarget(null); load(); }}
          onClose={() => setPayTarget(null)}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {/* Status tabs */}
        <div className="flex gap-2">
          {INV_TABS.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {' '}
              <span className={`text-xs ${filter === s ? 'text-blue-200' : 'text-gray-400'}`}>
                ({invoices.filter(i => i.status === s).length})
              </span>
            </button>
          ))}
        </div>
        {/* Generate button — only in Draft tab */}
        {filter === 'draft' && (
          <button onClick={() => setShowGen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Receipt className="h-4 w-4" /> Generate Invoice
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No {filter} invoices
          {filter === 'draft' && (
            <p className="mt-2">
              <button onClick={() => setShowGen(true)} className="text-blue-500 hover:underline text-sm">
                Generate the first invoice
              </button>
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Invoice #</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Organization</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Plan · Cycle</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Period</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                {filter === 'paid' && (
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Payment</th>
                )}
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-700">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.organization?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {inv.plan_name} · <span className="capitalize">{inv.billing_cycle}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(inv.period_start).toLocaleDateString()} –<br />
                    {new Date(inv.period_end).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    €{parseFloat(inv.total_amount).toFixed(2)}
                  </td>

                  {/* Payment details column — Paid tab only */}
                  {filter === 'paid' && (
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <p className="capitalize">{inv.payment_method?.replace('_', ' ') || '—'}</p>
                      {inv.payment_reference && <p className="font-mono text-gray-400">{inv.payment_reference}</p>}
                      {inv.paid_at && <p>{new Date(inv.paid_at).toLocaleDateString()}</p>}
                    </td>
                  )}

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Draft: Download + Send + Delete */}
                      {filter === 'draft' && (
                        <>
                          <button onClick={() => handleDownload(inv)} title="Download PDF"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                            <Receipt className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleSend(inv)} title="Send to org"
                            disabled={busy === inv.id + '-send'}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50">
                            {busy === inv.id + '-send'
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Send className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => handleDelete(inv)} title="Delete draft"
                            disabled={busy === inv.id + '-del'}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
                            {busy === inv.id + '-del'
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <X className="h-3.5 w-3.5" />}
                          </button>
                        </>
                      )}

                      {/* Sent: Record Payment */}
                      {filter === 'sent' && (
                        <button onClick={() => setPayTarget(inv)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium transition-colors">
                          <Check className="h-3.5 w-3.5" /> Record Payment
                        </button>
                      )}

                      {/* Paid: Download PDF only */}
                      {filter === 'paid' && (
                        <button onClick={() => handleDownload(inv)} title="Download PDF"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                          <Receipt className="h-3.5 w-3.5" />
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
    </div>
  );
};

// ── Tab: Plans ──────────────────────────────────────────────────────

const PlansTab = () => {
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState('');
  const [editTarget, setEditTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true); setError('');
    superAdminService.getPlans()
      .then(res => setPlans(res.data || []))
      .catch(() => setError('Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (plan) => {
    setBusy(plan.id);
    try { await superAdminService.updatePlan(plan.id, { is_active: !plan.is_active }); load(); }
    catch {}
    finally { setBusy(''); }
  };

  const handleSavePlan = async (id, body) => {
    await superAdminService.updatePlan(id, body);
    load();
  };

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map(plan => (
          <div key={plan.id} className={`bg-white border-2 rounded-xl p-5 flex flex-col ${plan.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{plan.code}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge color={plan.is_active ? 'green' : 'gray'}>{plan.is_active ? 'Active' : 'Inactive'}</Badge>
                <button
                  onClick={() => setEditTarget(plan)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  title="Edit plan"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="mb-4">
              <span className="text-2xl font-extrabold text-gray-900">€{plan.price_monthly}</span>
              <span className="text-gray-400 text-sm">/mo</span>
              {plan.price_yearly > 0 && (
                <p className="text-xs text-green-600">€{plan.price_yearly}/year</p>
              )}
            </div>

            {/* Limits */}
            <ul className="space-y-1.5 text-sm text-gray-600 mb-4">
              <li className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                {plan.max_users >= 999 ? 'Unlimited' : `Up to ${plan.max_users}`} users
              </li>
              <li className="flex items-center gap-2">
                <HardDrive className="h-3.5 w-3.5 text-gray-400" />
                {plan.max_storage_gb >= 500 ? 'Unlimited' : `${plan.max_storage_gb} GB`} storage
              </li>
              {plan.max_clients && (
                <li className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                  Up to {plan.max_clients} clients
                </li>
              )}
            </ul>

            {/* Features */}
            <div className="space-y-1 text-xs text-gray-500 mb-5 flex-1">
              {Object.entries(plan.features || {}).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5">
                  {val
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    : <XCircle      className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />}
                  <span className={val ? '' : 'text-gray-300'}>{key.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setEditTarget(plan)}
                className="flex-1 px-3 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => toggleActive(plan)}
                disabled={busy === plan.id}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 border transition-colors ${
                  plan.is_active
                    ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    : 'border-green-200 text-green-700 hover:bg-green-50'
                }`}
              >
                {busy === plan.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {plan.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editTarget && (
        <PlanEditModal
          plan={editTarget}
          onSave={handleSavePlan}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
};

// ── Tab: Platform Settings ──────────────────────────────────────────

const SettingsTab = () => {
  const [form, setForm] = useState({
    smtp_host: '', smtp_port: '587', smtp_secure: false,
    smtp_user: '', smtp_pass: '', smtp_from: ''
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [toast, setToast]       = useState({ msg: '', ok: true });

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 4000);
  };

  useEffect(() => {
    superAdminService.getSettings()
      .then(res => {
        const data = { ...res.data };
        // Never populate the password field with the masked value — leave it blank
        // so the user only types a new password when they want to change it
        data.smtp_pass = '';
        setForm(f => ({ ...f, ...data }));
      })
      .catch(() => showToast('Failed to load settings', false))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await superAdminService.saveSettings(form);
      showToast('SMTP settings saved successfully');
    } catch (e) {
      showToast(e.response?.data?.error?.message || 'Save failed', false);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) { showToast('Enter a recipient email first', false); return; }
    setTesting(true);
    try {
      await superAdminService.testEmail(testEmail);
      showToast(`Test email sent to ${testEmail}`);
    } catch (e) {
      showToast(e.response?.data?.error?.message || 'Test failed — check SMTP credentials', false);
    } finally {
      setTesting(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  if (loading) return <Spinner />;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm text-white max-w-sm ${toast.ok ? 'bg-gray-900' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Mailtrap hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1 flex items-center gap-2"><Mail className="h-4 w-4" /> Mailtrap (recommended for testing)</p>
        <p className="text-blue-700 mb-2">Sign up free at <strong>mailtrap.io</strong> → Inboxes → SMTP Settings → copy credentials below.</p>
        <code className="text-xs bg-blue-100 rounded px-2 py-1 block">
          Host: sandbox.smtp.mailtrap.io &nbsp;·&nbsp; Port: 2525 &nbsp;·&nbsp; Secure: off
        </code>
      </div>

      {/* SMTP form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 text-base">SMTP Configuration</h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">{field('SMTP Host', 'smtp_host', 'text', 'sandbox.smtp.mailtrap.io')}</div>
          <div>{field('Port', 'smtp_port', 'number', '2525')}</div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="smtp_secure"
            checked={!!form.smtp_secure}
            onChange={e => set('smtp_secure', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="smtp_secure" className="text-sm text-gray-700">Use SSL/TLS (port 465)</label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field('SMTP Username', 'smtp_user', 'text', 'your_mailtrap_user')}
          {field('SMTP Password', 'smtp_pass', 'password', 'Leave blank to keep current')}
        </div>

        {field('From Email', 'smtp_from', 'email', 'noreply@lexbox.com')}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Settings
        </button>
      </div>

      {/* Test email */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 text-base mb-3">Send Test Email</h3>
        <p className="text-sm text-gray-500 mb-4">
          Saves current settings first, then sends a test email to verify the configuration works.
        </p>
        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Test
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main SuperAdminPanel ────────────────────────────────────────────

const TABS = [
  { id: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'requests',  label: 'Org Requests',  icon: ClipboardList   },
  { id: 'orgs',      label: 'Organizations', icon: Building2        },
  { id: 'invoices',  label: 'Invoices (Org)', icon: Receipt         },
  { id: 'plans',     label: 'Plans',         icon: CreditCard       },
  { id: 'settings',  label: 'Settings',      icon: Settings         }
];

const SuperAdminPanel = () => {
  const [activeTab,      setActiveTab]      = useState('requests');
  const [invoicesFilter, setInvoicesFilter] = useState('draft');

  const handleNavigate = (tab, filter) => {
    if (filter) setInvoicesFilter(filter);
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
        <p className="text-gray-500 text-sm">Platform-level management</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'dashboard' && <DashboardTab onNavigate={handleNavigate} />}
        {activeTab === 'requests'  && <RequestsTab />}
        {activeTab === 'orgs'      && <OrgsTab />}
        {activeTab === 'invoices'  && <SubscriptionInvoicesTab key={invoicesFilter} defaultFilter={invoicesFilter} />}
        {activeTab === 'plans'     && <PlansTab />}
        {activeTab === 'settings'  && <SettingsTab />}
      </div>
    </div>
  );
};

export default SuperAdminPanel;
