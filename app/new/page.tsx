"use client";

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { MapPin, Calendar, Users, Plane, Car, Hotel, MapIcon, Clock, ChevronRight, ChevronDown, Search, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, slideInRight, slideInLeft, staggerContainer, scaleIn, buttonHover } from '@/lib/motion-variants';
import { LocationAutocompleteLazy as LocationAutocomplete } from '@/components/forms/LocationAutocompleteLazy';
import { CurrencySelectorLazy as CurrencySelector } from '@/components/forms/CurrencySelectorLazy';
import { LocationData } from '@/lib/data/locations';
import { CurrencyCode } from '@/lib/currency/currency-converter';
import { TripTypeSelector } from '@/components/forms/TripTypeSelector';
import { DateRangePicker } from '@/components/forms/DateRangePicker';
import { FlexibleStepper } from '@/components/forms/FlexibleStepper';
import { AnimatedButton } from '@/components/effects/AnimatedButton';

interface TripData {
  from: LocationData | null;
  to: LocationData | null;
  startDate: string;
  endDate: string;
  travelers: number;
  tripType: string;
  currency: CurrencyCode;
  transport: {
    mode: string;
    details: any;
  };
  rental: any;
  accommodation: any;
  activities: any[];
  food: any[];
}

interface DateRange {
  startDate: string;
  endDate: string;
}

export default function NewTripPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepWarning, setStepWarning] = useState<string | null>(null);
  const [tripData, setTripData] = useState<TripData>({
    from: null,
    to: null,
    startDate: '',
    endDate: '',
    travelers: 1,
    tripType: '',
    currency: 'USD' as CurrencyCode,
    transport: { mode: '', details: {} },
    rental: {},
    accommodation: {},
    activities: [],
    food: []
  });

  // Track wizard started on component mount
  useEffect(() => {
    // Analytics tracking removed for build stability
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        <p className="text-navy-300 mt-4">Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-2xl font-bold text-navy-50 mb-4">Sign in required</h1>
          <p className="text-navy-200 mb-6">Please sign in to create and save your trips.</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <LocationStep tripData={tripData} setTripData={setTripData} onNext={() => setCurrentStep(2)} />;
      case 2:
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl text-white mb-4">Step 2: Transport</h2>
            <p className="text-navy-300 mb-6">Transportation options will be available here.</p>
            <button 
              onClick={() => setCurrentStep(1)} 
              className="px-6 py-3 bg-teal-500 text-navy-900 rounded-xl font-semibold hover:bg-teal-400 transition-all duration-300"
            >
              Back to Location
            </button>
          </div>
        );
      default:
        return <LocationStep tripData={tripData} setTripData={setTripData} onNext={() => setCurrentStep(2)} />;
    }
  };

  // Working version with essential functionality restored
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Simple gradient background instead of complex TopographicalGrid */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="text-navy-300 hover:text-teal-400 transition-colors duration-200">
                ← Back to Home
              </Link>
              <div className="text-sm text-navy-400">
                Step {currentStep} of 8
              </div>
            </div>
            
            {/* Simplified step navigation */}
            <div className="flex items-center justify-center space-x-4 mb-8 overflow-x-auto">
              {[1,2,3,4,5,6,7,8].map((step, index) => (
                <button
                  key={step}
                  onClick={() => setCurrentStep(step)}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-200
                    ${currentStep === step 
                      ? 'bg-teal-500 text-navy-900' 
                      : currentStep > step 
                        ? 'bg-teal-600/30 text-teal-400 border border-teal-500' 
                        : 'bg-navy-700 text-navy-300 hover:bg-navy-600'
                    }
                  `}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-navy-800/50 backdrop-blur-sm border border-navy-600/30 rounded-2xl p-8">
              {renderCurrentStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationStep({ tripData, setTripData, onNext }: any) {
  const [validationErrors, setValidationErrors] = useState<any>({});

  const validateForm = () => {
    const errors: any = {};
    
    if (!tripData.from) {
      errors.from = 'Departure location is required';
    }
    if (!tripData.to) {
      errors.to = 'Destination is required';
    } else if (tripData.to?.id === tripData.from?.id) {
      errors.to = 'Destination must be different from departure';
    }
    if (!tripData.startDate) {
      errors.dates = 'Travel dates are required';
    }
    if (!tripData.endDate) {
      errors.dates = 'Travel dates are required';
    }
    if (!tripData.tripType) {
      errors.tripType = 'Please select a trip type';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const handleDateRangeChange = (range: DateRange) => {
    setTripData({
      ...tripData,
      startDate: range.startDate,
      endDate: range.endDate
    });
    // Clear date validation errors
    if (validationErrors.dates) {
      setValidationErrors({ ...validationErrors, dates: undefined });
    }
  };

  const handleTripTypeChange = (typeId: string) => {
    setTripData({ ...tripData, tripType: typeId });
    // Clear trip type validation error
    if (validationErrors.tripType) {
      setValidationErrors({ ...validationErrors, tripType: undefined });
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-navy-100 mb-2">Plan Your Perfect Journey</h2>
        <p className="text-navy-300">Tell us where you want to go and we&apos;ll create a personalized travel experience just for you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* From Location */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold text-navy-100">Departure</h3>
          </div>
          <LocationAutocomplete
            variant="departure"
            value={tripData.from}
            onChange={(location) => {
              setTripData({ ...tripData, from: location });
              if (validationErrors.from) {
                setValidationErrors({ ...validationErrors, from: undefined });
              }
            }}
            required
          />
          {validationErrors.from && (
            <p className="text-red-400 text-sm">{validationErrors.from}</p>
          )}
        </div>

        {/* To Location */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-navy-100">Destination</h3>
          </div>
          <LocationAutocomplete
            variant="destination"
            value={tripData.to}
            onChange={(location) => {
              setTripData({ ...tripData, to: location });
              if (validationErrors.to) {
                setValidationErrors({ ...validationErrors, to: undefined });
              }
            }}
            required
          />
          {validationErrors.to && (
            <p className="text-red-400 text-sm">{validationErrors.to}</p>
          )}
        </div>
      </div>

      {/* Travel Dates */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sky-500/20 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-sky-400" />
          </div>
          <h3 className="text-xl font-semibold text-navy-100">Travel Dates</h3>
        </div>
        <DateRangePicker
          value={{
            startDate: tripData.startDate,
            endDate: tripData.endDate
          }}
          onChange={handleDateRangeChange}
        />
        {validationErrors.dates && (
          <p className="text-red-400 text-sm">{validationErrors.dates}</p>
        )}
      </div>

      {/* Trip Type */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
            <MapIcon className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-navy-100">Trip Type</h3>
        </div>
        <TripTypeSelector
          value={tripData.tripType}
          onChange={handleTripTypeChange}
        />
        {validationErrors.tripType && (
          <p className="text-red-400 text-sm">{validationErrors.tripType}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-400 text-navy-900 font-semibold rounded-xl hover:from-teal-400 hover:to-teal-300 transition-all duration-300"
        >
          Continue
        </button>
      </div>
    </div>
  );
}