// ===================================================================
// RECENT ACTIVITY COMPONENT
// ===================================================================
// src/components/dashboard/RecentActivity.js
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Users, Clock, DollarSign } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Recent activity feed component
 * Shows timeline of recent actions across the system
 */
const RecentActivity = ({ activities, loading }) => {
  const getActivityIcon = (type) => {
    const icons = {
      client_created: Users,
      document_uploaded: FileText,
      timeline_updated: Clock,
      invoice_generated: DollarSign,
    };
    return icons[type] || Clock;
  };

  const getActivityColor = (type) => {
    const colors = {
      client_created: 'bg-blue-100 text-blue-600',
      document_uploaded: 'bg-green-100 text-green-600',
      timeline_updated: 'bg-yellow-100 text-yellow-600',
      invoice_generated: 'bg-purple-100 text-purple-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        
        {!activities?.length ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                const isLast = index === activities.length - 1;
                
                return (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span 
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                          aria-hidden="true" 
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityColor(activity.type)}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-900">
                              {activity.description}
                            </p>
                            <p className="text-sm text-gray-500">
                              by {activity.user_name}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;