"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, Users, DollarSign, MapPin, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { DestinationAutocomplete } from "@/components/destination-autocomplete";
import { tripWizardSchema, TripWizardFormData } from "@/lib/validation";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Destination", icon: MapPin, description: "Where would you like to go?" },
  { id: 2, title: "Dates", icon: CalendarIcon, description: "When are you traveling?" },
  { id: 3, title: "Travelers", icon: Users, description: "Who's coming along?" },
  { id: 4, title: "Budget", icon: DollarSign, description: "What's your budget?" },
  { id: 5, title: "Preferences", icon: Settings, description: "Tell us your preferences" },
];

const TRIP_TYPES = [
  { value: "leisure", label: "Leisure", description: "Relaxation and sightseeing" },
  { value: "business", label: "Business", description: "Work travel with some free time" },
  { value: "adventure", label: "Adventure", description: "Outdoor activities and exploration" },
  { value: "cultural", label: "Cultural", description: "Museums, history, and local culture" },
  { value: "romantic", label: "Romantic", description: "Couples getaway" },
  { value: "family", label: "Family", description: "Fun for all ages" },
];

const INTERESTS = [
  "Food & Dining", "Museums", "Nightlife", "Shopping", "Nature", "History",
  "Art", "Sports", "Music", "Architecture", "Photography", "Local Culture"
];

export function TripWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: TripWizardFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Trip data:", data);
      // TODO: Submit to trip creation API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    } catch (error) {
      console.error("Failed to create trip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepData = STEPS[currentStep - 1];
  const Icon = currentStepData.icon;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-4 h-0.5 w-12 transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
          <p className="text-muted-foreground">{currentStepData.description}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Step {currentStep} of {STEPS.length}</CardTitle>
                  <CardDescription>{currentStepData.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep === STEPS.length ? (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Trip..." : "Create Trip"}
              </Button>
            ) : (
              <Button type="button" onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <DestinationAutocomplete />
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dates.from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departure Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
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
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="budget.amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget: ${field.value?.toLocaleString()}</FormLabel>
                  <FormControl>
                    <Slider
                      min={50}
                      max={50000}
                      step={50}
                      value={[field.value || 2000]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    This includes accommodation, activities, and meals
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tripType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trip type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIP_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferences.accommodationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accommodation</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="budget">Budget (Hostels, Basic Hotels)</SelectItem>
                          <SelectItem value="mid-range">Mid-range (3-4 Star Hotels)</SelectItem>
                          <SelectItem value="luxury">Luxury (5 Star Hotels, Resorts)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferences.transportMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Transport</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walking">Walking</SelectItem>
                          <SelectItem value="public">Public Transport</SelectItem>
                          <SelectItem value="taxi">Taxi/Rideshare</SelectItem>
                          <SelectItem value="rental">Rental Car</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="preferences.interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests (Select all that apply)</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-2">
                      {INTERESTS.map((interest) => (
                        <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value?.includes(interest) || false}
                            onChange={(e) => {
                              const currentInterests = field.value || [];
                              if (e.target.checked) {
                                field.onChange([...currentInterests, interest]);
                              } else {
                                field.onChange(currentInterests.filter(i => i !== interest));
                              }
                            }}
                            className="rounded border-input"
                          />
                          <span className="text-sm">{interest}</span>
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  }
}