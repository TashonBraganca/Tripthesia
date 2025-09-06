'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Plane, 
  Hotel, 
  Car,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Target,
  Zap,
  Globe,
  Clock,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnalyticsData {
  overview: {
    totalTrips: number;
    totalUsers: number;
    totalRevenue: number;
    avgTripValue: number;
    growthRate: number;
    conversionRate: number;
  };
  timeSeriesData: {
    date: string;
    trips: number;
    revenue: number;
    users: number;
    bookings: number;
  }[];
  demographics: {
    ageGroups: { range: string; count: number; percentage: number }[];
    countries: { name: string; count: number; revenue: number }[];
    devices: { type: string; count: number; sessions: number }[];
  };
  destinations: {
    name: string;
    count: number;
    revenue: number;
    avgRating: number;
    trending: 'up' | 'down' | 'stable';
    seasonality: number[];
  }[];
  bookingPatterns: {
    byType: { type: string; count: number; revenue: number; avgPrice: number }[];
    byTimeframe: { period: string; early: number; lastMinute: number; optimal: number }[];
    conversionFunnel: { stage: string; count: number; conversionRate: number }[];
  };
  performance: {
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
    searchesToBookings: number;
    topPages: { path: string; views: number; conversionRate: number }[];
    loadTimes: { page: string; avgTime: number; p95Time: number }[];
  };
  aiInsights: {
    predictions: {
      nextMonth: { trips: number; revenue: number; confidence: number };
      seasonalTrends: { month: string; multiplier: number }[];
      emergingDestinations: string[];
    };
    recommendations: {
      type: 'optimization' | 'opportunity' | 'warning';
      title: string;
      description: string;
      impact: 'low' | 'medium' | 'high';
      effort: 'low' | 'medium' | 'high';
    }[];
    anomalies: {
      metric: string;
      value: number;
      expected: number;
      timestamp: Date;
      severity: 'info' | 'warning' | 'critical';
    }[];
  };
}

interface AdvancedAnalyticsDashboardProps {
  userId?: string;
  timeRange: '7d' | '30d' | '90d' | '1y' | 'custom';
  onTimeRangeChange?: (range: string) => void;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  userId,
  timeRange = '30d',
  onTimeRangeChange
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'predictive'>('overview');
  const [filters, setFilters] = useState({
    region: 'all',
    userType: 'all',
    deviceType: 'all',
  });

