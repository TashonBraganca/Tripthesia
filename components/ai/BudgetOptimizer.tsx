"use client";

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  CheckCircle,
  PieChart,
  BarChart3,
  Calculator,
  Lightbulb,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Loader2,
  Info,
  Star,
  Calendar
} from 'lucide-react';

interface BudgetOptimizerProps {
  destination: string;
  totalBudget: number;
  currency: 'USD' | 'INR';
  duration: number;
  groupSize: number;
  currentItinerary: ItineraryItem[];
  onOptimizationApplied?: (optimization: BudgetOptimization) => void;
  className?: string;
}

interface ItineraryItem {
  title: string;
  category: string;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  duration: number;
  date: string;
}

interface BudgetOptimization {
  originalBudget: {
    total: number;
    breakdown: Record<string, number>;
    currency: string;
  };
  optimizedBudget: {
    total: number;
    breakdown: Record<string, number>;
    currency: string;
    savings: number;
    savingsPercentage: number;
  };
  recommendations: BudgetRecommendation[];
  alternatives: ActivityAlternative[];
  costSavingStrategies: CostSavingStrategy[];
  budgetAllocation: BudgetAllocation;
  riskAnalysis: {
    potentialOverspend: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    riskFactors: string[];
    mitigationStrategies: string[];
  };
  dailyBudgetPlan: DailyBudgetPlan[];
}

interface BudgetRecommendation {
  category: string;
  currentCost: number;
  suggestedCost: number;
  savings: number;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
  actionItems: string[];
}

interface ActivityAlternative {
  originalActivity: string;
  alternatives: {
    title: string;
    description: string;
    cost: number;
    costDifference: number;
    experienceRating: number;
    pros: string[];
    cons: string[];
  }[];
}

interface CostSavingStrategy {
  category: string;
  strategy: string;
  potentialSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  steps: string[];
}

interface BudgetAllocation {
  recommended: Record<string, { amount: number; percentage: number }>;
  current: Record<string, { amount: number; percentage: number }>;
  adjustments: Record<string, number>;
}

interface DailyBudgetPlan {
  date: string;
  plannedSpending: number;
  categories: Record<string, number>;
  bufferAmount: number;
  tips: string[];
}

