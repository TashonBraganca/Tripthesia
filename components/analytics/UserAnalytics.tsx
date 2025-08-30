"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Target,
  Award,
  Globe,
  Plane,
  Camera,
  Heart,
  Star,
  Activity,
  PieChart,
  LineChart,
  Zap,
  Crown,
  RefreshCw
} from 'lucide-react';

interface UserAnalyticsProps {
  userId: string;
  userTier: 'free' | 'starter' | 'pro';
  className?: string;
}

interface TravelStats {
  totalTrips: number;
  totalDays: number;
  totalSpent: number;
  currency: string;
  averageTripDuration: number;
  averageTripBudget: number;
  favoriteDestinationType: string;
  totalCountries: number;
  totalCities: number;
}

interface MonthlyData {
  month: string;
  trips: number;
  spending: number;
  days: number;
}

interface TopDestination {
  name: string;
  visits: number;
  totalSpent: number;
  avgRating: number;
  lastVisit: string;
}

interface TripInsight {
  id: string;
  title: string;
  description: string;
  type: 'achievement' | 'recommendation' | 'trend' | 'milestone';
  icon: any;
  actionable: boolean;
  action?: string;
}

interface UserBehavior {
  planningStyle: 'last-minute' | 'advance' | 'flexible';
  budgetPattern: 'conservative' | 'balanced' | 'generous';
  activityPreference: string[];
  bookingTrends: {
    averageDaysInAdvance: number;
    preferredBookingTime: string;
    mostBookedCategory: string;
  };
}

// Mock data - would come from analytics API
const mockStats: TravelStats = {
  totalTrips: 12,
  totalDays: 89,
  totalSpent: 15420,
  currency: 'USD',
  averageTripDuration: 7.4,
  averageTripBudget: 1285,
  favoriteDestinationType: 'Cultural Cities',
  totalCountries: 8,
  totalCities: 15,
};

const mockMonthlyData: MonthlyData[] = [
  { month: 'Jan', trips: 1, spending: 1200, days: 5 },
  { month: 'Feb', trips: 0, spending: 0, days: 0 },
  { month: 'Mar', trips: 2, spending: 2800, days: 14 },
  { month: 'Apr', trips: 1, spending: 900, days: 4 },
  { month: 'May', trips: 2, spending: 3200, days: 16 },
  { month: 'Jun', trips: 1, spending: 1800, days: 10 },
];

const mockTopDestinations: TopDestination[] = [
  { name: 'Tokyo, Japan', visits: 3, totalSpent: 4500, avgRating: 4.8, lastVisit: '2025-06-15' },
  { name: 'Paris, France', visits: 2, totalSpent: 3200, avgRating: 4.6, lastVisit: '2025-03-10' },
  { name: 'Barcelona, Spain', visits: 2, totalSpent: 2800, avgRating: 4.7, lastVisit: '2025-05-20' },
];

const mockInsights: TripInsight[] = [
  {
    id: '1',
    title: 'Travel Streak Achievement!',
    description: 'You\'ve traveled 3 months in a row. Keep exploring!',
    type: 'achievement',
    icon: Award,
    actionable: false,
  },
  {
    id: '2',
    title: 'Budget Optimization',
    description: 'You could save 15% on accommodations by booking earlier',
    type: 'recommendation',
    icon: Target,
    actionable: true,
    action: 'View Budget Tips',
  },
  {
    id: '3',
    title: 'Seasonal Pattern',
    description: 'You tend to travel more in spring - plan ahead for next year!',
    type: 'trend',
    icon: TrendingUp,
    actionable: true,
    action: 'Plan Spring Trips',
  },
];

const mockBehavior: UserBehavior = {
  planningStyle: 'advance',
  budgetPattern: 'balanced',
  activityPreference: ['Cultural', 'Food', 'Nature'],
  bookingTrends: {
    averageDaysInAdvance: 45,
    preferredBookingTime: 'Evening',
    mostBookedCategory: 'Accommodation',
  },
};

