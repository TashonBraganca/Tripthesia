'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin,
  Calendar,
  Clock,
  Users,
  Plane,
  Hotel,
  Camera,
  DollarSign,
  CheckCircle,
  Edit,
  Share,
  Download,
  ArrowRight,
  Star,
  AlertTriangle,
  Sparkles,
  Heart,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { InteractiveCard } from '@/components/effects/InteractiveCard';
import { staggerContainer, staggerItem } from '@/lib/animations/variants';

// ==================== TYPES ====================

interface TripItinerary {
  overview: {
    destination: string;
    duration: number;
    travelers: number;
    dates: {
      start: string;
      end: string;
    };
    totalBudget: number;
    budgetBreakdown: {
      transport: number;
      accommodation: number;
      activities: number;
      estimated: number;
    };
  };
  timeline: ItineraryDay[];
  bookingSummary: {
    transport?: any;
    accommodation?: any;
    activities: any[];
    totalCost: number;
    savings?: number;
  };
  recommendations: {
    packing: string[];
    tips: string[];
    weather: string;
    currency: string;
  };
}

interface ItineraryDay {
  date: string;
  dayNumber: number;
  weather?: {
    temperature: string;
    condition: string;
    icon: string;
  };
  schedule: ItineraryItem[];
  meals?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  accommodation?: {
    name: string;
    checkIn?: string;
    checkOut?: string;
  };
}

interface ItineraryItem {
  id: string;
  type: 'transport' | 'activity' | 'meal' | 'accommodation' | 'free-time';
  time: string;
  title: string;
  description?: string;
  location?: string;
  duration?: string;
  price?: number;
  status: 'confirmed' | 'tentative' | 'optional';
  icon: any;
  color: string;
}

interface ReviewStepProps {
  className?: string;
}

// ==================== REVIEW STEP COMPONENT ====================

