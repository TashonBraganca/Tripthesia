"use client";

import { useState, useCallback, useRef } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  GripVertical, 
  AlertTriangle, 
  Route,
  DollarSign,
  Edit,
  Trash2
} from 'lucide-react';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  location: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  timeSlot: {
    start: string; // ISO string format
    end: string;
    duration: number; // minutes
  };
  category: 'sightseeing' | 'dining' | 'transport' | 'accommodation' | 'entertainment' | 'shopping';
  budget?: number;
  bookingUrl?: string;
  notes?: string;
}

export interface DayPlan {
  date: string;
  activities: Activity[];
  conflicts: ConflictInfo[];
}

export interface ConflictInfo {
  type: 'overlap' | 'travel_time' | 'location_conflict';
  activities: string[]; // activity IDs
  message: string;
  severity: 'warning' | 'error';
}

interface TimelineBuilderProps {
  dayPlan: DayPlan;
  onUpdateDayPlan: (dayPlan: DayPlan) => void;
  onAddActivity: () => void;
  isEditable?: boolean;
}

const categoryColors = {
  sightseeing: 'bg-blue-400/10 text-blue-300 border-blue-400/30',
  dining: 'bg-orange-400/10 text-orange-300 border-orange-400/30',
  transport: 'bg-gray-400/10 text-gray-300 border-gray-400/30',
  accommodation: 'bg-purple-400/10 text-purple-300 border-purple-400/30',
  entertainment: 'bg-pink-400/10 text-pink-300 border-pink-400/30',
  shopping: 'bg-green-400/10 text-green-300 border-green-400/30',
};

const categoryIcons = {
  sightseeing: MapPin,
  dining: '🍽️',
  transport: Route,
  accommodation: '🏨',
  entertainment: '🎭',
  shopping: '🛍️',
};

