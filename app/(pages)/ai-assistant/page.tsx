"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Brain, 
  MapPin, 
  DollarSign,
  Star,
  Calendar,
  Users,
  Settings,
  ArrowRight,
  Bot,
  Lightbulb,
  Target,
  Compass,
  TrendingUp
} from 'lucide-react';

import AITripGenerator from '@/components/ai/AITripGenerator';
import PersonalizedSuggestions from '@/components/ai/PersonalizedSuggestions';
import BudgetOptimizer from '@/components/ai/BudgetOptimizer';

interface AIAssistantPageProps {}

type ActiveTool = 'trip-generator' | 'suggestions' | 'budget-optimizer' | 'local-insights';

interface UserPreferences {
  interests: string[];
  budget: number;
  currency: 'USD' | 'INR';
  travelStyle: 'budget' | 'mid-range' | 'luxury';
  groupSize: number;
}

const aiTools = [
  {
    id: 'trip-generator' as const,
    name: 'AI Trip Generator',
    description: 'Create complete itineraries with AI-powered planning',
    icon: Sparkles,
    color: 'purple',
    features: ['Complete itineraries', 'Budget optimization', 'Local insights', 'Hidden gems'],
    bestFor: 'Planning entire trips from scratch'
  },
  {
    id: 'suggestions' as const,
    name: 'Personalized Suggestions',
    description: 'Get activity recommendations tailored to your preferences',
    icon: Target,
    color: 'blue',
    features: ['Personalized matching', 'Real-time availability', 'User reviews', 'Local insights'],
    bestFor: 'Discovering activities that match your interests'
  },
  {
    id: 'budget-optimizer' as const,
    name: 'Budget Optimizer',
    description: 'Optimize your travel budget with AI-powered suggestions',
    icon: TrendingUp,
    color: 'green',
    features: ['Cost analysis', 'Alternative options', 'Savings strategies', 'Daily planning'],
    bestFor: 'Maximizing value and reducing costs'
  },
  {
    id: 'local-insights' as const,
    name: 'Local Insights',
    description: 'Discover hidden gems and cultural experiences',
    icon: Compass,
    color: 'orange',
    features: ['Hidden gems', 'Cultural events', 'Local customs', 'Safety tips'],
    bestFor: 'Authentic local experiences and cultural immersion'
  }
];

