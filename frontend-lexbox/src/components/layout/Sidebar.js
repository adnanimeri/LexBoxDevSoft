// ===================================================================
// SIDEBAR COMPONENT
// ===================================================================
// src/components/layout/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  CreditCard,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Sidebar navigation component with role-based menu items
 * Responsive design with mobile overlay
 */
const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, hasPermission } = useAuth();

  // Define navigation items with permissions
  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: Home, permission: null },
    { name: 'Clients', href: '/clients', icon: Users, permission: 'clients:read' },
    { name: 'Documents', href: '/documents', icon: FileText, permission: 'documents:read' },
    { name: 'Calendar', href: '/calendar', icon: Calendar, permission: 'calendar:read' },
    { name: 'Billing', href: '/billing', icon: CreditCard, permission: 'billing:read' },
    { name: 'Admin', href: '/admin', icon: Settings, permission: 'admin' },
  ];

  // Filter navigation items based on user permissions
  const allowedItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-xl font-semibold text-gray-800">Navigation</span>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="mt-4">
          <ul className="space-y-2 px-4">
            {allowedItems.map((item) => {
              const isActive = location.pathname === item.href || 
                             (item.href !== '/' && location.pathname.startsWith(item.href));
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                      ${isActive 
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
