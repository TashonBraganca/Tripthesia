"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Plane, MapPin, Calendar, Users, ChevronRight } from 'lucide-react';

// Import the sophisticated form components
import { LocationAutocomplete } from '@/components/forms/LocationAutocomplete';
import { DateRangePicker } from '@/components/forms/DateRangePicker';
import { TripTypeSelector } from '@/components/forms/TripTypeSelector';
import { TopographicalGrid } from '@/components/backgrounds/TopographicalGrid';
import { AnimatedButton } from '@/components/effects/AnimatedButton';
import type { LocationData } from '@/lib/data/locations';

interface TripFormData {
  from: LocationData | null;
  to: LocationData | null;
  startDate: string;
  endDate: string;
  tripType: string;
  travelers: number;
  budget: number;
}

export default function NewTripPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState<TripFormData>({
    from: null,
    to: null,
    startDate: '',
    endDate: '',
    tripType: '',
    travelers: 2,
    budget: 50000
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = () => {
    if (!formData.from || !formData.to || !formData.startDate || !formData.endDate || !formData.tripType) {
      return;
    }
    
    // Navigate to transport selection
    router.push('/transport');
  };

  const isFormValid = formData.from && formData.to && formData.startDate && formData.endDate && formData.tripType;

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-navy-950 relative overflow-hidden">
      {/* Animated Background */}
      <TopographicalGrid
        density="normal"
        animation={true}
        parallax={true}
        theme="dark"
        className="absolute inset-0"
      />

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-teal-400 hover:text-teal-300 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-lg font-medium">Back to Home</span>
            </Link>
            <div className="text-navy-300">
              New Trip Planner
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Bento Box Grid */}
      <div className="relative z-10 px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="col-span-12 row-span-1 glass rounded-2xl border border-navy-400/30 p-8 mb-6"
          >
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-navy-50 via-teal-300 to-sky-300 bg-clip-text text-transparent mb-4">
                Plan Your Perfect Journey
              </h1>
              <p className="text-xl text-navy-200 max-w-2xl mx-auto">
                Tell us where you want to go and we&apos;ll create a personalized travel experience just for you
              </p>
            </div>
          </motion.div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 grid-rows-6 gap-6 h-[800px]">
            
            {/* From Location */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="col-span-12 md:col-span-6 row-span-1 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-teal-500/10 to-teal-400/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <Plane className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-navy-50">From</h3>
              </div>
              <LocationAutocomplete
                placeholder="Where are you starting from?"
                value={formData.from}
                onChange={(location) => setFormData(prev => ({ ...prev, from: location }))}
                variant="departure"
                showCurrentLocation={true}
              />
            </motion.div>

            {/* To Location */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="col-span-12 md:col-span-6 row-span-1 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-400/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-navy-50">To</h3>
              </div>
              <LocationAutocomplete
                placeholder="Where do you want to go?"
                value={formData.to}
                onChange={(location) => setFormData(prev => ({ ...prev, to: location }))}
                variant="destination"
                showNearbyLocations={true}
              />
            </motion.div>

            {/* Dates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="col-span-12 md:col-span-5 row-span-1 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-purple-500/10 to-purple-400/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-navy-50">Dates</h3>
              </div>
              <DateRangePicker
                value={{
                  startDate: formData.startDate,
                  endDate: formData.endDate
                }}
                onChange={(range) => setFormData(prev => ({
                  ...prev,
                  startDate: range.startDate,
                  endDate: range.endDate
                }))}
                className="w-full"
              />
            </motion.div>

            {/* Trip Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="col-span-12 md:col-span-7 row-span-1 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-amber-500/10 to-amber-400/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-navy-50">Trip Overview</h3>
              </div>
              
              {formData.from && formData.to ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-navy-300">Route:</span>
                    <span className="text-navy-100 font-medium">
                      {formData.from.name} → {formData.to.name}
                    </span>
                  </div>
                  {formData.startDate && formData.endDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-navy-300">Duration:</span>
                      <span className="text-navy-100 font-medium">
                        {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-navy-300">Travelers:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, travelers: Math.max(1, prev.travelers - 1) }))}
                        className="w-8 h-8 rounded-full bg-navy-700 hover:bg-navy-600 text-navy-200 flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <span className="text-navy-100 font-medium min-w-[2rem] text-center">
                        {formData.travelers}
                      </span>
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, travelers: prev.travelers + 1 }))}
                        className="w-8 h-8 rounded-full bg-navy-700 hover:bg-navy-600 text-navy-200 flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-navy-400 text-center py-4">
                  Select your departure and destination to see trip details
                </p>
              )}
            </motion.div>

            {/* Trip Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="col-span-12 row-span-3 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-indigo-500/10 to-indigo-400/5"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-navy-50">Choose Your Adventure</h3>
              </div>
              
              <TripTypeSelector
                value={formData.tripType}
                onChange={(typeId) => setFormData(prev => ({ ...prev, tripType: typeId }))}
                showPreview={true}
              />
            </motion.div>

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="col-span-12 row-span-1 flex items-center justify-center"
            >
              <AnimatedButton
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center gap-3 ${
                  isFormValid
                    ? 'bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-900 shadow-xl hover:shadow-2xl'
                    : 'bg-navy-700 text-navy-400 cursor-not-allowed'
                }`}
              >
                {isFormValid ? 'Continue to Transport' : 'Please fill all fields'}
                {isFormValid && <ChevronRight className="w-5 h-5" />}
              </AnimatedButton>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}