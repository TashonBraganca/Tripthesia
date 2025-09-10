'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, CalendarDays } from 'lucide-react';
import type { DateRange as ReactDayPickerDateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRange {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
}

interface ShadCNDatePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  placeholder?: string;
  showTimePicker?: boolean;
  required?: boolean;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
}

export const ShadCNDatePicker: React.FC<ShadCNDatePickerProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Select travel dates',
  showTimePicker = false,
  required = false,
  label,
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: value.startDate ? new Date(value.startDate) : undefined,
    to: value.endDate ? new Date(value.endDate) : undefined
  });

  // Debug state for development
  const debugState = () => {
    console.log('ShadCNDatePicker Debug:', {
      isOpen,
      selectedRange,
      value,
      hasValue: !!(value.startDate && value.endDate)
    });
  };

  // Update local state when prop changes
  useEffect(() => {
    setSelectedRange({
      from: value.startDate ? new Date(value.startDate) : undefined,
      to: value.endDate ? new Date(value.endDate) : undefined
    });
  }, [value.startDate, value.endDate]);

  const handleDateSelect = (selected: ReactDayPickerDateRange | undefined) => {
    if (!selected) return;
    
    const range = {
      from: selected.from,
      to: selected.to
    };

    setSelectedRange(range);

    // Convert dates to ISO strings and call onChange
    const newRange: DateRange = {
      startDate: range.from ? range.from.toISOString().split('T')[0] : '',
      endDate: range.to ? range.to.toISOString().split('T')[0] : range.from ? range.from.toISOString().split('T')[0] : '',
      startTime: value.startTime,
      endTime: value.endTime
    };

    onChange(newRange);

    // Close popover when both dates are selected
    if (range.from && range.to) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (type: 'startTime' | 'endTime', time: string) => {
    const newRange: DateRange = {
      ...value,
      [type]: time
    };
    onChange(newRange);
  };

  const formatDateRange = () => {
    if (!selectedRange.from) return placeholder;
    
    if (!selectedRange.to) {
      return format(selectedRange.from, 'MMM dd, yyyy');
    }

    if (selectedRange.from.getTime() === selectedRange.to.getTime()) {
      return format(selectedRange.from, 'MMM dd, yyyy');
    }

    return `${format(selectedRange.from, 'MMM dd')} - ${format(selectedRange.to, 'MMM dd, yyyy')}`;
  };

  const getDuration = () => {
    if (!selectedRange.from || !selectedRange.to) return null;
    
    const diffTime = Math.abs(selectedRange.to.getTime() - selectedRange.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    
    return diffDays;
  };

  const duration = getDuration();

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-navy-200">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <Popover open={isOpen} onOpenChange={(open) => {
        console.log('Popover state change:', open);
        setIsOpen(open);
      }}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              debugState();
              console.log('Date picker button clicked, current state:', isOpen);
              setIsOpen(!isOpen);
            }}
            className={cn(
              'w-full justify-start text-left font-normal h-12 bg-navy-800/60 border-navy-600 hover:bg-navy-700/80 hover:border-navy-500 text-navy-100 cursor-pointer',
              !selectedRange.from && 'text-navy-400'
            )}
          >
            <Calendar className="mr-2 h-4 w-4 text-teal-400" />
            {formatDateRange()}
            {duration && (
              <span className="ml-auto text-xs text-navy-400 bg-navy-700 px-2 py-1 rounded">
                {duration} day{duration > 1 ? 's' : ''}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0 bg-navy-800 border-navy-600" align="start">
          <div className="p-4 space-y-4">
            {/* Calendar */}
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={selectedRange.from}
              selected={selectedRange}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (date < today) return true;
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                
                return false;
              }}
              className="rounded-md"
            />

            {/* Time Pickers */}
            {showTimePicker && selectedRange.from && (
              <div className="border-t border-navy-600 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* Start Time */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-navy-300">
                      Departure Time
                    </label>
                    <input
                      type="time"
                      value={value.startTime || '09:00'}
                      onChange={(e) => handleTimeChange('startTime', e.target.value)}
                      className="w-full px-3 py-2 bg-navy-700 border border-navy-600 rounded-md text-navy-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    />
                  </div>

                  {/* End Time */}
                  {selectedRange.to && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-navy-300">
                        Return Time
                      </label>
                      <input
                        type="time"
                        value={value.endTime || '18:00'}
                        onChange={(e) => handleTimeChange('endTime', e.target.value)}
                        className="w-full px-3 py-2 bg-navy-700 border border-navy-600 rounded-md text-navy-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="border-t border-navy-600 pt-4">
              <div className="text-xs font-medium text-navy-300 mb-2">Quick Select</div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: 'Weekend', days: 2 },
                  { label: '1 Week', days: 7 },
                  { label: '2 Weeks', days: 14 },
                  { label: '1 Month', days: 30 }
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 px-2 text-navy-400 hover:text-navy-100 hover:bg-navy-700"
                    onClick={() => {
                      const today = new Date();
                      const endDate = new Date(today);
                      endDate.setDate(today.getDate() + preset.days - 1);
                      
                      handleDateSelect({
                        from: today,
                        to: endDate
                      });
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Helper Text */}
      {selectedRange.from && selectedRange.to && (
        <div className="text-xs text-navy-400 flex items-center gap-2">
          <CalendarDays size={12} />
          <span>
            {duration} day{duration && duration > 1 ? 's' : ''} selected
            {showTimePicker && value.startTime && value.endTime && (
              <span className="ml-2">
                • {value.startTime} - {value.endTime}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default ShadCNDatePicker;