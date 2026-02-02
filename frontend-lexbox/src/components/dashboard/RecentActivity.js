// ===================================================================
// RECENT ACTIVITY COMPONENT
// ===================================================================
// src/components/dashboard/RecentActivity.js
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Users } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Recent activity feed component
 * Shows recently added clients
 */
const RecentActivity = ({ activities, loading }) => {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Clients
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
          Recent Clients
        </h3>
        
        {!activities?.length ? (
          <p className="text-gray-500 text-center py-8">No recent clients</p>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((client, index) => {
                const isLast = index === activities.length - 1;
                
                // Safely parse date
                let timeAgo = '';
                try {
                  const date = new Date(client.createdAt || client.created_at);
                  if (!isNaN(date.getTime())) {
                    timeAgo = formatDistanceToNow(date, { addSuffix: true });
                  }
                } catch (e) {
                  timeAgo = 'Recently';
                }
                
                return (
                  <li key={client.id}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span 
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                          aria-hidden="true" 
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-blue-100 text-blue-600">
                            <Users className="h-4 w-4" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-900">
                              <Link 
                                to={`/clients/${client.id}`}
                                className="font-medium hover:text-blue-600"
                              >
                                {client.first_name} {client.last_name}
                              </Link>
                              {' '}was registered
                            </p>
                            <p className="text-sm text-gray-500">
                              {client.email || client.phone || 'No contact info'}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {timeAgo}
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