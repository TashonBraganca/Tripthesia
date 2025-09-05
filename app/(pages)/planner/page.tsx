"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Share, Settings, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import TimelineBuilder, { Activity, DayPlan } from '@/components/planning/TimelineBuilder';
import ActivityForm from '@/components/planning/ActivityForm';
import RouteOptimizer from '@/components/planning/RouteOptimizer';
import { TimeSlot } from '@/components/planning/TimeSlotManager';

interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  destinations: string[];
  dayPlans: DayPlan[];
}

// Mock data for development
const mockTrip: Trip = {
  id: 'trip-1',
  title: 'Paris Adventure',
  startDate: '2025-09-01',
  endDate: '2025-09-05',
  destinations: ['Paris, France'],
  dayPlans: [
    {
      date: '2025-09-01',
      activities: [
        {
          id: 'act-1',
          title: 'Visit Eiffel Tower',
          description: 'Iconic iron lattice tower and symbol of Paris',
          category: 'sightseeing',
          location: {
            name: 'Eiffel Tower',
            address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
            coordinates: { lat: 48.8584, lng: 2.2945 },
          },
          timeSlot: {
            start: '2025-09-01T09:00:00.000Z',
            end: '2025-09-01T11:00:00.000Z',
            duration: 120,
          },
          budget: 25,
        },
        {
          id: 'act-2',
          title: 'Louvre Museum',
          description: 'World\'s largest art museum',
          category: 'sightseeing',
          location: {
            name: 'Louvre Museum',
            address: 'Rue de Rivoli, 75001 Paris',
            coordinates: { lat: 48.8606, lng: 2.3376 },
          },
          timeSlot: {
            start: '2025-09-01T14:00:00.000Z',
            end: '2025-09-01T17:00:00.000Z',
            duration: 180,
          },
          budget: 17,
        },
      ],
      conflicts: [],
    },
    {
      date: '2025-09-02',
      activities: [],
      conflicts: [],
    },
    {
      date: '2025-09-03',
      activities: [],
      conflicts: [],
    },
    {
      date: '2025-09-04',
      activities: [],
      conflicts: [],
    },
    {
      date: '2025-09-05',
      activities: [],
      conflicts: [],
    },
  ],
};

