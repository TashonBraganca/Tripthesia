"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import { z } from "zod";
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Mic,
  Zap,
  Star,
  CheckCircle,
  Globe,
  Clock,
  Heart
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmartDestinationAutocomplete } from "@/components/smart-destination-autocomplete";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AISuggestionEngine } from "@/components/ai-suggestion-engine";
import { VoiceSearch } from "@/components/voice-search";
import { SmartDefaultsEngine } from "@/components/smart-defaults-engine";
import { cn } from "@/lib/utils";
import {
  slideVariants,
  buttonVariants,
  containerVariants,
  itemVariants,
  cardHoverVariants
} from "@/lib/motion";

// Enhanced form schema
const superTripWizardSchema = z.object({
  destination: z.string().min(2, "Please enter a destination"),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  endDate: z.date({
    required_error: "Please select an end date",
  }),
  travelers: z.number().min(1).max(20),
  budget: z.array(z.number()).length(2),
  travelStyles: z.array(z.string()).min(1, "Please select at least one travel style"),
  preferences: z.object({
    accommodation: z.enum(["budget", "mid-range", "luxury"]).optional(),
    transport: z.enum(["budget", "comfort", "premium"]).optional(),
    pace: z.enum(["relaxed", "moderate", "packed"]).optional(),
    group_type: z.enum(["solo", "couple", "family", "friends", "business"]).optional(),
  }).optional(),
});

type SuperTripWizardFormData = z.infer<typeof superTripWizardSchema>;

const ENHANCED_STEPS = [
  { 
    id: 1, 
    title: "Destination & Dates", 
    subtitle: "Where and when do you want to go?",
    icon: MapPin,
    fields: ["destination", "startDate", "endDate"],
    hasAI: true
  },
  { 
    id: 2, 
    title: "Travel Style", 
    subtitle: "What kind of experience are you seeking?",
    icon: Sparkles,
    fields: ["travelStyles"],
    hasAI: true
  },
  { 
    id: 3, 
    title: "Group & Budget", 
    subtitle: "Who's traveling and what's your budget?",
    icon: Users,
    fields: ["travelers", "budget", "preferences"],
    hasAI: true
  },
  { 
    id: 4, 
    title: "AI Magic", 
    subtitle: "Let AI create your perfect itinerary",
    icon: Zap,
    fields: [],
    hasAI: true
  },
];

interface SuperTripWizardProps {
  onSubmit: (data: SuperTripWizardFormData) => void;
  initialData?: Partial<SuperTripWizardFormData>;
}

