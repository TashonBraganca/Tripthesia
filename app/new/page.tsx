"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Plane, MapPin, Calendar, Users, ChevronRight, Save, CheckCircle, Train, Car, Bike, Bus, MapPin as Taxi, Shield, Clock, Star, Hotel, Home, Building2, Wifi, Car as Parking, Coffee, Dumbbell, Waves, Camera, Mountain, Landmark, TreePine, Palette, Music, ShoppingBag, Heart, UtensilsCrossed, ChefHat, Soup, Fish, Pizza, Salad } from 'lucide-react';

// Import the sophisticated form components
import { LocationAutocomplete } from '@/components/forms/LocationAutocomplete';
import { DateRangePicker } from '@/components/forms/DateRangePicker';
import { TripTypeSelector } from '@/components/forms/TripTypeSelector';
import { FlexibleStepper } from '@/components/forms/FlexibleStepper';
import { TopographicalGrid } from '@/components/backgrounds/TopographicalGrid';
import { AnimatedButton } from '@/components/effects/AnimatedButton';
import TransportSearchResults from '@/components/transport/TransportSearchResults';
import { TripOptimizer } from '@/components/ai/TripOptimizer';
import { TripReview } from '@/components/trip/TripReview';
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
  
  // Transport step state
  const [selectedTransport, setSelectedTransport] = useState<any>(null);
  const [isSearchingTransport, setIsSearchingTransport] = useState(false);
  
  // Rental step state
  const [selectedRentals, setSelectedRentals] = useState<any[]>([]);
  const [isSearchingRentals, setIsSearchingRentals] = useState(false);
  
  // Accommodation step state
  const [selectedAccommodations, setSelectedAccommodations] = useState<any[]>([]);
  const [isSearchingAccommodations, setIsSearchingAccommodations] = useState(false);
  
  // Activities step state
  const [selectedActivities, setSelectedActivities] = useState<any[]>([]);
  const [isSearchingActivities, setIsSearchingActivities] = useState(false);
  
  // Dining step state
  const [selectedDining, setSelectedDining] = useState<any[]>([]);
  const [isSearchingDining, setIsSearchingDining] = useState(false);
  
  // AI Optimizer state
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [optimizerCollapsed, setOptimizerCollapsed] = useState(true);
  
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

  // Show AI optimizer when user has made selections in multiple steps
  useEffect(() => {
    const hasMultipleSelections = (
      (formData.from && formData.to) &&
      (selectedTransport || selectedRentals.length > 0 || selectedAccommodations.length > 0 || selectedActivities.length > 0 || selectedDining.length > 0)
    );
    
    if (hasMultipleSelections && completedSteps.length >= 2) {
      setShowOptimizer(true);
    }
  }, [formData, selectedTransport, selectedRentals, selectedAccommodations, selectedActivities, selectedDining, completedSteps]);

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
          
          // Restore step selections if they exist
          if (draft.stepData) {
            if (draft.stepData.selectedTransport) {
              setSelectedTransport(draft.stepData.selectedTransport);
            }
            if (draft.stepData.selectedRentals) {
              setSelectedRentals(draft.stepData.selectedRentals);
            }
            if (draft.stepData.selectedAccommodations) {
              setSelectedAccommodations(draft.stepData.selectedAccommodations);
            }
            if (draft.stepData.selectedActivities) {
              setSelectedActivities(draft.stepData.selectedActivities);
            }
            if (draft.stepData.selectedDining) {
              setSelectedDining(draft.stepData.selectedDining);
            }
          }
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
          stepData: {
            selectedTransport,
            selectedRentals,
            selectedAccommodations,
            selectedActivities,
            selectedDining
          },
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
    const stepOrder = ['destination', 'transport', 'rental', 'accommodation', 'activities', 'dining', 'review'];
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
    const stepOrder = ['destination', 'transport', 'rental', 'accommodation', 'activities', 'dining', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.from || !formData.to) {
      alert('Missing required trip information');
      return;
    }

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Trip to ${formData.to.name} from ${formData.from.name}`,
          destination: formData.to.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          travelers: formData.travelers,
          budget: formData.budget,
          tripType: formData.tripType,
          formData: formData,
          selections: {
            transport: selectedTransport,
            rentals: selectedRentals,
            accommodations: selectedAccommodations,
            activities: selectedActivities,
            dining: selectedDining
          },
          status: 'planned'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Clean up draft if it exists
        if (draftId) {
          await fetch(`/api/trips/draft?id=${draftId}`, {
            method: 'DELETE'
          });
        }
        
        // Navigate to trip details or trips list
        router.push(`/trips`);
      } else {
        throw new Error('Failed to create trip');
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip. Please try again.');
    }
  };

  const handleApplyOptimization = (optimization: any) => {
    console.log('Applying optimization:', optimization);
    
    // Apply optimization suggestions based on the type
    optimization.suggestions.forEach((suggestion: any) => {
      switch (suggestion.step) {
        case 'accommodation':
          // Logic to update accommodation selections
          break;
        case 'activities':
          // Logic to reorder or update activities
          break;
        case 'transport':
          // Logic to update transport selection
          break;
        case 'dining':
          // Logic to update dining preferences
          break;
        default:
          break;
      }
    });
    
    // Show feedback to user
    alert(`Applied: ${optimization.title}`);
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
      case 'review':
        return renderReviewStep();
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
      <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-4 gap-6 md:h-[700px]">
        {/* From Location */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="col-span-1 md:col-span-6 md:col-start-1 md:row-span-1 md:row-start-1 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-teal-500/10 to-teal-400/5 relative"
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
          className="col-span-1 md:col-span-6 md:col-start-7 md:row-span-1 md:row-start-1 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 relative"
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
          className="col-span-1 md:col-span-7 md:col-start-1 md:row-span-1 md:row-start-2 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-purple-500/10 to-purple-400/5 relative"
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
          className="col-span-1 md:col-span-5 md:col-start-8 md:row-span-1 md:row-start-2 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-amber-500/10 to-amber-400/5 relative"
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
          className="col-span-1 md:col-span-12 md:col-start-1 md:row-span-2 md:row-start-3 glass rounded-2xl border border-navy-400/30 p-6 bg-gradient-to-br from-indigo-500/10 to-indigo-400/5 relative"
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

  const renderTransportStep = () => {
    const handleTransportSearch = async (searchParams: any) => {
      if (!formData.from || !formData.to || !formData.startDate) {
        alert('Please complete the destination step first');
        return;
      }

      setIsSearchingTransport(true);
      try {
        const response = await fetch('/api/transport/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origin: {
              name: formData.from.name,
              iataCode: formData.from.iataCode || ''
            },
            destination: {
              name: formData.to.name,
              iataCode: formData.to.iataCode || ''
            },
            departureDate: formData.startDate,
            returnDate: formData.endDate,
            passengers: formData.travelers,
            tripType: formData.endDate ? 'roundtrip' : 'oneway',
            ...searchParams
          }),
        });

        if (!response.ok) {
          throw new Error('Transport search failed');
        }

        const data = await response.json();
        // Results will be handled by the TransportSearchResults component
      } catch (error) {
        console.error('Transport search error:', error);
        alert('Failed to search for transport options. Please try again.');
      } finally {
        setIsSearchingTransport(false);
      }
    };

    const handleTransportSelection = (transport: any) => {
      setSelectedTransport(transport);
      setFormData(prev => ({
        ...prev,
        transport: {
          mode: transport.type,
          selection: transport
        }
      }));
      
      // Mark transport step as completed
      if (!completedSteps.includes('transport')) {
        setCompletedSteps(prev => [...prev, 'transport']);
      }
    };

    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-navy-100 mb-4">Choose Your Transportation</h2>
          <p className="text-navy-300 mb-2">
            Find the best way to travel from {formData.from?.name || 'your origin'} to {formData.to?.name || 'your destination'}
          </p>
          {formData.startDate && (
            <p className="text-navy-400 text-sm">
              Departure: {new Date(formData.startDate).toLocaleDateString()}
              {formData.endDate && ` • Return: ${new Date(formData.endDate).toLocaleDateString()}`}
            </p>
          )}
        </div>

        {!formData.from || !formData.to || !formData.startDate ? (
          <div className="text-center py-12 bg-navy-900/20 backdrop-blur-sm rounded-2xl border border-navy-800/30">
            <div className="text-amber-400 mb-4">
              <Plane className="w-12 h-12 mx-auto mb-2" />
            </div>
            <h3 className="text-xl font-semibold text-navy-100 mb-2">Complete Previous Steps</h3>
            <p className="text-navy-300 mb-4">
              Please complete the destination and dates in the previous step to search for transportation.
            </p>
            <button
              onClick={() => setCurrentStep('destination')}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Destination Step
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Transport Mode Selection */}
            <div className="bg-navy-900/20 backdrop-blur-sm rounded-2xl p-6 border border-navy-800/30">
              <h3 className="text-lg font-semibold text-navy-100 mb-4">Select Transport Mode</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleTransportSearch({ preferredMode: 'flight' })}
                  disabled={isSearchingTransport}
                  className="flex items-center p-4 bg-navy-800/30 rounded-xl hover:bg-navy-700/30 transition-all border border-navy-700/20 hover:border-teal-500/30 group"
                >
                  <Plane className="w-6 h-6 text-teal-400 mr-3 group-hover:text-teal-300" />
                  <div className="text-left">
                    <div className="font-medium text-navy-100">Flights</div>
                    <div className="text-sm text-navy-400">Fastest option</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleTransportSearch({ preferredMode: 'train' })}
                  disabled={isSearchingTransport}
                  className="flex items-center p-4 bg-navy-800/30 rounded-xl hover:bg-navy-700/30 transition-all border border-navy-700/20 hover:border-teal-500/30 group"
                >
                  <Train className="w-6 h-6 text-teal-400 mr-3 group-hover:text-teal-300" />
                  <div className="text-left">
                    <div className="font-medium text-navy-100">Trains</div>
                    <div className="text-sm text-navy-400">Eco-friendly</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleTransportSearch({ preferredMode: 'bus' })}
                  disabled={isSearchingTransport}
                  className="flex items-center p-4 bg-navy-800/30 rounded-xl hover:bg-navy-700/30 transition-all border border-navy-700/20 hover:border-teal-500/30 group"
                >
                  <Car className="w-6 h-6 text-teal-400 mr-3 group-hover:text-teal-300" />
                  <div className="text-left">
                    <div className="font-medium text-navy-100">Bus</div>
                    <div className="text-sm text-navy-400">Budget-friendly</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Transport Search Results */}
            <TransportSearchResults
              searchParams={{
                from: formData.from?.name || '',
                to: formData.to?.name || '',
                departureDate: formData.startDate,
                returnDate: formData.endDate,
                adults: formData.travelers,
                currency: 'INR'
              }}
              onSelectTransport={handleTransportSelection}
              selectedTransport={selectedTransport}
            />

            {/* Selected Transport Summary */}
            {selectedTransport && (
              <div className="bg-teal-900/20 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/30">
                <h3 className="text-lg font-semibold text-teal-100 mb-4">Selected Transportation</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {selectedTransport.type === 'flight' && <Plane className="w-5 h-5 text-teal-400 mr-2" />}
                    {selectedTransport.type === 'train' && <Train className="w-5 h-5 text-teal-400 mr-2" />}
                    {selectedTransport.type === 'bus' && <Car className="w-5 h-5 text-teal-400 mr-2" />}
                    <div>
                      <div className="font-medium text-teal-100">
                        {selectedTransport.airline || selectedTransport.carrier || 'Transport'}
                      </div>
                      <div className="text-sm text-teal-300">
                        {selectedTransport.departure} - {selectedTransport.arrival}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-teal-100">
                      {selectedTransport.price}
                    </div>
                    <div className="text-sm text-teal-400">
                      per person
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRentalStep = () => {
    const handleRentalSelection = (rental: any) => {
      const updatedRentals = selectedRentals.some(r => r.id === rental.id)
        ? selectedRentals.filter(r => r.id !== rental.id)
        : [...selectedRentals, rental];
      
      setSelectedRentals(updatedRentals);
      setFormData(prev => ({
        ...prev,
        rental: updatedRentals
      }));
      
      // Mark rental step as completed if any rental is selected
      if (updatedRentals.length > 0 && !completedSteps.includes('rental')) {
        setCompletedSteps(prev => [...prev, 'rental']);
      }
    };

    const rentalOptions = [
      {
        id: 'car-rental',
        type: 'car',
        title: 'Car Rental',
        description: 'Rent a car for complete freedom',
        icon: Car,
        estimatedPrice: '₹2,500/day',
        providers: ['Hertz', 'Avis', 'Zoomcar', 'Ola Rental'],
        features: ['GPS Navigation', 'Fuel Included', '24/7 Support', 'Insurance']
      },
      {
        id: 'bike-rental',
        type: 'bike',
        title: 'Bike/Scooter Rental',
        description: 'Perfect for city exploration',
        icon: Bike,
        estimatedPrice: '₹400/day',
        providers: ['Bounce', 'Vogo', 'Yulu', 'Local Rentals'],
        features: ['Helmet Included', 'Easy Parking', 'Fuel Efficient', 'City Access']
      },
      {
        id: 'taxi-services',
        type: 'taxi',
        title: 'Taxi Services',
        description: 'Door-to-door convenience',
        icon: Taxi,
        estimatedPrice: '₹15/km',
        providers: ['Ola', 'Uber', 'Local Taxis', 'Pre-paid Taxi'],
        features: ['Air Conditioned', 'GPS Tracking', 'Multiple Stops', 'Safe & Secure']
      },
      {
        id: 'public-transport',
        type: 'public',
        title: 'Public Transport',
        description: 'Budget-friendly local travel',
        icon: Bus,
        estimatedPrice: '₹50/day',
        providers: ['City Bus', 'Metro', 'Local Trains', 'Auto Rickshaw'],
        features: ['Most Economic', 'Frequent Service', 'Local Experience', 'Eco-friendly']
      }
    ];

    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-navy-100 mb-4">Local Transportation</h2>
          <p className="text-navy-300 mb-2">
            Choose how you&apos;ll get around in {formData.to?.name || 'your destination'}
          </p>
          <p className="text-navy-400 text-sm">
            Optional step - You can select multiple options or skip this step
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {rentalOptions.map((option) => {
            const IconComponent = option.icon;
            const isSelected = selectedRentals.some(r => r.id === option.id);
            
            return (
              <motion.div
                key={option.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-6 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-900/30 border-teal-500/50 shadow-lg shadow-teal-500/20'
                    : 'bg-navy-900/20 border-navy-800/30 hover:bg-navy-800/30 hover:border-navy-700/50'
                }`}
                onClick={() => handleRentalSelection(option)}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="w-6 h-6 text-teal-400" />
                  </div>
                )}
                
                <div className="flex items-start mb-4">
                  <div className={`p-3 rounded-xl mr-4 ${
                    isSelected ? 'bg-teal-500/20' : 'bg-navy-800/30'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      isSelected ? 'text-teal-300' : 'text-navy-300'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-semibold mb-2 ${
                      isSelected ? 'text-teal-100' : 'text-navy-100'
                    }`}>
                      {option.title}
                    </h3>
                    <p className={`text-sm mb-3 ${
                      isSelected ? 'text-teal-300' : 'text-navy-300'
                    }`}>
                      {option.description}
                    </p>
                    
                    <div className={`text-lg font-bold mb-3 ${
                      isSelected ? 'text-teal-200' : 'text-navy-200'
                    }`}>
                      {option.estimatedPrice}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className={`text-sm font-medium mb-2 ${
                    isSelected ? 'text-teal-200' : 'text-navy-200'
                  }`}>
                    Available Providers:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {option.providers.map((provider, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs rounded-md ${
                          isSelected 
                            ? 'bg-teal-800/30 text-teal-300' 
                            : 'bg-navy-800/50 text-navy-400'
                        }`}
                      >
                        {provider}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isSelected ? 'text-teal-200' : 'text-navy-200'
                  }`}>
                    Features:
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {option.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs">
                        <Shield className={`w-3 h-3 mr-1 ${
                          isSelected ? 'text-teal-400' : 'text-navy-400'
                        }`} />
                        <span className={isSelected ? 'text-teal-300' : 'text-navy-400'}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Rentals Summary */}
        {selectedRentals.length > 0 && (
          <div className="bg-teal-900/20 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/30 mb-6">
            <h3 className="text-lg font-semibold text-teal-100 mb-4">Selected Transportation Options</h3>
            <div className="space-y-3">
              {selectedRentals.map((rental, index) => {
                const option = rentalOptions.find(opt => opt.id === rental.id);
                if (!option) return null;
                
                const IconComponent = option.icon;
                return (
                  <div key={index} className="flex items-center justify-between bg-teal-800/20 rounded-lg p-3">
                    <div className="flex items-center">
                      <IconComponent className="w-5 h-5 text-teal-400 mr-3" />
                      <div>
                        <div className="font-medium text-teal-100">{option.title}</div>
                        <div className="text-sm text-teal-300">{option.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-teal-100">{option.estimatedPrice}</div>
                      <div className="text-sm text-teal-400">Estimated</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 p-4 bg-teal-800/30 rounded-lg">
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-teal-400 mr-2 mt-0.5" />
                <div className="text-sm text-teal-300">
                  <strong>Pro Tip:</strong> Book car rentals and bikes in advance for better rates. 
                  Local transport options will be available on arrival.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skip Option */}
        <div className="text-center">
          <button
            onClick={() => {
              if (!completedSteps.includes('rental')) {
                setCompletedSteps(prev => [...prev, 'rental']);
              }
            }}
            className="text-navy-400 hover:text-navy-300 transition-colors text-sm"
          >
            Skip this step - I&apos;ll arrange local transport later
          </button>
        </div>
      </div>
    );
  };

  const renderAccommodationStep = () => {
    const handleAccommodationSelection = (accommodation: any) => {
      const updatedAccommodations = selectedAccommodations.some(a => a.id === accommodation.id)
        ? selectedAccommodations.filter(a => a.id !== accommodation.id)
        : [...selectedAccommodations, accommodation];
      
      setSelectedAccommodations(updatedAccommodations);
      setFormData(prev => ({
        ...prev,
        accommodation: updatedAccommodations
      }));
      
      // Mark accommodation step as completed if any accommodation is selected
      if (updatedAccommodations.length > 0 && !completedSteps.includes('accommodation')) {
        setCompletedSteps(prev => [...prev, 'accommodation']);
      }
    };

    const accommodationTypes = [
      {
        id: 'luxury-hotels',
        type: 'hotel',
        title: 'Luxury Hotels',
        description: 'Premium hotels with world-class amenities',
        icon: Hotel,
        priceRange: '₹5,000 - ₹15,000/night',
        rating: 4.5,
        features: ['5-Star Service', 'Spa & Wellness', 'Fine Dining', 'Concierge'],
        amenities: [Wifi, Parking, Dumbbell, Waves],
        examples: ['Taj Hotels', 'Oberoi Group', 'Marriott', 'Hyatt']
      },
      {
        id: 'business-hotels',
        type: 'hotel',
        title: 'Business Hotels',
        description: 'Comfortable hotels perfect for business travelers',
        icon: Building2,
        priceRange: '₹3,000 - ₹8,000/night',
        rating: 4.2,
        features: ['Business Center', 'Meeting Rooms', 'Airport Shuttle', 'Executive Lounge'],
        amenities: [Wifi, Parking, Coffee, Dumbbell],
        examples: ['Radisson', 'Holiday Inn', 'Lemon Tree', 'Country Inn']
      },
      {
        id: 'budget-hotels',
        type: 'hotel',
        title: 'Budget Hotels',
        description: 'Clean and comfortable at affordable prices',
        icon: Home,
        priceRange: '₹1,500 - ₹4,000/night',
        rating: 3.8,
        features: ['Clean Rooms', '24/7 Front Desk', 'Room Service', 'Travel Assistance'],
        amenities: [Wifi, Parking, Coffee],
        examples: ['OYO Hotels', 'Treebo', 'FabHotels', 'GreenTree Inn']
      },
      {
        id: 'boutique-stays',
        type: 'boutique',
        title: 'Boutique & Heritage',
        description: 'Unique properties with local character',
        icon: Star,
        priceRange: '₹4,000 - ₹12,000/night',
        rating: 4.4,
        features: ['Unique Design', 'Local Culture', 'Personalized Service', 'Instagram-worthy'],
        amenities: [Wifi, Coffee, Waves],
        examples: ['Heritage Hotels', 'Boutique Properties', 'Palace Hotels', 'Local Gems']
      }
    ];

    const getAmenityIcon = (amenity: any) => {
      const IconComponent = amenity;
      return <IconComponent className="w-4 h-4" />;
    };

    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-navy-100 mb-4">Where You&apos;ll Stay</h2>
          <p className="text-navy-300 mb-2">
            Find perfect accommodation in {formData.to?.name || 'your destination'}
          </p>
          {formData.startDate && formData.endDate && (
            <p className="text-navy-400 text-sm">
              Check-in: {new Date(formData.startDate).toLocaleDateString()} • 
              Check-out: {new Date(formData.endDate).toLocaleDateString()}
              {formData.travelers && ` • ${formData.travelers} guests`}
            </p>
          )}
          <p className="text-navy-400 text-sm mt-2">
            Optional step - You can select multiple types or skip this step
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {accommodationTypes.map((type) => {
            const IconComponent = type.icon;
            const isSelected = selectedAccommodations.some(a => a.id === type.id);
            
            return (
              <motion.div
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-6 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-900/30 border-teal-500/50 shadow-lg shadow-teal-500/20'
                    : 'bg-navy-900/20 border-navy-800/30 hover:bg-navy-800/30 hover:border-navy-700/50'
                }`}
                onClick={() => handleAccommodationSelection(type)}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="w-6 h-6 text-teal-400" />
                  </div>
                )}
                
                <div className="flex items-start mb-4">
                  <div className={`p-3 rounded-xl mr-4 ${
                    isSelected ? 'bg-teal-500/20' : 'bg-navy-800/30'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      isSelected ? 'text-teal-300' : 'text-navy-300'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-xl font-semibold ${
                        isSelected ? 'text-teal-100' : 'text-navy-100'
                      }`}>
                        {type.title}
                      </h3>
                      <div className="flex items-center">
                        <Star className={`w-4 h-4 fill-current ${
                          isSelected ? 'text-teal-400' : 'text-amber-400'
                        }`} />
                        <span className={`text-sm ml-1 ${
                          isSelected ? 'text-teal-300' : 'text-navy-300'
                        }`}>
                          {type.rating}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm mb-3 ${
                      isSelected ? 'text-teal-300' : 'text-navy-300'
                    }`}>
                      {type.description}
                    </p>
                    
                    <div className={`text-lg font-bold mb-3 ${
                      isSelected ? 'text-teal-200' : 'text-navy-200'
                    }`}>
                      {type.priceRange}
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-4">
                  <h4 className={`text-sm font-medium mb-2 ${
                    isSelected ? 'text-teal-200' : 'text-navy-200'
                  }`}>
                    Amenities:
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {type.amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-1 ${
                          isSelected ? 'text-teal-300' : 'text-navy-400'
                        }`}
                      >
                        {getAmenityIcon(amenity)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <h4 className={`text-sm font-medium mb-2 ${
                    isSelected ? 'text-teal-200' : 'text-navy-200'
                  }`}>
                    Features:
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {type.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs">
                        <Shield className={`w-3 h-3 mr-1 ${
                          isSelected ? 'text-teal-400' : 'text-navy-400'
                        }`} />
                        <span className={isSelected ? 'text-teal-300' : 'text-navy-400'}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isSelected ? 'text-teal-200' : 'text-navy-200'
                  }`}>
                    Popular Brands:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {type.examples.slice(0, 3).map((example, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs rounded-md ${
                          isSelected 
                            ? 'bg-teal-800/30 text-teal-300' 
                            : 'bg-navy-800/50 text-navy-400'
                        }`}
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Accommodations Summary */}
        {selectedAccommodations.length > 0 && (
          <div className="bg-teal-900/20 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/30 mb-6">
            <h3 className="text-lg font-semibold text-teal-100 mb-4">Selected Accommodation Types</h3>
            <div className="space-y-3">
              {selectedAccommodations.map((accommodation, index) => {
                const type = accommodationTypes.find(t => t.id === accommodation.id);
                if (!type) return null;
                
                const IconComponent = type.icon;
                return (
                  <div key={index} className="flex items-center justify-between bg-teal-800/20 rounded-lg p-3">
                    <div className="flex items-center">
                      <IconComponent className="w-5 h-5 text-teal-400 mr-3" />
                      <div>
                        <div className="font-medium text-teal-100">{type.title}</div>
                        <div className="text-sm text-teal-300 flex items-center gap-2">
                          <Star className="w-3 h-3 fill-current text-amber-400" />
                          {type.rating} • {type.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-teal-100">{type.priceRange}</div>
                      <div className="text-sm text-teal-400">Per night</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 p-4 bg-teal-800/30 rounded-lg">
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-teal-400 mr-2 mt-0.5" />
                <div className="text-sm text-teal-300">
                  <strong>Booking Tips:</strong> Book accommodations early for better rates and availability. 
                  Consider location proximity to attractions and transport links.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skip Option */}
        <div className="text-center">
          <button
            onClick={() => {
              if (!completedSteps.includes('accommodation')) {
                setCompletedSteps(prev => [...prev, 'accommodation']);
              }
            }}
            className="text-navy-400 hover:text-navy-300 transition-colors text-sm"
          >
            Skip this step - I&apos;ll book accommodation separately
          </button>
        </div>
      </div>
    );
  };

  const renderActivitiesStep = () => {
    const handleActivitySelection = (activity: any) => {
      const updatedActivities = selectedActivities.some(a => a.id === activity.id)
        ? selectedActivities.filter(a => a.id !== activity.id)
        : [...selectedActivities, activity];
      
      setSelectedActivities(updatedActivities);
      setFormData(prev => ({
        ...prev,
        activities: updatedActivities
      }));
      
      // Mark activities step as completed if any activity is selected
      if (updatedActivities.length > 0 && !completedSteps.includes('activities')) {
        setCompletedSteps(prev => [...prev, 'activities']);
      }
    };

    const activityCategories = [
      {
        id: 'sightseeing',
        type: 'sightseeing',
        title: 'Sightseeing & Landmarks',
        description: 'Visit iconic places and historic landmarks',
        icon: Landmark,
        estimatedCost: '₹200 - ₹2,000',
        duration: '2-6 hours',
        features: ['Guided Tours', 'Photo Opportunities', 'Historical Insights', 'Audio Guides'],
        examples: ['Monuments', 'Museums', 'Palaces', 'Heritage Sites']
      },
      {
        id: 'adventure',
        type: 'adventure',
        title: 'Adventure & Outdoor',
        description: 'Thrilling experiences and outdoor activities',
        icon: Mountain,
        estimatedCost: '₹1,000 - ₹5,000',
        duration: '3-8 hours',
        features: ['Professional Guides', 'Safety Equipment', 'Certification', 'Group Discounts'],
        examples: ['Trekking', 'Rock Climbing', 'Water Sports', 'Zip Lining']
      },
      {
        id: 'cultural',
        type: 'cultural',
        title: 'Cultural & Arts',
        description: 'Immerse yourself in local culture and arts',
        icon: Palette,
        estimatedCost: '₹300 - ₹1,500',
        duration: '1-4 hours',
        features: ['Local Artists', 'Workshops', 'Cultural Shows', 'Art Galleries'],
        examples: ['Art Galleries', 'Cultural Shows', 'Workshops', 'Local Markets']
      },
      {
        id: 'entertainment',
        type: 'entertainment',
        title: 'Entertainment & Shows',
        description: 'Live performances and entertainment venues',
        icon: Music,
        estimatedCost: '₹500 - ₹3,000',
        duration: '2-4 hours',
        features: ['Reserved Seating', 'VIP Options', 'Refreshments', 'Meet & Greet'],
        examples: ['Concerts', 'Theater Shows', 'Comedy Shows', 'Dance Performances']
      },
      {
        id: 'nature',
        type: 'nature',
        title: 'Nature & Wildlife',
        description: 'Connect with nature and observe wildlife',
        icon: TreePine,
        estimatedCost: '₹400 - ₹2,500',
        duration: '3-8 hours',
        features: ['Expert Naturalists', 'Wildlife Spotting', 'Photography', 'Conservation'],
        examples: ['National Parks', 'Wildlife Safaris', 'Bird Watching', 'Nature Walks']
      },
      {
        id: 'shopping',
        type: 'shopping',
        title: 'Shopping & Markets',
        description: 'Explore local markets and shopping districts',
        icon: ShoppingBag,
        estimatedCost: '₹500 - ₹10,000',
        duration: '2-6 hours',
        features: ['Local Guides', 'Bargaining Tips', 'Authentic Products', 'Tax Refunds'],
        examples: ['Local Markets', 'Shopping Malls', 'Handicrafts', 'Souvenir Shops']
      }
    ];

    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-navy-100 mb-4">Things to Do & Explore</h2>
          <p className="text-navy-300 mb-2">
            Discover amazing activities and attractions in {formData.to?.name || 'your destination'}
          </p>
          <p className="text-navy-400 text-sm">
            Optional step - Select activities that interest you or skip to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {activityCategories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedActivities.some(a => a.id === category.id);
            
            return (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-6 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-900/30 border-teal-500/50 shadow-lg shadow-teal-500/20'
                    : 'bg-navy-900/20 border-navy-800/30 hover:bg-navy-800/30 hover:border-navy-700/50'
                }`}
                onClick={() => handleActivitySelection(category)}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="w-6 h-6 text-teal-400" />
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <div className={`inline-flex p-4 rounded-2xl mb-3 ${
                    isSelected ? 'bg-teal-500/20' : 'bg-navy-800/30'
                  }`}>
                    <IconComponent className={`w-8 h-8 ${
                      isSelected ? 'text-teal-300' : 'text-navy-300'
                    }`} />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isSelected ? 'text-teal-100' : 'text-navy-100'
                  }`}>
                    {category.title}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    isSelected ? 'text-teal-300' : 'text-navy-300'
                  }`}>
                    {category.description}
                  </p>
                </div>

                {/* Cost and Duration */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isSelected ? 'text-teal-300' : 'text-navy-400'}>
                      Cost Range:
                    </span>
                    <span className={`font-medium ${isSelected ? 'text-teal-200' : 'text-navy-200'}`}>
                      {category.estimatedCost}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={isSelected ? 'text-teal-300' : 'text-navy-400'}>
                      Duration:
                    </span>
                    <span className={`font-medium ${isSelected ? 'text-teal-200' : 'text-navy-200'}`}>
                      {category.duration}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <h4 className={`text-sm font-medium mb-2 ${
                    isSelected ? 'text-teal-200' : 'text-navy-200'
                  }`}>
                    What&apos;s Included:
                  </h4>
                  <div className="grid grid-cols-2 gap-1">
                    {category.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs">
                        <Heart className={`w-3 h-3 mr-1 ${
                          isSelected ? 'text-teal-400' : 'text-navy-400'
                        }`} />
                        <span className={isSelected ? 'text-teal-300' : 'text-navy-400'}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    isSelected ? 'text-teal-200' : 'text-navy-200'
                  }`}>
                    Popular Options:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {category.examples.slice(0, 2).map((example, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs rounded-md ${
                          isSelected 
                            ? 'bg-teal-800/30 text-teal-300' 
                            : 'bg-navy-800/50 text-navy-400'
                        }`}
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Activities Summary */}
        {selectedActivities.length > 0 && (
          <div className="bg-teal-900/20 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/30 mb-6">
            <h3 className="text-lg font-semibold text-teal-100 mb-4">Your Activity Interests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedActivities.map((activity, index) => {
                const category = activityCategories.find(c => c.id === activity.id);
                if (!category) return null;
                
                const IconComponent = category.icon;
                return (
                  <div key={index} className="flex items-center bg-teal-800/20 rounded-lg p-4">
                    <div className="flex-shrink-0 mr-4">
                      <div className="p-2 bg-teal-700/30 rounded-lg">
                        <IconComponent className="w-6 h-6 text-teal-300" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-teal-100 mb-1">{category.title}</div>
                      <div className="text-sm text-teal-300 mb-1">{category.description}</div>
                      <div className="text-xs text-teal-400">
                        {category.estimatedCost} • {category.duration}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-teal-800/30 rounded-lg">
              <div className="flex items-start">
                <Camera className="w-5 h-5 text-teal-400 mr-2 mt-0.5" />
                <div className="text-sm text-teal-300">
                  <strong>Planning Tips:</strong> Book popular activities in advance, especially during peak season. 
                  Consider grouping activities by location to optimize travel time and costs.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skip Option */}
        <div className="text-center">
          <button
            onClick={() => {
              if (!completedSteps.includes('activities')) {
                setCompletedSteps(prev => [...prev, 'activities']);
              }
            }}
            className="text-navy-400 hover:text-navy-300 transition-colors text-sm"
          >
            Skip this step - I&apos;ll plan activities later
          </button>
        </div>
      </div>
    );
  };

  const renderDiningStep = () => {
    const handleDiningSelection = (dining: any) => {
      const updatedDining = selectedDining.some(d => d.id === dining.id)
        ? selectedDining.filter(d => d.id !== dining.id)
        : [...selectedDining, dining];
      
      setSelectedDining(updatedDining);
      setFormData(prev => ({
        ...prev,
        dining: updatedDining
      }));
      
      // Mark dining step as completed if any dining is selected
      if (updatedDining.length > 0 && !completedSteps.includes('dining')) {
        setCompletedSteps(prev => [...prev, 'dining']);
      }
    };

    const diningCategories = [
      {
        id: 'fine-dining',
        type: 'fine-dining',
        title: 'Fine Dining',
        description: 'Upscale restaurants with exceptional cuisine',
        icon: ChefHat,
        priceRange: '₹2,000 - ₹6,000',
        avgRating: 4.5,
        features: ['Premium Ingredients', 'Expert Chefs', 'Elegant Ambiance', 'Wine Pairing'],
        cuisines: ['Continental', 'French', 'Japanese', 'Fusion'],
        examples: ['Michelin Star', 'Celebrity Chef', 'Hotel Restaurants', 'Rooftop Dining']
      },
      {
        id: 'local-cuisine',
        type: 'local',
        title: 'Local Cuisine',
        description: 'Authentic regional dishes and local flavors',
        icon: Soup,
        priceRange: '₹300 - ₹1,200',
        avgRating: 4.3,
        features: ['Authentic Recipes', 'Local Ingredients', 'Cultural Experience', 'Family-run'],
        cuisines: ['Regional', 'Traditional', 'Street Food', 'Home-style'],
        examples: ['Local Specialties', 'Traditional Thalis', 'Heritage Recipes', 'Regional Delicacies']
      },
      {
        id: 'street-food',
        type: 'street',
        title: 'Street Food & Casual',
        description: 'Popular street vendors and casual eateries',
        icon: Pizza,
        priceRange: '₹50 - ₹400',
        avgRating: 4.1,
        features: ['Quick Service', 'Affordable Prices', 'Local Favorites', 'Authentic Taste'],
        cuisines: ['Street Food', 'Snacks', 'Fast Food', 'Local Bites'],
        examples: ['Food Streets', 'Night Markets', 'Popular Stalls', 'Local Favorites']
      },
      {
        id: 'international',
        type: 'international',
        title: 'International Cuisine',
        description: 'Global flavors and international restaurants',
        icon: UtensilsCrossed,
        priceRange: '₹800 - ₹2,500',
        avgRating: 4.2,
        features: ['Diverse Menu', 'Quality Service', 'Modern Ambiance', 'Global Standards'],
        cuisines: ['Italian', 'Chinese', 'Thai', 'Mexican'],
        examples: ['Chain Restaurants', 'International Brands', 'Fusion Restaurants', 'Global Cuisine']
      },
      {
        id: 'seafood',
        type: 'seafood',
        title: 'Seafood & Coastal',
        description: 'Fresh seafood and coastal specialties',
        icon: Fish,
        priceRange: '₹600 - ₹2,000',
        avgRating: 4.4,
        features: ['Fresh Catch', 'Coastal Recipes', 'Seaside Dining', 'Local Fishing'],
        cuisines: ['Coastal', 'Seafood', 'Fish Curry', 'Grilled Fish'],
        examples: ['Beach Shacks', 'Harbor Restaurants', 'Fishing Villages', 'Coastal Specialties']
      },
      {
        id: 'vegetarian',
        type: 'vegetarian',
        title: 'Vegetarian & Healthy',
        description: 'Plant-based and health-conscious dining',
        icon: Salad,
        priceRange: '₹200 - ₹1,000',
        avgRating: 4.3,
        features: ['Fresh Ingredients', 'Healthy Options', 'Organic Produce', 'Nutritious Meals'],
        cuisines: ['Vegetarian', 'Vegan', 'Organic', 'Health Food'],
        examples: ['Pure Veg Restaurants', 'Health Cafes', 'Organic Restaurants', 'Salad Bars']
      }
    ];

    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-navy-100 mb-4">Culinary Experiences</h2>
          <p className="text-navy-300 mb-2">
            Discover amazing dining options in {formData.to?.name || 'your destination'}
          </p>
          <p className="text-navy-400 text-sm">
            Optional step - Select dining preferences that interest you or skip to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {diningCategories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedDining.some(d => d.id === category.id);
            
            return (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-6 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-900/30 border-teal-500/50 shadow-lg shadow-teal-500/20'
                    : 'bg-navy-900/20 border-navy-800/30 hover:bg-navy-800/30 hover:border-navy-700/50'
                }`}
                onClick={() => handleDiningSelection(category)}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="w-6 h-6 text-teal-400" />
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <div className={`inline-flex p-4 rounded-2xl mb-3 ${
                    isSelected ? 'bg-teal-500/20' : 'bg-navy-800/30'
                  }`}>
                    <IconComponent className={`w-8 h-8 ${
                      isSelected ? 'text-teal-300' : 'text-navy-300'
                    }`} />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isSelected ? 'text-teal-100' : 'text-navy-100'
                  }`}>
                    {category.title}
                  </h3>
                  <p className={`text-sm mb-3 ${
                    isSelected ? 'text-teal-300' : 'text-navy-300'
                  }`}>
                    {category.description}
                  </p>
                </div>

                {/* Price and Rating */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isSelected ? 'text-teal-300' : 'text-navy-400'}>
                      Price Range:
                    </span>
                    <span className={`font-medium ${isSelected ? 'text-teal-200' : 'text-navy-200'}`}>
                      {category.priceRange}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={isSelected ? 'text-teal-300' : 'text-navy-400'}>
                      Avg Rating:
                    </span>
                    <div className="flex items-center">
                      <Star className={`w-3 h-3 fill-current mr-1 ${
                        isSelected ? 'text-teal-400' : 'text-amber-400'
                      }`} />
                      <span className={`font-medium ${isSelected ? 'text-teal-200' : 'text-navy-200'}`}>
                        {category.avgRating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cuisines */}
                <div className="mb-4">
                  <h4 className={`text-sm font-medium mb-2 ${
                    isSelected ? 'text-teal-200' : 'text-navy-200'
                  }`}>
                    Popular Cuisines:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {category.cuisines.slice(0, 2).map((cuisine, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs rounded-md ${
                          isSelected 
                            ? 'bg-teal-800/30 text-teal-300' 
                            : 'bg-navy-800/50 text-navy-400'
                        }`}
                      >
                        {cuisine}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <h4 className={`text-sm font-medium mb-2 ${
                    isSelected ? 'text-teal-200' : 'text-navy-200'
                  }`}>
                    What to Expect:
                  </h4>
                  <div className="grid grid-cols-2 gap-1">
                    {category.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center text-xs">
                        <UtensilsCrossed className={`w-3 h-3 mr-1 ${
                          isSelected ? 'text-teal-400' : 'text-navy-400'
                        }`} />
                        <span className={isSelected ? 'text-teal-300' : 'text-navy-400'}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Dining Summary */}
        {selectedDining.length > 0 && (
          <div className="bg-teal-900/20 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/30 mb-6">
            <h3 className="text-lg font-semibold text-teal-100 mb-4">Your Dining Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDining.map((dining, index) => {
                const category = diningCategories.find(c => c.id === dining.id);
                if (!category) return null;
                
                const IconComponent = category.icon;
                return (
                  <div key={index} className="flex items-center bg-teal-800/20 rounded-lg p-4">
                    <div className="flex-shrink-0 mr-4">
                      <div className="p-2 bg-teal-700/30 rounded-lg">
                        <IconComponent className="w-6 h-6 text-teal-300" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-teal-100 mb-1">{category.title}</div>
                      <div className="text-sm text-teal-300 mb-1">{category.description}</div>
                      <div className="text-xs text-teal-400 flex items-center">
                        {category.priceRange} • 
                        <Star className="w-3 h-3 fill-current text-amber-400 mx-1" />
                        {category.avgRating}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-teal-800/30 rounded-lg">
              <div className="flex items-start">
                <Coffee className="w-5 h-5 text-teal-400 mr-2 mt-0.5" />
                <div className="text-sm text-teal-300">
                  <strong>Dining Tips:</strong> Make reservations for fine dining restaurants. 
                  Try local specialties and ask locals for their favorite hidden gems. 
                  Consider dietary restrictions and food allergies when exploring new cuisines.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skip Option */}
        <div className="text-center">
          <button
            onClick={() => {
              if (!completedSteps.includes('dining')) {
                setCompletedSteps(prev => [...prev, 'dining']);
              }
            }}
            className="text-navy-400 hover:text-navy-300 transition-colors text-sm"
          >
            Skip this step - I&apos;ll find restaurants on my own
          </button>
        </div>
      </div>
    );
  };

  const renderReviewStep = () => {
    return (
      <TripReview
        tripData={{
          from: formData.from ? { name: formData.from.name } : undefined,
          to: formData.to ? { name: formData.to.name } : undefined,
          startDate: formData.startDate,
          endDate: formData.endDate,
          travelers: formData.travelers,
          budget: formData.budget,
          tripType: formData.tripType,
          transport: selectedTransport,
          rental: selectedRentals,
          accommodation: selectedAccommodations,
          activities: selectedActivities,
          dining: selectedDining
        }}
        completedSteps={completedSteps}
        onEdit={handleStepChange}
        onSubmit={handleSubmit}
      />
    );
  };

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

      {/* AI Trip Optimizer - Floating Assistant */}
      {showOptimizer && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 max-w-sm w-full max-h-[80vh] overflow-hidden"
        >
          <div className="bg-navy-900/95 backdrop-blur-xl rounded-2xl border border-navy-800/50 shadow-2xl">
            {/* Optimizer Header */}
            <div className="p-4 border-b border-navy-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Star className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-navy-100">AI Assistant</h3>
                    <p className="text-xs text-navy-400">Trip Optimization</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setOptimizerCollapsed(!optimizerCollapsed)}
                    className="p-1 text-navy-400 hover:text-navy-300 transition-colors"
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${optimizerCollapsed ? '' : 'rotate-90'}`} />
                  </button>
                  <button
                    onClick={() => setShowOptimizer(false)}
                    className="p-1 text-navy-400 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Optimizer Content */}
            {!optimizerCollapsed && (
              <div className="p-4 max-h-96 overflow-y-auto">
                <TripOptimizer
                  tripData={{
                    destination: formData.to ? { name: formData.to.name } : undefined,
                    transport: selectedTransport,
                    accommodation: selectedAccommodations,
                    activities: selectedActivities,
                    dining: selectedDining,
                    dates: formData.startDate && formData.endDate ? {
                      start: formData.startDate,
                      end: formData.endDate
                    } : undefined,
                    travelers: formData.travelers,
                    budget: formData.budget
                  }}
                  onApplyOptimization={handleApplyOptimization}
                  className="text-sm"
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}