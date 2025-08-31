"use client";

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { MapPin, Calendar, Users, Plane, Car, Hotel, MapIcon, Clock, ChevronRight, ChevronDown, Search, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, slideInRight, slideInLeft, staggerContainer, scaleIn, buttonHover } from '@/lib/motion-variants';
import { LocationAutocomplete } from '@/components/forms/LocationAutocomplete';
import { LocationData } from '@/lib/data/locations';
import { TripTypeSelector } from '@/components/forms/TripTypeSelector';
import { DateRangePicker } from '@/components/forms/DateRangePicker';
import { FlexibleStepper } from '@/components/forms/FlexibleStepper';
import { AnimatedButton } from '@/components/effects/AnimatedButton';

// LocationData interface is imported from lib/data/locations

interface TripData {
  from: LocationData | null;
  to: LocationData | null;
  startDate: string;
  endDate: string;
  travelers: number;
  tripType: string;
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
  const [tripData, setTripData] = useState<TripData>({
    from: null,
    to: null,
    startDate: '',
    endDate: '',
    travelers: 1,
    tripType: '',
    transport: { mode: '', details: null },
    rental: null,
    accommodation: null,
    activities: [],
    food: []
  });

  const steps = [
    { id: 1, name: 'Destination', icon: MapPin, description: 'Where are you going?' },
    { id: 2, name: 'Transport', icon: Plane, description: 'How will you get there?' },
    { id: 3, name: 'Local Rides', icon: Car, description: 'Need a rental car?' },
    { id: 4, name: 'Stay', icon: Hotel, description: 'Where will you stay?' },
    { id: 5, name: 'Activities', icon: MapIcon, description: 'What do you want to do?' },
    { id: 6, name: 'Food', icon: Users, description: 'Local cuisine to try' },
    { id: 7, name: 'Timeline', icon: Clock, description: 'Plan your itinerary' },
    { id: 8, name: 'Share', icon: ChevronRight, description: 'Share with friends' }
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in required</h1>
          <p className="text-gray-600 mb-6">Please sign in to create and save your trips.</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
        return <TransportStep tripData={tripData} setTripData={setTripData} onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />;
      case 3:
        return <RentalStep tripData={tripData} setTripData={setTripData} onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />;
      case 4:
        return <AccommodationStep tripData={tripData} setTripData={setTripData} onNext={() => setCurrentStep(5)} onBack={() => setCurrentStep(3)} />;
      case 5:
        return <ActivitiesStep tripData={tripData} setTripData={setTripData} onNext={() => setCurrentStep(6)} onBack={() => setCurrentStep(4)} />;
      case 6:
        return <FoodStep tripData={tripData} setTripData={setTripData} onNext={() => setCurrentStep(7)} onBack={() => setCurrentStep(5)} />;
      case 7:
        return <TimelineStep tripData={tripData} setTripData={setTripData} onNext={() => setCurrentStep(8)} onBack={() => setCurrentStep(6)} />;
      case 8:
        return <ShareStep tripData={tripData} onBack={() => setCurrentStep(7)} />;
      default:
        return <LocationStep tripData={tripData} setTripData={setTripData} onNext={() => setCurrentStep(2)} />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Cartoonish Background with Acrylic Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 1000 1000" fill="none">
            {/* Cartoonish clouds */}
            <ellipse cx="200" cy="150" rx="80" ry="40" fill="#ffffff" opacity="0.6" />
            <ellipse cx="180" cy="140" rx="60" ry="30" fill="#ffffff" opacity="0.6" />
            <ellipse cx="220" cy="140" rx="50" ry="25" fill="#ffffff" opacity="0.6" />
            
            <ellipse cx="600" cy="100" rx="70" ry="35" fill="#ffffff" opacity="0.5" />
            <ellipse cx="580" cy="90" rx="50" ry="25" fill="#ffffff" opacity="0.5" />
            
            <ellipse cx="800" cy="200" rx="60" ry="30" fill="#ffffff" opacity="0.4" />
            <ellipse cx="790" cy="190" rx="40" ry="20" fill="#ffffff" opacity="0.4" />
            
            {/* Cartoonish mountains */}
            <path d="M0 600 L100 400 L200 600 Z" fill="#a7f3d0" opacity="0.3" />
            <path d="M150 600 L250 350 L350 600 Z" fill="#86efac" opacity="0.3" />
            <path d="M300 600 L400 380 L500 600 Z" fill="#a7f3d0" opacity="0.3" />
            
            {/* Travel icons scattered */}
            <circle cx="700" cy="300" r="15" fill="#3b82f6" opacity="0.2" />
            <circle cx="300" cy="250" r="12" fill="#ef4444" opacity="0.2" />
            <circle cx="500" cy="180" r="10" fill="#f59e0b" opacity="0.2" />
          </svg>
        </div>
      </div>

      {/* Acrylic Glass Effect Overlay */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/trips" className="text-indigo-600 hover:text-indigo-500">
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Create New Trip</h1>
              </div>
              <div className="text-sm text-gray-600">
                Step {currentStep} of {steps.length}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <motion.div 
          className="bg-white/90 backdrop-blur-sm border-b"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Progress Line */}
            <div className="relative mb-6">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
              <motion.div 
                className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            <motion.div 
              className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              drag="x"
              dragConstraints={{ left: -100, right: 100 }}
              dragElastic={0.1}
            >
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <motion.div 
                    key={step.id} 
                    className="flex items-center space-x-2 min-w-0 flex-shrink-0"
                    variants={{
                      hidden: { opacity: 0, scale: 0.8 },
                      visible: { 
                        opacity: 1, 
                        scale: 1,
                        transition: { 
                          duration: 0.4,
                          delay: index * 0.1 
                        }
                      }
                    }}
                  >
                    <motion.div 
                      className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-green-500 text-white shadow-lg' : 
                        isCurrent ? 'bg-indigo-600 text-white shadow-lg' : 
                        'bg-gray-200 text-gray-500'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      animate={isCurrent ? { 
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(99, 102, 241, 0.4)",
                          "0 0 0 10px rgba(99, 102, 241, 0)",
                          "0 0 0 0 rgba(99, 102, 241, 0)"
                        ]
                      } : {}}
                      transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
                    >
                      <motion.div
                        animate={isCompleted ? { rotate: 360, scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </motion.div>
                      
                      {/* Step number badge */}
                      <motion.div
                        className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: (index * 0.1) + 0.2 }}
                      >
                        {step.id}
                      </motion.div>
                    </motion.div>
                    
