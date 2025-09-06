'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Map, Navigation, Loader2, MapPin } from 'lucide-react';

// Dynamic import with loading component
const InteractiveMapPlanner = dynamic(() => import('./InteractiveMapPlanner'), {
  loading: () => <InteractiveMapPlannerSkeleton />,
  ssr: false // Map components require client-side APIs
});

interface InteractiveMapPlannerLazyProps {
  tripData?: any;
  onRouteUpdate?: (route: any) => void;
  waypoints?: any[];
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

// Loading skeleton component
function InteractiveMapPlannerSkeleton() {
  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm rounded-2xl border border-blue-500/20 overflow-hidden">
        {/* Header skeleton */}
        <div className="flex items-center justify-between p-6 border-b border-blue-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500/30 rounded-lg animate-pulse flex items-center justify-center">
              <Map className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <div className="h-6 bg-blue-400/30 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-blue-300/20 rounded w-64 animate-pulse"></div>
            </div>
          </div>
          
          {/* Controls skeleton */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg animate-pulse"></div>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg animate-pulse"></div>
            <div className="w-24 h-10 bg-blue-500/20 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Map area skeleton */}
        <div className="relative h-96 bg-gradient-to-br from-blue-900/20 to-navy-900/40 animate-pulse">
          {/* Center loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-300" />
                <span className="text-blue-200 font-medium">Loading Interactive Map...</span>
                <span className="text-blue-300/70 text-sm">Initializing Google Maps API</span>
              </div>
            </div>
          </div>

          {/* Simulated map pins */}
          <div className="absolute top-1/4 left-1/3">
            <div className="w-6 h-6 bg-red-500/40 rounded-full animate-bounce flex items-center justify-center">
              <MapPin className="w-3 h-3 text-red-300" />
            </div>
          </div>
          <div className="absolute top-1/2 right-1/4">
            <div className="w-6 h-6 bg-green-500/40 rounded-full animate-bounce flex items-center justify-center" style={{animationDelay: '0.5s'}}>
              <MapPin className="w-3 h-3 text-green-300" />
            </div>
          </div>
          <div className="absolute bottom-1/3 left-1/2">
            <div className="w-6 h-6 bg-blue-500/40 rounded-full animate-bounce flex items-center justify-center" style={{animationDelay: '1s'}}>
              <MapPin className="w-3 h-3 text-blue-300" />
            </div>
          </div>

          {/* Route line simulation */}
          <svg className="absolute inset-0 w-full h-full opacity-30">
            <path
              d="M 33% 25% Q 45% 35% 75% 50% T 50% 67%"
              stroke="url(#routeGradient)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="5,5"
              className="animate-pulse"
            />
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Sidebar skeleton */}
        <div className="p-6 border-t border-blue-500/20">
          <div className="flex items-center space-x-3 mb-4">
            <Navigation className="w-5 h-5 text-blue-300" />
            <div className="h-5 bg-blue-400/30 rounded w-32 animate-pulse"></div>
          </div>
          
          {/* Route points skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-navy-800/20 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-blue-300/20 rounded w-3/4 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-blue-200/15 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="text-right">
                  <div className="h-3 bg-blue-300/20 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading indicator */}
        <div className="absolute top-4 right-4">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export const InteractiveMapPlannerLazy: React.FC<InteractiveMapPlannerLazyProps> = (props) => {
  return (
    <Suspense fallback={<InteractiveMapPlannerSkeleton />}>
      <InteractiveMapPlanner {...props} />
    </Suspense>
  );
};

export default InteractiveMapPlannerLazy;