'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DollarSign, TrendingDown, Loader2 } from 'lucide-react';

// Dynamic import with loading component
const BudgetOptimizer = dynamic(() => import('./BudgetOptimizer'), {
  loading: () => <BudgetOptimizerSkeleton />,
  ssr: false // AI components require client-side APIs
});

interface BudgetOptimizerLazyProps {
  destination: string;
  totalBudget: number;
  currency: 'USD' | 'INR';
  duration: number;
  groupSize: number;
  currentItinerary: any[];
  onOptimizationApplied?: (optimization: any) => void;
  className?: string;
}

// Loading skeleton component
function BudgetOptimizerSkeleton() {
  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/20">
        {/* Header skeleton */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-emerald-500/30 rounded-lg animate-pulse flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <div className="h-6 bg-emerald-400/30 rounded w-44 mb-2 animate-pulse"></div>
            <div className="h-4 bg-emerald-300/20 rounded w-56 animate-pulse"></div>
          </div>
        </div>

        {/* Budget cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-navy-800/30 rounded-xl p-4 border border-emerald-500/20 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 bg-emerald-400/30 rounded w-20 animate-pulse"></div>
                <TrendingDown className="w-4 h-4 text-emerald-300/50" />
              </div>
              <div className="h-8 bg-emerald-300/20 rounded w-16 mb-2 animate-pulse"></div>
              <div className="h-3 bg-emerald-200/15 rounded w-24 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Optimization suggestions skeleton */}
        <div className="space-y-3">
          <div className="h-5 bg-emerald-400/30 rounded w-48 mb-4 animate-pulse"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-navy-800/20 rounded-lg p-4 border border-emerald-500/10 animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-full animate-pulse flex-shrink-0 mt-0.5"></div>
                <div className="flex-1">
                  <div className="h-4 bg-emerald-300/20 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-emerald-200/15 rounded w-full mb-1 animate-pulse"></div>
                  <div className="h-3 bg-emerald-200/15 rounded w-2/3 animate-pulse"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-emerald-400/30 rounded w-12 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-emerald-300/20 rounded w-8 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action button skeleton */}
        <div className="pt-4 mt-6 border-t border-emerald-500/20">
          <div className="h-12 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-xl animate-pulse flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-300" />
            <span className="ml-2 text-emerald-200">Loading Budget Optimizer...</span>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="absolute top-4 right-4">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export const BudgetOptimizerLazy: React.FC<BudgetOptimizerLazyProps> = (props) => {
  return (
    <Suspense fallback={<BudgetOptimizerSkeleton />}>
      <BudgetOptimizer {...props} />
    </Suspense>
  );
};

export default BudgetOptimizerLazy;