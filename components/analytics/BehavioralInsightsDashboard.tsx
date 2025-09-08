/**
 * Behavioral Insights Dashboard - Phase 4.3.2
 * 
 * Real-time behavioral analytics dashboard for understanding user patterns
 * Provides actionable insights for personalization and optimization
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useBehavioralInsights } from '@/hooks/useBehavioralAnalytics';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Eye, 
  Clock, 
  Search, 
  MousePointer, 
  AlertTriangle,
  Target,
  Brain,
  BarChart3,
  RefreshCw
} from 'lucide-react';

// ==================== TYPES ====================

interface BehaviorPattern {
  userId: string;
  patternType: 'search' | 'browse' | 'decision' | 'abandonment' | 'completion';
  frequency: number;
  confidence: number;
  characteristics: Record<string, any>;
  detectedAt: string;
  expires: string;
}

interface UserBehaviorPreferences {
  searchStyle: 'explorative' | 'focused' | 'comparative';
  decisionSpeed: 'quick' | 'moderate' | 'deliberate';
  contentPreference: 'visual' | 'detailed' | 'minimal';
  interactionPattern: 'mobile' | 'desktop' | 'mixed';
  travelPhase: 'inspiration' | 'planning' | 'booking' | 'traveling';
  engagementLevel: 'high' | 'medium' | 'low';
}

interface BehaviorInsights {
  patterns: BehaviorPattern[];
  insights: {
    userId: string;
    preferences: UserBehaviorPreferences;
    patterns: BehaviorPattern[];
    recommendedActions: string[];
    riskFactors: string[];
    engagementScore: number;
    personalizationOpportunities: string[];
  };
  summary: {
    totalPatterns: number;
    highConfidencePatterns: number;
    engagementScore: number;
    riskFactors: number;
    opportunities: number;
  };
}

// ==================== COMPONENT ====================

export function BehavioralInsightsDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const { insights, isLoading, refresh } = useBehavioralInsights(selectedTimeframe);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading behavioral insights...</span>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No behavioral insights available yet.</p>
            <p className="text-sm mt-2">Start interacting with the platform to see personalized insights.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Behavioral Insights</h2>
          <p className="text-muted-foreground">
            Understanding your travel preferences and behavior patterns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Engagement Score"
          value={`${Math.round(insights.summary.engagementScore)}/100`}
          icon={Activity}
          color="blue"
          progress={insights.summary.engagementScore}
        />
        <SummaryCard
          title="Behavior Patterns"
          value={insights.summary.totalPatterns.toString()}
          subtitle={`${insights.summary.highConfidencePatterns} high confidence`}
          icon={BarChart3}
          color="green"
        />
        <SummaryCard
          title="Risk Factors"
          value={insights.summary.riskFactors.toString()}
          icon={AlertTriangle}
          color={insights.summary.riskFactors > 0 ? "red" : "gray"}
        />
        <SummaryCard
          title="Opportunities"
          value={insights.summary.opportunities.toString()}
          subtitle="Personalization"
          icon={Target}
          color="purple"
        />
      </div>

      {/* Main Content */}
      <Tabs value={selectedTimeframe} onValueChange={(v) => setSelectedTimeframe(v as any)}>
        <TabsList>
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTimeframe} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Preferences */}
            <UserPreferencesCard preferences={insights.insights?.preferences} />
            
            {/* Behavior Patterns */}
            <BehaviorPatternsCard patterns={insights.patterns} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Factors */}
            <RiskFactorsCard riskFactors={insights.insights?.riskFactors || []} />
            
            {/* Recommendations */}
            <RecommendationsCard 
              actions={insights.insights?.recommendedActions || []}
              opportunities={insights.insights?.personalizationOpportunities || []}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function SummaryCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  progress 
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
  progress?: number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <Icon className={`h-8 w-8 text-${color}-500 opacity-75`} />
        </div>
        {progress !== undefined && (
          <Progress value={progress} className="mt-3" />
        )}
      </CardContent>
    </Card>
  );
}

function UserPreferencesCard({ preferences }: { preferences?: UserBehaviorPreferences }) {
  if (!preferences) return null;

  const preferenceItems = [
    { label: 'Search Style', value: preferences.searchStyle, icon: Search },
    { label: 'Decision Speed', value: preferences.decisionSpeed, icon: Clock },
    { label: 'Content Preference', value: preferences.contentPreference, icon: Eye },
    { label: 'Interaction Pattern', value: preferences.interactionPattern, icon: MousePointer },
    { label: 'Travel Phase', value: preferences.travelPhase, icon: TrendingUp },
    { label: 'Engagement Level', value: preferences.engagementLevel, icon: Activity },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          User Preferences
        </CardTitle>
        <CardDescription>
          Inferred behavioral preferences based on your interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {preferenceItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center">
                <item.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{item.label}</span>
              </div>
              <Badge variant={getPreferenceBadgeVariant(item.value)}>
                {formatPreferenceValue(item.value)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BehaviorPatternsCard({ patterns }: { patterns: BehaviorPattern[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Behavior Patterns
        </CardTitle>
        <CardDescription>
          Detected patterns in your travel planning behavior
        </CardDescription>
      </CardHeader>
      <CardContent>
        {patterns.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No patterns detected yet</p>
            <p className="text-xs">Continue using the platform to see patterns emerge</p>
          </div>
        ) : (
          <div className="space-y-3">
            {patterns.map((pattern, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      {pattern.patternType}
                    </Badge>
                    <span className="text-sm font-medium">
                      Frequency: {pattern.frequency.toFixed(1)}/day
                    </span>
                  </div>
                  {pattern.characteristics && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {JSON.stringify(pattern.characteristics).slice(0, 100)}...
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {Math.round(pattern.confidence * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">confidence</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RiskFactorsCard({ riskFactors }: { riskFactors: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Risk Factors
        </CardTitle>
        <CardDescription>
          Potential issues that may affect user experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        {riskFactors.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <p>No risk factors detected</p>
            <p className="text-xs">Great engagement and behavior patterns!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {riskFactors.map((risk, index) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{risk}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationsCard({ 
  actions, 
  opportunities 
}: { 
  actions: string[]; 
  opportunities: string[] 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Recommendations
        </CardTitle>
        <CardDescription>
          Suggested actions and personalization opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Recommended Actions</h4>
              <ul className="space-y-1">
                {actions.map((action, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {opportunities.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Personalization Opportunities</h4>
              <ul className="space-y-1">
                {opportunities.map((opportunity, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 mt-1.5 flex-shrink-0" />
                    {opportunity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {actions.length === 0 && opportunities.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <p>No recommendations available</p>
              <p className="text-xs">Continue using the platform for personalized suggestions</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== HELPER FUNCTIONS ====================

function getPreferenceBadgeVariant(value: string): "default" | "secondary" | "destructive" | "outline" {
  const highValuePreferences = ['high', 'focused', 'quick', 'detailed', 'booking'];
  const lowValuePreferences = ['low', 'explorative', 'deliberate', 'minimal', 'inspiration'];
  
  if (highValuePreferences.includes(value)) return 'default';
  if (lowValuePreferences.includes(value)) return 'outline';
  return 'secondary';
}

function formatPreferenceValue(value: string): string {
  return value.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}