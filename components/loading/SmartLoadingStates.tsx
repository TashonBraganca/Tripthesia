'use client';

// Smart Loading States - Phase 7 Advanced UX Polish
// Professional loading experiences with contextual messaging

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Plane, 
  MapPin, 
  Calendar, 
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface SmartLoadingProps {
  isLoading: boolean;
  loadingType?: 'search' | 'save' | 'generate' | 'fetch' | 'process' | 'upload';
  context?: 'flights' | 'hotels' | 'activities' | 'trip' | 'location' | 'general';
  progress?: number;
  estimatedTime?: number;
  customMessage?: string;
  showProgress?: boolean;
  showTips?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'overlay' | 'inline' | 'skeleton';
  onCancel?: () => void;
  onRetry?: () => void;
  timeout?: number;
}

const LOADING_MESSAGES = {
  search: {
    flights: [
      'Searching hundreds of airlines for the best deals...',
      'Comparing prices across multiple booking sites...',
      'Finding flights that match your preferences...',
      'Analyzing route options and connections...'
    ],
    hotels: [
      'Searching thousands of hotels and accommodations...',
      'Checking availability for your dates...',
      'Comparing prices and amenities...',
      'Finding the perfect place to stay...'
    ],
    activities: [
      'Discovering amazing things to do...',
      'Finding activities that match your interests...',
      'Searching for tours and experiences...',
      'Checking availability and reviews...'
    ],
    location: [
      'Searching global destinations...',
      'Finding matching cities and airports...',
      'Checking location details...',
      'Loading map data...'
    ],
    trip: [
      'Searching for destinations...',
      'Finding the best options for your trip...',
      'Analyzing preferences...'
    ],
    general: [
      'Searching for the best options...',
      'Processing your request...',
      'Almost there...'
    ]
  },
  save: {
    trip: [
      'Saving your trip details...',
      'Storing your preferences...',
      'Creating draft backup...',
      'Finalizing changes...'
    ],
    general: [
      'Saving changes...',
      'Updating information...',
      'Processing request...'
    ]
  },
  generate: {
    trip: [
      'AI is crafting your perfect itinerary...',
      'Analyzing your preferences and budget...',
      'Finding the best routes and timing...',
      'Adding personalized recommendations...',
      'Finalizing your custom trip plan...'
    ],
    general: [
      'Generating recommendations...',
      'Processing with AI...',
      'Creating personalized results...'
    ]
  },
  fetch: {
    general: [
      'Fetching latest information...',
      'Retrieving data...',
      'Loading content...'
    ]
  },
  process: {
    general: [
      'Processing your request...',
      'Analyzing data...',
      'Almost ready...'
    ]
  },
  upload: {
    general: [
      'Uploading files...',
      'Processing upload...',
      'Finalizing...'
    ]
  }
};

const LOADING_TIPS = {
  flights: [
    'Tip: Book flights 2-8 weeks in advance for better prices',
    'Tip: Tuesday and Wednesday are usually the cheapest days to fly',
    'Tip: Clear your browser cookies before booking',
    'Tip: Consider nearby airports for potentially lower fares'
  ],
  hotels: [
    'Tip: Book hotels during weekdays for better rates',
    'Tip: Check cancellation policies before booking',
    'Tip: Look for hotels with free breakfast included',
    'Tip: Read recent reviews for the most current information'
  ],
  activities: [
    'Tip: Book popular activities in advance to avoid disappointment',
    'Tip: Check weather conditions for outdoor activities',
    'Tip: Look for combo tickets to save money',
    'Tip: Consider local guides for authentic experiences'
  ],
  general: [
    'Tip: Save your progress regularly while planning',
    'Tip: Compare multiple options before deciding',
    'Tip: Check reviews and ratings from other travelers'
  ]
};

