"use client";

// Add Speech Recognition type declarations for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Plane,
  Clock,
  DollarSign,
  Star,
  ChevronRight,
  Wand2,
  Mic,
  MicOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SmartTripAssistant } from "@/lib/smart-trip-assistant";
import { trackEvent } from "@/lib/monitoring";
import {
  containerVariants,
  itemVariants,
  cardHoverVariants,
  buttonVariants,
  textRevealVariants,
  statusVariants
} from "@/lib/motion";

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  location: string;
  type: "transport" | "activity" | "accommodation" | "food";
  price?: string;
  rating?: number;
  duration?: string;
}

const DEMO_DESTINATIONS = [
  { name: "Tokyo", country: "Japan", flag: "🇯🇵" },
  { name: "Paris", country: "France", flag: "🇫🇷" },
  { name: "New York", country: "USA", flag: "🇺🇸" },
  { name: "London", country: "UK", flag: "🇬🇧" },
  { name: "Dubai", country: "UAE", flag: "🇦🇪" },
  { name: "Bali", country: "Indonesia", flag: "🇮🇩" },
];

const SAMPLE_ITINERARY: ItineraryItem[] = [
  {
    id: "1",
    time: "09:00",
    title: "Flight to Tokyo",
    location: "Narita International Airport",
    type: "transport",
    price: "$1,200",
    duration: "14h 30m"
  },
  {
    id: "2", 
    time: "11:30",
    title: "Tokyo Skytree Visit",
    location: "Sumida, Tokyo",
    type: "activity",
    price: "$25",
    rating: 4.8,
    duration: "2h"
  },
  {
    id: "3",
    time: "14:00",
    title: "Traditional Sushi Experience", 
    location: "Ginza District",
    type: "food",
    price: "$80",
    rating: 4.9,
    duration: "1.5h"
  },
  {
    id: "4",
    time: "19:00",
    title: "Park Hyatt Tokyo",
    location: "Shinjuku, Tokyo", 
    type: "accommodation",
    price: "$450/night",
    rating: 4.7
  }
];

const TYPING_RESPONSES = [
  "Analyzing your preferences...",
  "Finding the best flights...",
  "Discovering unique experiences...",
  "Optimizing your itinerary...",
  "Adding local recommendations..."
];