export default function UserAnalytics({ userId, userTier, className = '' }: UserAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'insights' | 'behavior'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'3m' | '6m' | '1y' | 'all'>('6m');

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'recommendation': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'trend': return 'bg-green-100 text-green-700 border-green-200';
      case 'milestone': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'insights', label: 'Insights', icon: Target },
    { id: 'behavior', label: 'Behavior', icon: Activity },
  ];

  // Only show full analytics for Starter+ users
  const hasFullAccess = userTier !== 'free';

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Travel Analytics</h2>
              <p className="text-sm text-gray-600">
                Insights into your travel patterns and habits
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              disabled={!hasFullAccess}
            >
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="1y">Last year</option>
              <option value="all">All time</option>
            </select>

            <button
              onClick={() => setIsLoading(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {!hasFullAccess && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Unlock Advanced Analytics</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Upgrade to Starter or Pro to access detailed travel insights, trends, and personalized recommendations.
                </p>
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 mx-6 mt-4 rounded-lg">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          const isDisabled = !hasFullAccess && tab.id !== 'overview';
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id as any)}
              disabled={isDisabled}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id && !isDisabled
                  ? 'bg-white text-gray-900 shadow-sm'
                  : isDisabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { 
                      label: 'Total Trips', 
                      value: mockStats.totalTrips, 
                      icon: MapPin, 
                      growth: 25,
                      color: 'text-blue-600 bg-blue-100' 
                    },
                    { 
                      label: 'Days Traveled', 
                      value: mockStats.totalDays, 
                      icon: Calendar, 
                      growth: 15,
                      color: 'text-green-600 bg-green-100' 
                    },
                    { 
                      label: 'Total Spent', 
                      value: formatCurrency(mockStats.totalSpent, mockStats.currency), 
                      icon: DollarSign, 
                      growth: -5,
                      color: 'text-purple-600 bg-purple-100' 
                    },
                    { 
                      label: 'Countries', 
                      value: mockStats.totalCountries, 
                      icon: Globe, 
                      growth: 33,
                      color: 'text-orange-600 bg-orange-100' 
                    },
                  ].map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-lg ${stat.color}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className={`flex items-center text-xs ${
                            stat.growth > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.growth > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            <span>{Math.abs(stat.growth)}%</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-2xl font-semibold text-gray-900">
                            {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">{stat.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Travel Averages</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Trip Duration</span>
                        <span className="text-sm font-medium text-gray-900">
                          {mockStats.averageTripDuration} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Trip Budget</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(mockStats.averageTripBudget)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Favorite Type</span>
                        <span className="text-sm font-medium text-gray-900">
                          {mockStats.favoriteDestinationType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Top Destinations</h4>
                    <div className="space-y-2">
                      {mockTopDestinations.slice(0, 3).map((dest, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                            <span className="text-sm text-gray-700">{dest.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{dest.visits} visits</p>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs text-gray-600">{dest.avgRating}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {hasFullAccess && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Crown className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900">Pro Analytics Available</h4>
                        <p className="text-sm text-blue-800">
                          Explore detailed trends, behavior patterns, and personalized insights.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'trends' && hasFullAccess && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Travel Trends</h3>
                
                {/* Monthly Chart Placeholder */}
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <LineChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-700 mb-2">Monthly Travel Activity</h4>
                  <p className="text-sm text-gray-600">
                    Interactive chart showing your travel frequency and spending over time
                  </p>
                  <div className="mt-4 grid grid-cols-6 gap-2">
                    {mockMonthlyData.map((month, index) => (
                      <div key={index} className="bg-white p-2 rounded text-center">
                        <p className="text-xs text-gray-600">{month.month}</p>
                        <p className="font-medium text-gray-900">{month.trips}</p>
                        <div className={`h-1 bg-blue-200 rounded mt-1 ${
                          month.trips > 0 ? 'bg-blue-500' : ''
                        }`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spending Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Spending by Category</h4>
                    <div className="space-y-3">
                      {[
                        { category: 'Accommodation', amount: 6500, percentage: 42 },
                        { category: 'Transportation', amount: 4200, percentage: 27 },
                        { category: 'Food & Dining', amount: 3100, percentage: 20 },
                        { category: 'Activities', amount: 1620, percentage: 11 },
                      ].map((item, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-600">{item.category}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.amount)} ({item.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Travel Patterns</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Peak Travel Season</p>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-900">Spring (Mar-May)</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Average Booking Lead Time</p>
                        <span className="text-sm font-medium text-gray-900">45 days in advance</span>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Most Active Day</p>
                        <span className="text-sm font-medium text-gray-900">Sunday evenings</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && hasFullAccess && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Personalized Insights</h3>
                
                <div className="space-y-4">
                  {mockInsights.map((insight, index) => {
                    const IconComponent = insight.icon;
                    return (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <IconComponent className="h-5 w-5 mt-0.5" />
                            <div>
                              <h4 className="font-medium mb-1">{insight.title}</h4>
                              <p className="text-sm opacity-80">{insight.description}</p>
                            </div>
                          </div>
                          
                          {insight.actionable && (
                            <button className="text-sm font-medium hover:opacity-80 transition-opacity">
                              {insight.action}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">AI-Powered Recommendations</h4>
                  <p className="text-sm text-purple-800 mb-3">
                    Based on your travel patterns, we recommend exploring Southeast Asia during your next spring trip.
                  </p>
                  <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700">
                    Generate Trip Ideas
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'behavior' && hasFullAccess && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Travel Behavior</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Planning Style</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Type</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {mockBehavior.planningStyle} Planner
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Budget Approach</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {mockBehavior.budgetPattern}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 block mb-2">Activity Preferences</span>
                        <div className="flex flex-wrap gap-1">
                          {mockBehavior.activityPreference.map(activity => (
                            <span key={activity} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Booking Patterns</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Advance Booking</span>
                        <span className="text-sm font-medium text-gray-900">
                          {mockBehavior.bookingTrends.averageDaysInAdvance} days
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Preferred Time</span>
                        <span className="text-sm font-medium text-gray-900">
                          {mockBehavior.bookingTrends.preferredBookingTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">First Booking</span>
                        <span className="text-sm font-medium text-gray-900">
                          {mockBehavior.bookingTrends.mostBookedCategory}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Behavior Score */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Travel Efficiency Score</h4>
                      <p className="text-sm text-gray-600">Based on planning habits and booking patterns</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">8.5</p>
                      <p className="text-sm text-green-700">Excellent</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}