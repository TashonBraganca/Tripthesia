'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Brain, Loader2 } from 'lucide-react';

// Dynamic import with loading component
const AITripGenerator = dynamic(() => import('./AITripGenerator').then(mod => ({ default: mod.AITripGenerator })), {
  loading: () => <AITripGeneratorSkeleton />,
  ssr: false // AI components require client-side APIs
});

interface AITripGeneratorLazyProps {
  onTripGenerated?: (tripData: any) => void;
  preferences?: {
    budget?: string;
    interests?: string[];
    travelStyle?: string;
    groupSize?: number;
  };
  className?: string;
}

// Loading skeleton component
function AITripGeneratorSkeleton() {
  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
        {/* Header skeleton */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-purple-500/30 rounded-lg animate-pulse flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <div className="h-6 bg-purple-400/30 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-purple-300/20 rounded w-64 animate-pulse"></div>
          </div>
        </div>

        {/* Form skeleton */}
        <div className="space-y-4">
          <div>
            <div className="h-4 bg-navy-600/50 rounded w-24 mb-2 animate-pulse"></div>
            <div className="h-12 bg-navy-800/50 border border-purple-500/30 rounded-xl animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="h-4 bg-navy-600/50 rounded w-16 mb-2 animate-pulse"></div>
              <div className="h-12 bg-navy-800/50 border border-purple-500/30 rounded-xl animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 bg-navy-600/50 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-12 bg-navy-800/50 border border-purple-500/30 rounded-xl animate-pulse"></div>
            </div>
          </div>

          <div>
            <div className="h-4 bg-navy-600/50 rounded w-32 mb-2 animate-pulse"></div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 w-20 bg-navy-800/50 border border-purple-500/30 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <div className="h-12 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-xl animate-pulse flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
              <span className="ml-2 text-purple-200">Loading AI Trip Generator...</span>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="absolute top-4 right-4">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export const AITripGeneratorLazy: React.FC<AITripGeneratorLazyProps> = (props) => {
  return (
    <Suspense fallback={<AITripGeneratorSkeleton />}>
      <AITripGenerator {...props} />
    </Suspense>
  );
};

export default AITripGeneratorLazy;