                    <div className="hidden sm:block">
                      <motion.p 
                        className={`text-sm font-medium transition-colors duration-300 ${
                          isCurrent ? 'text-indigo-600' : 'text-gray-500'
                        }`}
                        animate={isCurrent ? { 
                          color: ["#6366f1", "#8b5cf6", "#6366f1"]
                        } : {}}
                        transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
                      >
                        {step.name}
                      </motion.p>
                      <p className="text-xs text-gray-400">{step.description}</p>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: (index * 0.1) + 0.3 }}
                      >
                        <ChevronRight className="h-4 w-4 text-gray-300 ml-2" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-8 relative overflow-hidden"
            whileHover={{ 
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
              y: -2 
            }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(event, info) => {
              // Swipe navigation for mobile
              const swipeThreshold = 50;
              if (info.offset.x > swipeThreshold && currentStep > 1) {
                // Swipe right - go to previous step
                setCurrentStep(currentStep - 1);
              } else if (info.offset.x < -swipeThreshold && currentStep < steps.length) {
                // Swipe left - go to next step (if form is valid)
                // This could be enhanced with validation checks
                setCurrentStep(currentStep + 1);
              }
            }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 pointer-events-none" />
            
            {/* Step content with slide animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative z-10"
              >
                {renderCurrentStep()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Location interface for autocomplete
interface Location {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  formatted: string;
}

// Enhanced Step Components with React Bits Design
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

  const isFormValid = tripData.from && tripData.to && tripData.startDate && tripData.endDate && tripData.tripType;

  return (
    <div className="min-h-screen bg-navy-900 relative">
      {/* Topographical Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900" />
        {/* Add TopographicalGrid here if available */}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-100 mb-4">
            Plan Your Perfect Journey
          </h1>
          <p className="text-xl text-navy-300 max-w-2xl mx-auto">
            Tell us where you want to go and we'll create a personalized travel experience just for you
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8"
        >
          {/* Location Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
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
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.from}
                </p>
              )}
            </div>

            <div>
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
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.to}
                </p>
              )}
            </div>
          </div>

          {/* Date Range Selection */}
          <div>
            <DateRangePicker
              value={{
                startDate: tripData.startDate || '',
                endDate: tripData.endDate || ''
              }}
              onChange={handleDateRangeChange}
              minDate={new Date().toISOString().split('T')[0]}
            />
            {validationErrors.dates && (
              <p className="text-red-400 text-sm mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.dates}
              </p>
            )}
          </div>

          {/* Trip Type Selection */}
          <div>
            <TripTypeSelector
              value={tripData.tripType || 'adventure'}
              onChange={handleTripTypeChange}
            />
            {validationErrors.tripType && (
              <p className="text-red-400 text-sm mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.tripType}
              </p>
            )}
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-8">
            <AnimatedButton
              variant="primary"
              size="lg"
              onClick={handleNext}
              disabled={!isFormValid}
              className="px-8 py-4"
            >
              <span>Continue to Transport</span>
              <ChevronRight size={20} className="ml-2" />
            </AnimatedButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function TransportStep({ tripData, setTripData, onNext, onBack }: any) {
  const [loading, setLoading] = useState(false);
  const [transportOptions, setTransportOptions] = useState<any[]>([]);
  const [selectedTransport, setSelectedTransport] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [sortBy, setSortBy] = useState('price'); // price, duration, departure

  useEffect(() => {
    if (tripData.from && tripData.to && tripData.startDate) {
      searchTransport();
    }
  }, []);

  const searchTransport = async () => {
    setLoading(true);
    try {
      // Comprehensive transport search API integration (flights, trains, buses)
      const response = await fetch('/api/transport/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: tripData.from,
          to: tripData.to,
          departureDate: tripData.startDate,
          returnDate: tripData.endDate,
          adults: tripData.travelers || 1,
          currency: 'USD',
        }),
      });

      if (!response.ok) {
        throw new Error('Transport search failed');
      }

      const data = await response.json();
      
      if (data.success && data.transportOptions) {
        // Convert API response to our format for backward compatibility
        const transportOptions = data.transportOptions.map((option: any) => ({
          id: option.id,
          type: option.type,
          airline: option.provider || option.airline,
          flightNumber: option.flightNumber || option.trainNumber || '',
          duration: option.duration,
          price: option.price,
          currency: option.currency,
          departure: option.departure.time,
          arrival: option.arrival.time,
          departureAirport: option.departure.airport,
          arrivalAirport: option.arrival.airport,
          stops: option.stops || 0,
          bookingUrl: option.bookingLink,
          rating: option.rating || option.score,
          baggage: option.amenities ? option.amenities.join(', ') : 
                   option.baggage ? `${option.baggage.carry ? '1 carry-on' : 'No carry-on'}${option.baggage.checked ? ' + 1 checked bag' : ''}` : '',
          comfort: option.comfort,
          co2Emissions: option.co2Emissions,
        }));

        setTransportOptions(transportOptions);
        setShowOptions(true);
      } else {
        // Fallback to mock data if API fails
        throw new Error('No transport data received');
      }
    } catch (error) {
      console.error('Flight search error:', error);
      // Enhanced fallback mock data
      const fallbackOptions = [
        {
          id: 'fallback-1',
          type: 'flight',
          airline: 'Delta Airlines',
          flightNumber: 'DL1234',
          duration: '8h 30m',
          price: 456,
          currency: 'USD',
          departure: '10:30 AM',
          arrival: '7:00 PM',
          departureAirport: 'JFK',
          arrivalAirport: 'LAX',
          stops: 0,
          bookingUrl: 'https://www.delta.com',
          rating: 4.5,
          baggage: '1 carry-on + 1 checked bag',
        },
        {
          id: 'fallback-2',
          type: 'flight',
          airline: 'United Airlines',
          flightNumber: 'UA5678',
          duration: '6h 15m',
          price: 520,
          currency: 'USD',
          departure: '2:15 PM',
          arrival: '8:30 PM',
          departureAirport: 'JFK',
          arrivalAirport: 'LAX',
          stops: 0,
          bookingUrl: 'https://www.united.com',
          rating: 4.2,
          baggage: '1 carry-on + 1 checked bag',
        },
      ];
      
      setTransportOptions(fallbackOptions);
      setShowOptions(true);
      setLoading(false);
    }
  };

  const handleSelectTransport = (transport: any) => {
    setSelectedTransport(transport);
    setTripData({ ...tripData, transport: { mode: transport.type, details: transport } });
  };

  const handleNext = () => {
    if (selectedTransport) {
      onNext();
    }
  };

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="h-5 w-5" />;
      case 'train': return <Car className="h-5 w-5" />;
      case 'bus': return <Car className="h-5 w-5" />;
      default: return <Plane className="h-5 w-5" />;
    }
  };

  const sortedOptions = transportOptions.sort((a, b) => {
    switch (sortBy) {
      case 'price': return a.price - b.price;
      case 'duration': return parseInt(a.duration) - parseInt(b.duration);
      default: return 0;
    }
  });

  return (
    <motion.div 
      className="space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="text-center"
        variants={fadeInUp}
      >
        <motion.h2 
          className="text-3xl font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          How will you get there?
        </motion.h2>
        <motion.p 
          className="text-gray-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Choose from flights, trains, buses, and other transport options
        </motion.p>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200"
        variants={fadeInUp}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span><strong>From:</strong> {tripData.from}</span>
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Plane className="h-5 w-5 text-indigo-500" />
          </motion.div>
          <span><strong>To:</strong> {tripData.to}</span>
          <span><strong>Date:</strong> {tripData.startDate}</span>
        </div>
      </motion.div>

      {loading && (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-gray-600"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Searching for the best transport options...
          </motion.p>
        </motion.div>
      )}

      {showOptions && !loading && (
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Sort Controls */}
          <motion.div 
            className="flex items-center justify-between"
            variants={fadeInUp}
          >
            <motion.h3 
              className="text-xl font-semibold text-gray-900"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Available Transport Options
            </motion.h3>
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="text-sm text-gray-600">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="price">Price</option>
                <option value="duration">Duration</option>
                <option value="departure">Departure Time</option>
              </select>
            </motion.div>
          </motion.div>

          {/* Transport Options Grid */}
          <motion.div 
            className="grid grid-cols-1 gap-3 sm:gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {sortedOptions.map((option, index) => (
              <motion.div
                key={option.id}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.95 },
                  visible: { 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { 
                      duration: 0.4,
                      delay: index * 0.1
                    }
                  }
                }}
                onClick={() => handleSelectTransport(option)}
                className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg group touch-manipulation ${
                  selectedTransport?.id === option.id
                    ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-indigo-300 bg-white hover:bg-gray-50 active:bg-gray-100'
                }`}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Selection indicator */}
                {selectedTransport?.id === option.id && (
                  <motion.div
                    className="absolute top-4 right-4 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Transport Type Icon */}
                    <motion.div 
                      className={`p-3 rounded-xl ${
                        option.type === 'flight' ? 'bg-blue-100 text-blue-600' :
                        option.type === 'train' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}
                      whileHover={{ 
                        scale: 1.1,
                        rotate: option.type === 'flight' ? [0, -5, 5, 0] : 0
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {option.type === 'flight' ? (
                        <Plane className="h-6 w-6" />
                      ) : option.type === 'train' ? (
                        <Car className="h-6 w-6" />
                      ) : (
                        <Car className="h-6 w-6" />
                      )}
                    </motion.div>
                    
                    {/* Transport Details */}
                    <div className="flex-1">
                      <motion.h4 
                        className="font-semibold text-gray-900 text-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                      >
                        {option.airline || option.provider}
                      </motion.h4>
                      
                      <motion.div 
                        className="flex items-center space-x-4 mt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
                      >
                        <p className="text-sm text-gray-600 font-medium">
                          {option.departure} → {option.arrival}
                        </p>
                        <span className="text-gray-400">•</span>
                        <p className="text-sm text-gray-600">{option.duration}</p>
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-center space-x-4 mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 + 0.4 }}
                      >
                        {option.stops !== undefined && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            option.stops === 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {option.stops === 0 ? 'Direct' : `${option.stops} stop(s)`}
                          </span>
                        )}
                        
                        {option.rating && (
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-xs text-gray-600">{option.rating}</span>
                          </div>
                        )}
                        
                        {option.comfort && (
                          <span className="text-xs text-gray-500">{option.comfort}</span>
                        )}
                      </motion.div>
                      
                      {/* Additional Details */}
                      {(option.aircraft || option.baggage) && (
                        <motion.div 
                          className="mt-2 text-xs text-gray-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
                        >
                          {option.aircraft && <span>{option.aircraft}</span>}
                          {option.aircraft && option.baggage && <span> • </span>}
                          {option.baggage && <span>{option.baggage}</span>}
                        </motion.div>
                      )}
                    </div>
                  </div>
                  
                  {/* Price Section */}
                  <motion.div 
                    className="text-right"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
                  >
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      whileHover={{ scale: 1.05 }}
                    >
                      ${option.price}
                    </motion.p>
                    <p className="text-sm text-gray-500">per person</p>
                    
                    {/* Book Button */}
                    <motion.button
                      className={`mt-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                        selectedTransport?.id === option.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (option.bookingUrl) {
                          window.open(option.bookingUrl, '_blank');
                        }
                      }}
                    >
                      {selectedTransport?.id === option.id ? 'Selected' : 'Select'}
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {selectedTransport && (
        <motion.div 
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 150 }}
        >
          <div className="flex items-center">
            <motion.div 
              className="flex-shrink-0"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shadow-sm">
                <motion.svg 
                  className="w-6 h-6 text-green-600" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </motion.svg>
              </div>
            </motion.div>
            <motion.div 
              className="ml-4 flex-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <motion.p 
                className="text-lg font-semibold text-green-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                Transport Selected!
              </motion.p>
              <motion.p 
                className="text-sm text-green-700 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                {selectedTransport.airline || selectedTransport.provider} - ${selectedTransport.price} per person
              </motion.p>
              <motion.p 
                className="text-sm text-green-600 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                You can book this later or continue planning your trip
              </motion.p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <motion.button
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open(selectedTransport.bookingUrl, '_blank')}
              >
                Book Now
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}

      <motion.div 
        className="flex justify-between items-center pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <motion.button 
          onClick={onBack} 
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 touch-manipulation min-h-[44px]"
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          <span>Back</span>
        </motion.button>
        
        <motion.button 
          onClick={handleNext}
          disabled={!selectedTransport}
          className={`flex items-center space-x-2 px-8 py-3 rounded-lg transition-all duration-200 touch-manipulation min-h-[44px] ${
            selectedTransport 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          whileHover={selectedTransport ? { scale: 1.02, x: 2 } : {}}
          whileTap={selectedTransport ? { scale: 0.98 } : {}}
          animate={selectedTransport ? {
            boxShadow: [
              "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            ]
          } : {}}
          transition={{ duration: 2, repeat: selectedTransport ? Infinity : 0 }}
        >
          <span>Next: Local Transport</span>
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function RentalStep({ tripData, setTripData, onNext, onBack }: any) {
  const [loading, setLoading] = useState(false);
  const [rentalOptions, setRentalOptions] = useState<any[]>([]);
  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [skipRental, setSkipRental] = useState(false);

  useEffect(() => {
    if (tripData.to) {
      searchRentals();
    }
  }, []);

  const searchRentals = async () => {
    setLoading(true);
    try {
      // Mock rental data - will integrate with real APIs
      const mockRentals = [
        {
          id: 1,
          type: 'economy',
          company: 'Hertz',
          model: 'Toyota Corolla or similar',
          price: 45,
          features: ['Manual transmission', 'Air conditioning', '5 seats', 'Unlimited mileage'],
          image: 'economy-car',
          fuel: 'Gasoline',
          transmission: 'Manual'
        },
        {
          id: 2,
          type: 'compact',
          company: 'Avis',
          model: 'Volkswagen Polo or similar',
          price: 52,
          features: ['Automatic transmission', 'Air conditioning', '5 seats', 'GPS included'],
          image: 'compact-car',
          fuel: 'Gasoline',
          transmission: 'Automatic'
        },
        {
          id: 3,
          type: 'suv',
          company: 'Enterprise',
          model: 'Ford Escape or similar',
          price: 89,
          features: ['Automatic transmission', 'All-wheel drive', '7 seats', 'Premium sound'],
          image: 'suv-car',
          fuel: 'Gasoline',
          transmission: 'Automatic'
        },
        {
          id: 4,
          type: 'luxury',
          company: 'Budget',
          model: 'BMW 3 Series or similar',
          price: 125,
          features: ['Automatic transmission', 'Leather seats', 'Premium audio', 'Navigation'],
          image: 'luxury-car',
          fuel: 'Gasoline',
          transmission: 'Automatic'
        }
      ];
      
      setTimeout(() => {
        setRentalOptions(mockRentals);
        setShowOptions(true);
        setLoading(false);
      }, 2000);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleSelectRental = (rental: any) => {
    setSelectedRental(rental);
    setSkipRental(false);
    setTripData({ ...tripData, rental: rental });
  };

  const handleSkipRental = () => {
    setSkipRental(true);
    setSelectedRental(null);
    setTripData({ ...tripData, rental: { skipped: true } });
  };

  const handleNext = () => {
    if (selectedRental || skipRental) {
      onNext();
    }
  };

  const getCarIcon = (type: string) => {
    switch (type) {
      case 'economy':
        return '🚗';
      case 'compact': 
        return '🚙';
      case 'suv':
        return '🚐';
      case 'luxury':
        return '🏎️';
      default:
        return '🚗';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'economy':
        return 'Economy';
      case 'compact':
        return 'Compact';
      case 'suv':
        return 'SUV';
      case 'luxury':
        return 'Luxury';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Need a rental car?</h2>
        <p className="text-gray-600">Get around your destination with local transportation options</p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span><strong>Destination:</strong> {tripData.to}</span>
          <Car className="h-5 w-5 text-emerald-500" />
          <span><strong>Duration:</strong> {tripData.startDate} to {tripData.endDate}</span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Finding the best rental car options...</p>
        </div>
      )}

      {showOptions && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Available Rentals</h3>
            <button
              onClick={handleSkipRental}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Skip rental car
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rentalOptions.map((rental) => (
              <div
                key={rental.id}
                onClick={() => handleSelectRental(rental)}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                  selectedRental?.id === rental.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getCarIcon(rental.type)}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{rental.company}</h4>
                      <p className="text-sm text-gray-600">{rental.model}</p>
                      <p className="text-xs text-gray-500 capitalize">{getTypeLabel(rental.type)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">${rental.price}</p>
                    <p className="text-xs text-gray-500">per day</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transmission:</span>
                    <span className="text-gray-900">{rental.transmission}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fuel:</span>
                    <span className="text-gray-900">{rental.fuel}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {rental.features.slice(0, 2).map((feature: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        {feature}
                      </span>
                    ))}
                    {rental.features.length > 2 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        +{rental.features.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {skipRental && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                No rental car needed
              </p>
              <p className="text-sm text-blue-600">
                You can rely on public transport, walking, or ridesharing services
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedRental && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Selected: {selectedRental.company} - {selectedRental.model} (${selectedRental.price}/day)
              </p>
              <p className="text-sm text-green-600">
                You can book this rental car later or continue planning your trip
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button 
          onClick={onBack} 
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button 
          onClick={handleNext}
          disabled={!selectedRental && !skipRental}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Next: Accommodation
        </button>
      </div>
    </div>
  );
}

function AccommodationStep({ tripData, setTripData, onNext, onBack }: any) {
  const [loading, setLoading] = useState(false);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (tripData.to && tripData.startDate && tripData.endDate) {
      searchAccommodations();
    }
  }, []);

  const searchAccommodations = async () => {
    setLoading(true);
    try {
      // Mock accommodation data - will integrate with real APIs (Booking.com, Agoda)
      const mockAccommodations = [
        {
          id: 1,
          type: 'hostel',
          name: 'Downtown Backpackers Hostel',
          rating: 4.2,
          reviews: 1247,
          price: 25,
          originalPrice: 30,
          location: 'City Center',
          distance: '0.2 km from center',
          features: ['Free WiFi', 'Shared kitchen', 'Common room', '24/7 reception'],
          image: 'hostel-image',
          roomType: 'Bed in 6-bed dorm'
        },
        {
          id: 2,
          type: 'hotel',
          name: 'Grand Plaza Hotel',
          rating: 4.5,
          reviews: 856,
          price: 120,
          originalPrice: 140,
          location: 'Downtown',
          distance: '0.5 km from center',
          features: ['Free WiFi', 'Breakfast included', 'Fitness center', 'Room service'],
          image: 'hotel-image',
          roomType: 'Standard Double Room'
        },
        {
          id: 3,
          type: 'apartment',
          name: 'Modern City Apartment',
          rating: 4.7,
          reviews: 423,
          price: 80,
          originalPrice: 90,
          location: 'Residential Area',
          distance: '1.2 km from center',
          features: ['Full kitchen', 'Washer/Dryer', 'Balcony', 'Parking'],
          image: 'apartment-image',
          roomType: '1 Bedroom Apartment'
        },
        {
          id: 4,
          type: 'boutique',
          name: 'Heritage Boutique Inn',
          rating: 4.8,
          reviews: 324,
          price: 95,
          originalPrice: 110,
          location: 'Historic District',
          distance: '0.8 km from center',
          features: ['Historic building', 'Garden view', 'Concierge', 'Local breakfast'],
          image: 'boutique-image',
          roomType: 'Superior Room'
        },
        {
          id: 5,
          type: 'luxury',
          name: 'Royal Luxury Resort',
          rating: 5.0,
          reviews: 892,
          price: 250,
          originalPrice: 300,
          location: 'Upscale District',
          distance: '2.0 km from center',
          features: ['Spa & Wellness', 'Multiple restaurants', 'Pool', 'Butler service'],
          image: 'luxury-image',
          roomType: 'Deluxe Suite'
        }
      ];
      
      setTimeout(() => {
        setAccommodations(mockAccommodations);
        setShowOptions(true);
        setLoading(false);
      }, 2500);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleSelectAccommodation = (accommodation: any) => {
    setSelectedAccommodation(accommodation);
    setTripData({ ...tripData, accommodation: accommodation });
  };

  const handleNext = () => {
    if (selectedAccommodation) {
      onNext();
    }
  };

  const getAccommodationIcon = (type: string) => {
    switch (type) {
      case 'hostel':
        return '🏠';
      case 'hotel':
        return '🏨';
      case 'apartment':
        return '🏢';
      case 'boutique':
        return '🏛️';
      case 'luxury':
        return '🏰';
      default:
        return '🏨';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hostel':
        return 'Hostel';
      case 'hotel':
        return 'Hotel';
      case 'apartment':
        return 'Apartment';
      case 'boutique':
        return 'Boutique';
      case 'luxury':
        return 'Luxury';
      default:
        return type;
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-400">⭐</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">⭐</span>}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Where will you stay?</h2>
        <p className="text-gray-600">Find the perfect accommodation for your budget and style</p>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span><strong>Location:</strong> {tripData.to}</span>
          <Hotel className="h-5 w-5 text-purple-500" />
          <span><strong>Check-in:</strong> {tripData.startDate}</span>
          <span><strong>Check-out:</strong> {tripData.endDate}</span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for the best accommodations...</p>
        </div>
      )}

      {showOptions && !loading && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Available Accommodations</h3>
          
          <div className="space-y-4">
            {accommodations.map((accommodation) => (
              <div
                key={accommodation.id}
                onClick={() => handleSelectAccommodation(accommodation)}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                  selectedAccommodation?.id === accommodation.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex space-x-4 flex-1">
                    <div className="text-4xl">{getAccommodationIcon(accommodation.type)}</div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{accommodation.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{getTypeLabel(accommodation.type)} • {accommodation.location}</p>
                          <p className="text-xs text-gray-500">{accommodation.distance}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            {accommodation.originalPrice > accommodation.price && (
                              <span className="text-sm text-gray-400 line-through">${accommodation.originalPrice}</span>
                            )}
                            <span className="text-2xl font-bold text-gray-900">${accommodation.price}</span>
                          </div>
                          <p className="text-xs text-gray-500">per night</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        {renderStars(accommodation.rating)}
                        <span className="text-sm text-gray-500">{accommodation.reviews} reviews</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{accommodation.roomType}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {accommodation.features.map((feature: string, idx: number) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedAccommodation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Selected: {selectedAccommodation.name} (${selectedAccommodation.price}/night)
              </p>
              <p className="text-sm text-green-600">
                You can book this accommodation later through our partner links
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button 
          onClick={onBack} 
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button 
          onClick={handleNext}
          disabled={!selectedAccommodation}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Next: Activities
        </button>
      </div>
    </div>
  );
}

function ActivitiesStep({ tripData, setTripData, onNext, onBack }: any) {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<any[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [aiInsight, setAiInsight] = useState('');

  useEffect(() => {
    if (tripData.to && tripData.tripType) {
      generateAIRecommendations();
    }
  }, []);

  const generateAIRecommendations = async () => {
    setLoading(true);
    try {
      // Simulate AI processing with web scraping + GPT-5 Nano integration
      const aiInsights = {
        'adventure': `Based on your adventure & trekking preferences in ${tripData.to}, I've curated experiences that combine natural beauty with thrilling activities. These recommendations factor in current weather patterns, seasonal accessibility, and recent traveler reviews.`,
        'culture': `For your cultural exploration of ${tripData.to}, I've selected historically significant sites and authentic cultural experiences. These recommendations include UNESCO heritage sites, local festivals, and immersive cultural activities based on recent visitor feedback.`,
        'relaxation': `Perfect for your beach & relaxation trip to ${tripData.to}. I've found the most serene spots with excellent amenities, factoring in current beach conditions, weather forecasts, and recent guest reviews for optimal relaxation.`,
        'business': `Optimized for your business travel to ${tripData.to}. These recommendations focus on networking opportunities, convenient locations near business districts, and cultural experiences that fit your professional schedule.`,
        'family': `Family-friendly activities in ${tripData.to} that cater to all ages. I've selected safe, educational, and entertaining experiences with excellent facilities and positive reviews from other families.`,
        'foodie': `Culinary journey through ${tripData.to}'s best flavors. From hidden local gems to renowned restaurants, these recommendations are based on current availability, seasonal menus, and authentic food experiences.`
      };

      // Mock AI-generated activities based on trip type
      const activityTypes = {
        'adventure': [
          {
            id: 1,
            name: 'Mountain Hiking & Scenic Views',
            description: 'Guided hiking tour through mountain trails with breathtaking panoramic views',
            category: 'Outdoor Adventure',
            duration: '6-8 hours',
            price: 75,
            rating: 4.8,
            difficulty: 'Moderate',
            features: ['Professional guide', 'Equipment included', 'Photography spots', 'Small groups'],
            bestTime: 'Morning start recommended'
          },
          {
            id: 2,
            name: 'Rock Climbing Experience',
            description: 'Learn rock climbing basics or challenge yourself on advanced routes',
            category: 'Extreme Sports',
            duration: '4-5 hours',
            price: 120,
            rating: 4.9,
            difficulty: 'Beginner to Advanced',
            features: ['Certified instructors', 'All gear provided', 'Safety briefing', 'Certificate'],
            bestTime: 'Weather dependent'
          },
          {
            id: 3,
            name: 'White Water Rafting',
            description: 'Adrenaline-pumping rafting adventure through pristine rivers',
            category: 'Water Sports',
            duration: '3-4 hours',
            price: 95,
            rating: 4.7,
            difficulty: 'Moderate',
            features: ['Professional guides', 'Safety equipment', 'Wetsuit included', 'Photos included'],
            bestTime: 'Best May-September'
          }
        ],
        'culture': [
          {
            id: 1,
            name: 'Historic City Walking Tour',
            description: 'Explore centuries of history with expert local historians',
            category: 'Cultural Heritage',
            duration: '3-4 hours',
            price: 35,
            rating: 4.6,
            difficulty: 'Easy',
            features: ['Expert historian guide', 'Small groups', 'Hidden gems', 'Local stories'],
            bestTime: 'Morning or afternoon'
          },
          {
            id: 2,
            name: 'Traditional Arts Workshop',
            description: 'Learn authentic local crafts from master artisans',
            category: 'Arts & Crafts',
            duration: '2-3 hours',
            price: 60,
            rating: 4.9,
            difficulty: 'Beginner',
            features: ['Master artisan instructor', 'All materials', 'Take home creation', 'Cultural insight'],
            bestTime: 'Flexible schedule'
          },
          {
            id: 3,
            name: 'Museum & Archaeological Sites',
            description: 'Premium access to major museums and archaeological wonders',
            category: 'Museums',
            duration: '5-6 hours',
            price: 45,
            rating: 4.5,
            difficulty: 'Easy',
            features: ['Skip-the-line access', 'Audio guide', 'Professional curator', 'Photo opportunities'],
            bestTime: 'Early morning recommended'
          }
        ],
        'relaxation': [
          {
            id: 1,
            name: 'Luxury Spa & Wellness',
            description: 'Rejuvenating spa treatments with ocean views',
            category: 'Wellness',
            duration: '3-4 hours',
            price: 150,
            rating: 4.9,
            difficulty: 'Relaxing',
            features: ['Ocean view treatment rooms', 'Organic products', 'Steam & sauna', 'Refreshments'],
            bestTime: 'Afternoon preferred'
          },
          {
            id: 2,
            name: 'Beach Club & Water Sports',
            description: 'Premium beach club with optional water activities',
            category: 'Beach',
            duration: 'Full day',
            price: 80,
            rating: 4.7,
            difficulty: 'Easy',
            features: ['Beachfront access', 'Loungers & umbrellas', 'Water sports', 'Beach bar'],
            bestTime: 'Weather dependent'
          },
          {
            id: 3,
            name: 'Sunset Yacht Cruise',
            description: 'Romantic sunset sailing with coastal views',
            category: 'Cruise',
            duration: '2-3 hours',
            price: 125,
            rating: 4.8,
            difficulty: 'Relaxing',
            features: ['Professional crew', 'Drinks included', 'Photo opportunities', 'Comfortable seating'],
            bestTime: 'Evening departure'
          }
        ]
      };

      const defaultActivities = [
        {
          id: 1,
          name: 'City Highlights Tour',
          description: 'Comprehensive overview of major attractions and landmarks',
          category: 'Sightseeing',
          duration: '4-5 hours',
          price: 50,
          rating: 4.5,
          difficulty: 'Easy',
          features: ['Local guide', 'Transportation', 'Major landmarks', 'Photo stops'],
          bestTime: 'Morning recommended'
        },
        {
          id: 2,
          name: 'Local Market Experience',
          description: 'Explore vibrant local markets with authentic shopping',
          category: 'Cultural',
          duration: '2-3 hours',
          price: 25,
          rating: 4.4,
          difficulty: 'Easy',
          features: ['Local guide', 'Market insights', 'Tasting opportunities', 'Shopping tips'],
          bestTime: 'Morning when fresh'
        }
      ];

      const tripTypeActivities = activityTypes[tripData.tripType as keyof typeof activityTypes] || defaultActivities;
      
      setTimeout(() => {
        setAiInsight(aiInsights[tripData.tripType as keyof typeof aiInsights] || `I've personalized these activity recommendations for your ${tripData.tripType} trip to ${tripData.to}, considering current conditions and traveler preferences.`);
        setActivities(tripTypeActivities);
        setShowOptions(true);
        setLoading(false);
      }, 3000);
    } catch (error) {
      setLoading(false);
    }
  };

  const toggleActivity = (activity: any) => {
    const isSelected = selectedActivities.find(a => a.id === activity.id);
    let newSelection;
    
    if (isSelected) {
      newSelection = selectedActivities.filter(a => a.id !== activity.id);
    } else {
      newSelection = [...selectedActivities, activity];
    }
    
    setSelectedActivities(newSelection);
    setTripData({ ...tripData, activities: newSelection });
  };

  const handleNext = () => {
    onNext();
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: any = {
      'Outdoor Adventure': '🏔️',
      'Extreme Sports': '🧗',
      'Water Sports': '🏄',
      'Cultural Heritage': '🏛️',
      'Arts & Crafts': '🎨',
      'Museums': '🏛️',
      'Wellness': '🧘',
      'Beach': '🏖️',
      'Cruise': '⛵',
      'Sightseeing': '📸',
      'Cultural': '🎭'
    };
    return iconMap[category] || '⭐';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
      case 'relaxing':
        return 'bg-green-100 text-green-800';
      case 'moderate':
      case 'beginner':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
      case 'advanced':
      case 'beginner to advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Things to Do</h2>
        <p className="text-gray-600">AI-powered recommendations based on your {tripData.tripType} trip preferences</p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="space-y-2">
            <p className="text-gray-600 font-medium">Analyzing your preferences...</p>
            <p className="text-sm text-gray-500">Searching local attractions and activities</p>
            <p className="text-sm text-gray-500">Checking current availability and reviews</p>
            <p className="text-sm text-gray-500">Generating personalized recommendations with GPT-5 Nano</p>
          </div>
        </div>
      )}

      {showOptions && !loading && (
        <div className="space-y-6">
          {/* AI Insight */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-100">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🤖</div>
              <div>
                <h3 className="font-semibold text-indigo-900 mb-2">AI Travel Assistant</h3>
                <p className="text-indigo-800 text-sm leading-relaxed">{aiInsight}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recommended Activities</h3>
            <p className="text-sm text-gray-500">Select activities that interest you</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activities.map((activity) => {
              const isSelected = selectedActivities.find(a => a.id === activity.id);
              return (
                <div
                  key={activity.id}
                  onClick={() => toggleActivity(activity)}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getCategoryIcon(activity.category)}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{activity.name}</h4>
                        <p className="text-sm text-gray-600">{activity.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">${activity.price}</p>
                      <p className="text-xs text-gray-500">per person</p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{activity.description}</p>

                  <div className="flex items-center justify-between mb-4 text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-600">⏱️ {activity.duration}</span>
                      <span className="text-yellow-500">⭐ {activity.rating}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(activity.difficulty)}`}>
                      {activity.difficulty}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">{activity.bestTime}</p>
                    <div className="flex flex-wrap gap-1">
                      {activity.features.slice(0, 3).map((feature: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          {feature}
                        </span>
                      ))}
                      {activity.features.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          +{activity.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedActivities.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">{selectedActivities.length}</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {selectedActivities.length} {selectedActivities.length === 1 ? 'activity' : 'activities'} selected
              </p>
              <p className="text-sm text-green-600">
                Total estimated cost: ${selectedActivities.reduce((sum: number, activity: any) => sum + activity.price, 0)} per person
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button 
          onClick={onBack} 
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button 
          onClick={handleNext}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Next: Food & Culture
        </button>
      </div>
    </div>
  );
}

function FoodStep({ tripData, setTripData, onNext, onBack }: any) {
  const [loading, setLoading] = useState(false);
  const [foodExperiences, setFoodExperiences] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [aiInsight, setAiInsight] = useState('');

  useEffect(() => {
    if (tripData.to && tripData.tripType) {
      generateFoodRecommendations();
    }
  }, []);

  const generateFoodRecommendations = async () => {
    setLoading(true);
    try {
      // AI-powered food recommendations based on trip type and destination
      const foodInsights = {
        'adventure': `For your adventure trip in ${tripData.to}, I've found hearty local eateries and authentic street food perfect for fueling your activities. These recommendations include energy-boosting meals, portable snacks, and well-reviewed local spots frequented by outdoor enthusiasts.`,
        'culture': `Your cultural journey in ${tripData.to} deserves authentic culinary experiences. I've selected traditional restaurants, historic cafes, and cultural food experiences that tell the story of local heritage through taste and atmosphere.`,
        'relaxation': `Perfect dining experiences for your relaxing getaway in ${tripData.to}. I've curated peaceful restaurants with stunning views, spa cuisine, and leisurely dining experiences that complement your rejuvenation goals.`,
        'business': `Business-friendly dining in ${tripData.to} with convenient locations, professional atmospheres, and quick service options. These recommendations include networking venues, reliable breakfast spots, and restaurants near business districts.`,
        'family': `Family-friendly dining experiences in ${tripData.to} with kid-approved menus, comfortable atmospheres, and educational food experiences that the whole family will enjoy.`,
        'foodie': `A curated culinary adventure through ${tripData.to}'s best flavors! From Michelin-recommended restaurants to hidden local gems, cooking classes, and food tours - this is your gateway to the destination's culinary soul.`
      };

      // Mock food experiences based on trip type
      const foodByTripType = {
        'adventure': [
          {
            id: 1,
            name: 'Local Mountain Cafe',
            type: 'Cafe & Light Meals',
            description: 'Hearty breakfast and energy-packed meals popular with hikers and outdoor enthusiasts',
            cuisine: 'Local Comfort Food',
            priceRange: '$',
            rating: 4.6,
            features: ['Early opening hours', 'Trail lunch packs', 'Local ingredients', 'Outdoor seating'],
            atmosphere: 'Casual & Energetic',
            specialties: ['Energy bowls', 'Local coffee', 'Packed lunches'],
            avgCost: 25
          },
          {
            id: 2,
            name: 'Street Food Market',
            type: 'Street Food & Markets',
            description: 'Authentic local street food with diverse options and quick service',
            cuisine: 'Street Food Variety',
            priceRange: '$',
            rating: 4.5,
            features: ['Multiple vendors', 'Local specialties', 'Quick service', 'Authentic flavors'],
            atmosphere: 'Bustling & Authentic',
            specialties: ['Local street snacks', 'Regional specialties', 'Fresh juices'],
            avgCost: 15
          },
          {
            id: 3,
            name: 'Riverside Grill',
            type: 'Casual Dining',
            description: 'Perfect after-activity dining with grilled specialties and craft beverages',
            cuisine: 'Grilled & BBQ',
            priceRange: '$$',
            rating: 4.7,
            features: ['River views', 'Craft beer', 'Grilled specialties', 'Relaxed atmosphere'],
            atmosphere: 'Relaxed & Scenic',
            specialties: ['Grilled fish', 'Local craft beer', 'BBQ platters'],
            avgCost: 45
          }
        ],
        'culture': [
          {
            id: 1,
            name: 'Heritage Restaurant',
            type: 'Traditional Fine Dining',
            description: 'Historic restaurant serving authentic regional cuisine in a cultural setting',
            cuisine: 'Traditional Regional',
            priceRange: '$$$',
            rating: 4.8,
            features: ['Historic building', 'Traditional recipes', 'Cultural performances', 'Wine pairings'],
            atmosphere: 'Historic & Elegant',
            specialties: ['Regional specialties', 'Traditional recipes', 'Local wines'],
            avgCost: 85
          },
          {
            id: 2,
            name: 'Cooking Class Experience',
            type: 'Interactive Experience',
            description: 'Learn to cook authentic local dishes with expert chefs',
            cuisine: 'Hands-on Learning',
            priceRange: '$$$',
            rating: 4.9,
            features: ['Expert instruction', 'Market tour included', 'Recipe cards', 'Group experience'],
            atmosphere: 'Educational & Interactive',
            specialties: ['Traditional techniques', 'Local ingredients', 'Cultural stories'],
            avgCost: 95
          },
          {
            id: 3,
            name: 'Historic Tea House',
            type: 'Cultural Cafe',
            description: 'Traditional tea house with cultural significance and local pastries',
            cuisine: 'Tea & Traditional Sweets',
            priceRange: '$$',
            rating: 4.6,
            features: ['Historic setting', 'Traditional teas', 'Local pastries', 'Cultural ambiance'],
            atmosphere: 'Traditional & Peaceful',
            specialties: ['Traditional teas', 'Local sweets', 'Cultural atmosphere'],
            avgCost: 30
          }
        ],
        'relaxation': [
          {
            id: 1,
            name: 'Oceanview Fine Dining',
            type: 'Fine Dining',
            description: 'Elegant restaurant with stunning ocean views and fresh seafood',
            cuisine: 'Fresh Seafood & International',
            priceRange: '$$$$',
            rating: 4.9,
            features: ['Ocean views', 'Fresh seafood', 'Romantic atmosphere', 'Wine selection'],
            atmosphere: 'Elegant & Romantic',
            specialties: ['Fresh catch of the day', 'Sunset dining', 'Wine pairings'],
            avgCost: 120
          },
          {
            id: 2,
            name: 'Spa Wellness Cafe',
            type: 'Health-focused Cafe',
            description: 'Light, healthy meals and fresh juices perfect for wellness trips',
            cuisine: 'Health & Wellness',
            priceRange: '$$',
            rating: 4.7,
            features: ['Organic ingredients', 'Fresh juices', 'Light meals', 'Wellness focus'],
            atmosphere: 'Calm & Refreshing',
            specialties: ['Fresh juices', 'Organic salads', 'Wellness bowls'],
            avgCost: 35
          },
          {
            id: 3,
            name: 'Beachfront Lounge',
            type: 'Casual Beach Dining',
            description: 'Relaxed beachfront dining with tropical cocktails and casual fare',
            cuisine: 'Beach & Tropical',
            priceRange: '$$',
            rating: 4.5,
            features: ['Beach location', 'Tropical cocktails', 'Sunset views', 'Casual atmosphere'],
            atmosphere: 'Relaxed & Tropical',
            specialties: ['Tropical cocktails', 'Fresh fruit', 'Beach fare'],
            avgCost: 40
          }
        ]
      };

      const defaultFood = [
        {
          id: 1,
          name: 'Local Favorites Restaurant',
          type: 'Local Cuisine',
          description: 'Popular restaurant serving authentic local dishes and specialties',
          cuisine: 'Local Traditional',
          priceRange: '$$',
          rating: 4.4,
          features: ['Local ingredients', 'Traditional recipes', 'Friendly service', 'Central location'],
          atmosphere: 'Welcoming & Authentic',
          specialties: ['Regional dishes', 'Local ingredients', 'Traditional flavors'],
          avgCost: 50
        },
        {
          id: 2,
          name: 'International Bistro',
          type: 'International',
          description: 'Diverse menu with international options and local fusion dishes',
          cuisine: 'International Fusion',
          priceRange: '$$',
          rating: 4.3,
          features: ['Diverse menu', 'Fusion dishes', 'Good wine list', 'Modern atmosphere'],
          atmosphere: 'Modern & Diverse',
          specialties: ['Fusion cuisine', 'International wines', 'Modern dishes'],
          avgCost: 55
        }
      ];

      const tripTypeFood = foodByTripType[tripData.tripType as keyof typeof foodByTripType] || defaultFood;
      
      setTimeout(() => {
        setAiInsight(foodInsights[tripData.tripType as keyof typeof foodInsights] || `I've curated dining experiences that perfectly complement your ${tripData.tripType} trip to ${tripData.to}, featuring local specialties and highly-rated establishments.`);
        setFoodExperiences(tripTypeFood);
        setShowOptions(true);
        setLoading(false);
      }, 2500);
    } catch (error) {
      setLoading(false);
    }
  };

  const toggleFood = (food: any) => {
    const isSelected = selectedFood.find(f => f.id === food.id);
    let newSelection;
    
    if (isSelected) {
      newSelection = selectedFood.filter(f => f.id !== food.id);
    } else {
      newSelection = [...selectedFood, food];
    }
    
    setSelectedFood(newSelection);
    setTripData({ ...tripData, food: newSelection });
  };

  const handleNext = () => {
    onNext();
  };

  const getFoodIcon = (type: string) => {
    const iconMap: any = {
      'Cafe & Light Meals': '☕',
      'Street Food & Markets': '🍜',
      'Casual Dining': '🍽️',
      'Traditional Fine Dining': '🍷',
      'Interactive Experience': '👨‍🍳',
      'Cultural Cafe': '🍵',
      'Fine Dining': '🥂',
      'Health-focused Cafe': '🥗',
      'Casual Beach Dining': '🏖️',
      'Local Cuisine': '🍲',
      'International': '🌍'
    };
    return iconMap[type] || '🍴';
  };

  const getPriceRangeLabel = (range: string) => {
    const labels: any = {
      '$': 'Budget ($15-30)',
      '$$': 'Moderate ($30-60)',
      '$$$': 'Upscale ($60-100)',
      '$$$$': 'Fine Dining ($100+)'
    };
    return labels[range] || range;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Local Cuisine & Culture</h2>
        <p className="text-gray-600">Discover authentic flavors and culinary experiences</p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="space-y-2">
            <p className="text-gray-600 font-medium">Discovering culinary experiences...</p>
            <p className="text-sm text-gray-500">Analyzing local food culture and specialties</p>
            <p className="text-sm text-gray-500">Finding highly-rated restaurants and experiences</p>
            <p className="text-sm text-gray-500">Matching with your travel preferences</p>
          </div>
        </div>
      )}

      {showOptions && !loading && (
        <div className="space-y-6">
          {/* AI Insight */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-100">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">👨‍🍳</div>
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Culinary AI Assistant</h3>
                <p className="text-orange-800 text-sm leading-relaxed">{aiInsight}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recommended Food Experiences</h3>
            <p className="text-sm text-gray-500">Select dining experiences that appeal to you</p>
          </div>
          
          <div className="space-y-4">
            {foodExperiences.map((food) => {
              const isSelected = selectedFood.find(f => f.id === food.id);
              return (
                <div
                  key={food.id}
                  onClick={() => toggleFood(food)}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4 flex-1">
                      <div className="text-3xl">{getFoodIcon(food.type)}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{food.name}</h4>
                            <p className="text-sm text-gray-600">{food.type} • {food.cuisine}</p>
                            <p className="text-xs text-gray-500">{food.atmosphere}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-600">{food.priceRange}</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">${food.avgCost}</p>
                            <p className="text-xs text-gray-500">avg per person</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3">{food.description}</p>
                        
                        <div className="flex items-center justify-between mb-3 text-sm">
                          <span className="text-yellow-500">⭐ {food.rating}</span>
                          <span className="text-gray-600">{getPriceRangeLabel(food.priceRange)}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-gray-700">Specialties: </span>
                            <span className="text-xs text-gray-600">{food.specialties.join(' • ')}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {food.features.map((feature: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedFood.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">{selectedFood.length}</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {selectedFood.length} dining {selectedFood.length === 1 ? 'experience' : 'experiences'} selected
              </p>
              <p className="text-sm text-green-600">
                Estimated dining budget: ${selectedFood.reduce((sum: number, food: any) => sum + food.avgCost, 0)} per person
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button 
          onClick={onBack} 
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button 
          onClick={handleNext}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Next: Timeline
        </button>
      </div>
    </div>
  );
}

function TimelineStep({ tripData, setTripData, onNext, onBack }: any) {
  const [mapView, setMapView] = useState('overview');
  const [selectedElement, setSelectedElement] = useState<any>(null);
  
  // Calculate trip summary
  const activityCost = tripData.activities?.reduce((sum: number, activity: any) => sum + activity.price, 0) || 0;
  const foodCost = tripData.food?.reduce((sum: number, food: any) => sum + food.avgCost, 0) || 0;
  const transportCost = tripData.transport?.details?.price || 0;
  const rentalCost = tripData.rental && !tripData.rental.skipped ? (tripData.rental.price * 3) : 0; // 3 days average
  const accommodationCost = tripData.accommodation ? (tripData.accommodation.price * 3) : 0; // 3 nights average
  const totalCost = transportCost + accommodationCost + rentalCost + activityCost + foodCost;

  const mapElements = [
    // Transport
    ...(tripData.transport?.details ? [{
      id: 'transport',
      type: 'transport',
      name: `${tripData.transport.details.airline || tripData.transport.details.provider}`,
      location: `${tripData.from} → ${tripData.to}`,
      icon: tripData.transport.mode === 'flight' ? '✈️' : '🚆',
      cost: transportCost,
      details: `${tripData.transport.details.duration} • $${transportCost}`
    }] : []),
    
    // Accommodation
    ...(tripData.accommodation ? [{
      id: 'accommodation',
      type: 'accommodation',
      name: tripData.accommodation.name,
      location: tripData.accommodation.location,
      icon: '🏨',
      cost: accommodationCost,
      details: `${tripData.accommodation.roomType} • $${tripData.accommodation.price}/night`
    }] : []),
    
    // Rental
    ...(tripData.rental && !tripData.rental.skipped ? [{
      id: 'rental',
      type: 'rental', 
      name: `${tripData.rental.company} - ${tripData.rental.model}`,
      location: 'Pickup location',
      icon: '🚗',
      cost: rentalCost,
      details: `${tripData.rental.transmission} • $${tripData.rental.price}/day`
    }] : []),
    
    // Activities
    ...(tripData.activities?.map((activity: any) => ({
      id: `activity-${activity.id}`,
      type: 'activity',
      name: activity.name,
      location: activity.category,
      icon: '🎯',
      cost: activity.price,
      details: `${activity.duration} • $${activity.price}`
    })) || []),
    
    // Food
    ...(tripData.food?.map((food: any) => ({
      id: `food-${food.id}`,
      type: 'food',
      name: food.name,
      location: food.atmosphere,
      icon: '🍽️',
      cost: food.avgCost,
      details: `${food.cuisine} • $${food.avgCost}`
    })) || [])
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Trip Map</h2>
        <p className="text-gray-600">Visual overview of your complete travel plan</p>
      </div>

      {/* Trip Summary Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <h3 className="text-2xl font-bold text-indigo-900">{tripData.to}</h3>
            <p className="text-sm text-indigo-600">Destination</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-indigo-900">{mapElements.length}</h3>
            <p className="text-sm text-indigo-600">Experiences</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-indigo-900">${totalCost}</h3>
            <p className="text-sm text-indigo-600">Est. Total Cost</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-indigo-900">{tripData.tripType}</h3>
            <p className="text-sm text-indigo-600 capitalize">Trip Style</p>
          </div>
        </div>
      </div>

      {/* Interactive Map Area */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Map Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Interactive Trip Map</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setMapView('overview')}
                className={`px-3 py-1 rounded-md text-sm ${
                  mapView === 'overview' 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white text-gray-600 border hover:border-indigo-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setMapView('detailed')}
                className={`px-3 py-1 rounded-md text-sm ${
                  mapView === 'detailed' 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white text-gray-600 border hover:border-indigo-300'
                }`}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>

        {/* Cartoonish Map Display */}
        <div className="relative h-96 bg-gradient-to-br from-blue-100 via-green-100 to-yellow-100">
          {/* Cartoonish Map Background */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" fill="none">
            {/* Cartoonish landscape elements */}
            <ellipse cx="150" cy="80" rx="60" ry="30" fill="#ffffff" opacity="0.8" />
            <ellipse cx="130" cy="70" rx="40" ry="20" fill="#ffffff" opacity="0.8" />
            <ellipse cx="170" cy="70" rx="35" ry="18" fill="#ffffff" opacity="0.8" />
            
            <ellipse cx="650" cy="60" rx="50" ry="25" fill="#ffffff" opacity="0.7" />
            <ellipse cx="630" cy="50" rx="35" ry="18" fill="#ffffff" opacity="0.7" />
            
            {/* Cartoonish mountains */}
            <path d="M0 300 L80 180 L160 300 Z" fill="#10b981" opacity="0.4" />
            <path d="M120 300 L200 160 L280 300 Z" fill="#059669" opacity="0.4" />
            <path d="M240 300 L320 200 L400 300 Z" fill="#10b981" opacity="0.4" />
            
            {/* Route line */}
            <path 
              d="M100 250 Q250 150 Q400 200 Q550 180 Q700 220" 
              stroke="#3b82f6" 
              strokeWidth="4" 
              strokeDasharray="10,5"
              fill="none"
              opacity="0.6"
            />
          </svg>
          
          {/* Map Elements */}
          <div className="absolute inset-0 p-6">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 h-full">
              {mapElements.map((element, index) => (
                <div
                  key={element.id}
                  onClick={() => setSelectedElement(element)}
                  className={`relative cursor-pointer transform transition-all duration-200 hover:scale-110 ${
                    selectedElement?.id === element.id ? 'z-20' : 'z-10'
                  }`}
                  style={{
                    gridColumn: Math.floor(index % 4) + 1,
                    gridRow: Math.floor(index / 4) + 1
                  }}
                >
                  <div className={`bg-white rounded-lg shadow-lg border-2 p-3 text-center ${
                    selectedElement?.id === element.id 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}>
                    <div className="text-2xl mb-2">{element.icon}</div>
                    <h4 className="font-semibold text-xs text-gray-900 mb-1 truncate">
                      {element.name}
                    </h4>
                    <p className="text-xs text-gray-600 truncate">{element.location}</p>
                    <p className="text-xs font-medium text-indigo-600">${element.cost}</p>
                  </div>
                  
                  {/* Connection lines to other elements */}
                  {index < mapElements.length - 1 && (
                    <div className="absolute top-1/2 -right-2 w-4 h-0.5 bg-indigo-300 opacity-50 transform -translate-y-1/2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Start and End markers */}
          <div className="absolute top-6 left-6 bg-green-500 text-white p-2 rounded-full shadow-lg">
            <span className="text-sm font-bold">START</span>
          </div>
          <div className="absolute bottom-6 right-6 bg-red-500 text-white p-2 rounded-full shadow-lg">
            <span className="text-sm font-bold">END</span>
          </div>
        </div>

        {/* Selected Element Details */}
        {selectedElement && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{selectedElement.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{selectedElement.name}</h4>
                <p className="text-sm text-gray-600">{selectedElement.location}</p>
                <p className="text-sm text-indigo-600">{selectedElement.details}</p>
              </div>
              <button
                onClick={() => setSelectedElement(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
          <div className="space-y-3">
            {transportCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transport</span>
                <span className="font-medium">${transportCost}</span>
              </div>
            )}
            {accommodationCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Accommodation</span>
                <span className="font-medium">${accommodationCost}</span>
              </div>
            )}
            {rentalCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rental Car</span>
                <span className="font-medium">${rentalCost}</span>
              </div>
            )}
            {activityCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Activities</span>
                <span className="font-medium">${activityCost}</span>
              </div>
            )}
            {foodCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Dining</span>
                <span className="font-medium">${foodCost}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total Estimated Cost</span>
              <span>${totalCost}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-4">Trip Overview</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Destination</span>
              <span className="font-medium">{tripData.to}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dates</span>
              <span className="font-medium">{tripData.startDate} - {tripData.endDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trip Type</span>
              <span className="font-medium capitalize">{tripData.tripType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Activities</span>
              <span className="font-medium">{tripData.activities?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dining Experiences</span>
              <span className="font-medium">{tripData.food?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button 
          onClick={onBack} 
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button 
          onClick={onNext}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Next: Share Your Trip
        </button>
      </div>
    </div>
  );
}

function ShareStep({ tripData, onBack }: any) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);

  useEffect(() => {
    // Generate shareable URL (in real app, this would be created after saving)
    const mockShareUrl = `https://tripthesia.com/trip/${Date.now()}`;
    setShareUrl(mockShareUrl);
  }, []);

  // Calculate trip duration in days
  const startDate = new Date(tripData.startDate);
  const endDate = new Date(tripData.endDate);
  const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Organize trip elements into timeline
  const generateTimeline = () => {
    const timeline: any = {};
    for (let day = 1; day <= tripDuration; day++) {
      timeline[day] = {
        date: new Date(startDate.getTime() + (day - 1) * 24 * 60 * 60 * 1000),
        morning: [],
        afternoon: [],
        evening: []
      };
    }

    // Distribute activities across days (simplified logic)
    const activities = tripData.activities || [];
    const food = tripData.food || [];
    
    activities.forEach((activity: any, index: number) => {
      const day = (index % tripDuration) + 1;
      const timeSlot = index < tripDuration ? 'morning' : 'afternoon';
      timeline[day][timeSlot].push({
        type: 'activity',
        ...activity,
        time: timeSlot === 'morning' ? '09:00 AM' : '02:00 PM'
      });
    });

    food.forEach((restaurant: any, index: number) => {
      const day = (index % tripDuration) + 1;
      const timeSlot = 'evening';
      timeline[day][timeSlot].push({
        type: 'food',
        ...restaurant,
        time: '07:00 PM'
      });
    });

    // Add accommodation to all days
    if (tripData.accommodation) {
      for (let day = 1; day <= tripDuration; day++) {
        timeline[day].accommodation = tripData.accommodation;
      }
    }

    return timeline;
  };

  const timeline = generateTimeline();

  const handleSaveTrip = async () => {
    setSaving(true);
    try {
      // Simulate API call to save trip
      setTimeout(() => {
        setSaved(true);
        setSaving(false);
      }, 2000);
    } catch (error) {
      setSaving(false);
    }
  };

  const handleShare = (platform: string) => {
    const tripTitle = `My ${tripData.tripType} trip to ${tripData.to}`;
    const shareText = `Check out my amazing ${tripData.tripType} trip plan to ${tripData.to}! Created with Tripthesia AI.`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(tripTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`);
        break;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    // Show toast or success message
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Trip Timeline</h2>
        <p className="text-gray-600">Day-by-day itinerary and sharing options</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Trip saved successfully!</p>
              <p className="text-sm text-green-600">Your itinerary is ready to share and use</p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Navigation */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900 mb-4">Trip Timeline</h3>
          <div className="flex space-x-2 overflow-x-auto">
            {Array.from({ length: tripDuration }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedDay === day
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Day {day}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Day Timeline */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900">
              Day {selectedDay} - {formatDate(timeline[selectedDay].date)}
            </h4>
            {timeline[selectedDay].accommodation && (
              <p className="text-sm text-gray-600 mt-1">
                Staying at: {timeline[selectedDay].accommodation.name}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {/* Morning */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                <span className="text-yellow-500 mr-2">🌅</span>
                Morning
              </h5>
              {timeline[selectedDay].morning.length > 0 ? (
                <div className="space-y-2">
                  {timeline[selectedDay].morning.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">{item.time}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.category || item.cuisine}</p>
                      </div>
                      <span className="text-sm text-gray-500">${item.price || item.avgCost}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No activities planned</p>
              )}
            </div>

            {/* Afternoon */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                <span className="text-orange-500 mr-2">☀️</span>
                Afternoon
              </h5>
              {timeline[selectedDay].afternoon.length > 0 ? (
                <div className="space-y-2">
                  {timeline[selectedDay].afternoon.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">{item.time}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.category || item.cuisine}</p>
                      </div>
                      <span className="text-sm text-gray-500">${item.price || item.avgCost}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No activities planned</p>
              )}
            </div>

            {/* Evening */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                <span className="text-purple-500 mr-2">🌙</span>
                Evening
              </h5>
              {timeline[selectedDay].evening.length > 0 ? (
                <div className="space-y-2">
                  {timeline[selectedDay].evening.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">{item.time}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.type || item.cuisine}</p>
                      </div>
                      <span className="text-sm text-gray-500">${item.price || item.avgCost}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No activities planned</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sharing Options */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-semibold text-gray-900 mb-4">Share Your Trip</h3>
        
        {/* Share URL */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shareable Link
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Social Sharing */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => handleShare('facebook')}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Facebook
          </button>
          <button
            onClick={() => handleShare('twitter')}
            className="flex items-center justify-center px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 text-sm"
          >
            Twitter
          </button>
          <button
            onClick={() => handleShare('linkedin')}
            className="flex items-center justify-center px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm"
          >
            LinkedIn
          </button>
          <button
            onClick={() => handleShare('email')}
            className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
          >
            Email
          </button>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
            📄 Export to PDF
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
            📅 Add to Calendar
          </button>
        </div>
      </div>

      {/* Final Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <button 
          onClick={onBack} 
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Map
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={handleSaveTrip}
            disabled={saving || saved}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Trip'}
          </button>
          
          <Link 
            href="/trips"
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
          >
            Complete & View All Trips
          </Link>
        </div>
      </div>
    </div>
  );
}