'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { AnimatedButton } from '@/components/effects/AnimatedButton';
import { InteractiveCard } from '@/components/effects/InteractiveCard';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
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
    label: 'This Weekend',
    description: '2-3 days',
    icon: MapPin,
    getDates: () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + (6 - dayOfWeek));
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      
      return {
        startDate: saturday.toISOString().split('T')[0],
        endDate: sunday.toISOString().split('T')[0]
      };
    }
  },
  {
    id: 'week',
    label: 'Next Week',
    description: '7 days',
    icon: Calendar,
    getDates: () => {
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      const endDate = new Date(nextWeek);
      endDate.setDate(nextWeek.getDate() + 6);
      
      return {
        startDate: nextWeek.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
    }
  },
  {
    id: 'month',
    label: 'Next Month',
    description: '4 weeks',
    icon: Clock,
    getDates: () => {
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1);
      nextMonth.setDate(1);
      const endDate = new Date(nextMonth);
      endDate.setMonth(nextMonth.getMonth() + 1);
      endDate.setDate(0);
      
      return {
        startDate: nextMonth.toISOString().split('T')[0],
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
  placeholder = 'Select travel dates'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<'start' | 'end' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedInput(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = (preset: Preset) => {
    const dates = preset.getDates();
    onChange(dates);
    setSelectedPreset(preset.id);
    setIsOpen(false);
  };

  const handleDateChange = (field: 'start' | 'end', date: string) => {
    const newRange = {
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
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
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
    <div ref={containerRef} className={`relative ${className}`}>
      <label className="block text-sm font-medium text-navy-100 mb-2">
        Travel Dates <span className="text-teal-400">*</span>
      </label>
      
      {/* Main Input Display */}
      <motion.div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative cursor-pointer p-3 rounded-xl border transition-all duration-200
          ${isOpen 
            ? 'border-teal-400 ring-2 ring-teal-400/20 bg-navy-800/50' 
            : 'border-navy-600 hover:border-navy-500 bg-navy-800/30'
          }
          ${hasValidRange ? 'text-navy-100' : 'text-navy-400'}
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-teal-400" />
            <div>
              {hasValidRange ? (
                <div>
                  <span className="font-medium">
                    {formatDateForDisplay(value.startDate)} - {formatDateForDisplay(value.endDate)}
                  </span>
                  <div className="text-sm text-navy-400 mt-1">
                    {getDuration()}
                  </div>
                </div>
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-navy-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <InteractiveCard
              variant="glass"
              particles={false}
              className="p-6 bg-navy-800/95 backdrop-blur-md border-navy-600"
            >
              <div className="space-y-6">
                {/* Presets */}
                <div>
                  <h3 className="text-sm font-medium text-navy-100 mb-3">Quick Select</h3>
                  <div className="grid grid-cols-3 gap-2">
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
                      <label className="block text-xs text-navy-400 mb-1">Start Date</label>
                      <motion.input
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
                      <label className="block text-xs text-navy-400 mb-1">End Date</label>
                      <motion.input
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
                    onClick={() => setIsOpen(false)}
                    particles={false}
                  >
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton
                    variant="primary"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    disabled={!hasValidRange}
                    particles={false}
                  >
                    Apply Dates
                  </AnimatedButton>
                </div>
              </div>
            </InteractiveCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangePicker;