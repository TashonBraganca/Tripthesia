'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Clock, Calendar, Loader2, GripVertical } from 'lucide-react';

// Dynamic import with loading component
const TimelineBuilder = dynamic(() => import('./TimelineBuilder'), {
  loading: () => <TimelineBuilderSkeleton />,
  ssr: false // Interactive components require client-side APIs
});

interface TimelineBuilderLazyProps {
  dayPlan: any;
  onUpdateDayPlan: (dayPlan: any) => void;
  onAddActivity: () => void;
  isEditable?: boolean;
}

// Loading skeleton component
function TimelineBuilderSkeleton() {
  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/5 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/20">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-500/30 rounded-lg animate-pulse flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <div className="h-6 bg-indigo-400/30 rounded w-44 mb-2 animate-pulse"></div>
              <div className="h-4 bg-indigo-300/20 rounded w-56 animate-pulse"></div>
            </div>
          </div>
          
          {/* Timeline controls skeleton */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg animate-pulse"></div>
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg animate-pulse"></div>
            <div className="w-24 h-10 bg-indigo-500/20 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Day tabs skeleton */}
        <div className="flex space-x-2 mb-6 pb-4 border-b border-indigo-500/20">
          {[1, 2, 3, 4].map(day => (
            <div key={day} className="flex items-center space-x-2 px-4 py-2 bg-indigo-500/10 rounded-lg animate-pulse">
              <Calendar className="w-4 h-4 text-indigo-300" />
              <div className="h-4 bg-indigo-300/30 rounded w-12 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Timeline content skeleton */}
        <div className="space-y-4">
          {/* Time slots skeleton */}
          {['09:00', '12:00', '15:00', '18:00', '21:00'].map((time, index) => (
            <div key={time} className="flex items-start space-x-4">
              {/* Time indicator */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-6 bg-indigo-400/30 rounded text-center animate-pulse"></div>
                <div className="w-px h-16 bg-indigo-500/30 mt-2"></div>
              </div>
              
              {/* Activity card skeleton */}
              <div className="flex-1">
                <div className="bg-navy-800/30 rounded-xl p-4 border border-indigo-500/20 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GripVertical className="w-4 h-4 text-indigo-300/50" />
                      <div>
                        <div className="h-5 bg-indigo-300/30 rounded w-32 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-indigo-200/20 rounded w-48 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-indigo-500/20 rounded animate-pulse"></div>
                      <div className="h-4 bg-indigo-300/20 rounded w-12 animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Tags skeleton */}
                  <div className="flex space-x-2 mt-3">
                    <div className="h-6 w-16 bg-indigo-500/15 rounded-full animate-pulse"></div>
                    <div className="h-6 w-20 bg-indigo-500/15 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add activity button skeleton */}
        <div className="pt-6 mt-6 border-t border-indigo-500/20">
          <div className="h-12 bg-gradient-to-r from-indigo-500/30 to-violet-500/30 rounded-xl animate-pulse flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-300" />
            <span className="ml-2 text-indigo-200">Loading Timeline Builder...</span>
          </div>
        </div>

        {/* Drag indicator */}
        <div className="absolute top-6 right-6">
          <div className="flex flex-col space-y-1">
            <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const TimelineBuilderLazy: React.FC<TimelineBuilderLazyProps> = (props) => {
  return (
    <Suspense fallback={<TimelineBuilderSkeleton />}>
      <TimelineBuilder {...props} />
    </Suspense>
  );
};

export default TimelineBuilderLazy;