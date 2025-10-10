// ===================================================================
// QUICK ACTIONS COMPONENT
// ===================================================================
// src/components/dashboard/QuickActions.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload, Search, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Quick actions panel for common tasks
 * Provides shortcuts to frequently used functions
 */
const QuickActions = () => {
  const { hasPermission } = useAuth();

  const actions = [
    {
      name: 'New Client',
      description: 'Register a new client',
      icon: Plus,
      href: '/clients/new',
      color: 'bg-blue-500 hover:bg-blue-600',
      permission: 'clients:create'
    },
    {
      name: 'Upload Documents',
      description: 'Upload client documents',
      icon: Upload,
      href: '/documents/upload',
      color: 'bg-green-500 hover:bg-green-600',
      permission: 'documents:create'
    },
    {
      name: 'Search Cases',
      description: 'Find client cases',
      icon: Search,
      href: '/clients?search=true',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      permission: 'clients:read'
    },
    {
      name: 'Generate Report',
      description: 'Create case reports',
      icon: FileText,
      href: '/reports/new',
      color: 'bg-purple-500 hover:bg-purple-600',
      permission: 'reports:create'
    },
  ];

  const allowedActions = actions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="space-y-3">
          {allowedActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className={`block p-4 rounded-lg text-white transition-colors duration-200 ${action.color}`}
            >
              <div className="flex items-center">
                <action.icon className="h-6 w-6 mr-3" />
                <div>
                  <p className="font-medium">{action.name}</p>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;