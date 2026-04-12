// ===================================================================
// TRIAL BANNER
// Shows at the top of every page for org admins during/after trial.
// ===================================================================

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X, Zap, Loader2 } from 'lucide-react';
import { orgService } from '../../services/orgService';
import { publicService } from '../../services/publicService';
import { useAuth } from '../../context/AuthContext';

const UpgradeModal = ({ currentPlan, onClose, onUpgraded }) => {
  const [plans, setPlans]           = useState([]);
  const [selectedId, setSelectedId] = useState(currentPlan?.id ? String(currentPlan.id) : '');
  const [message, setMessage]       = useState('');
  const [busy, setBusy]             = useState(false);
  const [done, setDone]             = useState(false);
  const [activatedPlanName, setActivatedPlanName] = useState('');

  useEffect(() => {
    publicService.getPlans().then(res => setPlans(res.data || [])).catch(() => {});
  }, []);

  const chosenPlan = plans.find(p => String(p.id) === selectedId) || currentPlan;

  const handleSubmit = async () => {
    setBusy(true);
    try {
      const res = await orgService.requestUpgrade(selectedId ? parseInt(selectedId) : undefined, message);
      setActivatedPlanName(res.data?.plan?.name || chosenPlan?.name || 'your plan');
      setDone(true);
      onUpgraded && onUpgraded();
    } catch {
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">You're now on a paid plan!</h3>
          <p className="text-gray-500 text-sm mb-6">
            Your account has been upgraded to <strong>{activatedPlanName}</strong>.
            You will receive your first invoice at the start of next month.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Upgrade to a paid plan</h3>
        <p className="text-gray-500 text-sm mb-4">
          Choose your plan below. Your account will be activated immediately and invoiced at the start of each billing month.
        </p>

        {/* Plan selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select plan</label>
          {plans.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
            </div>
          ) : (
            <div className="space-y-2">
              {plans.map(p => (
                <label
                  key={p.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-colors ${
                    String(p.id) === selectedId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="plan"
                      value={String(p.id)}
                      checked={String(p.id) === selectedId}
                      onChange={e => setSelectedId(e.target.value)}
                      className="accent-blue-600"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.max_users} users · {p.max_storage_gb} GB</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 flex-shrink-0">€{p.price_monthly}/mo</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600 space-y-1 mb-4">
          <p>✅ Account activated immediately — no interruption</p>
          <p>✅ First invoice at the start of next month</p>
          <p>✅ Pay by bank transfer (details in invoice email)</p>
          <p>✅ Cancel any time with 30 days notice</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={2}
            placeholder="Any questions or special requests…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
          >
            Not yet
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy || !selectedId}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Activate Now
          </button>
        </div>
      </div>
    </div>
  );
};

const TrialBanner = () => {
  const { user } = useAuth();
  const [status, setStatus]       = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Only show for org admins (role=admin with an org), not super_admin
  const shouldShow = user?.role === 'admin' && !!user?.organization_id;

  const loadStatus = () => {
    if (!shouldShow) return;
    orgService.getTrialStatus()
      .then(res => setStatus(res.data))
      .catch(() => {});
  };

  useEffect(() => { loadStatus(); }, [shouldShow]); // eslint-disable-line

  if (!shouldShow || !status || dismissed) return null;

  const { subscription_status, days_left, plan } = status;

  // Hide banner once fully active
  if (subscription_status === 'active') return null;

  let bg, icon, text, urgent = false;

  if (subscription_status === 'past_due' || status.org_status === 'suspended') {
    bg     = 'bg-red-600';
    icon   = <AlertTriangle className="h-4 w-4 flex-shrink-0" />;
    text   = 'Your trial has ended and your account is suspended. Upgrade to restore access.';
    urgent = true;
  } else if (days_left <= 1) {
    bg     = 'bg-red-500';
    icon   = <AlertTriangle className="h-4 w-4 flex-shrink-0" />;
    text   = 'Your trial ends today! Upgrade now to avoid interruption.';
    urgent = true;
  } else if (days_left <= 7) {
    bg     = 'bg-amber-500';
    icon   = <Clock className="h-4 w-4 flex-shrink-0" />;
    text   = `Your trial ends in ${days_left} day${days_left !== 1 ? 's' : ''}. Upgrade to keep access.`;
  } else {
    bg     = 'bg-blue-600';
    icon   = <Clock className="h-4 w-4 flex-shrink-0" />;
    text   = `You have ${days_left} days left in your free trial.`;
  }

  return (
    <>
      <div className={`${bg} text-white px-4 py-2.5 flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-2 text-sm font-medium min-w-0">
          {icon}
          <span className="truncate">{text}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            {urgent ? 'Reactivate Now' : 'Upgrade Plan'}
          </button>
          {!urgent && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <UpgradeModal
          currentPlan={plan}
          onClose={() => setShowModal(false)}
          onUpgraded={() => { setShowModal(false); loadStatus(); }}
        />
      )}
    </>
  );
};

export default TrialBanner;