export default function TimelineBuilder({ 
  dayPlan, 
  onUpdateDayPlan, 
  onAddActivity, 
  isEditable = true 
}: TimelineBuilderProps) {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [draggedActivity, setDraggedActivity] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const formatTime = (isoString: string): string => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const calculateTravelTime = useCallback((from: Activity, to: Activity): number => {
    // Simple calculation based on coordinates
    // In a real app, you'd use Google Maps/routing API
    const lat1 = from.location.coordinates.lat;
    const lon1 = from.location.coordinates.lng;
    const lat2 = to.location.coordinates.lat;
    const lon2 = to.location.coordinates.lng;

    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Estimate travel time (assuming 30 km/h average in city)
    return Math.round((distance / 30) * 60); // minutes
  }, []);

  const detectConflicts = useCallback((activities: Activity[]): ConflictInfo[] => {
    const conflicts: ConflictInfo[] = [];
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(a.timeSlot.start).getTime() - new Date(b.timeSlot.start).getTime()
    );

    for (let i = 0; i < sortedActivities.length - 1; i++) {
      const current = sortedActivities[i];
      const next = sortedActivities[i + 1];
      
      const currentEnd = new Date(current.timeSlot.end);
      const nextStart = new Date(next.timeSlot.start);
      
      // Check for overlap
      if (currentEnd > nextStart) {
        conflicts.push({
          type: 'overlap',
          activities: [current.id, next.id],
          message: `"${current.title}" overlaps with "${next.title}"`,
          severity: 'error',
        });
      }
      
      // Check travel time feasibility
      const travelTime = calculateTravelTime(current, next);
      const availableTime = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
      
      if (travelTime > availableTime && availableTime >= 0) {
        conflicts.push({
          type: 'travel_time',
          activities: [current.id, next.id],
          message: `Need ${travelTime}min travel time, but only ${Math.round(availableTime)}min available`,
          severity: 'warning',
        });
      }
    }

    return conflicts;
  }, [calculateTravelTime]);

  const handleReorder = useCallback((reorderedActivities: Activity[]) => {
    // Recalculate conflicts after reordering
    const conflicts = detectConflicts(reorderedActivities);
    const updatedDayPlan: DayPlan = {
      ...dayPlan,
      activities: reorderedActivities,
      conflicts,
    };
    onUpdateDayPlan(updatedDayPlan);
  }, [dayPlan, detectConflicts, onUpdateDayPlan]);

  const handleActivityUpdate = useCallback((activityId: string, updates: Partial<Activity>) => {
    const updatedActivities = dayPlan.activities.map(activity =>
      activity.id === activityId ? { ...activity, ...updates } : activity
    );
    
    const conflicts = detectConflicts(updatedActivities);
    const updatedDayPlan: DayPlan = {
      ...dayPlan,
      activities: updatedActivities,
      conflicts,
    };
    onUpdateDayPlan(updatedDayPlan);
  }, [dayPlan, detectConflicts, onUpdateDayPlan]);

  const handleDeleteActivity = useCallback((activityId: string) => {
    const updatedActivities = dayPlan.activities.filter(activity => activity.id !== activityId);
    const conflicts = detectConflicts(updatedActivities);
    const updatedDayPlan: DayPlan = {
      ...dayPlan,
      activities: updatedActivities,
      conflicts,
    };
    onUpdateDayPlan(updatedDayPlan);
  }, [dayPlan, detectConflicts, onUpdateDayPlan]);

  const getConflictsForActivity = useCallback((activityId: string) => {
    return dayPlan.conflicts.filter(conflict => 
      conflict.activities.includes(activityId)
    );
  }, [dayPlan.conflicts]);

  const ActivityCard = ({ activity }: { activity: Activity }) => {
    const conflicts = getConflictsForActivity(activity.id);
    const hasConflicts = conflicts.length > 0;
    const CategoryIcon = categoryIcons[activity.category];

    return (
      <motion.div
        layout
        className={`
          bg-navy-800/50 backdrop-blur-md rounded-xl border-2 p-6 cursor-pointer 
          transition-all duration-300 hover:bg-navy-700/50
          ${selectedActivity === activity.id 
            ? 'border-teal-400 shadow-2xl shadow-teal-400/20 bg-navy-700/70' 
            : 'border-navy-600 hover:border-navy-500'
          } 
          ${hasConflicts ? 'ring-2 ring-red-400/50 border-red-400/50' : ''}
          ${draggedActivity === activity.id ? 'shadow-2xl scale-105 rotate-2' : ''}
        `}
        onClick={() => setSelectedActivity(selectedActivity === activity.id ? null : activity.id)}
        onDragStart={() => setDraggedActivity(activity.id)}
        onDragEnd={() => setDraggedActivity(null)}
        whileHover={{ scale: 1.02, y: -2 }}
        whileDrag={{ scale: 1.05, zIndex: 1000, rotate: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Drag Handle */}
        {isEditable && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <GripVertical className="h-5 w-5 text-navy-400 hover:text-navy-300 cursor-grab active:cursor-grabbing transition-colors" />
              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${categoryColors[activity.category]} backdrop-blur-sm`}>
                {typeof CategoryIcon === 'string' ? (
                  <span className="mr-1">{CategoryIcon}</span>
                ) : (
                  <CategoryIcon className="h-3 w-3 inline mr-1" />
                )}
                {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
              </span>
            </div>
            
            {hasConflicts && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center space-x-1"
              >
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="text-xs text-red-400 font-medium">
                  {conflicts.length} issue{conflicts.length > 1 ? 's' : ''}
                </span>
              </motion.div>
            )}
          </div>
        )}

        {/* Activity Details */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-navy-100 flex-1 text-lg leading-tight pr-4">
              {activity.title}
            </h3>
            {isEditable && (
              <div className="flex space-x-2 ml-2">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle edit - you'd open an edit modal here
                  }}
                  className="p-2 text-navy-400 hover:text-teal-300 bg-navy-700/50 hover:bg-teal-400/10 rounded-lg transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit className="h-4 w-4" />
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteActivity(activity.id);
                  }}
                  className="p-2 text-navy-400 hover:text-red-300 bg-navy-700/50 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              </div>
            )}
          </div>

          {activity.description && (
            <p className="text-sm text-navy-300 leading-relaxed bg-navy-700/30 rounded-lg p-3">
              {activity.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center text-navy-300 bg-navy-700/30 rounded-lg p-3">
              <Clock className="h-4 w-4 mr-2 text-teal-400 flex-shrink-0" />
              <span className="font-medium">
                {formatTime(activity.timeSlot.start)} - {formatTime(activity.timeSlot.end)}
              </span>
            </div>
            <div className="flex items-center text-navy-300 bg-navy-700/30 rounded-lg p-3">
              <Calendar className="h-4 w-4 mr-2 text-blue-400 flex-shrink-0" />
              <span className="font-medium">{formatDuration(activity.timeSlot.duration)}</span>
            </div>
          </div>

          <div className="flex items-center text-sm text-navy-300 bg-navy-700/30 rounded-lg p-3">
            <MapPin className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0" />
            <span className="font-medium truncate">{activity.location.name}</span>
          </div>

          {activity.budget && (
            <div className="flex items-center text-sm text-green-300 bg-green-400/10 rounded-lg p-3 border border-green-400/20">
              <DollarSign className="h-4 w-4 mr-2 text-green-400 flex-shrink-0" />
              <span className="font-bold">${activity.budget}</span>
            </div>
          )}

          {/* Conflicts Display */}
          <AnimatePresence>
            {hasConflicts && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-3"
              >
                {conflicts.map((conflict, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.1 }}
                    className={`text-sm p-4 rounded-xl border backdrop-blur-sm ${
                      conflict.severity === 'error' 
                        ? 'bg-red-400/10 text-red-300 border-red-400/30' 
                        : 'bg-yellow-400/10 text-yellow-300 border-yellow-400/30'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        conflict.severity === 'error' ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                      <div>
                        <div className="font-medium mb-1">
                          {conflict.type === 'overlap' ? 'Schedule Conflict' :
                           conflict.type === 'travel_time' ? 'Travel Time Issue' : 
                           'Location Conflict'}
                        </div>
                        <div className="text-xs opacity-90 leading-relaxed">
                          {conflict.message}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  const totalBudget = dayPlan.activities.reduce((sum, activity) => sum + (activity.budget || 0), 0);
  const totalDuration = dayPlan.activities.reduce((sum, activity) => sum + activity.timeSlot.duration, 0);

  return (
    <div className="space-y-8">
      {/* Day Header */}
      <div className="flex items-center justify-between bg-navy-800/30 backdrop-blur-md rounded-2xl p-6 border border-navy-600">
        <div>
          <h2 className="text-3xl font-bold text-navy-100 mb-2">
            {new Date(dayPlan.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2 bg-navy-700/50 rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-teal-400" />
              <span className="text-navy-300 font-medium">{dayPlan.activities.length} activities</span>
            </div>
            <div className="flex items-center space-x-2 bg-navy-700/50 rounded-lg px-3 py-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-navy-300 font-medium">{formatDuration(totalDuration)} total</span>
            </div>
            {totalBudget > 0 && (
              <div className="flex items-center space-x-2 bg-green-400/10 border border-green-400/30 rounded-lg px-3 py-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-green-300 font-bold">${totalBudget} budget</span>
              </div>
            )}
          </div>
        </div>
        
        {isEditable && (
          <motion.button
            onClick={onAddActivity}
            className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Plus className="h-5 w-5" />
            <span>Add Activity</span>
          </motion.button>
        )}
      </div>

      {/* Conflicts Summary */}
      {dayPlan.conflicts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-6 backdrop-blur-md"
        >
          <div className="flex items-center mb-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="mr-3"
            >
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
            </motion.div>
            <h3 className="font-bold text-yellow-300 text-lg">
              {dayPlan.conflicts.length} Conflict{dayPlan.conflicts.length > 1 ? 's' : ''} Detected
            </h3>
          </div>
          <p className="text-sm text-yellow-200 leading-relaxed">
            Your timeline has scheduling issues that need attention. Review the highlighted activities below to resolve overlapping times or insufficient travel duration.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {dayPlan.conflicts.map((conflict, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  conflict.severity === 'error' 
                    ? 'bg-red-400/20 text-red-300 border border-red-400/30' 
                    : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                }`}
              >
                {conflict.type.replace('_', ' ')}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="space-y-6" ref={scrollContainerRef}>
        {dayPlan.activities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="text-center py-16 bg-navy-800/20 backdrop-blur-md rounded-2xl border-2 border-dashed border-navy-500/50 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-blue-400/5"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-teal-400/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-blue-400/10 rounded-full blur-xl"></div>
            
            <div className="relative z-10">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1, 1.05, 1]
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 3,
                  ease: 'easeInOut'
                }}
                className="mb-6"
              >
                <Calendar className="h-16 w-16 text-teal-400 mx-auto" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-navy-100 mb-3">
                Your Day Awaits
              </h3>
              <p className="text-navy-300 mb-6 max-w-md mx-auto leading-relaxed">
                Start crafting your perfect day by adding activities, attractions, and experiences
              </p>
              
              {isEditable && (
                <motion.button
                  onClick={onAddActivity}
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2,
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Your First Activity</span>
                </motion.button>
              )}
              
              {!isEditable && (
                <div className="text-navy-400 text-sm bg-navy-700/30 rounded-lg p-4 max-w-sm mx-auto">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  This timeline is in view-only mode
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <Reorder.Group
            axis="y"
            values={dayPlan.activities}
            onReorder={handleReorder}
            className="space-y-4"
          >
            {dayPlan.activities.map((activity) => (
              <Reorder.Item
                key={activity.id}
                value={activity}
                dragListener={isEditable}
                className={draggedActivity === activity.id ? 'z-50' : ''}
              >
                <ActivityCard activity={activity} />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}