export function SuperTripWizard({ onSubmit, initialData }: SuperTripWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [aiSuggestionProfile, setAISuggestionProfile] = useState({});

  const form = useForm<SuperTripWizardFormData>({
    resolver: zodResolver(superTripWizardSchema),
    defaultValues: {
      destination: initialData?.destination || "",
      travelers: initialData?.travelers || 2,
      budget: initialData?.budget || [100, 200],
      travelStyles: initialData?.travelStyles || [],
      preferences: {
        accommodation: "mid-range",
        transport: "comfort", 
        pace: "moderate",
        group_type: "couple",
        ...initialData?.preferences
      }
    }
  });

  const { watch, setValue, trigger } = form;
  const watchedValues = watch();

  // Update AI suggestion profile when form values change
  useEffect(() => {
    const [minBudget, maxBudget] = watchedValues.budget || [100, 200];
    const avgBudget = (minBudget + maxBudget) / 2;
    
    const profile = {
      budget: avgBudget,
      travelStyle: watchedValues.travelStyles,
      groupType: watchedValues.preferences?.group_type,
      duration: watchedValues.startDate && watchedValues.endDate 
        ? Math.ceil((watchedValues.endDate.getTime() - watchedValues.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 7
    };
    
    setAISuggestionProfile(profile);
  }, [watchedValues]);

  const nextStep = async () => {
    const currentStepFields = ENHANCED_STEPS[currentStep - 1].fields;
    const isValid = await trigger(currentStepFields as any);
    
    if (isValid && currentStep < ENHANCED_STEPS.length) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormSubmit = async (data: SuperTripWizardFormData) => {
    if (currentStep === ENHANCED_STEPS.length) {
      setIsGenerating(true);
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      onSubmit(data);
    }
  };

  const handleVoiceResult = (destination: string) => {
    setValue("destination", destination);
    setShowVoiceSearch(false);
  };

  const handleAISuggestion = (suggestion: any) => {
    setValue("destination", `${suggestion.name}, ${suggestion.country}`);
  };

  const handleSmartDefault = (defaultValue: any) => {
    switch (defaultValue.type) {
      case 'budget':
        setValue("budget", [defaultValue.value.min, defaultValue.value.max]);
        break;
      case 'duration':
        if (watchedValues.startDate) {
          setValue("endDate", addDays(watchedValues.startDate, defaultValue.value));
        }
        break;
      case 'group':
        setValue("travelers", defaultValue.value);
        setValue("preferences.group_type", defaultValue.value === 2 ? "couple" : "friends");
        break;
    }
  };

  const handleStyleSelect = (styles: string[]) => {
    setValue("travelStyles", styles);
  };

  const renderStep = () => {
    const step = ENHANCED_STEPS[currentStep - 1];
    
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Destination Input */}
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-emerald-500" />
                      Where do you want to go?
                    </FormLabel>
                    
                    <div className="space-y-4">
                      <Tabs value={showVoiceSearch ? "voice" : "type"} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger 
                            value="type" 
                            onClick={() => setShowVoiceSearch(false)}
                            className="gap-2"
                          >
                            <MapPin className="h-4 w-4" />
                            Type destination
                          </TabsTrigger>
                          <TabsTrigger 
                            value="voice" 
                            onClick={() => setShowVoiceSearch(true)}
                            className="gap-2"
                          >
                            <Mic className="h-4 w-4" />
                            Voice search
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="type">
                          <FormControl>
                            <SmartDestinationAutocomplete
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Try typing 'Tokyo' or 'Paris, France'"
                            />
                          </FormControl>
                        </TabsContent>
                        
                        <TabsContent value="voice">
                          <VoiceSearch
                            onResult={handleVoiceResult}
                            placeholder="Try saying 'Take me to Tokyo, Japan'"
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* AI Suggestions */}
            <motion.div variants={itemVariants}>
              <AISuggestionEngine
                profile={aiSuggestionProfile}
                onSuggestionSelect={handleAISuggestion}
              />
            </motion.div>

            {/* Date Selection */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Departure Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Return Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < watchedValues.startDate || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <SmartDefaultsEngine
                userContext={aiSuggestionProfile}
                onStyleSelect={handleStyleSelect}
                onDefaultApply={handleSmartDefault}
              />
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Travelers */}
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="travelers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      How many travelers?
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => field.onChange(Math.max(1, field.value - 1))}
                            disabled={field.value <= 1}
                          >
                            -
                          </Button>
                          <div className="text-center min-w-[100px]">
                            <div className="text-2xl font-bold">{field.value}</div>
                            <div className="text-sm text-muted-foreground">
                              {field.value === 1 ? "traveler" : "travelers"}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => field.onChange(Math.min(20, field.value + 1))}
                            disabled={field.value >= 20}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Budget Range */}
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      Daily budget per person
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-6">
                        <Slider
                          value={field.value}
                          onValueChange={field.onChange}
                          min={20}
                          max={1000}
                          step={10}
                          className="w-full"
                        />
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-lg px-4 py-2">
                            ${field.value[0]} - ${field.value[1]} per day
                          </Badge>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              Total budget estimate
                            </div>
                            <div className="text-lg font-semibold text-emerald-600">
                              ${Math.round(((field.value[0] + field.value[1]) / 2) * watchedValues.travelers * 
                                (watchedValues.startDate && watchedValues.endDate 
                                  ? Math.ceil((watchedValues.endDate.getTime() - watchedValues.startDate.getTime()) / (1000 * 60 * 60 * 24))
                                  : 7))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Quick Preferences */}
            <motion.div variants={itemVariants}>
              <h3 className="text-lg font-semibold mb-4">Travel Preferences (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-3 block">Accommodation Style</label>
                  <div className="space-y-2">
                    {[
                      { value: "budget", label: "Budget-friendly", desc: "Hostels, guesthouses" },
                      { value: "mid-range", label: "Comfort", desc: "3-4 star hotels" },
                      { value: "luxury", label: "Luxury", desc: "5-star resorts" }
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={watchedValues.preferences?.accommodation === option.value ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => setValue("preferences.accommodation", option.value as any)}
                      >
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.desc}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Trip Pace</label>
                  <div className="space-y-2">
                    {[
                      { value: "relaxed", label: "Relaxed", desc: "2-3 activities per day" },
                      { value: "moderate", label: "Moderate", desc: "3-4 activities per day" },
                      { value: "packed", label: "Action-packed", desc: "5+ activities per day" }
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={watchedValues.preferences?.pace === option.value ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => setValue("preferences.pace", option.value as any)}
                      >
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.desc}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center space-y-8"
          >
            {isGenerating ? (
              <motion.div variants={itemVariants}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 mx-auto mb-6"
                >
                  <Zap className="h-20 w-20 text-emerald-500" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-4">AI is creating your perfect trip...</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>🧠 Analyzing your preferences</p>
                  <p>🌍 Finding the best destinations</p>
                  <p>✈️ Optimizing flights and routes</p>
                  <p>🏨 Selecting perfect accommodations</p>
                  <p>🎯 Creating your personalized itinerary</p>
                </div>
              </motion.div>
            ) : (
              <>
                <motion.div variants={itemVariants} className="mb-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Ready to create your perfect trip!</h3>
                  <p className="text-muted-foreground text-lg">
                    Our AI will analyze your preferences and create a personalized itinerary
                  </p>
                </motion.div>

                {/* Trip Summary */}
                <motion.div variants={itemVariants}>
                  <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        Trip Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <MapPin className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                          <div className="text-sm text-muted-foreground">Destination</div>
                          <div className="font-semibold">{watchedValues.destination}</div>
                        </div>
                        <div>
                          <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                          <div className="text-sm text-muted-foreground">Duration</div>
                          <div className="font-semibold">
                            {watchedValues.startDate && watchedValues.endDate 
                              ? `${Math.ceil((watchedValues.endDate.getTime() - watchedValues.startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                              : "TBD"}
                          </div>
                        </div>
                        <div>
                          <Users className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                          <div className="text-sm text-muted-foreground">Travelers</div>
                          <div className="font-semibold">{watchedValues.travelers}</div>
                        </div>
                        <div>
                          <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
                          <div className="text-sm text-muted-foreground">Budget</div>
                          <div className="font-semibold">
                            ${watchedValues.budget[0]}-${watchedValues.budget[1]}/day
                          </div>
                        </div>
                      </div>
                      
                      {watchedValues.travelStyles.length > 0 && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">Travel Styles</div>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {watchedValues.travelStyles.map(style => (
                              <Badge key={style} variant="secondary" className="capitalize">
                                {style}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {ENHANCED_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                currentStep >= step.id
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-gray-300 text-gray-400"
              )}>
                {currentStep > step.id ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              
              <div className={cn(
                "ml-4 hidden sm:block",
                currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
              )}>
                <div className="text-sm font-medium flex items-center gap-2">
                  {step.title}
                  {step.hasAI && <Sparkles className="h-3 w-3 text-emerald-500" />}
                </div>
                <div className="text-xs">{step.subtitle}</div>
              </div>
              
              {index < ENHANCED_STEPS.length - 1 && (
                <div className={cn(
                  "w-12 h-0.5 mx-4 transition-all duration-300",
                  currentStep > step.id ? "bg-emerald-500" : "bg-gray-300"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
          <Card className="min-h-[600px]">
            <CardContent className="p-8">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={slideVariants.fromRight}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < ENHANCED_STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="gap-2 px-8"
                >
                  {isGenerating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Zap className="h-4 w-4" />
                      </motion.div>
                      Creating Trip...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Create My Perfect Trip
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}