export default function BudgetOptimizer({
  destination,
  totalBudget,
  currency,
  duration,
  groupSize,
  currentItinerary,
  onOptimizationApplied,
  className = ''
}: BudgetOptimizerProps) {
  const [optimization, setOptimization] = useState<BudgetOptimization | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'alternatives' | 'strategies' | 'daily'>('overview');
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<number>>(new Set());

  // Calculate current spending
  const currentSpending = useMemo(() => {
    const total = currentItinerary.reduce((sum, item) => sum + item.estimatedCost, 0);
    const breakdown = currentItinerary.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.estimatedCost;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, breakdown };
  }, [currentItinerary]);

  const isOverBudget = currentSpending.total > totalBudget;
  const budgetDifference = Math.abs(currentSpending.total - totalBudget);

  const optimizeBudget = useCallback(async () => {
    setIsOptimizing(true);
    setError(null);

    try {
      const requestData = {
        destination,
        totalBudget,
        currency,
        duration,
        groupSize,
        currentItinerary,
        preferences: {
          accommodationType: 'mid-range',
          foodStyle: 'mixed',
          transportMode: 'mixed',
          prioritizeExperiences: true,
          flexibleSchedule: true,
        },
        constraints: {
          maxDailyBudget: totalBudget / duration,
        }
      };

      const response = await fetch('/api/ai/budget-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to optimize budget');
      }

      const data = await response.json();
      setOptimization(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize budget');
    } finally {
      setIsOptimizing(false);
    }
  }, [destination, totalBudget, currency, duration, groupSize, currentItinerary]);

  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const toggleRecommendation = (index: number) => {
    setSelectedRecommendations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const calculateSelectedSavings = () => {
    if (!optimization) return 0;
    return Array.from(selectedRecommendations).reduce((total, index) => {
      const rec = optimization.recommendations[index];
      return total + (rec ? rec.savings : 0);
    }, 0);
  };

  const applySelectedOptimizations = () => {
    if (!optimization || selectedRecommendations.size === 0) return;
    
    // Create optimized version with selected recommendations
    const savings = calculateSelectedSavings();
    const optimizedVersion = {
      ...optimization,
      optimizedBudget: {
        ...optimization.optimizedBudget,
        savings,
        total: optimization.originalBudget.total - savings,
        savingsPercentage: (savings / optimization.originalBudget.total) * 100,
      }
    };
    
    onOptimizationApplied?.(optimizedVersion);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'recommendations', label: 'Recommendations', icon: Target },
    { id: 'alternatives', label: 'Alternatives', icon: ArrowRight },
    { id: 'strategies', label: 'Strategies', icon: Lightbulb },
    { id: 'daily', label: 'Daily Plan', icon: Calendar },
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Calculator className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Budget Optimizer</h3>
            <p className="text-sm text-gray-600">AI-powered cost optimization for {destination}</p>
          </div>
        </div>
        
        <button
          onClick={optimizeBudget}
          disabled={isOptimizing}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Optimizing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Optimize Budget</span>
            </>
          )}
        </button>
      </div>

      {/* Current Budget Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Target Budget</span>
          </div>
          <p className="text-xl font-bold text-blue-700 mt-1">
            {formatCurrency(totalBudget, currency)}
          </p>
        </div>
        
        <div className={`rounded-lg p-4 ${isOverBudget ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="flex items-center space-x-2">
            <BarChart3 className={`h-4 w-4 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`} />
            <span className={`text-sm font-medium ${isOverBudget ? 'text-red-900' : 'text-green-900'}`}>
              Current Total
            </span>
          </div>
          <p className={`text-xl font-bold mt-1 ${isOverBudget ? 'text-red-700' : 'text-green-700'}`}>
            {formatCurrency(currentSpending.total, currency)}
          </p>
        </div>
        
        <div className={`rounded-lg p-4 ${isOverBudget ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="flex items-center space-x-2">
            {isOverBudget ? (
              <TrendingUp className="h-4 w-4 text-red-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-600" />
            )}
            <span className={`text-sm font-medium ${isOverBudget ? 'text-red-900' : 'text-green-900'}`}>
              {isOverBudget ? 'Over Budget' : 'Under Budget'}
            </span>
          </div>
          <p className={`text-xl font-bold mt-1 ${isOverBudget ? 'text-red-700' : 'text-green-700'}`}>
            {isOverBudget ? '+' : '-'}{formatCurrency(budgetDifference, currency)}
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Optimization Results */}
      {optimization && (
        <div className="space-y-6">
          {/* Savings Summary */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-green-900">Optimization Results</h4>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-green-700">
                  {formatCurrency(optimization.optimizedBudget.savings, currency)}
                </span>
                <span className="text-sm text-green-600">
                  ({optimization.optimizedBudget.savingsPercentage.toFixed(1)}% saved)
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-green-700 font-medium">Original</p>
                <p className="text-green-800 font-bold">
                  {formatCurrency(optimization.originalBudget.total, currency)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-green-700 font-medium">Optimized</p>
                <p className="text-green-800 font-bold">
                  {formatCurrency(optimization.optimizedBudget.total, currency)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-green-700 font-medium">Daily Average</p>
                <p className="text-green-800 font-bold">
                  {formatCurrency(optimization.optimizedBudget.total / duration, currency)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-green-700 font-medium">Per Person</p>
                <p className="text-green-800 font-bold">
                  {formatCurrency(optimization.optimizedBudget.total / groupSize, currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Risk Analysis */}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-900 mb-2">Risk Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-yellow-800 font-medium mb-1">
                              Potential Overspend: {formatCurrency(optimization.riskAnalysis.potentialOverspend, currency)}
                            </p>
                            <p className={`font-medium ${getConfidenceColor(optimization.riskAnalysis.confidenceLevel)}`}>
                              Confidence: {optimization.riskAnalysis.confidenceLevel}
                            </p>
                          </div>
                          <div>
                            <p className="text-yellow-800 font-medium mb-1">Risk Factors:</p>
                            <ul className="text-yellow-700 space-y-0.5">
                              {optimization.riskAnalysis.riskFactors.slice(0, 3).map((factor, index) => (
                                <li key={index} className="text-xs">• {factor}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Budget Allocation Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Current Allocation</h4>
                      <div className="space-y-2">
                        {Object.entries(optimization.budgetAllocation.current).map(([category, data]) => (
                          <div key={category} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 capitalize">{category}</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{data.percentage}%</span>
                              <span className="text-gray-600">
                                {formatCurrency(data.amount, currency)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-3">Recommended Allocation</h4>
                      <div className="space-y-2">
                        {Object.entries(optimization.budgetAllocation.recommended).map(([category, data]) => (
                          <div key={category} className="flex items-center justify-between text-sm">
                            <span className="text-green-700 capitalize">{category}</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{data.percentage}%</span>
                              <span className="text-green-600">
                                {formatCurrency(data.amount, currency)}
                              </span>
                              {optimization.budgetAllocation.adjustments[category] && (
                                <span className="text-xs text-green-500">
                                  ({optimization.budgetAllocation.adjustments[category] > 0 ? '+' : ''}
                                  {formatCurrency(optimization.budgetAllocation.adjustments[category], currency)})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'recommendations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Optimization Recommendations</h4>
                    {selectedRecommendations.size > 0 && (
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                          Selected savings: {formatCurrency(calculateSelectedSavings(), currency)}
                        </span>
                        <button
                          onClick={applySelectedOptimizations}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Apply Selected
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {optimization.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedRecommendations.has(index)
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleRecommendation(index)}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900 capitalize">{rec.category}</h5>
                            <p className="text-sm text-gray-600">{rec.reasoning}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              -{formatCurrency(rec.savings, currency)}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(rec.impact)}`}>
                              {rec.impact} impact
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">
                            {formatCurrency(rec.currentCost, currency)} → {formatCurrency(rec.suggestedCost, currency)}
                          </span>
                          <div className="flex items-center space-x-2">
                            {selectedRecommendations.has(index) ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <div className="w-4 h-4 border border-gray-300 rounded" />
                            )}
                          </div>
                        </div>

                        {rec.actionItems.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Action Items:</p>
                            <ul className="text-xs text-gray-600 space-y-0.5">
                              {rec.actionItems.map((item, itemIndex) => (
                                <li key={itemIndex}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'alternatives' && (
                <div className="space-y-4">
                  {optimization.alternatives.map((alt, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">
                        Alternatives for: {alt.originalActivity}
                      </h5>
                      
                      <div className="space-y-3">
                        {alt.alternatives.map((option, optIndex) => (
                          <div key={optIndex} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h6 className="font-medium text-gray-800">{option.title}</h6>
                                <p className="text-sm text-gray-600">{option.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  {formatCurrency(option.cost, currency)}
                                </p>
                                <p className={`text-sm ${option.costDifference < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {option.costDifference < 0 ? '-' : '+'}{formatCurrency(Math.abs(option.costDifference), currency)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span>{option.experienceRating}/5</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                              <div>
                                <p className="font-medium text-green-700 mb-1">Pros:</p>
                                <ul className="text-green-600 space-y-0.5">
                                  {option.pros.map((pro, proIndex) => (
                                    <li key={proIndex}>• {pro}</li>
                                  ))}
                                </ul>
                              </div>
                              {option.cons.length > 0 && (
                                <div>
                                  <p className="font-medium text-red-700 mb-1">Cons:</p>
                                  <ul className="text-red-600 space-y-0.5">
                                    {option.cons.map((con, conIndex) => (
                                      <li key={conIndex}>• {con}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'strategies' && (
                <div className="space-y-4">
                  {optimization.costSavingStrategies.map((strategy, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{getDifficultyIcon(strategy.difficulty)}</span>
                            <h5 className="font-medium text-gray-900">{strategy.strategy}</h5>
                          </div>
                          <p className="text-sm text-gray-600 capitalize">{strategy.category} • {strategy.difficulty} difficulty</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            Save up to {formatCurrency(strategy.potentialSavings, currency)}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{strategy.description}</p>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-800 mb-2">How to implement:</p>
                        <ol className="text-sm text-gray-600 space-y-1">
                          {strategy.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start space-x-2">
                              <span className="text-gray-400">{stepIndex + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'daily' && (
                <div className="space-y-4">
                  {optimization.dailyBudgetPlan.map((day, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </h5>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(day.plannedSpending, currency)}
                          </p>
                          <p className="text-xs text-gray-600">
                            +{formatCurrency(day.bufferAmount, currency)} buffer
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {Object.entries(day.categories).map(([category, amount]) => (
                          <div key={category} className="text-center">
                            <p className="text-xs text-gray-600 capitalize">{category}</p>
                            <p className="text-sm font-medium text-gray-800">
                              {formatCurrency(amount, currency)}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      {day.tips.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">💡 Daily Tips:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {day.tips.map((tip, tipIndex) => (
                              <li key={tipIndex}>• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}