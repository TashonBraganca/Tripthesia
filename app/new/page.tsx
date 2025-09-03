"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Plane, MapPin, Calendar, Users, ChevronRight, Save, CheckCircle } from 'lucide-react';

// Import the sophisticated form components
import { LocationAutocomplete } from '@/components/forms/LocationAutocomplete';
import { DateRangePicker } from '@/components/forms/DateRangePicker';
import { TripTypeSelector } from '@/components/forms/TripTypeSelector';
import { FlexibleStepper } from '@/components/forms/FlexibleStepper';
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
  transport?: {
    mode?: string;
    selection?: any;
  };
  rental?: any;
  accommodation?: any;
  activities?: any;
  dining?: any;
}

export default function NewTripPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  
  // Step navigation state
  const [currentStep, setCurrentStep] = useState('destination');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  
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
    loadDraftTrip();
  }, []);

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (!mounted || !user) return;

    const timeoutId = setTimeout(() => {
      saveDraftTrip();
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, completedSteps, mounted, user]);

  // Load existing draft trip on page load
  const loadDraftTrip = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/trips/draft');
      if (response.ok) {
        const { drafts } = await response.json();
        if (drafts && drafts.length > 0) {
          const draft = drafts[0]; // Load most recent draft
          setDraftId(draft.id);
          setFormData(draft.formData);
          setCurrentStep(draft.currentStep);
          setCompletedSteps(draft.completedSteps);
          setLastSaved(new Date(draft.lastSaved));
        }
      }
    } catch (error) {
      console.error('Error loading draft trip:', error);
    }
  };

  // Auto-save draft trip
  const saveDraftTrip = async () => {
    if (!user || !formData.from || !formData.to) return; // Only save if basic data exists

    setSaveStatus('saving');
    
    try {
      const response = await fetch('/api/trips/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentStep,
          completedSteps,
          formData,
          stepData: {}, // Can be expanded later for step-specific data
          title: formData.from && formData.to ? 
            `Trip to ${formData.to.name} from ${formData.from.name}` : 
            'Untitled Trip'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setDraftId(result.draft.id);
        setSaveStatus('saved');
        setLastSaved(new Date());
        
        // Reset to idle after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving draft trip:', error);
      setSaveStatus('error');
    }
  };

  // Step validation functions
  const validateDestinationStep = (): boolean => {
    return !!(formData.from && formData.to && formData.startDate && formData.endDate && formData.tripType);
  };

  const validateTransportStep = (): boolean => {
    return !!(formData.transport?.mode);
  };

  // Step navigation handlers
  const handleStepChange = (stepId: string) => {
    setCurrentStep(stepId);
  };

  const handleNext = () => {
    const stepOrder = ['destination', 'transport', 'rental', 'accommodation', 'activities', 'dining'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    // Mark current step as completed if valid
    if (currentStep === 'destination' && validateDestinationStep()) {
      setCompletedSteps(prev => [...prev.filter(s => s !== 'destination'), 'destination']);
    } else if (currentStep === 'transport' && validateTransportStep()) {
      setCompletedSteps(prev => [...prev.filter(s => s !== 'transport'), 'transport']);
    }
    
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const stepOrder = ['destination', 'transport', 'rental', 'accommodation', 'activities', 'dining'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSubmit = () => {
    // Complete trip creation process
    console.log('Creating trip with data:', formData);
    // Could navigate to summary or confirmation page
    router.push('/trips');
  };

  const isDestinationStepValid = validateDestinationStep();
  const isFormValid = formData.from && formData.to && formData.startDate && formData.endDate && formData.tripType;

  // Render step-specific content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'destination':
        return renderDestinationStep();
      case 'transport':
        return renderTransportStep();
      case 'rental':
        return renderRentalStep();
      case 'accommodation':
        return renderAccommodationStep();
      case 'activities':
        return renderActivitiesStep();
      case 'dining':
        return renderDiningStep();
      default:
        return renderDestinationStep();
    }
  };

  const renderDestinationStep = () => (
    <>
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

      {/* Bento Grid Layout for Destination Step */}
      <div className="grid grid-cols-12 grid-rows-6 gap-6 h-[800px]">
        {/* From Location */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="col-span-12 md:col-span-6 md:col-start-1 row-span-1 row-start-1 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-teal-500/10 to-teal-400/5 relative"
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
          className="col-span-12 md:col-span-6 md:col-start-7 row-span-1 row-start-1 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 relative"
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

        {/* Dates - Now larger (col-span-7) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="col-span-12 md:col-span-7 md:col-start-1 row-span-1 row-start-2 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-purple-500/10 to-purple-400/5 relative"
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

        {/* Trip Summary - Now smaller (col-span-5) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="col-span-12 md:col-span-5 md:col-start-8 row-span-1 row-start-2 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-amber-500/10 to-amber-400/5 relative"
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
                <span className="text-navy-100 font-medium text-sm">
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
                    className="w-6 h-6 rounded-full bg-navy-700 hover:bg-navy-600 text-navy-200 flex items-center justify-center transition-colors text-sm"
                  >
                    -
                  </button>
                  <span className="text-navy-100 font-medium min-w-[1.5rem] text-center text-sm">
                    {formData.travelers}
                  </span>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, travelers: prev.travelers + 1 }))}
                    className="w-6 h-6 rounded-full bg-navy-700 hover:bg-navy-600 text-navy-200 flex items-center justify-center transition-colors text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-navy-400 text-center py-4 text-sm">
              Select your departure and destination to see trip details
            </p>
          )}
        </motion.div>

        {/* Trip Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="col-span-12 col-start-1 row-span-3 row-start-3 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-indigo-500/10 to-indigo-400/5 relative"
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
      </div>
    </>
  );

  const renderTransportStep = () => (
    <div className="text-center py-20">
      <h2 className="text-3xl font-bold text-navy-100 mb-4">Transport Selection</h2>
      <p className="text-navy-300 mb-8">Choose your transportation method</p>
      <div className="text-amber-400">🚧 Transport selection interface coming soon...</div>
    </div>
  );

  const renderRentalStep = () => (
    <div className="text-center py-20">
      <h2 className="text-3xl font-bold text-navy-100 mb-4">Local Rides & Car Rentals</h2>
      <p className="text-navy-300 mb-8">Optional: Add car rentals and local transport</p>
      <div className="text-amber-400">🚧 Rental interface coming soon...</div>
    </div>
  );

  const renderAccommodationStep = () => (
    <div className="text-center py-20">
      <h2 className="text-3xl font-bold text-navy-100 mb-4">Hotels & Accommodation</h2>
      <p className="text-navy-300 mb-8">Optional: Find places to stay</p>
      <div className="text-amber-400">🚧 Hotel search interface coming soon...</div>
    </div>
  );

  const renderActivitiesStep = () => (
    <div className="text-center py-20">
      <h2 className="text-3xl font-bold text-navy-100 mb-4">Activities & Attractions</h2>
      <p className="text-navy-300 mb-8">Optional: Discover things to do</p>
      <div className="text-amber-400">🚧 Activities interface coming soon...</div>
    </div>
  );

  const renderDiningStep = () => (
    <div className="text-center py-20">
      <h2 className="text-3xl font-bold text-navy-100 mb-4">Dining & Restaurants</h2>
      <p className="text-navy-300 mb-8">Optional: Find great places to eat</p>
      <div className="text-amber-400">🚧 Dining recommendations coming soon...</div>
    </div>
  );

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
            <div className="flex items-center space-x-4">
              <div className="text-navy-300">
                New Trip Planner
              </div>
              
              {/* Auto-save status indicator */}
              {user && (
                <div className="flex items-center space-x-2 text-sm">
                  {saveStatus === 'saving' && (
                    <>
                      <Save className="w-4 h-4 text-amber-400 animate-spin" />
                      <span className="text-amber-400">Saving...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span className="text-teal-400">Draft saved</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-red-400">Save failed</span>
                  )}
                  {lastSaved && saveStatus === 'idle' && (
                    <span className="text-navy-400">
                      Last saved {new Date(lastSaved).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* FlexibleStepper Navigation */}
          <FlexibleStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
            formData={formData}
            onStepChange={handleStepChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
            className="mb-8"
          />
        </div>
      </div>

      {/* Main Content - Dynamic Step Content */}
      <div className="relative z-10 px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}