export default function AIAssistantPage() {
  const [activeTool, setActiveTool] = useState<ActiveTool>('trip-generator');
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    interests: [],
    budget: 1000,
    currency: 'USD',
    travelStyle: 'mid-range',
    groupSize: 2,
  });
  const [destination, setDestination] = useState('');
  const [currentItinerary, setCurrentItinerary] = useState<any[]>([]);

  const handleToolSwitch = useCallback((toolId: ActiveTool) => {
    setActiveTool(toolId);
  }, []);

  const handleTripGenerated = useCallback((trip: any) => {
    // Convert generated trip to itinerary format
    const itinerary = trip.dailyItinerary.flatMap((day: any) => 
      day.activities.map((activity: any) => ({
        title: activity.title,
        category: activity.category,
        estimatedCost: activity.estimatedCost,
        priority: activity.priority,
        duration: activity.duration,
        date: day.date,
      }))
    );
    setCurrentItinerary(itinerary);
  }, []);

  const handleSuggestionSelect = useCallback((suggestion: any) => {
    // Add suggestion to current itinerary
    const newItem = {
      title: suggestion.title,
      category: suggestion.category,
      estimatedCost: suggestion.estimatedCost,
      priority: 'medium',
      duration: suggestion.duration,
      date: new Date().toISOString().split('T')[0],
    };
    setCurrentItinerary(prev => [...prev, newItem]);
  }, []);

  const getToolColor = (color: string) => {
    const colors = {
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-600' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-600' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', accent: 'bg-green-600' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', accent: 'bg-orange-600' },
    };
    return colors[color as keyof typeof colors] || colors.purple;
  };

  const activeToolData = aiTools.find(tool => tool.id === activeTool);
  const toolColors = activeToolData ? getToolColor(activeToolData.color) : getToolColor('purple');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Travel Assistant</h1>
                <p className="text-sm text-gray-600">Powered by advanced AI for personalized travel planning</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Bot className="h-4 w-4" />
                <span>GPT-4 Powered</span>
              </div>
              <div className="flex items-center space-x-1">
                <Lightbulb className="h-4 w-4" />
                <span>Smart Recommendations</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - AI Tools */}
          <aside className="lg:col-span-1" role="complementary" aria-label="AI tool selection">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Tools</h2>
              
              <div className="space-y-3">
                {aiTools.map((tool) => {
                  const IconComponent = tool.icon;
                  const colors = getToolColor(tool.color);
                  const isActive = activeTool === tool.id;
                  
                  return (
                    <motion.button
                      key={tool.id}
                      onClick={() => handleToolSwitch(tool.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        isActive
                          ? `${colors.bg} ${colors.border} ${colors.text}`
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${isActive ? colors.accent : 'bg-gray-300'}`}>
                          <IconComponent className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm">{tool.name}</h3>
                          <p className="text-xs opacity-80 mt-1">{tool.description}</p>
                          <p className="text-xs opacity-60 mt-2 italic">{tool.bestFor}</p>
                        </div>
                      </div>
                      
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 pt-3 border-t border-current border-opacity-20"
                        >
                          <p className="text-xs font-medium mb-1">Features:</p>
                          <ul className="text-xs space-y-0.5 opacity-80">
                            {tool.features.map((feature, index) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Quick Settings */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Settings</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Destination
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g., Paris, France"
                        className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Budget
                    </label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                        <input
                          type="number"
                          value={userPreferences.budget}
                          onChange={(e) => setUserPreferences(prev => ({ 
                            ...prev, 
                            budget: parseInt(e.target.value) || 0 
                          }))}
                          className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <select
                        value={userPreferences.currency}
                        onChange={(e) => setUserPreferences(prev => ({ 
                          ...prev, 
                          currency: e.target.value as 'USD' | 'INR' 
                        }))}
                        className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Group Size
                    </label>
                    <div className="relative">
                      <Users className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={userPreferences.groupSize}
                        onChange={(e) => setUserPreferences(prev => ({ 
                          ...prev, 
                          groupSize: parseInt(e.target.value) || 1 
                        }))}
                        className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Travel Style
                    </label>
                    <select
                      value={userPreferences.travelStyle}
                      onChange={(e) => setUserPreferences(prev => ({ 
                        ...prev, 
                        travelStyle: e.target.value as any 
                      }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="budget">Budget</option>
                      <option value="mid-range">Mid-Range</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main id="main-content" role="main" className="lg:col-span-3" aria-label="AI assistant interface">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTool}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Tool Header */}
                {activeToolData && (
                  <div className={`${toolColors.bg} ${toolColors.border} border rounded-lg p-6 mb-6`}>
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 ${toolColors.accent} rounded-xl`}>
                        <activeToolData.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className={`text-xl font-semibold ${toolColors.text}`}>
                          {activeToolData.name}
                        </h2>
                        <p className={`${toolColors.text} opacity-80`}>
                          {activeToolData.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tool Content */}
                {activeTool === 'trip-generator' && (
                  <AITripGenerator
                    onTripGenerated={handleTripGenerated}
                    className="mb-6"
                  />
                )}

                {activeTool === 'suggestions' && destination && (
                  <PersonalizedSuggestions
                    destination={destination}
                    userPreferences={userPreferences}
                    currentActivities={currentItinerary.map(item => ({
                      title: item.title,
                      location: 'Location',
                      category: item.category,
                      time: '10:00',
                    }))}
                    onSuggestionSelect={handleSuggestionSelect}
                    className="mb-6"
                  />
                )}

                {activeTool === 'budget-optimizer' && currentItinerary.length > 0 && (
                  <BudgetOptimizer
                    destination={destination || 'Your Destination'}
                    totalBudget={userPreferences.budget}
                    currency={userPreferences.currency}
                    duration={7}
                    groupSize={userPreferences.groupSize}
                    currentItinerary={currentItinerary}
                    className="mb-6"
                  />
                )}

                {activeTool === 'local-insights' && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-center py-12">
                      <Compass className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Local Insights & Hidden Gems
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Discover authentic local experiences and cultural insights
                      </p>
                      <p className="text-sm text-gray-500">
                        Coming soon! This feature will provide local insights, hidden gems, and cultural events.
                      </p>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {activeTool === 'suggestions' && !destination && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-center py-12">
                      <MapPin className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Enter a Destination
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Add a destination in the sidebar to get personalized suggestions
                      </p>
                    </div>
                  </div>
                )}

                {activeTool === 'budget-optimizer' && currentItinerary.length === 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-center py-12">
                      <TrendingUp className="h-16 w-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Itinerary to Optimize
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Generate a trip or add activities to optimize your budget
                      </p>
                      <button
                        onClick={() => handleToolSwitch('trip-generator')}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Generate Trip First</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Current Itinerary Summary */}
            {currentItinerary.length > 0 && (
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Current Itinerary</h3>
                  <span className="text-sm text-gray-600">
                    {currentItinerary.length} activities
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {currentItinerary.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="truncate">{item.title}</span>
                      <span className="text-gray-500 flex-shrink-0">
                        ${item.estimatedCost}
                      </span>
                    </div>
                  ))}
                  {currentItinerary.length > 6 && (
                    <div className="text-sm text-gray-500">
                      +{currentItinerary.length - 6} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}