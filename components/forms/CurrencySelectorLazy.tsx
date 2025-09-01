'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { CurrencyCode } from '@/lib/currency/currency-converter';

// Dynamic import with loading component
const CurrencySelector = dynamic(() => import('./CurrencySelector').then(mod => ({ default: mod.CurrencySelector })), {
  loading: () => <CurrencySelectorSkeleton />,
  ssr: false // Currency detection requires client-side APIs
});

interface CurrencySelectorLazyProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  className?: string;
  showLocationInfo?: boolean;
  autoDetect?: boolean;
}

// Loading skeleton component
function CurrencySelectorSkeleton() {
  return (
    <div className="flex items-center justify-between w-full px-4 py-3 bg-navy-800/50 border border-navy-600/30 rounded-xl backdrop-blur-sm animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-teal-500/20"></div>
        <div>
          <div className="h-4 bg-navy-600 rounded w-24 mb-1"></div>
          <div className="h-3 bg-navy-700 rounded w-32"></div>
        </div>
      </div>
      <div className="w-4 h-4 bg-navy-600 rounded"></div>
    </div>
  );
}

export const CurrencySelectorLazy: React.FC<CurrencySelectorLazyProps> = (props) => {
  return (
    <Suspense fallback={<CurrencySelectorSkeleton />}>
      <CurrencySelector {...props} />
    </Suspense>
  );
};

export default CurrencySelectorLazy;