export function SmartLoading({
  isLoading,
  loadingType = 'process',
  context = 'general',
  progress,
  estimatedTime,
  customMessage,
  showProgress = false,
  showTips = true,
  size = 'md',
  variant = 'overlay',
  onCancel,
  onRetry,
  timeout = 30000
}: SmartLoadingProps) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentTip, setCurrentTip] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Cycle through messages
  useEffect(() => {
    if (!isLoading) return;

    // Get appropriate messages inside useEffect to avoid dependency issues
    const messages = customMessage 
      ? [customMessage]
      : (LOADING_MESSAGES[loadingType] as any)?.[context] || (LOADING_MESSAGES[loadingType] as any)?.general || ['Loading...'];

    let messageIndex = 0;
    setCurrentMessage(messages[0]);

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setCurrentMessage(messages[messageIndex]);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, [isLoading, customMessage, loadingType, context]);

  // Cycle through tips
  useEffect(() => {
    if (!isLoading || !showTips) return;

    // Get appropriate tips inside useEffect to avoid dependency issues
    const tips = (LOADING_TIPS as any)[context] || LOADING_TIPS.general;

    let tipIndex = 0;
    setCurrentTip(tips[0]);

    const tipInterval = setInterval(() => {
      tipIndex = (tipIndex + 1) % tips.length;
      setCurrentTip(tips[tipIndex]);
    }, 5000);

    return () => clearInterval(tipInterval);
  }, [isLoading, showTips, context]);

  // Track elapsed time
  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      setShowTimeout(false);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);
      
      if (elapsed >= timeout) {
        setShowTimeout(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, timeout]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getLoadingIcon = () => {
    switch (context) {
      case 'flights':
        return <Plane className="w-6 h-6" />;
      case 'hotels':
        return <MapPin className="w-6 h-6" />;
      case 'activities':
        return <Calendar className="w-6 h-6" />;
      default:
        return <Search className="w-6 h-6" />;
    }
  };

  const sizeClasses = {
    sm: 'text-sm p-4',
    md: 'text-base p-6',
    lg: 'text-lg p-8'
  };

  if (!isLoading) return null;

  const LoadingContent = () => (
    <div className={`text-center ${sizeClasses[size]}`}>
      {/* Main loading indicator */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-2 border-teal-500/30 border-t-teal-400 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-teal-400"
            >
              {getLoadingIcon()}
            </motion.div>
          </div>
        </div>

        {/* Progress bar */}
        {showProgress && progress !== undefined && (
          <div className="w-full max-w-xs mb-4">
            <div className="flex justify-between text-xs text-navy-400 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-navy-800 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Loading message */}
        <AnimatePresence mode="wait">
          <motion.h3
            key={currentMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-navy-100 font-medium mb-2"
          >
            {currentMessage}
          </motion.h3>
        </AnimatePresence>

        {/* Estimated time */}
        {estimatedTime && (
          <p className="text-navy-400 text-sm">
            Estimated time: {Math.ceil(estimatedTime / 1000)}s
          </p>
        )}

        {/* Elapsed time */}
        {elapsedTime > 5000 && (
          <p className="text-navy-500 text-xs mt-1">
            Elapsed: {Math.ceil(elapsedTime / 1000)}s
          </p>
        )}
      </div>

      {/* Connection status */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center justify-center text-red-400">
            <WifiOff className="w-4 h-4 mr-2" />
            <span className="text-sm">Connection lost. Retrying...</span>
          </div>
        </div>
      )}

      {/* Timeout warning */}
      {showTimeout && (
        <div className="mb-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
          <div className="flex items-center justify-center text-amber-400 mb-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">This is taking longer than expected</span>
          </div>
          <div className="flex gap-2 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3 mr-1 inline" />
                Retry
              </button>
            )}
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1 bg-navy-600 hover:bg-navy-500 text-white text-xs rounded transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      {showTips && currentTip && !showTimeout && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-4"
          >
            <p className="text-blue-200 text-sm">
              💡 {currentTip}
            </p>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );

  // Render based on variant
  switch (variant) {
    case 'overlay':
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="bg-navy-900/90 backdrop-blur-md border border-navy-600 rounded-2xl max-w-md w-full mx-4">
            <LoadingContent />
          </div>
        </motion.div>
      );

    case 'inline':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-navy-900/50 backdrop-blur-sm border border-navy-600 rounded-xl"
        >
          <LoadingContent />
        </motion.div>
      );

    case 'skeleton':
      return (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-navy-800 rounded w-3/4"></div>
          <div className="h-4 bg-navy-800 rounded w-1/2"></div>
          <div className="h-4 bg-navy-800 rounded w-2/3"></div>
        </div>
      );

    default:
      return <LoadingContent />;
  }
}

// Specialized loading components
export function FlightSearchLoading(props: Partial<SmartLoadingProps>) {
  return (
    <SmartLoading
      isLoading={true}
      {...props}
      loadingType="search"
      context="flights"
      showTips={true}
      estimatedTime={15000}
    />
  );
}

export function TripGenerationLoading(props: Partial<SmartLoadingProps>) {
  return (
    <SmartLoading
      isLoading={true}
      {...props}
      loadingType="generate" 
      context="trip"
      showProgress={true}
      showTips={true}
      estimatedTime={20000}
    />
  );
}

export function SaveProgressLoading(props: Partial<SmartLoadingProps>) {
  return (
    <SmartLoading
      isLoading={true}
      {...props}
      loadingType="save"
      context="trip"
      variant="inline"
      size="sm"
      showTips={false}
      estimatedTime={3000}
    />
  );
}

export default SmartLoading;