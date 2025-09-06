"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export interface TimeSlot {
  start: string; // ISO string
  end: string;   // ISO string
  duration: number; // minutes
}

export interface TimeSlotConflict {
  type: 'overlap' | 'invalid_duration' | 'invalid_order';
  message: string;
  severity: 'error' | 'warning';
}

interface TimeSlotManagerProps {
  initialTimeSlot: TimeSlot;
  date: string; // ISO date string
  existingTimeSlots?: TimeSlot[]; // For conflict detection
  minDuration?: number; // minutes
  maxDuration?: number; // minutes
  onTimeSlotChange: (timeSlot: TimeSlot) => void;
  onConflictDetected?: (conflicts: TimeSlotConflict[]) => void;
  className?: string;
}

export default function TimeSlotManager({
  initialTimeSlot,
  date,
  existingTimeSlots = [],
  minDuration = 15,
  maxDuration = 12 * 60, // 12 hours
  onTimeSlotChange,
  onConflictDetected,
  className = '',
}: TimeSlotManagerProps) {
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(initialTimeSlot);
  const [conflicts, setConflicts] = useState<TimeSlotConflict[]>([]);
  const [isValid, setIsValid] = useState(true);

  // Generate time options (15-minute intervals)
  const generateTimeOptions = useCallback(() => {
    const options: { value: string; label: string }[] = [];
    const baseDate = new Date(date);
    
    for (let hours = 0; hours < 24; hours++) {
      for (let minutes = 0; minutes < 60; minutes += 15) {
        const time = new Date(baseDate);
        time.setHours(hours, minutes, 0, 0);
        
        const timeString = time.toISOString();
        const label = time.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        
        options.push({ value: timeString, label });
      }
    }
    
    return options;
  }, [date]);

  // Detect conflicts with existing time slots
  const detectConflicts = useCallback((currentTimeSlot: TimeSlot): TimeSlotConflict[] => {
    const detectedConflicts: TimeSlotConflict[] = [];
    
    const startTime = new Date(currentTimeSlot.start);
    const endTime = new Date(currentTimeSlot.end);
    
    // Validate time order
    if (startTime >= endTime) {
      detectedConflicts.push({
        type: 'invalid_order',
        message: 'End time must be after start time',
        severity: 'error',
      });
    }
    
    // Validate duration
    const actualDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    if (actualDuration < minDuration) {
      detectedConflicts.push({
        type: 'invalid_duration',
        message: `Duration must be at least ${minDuration} minutes`,
        severity: 'error',
      });
    }
    
    if (actualDuration > maxDuration) {
      detectedConflicts.push({
        type: 'invalid_duration',
        message: `Duration cannot exceed ${Math.floor(maxDuration / 60)} hours`,
        severity: 'error',
      });
    }
    
    // Check for overlaps with existing time slots
    existingTimeSlots.forEach((existingSlot) => {
      const existingStart = new Date(existingSlot.start);
      const existingEnd = new Date(existingSlot.end);
      
      // Check if current time slot overlaps with existing one
      const hasOverlap = (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      );
      
      if (hasOverlap) {
        const existingStartLabel = existingStart.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        const existingEndLabel = existingEnd.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        
        detectedConflicts.push({
          type: 'overlap',
          message: `Overlaps with existing activity (${existingStartLabel} - ${existingEndLabel})`,
          severity: 'error',
        });
      }
    });
    
    return detectedConflicts;
  }, [existingTimeSlots, minDuration, maxDuration]);

  // Calculate duration from start and end times
  const calculateDuration = useCallback((start: string, end: string): number => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    return Math.max(0, (endTime.getTime() - startTime.getTime()) / (1000 * 60));
  }, []);

  // Update time slot and validate
  const updateTimeSlot = useCallback((updates: Partial<TimeSlot>) => {
    const updatedTimeSlot = { ...timeSlot, ...updates };
    
    // Recalculate duration if start or end time changed
    if (updates.start || updates.end) {
      updatedTimeSlot.duration = calculateDuration(updatedTimeSlot.start, updatedTimeSlot.end);
    }
    
    // If duration changed, update end time accordingly
    if (updates.duration !== undefined && !updates.end) {
      const startTime = new Date(updatedTimeSlot.start);
      const newEndTime = new Date(startTime.getTime() + updates.duration * 60000);
      updatedTimeSlot.end = newEndTime.toISOString();
    }
    
    setTimeSlot(updatedTimeSlot);
    
    // Detect conflicts
    const detectedConflicts = detectConflicts(updatedTimeSlot);
    setConflicts(detectedConflicts);
    setIsValid(detectedConflicts.filter(c => c.severity === 'error').length === 0);
    
    // Notify parent components
    onTimeSlotChange(updatedTimeSlot);
    onConflictDetected?.(detectedConflicts);
  }, [timeSlot, calculateDuration, detectConflicts, onTimeSlotChange, onConflictDetected]);

  // Handle start time change
  const handleStartTimeChange = useCallback((newStartTime: string) => {
    updateTimeSlot({ start: newStartTime });
  }, [updateTimeSlot]);

  // Handle end time change
  const handleEndTimeChange = useCallback((newEndTime: string) => {
    updateTimeSlot({ end: newEndTime });
  }, [updateTimeSlot]);

  // Handle duration change
  const handleDurationChange = useCallback((newDuration: number) => {
    updateTimeSlot({ duration: newDuration });
  }, [updateTimeSlot]);

  // Quick duration presets
  const durationPresets = [
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 },
    { label: '4 hours', value: 240 },
    { label: 'Half day', value: 360 },
    { label: 'Full day', value: 480 },
  ];

  const timeOptions = generateTimeOptions();

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  // Initialize conflicts on mount
  useEffect(() => {
    const initialConflicts = detectConflicts(initialTimeSlot);
    setConflicts(initialConflicts);
    setIsValid(initialConflicts.filter(c => c.severity === 'error').length === 0);
  }, [initialTimeSlot, detectConflicts]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-indigo-600" />
          Schedule Activity
        </h3>
        
        {/* Status Indicator */}
        <div className="flex items-center">
          {isValid ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Valid</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Conflicts</span>
            </div>
          )}
        </div>
      </div>

      {/* Time Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Start Time */}
        <div className="space-y-2">
          <label htmlFor="start-time-select" className="block text-sm font-medium text-gray-700">
            Start Time
          </label>
          <select
            id="start-time-select"
            value={timeSlot.start}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Duration Visual Separator */}
        <div className="flex items-center justify-center">
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </div>

        {/* End Time */}
        <div className="space-y-2">
          <label htmlFor="end-time-select" className="block text-sm font-medium text-gray-700">
            End Time
          </label>
          <select
            id="end-time-select"
            value={timeSlot.end}
            onChange={(e) => handleEndTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Duration Display and Manual Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Duration:</span>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <span className="text-lg font-semibold text-indigo-600">
              {formatDuration(timeSlot.duration)}
            </span>
          </div>
        </div>

        {/* Duration Input */}
        <div className="space-y-2">
          <label htmlFor="duration-input" className="block text-sm font-medium text-gray-700">
            Or set duration directly (minutes):
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="duration-input"
              type="number"
              value={timeSlot.duration}
              onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
              min={minDuration}
              max={maxDuration}
              step={15}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-500">minutes</span>
          </div>
        </div>

        {/* Duration Presets */}
        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-gray-700">
            Quick presets:
          </legend>
          <div className="flex flex-wrap gap-2">
            {durationPresets.map((preset) => (
              <motion.button
                key={preset.value}
                onClick={() => handleDurationChange(preset.value)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  timeSlot.duration === preset.value
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {preset.label}
              </motion.button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Conflicts Display */}
      <AnimatePresence>
        {conflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              Scheduling Conflicts
            </h4>
            
            {conflicts.map((conflict, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border ${
                  conflict.severity === 'error'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}
              >
                <div className="flex items-start">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 mr-2 flex-shrink-0 ${
                    conflict.severity === 'error' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">
                      {conflict.type === 'overlap' ? 'Time Overlap' :
                       conflict.type === 'invalid_duration' ? 'Invalid Duration' :
                       'Invalid Time Order'}
                    </p>
                    <p className="text-sm">{conflict.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Schedule Summary</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Start:</span>
            <span>
              {new Date(timeSlot.start).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>End:</span>
            <span>
              {new Date(timeSlot.end).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Duration:</span>
            <span>{formatDuration(timeSlot.duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}