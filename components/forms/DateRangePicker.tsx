'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { AnimatedButton } from '@/components/effects/AnimatedButton';
import { InteractiveCard } from '@/components/effects/InteractiveCard';
import { trackDateRangeSet } from '@/lib/analytics/events';
import { PortalDropdown, useDropdown } from '@/components/ui/portal-dropdown';

interface DateRange {
  startDate: string;
  endDate: string;
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  showTimePicker?: boolean;
  required?: boolean;
  label?: string;
}

interface Preset {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  getDates: () => DateRange;
}

const datePresets: Preset[] = [
  {
    id: 'weekend',
    label: 'Weekend',
    description: '2-3 days',
    icon: MapPin,
    getDates: () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      // Get next weekend (Friday-Sunday)
      const friday = new Date(now);
      const daysToFriday = (5 - dayOfWeek + 7) % 7;
      if (daysToFriday === 0 && now.getHours() > 18) {
        // If it's Friday evening, get next weekend
        friday.setDate(now.getDate() + 7);
      } else {
        friday.setDate(now.getDate() + daysToFriday);
      }
      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
      
      return {
        startDate: friday.toISOString().split('T')[0],
        endDate: sunday.toISOString().split('T')[0]
      };
    }
  },
  {
    id: '3days',
    label: '3 Days',
    description: 'From today',
    icon: Calendar,
    getDates: () => {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 2); // 3 days total
      
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
    }
  },
  {
    id: '5days',
    label: '5 Days',
    description: 'From today',
    icon: Calendar,
    getDates: () => {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 4); // 5 days total
      
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
    }
  },
  {
    id: '7days',
    label: '7 Days',
    description: 'From today',
    icon: Clock,
    getDates: () => {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 6); // 7 days total
      
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
    }
  }
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = '',
  minDate,
  maxDate,
  placeholder = 'Select travel dates',
  showTimePicker = false,
  required = false,
  label = 'Travel Dates'
}) => {
  const dropdown = useDropdown(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<'start' | 'end' | 'startTime' | 'endTime' | null>(null);

  // Handle dropdown close
  const handleDropdownClose = () => {
    dropdown.close();
    setFocusedInput(null);
  };

  const handlePresetClick = (preset: Preset) => {
    const dates = preset.getDates();
    // Preserve existing times if they exist
    const newRange = {
      ...dates,
      startTime: value.startTime || (showTimePicker ? '09:00' : undefined),
      endTime: value.endTime || (showTimePicker ? '18:00' : undefined),
    };
    onChange(newRange);
    setSelectedPreset(preset.id);
    dropdown.close();
    
    // Track analytics event
    const days = Math.ceil((new Date(dates.endDate).getTime() - new Date(dates.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const presetMap: Record<string, 'weekend' | '3days' | '5days' | '7days'> = {
      'weekend': 'weekend',
      '3days': '3days', 
      '5days': '5days',
      '7days': '7days'
    };
    trackDateRangeSet(days, presetMap[preset.id]);
  };

  const handleDateChange = (field: 'start' | 'end', date: string) => {
    const newRange = {
      ...value, // Preserve existing times
      startDate: field === 'start' ? date : value.startDate,
      endDate: field === 'end' ? date : value.endDate
    };
    
    // Auto-adjust if end date is before start date
    if (newRange.endDate && newRange.startDate && newRange.endDate < newRange.startDate) {
      if (field === 'start') {
        newRange.endDate = newRange.startDate;
      } else {
        newRange.startDate = newRange.endDate;
      }
    }
    
    onChange(newRange);
    setSelectedPreset(null); // Clear preset when manually changing dates
    
    // Track analytics for manual date selection (when both dates are set)
    if (newRange.startDate && newRange.endDate) {
      const days = Math.ceil((new Date(newRange.endDate).getTime() - new Date(newRange.startDate).getTime()) / (1000 * 60 * 60 * 24));
      trackDateRangeSet(days, undefined); // No preset used
    }
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', time: string) => {
    const newRange = {
      ...value,
      [field]: time
    };
    onChange(newRange);
  };

  const formatDateForDisplay = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    let formatted = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    if (showTimePicker && timeStr) {
      formatted += ` at ${formatTime(timeStr)}`;
    }
    
    return formatted;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDateChip = () => {
    if (!value.startDate || !value.endDate) return '';
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const startDay = start.toLocaleDateString('en-US', { weekday: 'short' });
    const endDay = end.toLocaleDateString('en-US', { weekday: 'short' });
    
    return `${startDay} → ${endDay} • ${nights} night${nights === 1 ? '' : 's'}`;
  };

  const getDuration = () => {
    if (!value.startDate || !value.endDate) return '';
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff === 1 ? '1 day' : `${diff} days`;
  };

  const hasValidRange = value.startDate && value.endDate;

  return (
    <div className={`relative ${className}`}>
      <label 
        htmlFor="date-range-button"
        className="block text-sm font-medium text-navy-100 mb-2"
        id="date-range-label"
      >
        {label} {required && <span className="text-teal-400">*</span>}
      </label>
      
      <PortalDropdown
        isOpen={dropdown.isOpen}
        onClose={handleDropdownClose}
        sameWidth={true}
        maxHeight={480}
        placement="bottom-start"
        trigger={
          <motion.button
            id="date-range-button"
            onClick={dropdown.toggle}
            aria-labelledby="date-range-label"
            aria-expanded={dropdown.isOpen}
            aria-describedby={hasValidRange ? 'selected-dates' : 'date-placeholder'}
            className={`
              relative cursor-pointer p-3 rounded-xl border transition-all duration-200 w-full text-left
              ${dropdown.isOpen 
                ? 'border-teal-400 ring-2 ring-teal-400/20 bg-navy-800/50' 
                : 'border-navy-600 hover:border-navy-500 bg-navy-800/30'
              }
              ${hasValidRange ? 'text-navy-100' : 'text-navy-400'}
              focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400
            `}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-teal-400" />
                <div>
                  {hasValidRange ? (
                    <div id="selected-dates">
                      <span className="font-medium">
                        {formatDateForDisplay(value.startDate, value.startTime)} - {formatDateForDisplay(value.endDate, value.endTime)}
                      </span>
                      <div className="text-sm text-teal-300 mt-1 font-medium">
                        {formatDateChip()}
                      </div>
                    </div>
                  ) : (
                    <span id="date-placeholder">{placeholder}</span>
                  )}
                </div>
              </div>
              
              <motion.div
                animate={{ rotate: dropdown.isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4 text-navy-400" />
              </motion.div>
            </div>
          </motion.button>
        }
      >
        <div className="p-6 space-y-6">
          {/* Presets */}
          <div>
            <h3 className="text-sm font-medium text-navy-100 mb-3">Quick Select</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {datePresets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedPreset === preset.id;
                
                return (
                  <motion.button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset)}
                    className={`
                      p-3 rounded-lg text-left transition-all duration-200
                      ${isSelected 
                        ? 'bg-teal-400/20 border border-teal-400/50 text-teal-300' 
                        : 'bg-navy-700/50 hover:bg-navy-700 border border-navy-600 text-navy-300'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon size={16} />
                      <span className="font-medium text-sm">{preset.label}</span>
                    </div>
                    <p className="text-xs opacity-70">{preset.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
          
          {/* Custom Date Inputs */}
          <div>
            <h3 className="text-sm font-medium text-navy-100 mb-3">Custom Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date-input" className="block text-xs text-navy-400 mb-1">Start Date</label>
                <motion.input
                  id="start-date-input"
                  type="date"
                  value={value.startDate || ''}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  onFocus={() => setFocusedInput('start')}
                  onBlur={() => setFocusedInput(null)}
                  min={minDate}
                  max={maxDate}
                  className={`
                    w-full px-3 py-2 rounded-lg border transition-all duration-200
                    bg-navy-800/50 text-navy-100 text-sm
                    ${focusedInput === 'start' 
                      ? 'border-teal-400 ring-1 ring-teal-400/20' 
                      : 'border-navy-600 hover:border-navy-500'
                    }
                    focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20
                  `}
                  whileFocus={{ scale: 1.02 }}
                />
              </div>
              
              <div>
                <label htmlFor="end-date-input" className="block text-xs text-navy-400 mb-1">End Date</label>
                <motion.input
                  id="end-date-input"
                  type="date"
                  value={value.endDate || ''}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  onFocus={() => setFocusedInput('end')}
                  onBlur={() => setFocusedInput(null)}
                  min={value.startDate || minDate}
                  max={maxDate}
                  className={`
                    w-full px-3 py-2 rounded-lg border transition-all duration-200
                    bg-navy-800/50 text-navy-100 text-sm
                    ${focusedInput === 'end' 
                      ? 'border-teal-400 ring-1 ring-teal-400/20' 
                      : 'border-navy-600 hover:border-navy-500'
                    }
                    focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20
                  `}
                  whileFocus={{ scale: 1.02 }}
                />
              </div>
            </div>
          </div>
          
          {/* Time Picker Section */}
          {showTimePicker && (
            <div>
              <h3 className="text-sm font-medium text-navy-100 mb-3 flex items-center">
                <Clock size={16} className="mr-2" />
                Time Selection
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-time-input" className="block text-xs text-navy-400 mb-1">Start Time</label>
                  <motion.input
                    id="start-time-input"
                    type="time"
                    value={value.startTime || ''}
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                    onFocus={() => setFocusedInput('startTime')}
                    onBlur={() => setFocusedInput(null)}
                    className={`
                      w-full px-3 py-2 rounded-lg border transition-all duration-200
                      bg-navy-800/50 text-navy-100 text-sm
                      ${focusedInput === 'startTime' 
                        ? 'border-teal-400 ring-1 ring-teal-400/20' 
                        : 'border-navy-600 hover:border-navy-500'
                      }
                      focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20
                    `}
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>
                
                <div>
                  <label htmlFor="end-time-input" className="block text-xs text-navy-400 mb-1">End Time</label>
                  <motion.input
                    id="end-time-input"
                    type="time"
                    value={value.endTime || ''}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                    onFocus={() => setFocusedInput('endTime')}
                    onBlur={() => setFocusedInput(null)}
                    className={`
                      w-full px-3 py-2 rounded-lg border transition-all duration-200
                      bg-navy-800/50 text-navy-100 text-sm
                      ${focusedInput === 'endTime' 
                        ? 'border-teal-400 ring-1 ring-teal-400/20' 
                        : 'border-navy-600 hover:border-navy-500'
                      }
                      focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20
                    `}
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Duration Display */}
          {hasValidRange && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-teal-400/10 rounded-lg border border-teal-400/20"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-teal-300">Duration:</span>
                <span className="font-semibold text-teal-100">{getDuration()}</span>
              </div>
            </motion.div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-navy-700">
            <AnimatedButton
              variant="ghost"
              size="sm"
              onClick={handleDropdownClose}
              particles={false}
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              size="sm"
              onClick={handleDropdownClose}
              disabled={!hasValidRange}
              particles={false}
            >
              Apply Dates
            </AnimatedButton>
          </div>
        </div>
      </PortalDropdown>
    </div>
  );
};

export default DateRangePicker;