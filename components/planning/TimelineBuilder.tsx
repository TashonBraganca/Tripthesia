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
  sightseeing: 'bg-blue-100 text-blue-800 border-blue-300',
  dining: 'bg-orange-100 text-orange-800 border-orange-300',
  transport: 'bg-gray-100 text-gray-800 border-gray-300',
  accommodation: 'bg-purple-100 text-purple-800 border-purple-300',
  entertainment: 'bg-pink-100 text-pink-800 border-pink-300',
  shopping: 'bg-green-100 text-green-800 border-green-300',
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
        className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${
          selectedActivity === activity.id ? 'border-indigo-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
        } ${hasConflicts ? 'ring-2 ring-red-200' : ''}`}
        onClick={() => setSelectedActivity(selectedActivity === activity.id ? null : activity.id)}
        onDragStart={() => setDraggedActivity(activity.id)}
        onDragEnd={() => setDraggedActivity(null)}
        whileHover={{ scale: 1.02 }}
        whileDrag={{ scale: 1.05, zIndex: 1000 }}
      >
        {/* Drag Handle */}
        {isEditable && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${categoryColors[activity.category]}`}>
                {typeof CategoryIcon === 'string' ? CategoryIcon : <CategoryIcon className="h-3 w-3 inline mr-1" />}
                {activity.category}
              </span>
            </div>
            
            {hasConflicts && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}

        {/* Activity Details */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 flex-1">{activity.title}</h3>
            {isEditable && (
              <div className="flex space-x-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle edit - you'd open an edit modal here
                  }}
                  className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                >
                  <Edit className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteActivity(activity.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {activity.description && (
            <p className="text-sm text-gray-600">{activity.description}</p>
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(activity.timeSlot.start)} - {formatTime(activity.timeSlot.end)}
            </div>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDuration(activity.timeSlot.duration)}
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="truncate">{activity.location.name}</span>
          </div>

          {activity.budget && (
            <div className="flex items-center text-sm text-green-600">
              <DollarSign className="h-3 w-3 mr-1" />
              ${activity.budget}
            </div>
          )}

          {/* Conflicts Display */}
          <AnimatePresence>
            {hasConflicts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1"
              >
                {conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className={`text-xs p-2 rounded ${
                      conflict.severity === 'error' 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <AlertTriangle className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                      <span>{conflict.message}</span>
                    </div>
                  </div>
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
    <div className="space-y-6">
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {new Date(dayPlan.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <span>{dayPlan.activities.length} activities</span>
            <span>{formatDuration(totalDuration)} total</span>
            {totalBudget > 0 && <span>${totalBudget} budget</span>}
          </div>
        </div>
        
        {isEditable && (
          <motion.button
            onClick={onAddActivity}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Activity</span>
          </motion.button>
        )}
      </div>

      {/* Conflicts Summary */}
      {dayPlan.conflicts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="font-medium text-yellow-800">
              {dayPlan.conflicts.length} conflict{dayPlan.conflicts.length > 1 ? 's' : ''} detected
            </h3>
          </div>
          <p className="text-sm text-yellow-700">
            Review your timeline for overlapping activities or insufficient travel time.
          </p>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="space-y-4" ref={scrollContainerRef}>
        {dayPlan.activities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
          >
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities planned</h3>
            <p className="text-gray-600 mb-4">Start building your day by adding activities</p>
            {isEditable && (
              <button
                onClick={onAddActivity}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Activity
              </button>
            )}
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