"use client";

import { useState, useEffect, useRef } from "react";
import { announceToScreenReader, generateId } from "@/lib/accessibility";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  GripVertical, 
  Lock, 
  Unlock,
  Star,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  name: string;
  description: string;
  location: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  duration: number; // minutes
  cost: {
    amount: number;
    currency: string;
    priceRange: "free" | "budget" | "moderate" | "expensive";
  };
  category: string;
  rating?: number;
  openingHours?: string;
  isLocked: boolean;
  timeSlot: {
    start: string; // HH:MM format
    end: string;
  };
}

interface DayPlan {
  date: string;
  activities: Activity[];
}

interface TripTimelineProps {
  days: DayPlan[];
  onUpdateDays: (days: DayPlan[]) => void;
  isEditable?: boolean;
  onActivityHover?: (activityId: string | null) => void;
  activeDay?: number;
  onDayChange?: (dayIndex: number) => void;
}

function SortableActivity({ 
  activity, 
  onToggleLock, 
  isEditable,
  onActivityHover
}: { 
  activity: Activity; 
  onToggleLock: (id: string) => void;
  isEditable: boolean;
  onActivityHover?: (activityId: string | null) => void;
}) {
  const activityRef = useRef<HTMLDivElement>(null);
  const dragHandleId = useRef(generateId('drag-handle'));
  const lockButtonId = useRef(generateId('lock-btn'));
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: activity.id,
    disabled: !isEditable || activity.isLocked
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriceRangeColor = (range: string) => {
    switch (range) {
      case "free": return "bg-green-100 text-green-800";
      case "budget": return "bg-blue-100 text-blue-800";
      case "moderate": return "bg-yellow-100 text-yellow-800";
      case "expensive": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleLockToggle = () => {
    onToggleLock(activity.id);
    const newStatus = activity.isLocked ? "unlocked" : "locked";
    announceToScreenReader(`${activity.name} ${newStatus}`);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Handle accessibility keyboard interactions
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target === activityRef.current) {
        e.preventDefault();
        // Focus on first interactive element
        const firstButton = activityRef.current?.querySelector('button');
        firstButton?.focus();
      }
    }
  };

  useEffect(() => {
    const element = activityRef.current;
    if (element) {
      element.addEventListener('keydown', handleKeyDown as any);
      return () => element.removeEventListener('keydown', handleKeyDown as any);
    }
  }, []);

  return (
    <Card 
      ref={(node) => {
        setNodeRef(node);
        if (node) {
          (activityRef as any).current = node;
        }
      }}
      style={style}
      className={cn(
        "transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20",
        isDragging && "opacity-50 scale-105 shadow-lg",
        activity.isLocked && "border-amber-200 bg-amber-50/50"
      )}
      role="listitem"
      tabIndex={0}
      aria-label={`Activity: ${activity.name} from ${activity.timeSlot.start} to ${activity.timeSlot.end}`}
      onMouseEnter={() => onActivityHover?.(activity.id)}
      onMouseLeave={() => onActivityHover?.(null)}
      onFocus={() => onActivityHover?.(activity.id)}
      onBlur={() => onActivityHover?.(null)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          {isEditable && !activity.isLocked && (
            <div 
              id={dragHandleId.current}
              className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
              role="button"
              tabIndex={0}
              aria-label={`Drag to reorder ${activity.name}`}
              aria-describedby={`${activity.id}-description`}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          
          {/* Time */}
          <div className="flex-shrink-0 text-right min-w-[60px]" aria-label={`Time: ${activity.timeSlot.start} to ${activity.timeSlot.end}`}>
            <div className="text-sm font-medium">{activity.timeSlot.start}</div>
            <div className="text-xs text-muted-foreground">{activity.timeSlot.end}</div>
          </div>
          
          {/* Content */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-grow min-w-0">
                <h4 className="font-medium leading-none mb-1 truncate">{activity.name}</h4>
                <p 
                  id={`${activity.id}-description`}
                  className="text-sm text-muted-foreground mb-2 line-clamp-2"
                >
                  {activity.description}
                </p>
                
                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  <span className="truncate">{activity.location.name}</span>
                </div>
                
                {/* Meta information */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {activity.category}
                  </Badge>
                  
                  <Badge 
                    className={cn("text-xs", getPriceRangeColor(activity.cost.priceRange))}
                    aria-label={`Cost: ${activity.cost.amount > 0 ? `$${activity.cost.amount}` : "Free"}`}
                  >
                    {activity.cost.amount > 0 ? `$${activity.cost.amount}` : "Free"}
                  </Badge>
                  
                  <div 
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                    aria-label={`Duration: ${Math.round(activity.duration / 60)} hours ${activity.duration % 60} minutes`}
                  >
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>{Math.round(activity.duration / 60)}h {activity.duration % 60}m</span>
                  </div>
                  
                  {activity.rating && (
                    <div 
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                      aria-label={`Rating: ${activity.rating} out of 5 stars`}
                    >
                      <Star className="h-3 w-3 fill-current text-yellow-400" aria-hidden="true" />
                      <span>{activity.rating}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              {isEditable && (
                <div className="flex items-center gap-1" role="group" aria-label="Activity actions">
                  <Button
                    id={lockButtonId.current}
                    variant="ghost"
                    size="sm"
                    onClick={handleLockToggle}
                    className="h-8 w-8 p-0"
                    aria-label={activity.isLocked ? `Unlock ${activity.name}` : `Lock ${activity.name}`}
                    aria-pressed={activity.isLocked}
                  >
                    {activity.isLocked ? (
                      <Lock className="h-3 w-3 text-amber-600" aria-hidden="true" />
                    ) : (
                      <Unlock className="h-3 w-3" aria-hidden="true" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label={`More options for ${activity.name}`}
                  >
                    <MoreHorizontal className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TripTimeline({ 
  days, 
  onUpdateDays, 
  isEditable = true,
  onActivityHover,
  activeDay: propActiveDay = 0,
  onDayChange
}: TripTimelineProps) {
  const [activeDay, setActiveDay] = useState(propActiveDay);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (propActiveDay !== activeDay) {
      setActiveDay(propActiveDay);
    }
  }, [propActiveDay]);

  const handleDayChange = (dayIndex: number) => {
    setActiveDay(dayIndex);
    onDayChange?.(dayIndex);
    
    // Announce day change to screen readers
    const date = new Date(days[dayIndex].date);
    const dateString = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long", 
      day: "numeric"
    });
    announceToScreenReader(`Switched to Day ${dayIndex + 1}, ${dateString}`);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const currentDay = days[activeDay];
      const oldIndex = currentDay.activities.findIndex(item => item.id === active.id);
      const newIndex = currentDay.activities.findIndex(item => item.id === over.id);

      const draggedActivity = currentDay.activities[oldIndex];
      const newActivities = arrayMove(currentDay.activities, oldIndex, newIndex);
      
      // Recalculate time slots based on new order
      const updatedActivities = recalculateTimeSlots(newActivities);
      
      const updatedDays = [...days];
      updatedDays[activeDay] = {
        ...currentDay,
        activities: updatedActivities
      };
      
      onUpdateDays(updatedDays);
      
      // Announce reorder to screen readers
      announceToScreenReader(
        `Moved ${draggedActivity.name} to position ${newIndex + 1} of ${newActivities.length}`,
        'assertive'
      );
    }
  };

  const recalculateTimeSlots = (activities: Activity[]): Activity[] => {
    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0); // Start at 9 AM
    
    return activities.map(activity => {
      if (activity.isLocked) {
        // For locked activities, parse their existing time and update currentTime
        const [hours, minutes] = activity.timeSlot.start.split(':').map(Number);
        currentTime.setHours(hours, minutes, 0, 0);
        const endTime = new Date(currentTime.getTime() + activity.duration * 60000);
        currentTime = new Date(endTime.getTime() + 30 * 60000); // 30 min buffer
        return activity;
      }
      
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + activity.duration * 60000);
      
      const updatedActivity = {
        ...activity,
        timeSlot: {
          start: startTime.toTimeString().slice(0, 5),
          end: endTime.toTimeString().slice(0, 5),
        }
      };
      
      // Add buffer time between activities
      currentTime = new Date(endTime.getTime() + 30 * 60000);
      
      return updatedActivity;
    });
  };

  const handleToggleLock = (activityId: string) => {
    const updatedDays = [...days];
    const currentDay = updatedDays[activeDay];
    const activityIndex = currentDay.activities.findIndex(a => a.id === activityId);
    
    if (activityIndex !== -1) {
      updatedDays[activeDay] = {
        ...currentDay,
        activities: currentDay.activities.map(activity => 
          activity.id === activityId 
            ? { ...activity, isLocked: !activity.isLocked }
            : activity
        )
      };
      
      onUpdateDays(updatedDays);
    }
  };

  if (!days.length) {
    return (
      <div className="text-center py-12" role="status" aria-live="polite">
        <p className="text-muted-foreground">No itinerary data available</p>
      </div>
    );
  }

  const currentDay = days[activeDay] || days[0];

  return (
    <div className="space-y-6" ref={timelineRef}>
      {/* Day Selector */}
      <div 
        className="flex gap-2 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Select day to view"
      >
        {days.map((day, index) => {
          const date = new Date(day.date);
          const isActive = index === activeDay;
          
          return (
            <Button
              key={day.date}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleDayChange(index)}
              className="flex-shrink-0"
              role="tab"
              tabIndex={isActive ? 0 : -1}
              aria-selected={isActive}
              aria-controls={`day-${index}-content`}
              id={`day-${index}-tab`}
            >
              <div className="text-center">
                <div className="font-medium">
                  Day {index + 1}
                </div>
                <div className="text-xs opacity-75">
                  {date.toLocaleDateString("en-US", { 
                    month: "short", 
                    day: "numeric" 
                  })}
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Timeline */}
      <div 
        className="space-y-4"
        role="tabpanel"
        id={`day-${activeDay}-content`}
        aria-labelledby={`day-${activeDay}-tab`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" id={`day-${activeDay}-heading`}>
            Day {activeDay + 1} - {new Date(currentDay.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long", 
              day: "numeric"
            })}
          </h3>
          
          <div 
            className="flex items-center gap-2 text-sm text-muted-foreground"
            aria-label={`${currentDay.activities.length} activities, ${Math.round(
              currentDay.activities.reduce((total, activity) => total + activity.duration, 0) / 60
            )} hours total duration`}
          >
            <span>{currentDay.activities.length} activities</span>
            <span>•</span>
            <span>
              {Math.round(
                currentDay.activities.reduce((total, activity) => total + activity.duration, 0) / 60
              )}h total
            </span>
          </div>
        </div>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements: {
              onDragStart(id) {
                const activity = currentDay.activities.find(a => a.id === id);
                return `Started dragging ${activity?.name}`;
              },
              onDragOver(id, overId) {
                const activity = currentDay.activities.find(a => a.id === id);
                return `${activity?.name} is over a droppable area`;
              },
              onDragEnd(id, overId) {
                const activity = currentDay.activities.find(a => a.id === id);
                return overId ? `${activity?.name} was dropped` : `${activity?.name} was dropped outside of a droppable area`;
              },
              onDragCancel(id) {
                const activity = currentDay.activities.find(a => a.id === id);
                return `Dragging ${activity?.name} was cancelled`;
              },
            },
          }}
        >
          <SortableContext 
            items={currentDay.activities.map(a => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div 
              className="space-y-3"
              role="list"
              aria-labelledby={`day-${activeDay}-heading`}
              aria-describedby={`day-${activeDay}-description`}
            >
              <div 
                id={`day-${activeDay}-description`} 
                className="sr-only"
              >
                Activities for day {activeDay + 1}. {isEditable ? 'Use arrow keys to reorder when dragging, or tab to interactive elements.' : ''}
              </div>
              
              {currentDay.activities.map((activity) => (
                <SortableActivity
                  key={activity.id}
                  activity={activity}
                  onToggleLock={handleToggleLock}
                  isEditable={isEditable}
                  onActivityHover={onActivityHover}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        {currentDay.activities.length === 0 && (
          <div 
            className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg"
            role="status"
            aria-live="polite"
          >
            <p className="text-muted-foreground">No activities planned for this day</p>
            {isEditable && (
              <Button variant="outline" className="mt-4">
                Add Activity
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}