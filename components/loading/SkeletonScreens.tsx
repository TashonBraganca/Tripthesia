'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Base skeleton component with shimmer effect
const SkeletonBase: React.FC<{ 
  className?: string; 
  children?: React.ReactNode;
  animate?: boolean;
}> = ({ className = '', children, animate = true }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-navy-400/10 to-transparent"
          animate={{ x: [-100, 100] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut'
          }}
        />
      )}
      {children}
    </div>
  );
};

// Currency selector skeleton with location info
export const CurrencySkeletonScreen: React.FC = () => {
  return (
    <SkeletonBase className="flex items-center justify-between w-full px-4 py-3 bg-navy-800/50 border border-navy-600/30 rounded-xl backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-teal-500/20 animate-pulse" />
        <div>
          <div className="h-4 bg-navy-600/50 rounded w-24 mb-2 animate-pulse" />
          <motion.div 
            className="h-3 bg-navy-700/50 rounded w-32 animate-pulse"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>
      <div className="w-4 h-4 bg-navy-600/50 rounded animate-pulse" />
    </SkeletonBase>
  );
};

// Location autocomplete skeleton with search context
export const LocationSkeletonScreen: React.FC<{ variant?: 'departure' | 'destination' }> = ({ 
  variant = 'departure' 
}) => {
  const isDeparture = variant === 'departure';
  
  return (
    <SkeletonBase className="relative">
      <div className="flex items-center w-full px-4 py-3 bg-navy-800/50 border border-navy-600/30 rounded-xl backdrop-blur-sm">
        <div className="flex items-center space-x-3 flex-1">
          <div className={`w-5 h-5 rounded ${isDeparture ? 'bg-teal-500/30' : 'bg-emerald-500/30'} animate-pulse`} />
          <div className="flex-1">
            <div className="h-4 bg-navy-600/50 rounded w-3/4 mb-1 animate-pulse" />
            <motion.div 
              className="h-3 bg-navy-700/50 rounded w-1/2 animate-pulse"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.2 }}
            />
          </div>
        </div>
        <div className="w-4 h-4 bg-navy-600/50 rounded ml-3 animate-pulse" />
      </div>
      
      {/* Subtle typing indicator */}
      <motion.div
        className="absolute right-2 top-2 flex space-x-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1 h-1 bg-teal-400/40 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1
            }}
          />
        ))}
      </motion.div>
    </SkeletonBase>
  );
};

// Trip form skeleton with bento box layout
export const TripFormSkeletonScreen: React.FC = () => {
  return (
    <div className="grid grid-cols-12 grid-rows-6 gap-6 h-full min-h-[calc(100vh-12rem)]">
      {/* Hero section skeleton */}
      <SkeletonBase className="col-span-12 row-span-1 glass rounded-2xl p-8 border border-navy-400/20">
        <div className="text-center space-y-4">
          <div className="h-12 bg-navy-600/30 rounded-lg w-3/4 mx-auto animate-pulse" />
          <div className="h-6 bg-navy-700/30 rounded w-2/3 mx-auto animate-pulse" />
        </div>
      </SkeletonBase>

      {/* From location skeleton */}
      <SkeletonBase className="col-span-12 md:col-span-6 row-span-1 glass rounded-2xl p-6 border border-navy-400/20">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-500/20 rounded-full animate-pulse" />
            <div className="h-5 bg-navy-600/30 rounded w-24 animate-pulse" />
          </div>
          <LocationSkeletonScreen variant="departure" />
        </div>
      </SkeletonBase>

      {/* To location skeleton */}
      <SkeletonBase className="col-span-12 md:col-span-6 row-span-1 glass rounded-2xl p-6 border border-navy-400/20">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full animate-pulse" />
            <div className="h-5 bg-navy-600/30 rounded w-32 animate-pulse" />
          </div>
          <LocationSkeletonScreen variant="destination" />
        </div>
      </SkeletonBase>

      {/* Dates skeleton */}
      <SkeletonBase className="col-span-12 md:col-span-7 row-span-1 glass rounded-2xl p-6 border border-navy-400/20">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full animate-pulse" />
            <div className="h-5 bg-navy-600/30 rounded w-28 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-navy-700/30 rounded-xl animate-pulse" />
            <div className="h-12 bg-navy-700/30 rounded-xl animate-pulse" />
          </div>
        </div>
      </SkeletonBase>

      {/* Currency skeleton */}
      <SkeletonBase className="col-span-12 md:col-span-4 row-span-1 glass rounded-2xl p-6 border border-navy-400/20">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full animate-pulse" />
            <div className="h-5 bg-navy-600/30 rounded w-20 animate-pulse" />
          </div>
          <CurrencySkeletonScreen />
        </div>
      </SkeletonBase>

      {/* Summary skeleton */}
      <SkeletonBase className="col-span-12 md:col-span-8 row-span-1 glass rounded-2xl p-6 border border-navy-400/20">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full animate-pulse" />
            <div className="h-5 bg-navy-600/30 rounded w-32 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-navy-600/30 rounded w-16 animate-pulse" />
                <div className="h-4 bg-navy-700/30 rounded w-24 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </SkeletonBase>

      {/* Trip type selector skeleton */}
      <SkeletonBase className="col-span-12 row-span-3 glass rounded-2xl p-6 border border-navy-400/20">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-full animate-pulse" />
            <div className="h-6 bg-navy-600/30 rounded w-32 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <motion.div
                key={i}
                className="p-4 border-2 border-navy-700/30 rounded-xl space-y-3 animate-pulse"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: i * 0.1 
                }}
              >
                <div className="w-8 h-8 bg-navy-600/30 rounded mx-auto" />
                <div className="h-4 bg-navy-700/30 rounded w-20 mx-auto" />
                <div className="h-3 bg-navy-800/30 rounded w-16 mx-auto" />
              </motion.div>
            ))}
          </div>
        </div>
      </SkeletonBase>
    </div>
  );
};

// Transport search skeleton
export const TransportSkeletonScreen: React.FC = () => {
  return (
    <SkeletonBase className="space-y-6">
      {/* Search form skeleton */}
      <div className="glass rounded-xl p-8 border border-navy-700/50 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-teal-400/20 rounded animate-pulse" />
          <div className="h-6 bg-navy-600/30 rounded w-48 animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LocationSkeletonScreen variant="departure" />
          <LocationSkeletonScreen variant="destination" />
          <div className="h-12 bg-navy-700/30 rounded-xl animate-pulse" />
        </div>
        
        <CurrencySkeletonScreen />
        
        <div className="flex justify-end">
          <div className="h-12 bg-teal-500/30 rounded-xl w-48 animate-pulse" />
        </div>
      </div>
      
      {/* Search results skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="glass rounded-xl p-6 border border-navy-700/50 animate-pulse"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: i * 0.2 
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-navy-600/30 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 bg-navy-600/30 rounded w-32" />
                  <div className="h-3 bg-navy-700/30 rounded w-24" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-5 bg-teal-500/30 rounded w-16" />
                <div className="h-3 bg-navy-700/30 rounded w-12" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </SkeletonBase>
  );
};

export default {
  CurrencySkeletonScreen,
  LocationSkeletonScreen,
  TripFormSkeletonScreen,
  TransportSkeletonScreen
};