  // Mock data generation
  useEffect(() => {
    const generateMockData = (): AnalyticsData => {
      // Generate time series data
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const timeSeriesData = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        
        const baseTrips = 150 + Math.sin(i / 7) * 30 + Math.random() * 20;
        const trips = Math.floor(baseTrips * (0.8 + Math.random() * 0.4));
        const avgTripValue = 800 + Math.random() * 400;
        const revenue = trips * avgTripValue;
        const users = Math.floor(trips * (1.2 + Math.random() * 0.6));
        const bookings = Math.floor(trips * (0.6 + Math.random() * 0.3));

        return {
          date: date.toISOString().split('T')[0],
          trips,
          revenue: Math.round(revenue),
          users,
          bookings,
        };
      });

      const totalTrips = timeSeriesData.reduce((sum, d) => sum + d.trips, 0);
      const totalRevenue = timeSeriesData.reduce((sum, d) => sum + d.revenue, 0);
      const totalUsers = Math.max(...timeSeriesData.map(d => d.users)) * 3; // Cumulative estimate
      
      return {
        overview: {
          totalTrips,
          totalUsers,
          totalRevenue,
          avgTripValue: Math.round(totalRevenue / totalTrips),
          growthRate: 15.4,
          conversionRate: 23.8,
        },
        timeSeriesData,
        demographics: {
          ageGroups: [
            { range: '18-24', count: 1250, percentage: 18.5 },
            { range: '25-34', count: 2840, percentage: 42.1 },
            { range: '35-44', count: 1680, percentage: 24.9 },
            { range: '45-54', count: 720, percentage: 10.7 },
            { range: '55+', count: 260, percentage: 3.8 },
          ],
          countries: [
            { name: 'United States', count: 2450, revenue: 1960000 },
            { name: 'United Kingdom', count: 1230, revenue: 984000 },
            { name: 'Canada', count: 890, revenue: 712000 },
            { name: 'Australia', count: 670, revenue: 536000 },
            { name: 'Germany', count: 540, revenue: 432000 },
          ],
          devices: [
            { type: 'Desktop', count: 3200, sessions: 4800 },
            { type: 'Mobile', count: 4100, sessions: 5200 },
            { type: 'Tablet', count: 450, sessions: 620 },
          ],
        },
        destinations: [
          { name: 'Paris', count: 450, revenue: 540000, avgRating: 4.7, trending: 'up', seasonality: [0.8, 0.9, 1.2, 1.4, 1.3, 1.1, 1.0, 0.9, 1.1, 1.3, 0.9, 0.7] },
          { name: 'Tokyo', count: 380, revenue: 684000, avgRating: 4.8, trending: 'up', seasonality: [1.0, 0.9, 1.3, 1.5, 1.2, 0.8, 0.7, 0.8, 1.0, 1.2, 1.1, 1.0] },
          { name: 'New York', count: 420, revenue: 588000, avgRating: 4.6, trending: 'stable', seasonality: [0.9, 0.8, 1.1, 1.3, 1.4, 1.2, 1.1, 1.0, 1.1, 1.2, 1.0, 0.9] },
          { name: 'London', count: 360, revenue: 432000, avgRating: 4.5, trending: 'down', seasonality: [0.7, 0.8, 1.0, 1.2, 1.4, 1.3, 1.2, 1.1, 1.0, 1.1, 0.9, 0.8] },
          { name: 'Bali', count: 290, revenue: 348000, avgRating: 4.9, trending: 'up', seasonality: [1.2, 1.1, 1.0, 0.8, 0.7, 0.6, 0.7, 0.8, 1.0, 1.3, 1.4, 1.3] },
        ],
        bookingPatterns: {
          byType: [
            { type: 'Flight', count: 1850, revenue: 1295000, avgPrice: 700 },
            { type: 'Hotel', count: 1620, revenue: 486000, avgPrice: 300 },
            { type: 'Car Rental', count: 890, revenue: 133500, avgPrice: 150 },
            { type: 'Activity', count: 2340, revenue: 234000, avgPrice: 100 },
          ],
          byTimeframe: [
            { period: 'Early Bird (60+ days)', early: 35, lastMinute: 10, optimal: 55 },
            { period: 'Advance (30-60 days)', early: 25, lastMinute: 20, optimal: 55 },
            { period: 'Standard (14-30 days)', early: 20, lastMinute: 35, optimal: 45 },
            { period: 'Last Minute (<14 days)', early: 10, lastMinute: 70, optimal: 20 },
          ],
          conversionFunnel: [
            { stage: 'Visitors', count: 45000, conversionRate: 100 },
            { stage: 'Search', count: 18000, conversionRate: 40 },
            { stage: 'Results Viewed', count: 12600, conversionRate: 28 },
            { stage: 'Trip Planned', count: 4500, conversionRate: 10 },
            { stage: 'Booked', count: 1800, conversionRate: 4 },
          ],
        },
        performance: {
          pageViews: 89500,
          bounceRate: 34.2,
          avgSessionDuration: 387,
          searchesToBookings: 12.4,
          topPages: [
            { path: '/new', views: 15200, conversionRate: 8.4 },
            { path: '/planner', views: 12800, conversionRate: 15.6 },
            { path: '/transport', views: 9600, conversionRate: 6.2 },
            { path: '/ai-assistant', views: 8400, conversionRate: 22.1 },
          ],
          loadTimes: [
            { page: 'Homepage', avgTime: 1.2, p95Time: 2.8 },
            { page: 'Search Results', avgTime: 2.1, p95Time: 4.5 },
            { page: 'Trip Planner', avgTime: 1.8, p95Time: 3.9 },
            { page: 'Booking', avgTime: 1.5, p95Time: 3.2 },
          ],
        },
        aiInsights: {
          predictions: {
            nextMonth: { trips: 2100, revenue: 1680000, confidence: 87 },
            seasonalTrends: [
              { month: 'Jan', multiplier: 0.8 },
              { month: 'Feb', multiplier: 0.9 },
              { month: 'Mar', multiplier: 1.2 },
              { month: 'Apr', multiplier: 1.4 },
              { month: 'May', multiplier: 1.3 },
              { month: 'Jun', multiplier: 1.1 },
            ],
            emergingDestinations: ['Porto', 'Lisbon', 'Seoul', 'Reykjavik'],
          },
          recommendations: [
            {
              type: 'opportunity',
              title: 'Expand Mobile Experience',
              description: 'Mobile users show 23% higher engagement but 15% lower conversion. Optimize mobile booking flow.',
              impact: 'high',
              effort: 'medium',
            },
            {
              type: 'optimization',
              title: 'Improve Search Performance',
              description: 'Search page load time is 2.1s avg. Reducing to 1.5s could increase conversions by 8%.',
              impact: 'medium',
              effort: 'low',
            },
            {
              type: 'warning',
              title: 'London Bookings Declining',
              description: 'London bookings down 18% vs last period. Consider promotional campaigns.',
              impact: 'medium',
              effort: 'medium',
            },
          ],
          anomalies: [
            {
              metric: 'Conversion Rate',
              value: 18.2,
              expected: 23.8,
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              severity: 'warning',
            },
            {
              metric: 'Page Load Time',
              value: 3.2,
              expected: 2.1,
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
              severity: 'critical',
            },
          ],
        },
      };
    };

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setData(generateMockData());
      setLoading(false);
    }, 1500);
  }, [timeRange, filters]);

  // Calculate growth percentages
  const calculateGrowth = (current: number[], previous: number[]): number => {
    const currentSum = current.reduce((a, b) => a + b, 0);
    const previousSum = previous.reduce((a, b) => a + b, 0);
    return previousSum > 0 ? ((currentSum - previousSum) / previousSum) * 100 : 0;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number, showSign = true): string => {
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down' | 'neutral';
  }> = ({ title, value, change, icon: Icon, trend }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className="flex items-center mt-1">
                {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
                <span className={`text-xs ${
                  trend === 'up' ? 'text-green-500' : 
                  trend === 'down' ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {formatPercentage(change)}
                </span>
              </div>
            )}
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ChartContainer: React.FC<{
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
  }> = ({ title, children, actions }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  const SimpleBarChart: React.FC<{
    data: { label: string; value: number }[];
    color?: string;
  }> = ({ data, color = 'blue' }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-gray-600 truncate">{item.label}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full bg-${color}-500`}
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
              />
            </div>
            <div className="w-16 text-sm font-medium text-right">
              {typeof item.value === 'number' && item.value > 1000 
                ? `${(item.value / 1000).toFixed(1)}k` 
                : item.value.toLocaleString()
              }
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
          <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI Insights Alert Bar */}
      {data.aiInsights.anomalies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <Zap className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-800">AI Detected Anomalies</h3>
              <div className="text-sm text-orange-700 space-y-1 mt-1">
                {data.aiInsights.anomalies.slice(0, 2).map((anomaly, index) => (
                  <div key={index}>
                    <span className="font-medium">{anomaly.metric}:</span> {anomaly.value} 
                    (expected {anomaly.expected}) - 
                    <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'secondary'} className="ml-1 text-xs">
                      {anomaly.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Trips"
          value={data.overview.totalTrips.toLocaleString()}
          change={data.overview.growthRate}
          trend="up"
          icon={MapPin}
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(data.overview.totalRevenue)}
          change={12.3}
          trend="up"
          icon={DollarSign}
        />
        <MetricCard
          title="Active Users"
          value={data.overview.totalUsers.toLocaleString()}
          change={8.7}
          trend="up"
          icon={Users}
        />
        <MetricCard
          title="Conversion Rate"
          value={formatPercentage(data.overview.conversionRate, false)}
          change={-2.1}
          trend="down"
          icon={Target}
        />
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'overview' | 'detailed' | 'predictive')} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <ChartContainer title="Revenue Trend">
              <div className="h-64 flex items-end space-x-1">
                {data.timeSeriesData.slice(-14).map((day, index) => (
                  <motion.div
                    key={index}
                    className="flex-1 bg-blue-500 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.revenue / Math.max(...data.timeSeriesData.map(d => d.revenue))) * 100}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    title={`${day.date}: ${formatCurrency(day.revenue)}`}
                  />
                ))}
              </div>
            </ChartContainer>

            {/* Top Destinations */}
            <ChartContainer title="Top Destinations">
              <SimpleBarChart
                data={data.destinations.slice(0, 5).map(d => ({ label: d.name, value: d.count }))}
                color="green"
              />
            </ChartContainer>

            {/* Booking Types */}
            <ChartContainer title="Booking Distribution">
              <div className="space-y-3">
                {data.bookingPatterns.byType.map((type, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {type.type === 'Flight' && <Plane className="h-4 w-4 text-blue-600" />}
                      {type.type === 'Hotel' && <Hotel className="h-4 w-4 text-green-600" />}
                      {type.type === 'Car Rental' && <Car className="h-4 w-4 text-orange-600" />}
                      {type.type === 'Activity' && <Activity className="h-4 w-4 text-purple-600" />}
                      <span className="font-medium">{type.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{type.count.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{formatCurrency(type.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartContainer>

            {/* Conversion Funnel */}
            <ChartContainer title="Conversion Funnel">
              <div className="space-y-2">
                {data.bookingPatterns.conversionFunnel.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-24 text-sm text-gray-600 truncate">{stage.stage}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <motion.div
                        className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.conversionRate}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    </div>
                    <div className="w-20 text-sm font-medium text-right">
                      {stage.count.toLocaleString()}
                    </div>
                    <div className="w-12 text-xs text-gray-500 text-right">
                      {formatPercentage(stage.conversionRate, false)}
                    </div>
                  </div>
                ))}
              </div>
            </ChartContainer>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartContainer title="Demographics">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Age Groups</h4>
                  <SimpleBarChart
                    data={data.demographics.ageGroups.map(g => ({ label: g.range, value: g.count }))}
                    color="purple"
                  />
                </div>
              </div>
            </ChartContainer>

            <ChartContainer title="Device Usage">
              <div className="space-y-3">
                {data.demographics.devices.map((device, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{device.type}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{device.count.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">{device.sessions} sessions</div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartContainer>

            <ChartContainer title="Top Countries">
              <SimpleBarChart
                data={data.demographics.countries.slice(0, 5).map(c => ({ label: c.name, value: c.count }))}
                color="indigo"
              />
            </ChartContainer>
          </div>

          {/* Performance Table */}
          <ChartContainer title="Page Performance">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Page</th>
                    <th className="text-right py-2">Views</th>
                    <th className="text-right py-2">Conversion</th>
                    <th className="text-right py-2">Load Time</th>
                    <th className="text-right py-2">P95</th>
                  </tr>
                </thead>
                <tbody>
                  {data.performance.topPages.map((page, index) => {
                    const loadTime = data.performance.loadTimes.find(l => 
                      l.page.toLowerCase().includes(page.path.substring(1))
                    );
                    return (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-mono text-blue-600">{page.path}</td>
                        <td className="py-2 text-right">{page.views.toLocaleString()}</td>
                        <td className="py-2 text-right">{formatPercentage(page.conversionRate, false)}</td>
                        <td className="py-2 text-right">{loadTime?.avgTime.toFixed(1)}s</td>
                        <td className="py-2 text-right text-gray-600">{loadTime?.p95Time.toFixed(1)}s</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartContainer>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          {/* AI Predictions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer title="Next Month Prediction">
              <div className="text-center p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {data.aiInsights.predictions.nextMonth.trips.toLocaleString()}
                </div>
                <div className="text-gray-600 mb-1">Expected Trips</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(data.aiInsights.predictions.nextMonth.revenue)}
                </div>
                <div className="text-gray-600 mb-4">Projected Revenue</div>
                <Badge variant="outline" className="text-xs">
                  {data.aiInsights.predictions.nextMonth.confidence}% Confidence
                </Badge>
              </div>
            </ChartContainer>

            <ChartContainer title="Seasonal Trends">
              <div className="space-y-2">
                {data.aiInsights.predictions.seasonalTrends.map((month, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 text-sm font-medium">{month.month}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${
                          month.multiplier > 1 ? 'bg-green-500' : 'bg-orange-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.abs(month.multiplier - 0.5) * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    </div>
                    <div className="w-12 text-sm text-right">
                      {month.multiplier.toFixed(1)}x
                    </div>
                  </div>
                ))}
              </div>
            </ChartContainer>
          </div>

          {/* AI Recommendations */}
          <ChartContainer title="AI Recommendations">
            <div className="space-y-4">
              {data.aiInsights.recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${
                    rec.type === 'opportunity' ? 'bg-green-50 border-green-200' :
                    rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <div className="flex space-x-1">
                      <Badge variant={rec.impact === 'high' ? 'default' : 'secondary'} className="text-xs">
                        {rec.impact} impact
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rec.effort} effort
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{rec.description}</p>
                </motion.div>
              ))}
            </div>
          </ChartContainer>

          {/* Emerging Destinations */}
          <ChartContainer title="Emerging Destinations">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.aiInsights.predictions.emergingDestinations.map((dest, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                >
                  <Globe className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">{dest}</div>
                  <div className="text-xs text-purple-600 mt-1">Trending Up</div>
                </motion.div>
              ))}
            </div>
          </ChartContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;