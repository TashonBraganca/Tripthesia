'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { LocationData } from '@/lib/data/locations';

// Dynamic import with loading component
const LocationAutocomplete = dynamic(() => import('./LocationAutocomplete').then(mod => ({ default: mod.LocationAutocomplete })), {
  loading: () => <LocationAutocompleteSkeleton />,
  ssr: true // Location autocomplete can be server-rendered
});

interface LocationAutocompleteLazyProps {
  id?: string;
  variant?: 'departure' | 'destination' | 'waypoint';
  value?: LocationData | null;
  onChange: (location: LocationData | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  maxSuggestions?: number;
  showCurrentLocation?: boolean;
  showNearbyLocations?: boolean;
}

// Loading skeleton component
function LocationAutocompleteSkeleton() {
  return (
    <div className="relative">
      <div className="flex items-center w-full px-4 py-3 bg-navy-800/50 border border-navy-600/30 rounded-xl backdrop-blur-sm animate-pulse">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-5 h-5 bg-teal-500/30 rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-navy-600 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-navy-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="w-4 h-4 bg-navy-600 rounded ml-3"></div>
      </div>
    </div>
  );
}

export const LocationAutocompleteLazy: React.FC<LocationAutocompleteLazyProps> = (props) => {
  return (
    <Suspense fallback={<LocationAutocompleteSkeleton />}>
      <LocationAutocomplete {...props} />
    </Suspense>
  );
};

export default LocationAutocompleteLazy;