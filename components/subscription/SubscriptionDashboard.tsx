"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  Users,
  Bot,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  Star,
  Calendar,
  CreditCard,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface SubscriptionDashboardProps {
  currentTier: 'free' | 'starter' | 'pro';
  usage: {
    tripsThisMonth: number;
    aiGenerationsThisMonth: number;
    aiGenerationsToday: number;
    tripsRemaining: number;
  };
  onUpgrade?: (tier: 'starter' | 'pro') => void;
  className?: string;
}

interface TierFeature {
  name: string;
  free: boolean | string;
  starter: boolean | string;
  pro: boolean | string;
  icon: any;
}

const tierFeatures: TierFeature[] = [
  {
    name: 'Trips per month',
    free: '2',
    starter: '10',
    pro: '30',
    icon: Calendar,
  },
  {
    name: 'AI trip generation',
    free: 'Basic GPT-4o-mini',
    starter: 'Advanced GPT-4o-mini',
    pro: 'Premium GPT-4',
    icon: Bot,
  },
  {
    name: 'Budget optimization',
    free: false,
    starter: true,
    pro: true,
    icon: TrendingUp,
  },
  {
    name: 'Local insights',
    free: false,
    starter: true,
    pro: true,
    icon: Sparkles,
  },
  {
    name: 'Interactive planning',
    free: true,
    starter: true,
    pro: true,
    icon: Users,
  },
  {
    name: 'Trip collaboration',
    free: false,
    starter: true,
    pro: true,
    icon: Users,
  },
  {
    name: 'Export formats',
    free: 'PDF only',
    starter: 'PDF + Calendar',
    pro: 'All formats + API',
    icon: ArrowRight,
  },
  {
    name: 'Support level',
    free: 'Community',
    starter: 'Priority',
    pro: 'VIP + Phone',
    icon: Shield,
  },
];

const tierColors = {
  free: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    accent: 'text-gray-600',
    button: 'bg-gray-600 hover:bg-gray-700',
  },
  starter: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    accent: 'text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  pro: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    accent: 'text-purple-600',
    button: 'bg-purple-600 hover:bg-purple-700',
  },
};

