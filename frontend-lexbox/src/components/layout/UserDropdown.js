import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronDown, KeyRound, Eye, EyeOff, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import apiClient from '../../services/apiService';

// ── Change Password Modal (for non-admin roles) ───────────────────────
const ChangePwModal = ({ onClose }) => {
  const { logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const toggle = (k) => setShow(p => ({ ...p, [k]: !p[k] }));
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) { showError('New passwords do not match'); return; }
    if (form.next.length < 8) { showError('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await apiClient.post('/auth/change-password', { current_password: form.current, new_password: form.next });
      showSuccess('Password changed. Please log in again.');
      setTimeout(() => logout(), 1500);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input type={show.current ? 'text' : 'password'} value={form.current}
                onChange={e => set('current', e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10" />
              <button type="button" onClick={() => toggle('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {/* New Password */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input type={show.next ? 'text' : 'password'} value={form.next}
                onChange={e => set('next', e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10" />
              <button type="button" onClick={() => toggle('next')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input type={show.confirm ? 'text' : 'password'} value={form.confirm}
                onChange={e => set('confirm', e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10" />
              <button type="button" onClick={() => toggle('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {form.confirm && form.next !== form.confirm && (
            <p className="text-xs text-red-500">Passwords do not match</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</button>
            <button type="submit" disabled={saving || !!(form.confirm && form.next !== form.confirm)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── User Dropdown ─────────────────────────────────────────────────────
const UserDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => { logout(); setIsOpen(false); };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role}</p>
            </div>

            {isAdmin && (
              <button
                onClick={() => { navigate('/settings'); setIsOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </button>
            )}

            <button
              onClick={() => { setShowChangePw(true); setIsOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <KeyRound className="mr-3 h-4 w-4" />
              Change Password
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>

      {showChangePw && <ChangePwModal onClose={() => setShowChangePw(false)} />}
    </>
  );
};

export default UserDropdown;