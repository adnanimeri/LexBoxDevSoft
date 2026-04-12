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
  Shield,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, hasPermission } = useAuth();

  const isSuperAdmin = user?.role === 'super_admin';

  // Super admin only sees the platform panel
  const navigationItems = isSuperAdmin ? [
    { name: 'Super Admin', href: '/super-admin', icon: Shield, permission: null },
  ] : [
    { name: 'Dashboard', href: '/dashboard', icon: Home, permission: null },
    { name: 'Clients', href: '/clients', icon: Users, permission: 'clients:read' },
    { name: 'Templates', href: '/templates', icon: FileText, permission: 'documents:read' },
    { name: 'Calendar', href: '/calendar', icon: Calendar, permission: 'calendar:read' },
    { name: 'Billing', href: '/billing', icon: CreditCard, permission: 'billing:read' },
    { name: 'Settings', href: '/settings', icon: Settings, permission: 'admin' },
  ];

  const allowedItems = navigationItems.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-30 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:shadow-none lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <Link to="/" className="text-xl font-bold text-blue-600">LexBox</Link>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="mt-4">
          <ul className="space-y-2 px-4">
            {allowedItems.map((item) => {
              const isActive = location.pathname === item.href ||
                             (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

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
                    <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
