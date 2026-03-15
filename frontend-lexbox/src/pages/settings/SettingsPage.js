// ===================================================================
// SETTINGS PAGE
// ===================================================================
// src/pages/settings/SettingsPage.js

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Mail, 
  FileText, 
  DollarSign, 
  Save, 
  TestTube,
  Eye,
  EyeOff
} from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [formData, setFormData] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [testEmail, setTestEmail] = useState('');

  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

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

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: (email) => settingsService.testEmail(email),
    onSuccess: (data) => {
      showSuccess(data.message || 'Test email sent successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.message || 'Failed to send test email');
    }
  });

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleTestEmail = () => {
    if (!testEmail) {
      showError('Please enter an email address');
      return;
    }
    testEmailMutation.mutate(testEmail);
  };

  const togglePasswordVisibility = (key) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'email', label: 'Email / SMTP', icon: Mail },
    { id: 'invoice', label: 'Invoice', icon: FileText },
    { id: 'billing', label: 'Billing', icon: DollarSign }
  ];

  const settings = settingsData?.data || {};

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const renderField = (setting) => {
    const isSensitive = setting.is_sensitive;
    const isPassword = isSensitive || setting.key.includes('pass');
    const showPassword = showPasswords[setting.key];

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
              placeholder={setting.label}
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

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Configuration</h3>
              <p className="text-sm text-gray-500 mb-6">
                Configure SMTP settings to send emails (invoices, notifications).
              </p>
              {(settings.email || []).map(renderField)}

              {/* Test Email Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-2">Test Email Configuration</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Save your settings first, then send a test email to verify your SMTP settings are working correctly.
                </p>
                <div className="flex space-x-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleTestEmail}
                    disabled={testEmailMutation.isPending}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {testEmailMutation.isPending ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Send Test
                  </button>
                </div>
              </div>
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
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
