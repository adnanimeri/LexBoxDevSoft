// ===================================================================
// ADMIN PANEL PAGE (PLACEHOLDER)
// ===================================================================
// src/pages/admin/AdminPanel.js
import React from 'react';
import { Users, Settings, BarChart, Shield } from 'lucide-react';

/**
 * Admin panel page for system administration
 * Placeholder implementation - can be expanded based on requirements
 */
const AdminPanel = () => {
  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      color: 'bg-blue-500',
      path: '/admin/users'
    },
    {
      title: 'System Settings',
      description: 'Configure application settings',
      icon: Settings,
      color: 'bg-green-500',
      path: '/admin/settings'
    },
    {
      title: 'Analytics',
      description: 'View system analytics and reports',
      icon: BarChart,
      color: 'bg-purple-500',
      path: '/admin/analytics'
    },
    {
      title: 'Security',
      description: 'Security settings and audit logs',
      icon: Shield,
      color: 'bg-red-500',
      path: '/admin/security'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-600">Manage system settings and users</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminSections.map((section) => (
          <div
            key={section.title}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${section.color}`}>
                <section.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{section.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Settings className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Admin Panel Under Development
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                The admin panel is currently under development. Basic functionality is available,
                but advanced features will be added in future updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;