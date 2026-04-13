// ===================================================================
// USER MANAGEMENT PAGE
// ===================================================================
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus, Search, MoreVertical, Eye, Edit2,
  KeyRound, UserCheck, UserX, Trash2, X, RefreshCw,
  Eye as EyeIcon, EyeOff
} from 'lucide-react';
import apiClient from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// ── helpers ──────────────────────────────────────────────────────────
const ROLES = ['admin', 'lawyer', 'secretary'];

const ROLE_BADGE = {
  admin:     'bg-purple-100 text-purple-700',
  lawyer:    'bg-blue-100 text-blue-700',
  secretary: 'bg-gray-100 text-gray-700',
};

const ROLE_LABEL = { admin: 'Admin', lawyer: 'Lawyer', secretary: 'Secretary' };

const initials = (u) =>
  `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase();

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const genPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// ── API calls ─────────────────────────────────────────────────────────
const userApi = {
  list:          (params) => apiClient.get('/users', { params }),
  get:           (id)     => apiClient.get(`/users/${id}`),
  create:        (data)   => apiClient.post('/users', data),
  update:        (id, d)  => apiClient.put(`/users/${id}`, d),
  toggleStatus:  (id)     => apiClient.patch(`/users/${id}/toggle-status`),
  resetPassword: (id, d)  => apiClient.post(`/users/${id}/reset-password`, d),
  delete:        (id)     => apiClient.delete(`/users/${id}`),
};

// ── Stat card ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, color = 'text-gray-900' }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
    <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

// ── Password field ────────────────────────────────────────────────────
const PwField = ({ value, onChange, placeholder = 'Password', onGenerate }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
        {onGenerate && (
          <button type="button" onClick={onGenerate} title="Generate password"
            className="text-gray-400 hover:text-blue-600">
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        <button type="button" onClick={() => setShow(s => !s)} className="text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

// ── Add / Edit Modal ──────────────────────────────────────────────────
const UserModal = ({ user, onClose, onSaved }) => {
  const isEdit = !!user;
  const { showError } = useNotification();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    email:      user?.email      || '',
    role:       user?.role       || 'lawyer',
    password:   '',
    send_welcome_email: !isEdit,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email) {
      showError('First name, last name and email are required');
      return;
    }
    if (!isEdit && (!form.password || form.password.length < 8)) {
      showError('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await userApi.update(user.id, { first_name: form.first_name, last_name: form.last_name, email: form.email, role: form.role });
      } else {
        await userApi.create(form);
      }
      onSaved();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
              <input value={form.first_name} onChange={e => set('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jane" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
              <input value={form.last_name} onChange={e => set('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Smith" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="jane@lawfirm.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {form.role === 'admin'     && 'Full access — users, settings, billing, all data.'}
              {form.role === 'lawyer'    && 'Manages clients, dossiers, documents, billing.'}
              {form.role === 'secretary' && 'View clients/dossiers, upload documents, manage calendar.'}
            </p>
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
              <PwField value={form.password} onChange={v => set('password', v)}
                onGenerate={() => set('password', genPassword())} />
            </div>
          )}
          {!isEdit && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.send_welcome_email}
                onChange={e => set('send_welcome_email', e.target.checked)}
                className="rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Send welcome email with credentials</span>
            </label>
          )}
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── View Details Modal ────────────────────────────────────────────────
const ViewModal = ({ userId, onClose, onEdit }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.get(userId),
    select: r => r.data?.data,
    enabled: !!userId,
  });

  if (isLoading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <LoadingSpinner size="lg" />
    </div>
  );
  const u = data;
  if (!u) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold">
              {initials(u)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">{u.first_name} {u.last_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role]}`}>
                  {ROLE_LABEL[u.role]}
                </span>
                <span className={`text-xs ${u.is_active ? 'text-green-600' : 'text-red-500'}`}>
                  {u.is_active ? '● Active' : '● Inactive'}
                </span>
              </div>
            </div>
          </div>
          {/* Contact */}
          <div className="space-y-1.5 text-sm">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Contact</p>
            <p className="text-gray-800">{u.email}</p>
          </div>
          {/* Account */}
          <div className="space-y-1.5 text-sm">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Account</p>
            <p className="text-gray-600">Created: <span className="text-gray-800">{fmtDate(u.createdAt || u.created_at)}</span></p>
            <p className="text-gray-600">Last login: <span className="text-gray-800">{fmtDate(u.last_login)}</span></p>
          </div>
          {/* Activity */}
          {u.activity && (
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { label: 'Dossiers',   val: u.activity.dossiers },
                { label: 'Timeline',   val: u.activity.timeline },
                { label: 'Documents',  val: u.activity.documents },
                { label: 'Invoices',   val: u.activity.invoices },
              ].map(({ label, val }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-2">
                  <p className="font-bold text-gray-900 text-base">{val}</p>
                  <p className="text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Close</button>
          <button onClick={() => { onClose(); onEdit(u); }}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit User</button>
        </div>
      </div>
    </div>
  );
};

// ── Reset Password Modal ──────────────────────────────────────────────
const ResetPwModal = ({ user, onClose }) => {
  const { showSuccess, showError } = useNotification();
  const [pw, setPw] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!pw || pw.length < 8) { showError('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await userApi.resetPassword(user.id, { new_password: pw, send_email: sendEmail });
      showSuccess('Password reset successfully');
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Reset Password</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Resetting password for <span className="font-medium">{user.first_name} {user.last_name}</span>
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Password *</label>
            <PwField value={pw} onChange={setPw} onGenerate={() => setPw(genPassword())} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)}
              className="rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">Send password reset email to user</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Resetting…' : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────
const DeleteModal = ({ user, onClose, onDeleted }) => {
  const { showSuccess, showError } = useNotification();
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await userApi.delete(user.id);
      showSuccess('User deleted');
      onDeleted();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-red-600">Delete User</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            You are about to permanently delete <span className="font-medium">{user.first_name} {user.last_name}</span>.
            This cannot be undone.
          </p>
          <p className="text-sm text-gray-500">Type <span className="font-mono font-bold">DELETE</span> to confirm:</p>
          <input value={confirm} onChange={e => setConfirm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent"
            placeholder="DELETE" />
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</button>
          <button onClick={handleDelete} disabled={confirm !== 'DELETE' || deleting}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {deleting ? 'Deleting…' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Actions dropdown ──────────────────────────────────────────────────
const ActionsMenu = ({ user, isLastAdmin, onView, onEdit, onResetPw, onToggle, onDelete }) => {
  const [open, setOpen] = useState(false);
  const canRemove = !isLastAdmin;

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
            <button onClick={() => { setOpen(false); onView(); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Eye className="h-4 w-4" />View Details
            </button>
            <button onClick={() => { setOpen(false); onEdit(); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Edit2 className="h-4 w-4" />Edit
            </button>
            <button onClick={() => { setOpen(false); onResetPw(); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <KeyRound className="h-4 w-4" />Reset Password
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => { if (canRemove) { setOpen(false); onToggle(); } }}
              disabled={!canRemove}
              title={isLastAdmin ? 'Cannot deactivate the last admin' : undefined}
              className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${
                !canRemove ? 'text-gray-300 cursor-not-allowed' :
                user.is_active ? 'text-amber-600 hover:bg-gray-50' : 'text-green-600 hover:bg-gray-50'
              }`}>
              {user.is_active
                ? <><UserX className="h-4 w-4" />Deactivate</>
                : <><UserCheck className="h-4 w-4" />Activate</>}
            </button>
            <button
              onClick={() => { if (canRemove) { setOpen(false); onDelete(); } }}
              disabled={!canRemove}
              title={isLastAdmin ? 'Cannot delete the last admin' : undefined}
              className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${
                !canRemove ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'
              }`}>
              <Trash2 className="h-4 w-4" />Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────
const UserManagementPage = () => {
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('');
  const [statusFilter, setStatus] = useState('');

  const [modal, setModal] = useState(null); // { type: 'add'|'edit'|'view'|'reset'|'delete', user? }

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter, statusFilter],
    queryFn: () => userApi.list({ search, role: roleFilter, status: statusFilter }),
    select: r => r.data,
    keepPreviousData: true,
  });

  const invalidate = () => queryClient.invalidateQueries(['users']);

  const toggleMutation = useMutation({
    mutationFn: (id) => userApi.toggleStatus(id),
    onSuccess: (res) => {
      showSuccess(res.data?.message || 'Status updated');
      invalidate();
    },
    onError: (err) => showError(err.response?.data?.message || 'Failed to update status'),
  });

  const users = data?.data || [];
  const stats = data?.stats || {};
  const adminCount = stats.admins ?? users.filter(u => u.role === 'admin' && u.is_active).length;

  const closeModal = () => setModal(null);
  const onSaved = () => { closeModal(); invalidate(); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage team members and their access levels</p>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <UserPlus className="h-4 w-4" />Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Total Users"    value={stats.total} />
        <StatCard label="Active Lawyers" value={stats.lawyers} color="text-blue-600" />
        <StatCard label="Active"         value={stats.active}  color="text-green-600" />
        <StatCard label="Inactive"       value={stats.inactive} color="text-red-500" />
        <StatCard label="Admins"         value={stats.admins}  color="text-purple-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select value={roleFilter} onChange={e => setRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">No users found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new user.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold flex-shrink-0">
                        {initials(u)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{fmtDate(u.last_login)}</td>
                  <td className="px-4 py-4 text-right">
                    <ActionsMenu
                      user={u}
                      isLastAdmin={u.role === 'admin' && adminCount <= 1}
                      onView={() => setModal({ type: 'view', user: u })}
                      onEdit={() => setModal({ type: 'edit', user: u })}
                      onResetPw={() => setModal({ type: 'reset', user: u })}
                      onToggle={() => toggleMutation.mutate(u.id)}
                      onDelete={() => setModal({ type: 'delete', user: u })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'add'    && <UserModal onClose={closeModal} onSaved={onSaved} />}
      {modal?.type === 'edit'   && <UserModal user={modal.user} onClose={closeModal} onSaved={onSaved} />}
      {modal?.type === 'view'   && <ViewModal userId={modal.user.id} onClose={closeModal} onEdit={u => setModal({ type: 'edit', user: u })} />}
      {modal?.type === 'reset'  && <ResetPwModal user={modal.user} onClose={closeModal} />}
      {modal?.type === 'delete' && <DeleteModal user={modal.user} onClose={closeModal} onDeleted={() => { closeModal(); invalidate(); }} />}
    </div>
  );
};

export default UserManagementPage;
