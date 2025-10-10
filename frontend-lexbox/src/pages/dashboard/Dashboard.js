// ===================================================================
// DASHBOARD PAGE COMPONENT
// ===================================================================
// src/pages/dashboard/Dashboard.js
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentActivity from '../../components/dashboard/RecentActivity';
import QuickActions from '../../components/dashboard/QuickActions';

/**
 * Main dashboard page component
 * Displays overview statistics, recent activity, and quick actions
 */
const Dashboard = () => {
  const { user, hasPermission } = useAuth();

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => clientService.getDashboardStats(),
    refetchInterval: 30000,
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['recentActivity'],  
    queryFn: () => clientService.getRecentActivity({ limit: 10 }),
    refetchInterval: 60000,
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your cases today.
          </p>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Clients"
          value={stats?.totalClients || 0}
          icon={Users}
          trend={stats?.clientsTrend}
          color="blue"
        />
        <StatsCard
          title="Active Cases"
          value={stats?.activeCases || 0}
          icon={FileText}
          trend={stats?.casesTrend}
          color="green"
        />
        <StatsCard
          title="Pending Tasks"
          value={stats?.pendingTasks || 0}
          icon={Clock}
          trend={stats?.tasksTrend}
          color="yellow"
        />
        {hasPermission('billing:read') && (
          <StatsCard
            title="Revenue (Month)"
            value={`€${stats?.monthlyRevenue?.toLocaleString() || 0}`}
            icon={DollarSign}
            trend={stats?.revenueTrend}
            color="purple"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <RecentActivity 
            activities={recentActivity} 
            loading={activityLoading}
          />
        </div>

        {/* Quick actions */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Alerts and notifications */}
      {stats?.alerts?.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Alerts & Notifications
            </h3>
            <div className="mt-4 space-y-3">
              {stats.alerts.map((alert, index) => (
                <div key={index} className="flex items-start p-3 bg-red-50 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{alert.title}</p>
                    <p className="text-sm text-red-700">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;