export default function InteractivePlannerPage() {
  const [trip, setTrip] = useState<Trip>(mockTrip);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);

  const currentDayPlan = trip.dayPlans[currentDayIndex];
  const totalDays = trip.dayPlans.length;

  // Generate existing time slots for conflict detection
  const existingTimeSlots: TimeSlot[] = currentDayPlan.activities
    .filter(activity => !editingActivity || activity.id !== editingActivity.id)
    .map(activity => activity.timeSlot);

  const handleDayPlanUpdate = useCallback((updatedDayPlan: DayPlan) => {
    setTrip(prevTrip => ({
      ...prevTrip,
      dayPlans: prevTrip.dayPlans.map((dayPlan, index) =>
        index === currentDayIndex ? updatedDayPlan : dayPlan
      ),
    }));
  }, [currentDayIndex]);

  const handleAddActivity = useCallback(() => {
    setEditingActivity(undefined);
    setIsActivityFormOpen(true);
  }, []);

  const handleEditActivity = useCallback((activity: Activity) => {
    setEditingActivity(activity);
    setIsActivityFormOpen(true);
  }, []);

  const handleSaveActivity = useCallback((activity: Activity) => {
    const updatedActivities = editingActivity
      ? currentDayPlan.activities.map(a => a.id === activity.id ? activity : a)
      : [...currentDayPlan.activities, activity];

    const updatedDayPlan: DayPlan = {
      ...currentDayPlan,
      activities: updatedActivities,
      conflicts: [], // Will be recalculated by TimelineBuilder
    };

    handleDayPlanUpdate(updatedDayPlan);
    setIsActivityFormOpen(false);
    setEditingActivity(undefined);
  }, [editingActivity, currentDayPlan, handleDayPlanUpdate]);

  const handleCancelActivityForm = useCallback(() => {
    setIsActivityFormOpen(false);
    setEditingActivity(undefined);
  }, []);

  const handleRouteOptimization = useCallback((optimizedActivities: Activity[]) => {
    const updatedDayPlan: DayPlan = {
      ...currentDayPlan,
      activities: optimizedActivities,
      conflicts: [], // Will be recalculated by TimelineBuilder
    };

    handleDayPlanUpdate(updatedDayPlan);
    setShowRouteOptimizer(false);
  }, [currentDayPlan, handleDayPlanUpdate]);

  const navigateToDay = useCallback((dayIndex: number) => {
    setCurrentDayIndex(Math.max(0, Math.min(dayIndex, totalDays - 1)));
  }, [totalDays]);

  const formatDateShort = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateLong = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTotalActivities = (): number => {
    return trip.dayPlans.reduce((total, dayPlan) => total + dayPlan.activities.length, 0);
  };

  const getTotalBudget = (): number => {
    return trip.dayPlans.reduce((total, dayPlan) => 
      total + dayPlan.activities.reduce((dayTotal, activity) => 
        dayTotal + (activity.budget || 0), 0), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{trip.title}</h1>
                <p className="text-sm text-gray-600">
                  {formatDateLong(trip.startDate)} - {formatDateLong(trip.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{totalDays} days</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Plus className="h-4 w-4" />
                  <span>{getTotalActivities()} activities</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>$</span>
                  <span>${getTotalBudget()} budget</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowRouteOptimizer(!showRouteOptimizer)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    showRouteOptimizer
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Route Optimizer
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Share className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Download className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-label="Trip planner interface">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Day Navigation */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateToDay(currentDayIndex - 1)}
                  disabled={currentDayIndex === 0}
                  className={`p-2 rounded-lg ${
                    currentDayIndex === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center space-x-2">
                  {trip.dayPlans.map((dayPlan, index) => (
                    <motion.button
                      key={dayPlan.date}
                      onClick={() => navigateToDay(index)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        index === currentDayIndex
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div>Day {index + 1}</div>
                      <div className="text-xs opacity-75">
                        {formatDateShort(dayPlan.date)}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <button
                  onClick={() => navigateToDay(currentDayIndex + 1)}
                  disabled={currentDayIndex === totalDays - 1}
                  className={`p-2 rounded-lg ${
                    currentDayIndex === totalDays - 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Day Summary */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>
                  {currentDayPlan.activities.length} activities planned
                </span>
                {currentDayPlan.conflicts.length > 0 && (
                  <span className="text-red-600">
                    {currentDayPlan.conflicts.length} conflict{currentDayPlan.conflicts.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Timeline Builder */}
            <TimelineBuilder
              dayPlan={currentDayPlan}
              onUpdateDayPlan={handleDayPlanUpdate}
              onAddActivity={handleAddActivity}
              isEditable={true}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Route Optimizer */}
            <AnimatePresence>
              {showRouteOptimizer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <RouteOptimizer
                    dayPlan={currentDayPlan}
                    onOptimize={handleRouteOptimization}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trip Overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Overview</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{totalDays} days</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Activities</span>
                  <span className="font-medium">{getTotalActivities()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estimated Budget</span>
                  <span className="font-medium">${getTotalBudget()}</span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Daily Progress</h4>
                  <div className="space-y-2">
                    {trip.dayPlans.map((dayPlan, index) => (
                      <div key={dayPlan.date} className="flex items-center justify-between text-sm">
                        <span className={index === currentDayIndex ? 'font-medium text-indigo-600' : 'text-gray-600'}>
                          Day {index + 1}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">{dayPlan.activities.length} activities</span>
                          {dayPlan.conflicts.length > 0 && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              {dayPlan.conflicts.length} conflicts
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <motion.button
                  onClick={handleAddActivity}
                  className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Plus className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Add Activity</div>
                    <div className="text-sm text-gray-600">Plan something new</div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setShowRouteOptimizer(true)}
                  className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Optimize Route</div>
                    <div className="text-sm text-gray-600">Minimize travel time</div>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Activity Form Modal */}
      <ActivityForm
        activity={editingActivity}
        date={currentDayPlan.date}
        existingTimeSlots={existingTimeSlots}
        onSave={handleSaveActivity}
        onCancel={handleCancelActivityForm}
        isOpen={isActivityFormOpen}
      />
    </div>
  );
}