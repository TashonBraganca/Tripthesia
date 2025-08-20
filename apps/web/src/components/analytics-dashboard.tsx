/**
 * Analytics Dashboard Component
 * Real-time user journey and conversion funnel monitoring
 */

"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel
} from 'recharts';
import {
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  ShoppingCart,
  DollarSign,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { containerVariants, itemVariants } from '@/lib/motion';
import { getPostHog } from '@/lib/posthog-analytics';

interface AnalyticsMetrics {
  funnel: {
    landing_views: number;
    wizard_starts: number;
    wizard_completions: number;
    trip_generations: number;
    planner_views: number;
    subscription_views: number;
    conversions: number;
  };
  userJourney: {
    totalSessions: number;
    averageSessionDuration: number;
    bounceRate: number;
    pageViews: number;
    uniqueVisitors: number;
    returningVisitors: number;
  };
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  traffic: {
    direct: number;
    organic: number;
    social: number;
    referral: number;
    paid: number;
  };
  performance: {
    averageLoadTime: number;
    coreWebVitalsScore: number;
    errorRate: number;
    apiResponseTime: number;
  };
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [realTimeUsers, setRealTimeUsers] = useState(0);

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      
      try {
        // In production, this would fetch from PostHog API
        // For now, we'll use mock data with realistic values
        const mockMetrics: AnalyticsMetrics = {
          funnel: {
            landing_views: 12847,
            wizard_starts: 3421,
            wizard_completions: 2156,
            trip_generations: 1834,
            planner_views: 1654,
            subscription_views: 423,
            conversions: 127
          },
          userJourney: {
            totalSessions: 15632,
            averageSessionDuration: 342000, // 5.7 minutes in ms
            bounceRate: 24.3,
            pageViews: 47589,
            uniqueVisitors: 9821,
            returningVisitors: 3456
          },
          devices: {
            desktop: 5234,
            mobile: 8765,
            tablet: 1633
          },
          traffic: {
            direct: 4521,
            organic: 6782,
            social: 2134,
            referral: 1876,
            paid: 319
          },
          performance: {
            averageLoadTime: 1.2,
            coreWebVitalsScore: 87,
            errorRate: 0.3,
            apiResponseTime: 245
          }
        };
        
        setMetrics(mockMetrics);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange]);

  // Real-time users simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeUsers(Math.floor(Math.random() * 50) + 10);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Funnel data for visualization
  const funnelData = [
    { name: 'Landing Views', value: metrics.funnel.landing_views, fill: '#10B981' },
    { name: 'Wizard Starts', value: metrics.funnel.wizard_starts, fill: '#3B82F6' },
    { name: 'Completions', value: metrics.funnel.wizard_completions, fill: '#F59E0B' },
    { name: 'Generations', value: metrics.funnel.trip_generations, fill: '#EF4444' },
    { name: 'Planner Views', value: metrics.funnel.planner_views, fill: '#8B5CF6' },
    { name: 'Subscriptions', value: metrics.funnel.subscription_views, fill: '#EC4899' },
    { name: 'Conversions', value: metrics.funnel.conversions, fill: '#14B8A6' }
  ];

  // Device data
  const deviceData = [
    { name: 'Mobile', value: metrics.devices.mobile, fill: '#10B981' },
    { name: 'Desktop', value: metrics.devices.desktop, fill: '#3B82F6' },
    { name: 'Tablet', value: metrics.devices.tablet, fill: '#F59E0B' }
  ];

  // Traffic sources
  const trafficData = [
    { name: 'Organic', value: metrics.traffic.organic, fill: '#10B981' },
    { name: 'Direct', value: metrics.traffic.direct, fill: '#3B82F6' },
    { name: 'Social', value: metrics.traffic.social, fill: '#F59E0B' },
    { name: 'Referral', value: metrics.traffic.referral, fill: '#EF4444' },
    { name: 'Paid', value: metrics.traffic.paid, fill: '#8B5CF6' }
  ];

  // Calculate conversion rates
  const wizardConversionRate = (metrics.funnel.wizard_completions / metrics.funnel.wizard_starts * 100).toFixed(1);
  const overallConversionRate = (metrics.funnel.conversions / metrics.funnel.landing_views * 100).toFixed(2);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            User journey tracking and conversion monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {realTimeUsers} users online
          </Badge>
          
          <div className="flex rounded-lg border p-1">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-xs"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sessions"
          value={metrics.userJourney.totalSessions.toLocaleString()}
          change="+12.3%"
          positive={true}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${overallConversionRate}%`}
          change="+2.1%"
          positive={true}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Avg. Session"
          value={`${Math.floor(metrics.userJourney.averageSessionDuration / 60000)}m ${Math.floor((metrics.userJourney.averageSessionDuration % 60000) / 1000)}s`}
          change="+0.8%"
          positive={true}
          icon={<Clock className="h-5 w-5" />}
        />
        <MetricCard
          title="Bounce Rate"
          value={`${metrics.userJourney.bounceRate}%`}
          change="-1.2%"
          positive={true}
          icon={<Eye className="h-5 w-5" />}
        />
      </motion.div>

      {/* Analytics Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="funnel" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
            <TabsTrigger value="journey">User Journey</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="realtime">Real-time</TabsTrigger>
          </TabsList>
          
          <TabsContent value="funnel" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Funnel Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={funnelData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10B981" radius={[4, 4, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Funnel Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Funnel Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FunnelStep
                    name="Landing → Wizard"
                    conversion={(metrics.funnel.wizard_starts / metrics.funnel.landing_views * 100).toFixed(1)}
                    count={metrics.funnel.wizard_starts}
                  />
                  <FunnelStep
                    name="Wizard → Complete"
                    conversion={wizardConversionRate}
                    count={metrics.funnel.wizard_completions}
                  />
                  <FunnelStep
                    name="Complete → Generate"
                    conversion={(metrics.funnel.trip_generations / metrics.funnel.wizard_completions * 100).toFixed(1)}
                    count={metrics.funnel.trip_generations}
                  />
                  <FunnelStep
                    name="Generate → Planner"
                    conversion={(metrics.funnel.planner_views / metrics.funnel.trip_generations * 100).toFixed(1)}
                    count={metrics.funnel.planner_views}
                  />
                  <FunnelStep
                    name="Planner → Subscribe"
                    conversion={(metrics.funnel.subscription_views / metrics.funnel.planner_views * 100).toFixed(1)}
                    count={metrics.funnel.subscription_views}
                  />
                  <FunnelStep
                    name="Subscribe → Convert"
                    conversion={(metrics.funnel.conversions / metrics.funnel.subscription_views * 100).toFixed(1)}
                    count={metrics.funnel.conversions}
                    isLast={true}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="journey" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Page Views</p>
                      <p className="text-2xl font-bold">{metrics.userJourney.pageViews.toLocaleString()}</p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Unique Visitors</p>
                      <p className="text-2xl font-bold">{metrics.userJourney.uniqueVisitors.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Returning Visitors</p>
                      <p className="text-2xl font-bold">{metrics.userJourney.returningVisitors.toLocaleString()}</p>
                    </div>
                    <Globe className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audience" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Device Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`device-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Traffic Sources */}
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={trafficData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {trafficData.map((entry, index) => (
                          <Cell key={`traffic-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Load Time</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.performance.averageLoadTime}s</p>
                    <p className="text-xs text-muted-foreground">Target: <2.5s</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Core Web Vitals</p>
                    <p className="text-2xl font-bold text-emerald-600">{metrics.performance.coreWebVitalsScore}</p>
                    <Progress value={metrics.performance.coreWebVitalsScore} className="mt-2" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Error Rate</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.performance.errorRate}%</p>
                    <p className="text-xs text-muted-foreground">Target: <1%</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">API Response</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.performance.apiResponseTime}ms</p>
                    <p className="text-xs text-muted-foreground">Target: <500ms</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <div className="text-center py-12">
              <div className="text-6xl font-bold text-emerald-500 mb-4">
                {realTimeUsers}
              </div>
              <p className="text-xl text-muted-foreground mb-2">Users online right now</p>
              <Badge variant="secondary">Live data updates every 3 seconds</Badge>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, positive, icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold">{value}</p>
          <Badge variant={positive ? "default" : "destructive"} className="text-xs">
            {change}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface FunnelStepProps {
  name: string;
  conversion: string;
  count: number;
  isLast?: boolean;
}

function FunnelStep({ name, conversion, count, isLast = false }: FunnelStepProps) {
  const conversionNum = parseFloat(conversion);
  const color = conversionNum > 50 ? 'text-green-600' : conversionNum > 25 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{count.toLocaleString()} users</p>
      </div>
      <div className="text-right">
        <p className={cn("text-lg font-bold", color)}>{conversion}%</p>
        <Progress value={conversionNum} className="w-16 h-2" />
      </div>
    </div>
  );
}