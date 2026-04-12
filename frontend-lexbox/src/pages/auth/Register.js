// ===================================================================
// LAW FIRM REGISTRATION PAGE
// Multi-step: 1) Select Plan → 2) Firm Details → 3) Contact → 4) Done
// ===================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { publicService } from '../../services/publicService';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  Users,
  HardDrive,
  Star,
  Zap,
  Shield,
  Loader2
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────

const STEPS = ['Choose Plan', 'Firm Details', 'Contact Person', 'Confirmation'];

const COMPANY_SIZES = [
  { value: '1-2',  label: '1–2 people' },
  { value: '3-5',  label: '3–5 people' },
  { value: '6-10', label: '6–10 people' },
  { value: '11-20',label: '11–20 people' },
  { value: '20+',  label: '20+ people' }
];

const PLAN_ICONS = { starter: Star, professional: Zap, enterprise: Shield };
const PLAN_COLORS = {
  starter:      { bg: 'bg-blue-50',   border: 'border-blue-500',   badge: 'bg-blue-100 text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700' },
  professional: { bg: 'bg-indigo-50', border: 'border-indigo-500', badge: 'bg-indigo-100 text-indigo-700', btn: 'bg-indigo-600 hover:bg-indigo-700', popular: true },
  enterprise:   { bg: 'bg-purple-50', border: 'border-purple-500', badge: 'bg-purple-100 text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700' }
};

const formatStorage = (gb) => gb >= 500 ? 'Unlimited' : `${gb} GB`;
const formatUsers   = (n)  => n >= 999  ? 'Unlimited' : `Up to ${n}`;

// ── Step 1 — Plan Selection ─────────────────────────────────────────

