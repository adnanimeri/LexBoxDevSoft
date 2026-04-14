// ===================================================================
// SETTINGS PAGE
// ===================================================================
// src/pages/settings/SettingsPage.js

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  FileText,
  DollarSign,
  Save,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../services/apiService';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [formData, setFormData] = useState({});
  const [showPasswords, setShowPasswords] = useState({});

  // Password change state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);

  const { showSuccess, showError } = useNotification();
  const { logout, orgPermissions, refreshOrgPermissions } = useAuth();
  const queryClient = useQueryClient();

  // Secretary permissions (confirm gate)
  const [secPerms, setSecPerms] = useState({
    secretary_can_create_clients: false,
    secretary_can_access_billing: false,
  });
  const [confirmText, setConfirmText] = useState({
    secretary_can_create_clients: '',
    secretary_can_access_billing: '',
  });
  const [permSaving, setPermSaving] = useState(false);

  // Sync secPerms from orgPermissions when they load
  useEffect(() => {
    if (orgPermissions && Object.keys(orgPermissions).length > 0) {
      setSecPerms({
        secretary_can_create_clients: !!orgPermissions.secretary_can_create_clients,
        secretary_can_access_billing: !!orgPermissions.secretary_can_access_billing,
      });
    }
  }, [orgPermissions]);

  const handlePermToggle = (key, checked) => {
    if (!checked) {
      // Disabling — no confirm needed
      setSecPerms(prev => ({ ...prev, [key]: false }));
      setConfirmText(prev => ({ ...prev, [key]: '' }));
    } else {
      // Enabling — require AGREE confirmation
      setSecPerms(prev => ({ ...prev, [key]: true }));
    }
  };

  const handleSavePermissions = async () => {
    // Validate: any newly-enabled permission must have "AGREE" typed
    for (const key of ['secretary_can_create_clients', 'secretary_can_access_billing']) {
      if (secPerms[key] && !orgPermissions?.[key]) {
        if (confirmText[key].trim().toUpperCase() !== 'AGREE') {
          showError('You must type AGREE to enable this permission');
          return;
        }
      }
    }
    setPermSaving(true);
    try {
      await apiClient.patch('/org/permissions', secPerms);
      await refreshOrgPermissions();
      setConfirmText({ secretary_can_create_clients: '', secretary_can_access_billing: '' });
      showSuccess('Permissions updated');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setPermSaving(false);
    }
  };

  // Fetch all settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getAll()
  });

  // Populate form data when settings are loaded
  useEffect(() => {
    if (settingsData?.data) {
      const flatData = {};
      Object.values(settingsData.data).forEach(categorySettings => {
        categorySettings.forEach(setting => {
          // Don't overwrite masked passwords
          if (setting.value !== '********' || !formData[setting.key]) {
            flatData[setting.key] = setting.value;
          }
        });
      });
      setFormData(prev => ({ ...prev, ...flatData }));
    }
  }, [settingsData]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (settings) => settingsService.update(settings),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      showSuccess('Settings saved successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.message || 'Failed to save settings');
    }
  });

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const togglePasswordVisibility = (key) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      showError('New passwords do not match');
      return;
    }
    if (pwForm.new_password.length < 8) {
      showError('New password must be at least 8 characters');
      return;
    }
    setPwLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password
      });
      showSuccess('Password changed successfully. Signing you out…');
      setTimeout(() => logout(), 2000);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const tabs = [
    { id: 'company',     label: 'Company',     icon: Building2    },
    { id: 'invoice',     label: 'Invoice',     icon: FileText     },
    { id: 'billing',     label: 'Billing',     icon: DollarSign   },
    { id: 'permissions', label: 'Permissions', icon: ShieldCheck  },
    { id: 'security',    label: 'Security',    icon: Lock         },
  ];

  const settings = settingsData?.data || {};

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const FIELD_PLACEHOLDERS = {
    company_name:    'Your law firm name',
    company_address: 'Your company address',
    company_phone:   'e.g. +352 123 456 789',
    company_email:   'contact@yourfirm.com',
    company_website: 'https://yourfirm.com',
    company_tax_id:  'VAT / Tax ID number'
  };

  const renderField = (setting) => {
    const isSensitive = setting.is_sensitive;
    const isPassword = isSensitive || setting.key.includes('pass');
    const showPassword = showPasswords[setting.key];
    const placeholder = FIELD_PLACEHOLDERS[setting.key] || setting.label;

    return (
      <div key={setting.key} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {setting.label}
        </label>
        {setting.description && (
          <p className="text-xs text-gray-500 mb-1">{setting.description}</p>
        )}

        {setting.type === 'boolean' ? (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData[setting.key] === true || formData[setting.key] === 'true'}
              onChange={(e) => handleInputChange(setting.key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm text-gray-700">
              {formData[setting.key] === true || formData[setting.key] === 'true' ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        ) : (
          <div className="relative">
            <input
              type={isPassword && !showPassword ? 'password' : 'text'}
              value={formData[setting.key] ?? ''}
              onChange={(e) => handleInputChange(setting.key, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => togglePasswordVisibility(setting.key)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your organization settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Company Settings */}
          {activeTab === 'company' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
              <p className="text-sm text-gray-500 mb-6">
                This information appears on invoices and official documents.
              </p>
              {(settings.company || []).map(renderField)}
            </div>
          )}

          {/* Invoice Settings */}
          {activeTab === 'invoice' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Settings</h3>
              <p className="text-sm text-gray-500 mb-6">
                Default settings for invoices and billing.
              </p>
              {(settings.invoice || []).map(renderField)}
            </div>
          )}

          {/* Billing Settings */}
          {activeTab === 'billing' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Defaults</h3>
              <p className="text-sm text-gray-500 mb-6">
                Default values for billing and time tracking.
              </p>
              {(settings.billing || []).map(renderField)}
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Secretary Permissions</h3>
                <p className="text-sm text-gray-500">
                  Control what secretaries in your organisation are allowed to do. Enabling a permission requires typing <strong>AGREE</strong> to confirm.
                </p>
              </div>

              {/* Permission: Create Clients */}
              <div className="border border-gray-200 rounded-lg p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">Allow secretary to create &amp; edit clients</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Secretary will be able to add new clients, edit client details, and assign a dossier (including assigning it to a lawyer or admin).
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={secPerms.secretary_can_create_clients}
                      onChange={(e) => handlePermToggle('secretary_can_create_clients', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {secPerms.secretary_can_create_clients && !orgPermissions?.secretary_can_create_clients && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800 mb-2">
                      Type <strong>AGREE</strong> below to confirm you want to grant this permission to all secretaries.
                    </p>
                    <input
                      type="text"
                      value={confirmText.secretary_can_create_clients}
                      onChange={(e) => setConfirmText(prev => ({ ...prev, secretary_can_create_clients: e.target.value }))}
                      placeholder="Type AGREE to confirm"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 text-sm"
                    />
                  </div>
                )}

                {orgPermissions?.secretary_can_create_clients && (
                  <p className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">Currently enabled</p>
                )}
              </div>

              {/* Permission: Billing */}
              <div className="border border-gray-200 rounded-lg p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">Allow secretary to access client-level billing</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Secretary will be able to view invoices, create invoices, download PDFs, and send invoices to clients from inside a client's dossier. The global Billing page remains restricted to lawyers and admins.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={secPerms.secretary_can_access_billing}
                      onChange={(e) => handlePermToggle('secretary_can_access_billing', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {secPerms.secretary_can_access_billing && !orgPermissions?.secretary_can_access_billing && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800 mb-2">
                      Type <strong>AGREE</strong> below to confirm you want to grant this permission to all secretaries.
                    </p>
                    <input
                      type="text"
                      value={confirmText.secretary_can_access_billing}
                      onChange={(e) => setConfirmText(prev => ({ ...prev, secretary_can_access_billing: e.target.value }))}
                      placeholder="Type AGREE to confirm"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 text-sm"
                    />
                  </div>
                )}

                {orgPermissions?.secretary_can_access_billing && (
                  <p className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">Currently enabled</p>
                )}
              </div>

              <button
                onClick={handleSavePermissions}
                disabled={permSaving}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {permSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Permissions
              </button>
            </div>
          )}

          {/* Security — Change Password */}
          {activeTab === 'security' && (
            <div className="max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-1">Change Password</h3>
              <p className="text-sm text-gray-500 mb-6">
                Update your login password. You will need to enter your current password to confirm.
              </p>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPw.current ? 'text' : 'password'}
                      value={pwForm.current_password}
                      onChange={(e) => setPwForm(p => ({ ...p, current_password: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Enter current password"
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw.new ? 'text' : 'password'}
                      value={pwForm.new_password}
                      onChange={(e) => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                      required
                      minLength={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Minimum 8 characters"
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPw.confirm ? 'text' : 'password'}
                      value={pwForm.confirm_password}
                      onChange={(e) => setPwForm(p => ({ ...p, confirm_password: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Repeat new password"
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={pwLoading || (pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {pwLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                  Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
