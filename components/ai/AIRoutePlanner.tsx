"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Route, 
  MapPin, 
  Clock, 
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle,
  Star,
  Calendar,
  Users,
  Car,
  Fuel,
  Settings,
  Lightbulb,
  TrendingUp,
  Shield,
  CloudRain,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AIRouteRecommendation, RouteQuery } from '@/lib/ai/route-planner';

interface AIRoutePlannerProps {
  routeQuery: RouteQuery;
  onRouteSelect?: (route: AIRouteRecommendation['primaryRoute']) => void;
  onAlternativeSelect?: (alternative: AIRouteRecommendation['alternativeRoutes'][0]) => void;
  className?: string;
}

export default function AIRoutePlanner({
  routeQuery,
  onRouteSelect,
  onAlternativeSelect,
  className = ''
}: AIRoutePlannerProps) {
  const [recommendation, setRecommendation] = useState<AIRouteRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'stops' | 'insights' | 'alternatives'>('overview');

  // Generate AI route recommendations
  const generateRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/route-planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeQuery),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate route recommendations');
      }

      setRecommendation(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('AI Route Planning Error:', err);
    } finally {
      setLoading(false);
    }
  }, [routeQuery]);

  // Render confidence score
  const renderConfidenceScore = (score: number) => {
    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-400';
      if (score >= 60) return 'text-yellow-400';
      return 'text-red-400';
    };

    return (
      <div className="flex items-center space-x-2">
        <div className={`font-semibold ${getScoreColor(score)}`}>
          {score}%
        </div>
        <div className="flex-1 bg-navy-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              score >= 80 ? 'bg-green-400' : score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  };

  // Render warning severity
  const getWarningIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-blue-400" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className={`bg-navy-900/50 backdrop-blur-sm border-navy-700/50 ${className}`}>
        <CardContent className="p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6"
          >
            <Brain className="w-16 h-16 text-teal-400" />
          </motion.div>
          <h3 className="text-xl font-semibold text-navy-100 mb-2">
            AI Planning Your Perfect Route
          </h3>
          <p className="text-navy-400">
            Analyzing destinations, preferences, and optimal timing...
          </p>
          <div className="mt-4 space-y-2 text-sm text-navy-500">
            <div>🗺️ Calculating optimal waypoints</div>
            <div>🎯 Finding personalized recommendations</div>
            <div>💰 Estimating costs and timing</div>
            <div>🌤️ Checking weather conditions</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-red-900/20 backdrop-blur-sm border-red-500/20 ${className}`}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-300 mb-2">AI Planning Failed</h3>
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            onClick={generateRecommendations}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) {
    return (
      <Card className={`bg-navy-900/50 backdrop-blur-sm border-navy-700/50 ${className}`}>
        <CardContent className="p-8 text-center">
          <Brain className="w-16 h-16 text-teal-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-navy-100 mb-2">
            AI Route Intelligence
          </h3>
          <p className="text-navy-400 mb-6">
            Get personalized route recommendations powered by advanced AI that considers your preferences, 
            travel style, budget, and real-time conditions.
          </p>
          <Button
            onClick={generateRecommendations}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Zap className="w-4 h-4 mr-2" />
            Generate AI Recommendations
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { primaryRoute, alternativeRoutes, recommendations, warnings, confidence } = recommendation;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Confidence Score */}
      <Card className="bg-navy-900/50 backdrop-blur-sm border-navy-700/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-navy-100 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-teal-400" />
              AI Route Analysis
            </CardTitle>
            <div className="text-sm text-navy-400">
              Confidence Score: {confidence.overallScore}%
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-navy-400 mb-1">Route Optimality</div>
              {renderConfidenceScore(confidence.routeOptimality)}
            </div>
            <div>
              <div className="text-sm text-navy-400 mb-1">Cost Accuracy</div>
              {renderConfidenceScore(confidence.costAccuracy)}
            </div>
            <div>
              <div className="text-sm text-navy-400 mb-1">Timing Reliability</div>
              {renderConfidenceScore(confidence.timingReliability)}
            </div>
            <div>
              <div className="text-sm text-navy-400 mb-1">Overall Score</div>
              {renderConfidenceScore(confidence.overallScore)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Card className="bg-navy-900/50 backdrop-blur-sm border-navy-700/50">
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            {(['overview', 'timeline', 'stops', 'insights', 'alternatives'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-teal-600 text-white'
                    : 'bg-navy-700 text-navy-300 hover:bg-navy-600'
                }`}
              >
                {tab === 'insights' ? 'Local Insights' : tab}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Primary Route Overview */}
                <div>
                  <h3 className="text-lg font-semibold text-navy-100 mb-3">
                    Recommended Route
                  </h3>
                  <div className="bg-navy-800/50 rounded-lg p-4 space-y-4">
                    <p className="text-navy-200">{primaryRoute.description}</p>
                    <p className="text-navy-400">{primaryRoute.reasoning}</p>
                    
                    {/* Cost Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                      <div className="text-center">
                        <Fuel className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                        <div className="text-sm text-navy-400">Fuel</div>
                        <div className="font-semibold text-navy-200">
                          {formatCurrency(primaryRoute.estimatedCosts.fuel.amount)}
                        </div>
                      </div>
                      <div className="text-center">
                        <MapPin className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                        <div className="text-sm text-navy-400">Accommodation</div>
                        <div className="font-semibold text-navy-200">
                          {formatCurrency(primaryRoute.estimatedCosts.accommodation.amount)}
                        </div>
                      </div>
                      <div className="text-center">
                        <Users className="w-6 h-6 text-green-400 mx-auto mb-1" />
                        <div className="text-sm text-navy-400">Food</div>
                        <div className="font-semibold text-navy-200">
                          {formatCurrency(primaryRoute.estimatedCosts.food.amount)}
                        </div>
                      </div>
                      <div className="text-center">
                        <Star className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                        <div className="text-sm text-navy-400">Attractions</div>
                        <div className="font-semibold text-navy-200">
                          {formatCurrency(primaryRoute.estimatedCosts.attractions.amount)}
                        </div>
                      </div>
                      <div className="text-center">
                        <DollarSign className="w-6 h-6 text-teal-400 mx-auto mb-1" />
                        <div className="text-sm text-navy-400">Total</div>
                        <div className="font-bold text-teal-300 text-lg">
                          {formatCurrency(primaryRoute.estimatedCosts.total.amount)}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => onRouteSelect?.(primaryRoute)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Route className="w-4 h-4 mr-2" />
                      Use This Route
                    </Button>
                  </div>
                </div>

                {/* Warnings */}
                {warnings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-navy-100 mb-3">
                      Important Considerations
                    </h3>
                    <div className="space-y-2">
                      {warnings.map((warning, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 bg-navy-800/50 rounded-lg p-3"
                        >
                          {getWarningIcon(warning.severity)}
                          <div className="flex-1">
                            <div className="font-medium text-navy-200">{warning.message}</div>
                            {warning.mitigation && (
                              <div className="text-sm text-navy-400 mt-1">
                                💡 {warning.mitigation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-navy-100">Daily Timeline</h3>
                {primaryRoute.timeline.map((day, index) => (
                  <div key={index} className="bg-navy-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-navy-200 mb-3 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Day {day.day}
                    </h4>
                    <div className="space-y-2">
                      {day.segments.map((segment, segIndex) => (
                        <div key={segIndex} className="flex items-center space-x-3">
                          <div className="text-sm text-navy-400 w-20">
                            {segment.startTime} - {segment.endTime}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-navy-200">{segment.activity}</div>
                            <div className="text-sm text-navy-400">{segment.description}</div>
                            <div className="text-sm text-teal-400">{segment.location}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'stops' && (
              <motion.div
                key="stops"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-navy-100">Recommended Stops</h3>
                <div className="space-y-3">
                  {recommendations.stops.map((stop, index) => (
                    <div key={index} className="bg-navy-800/50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin className="w-4 h-4 text-teal-400" />
                            <h4 className="font-semibold text-navy-200">{stop.location}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              stop.priority === 'must-visit' ? 'bg-red-500/20 text-red-300' :
                              stop.priority === 'recommended' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {stop.priority}
                            </span>
                          </div>
                          <p className="text-navy-400 text-sm mb-2">{stop.reason}</p>
                          <div className="flex items-center space-x-4 text-sm text-navy-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{stop.estimatedTime} min</span>
                            </div>
                            {stop.costEstimate && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-3 h-3" />
                                <span>{stop.costEstimate}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Local Insights */}
                {recommendations.localInsights.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-navy-100 mb-3 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Local Insights
                    </h3>
                    <div className="space-y-3">
                      {recommendations.localInsights.map((insight, index) => (
                        <div key={index} className="bg-navy-800/50 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 rounded-full bg-teal-400 mt-2"></div>
                            <div className="flex-1">
                              <div className="font-medium text-navy-200">{insight.location}</div>
                              <p className="text-navy-400 text-sm mt-1">{insight.insight}</p>
                              <div className="text-xs text-navy-500 mt-2">
                                {insight.category} • {insight.source}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weather Considerations */}
                {recommendations.weatherConsiderations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-navy-100 mb-3 flex items-center">
                      <CloudRain className="w-5 h-5 mr-2" />
                      Weather & Timing
                    </h3>
                    <div className="space-y-3">
                      {recommendations.weatherConsiderations.map((weather, index) => (
                        <div key={index} className="bg-navy-800/50 rounded-lg p-4">
                          <div className="font-medium text-navy-200 mb-2">
                            {weather.location} - {weather.timeframe}
                          </div>
                          <p className="text-navy-400 text-sm mb-2">{weather.conditions}</p>
                          <div className="space-y-1">
                            {weather.recommendations.map((rec, recIndex) => (
                              <div key={recIndex} className="text-sm text-navy-500 flex items-center space-x-2">
                                <CheckCircle className="w-3 h-3 text-green-400" />
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timing Advice */}
                <div>
                  <h3 className="text-lg font-semibold text-navy-100 mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Timing Recommendations
                  </h3>
                  <div className="space-y-2">
                    {recommendations.timing.map((timing, index) => (
                      <div key={index} className="bg-navy-800/50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Shield className={`w-4 h-4 mt-1 ${
                            timing.impact === 'high' ? 'text-red-400' :
                            timing.impact === 'medium' ? 'text-yellow-400' : 'text-green-400'
                          }`} />
                          <div className="flex-1">
                            <div className="font-medium text-navy-200">{timing.advice}</div>
                            <p className="text-navy-400 text-sm mt-1">{timing.rationale}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'alternatives' && (
              <motion.div
                key="alternatives"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-navy-100">Alternative Routes</h3>
                {alternativeRoutes.length === 0 ? (
                  <div className="text-center text-navy-400 py-8">
                    No alternative routes generated. The primary route is optimal for your preferences.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alternativeRoutes.map((alternative, index) => (
                      <div key={index} className="bg-navy-800/50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-navy-200">{alternative.name}</h4>
                            <p className="text-navy-400 text-sm">{alternative.description}</p>
                          </div>
                          <Button
                            onClick={() => onAlternativeSelect?.(alternative)}
                            size="sm"
                            variant="outline"
                            className="border-teal-600 text-teal-400 hover:bg-teal-600 hover:text-white"
                          >
                            Select
                          </Button>
                        </div>

                        {/* Highlights */}
                        <div className="mb-3">
                          <div className="text-sm font-medium text-navy-300 mb-2">Highlights:</div>
                          <div className="flex flex-wrap gap-2">
                            {alternative.highlights.map((highlight, hIndex) => (
                              <span
                                key={hIndex}
                                className="px-2 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs"
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Pros & Cons */}
                        <div className="grid md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-sm font-medium text-green-300 mb-1">Pros:</div>
                            <ul className="space-y-1">
                              {alternative.pros.map((pro, pIndex) => (
                                <li key={pIndex} className="text-sm text-navy-400 flex items-center space-x-2">
                                  <CheckCircle className="w-3 h-3 text-green-400" />
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-red-300 mb-1">Cons:</div>
                            <ul className="space-y-1">
                              {alternative.cons.map((con, cIndex) => (
                                <li key={cIndex} className="text-sm text-navy-400 flex items-center space-x-2">
                                  <AlertTriangle className="w-3 h-3 text-red-400" />
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Cost Comparison */}
                        <div className="text-sm text-navy-400">
                          Total Cost: {formatCurrency(alternative.estimatedCosts.total.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}