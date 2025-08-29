"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Clock,
  Database,
  DollarSign,
  Server,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

interface SystemMetrics {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  checks: Array<{
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    error?: string;
  }>;
  performance: {
    systemMetrics: Record<string, { value: number; unit: string }>;
    slowRoutes: Array<{
      path: string;
      method: string;
      duration: number;
      timestamp: string;
    }>;
    errorRates: Record<string, { total: number; errors: number; rate: number }>;
  };
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/health?detailed=true&performance=true');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Activity className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <Shield className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <motion.div
          className="flex items-center space-x-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Activity className="h-6 w-6 text-indigo-600" />
          <span className="text-lg text-gray-600">Loading system metrics...</span>
        </motion.div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Metrics Unavailable</h3>
        <p className="text-gray-600">Unable to fetch system metrics. Please try again.</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="p-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {lastUpdate?.toLocaleTimeString() || 'Never'}
          </p>
        </div>
        
        <motion.div
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${getStatusColor(metrics.overall)}`}
          whileHover={{ scale: 1.05 }}
        >
          {getStatusIcon(metrics.overall)}
          <span className="font-semibold capitalize">{metrics.overall}</span>
        </motion.div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatUptime(metrics.uptime)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.performance?.systemMetrics?.memoryHeapUsed
                  ? formatBytes(metrics.performance.systemMetrics.memoryHeapUsed.value)
                  : 'N/A'}
              </p>
            </div>
            <Database className="h-8 w-8 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Services</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.checks?.filter(c => c.status === 'healthy').length || 0}/
                {metrics.checks?.length || 0}
              </p>
            </div>
            <Server className="h-8 w-8 text-purple-600" />
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.checks?.length > 0
                  ? Math.round(metrics.checks.reduce((acc, c) => acc + c.responseTime, 0) / metrics.checks.length)
                  : 0}ms
              </p>
            </div>
            <Zap className="h-8 w-8 text-yellow-600" />
          </div>
        </motion.div>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Server className="h-5 w-5 mr-2" />
            Service Health
          </h3>
          
          <div className="space-y-3">
            {metrics.checks?.map((check, index) => (
              <motion.div
                key={check.service}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${getStatusColor(check.status)}`}>
                    {getStatusIcon(check.status)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {check.service.replace('-', ' ')}
                    </p>
                    {check.error && (
                      <p className="text-sm text-red-600">{check.error}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {check.responseTime}ms
                  </p>
                  <p className={`text-xs capitalize ${getStatusColor(check.status).split(' ')[0]}`}>
                    {check.status}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Performance Issues */}
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Slow Routes
          </h3>
          
          <div className="space-y-3">
            {metrics.performance?.slowRoutes?.slice(0, 5).map((route, index) => (
              <motion.div
                key={`${route.method}-${route.path}-${index}`}
                className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {route.method} {route.path}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(route.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    {route.duration}ms
                  </p>
                </div>
              </motion.div>
            )) || (
              <p className="text-gray-500 text-center py-4">No slow routes detected</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Error Rates */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Error Rates (Last Hour)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(metrics.performance?.errorRates || {}).map(([route, stats]) => (
            <motion.div
              key={route}
              className={`p-4 rounded-lg border ${
                stats.rate > 10 ? 'bg-red-50 border-red-200' :
                stats.rate > 5 ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <p className="font-medium text-gray-900 text-sm mb-2">{route}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">
                    {stats.errors}/{stats.total} requests
                  </p>
                </div>
                <div className={`font-bold ${
                  stats.rate > 10 ? 'text-red-600' :
                  stats.rate > 5 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {stats.rate.toFixed(1)}%
                </div>
              </div>
            </motion.div>
          ))}
          
          {Object.keys(metrics.performance?.errorRates || {}).length === 0 && (
            <p className="text-gray-500 text-center py-4 col-span-full">
              No error data available
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}