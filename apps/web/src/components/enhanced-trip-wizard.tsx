"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import { CalendarIcon, MapPin, Users, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { SmartDestinationAutocomplete } from "@/components/smart-destination-autocomplete";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { tripWizardSchema, TripWizardFormData } from "@/lib/validation";
import { cn } from "@/lib/utils";
import {
  pageVariants,
  slideVariants,
  buttonVariants,
  cardHoverVariants,
  containerVariants,
  itemVariants
} from "@/lib/motion";

// Simplified 4-step flow
const STEPS = [
  { 
    id: 1, 
    title: "Where & When", 
    subtitle: "Tell us your destination and dates",
    icon: MapPin,
    fields: ["destination", "dates"]
  },
  { 
    id: 2, 
    title: "Who & Budget", 
    subtitle: "Travelers and spending preferences",
    icon: Users,
    fields: ["travelers", "budget"]
  },
  { 
    id: 3, 
    title: "Trip Style", 
    subtitle: "Your preferences and interests",
    icon: Sparkles,
    fields: ["tripType", "preferences"]
  },
  { 
    id: 4, 
    title: "Review & Create", 
    subtitle: "Confirm details and generate your trip",
    icon: ArrowRight,
    fields: []
  },
];

const TRIP_TYPES = [
  { 
    value: "leisure", 
    label: "Leisure", 
    description: "Relaxation and sightseeing",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-900",
    emoji: "🏖️"
  },
  { 
    value: "business", 
    label: "Business", 
    description: "Work travel with free time",
    color: "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900",
    emoji: "💼"
  },
  { 
    value: "adventure", 
    label: "Adventure", 
    description: "Outdoor activities",
    color: "bg-green-50 border-green-200 hover:bg-green-100 text-green-900",
    emoji: "🏔️"
  },
  { 
    value: "cultural", 
    label: "Cultural", 
    description: "Museums and history",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-900",
    emoji: "🏛️"
  },
  { 
    value: "romantic", 
    label: "Romantic", 
    description: "Couples getaway",
    color: "bg-pink-50 border-pink-200 hover:bg-pink-100 text-pink-900",
    emoji: "💕"
  },
  { 
    value: "family", 
    label: "Family", 
    description: "Fun for all ages",
    color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-900",
    emoji: "👨‍👩‍👧‍👦"
  },
];

const INTERESTS = [
  "Food & Dining", "Museums", "Nightlife", "Shopping", "Nature", "History",
  "Art", "Sports", "Music", "Architecture", "Photography", "Local Culture"
];

const ACCOMMODATION_TYPES = [
  { value: "budget", label: "Budget", description: "Hostels & basic hotels", range: "$20-80/night" },
  { value: "mid-range", label: "Mid-range", description: "3-4 star hotels", range: "$80-200/night" },
  { value: "luxury", label: "Luxury", description: "5 star & resorts", range: "$200+/night" },
];

interface EnhancedTripWizardProps {
  onSubmit?: (data: TripWizardFormData) => void;
}