export function InteractiveDemoWidget() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDestination, setSelectedDestination] = useState<typeof DEMO_DESTINATIONS[0] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [aiItinerary, setAiItinerary] = useState<ItineraryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const steps: DemoStep[] = [
    {
      id: 0,
      title: "Choose Destination",
      description: "Where would you like to go?",
      icon: <MapPin className="h-5 w-5" />,
      completed: selectedDestination !== null
    },
    {
      id: 1,
      title: "Set Dates",
      description: "When are you traveling?",
      icon: <Calendar className="h-5 w-5" />,
      completed: currentStep > 1
    },
    {
      id: 2,
      title: "Generate Plan",
      description: "AI creates your perfect itinerary",
      icon: <Sparkles className="h-5 w-5" />,
      completed: showItinerary
    }
  ];

  // Typing animation effect
  useEffect(() => {
    if (isGenerating && typingIndex < TYPING_RESPONSES.length) {
      const currentText = TYPING_RESPONSES[typingIndex];
      let charIndex = 0;
      
      const typeChar = () => {
        if (charIndex <= currentText.length) {
          setTypingText(currentText.slice(0, charIndex));
          charIndex++;
          setTimeout(typeChar, 50);
        } else {
          setTimeout(() => {
            setTypingIndex(prev => prev + 1);
          }, 800);
        }
      };
      
      typeChar();
    }
  }, [isGenerating, typingIndex]);

  const handleDestinationSelect = (destination: typeof DEMO_DESTINATIONS[0]) => {
    setSelectedDestination(destination);
    setTimeout(() => setCurrentStep(1), 500);
  };

  const handleGenerateItinerary = async () => {
    setCurrentStep(2);
    setIsGenerating(true);
    setTypingIndex(0);
    setError(null);
    
    try {
      // Track demo interaction
      trackEvent('demo_generation_started', {
        destination: selectedDestination?.name,
        step: 'ai_generation'
      });

      // Create trip parameters for AI
      const tripParams = {
        destinations: selectedDestination?.name || 'Tokyo',
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-22'),
        travelers: 2,
        budget: 2500,
        interests: ['culture', 'food', 'sightseeing']
      };

      // Use real AI service for demo
      const recommendation = await SmartTripAssistant.generateTripRecommendation(tripParams);
      
      if (recommendation && recommendation.itinerary) {
        // Convert AI response to our demo format
        const enhancedItinerary = recommendation.itinerary.days[0]?.activities.slice(0, 4).map((activity, index) => ({
          id: `ai_${index}`,
          time: `${9 + index * 2}:00`,
          title: activity.title,
          location: activity.location,
          type: activity.category === 'transport' ? 'transport' : 
                activity.category === 'accommodation' ? 'accommodation' :
                activity.category === 'food' ? 'food' : 'activity',
          price: activity.estimated_cost ? `$${activity.estimated_cost}` : undefined,
          rating: 4.5 + Math.random() * 0.5,
          duration: activity.duration || '2h'
        })) || SAMPLE_ITINERARY;

        setAiItinerary(enhancedItinerary);
        
        // Simulate typing delay then show results
        setTimeout(() => {
          setIsGenerating(false);
          setShowItinerary(true);
          trackEvent('demo_generation_completed', {
            destination: selectedDestination?.name,
            itinerary_items: enhancedItinerary.length
          });
        }, 3000);
      } else {
        // Fallback to sample data
        setTimeout(() => {
          setIsGenerating(false);
          setShowItinerary(true);
          setAiItinerary(SAMPLE_ITINERARY);
        }, 3000);
      }
    } catch (error) {
      console.error('Demo AI generation error:', error);
      setError('AI service temporarily unavailable. Showing sample itinerary.');
      
      // Show sample data after brief delay
      setTimeout(() => {
        setIsGenerating(false);
        setShowItinerary(true);
        setAiItinerary(SAMPLE_ITINERARY);
      }, 2000);
    }
  };

  const getTypeIcon = (type: ItineraryItem['type']) => {
    switch (type) {
      case 'transport': return <Plane className="h-4 w-4 text-sky-500" />;
      case 'activity': return <Star className="h-4 w-4 text-amber-500" />;
      case 'food': return <span className="text-lg">🍜</span>;
      case 'accommodation': return <span className="text-lg">🏨</span>;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: ItineraryItem['type']) => {
    switch (type) {
      case 'transport': return 'border-l-sky-500 bg-sky-50/50';
      case 'activity': return 'border-l-amber-500 bg-amber-50/50';
      case 'food': return 'border-l-orange-500 bg-orange-50/50';
      case 'accommodation': return 'border-l-emerald-500 bg-emerald-50/50';
      default: return 'border-l-gray-500 bg-gray-50/50';
    }
  };

  // Voice search functionality
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice search not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      trackEvent('demo_voice_search_started');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      
      // Find matching destination
      const matchedDestination = DEMO_DESTINATIONS.find(dest => 
        transcript.includes(dest.name.toLowerCase()) || 
        transcript.includes(dest.country.toLowerCase())
      );

      if (matchedDestination) {
        handleDestinationSelect(matchedDestination);
        trackEvent('demo_voice_search_success', {
          transcript,
          destination: matchedDestination.name
        });
      } else {
        setError(`Sorry, "${transcript}" is not available in the demo. Try: Tokyo, Paris, New York, London, Dubai, or Bali.`);
        trackEvent('demo_voice_search_no_match', { transcript });
      }
      
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError('Voice search error. Please try again.');
      setIsListening(false);
      trackEvent('demo_voice_search_error', { error: event.error });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl border-0 overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-sky-50/30">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-sky-500 p-6 text-white">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Wand2 className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold">AI Travel Planner Demo</h3>
            </motion.div>
            <motion.p variants={itemVariants} className="text-white/90">
              See how Tripthesia creates your perfect itinerary in seconds
            </motion.p>
          </motion.div>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                  step.completed || currentStep >= index
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-gray-300 text-gray-400"
                )}>
                  {step.completed ? (
                    <motion.div
                      variants={statusVariants}
                      initial="initial"
                      animate="success"
                    >
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    step.icon
                  )}
                </div>
                
                <div className={cn(
                  "hidden sm:block",
                  step.completed || currentStep >= index ? "text-foreground" : "text-muted-foreground"
                )}>
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs">{step.description}</div>
                </div>
                
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Destination Selection */}
            {currentStep === 0 && (
              <motion.div
                key="destination-step"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div variants={itemVariants} className="mb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">Choose your dream destination</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleVoiceSearch}
                      disabled={isListening}
                      className={cn(
                        "gap-2 transition-all",
                        isListening && "bg-red-50 border-red-200 text-red-600"
                      )}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          Listening...
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          Voice Search
                        </>
                      )}
                    </Button>
                  </div>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </motion.div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DEMO_DESTINATIONS.map((destination, index) => (
                    <motion.button
                      key={destination.name}
                      variants={itemVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => handleDestinationSelect(destination)}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all duration-200 text-left",
                        selectedDestination?.name === destination.name
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                      )}
                    >
                      <div className="text-2xl mb-1">{destination.flag}</div>
                      <div className="font-medium text-sm">{destination.name}</div>
                      <div className="text-xs text-muted-foreground">{destination.country}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Date Selection */}
            {currentStep === 1 && (
              <motion.div
                key="dates-step"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.h4 variants={itemVariants} className="text-lg font-semibold mb-4">
                  When would you like to visit {selectedDestination?.flag} {selectedDestination?.name}?
                </motion.h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium">Departure Date</label>
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <Calendar className="h-4 w-4 inline mr-2 text-muted-foreground" />
                      <span className="text-sm">March 15, 2024</span>
                    </div>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium">Return Date</label>
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <Calendar className="h-4 w-4 inline mr-2 text-muted-foreground" />
                      <span className="text-sm">March 22, 2024</span>
                    </div>
                  </motion.div>
                </div>
                
                <motion.div variants={itemVariants}>
                  <Button 
                    onClick={handleGenerateItinerary}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate My Itinerary
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Step 3: Generation & Results */}
            {currentStep === 2 && (
              <motion.div
                key="generation-step"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {isGenerating ? (
                  <motion.div variants={itemVariants} className="text-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 mx-auto mb-4 text-emerald-500"
                    >
                      <Sparkles className="h-12 w-12" />
                    </motion.div>
                    <motion.h4 
                      variants={textRevealVariants}
                      className="text-lg font-semibold mb-2"
                    >
                      Creating your perfect trip...
                    </motion.h4>
                    <motion.p 
                      key={typingText}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-emerald-600 font-medium"
                    >
                      {typingText}
                    </motion.p>
                  </motion.div>
                ) : showItinerary ? (
                  <motion.div variants={containerVariants}>
                    <motion.div variants={itemVariants} className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Sparkles className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h4 className="text-lg font-semibold">Your Tokyo Itinerary</h4>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          7 Days
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">AI-optimized for culture, food, and adventure</p>
                    </motion.div>
                    
                    <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                      {(aiItinerary.length > 0 ? aiItinerary : SAMPLE_ITINERARY).map((item, index) => (
                        <motion.div
                          key={item.id}
                          variants={itemVariants}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            "p-4 rounded-lg border-l-4 transition-all duration-200",
                            getTypeColor(item.type)
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getTypeIcon(item.type)}
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-medium text-sm">{item.title}</h5>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {item.time}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <MapPin className="h-3 w-3" />
                                <span>{item.location}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                {item.price && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>{item.price}</span>
                                  </div>
                                )}
                                {item.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500" />
                                    <span>{item.rating}</span>
                                  </div>
                                )}
                                {item.duration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{item.duration}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <motion.div variants={itemVariants} className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setCurrentStep(0);
                          setSelectedDestination(null);
                          setShowItinerary(false);
                          setIsGenerating(false);
                          setTypingIndex(0);
                        }}
                      >
                        Try Another Destination
                      </Button>
                      <Button className="flex-1 gap-2">
                        Start Full Planner
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}