export default function SubscriptionDashboard({
  currentTier,
  usage,
  onUpgrade,
  className = ''
}: SubscriptionDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'features' | 'upgrade'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  const currentColors = tierColors[currentTier];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return Shield;
      case 'starter': return Zap;
      case 'pro': return Crown;
      default: return Shield;
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free';
      case 'starter': return 'Starter';
      case 'pro': return 'Pro';
      default: return 'Free';
    }
  };

  const getUsageColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'text-red-600 bg-red-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getFeatureValue = (feature: TierFeature, tier: string): { value: string | boolean, available: boolean } => {
    const value = feature[tier as keyof TierFeature];
    const available = value !== false;
    return { value: value === true ? 'Included' : value === false ? 'Not available' : value.toString(), available };
  };

  const handleUpgrade = useCallback(async (tier: 'starter' | 'pro') => {
    setIsLoading(true);
    try {
      await onUpgrade?.(tier);
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onUpgrade]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'usage', label: 'Usage', icon: TrendingUp },
    { id: 'features', label: 'Features', icon: CheckCircle },
    { id: 'upgrade', label: 'Upgrade', icon: Star },
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className={`${currentColors.bg} ${currentColors.border} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${currentColors.button} rounded-lg`}>
              {(() => {
                const TierIcon = getTierIcon(currentTier);
                return <TierIcon className="h-5 w-5 text-white" />;
              })()}
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${currentColors.text}`}>
                {getTierName(currentTier)} Plan
              </h2>
              <p className={`text-sm ${currentColors.accent}`}>
                Your current subscription tier
              </p>
            </div>
          </div>
          
          {currentTier !== 'pro' && (
            <button
              onClick={() => setActiveTab('upgrade')}
              className={`px-4 py-2 ${currentColors.button} text-white rounded-lg text-sm font-medium transition-colors`}
            >
              Upgrade Plan
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 mx-6 mt-4 rounded-lg">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
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
                {/* Current Plan Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Trips This Month</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {usage.tripsThisMonth}
                    </p>
                    <p className="text-xs text-blue-600">
                      {usage.tripsRemaining} remaining
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">AI Generations</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {usage.aiGenerationsThisMonth}
                    </p>
                    <p className="text-xs text-green-600">
                      {usage.aiGenerationsToday} today
                    </p>
                  </div>
                  
                  <div className={`rounded-lg p-4 ${currentColors.bg}`}>
                    <div className="flex items-center space-x-2">
                      <Star className={`h-4 w-4 ${currentColors.accent}`} />
                      <span className={`text-sm font-medium ${currentColors.text}`}>Plan Status</span>
                    </div>
                    <p className={`text-2xl font-bold ${currentColors.text} mt-1`}>
                      {getTierName(currentTier)}
                    </p>
                    <p className={`text-xs ${currentColors.accent}`}>
                      Active subscription
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <Bot className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Generate New Trip</span>
                    </button>
                    <button className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <BarChart3 className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">View Usage Stats</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Usage Statistics</h3>
                
                {/* Usage Bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Monthly Trips</span>
                      <span className="text-sm text-gray-600">
                        {usage.tripsThisMonth} / {currentTier === 'free' ? 2 : currentTier === 'starter' ? 10 : 30}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          usage.tripsThisMonth >= (currentTier === 'free' ? 2 : currentTier === 'starter' ? 10 : 30) * 0.8
                            ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (usage.tripsThisMonth / (currentTier === 'free' ? 2 : currentTier === 'starter' ? 10 : 30)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">AI Generations Today</span>
                      <span className="text-sm text-gray-600">
                        {usage.aiGenerationsToday} / {currentTier === 'free' ? 5 : currentTier === 'starter' ? 20 : 100}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          usage.aiGenerationsToday >= (currentTier === 'free' ? 5 : currentTier === 'starter' ? 20 : 100) * 0.8
                            ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (usage.aiGenerationsToday / (currentTier === 'free' ? 5 : currentTier === 'starter' ? 20 : 100)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Usage Insights */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Usage Insights</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• You've used {Math.round((usage.tripsThisMonth / (currentTier === 'free' ? 2 : currentTier === 'starter' ? 10 : 30)) * 100)}% of your monthly trip allowance</li>
                    <li>• AI generations reset daily at midnight UTC</li>
                    {currentTier === 'free' && usage.tripsThisMonth >= 1 && (
                      <li>• Consider upgrading for more trips and advanced AI features</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Feature Comparison</h3>
                
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Feature</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Free</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Starter</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Pro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tierFeatures.map((feature, index) => {
                        const IconComponent = feature.icon;
                        const freeFeature = getFeatureValue(feature, 'free');
                        const starterFeature = getFeatureValue(feature, 'starter');
                        const proFeature = getFeatureValue(feature, 'pro');
                        
                        return (
                          <tr key={index} className={currentTier === 'free' && index === 0 ? 'bg-blue-50' : currentTier === 'starter' && index === 0 ? 'bg-blue-50' : currentTier === 'pro' && index === 0 ? 'bg-purple-50' : ''}>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <IconComponent className="h-4 w-4 text-gray-600" />
                                <span className="text-sm text-gray-900">{feature.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm ${freeFeature.available ? 'text-gray-700' : 'text-gray-400'}`}>
                                {freeFeature.value}
                              </span>
                              {!freeFeature.available && <XCircle className="h-3 w-3 text-gray-400 mx-auto mt-1" />}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm ${starterFeature.available ? 'text-blue-700' : 'text-gray-400'}`}>
                                {starterFeature.value}
                              </span>
                              {starterFeature.available && typeof starterFeature.value === 'string' && starterFeature.value !== 'Not available' && (
                                <CheckCircle className="h-3 w-3 text-blue-600 mx-auto mt-1" />
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm ${proFeature.available ? 'text-purple-700' : 'text-gray-400'}`}>
                                {proFeature.value}
                              </span>
                              {proFeature.available && typeof proFeature.value === 'string' && proFeature.value !== 'Not available' && (
                                <CheckCircle className="h-3 w-3 text-purple-600 mx-auto mt-1" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'upgrade' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Upgrade Your Plan</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentTier !== 'starter' && (
                    <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                      <div className="flex items-center space-x-2 mb-4">
                        <Zap className="h-6 w-6 text-blue-600" />
                        <h4 className="text-xl font-semibold text-blue-900">Starter</h4>
                      </div>
                      
                      <div className="text-3xl font-bold text-blue-700 mb-2">
                        $10<span className="text-lg font-normal text-blue-600">/month</span>
                      </div>
                      
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center space-x-2 text-sm text-blue-800">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>10 trips per month</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm text-blue-800">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>Advanced AI planning</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm text-blue-800">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>Budget optimization</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm text-blue-800">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>Priority support</span>
                        </li>
                      </ul>
                      
                      <button
                        onClick={() => handleUpgrade('starter')}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                        ) : (
                          'Upgrade to Starter'
                        )}
                      </button>
                    </div>
                  )}

                  {currentTier !== 'pro' && (
                    <div className="border border-purple-200 rounded-lg p-6 bg-purple-50 relative">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Most Popular
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-4">
                        <Crown className="h-6 w-6 text-purple-600" />
                        <h4 className="text-xl font-semibold text-purple-900">Pro</h4>
                      </div>
                      
                      <div className="text-3xl font-bold text-purple-700 mb-2">
                        $20<span className="text-lg font-normal text-purple-600">/month</span>
                      </div>
                      
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center space-x-2 text-sm text-purple-800">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                          <span>30 trips per month</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm text-purple-800">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                          <span>Premium AI with GPT-4</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm text-purple-800">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                          <span>Advanced analytics</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm text-purple-800">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                          <span>API access</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm text-purple-800">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                          <span>VIP support</span>
                        </li>
                      </ul>
                      
                      <button
                        onClick={() => handleUpgrade('pro')}
                        disabled={isLoading}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        {isLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                        ) : (
                          'Upgrade to Pro'
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {currentTier === 'pro' && (
                  <div className="text-center py-12">
                    <Crown className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      You're on the Pro Plan!
                    </h3>
                    <p className="text-gray-600">
                      You have access to all premium features and capabilities.
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}