export function EnhancedTripWizard({ onSubmit }: EnhancedTripWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const form = useForm<TripWizardFormData>({
    resolver: zodResolver(tripWizardSchema),
    defaultValues: {
      travelers: { adults: 2, children: 0 },
      budget: { amount: 2000, currency: "USD" },
      preferences: {
        accommodationType: "mid-range",
        transportMode: "walking",
        interests: [],
        dietaryRestrictions: [],
        mobility: "none",
      },
    },
  });

  const nextStep = async () => {
    const currentStepData = STEPS[currentStep - 1];
    let isValid = true;

    // Validate current step fields
    if (currentStepData.fields.length > 0) {
      isValid = await form.trigger(currentStepData.fields as any);
    }

    if (isValid && currentStep < STEPS.length) {
      setDirection('forward');
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection('backward');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (data: TripWizardFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Creating trip with data:", data);
      onSubmit?.(data);
      // TODO: Navigate to trip generation page
    } catch (error) {
      console.error("Failed to create trip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepData = STEPS[currentStep - 1];
  const Icon = currentStepData.icon;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Progress bar */}
        <div className="relative mb-6">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 relative z-10",
                      isActive && "border-primary bg-primary text-primary-foreground scale-110",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      !isActive && !isCompleted && "border-muted-foreground/30 bg-background text-muted-foreground"
                    )}
                    whileHover={{ scale: isActive ? 1.15 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <StepIcon className="h-5 w-5" />
                  </motion.div>
                  
                  {index < STEPS.length - 1 && (
                    <div className="flex-1 mx-4 h-0.5 bg-muted-foreground/20 relative">
                      <motion.div
                        className="h-full bg-primary origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isCompleted ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step title and subtitle */}
        <div className="text-center">
          <motion.h1 
            key={currentStep}
            className="text-3xl font-bold mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {currentStepData.title}
          </motion.h1>
          <motion.p 
            key={`${currentStep}-subtitle`}
            className="text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {currentStepData.subtitle}
          </motion.p>
        </div>
      </motion.div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {/* Step content with slide animations */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants.fromLeft}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Card className="glass border border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>Step {currentStep} of {STEPS.length}</CardTitle>
                      <CardDescription>{currentStepData.subtitle}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {renderStepContent()}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <motion.div 
            className="flex justify-between mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              variants={buttonVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="min-w-[120px]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            </motion.div>
            
            {currentStep === STEPS.length ? (
              <motion.div
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="min-w-[140px] bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      Create Trip
                      <Sparkles className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <Button 
                  type="button" 
                  onClick={nextStep}
                  className="min-w-[120px]"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </form>
      </Form>
    </div>
  );

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Destination */}
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Where are you going?</FormLabel>
                    <FormControl>
                      <SmartDestinationAutocomplete 
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Search destinations, cities, countries..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Dates */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dates.from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Date</FormLabel>
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
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
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
                  name="dates.to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return Date</FormLabel>
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
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const fromDate = form.getValues("dates.from");
                              return date < new Date() || (fromDate && date <= fromDate);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Travelers */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="travelers.adults"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adults</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          className="text-center"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="travelers.children"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Children</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          className="text-center"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>

            {/* Budget */}
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="budget.amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Total Budget: <span className="text-primary font-bold">${field.value?.toLocaleString()}</span>
                    </FormLabel>
                    <FormControl>
                      <div className="px-3">
                        <Slider
                          min={50}
                          max={50000}
                          step={50}
                          value={[field.value || 2000]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="w-full"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      This includes accommodation, activities, and meals
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Trip Type */}
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="tripType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">What type of trip is this?</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {TRIP_TYPES.map((type) => (
                          <motion.div
                            key={type.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <label
                              className={cn(
                                "flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                                type.color,
                                field.value === type.value 
                                  ? "border-primary ring-2 ring-primary/20" 
                                  : "border-transparent hover:border-primary/30"
                              )}
                            >
                              <input
                                type="radio"
                                value={type.value}
                                checked={field.value === type.value}
                                onChange={field.onChange}
                                className="sr-only"
                              />
                              <div className="text-2xl mb-2">{type.emoji}</div>
                              <div className="font-medium text-sm">{type.label}</div>
                              <div className="text-xs text-center opacity-75">{type.description}</div>
                            </label>
                          </motion.div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Accommodation */}
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="preferences.accommodationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accommodation Preference</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-3">
                        {ACCOMMODATION_TYPES.map((type) => (
                          <motion.label
                            key={type.value}
                            className={cn(
                              "flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all text-center",
                              field.value === type.value 
                                ? "border-primary bg-primary/5 text-primary" 
                                : "border-border hover:border-primary/50"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <input
                              type="radio"
                              value={type.value}
                              checked={field.value === type.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="sr-only"
                            />
                            <div className="font-medium text-sm mb-1">{type.label}</div>
                            <div className="text-xs opacity-75 mb-1">{type.description}</div>
                            <div className="text-xs font-medium">{type.range}</div>
                          </motion.label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Interests */}
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="preferences.interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What interests you? (Select all that apply)</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {INTERESTS.map((interest) => {
                          const isSelected = field.value?.includes(interest) || false;
                          return (
                            <motion.div
                              key={interest}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Badge
                                variant={isSelected ? "default" : "outline"}
                                className={cn(
                                  "cursor-pointer transition-colors",
                                  isSelected 
                                    ? "bg-primary hover:bg-primary/80" 
                                    : "hover:bg-primary/10 hover:text-primary hover:border-primary"
                                )}
                                onClick={() => {
                                  const currentInterests = field.value || [];
                                  if (isSelected) {
                                    field.onChange(currentInterests.filter(i => i !== interest));
                                  } else {
                                    field.onChange([...currentInterests, interest]);
                                  }
                                }}
                              >
                                {interest}
                              </Badge>
                            </motion.div>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          </motion.div>
        );

      case 4:
        const formData = form.getValues();
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <h3 className="text-lg font-semibold mb-4">Review Your Trip Details</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">DESTINATION</h4>
                    <p className="font-medium">{formData.destination?.name || "Not selected"}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">DATES</h4>
                    <p className="font-medium">
                      {formData.dates?.from && formData.dates?.to
                        ? `${format(formData.dates.from, "MMM dd")} - ${format(formData.dates.to, "MMM dd, yyyy")}`
                        : "Not selected"}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">TRAVELERS</h4>
                    <p className="font-medium">
                      {formData.travelers.adults} adults
                      {formData.travelers.children > 0 && `, ${formData.travelers.children} children`}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">BUDGET</h4>
                    <p className="font-medium">${formData.budget.amount.toLocaleString()} {formData.budget.currency}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">TRIP TYPE</h4>
                    <p className="font-medium capitalize">{formData.tripType || "Not selected"}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">ACCOMMODATION</h4>
                    <p className="font-medium capitalize">{formData.preferences.accommodationType}</p>
                  </div>
                </div>
              </div>
              
              {formData.preferences.interests && formData.preferences.interests.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">INTERESTS</h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.preferences.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  }
}