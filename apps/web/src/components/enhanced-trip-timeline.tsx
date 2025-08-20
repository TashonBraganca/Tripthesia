"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { announceToScreenReader, generateId } from "@/lib/accessibility";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
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
  MoreHorizontal,
  Plus,
  RefreshCw,
  Zap,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  cardHoverVariants,
  dragVariants,
  springTransition
} from "@/lib/motion";

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
  weatherDependent?: boolean;
  bookingRequired?: boolean;
}

interface DayPlan {
  date: string;
  activities: Activity[];
}

interface EnhancedTripTimelineProps {
  days: DayPlan[];
  onUpdateDays: (days: DayPlan[]) => void;
  isEditable?: boolean;
  onActivityHover?: (activityId: string | null) => void;
  activeDay?: number;
  onDayChange?: (dayIndex: number) => void;
  isReflowing?: boolean;
  onReflow?: () => void;
  onAddActivity?: () => void;
}

function EnhancedSortableActivity({ 
  activity, 
  onToggleLock, 
  isEditable,
  onActivityHover,
  dragOverlay = false
}: { 
  activity: Activity; 
  onToggleLock: (id: string) => void;
  isEditable: boolean;
  onActivityHover?: (activityId: string | null) => void;
  dragOverlay?: boolean;
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
    disabled: !isEditable || activity.isLocked || dragOverlay
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  };

  const getPriceRangeColor = (range: string) => {
    switch (range) {
      case "free": return "bg-green-100 text-green-800 border-green-200";
      case "budget": return "bg-blue-100 text-blue-800 border-blue-200";
      case "moderate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "expensive": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleLockToggle = () => {
    onToggleLock(activity.id);
    const newStatus = activity.isLocked ? "unlocked" : "locked";
    announceToScreenReader(`${activity.name} ${newStatus}`);
  };

  return (
    <motion.div
      ref={!dragOverlay ? setNodeRef : undefined}
      style={!dragOverlay ? style : undefined}
      variants={dragOverlay ? {} : itemVariants}
      layout
      layoutId={activity.id}
      whileHover={!isDragging ? "hover" : undefined}
      className={cn(dragOverlay && "cursor-grabbing")}
    >
      <motion.div variants={cardHoverVariants}>
        <Card 
          className={cn(
            "transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 border border-border/50 hover:border-border group",
            isDragging && "opacity-50 rotate-2 shadow-xl border-primary/50",
            activity.isLocked && "border-amber-200 bg-amber-50/30 shadow-amber-100/50",
            dragOverlay && "rotate-2 shadow-2xl scale-105 border-primary"
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
              {isEditable && !dragOverlay && (
                <motion.div 
                  id={dragHandleId.current}
                  className={cn(
                    "flex-shrink-0 mt-1 transition-all duration-200 rounded p-1",
                    activity.isLocked 
                      ? "text-muted-foreground/50 cursor-not-allowed" 
                      : "cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  )}
                  role="button"
                  tabIndex={activity.isLocked ? -1 : 0}
                  aria-label={activity.isLocked ? `${activity.name} is locked` : `Drag to reorder ${activity.name}`}
                  aria-describedby={`${activity.id}-description`}
                  {...(!activity.isLocked ? attributes : {})}
                  {...(!activity.isLocked ? listeners : {})}
                  whileHover={!activity.isLocked ? { scale: 1.1 } : undefined}
                  whileTap={!activity.isLocked ? { scale: 0.95 } : undefined}
                >
                  <GripVertical className="h-4 w-4" />
                </motion.div>
              )}
              
              {/* Time Column */}
              <div className="flex-shrink-0 text-right min-w-[70px]" aria-label={`Time: ${activity.timeSlot.start} to ${activity.timeSlot.end}`}>
                <motion.div 
                  className={cn(
                    "text-sm font-mono font-semibold px-2 py-1 rounded-md border",
                    activity.isLocked ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-muted/50 border-border"
                  )}
                  layoutId={`${activity.id}-time`}
                >
                  {activity.timeSlot.start}
                </motion.div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">
                  {activity.timeSlot.end}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-grow min-w-0">
                    {/* Activity Title */}
                    <motion.div
                      className="flex items-center gap-2 mb-1"
                      layoutId={`${activity.id}-title`}
                    >
                      <h4 className="font-semibold leading-none truncate">{activity.name}</h4>
                      {activity.isLocked && (
                        <motion.div
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="text-amber-600"
                          title="This activity is locked in place"
                        >
                          <Lock className="h-3 w-3" />
                        </motion.div>
                      )}
                    </motion.div>
                    
                    <motion.p 
                      id={`${activity.id}-description`}
                      className="text-sm text-muted-foreground mb-3 line-clamp-2"
                      layoutId={`${activity.id}-description`}
                    >
                      {activity.description}
                    </motion.p>
                    
                    {/* Location */}
                    <motion.div 
                      className="flex items-center gap-1 text-xs text-muted-foreground mb-3"
                      layoutId={`${activity.id}-location`}
                    >
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      <span className="truncate">{activity.location.name}</span>
                    </motion.div>
                    
                    {/* Metadata badges */}
                    <motion.div 
                      className="flex items-center gap-2 flex-wrap"
                      layoutId={`${activity.id}-metadata`}
                    >
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Badge variant="secondary" className="text-xs font-medium">
                          {activity.category}
                        </Badge>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Badge 
                          className={cn("text-xs font-medium border", getPriceRangeColor(activity.cost.priceRange))}
                          aria-label={`Cost: ${activity.cost.amount > 0 ? `$${activity.cost.amount}` : "Free"}`}
                        >
                          {activity.cost.amount > 0 ? `$${activity.cost.amount}` : "Free"}
                        </Badge>
                      </motion.div>
                      
                      <div 
                        className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md"
                        aria-label={`Duration: ${Math.floor(activity.duration / 60)} hours ${activity.duration % 60} minutes`}
                      >
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        <span className="font-mono">
                          {Math.floor(activity.duration / 60)}h {activity.duration % 60}m
                        </span>
                      </div>
                      
                      {activity.rating && (
                        <div 
                          className="flex items-center gap-1 text-xs bg-muted/50 px-2 py-1 rounded-md"
                          aria-label={`Rating: ${activity.rating} out of 5 stars`}
                        >
                          <Star className="h-3 w-3 fill-current text-yellow-500" aria-hidden="true" />
                          <span className="font-medium">{activity.rating}</span>
                        </div>
                      )}

                      {/* Additional indicators */}
                      {activity.weatherDependent && (
                        <Badge variant="outline" className="text-xs" title="Weather dependent activity">
                          🌦️
                        </Badge>
                      )}
                      
                      {activity.bookingRequired && (
                        <Badge variant="outline" className="text-xs" title="Booking required">
                          📅
                        </Badge>
                      )}
                    </motion.div>
                  </div>
                  
                  {/* Actions */}
                  {isEditable && !dragOverlay && (
                    <motion.div 
                      className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity" 
                      role="group" 
                      aria-label="Activity actions"
                    >
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          id={lockButtonId.current}
                          variant="ghost"
                          size="sm"
                          onClick={handleLockToggle}
                          className="h-8 w-8 p-0 hover:bg-muted/80"
                          aria-label={activity.isLocked ? `Unlock ${activity.name}` : `Lock ${activity.name}`}
                          aria-pressed={activity.isLocked}
                        >
                          <motion.div
                            animate={{ rotate: activity.isLocked ? 0 : 0 }}
                            transition={springTransition.light}
                          >
                            {activity.isLocked ? (
                              <Lock className="h-3 w-3 text-amber-600" aria-hidden="true" />
                            ) : (
                              <Unlock className="h-3 w-3" aria-hidden="true" />
                            )}
                          </motion.div>
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted/80"
                          aria-label={`More options for ${activity.name}`}
                        >
                          <MoreHorizontal className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function EnhancedTripTimeline({ 
  days, 
  onUpdateDays, 
  isEditable = true,
  onActivityHover,
  activeDay: propActiveDay = 0,
  onDayChange,
  isReflowing = false,
  onReflow,
  onAddActivity
}: EnhancedTripTimelineProps) {
  const [activeDay, setActiveDay] = useState(propActiveDay);
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const currentDay = days[activeDay];
    const activity = currentDay.activities.find(a => a.id === active.id);
    setDraggedActivity(activity || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedActivity(null);

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
      <motion.div 
        className="text-center py-12" 
        role="status" 
        aria-live="polite"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-muted-foreground">No itinerary data available</p>
      </motion.div>
    );
  }

  const currentDay = days[activeDay] || days[0];
  const totalDuration = Math.round(currentDay.activities.reduce((total, activity) => total + activity.duration, 0) / 60);
  const totalCost = currentDay.activities.reduce((total, activity) => total + activity.cost.amount, 0);

  return (
    <div className="space-y-6" ref={timelineRef}>
      {/* Day Selector */}
      <motion.div 
        className="flex gap-2 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Select day to view"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {days.map((day, index) => {
          const date = new Date(day.date);
          const isActive = index === activeDay;
          
          return (
            <motion.div key={day.date} variants={itemVariants}>
              <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleDayChange(index)}
                className="flex-shrink-0 min-w-[100px] transition-all duration-200"
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-controls={`day-${index}-content`}
                id={`day-${index}-tab`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
            </motion.div>
          );
        })}
      </motion.div>

      {/* Timeline */}
      <motion.div 
        className="space-y-6"
        role="tabpanel"
        id={`day-${activeDay}-content`}
        aria-labelledby={`day-${activeDay}-tab`}
        layout
      >
        {/* Day Header */}
        <motion.div 
          className="flex items-center justify-between"
          layoutId={`day-${activeDay}-header`}
        >
          <div>
            <h3 className="text-xl font-semibold" id={`day-${activeDay}-heading`}>
              Day {activeDay + 1} - {new Date(currentDay.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long", 
                day: "numeric"
              })}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span>{currentDay.activities.length} activities</span>
              <span>•</span>
              <span>{totalDuration}h total</span>
              {totalCost > 0 && (
                <>
                  <span>•</span>
                  <span>${totalCost} estimated cost</span>
                </>
              )}
            </div>
          </div>
          
          {/* Day Actions */}
          <div className="flex items-center gap-2">
            {onReflow && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReflow}
                  disabled={isReflowing}
                  className="gap-2"
                >
                  <motion.div
                    animate={{ rotate: isReflowing ? 360 : 0 }}
                    transition={{ 
                      duration: isReflowing ? 1 : 0,
                      repeat: isReflowing ? Infinity : 0,
                      ease: "linear"
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                  {isReflowing ? "Optimizing..." : "Reflow"}
                </Button>
              </motion.div>
            )}
            
            {onAddActivity && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddActivity}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Activity
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Activities List */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
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
            <motion.div 
              className="space-y-4"
              role="list"
              aria-labelledby={`day-${activeDay}-heading`}
              aria-describedby={`day-${activeDay}-description`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              layout
            >
              <div 
                id={`day-${activeDay}-description`} 
                className="sr-only"
              >
                Activities for day {activeDay + 1}. {isEditable ? 'Use arrow keys to reorder when dragging, or tab to interactive elements.' : ''}
              </div>
              
              <AnimatePresence mode="popLayout">
                {currentDay.activities.map((activity) => (
                  <EnhancedSortableActivity
                    key={activity.id}
                    activity={activity}
                    onToggleLock={handleToggleLock}
                    isEditable={isEditable}
                    onActivityHover={onActivityHover}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </SortableContext>
          
          {/* Drag Overlay */}
          <DragOverlay dropAnimation={null}>
            {draggedActivity ? (
              <EnhancedSortableActivity
                activity={draggedActivity}
                onToggleLock={handleToggleLock}
                isEditable={isEditable}
                dragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
        
        {/* Empty State */}
        {currentDay.activities.length === 0 && (
          <motion.div 
            className="text-center py-16 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springTransition.medium}
          >
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No activities planned for this day</p>
              <p className="text-sm text-muted-foreground mb-6">Start building your perfect itinerary</p>
              {isEditable && onAddActivity && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button onClick={onAddActivity} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Activity
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}