// ===================================================================
// STATS CARD COMPONENT
// ===================================================================
// src/components/dashboard/StatsCard.js
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Statistics card component for dashboard
 * Displays key metrics with trend indicators
 */
const StatsCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100',
  };

  const getTrendColor = (trendValue) => {
    if (trendValue > 0) return 'text-green-600';
    if (trendValue < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trendValue) => {
    if (trendValue > 0) return TrendingUp;
    if (trendValue < 0) return TrendingDown;
    return null;
  };

  const TrendIcon = getTrendIcon(trend?.value);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(trend.value)}`}>
                    {TrendIcon && <TrendIcon className="h-4 w-4 mr-1" />}
                    {Math.abs(trend.value)}%
                    <span className="ml-1 text-gray-500 font-normal">
                      vs last {trend.period}
                    </span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;