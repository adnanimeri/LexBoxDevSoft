// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import SuperAdminPanel from './pages/admin/SuperAdminPanel';
import ClientList from './pages/clients/ClientList';
import ClientDetails from './pages/clients/ClientDetails';
import CreateClient from './pages/clients/CreateClient';
import EditClient from './pages/clients/EditClient';
import AdminPanel from './pages/admin/AdminPanel';
import SettingsPage from './pages/settings/SettingsPage';
import UserManagementPage from './pages/users/UserManagementPage';
import GlobalBilling from './pages/billing/GlobalBilling';
import CalendarPage from './pages/calendar/CalendarPage';
import TemplatesPage from './pages/templates/TemplatesPage';

// Styles
import './styles/globals.css';

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes with layout */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/super-admin" element={
                  <ProtectedRoute requiredRole="super_admin">
                    <Layout>
                      <SuperAdminPanel />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <Layout>
                      <ClientList />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/clients/new" element={
                  <ProtectedRoute>
                    <Layout>
                      <CreateClient />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/clients/:clientId" element={
                  <ProtectedRoute>
                    <Layout>
                      <ClientDetails />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/clients/:clientId/edit" element={
                  <ProtectedRoute>
                    <Layout>
                      <EditClient />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/billing" element={
                  <ProtectedRoute>
                    <Layout>
                      <GlobalBilling />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <Layout>
                      <CalendarPage />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <AdminPanel />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <SettingsPage />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/users" element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <UserManagementPage />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/templates" element={
                  <ProtectedRoute>
                    <Layout>
                      <TemplatesPage />
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;