function StepPlan({ plans, selected, onSelect }) {
  if (!plans.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose your plan</h2>
      <p className="text-gray-500 mb-8">All plans include a 14-day free trial. No credit card required.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const key    = plan.code;
          const colors = PLAN_COLORS[key] || PLAN_COLORS.starter;
          const Icon   = PLAN_ICONS[key]  || Star;
          const isSelected = selected?.id === plan.id;

          return (
            <div
              key={plan.id}
              onClick={() => onSelect(plan)}
              className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200 ${
                isSelected ? `${colors.border} ${colors.bg} shadow-lg scale-[1.02]` : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {colors.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              {isSelected && (
                <div className="absolute top-4 right-4 h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl mb-4 ${colors.badge}`}>
                <Icon className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-3xl font-extrabold text-gray-900">€{plan.price_monthly}</span>
                <span className="text-gray-500 text-sm">/month</span>
                {plan.price_yearly > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    €{plan.price_yearly}/year — save €{(plan.price_monthly * 12 - plan.price_yearly).toFixed(0)}
                  </p>
                )}
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-700">
                  <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {formatUsers(plan.max_users)} users
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <HardDrive className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {formatStorage(plan.max_storage_gb)} storage
                </li>
                {plan.max_clients && (
                  <li className="flex items-center gap-2 text-gray-700">
                    <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    Up to {plan.max_clients} clients
                  </li>
                )}
                {plan.features?.document_encryption && (
                  <li className="flex items-center gap-2 text-green-700">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    AES-256 document encryption
                  </li>
                )}
                {plan.features?.priority_support && (
                  <li className="flex items-center gap-2 text-green-700">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Priority support
                  </li>
                )}
                {plan.features?.audit_logs && (
                  <li className="flex items-center gap-2 text-green-700">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Audit logs
                  </li>
                )}
                {plan.features?.custom_branding && (
                  <li className="flex items-center gap-2 text-green-700">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Custom branding
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2 — Firm Details ───────────────────────────────────────────

function StepFirm({ data, onChange, errors }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Tell us about your firm</h2>
      <p className="text-gray-500 mb-8">This information will appear on your account.</p>

      <div className="space-y-5 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Law Firm Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.organization_name}
            onChange={e => onChange('organization_name', e.target.value)}
            placeholder="e.g. Smith & Partners Law Office"
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.organization_name ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.organization_name && <p className="mt-1 text-sm text-red-600">{errors.organization_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Firm Size</label>
          <select
            value={data.company_size}
            onChange={e => onChange('company_size', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select team size</option>
            {COMPANY_SIZES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anything else you'd like us to know? <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={data.message}
            onChange={e => onChange('message', e.target.value)}
            rows={3}
            placeholder="Special requirements, questions, or how you heard about us..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Contact Person ─────────────────────────────────────────

function StepContact({ data, onChange, errors }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Contact person</h2>
      <p className="text-gray-500 mb-8">This person will receive the account credentials once approved.</p>

      <div className="space-y-5 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.contact_first_name}
              onChange={e => onChange('contact_first_name', e.target.value)}
              placeholder="First name"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.contact_first_name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.contact_first_name && <p className="mt-1 text-sm text-red-600">{errors.contact_first_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.contact_last_name}
              onChange={e => onChange('contact_last_name', e.target.value)}
              placeholder="Last name"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.contact_last_name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.contact_last_name && <p className="mt-1 text-sm text-red-600">{errors.contact_last_name}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={data.contact_email}
            onChange={e => onChange('contact_email', e.target.value)}
            placeholder="you@yourfirm.com"
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.contact_email ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.contact_email && <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="tel"
            value={data.contact_phone}
            onChange={e => onChange('contact_phone', e.target.value)}
            placeholder="+352 123 456 789"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 4 — Success ────────────────────────────────────────────────

function StepSuccess({ firmName, plan }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <Check className="h-10 w-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Request submitted!</h2>
      <p className="text-gray-600 max-w-md mx-auto mb-6">
        Thank you, <strong>{firmName}</strong>. Your registration request for the{' '}
        <strong>{plan?.name}</strong> plan has been received.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 max-w-sm mx-auto text-left space-y-2 text-sm text-gray-700">
        <p className="font-semibold text-blue-800">What happens next?</p>
        <p>✅ Our team reviews your request (1–2 business days)</p>
        <p>✅ You'll receive your login credentials by email</p>
        <p>✅ Your 14-day free trial starts immediately</p>
      </div>
    </div>
  );
}

// ── Main Register Component ─────────────────────────────────────────

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    selected_plan: null,
    organization_name: '',
    company_size: '',
    message: '',
    contact_first_name: '',
    contact_last_name: '',
    contact_email: '',
    contact_phone: ''
  });

  useEffect(() => {
    publicService.getPlans()
      .then(res => setPlans(res.data || []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, []);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateStep = () => {
    const e = {};
    if (step === 0 && !form.selected_plan) {
      e.selected_plan = 'Please select a plan to continue';
    }
    if (step === 1 && !form.organization_name.trim()) {
      e.organization_name = 'Firm name is required';
    }
    if (step === 2) {
      if (!form.contact_first_name.trim()) e.contact_first_name = 'First name is required';
      if (!form.contact_last_name.trim())  e.contact_last_name  = 'Last name is required';
      if (!form.contact_email.trim())      e.contact_email      = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.contact_email)) e.contact_email = 'Enter a valid email';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await publicService.submitOrgRequest({
        organization_name:   form.organization_name,
        contact_first_name:  form.contact_first_name,
        contact_last_name:   form.contact_last_name,
        contact_email:       form.contact_email,
        contact_phone:       form.contact_phone,
        company_size:        form.company_size,
        plan_id:             form.selected_plan?.id,
        message:             form.message
      });
      setStep(3); // success
    } catch (err) {
      const errBody = err.response?.data?.error;
      const details = errBody?.details;
      if (details?.length) {
        setSubmitError(details.map(d => d.message).join(' · '));
      } else {
        setSubmitError(errBody?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isLastFormStep = step === 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">LexBox</span>
        </Link>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Already have an account? <span className="text-blue-600 font-medium">Sign in</span>
        </button>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-4xl">

          {/* Step indicator */}
          {step < 3 && (
            <div className="flex items-center justify-center mb-10">
              {STEPS.slice(0, 3).map((label, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      i < step  ? 'bg-blue-600 text-white' :
                      i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                                   'bg-gray-200 text-gray-500'
                    }`}>
                      {i < step ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={`mt-1 text-xs font-medium hidden sm:block ${i === step ? 'text-blue-600' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`h-0.5 w-16 sm:w-24 mx-2 mb-4 transition-colors ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

            {/* Plan selection error */}
            {step === 0 && errors.selected_plan && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {errors.selected_plan}
              </div>
            )}

            {/* Step content */}
            {step === 0 && (
              <StepPlan
                plans={plans}
                selected={form.selected_plan}
                onSelect={plan => updateField('selected_plan', plan)}
              />
            )}
            {step === 1 && (
              <StepFirm
                data={form}
                onChange={updateField}
                errors={errors}
              />
            )}
            {step === 2 && (
              <StepContact
                data={form}
                onChange={updateField}
                errors={errors}
              />
            )}
            {step === 3 && (
              <StepSuccess
                firmName={form.organization_name}
                plan={form.selected_plan}
              />
            )}

            {/* Submit error */}
            {submitError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Navigation buttons */}
            {step < 3 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                {step > 0 ? (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                ) : (
                  <div />
                )}

                {isLastFormStep ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                    ) : (
                      <>Submit Request <ChevronRight className="h-4 w-4" /></>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Success — back to login */}
            {step === 3 && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Back to Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
