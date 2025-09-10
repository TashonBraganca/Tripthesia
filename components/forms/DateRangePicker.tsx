'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { AnimatedButton } from '@/components/effects/AnimatedButton';
import { InteractiveCard } from '@/components/effects/InteractiveCard';
import { trackDateRangeSet } from '@/lib/analytics/events';
import { PortalDropdown, useDropdown } from '@/components/ui/portal-dropdown';
import { ShadCNDatePicker } from '@/components/forms/ShadCNDatePicker';

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

  // Handle dropdown close
  const handleDropdownClose = () => {
    dropdown.close();
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


  const formatDateForDisplay = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateStr);
        return '';
      }
      
      // Use shorter format for mobile screens
      const isMobile = window.innerWidth < 640;
      let formatted = date.toLocaleDateString('en-US', { 
        month: isMobile ? 'short' : 'short', 
        day: 'numeric',
        year: isMobile ? '2-digit' : 'numeric'
      });
      
      if (showTimePicker && timeStr) {
        formatted += ` at ${formatTime(timeStr)}`;
      }
      
      return formatted;
    } catch (error) {
      console.warn('Error formatting date:', error);
      return '';
    }
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
              relative cursor-pointer px-4 py-2.5 h-11 rounded-xl border transition-all duration-200 w-full text-left
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
        <div className="p-4 space-y-4">
          {/* Presets */}
          <div>
            <h3 className="text-sm font-medium text-navy-100 mb-2">Quick Select</h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3">
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
          
          {/* ShadCN Calendar Integration */}
          <div>
            <h3 className="text-sm font-medium text-navy-100 mb-2">Select Dates</h3>
            <ShadCNDatePicker
              value={value}
              onChange={onChange}
              showTimePicker={showTimePicker}
              minDate={minDate ? new Date(minDate) : undefined}
              maxDate={maxDate ? new Date(maxDate) : undefined}
              placeholder={placeholder}
              required={required}
            />
          </div>
          
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