export const ReviewStep: React.FC<ReviewStepProps> = ({ className = '' }) => {
  const { 
    state, 
    updateFormData, 
    completeCurrentStep, 
    saveProgress, 
    resetWizard,
    getTripDuration
  } = useTripWizard();

  // Local state
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'booking'>('overview');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);

  // Generate comprehensive itinerary
  const itinerary: TripItinerary = useMemo(() => {
    const duration = getTripDuration() || 1;
    const startDate = new Date(state.formData.dates.startDate);
    const endDate = new Date(state.formData.dates.endDate);

    // Calculate budget breakdown
    const transportCost = state.formData.transport?.selectedFlight?.price || 
                         state.formData.transport?.selectedTransport?.price || 0;
    const accommodationCost = state.formData.accommodation?.selectedHotel?.price?.total || 0;
    const activitiesCost = (state.formData.activities || [])
      .reduce((sum, activity) => sum + (activity.price?.adult || 0), 0);
    const estimatedMisc = Math.round((transportCost + accommodationCost + activitiesCost) * 0.15);

    // Generate timeline
    const timeline: ItineraryDay[] = [];
    for (let i = 0; i < duration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      timeline.push(generateDayItinerary(currentDate, i + 1, state.formData, duration));
    }

    return {
      overview: {
        destination: state.formData.to?.name || 'Your Destination',
        duration,
        travelers: state.formData.travelers,
        dates: {
          start: startDate.toLocaleDateString(),
          end: endDate.toLocaleDateString()
        },
        totalBudget: state.formData.budget,
        budgetBreakdown: {
          transport: transportCost,
          accommodation: accommodationCost,
          activities: activitiesCost,
          estimated: estimatedMisc
        }
      },
      timeline,
      bookingSummary: {
        transport: state.formData.transport?.selectedFlight || state.formData.transport?.selectedTransport,
        accommodation: state.formData.accommodation?.selectedHotel,
        activities: state.formData.activities || [],
        totalCost: transportCost + accommodationCost + activitiesCost + estimatedMisc,
        savings: Math.round((transportCost + accommodationCost + activitiesCost) * 0.1)
      },
      recommendations: {
        packing: generatePackingList(state.formData.tripType, duration),
        tips: generateTravelTips(state.formData.to?.name || ''),
        weather: 'Mild temperatures expected, pack layers',
        currency: 'USD accepted, consider local currency exchange'
      }
    };
  }, [state.formData, getTripDuration]);

  // Handle trip finalization
  const handleFinalizeTrip = useCallback(async () => {
    setIsBooking(true);
    setBookingStep(0);

    try {
      // Simulate booking process
      const steps = ['Saving itinerary...', 'Processing bookings...', 'Confirming reservations...', 'Finalizing trip...'];
      
      for (let i = 0; i < steps.length; i++) {
        setBookingStep(i);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Complete the wizard
      await saveProgress();
      completeCurrentStep();
      
      // In a real app, this would redirect to a confirmation page
      console.log('Trip finalized successfully!');

    } catch (error) {
      console.error('Error finalizing trip:', error);
    } finally {
      setIsBooking(false);
    }
  }, [saveProgress, completeCurrentStep]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-navy-100">
          Review Your Trip
        </h2>
        <p className="text-navy-400 max-w-2xl mx-auto">
          Here&#39;s your complete itinerary for {itinerary.overview.destination}. 
          Review everything and finalize your booking when ready.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="flex bg-navy-800 rounded-lg p-1">
          {(['overview', 'timeline', 'booking'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-6 py-2 rounded-md font-medium transition-all duration-200 capitalize
                ${activeTab === tab
                  ? 'bg-teal-400 text-navy-900'
                  : 'text-navy-300 hover:text-navy-100'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Trip Overview Card */}
            <InteractiveCard variant="glass" className="p-6 bg-navy-800/60 border-navy-600">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <MapPin className="mx-auto mb-2 text-teal-400" size={24} />
                  <div className="font-semibold text-navy-100">{itinerary.overview.destination}</div>
                  <div className="text-sm text-navy-400">Destination</div>
                </div>
                <div className="text-center">
                  <Calendar className="mx-auto mb-2 text-teal-400" size={24} />
                  <div className="font-semibold text-navy-100">{itinerary.overview.duration} Days</div>
                  <div className="text-sm text-navy-400">{itinerary.overview.dates.start} - {itinerary.overview.dates.end}</div>
                </div>
                <div className="text-center">
                  <Users className="mx-auto mb-2 text-teal-400" size={24} />
                  <div className="font-semibold text-navy-100">{itinerary.overview.travelers} Travelers</div>
                  <div className="text-sm text-navy-400">Total guests</div>
                </div>
                <div className="text-center">
                  <DollarSign className="mx-auto mb-2 text-teal-400" size={24} />
                  <div className="font-semibold text-navy-100">${itinerary.bookingSummary.totalCost.toLocaleString()}</div>
                  <div className="text-sm text-navy-400">Estimated total</div>
                </div>
              </div>
            </InteractiveCard>

            {/* Budget Breakdown */}
            <InteractiveCard variant="glass" className="p-6 bg-navy-800/60 border-navy-600">
              <h3 className="text-lg font-semibold text-navy-100 mb-4 flex items-center gap-2">
                <DollarSign className="text-teal-400" size={20} />
                Budget Breakdown
              </h3>
              
              <div className="space-y-4">
                {[
                  { label: 'Transport', amount: itinerary.overview.budgetBreakdown.transport, color: 'bg-blue-500' },
                  { label: 'Accommodation', amount: itinerary.overview.budgetBreakdown.accommodation, color: 'bg-green-500' },
                  { label: 'Activities', amount: itinerary.overview.budgetBreakdown.activities, color: 'bg-purple-500' },
                  { label: 'Misc & Tips', amount: itinerary.overview.budgetBreakdown.estimated, color: 'bg-orange-500' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${item.color}`} />
                      <span className="text-navy-200">{item.label}</span>
                    </div>
                    <div className="font-medium text-navy-100">
                      ${item.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-navy-600 flex items-center justify-between font-semibold text-lg">
                  <span className="text-navy-100">Total</span>
                  <span className="text-teal-300">${itinerary.bookingSummary.totalCost.toLocaleString()}</span>
                </div>
                
                {itinerary.bookingSummary.savings && (
                  <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-400">
                      <Sparkles size={16} />
                      <span className="text-sm font-medium">
                        You saved ${itinerary.bookingSummary.savings.toLocaleString()} with our recommendations!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </InteractiveCard>

            {/* Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Packing List */}
              <InteractiveCard variant="glass" className="p-6 bg-navy-800/60 border-navy-600">
                <h3 className="text-lg font-semibold text-navy-100 mb-4 flex items-center gap-2">
                  <Heart className="text-red-400" size={20} />
                  Packing Essentials
                </h3>
                <div className="space-y-2">
                  {itinerary.recommendations.packing.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-navy-300">
                      <CheckCircle size={14} className="text-teal-400" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </InteractiveCard>

              {/* Travel Tips */}
              <InteractiveCard variant="glass" className="p-6 bg-navy-800/60 border-navy-600">
                <h3 className="text-lg font-semibold text-navy-100 mb-4 flex items-center gap-2">
                  <Zap className="text-yellow-400" size={20} />
                  Travel Tips
                </h3>
                <div className="space-y-3">
                  {itinerary.recommendations.tips.map((tip, index) => (
                    <div key={index} className="text-sm text-navy-300">
                      {tip}
                    </div>
                  ))}
                </div>
              </InteractiveCard>
            </div>
          </motion.div>
        )}

        {activeTab === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Timeline */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {itinerary.timeline.map((day, dayIndex) => (
                <motion.div key={day.date} variants={staggerItem}>
                  <InteractiveCard variant="glass" className="p-6 bg-navy-800/60 border-navy-600">
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-teal-400 text-navy-900 font-bold rounded-full w-10 h-10 flex items-center justify-center">
                          {day.dayNumber}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-navy-100">
                            Day {day.dayNumber}
                          </h3>
                          <p className="text-sm text-navy-400">{day.date}</p>
                        </div>
                      </div>
                      
                      {day.weather && (
                        <div className="text-center">
                          <div className="text-2xl mb-1">{day.weather.icon}</div>
                          <div className="text-sm text-navy-300">{day.weather.temperature}</div>
                          <div className="text-xs text-navy-400">{day.weather.condition}</div>
                        </div>
                      )}
                    </div>

                    {/* Day Schedule */}
                    <div className="space-y-3">
                      {day.schedule.map((item, itemIndex) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-4 p-3 bg-navy-700/40 rounded-lg"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <div className={`p-2 rounded-lg ${item.color}`}>
                              <item.icon size={16} className="text-white" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-teal-300">
                                {item.time}
                              </span>
                              {item.duration && (
                                <span className="text-xs text-navy-400">
                                  ({item.duration})
                                </span>
                              )}
                              {item.status === 'optional' && (
                                <span className="text-xs bg-orange-400/20 text-orange-300 px-2 py-1 rounded">
                                  Optional
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-navy-100 mb-1">
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="text-sm text-navy-400 mb-1">
                                {item.description}
                              </p>
                            )}
                            {item.location && (
                              <div className="flex items-center gap-1 text-xs text-navy-500">
                                <MapPin size={12} />
                                <span>{item.location}</span>
                              </div>
                            )}
                          </div>
                          
                          {item.price && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-navy-100">
                                ${item.price}
                              </div>
                              <div className="text-xs text-navy-400">per person</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Accommodation for the night */}
                    {day.accommodation && (
                      <div className="mt-4 pt-4 border-t border-navy-600">
                        <div className="flex items-center gap-2 text-sm text-navy-300">
                          <Hotel size={16} className="text-teal-400" />
                          <span>Staying at: <strong>{day.accommodation.name}</strong></span>
                        </div>
                      </div>
                    )}
                  </InteractiveCard>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'booking' && (
          <motion.div
            key="booking"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Booking Summary */}
            <InteractiveCard variant="glass" className="p-6 bg-navy-800/60 border-navy-600">
              <h3 className="text-lg font-semibold text-navy-100 mb-4 flex items-center gap-2">
                <ShieldCheck className="text-teal-400" size={20} />
                Booking Summary
              </h3>
              
              <div className="space-y-4">
                {/* Transport */}
                {itinerary.bookingSummary.transport && (
                  <div className="p-4 bg-navy-700/40 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Plane className="text-blue-400" size={20} />
                      <h4 className="font-medium text-navy-100">Transportation</h4>
                    </div>
                    <div className="text-sm text-navy-300">
                      {itinerary.bookingSummary.transport.name || 'Selected transport option'}
                    </div>
                    <div className="text-sm font-medium text-teal-300 mt-1">
                      ${itinerary.bookingSummary.transport.price?.toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Accommodation */}
                {itinerary.bookingSummary.accommodation && (
                  <div className="p-4 bg-navy-700/40 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Hotel className="text-green-400" size={20} />
                      <h4 className="font-medium text-navy-100">Accommodation</h4>
                    </div>
                    <div className="text-sm text-navy-300">
                      {itinerary.bookingSummary.accommodation.name}
                    </div>
                    <div className="text-sm font-medium text-teal-300 mt-1">
                      ${itinerary.bookingSummary.accommodation.price?.total.toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Activities */}
                {itinerary.bookingSummary.activities.length > 0 && (
                  <div className="p-4 bg-navy-700/40 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Camera className="text-purple-400" size={20} />
                      <h4 className="font-medium text-navy-100">
                        Activities ({itinerary.bookingSummary.activities.length})
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {itinerary.bookingSummary.activities.slice(0, 3).map((activity, index) => (
                        <div key={index} className="text-sm text-navy-300">
                          {activity.name} - ${activity.price?.adult}
                        </div>
                      ))}
                      {itinerary.bookingSummary.activities.length > 3 && (
                        <div className="text-sm text-navy-400">
                          +{itinerary.bookingSummary.activities.length - 3} more activities
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </InteractiveCard>

            {/* Terms and Conditions */}
            <InteractiveCard variant="glass" className="p-6 bg-navy-800/60 border-navy-600">
              <h3 className="text-lg font-semibold text-navy-100 mb-4">
                Terms & Conditions
              </h3>
              <div className="space-y-3 text-sm text-navy-300">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                  <span>All bookings are subject to availability and confirmation</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                  <span>Cancellation policies vary by provider and will be detailed in confirmation</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                  <span>Prices may change due to currency fluctuation or provider updates</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                  <span>Travel insurance is recommended for international trips</span>
                </div>
              </div>
            </InteractiveCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-navy-600">
        <div className="flex gap-3">
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-navy-700 text-navy-300 rounded-lg hover:bg-navy-600 transition-colors duration-200"
          >
            <Share size={18} />
            <span>Share</span>
          </button>
          
          <button
            onClick={() => {/* Download itinerary logic */}}
            className="flex items-center gap-2 px-4 py-2 bg-navy-700 text-navy-300 rounded-lg hover:bg-navy-600 transition-colors duration-200"
          >
            <Download size={18} />
            <span>Download</span>
          </button>
          
          <button
            onClick={() => {/* Edit trip logic */}}
            className="flex items-center gap-2 px-4 py-2 bg-navy-700 text-navy-300 rounded-lg hover:bg-navy-600 transition-colors duration-200"
          >
            <Edit size={18} />
            <span>Edit Trip</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => saveProgress()}
            className="px-6 py-3 bg-navy-700 text-navy-300 font-medium rounded-lg hover:bg-navy-600 transition-colors duration-200"
          >
            Save Draft
          </button>
          
          <button
            onClick={handleFinalizeTrip}
            disabled={isBooking}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-teal-400 to-teal-500 text-navy-900 font-bold rounded-lg hover:from-teal-300 hover:to-teal-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBooking ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={18} />
                </motion.div>
                <span>Finalizing...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Finalize Trip</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Booking Progress Modal */}
      <AnimatePresence>
        {isBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-900/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy-800 rounded-xl p-8 max-w-md w-full mx-4"
            >
              <div className="text-center space-y-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center"
                >
                  <Sparkles className="text-navy-900" size={32} />
                </motion.div>
                
                <div>
                  <h3 className="text-xl font-bold text-navy-100 mb-2">
                    Creating Your Perfect Trip
                  </h3>
                  <p className="text-navy-400">
                    {['Saving itinerary...', 'Processing bookings...', 'Confirming reservations...', 'Finalizing trip...'][bookingStep]}
                  </p>
                </div>

                <div className="w-full bg-navy-700 rounded-full h-2">
                  <motion.div
                    className="h-2 bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((bookingStep + 1) / 4) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper functions
function generateDayItinerary(date: Date, dayNumber: number, formData: any, totalDuration: number): ItineraryDay {
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Generate realistic schedule based on day
  let schedule: ItineraryItem[] = [];
  
  if (dayNumber === 1) {
    // Arrival day
    schedule = [
      {
        id: 'arrival',
        type: 'transport',
        time: '10:00 AM',
        title: 'Arrive at Destination',
        description: formData.transport?.selectedFlight?.airline || 'Transport to destination',
        location: formData.to?.name,
        duration: '2 hours',
        status: 'confirmed',
        icon: Plane,
        color: 'bg-blue-500'
      },
      {
        id: 'checkin',
        type: 'accommodation',
        time: '2:00 PM',
        title: 'Hotel Check-in',
        description: formData.accommodation?.selectedHotel?.name || 'Accommodation check-in',
        location: 'Hotel',
        status: 'confirmed',
        icon: Hotel,
        color: 'bg-green-500'
      },
      {
        id: 'explore',
        type: 'activity',
        time: '4:00 PM',
        title: 'Explore the Area',
        description: 'Get oriented and explore nearby attractions',
        duration: '3 hours',
        status: 'tentative',
        icon: Camera,
        color: 'bg-purple-500'
      }
    ];
  } else {
    // Regular day with activities
    const dayActivities = (formData.activities || []).slice((dayNumber - 2) % 3, (dayNumber - 2) % 3 + 2);
    
    schedule = [
      {
        id: 'breakfast',
        type: 'meal',
        time: '8:00 AM',
        title: 'Breakfast',
        description: 'Start your day with a local breakfast',
        location: 'Hotel or nearby cafe',
        duration: '1 hour',
        status: 'tentative',
        icon: Coffee,
        color: 'bg-orange-500',
        price: 15
      },
      ...dayActivities.map((activity: any, index: number) => ({
        id: activity.id,
        type: 'activity' as const,
        time: index === 0 ? '10:00 AM' : '2:00 PM',
        title: activity.name,
        description: activity.description,
        location: activity.location?.name,
        duration: activity.duration?.formatted || '2-3 hours',
        price: activity.price?.adult,
        status: 'confirmed' as const,
        icon: Camera,
        color: 'bg-purple-500'
      })),
      {
        id: 'dinner',
        type: 'meal',
        time: '7:00 PM',
        title: 'Dinner',
        description: 'Enjoy local cuisine',
        duration: '2 hours',
        status: 'optional',
        icon: Utensils,
        color: 'bg-red-500',
        price: 40
      }
    ];
  }

  return {
    date: dateStr,
    dayNumber,
    weather: {
      temperature: `${20 + Math.floor(Math.random() * 10)}°C`,
      condition: ['Sunny', 'Partly Cloudy', 'Clear'][Math.floor(Math.random() * 3)],
      icon: ['☀️', '⛅', '🌤️'][Math.floor(Math.random() * 3)]
    },
    schedule,
    accommodation: formData.accommodation?.selectedHotel ? {
      name: formData.accommodation.selectedHotel.name,
      checkIn: dayNumber === 1 ? '3:00 PM' : undefined,
      checkOut: dayNumber === totalDuration ? '11:00 AM' : undefined
    } : undefined
  };
}

function generatePackingList(tripType: string, duration: number): string[] {
  const baseItems = [
    'Comfortable walking shoes',
    'Weather-appropriate clothing',
    'Phone charger',
    'Travel documents',
    'Camera'
  ];

  const typeSpecificItems: Record<string, string[]> = {
    'adventure': ['Hiking boots', 'Rain jacket', 'Backpack', 'Water bottle'],
    'beach': ['Sunscreen', 'Swimwear', 'Beach towel', 'Sunglasses'],
    'business': ['Formal attire', 'Laptop', 'Business cards', 'Portable charger'],
    'culture': ['Comfortable shoes', 'Guidebook', 'Small bag', 'Respectful clothing']
  };

  const durationItems = duration > 7 ? ['Extra luggage', 'Laundry supplies'] : [];
  
  return [...baseItems, ...(typeSpecificItems[tripType] || []), ...durationItems];
}

function generateTravelTips(destination: string): string[] {
  return [
    `Research local customs and etiquette in ${destination}`,
    'Download offline maps and translation apps',
    'Notify your bank about travel plans',
    'Check visa requirements and passport expiry',
    'Purchase travel insurance for peace of mind',
    'Pack essential medications in carry-on luggage'
  ];
}

// Import missing components
const Coffee = Clock; // Placeholder
const Utensils = Users; // Placeholder

export default ReviewStep;