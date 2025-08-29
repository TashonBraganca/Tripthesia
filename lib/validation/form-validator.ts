/**
 * Comprehensive form validation system with step-by-step validation
 */

import { z } from 'zod';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
  canProceed: boolean;
}

export interface FormStep {
  id: string;
  name: string;
  required: boolean;
  schema: z.ZodSchema;
  dependencies?: string[]; // Steps that must be completed first
}

/**
 * Trip planning form validation schemas
 */

// Destination validation
export const destinationSchema = z.object({
  destinations: z.array(z.object({
    city: z.string().min(2, 'City name must be at least 2 characters').max(100, 'City name too long'),
    country: z.string().min(2, 'Country name must be at least 2 characters').max(100, 'Country name too long'),
    lat: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
    lng: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  })).min(1, 'At least one destination is required').max(10, 'Maximum 10 destinations allowed'),
});

// Date validation
export const dateSchema = z.object({
  startDate: z.string().refine((date) => {
    const startDate = new Date(date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return startDate >= tomorrow;
  }, 'Start date must be at least tomorrow'),
  
  endDate: z.string(),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Trip preferences validation
export const preferencesSchema = z.object({
  tripType: z.enum(['leisure', 'business', 'adventure', 'cultural'], {
    errorMap: () => ({ message: 'Please select a valid trip type' }),
  }),
  
  budgetTotal: z.number()
    .min(100, 'Budget must be at least $100')
    .max(100000, 'Budget cannot exceed $100,000')
    .optional(),
    
  budgetCurrency: z.enum(['INR', 'USD', 'EUR', 'GBP'], {
    errorMap: () => ({ message: 'Please select a valid currency' }),
  }).default('USD'),
  
  travelers: z.number()
    .min(1, 'At least 1 traveler required')
    .max(20, 'Maximum 20 travelers allowed')
    .int('Number of travelers must be a whole number'),
});

// Advanced preferences validation
export const advancedPreferencesSchema = z.object({
  budgetBand: z.enum(['low', 'med', 'high']).optional(),
  pace: z.enum(['chill', 'standard', 'packed']).optional(),
  mobility: z.enum(['walk', 'public', 'car']).optional(),
  
  preferences: z.object({
    cuisine: z.array(z.string()).optional(),
    dietary: z.array(z.string()).optional(),
    activities: z.array(z.string()).optional(),
    accommodation: z.array(z.string()).optional(),
    mustVisit: z.array(z.string()).optional(),
    avoid: z.array(z.string()).optional(),
  }).optional(),
});

// Complete trip validation
export const completeTripSchema = destinationSchema
  .merge(dateSchema)
  .merge(preferencesSchema)
  .merge(advancedPreferencesSchema)
  .extend({
    title: z.string()
      .min(3, 'Trip title must be at least 3 characters')
      .max(160, 'Trip title cannot exceed 160 characters')
      .refine((title) => title.trim().length > 0, 'Trip title cannot be empty'),
  });

/**
 * Form step definitions for trip planning
 */
export const tripPlanningSteps: FormStep[] = [
  {
    id: 'destination',
    name: 'Destinations',
    required: true,
    schema: destinationSchema,
  },
  {
    id: 'dates',
    name: 'Travel Dates',
    required: true,
    schema: dateSchema,
    dependencies: ['destination'],
  },
  {
    id: 'preferences',
    name: 'Trip Preferences',
    required: true,
    schema: preferencesSchema,
    dependencies: ['destination', 'dates'],
  },
  {
    id: 'advanced',
    name: 'Advanced Preferences',
    required: false,
    schema: advancedPreferencesSchema,
    dependencies: ['preferences'],
  },
];

/**
 * Multi-step form validator
 */
export class FormValidator {
  private steps: FormStep[];
  private completedSteps: Set<string>;
  private formData: Record<string, any>;

  constructor(steps: FormStep[]) {
    this.steps = steps;
    this.completedSteps = new Set();
    this.formData = {};
  }

  /**
   * Validate a specific step
   */
  validateStep(stepId: string, data: any): ValidationResult {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) {
      return {
        isValid: false,
        errors: { step: 'Invalid step' },
        canProceed: false,
      };
    }

    // Check dependencies
    const unmetDependencies = step.dependencies?.filter(dep => !this.completedSteps.has(dep)) || [];
    if (unmetDependencies.length > 0) {
      return {
        isValid: false,
        errors: { dependencies: `Please complete: ${unmetDependencies.join(', ')}` },
        canProceed: false,
      };
    }

    // Validate with schema
    const result = step.schema.safeParse(data);
    
    if (result.success) {
      this.completedSteps.add(stepId);
      this.formData[stepId] = data;
      
      return {
        isValid: true,
        errors: {},
        canProceed: true,
      };
    }

    // Parse validation errors
    const errors: Record<string, string> = {};
    result.error.errors.forEach(error => {
      const path = error.path.join('.');
      errors[path] = error.message;
    });

    return {
      isValid: false,
      errors,
      canProceed: false,
    };
  }

  /**
   * Validate all completed steps
   */
  validateAll(): ValidationResult {
    const allErrors: Record<string, string> = {};
    let isValid = true;

    for (const step of this.steps) {
      if (step.required && !this.completedSteps.has(step.id)) {
        allErrors[step.id] = `${step.name} is required`;
        isValid = false;
      }
    }

    // Validate final combined data
    try {
      const combinedData = { ...this.formData };
      const finalResult = completeTripSchema.safeParse(combinedData);
      
      if (!finalResult.success) {
        finalResult.error.errors.forEach(error => {
          const path = error.path.join('.');
          allErrors[path] = error.message;
        });
        isValid = false;
      }
    } catch (error) {
      allErrors.validation = 'Form validation failed';
      isValid = false;
    }

    return {
      isValid,
      errors: allErrors,
      canProceed: isValid,
    };
  }

  /**
   * Check if user can proceed to next step
   */
  canProceedFromStep(currentStepId: string): boolean {
    const currentStep = this.steps.find(s => s.id === currentStepId);
    if (!currentStep) return false;

    // Must complete current step if required
    if (currentStep.required && !this.completedSteps.has(currentStepId)) {
      return false;
    }

    return true;
  }

  /**
   * Get next available step
   */
  getNextStep(currentStepId: string): FormStep | null {
    const currentIndex = this.steps.findIndex(s => s.id === currentStepId);
    if (currentIndex === -1 || currentIndex === this.steps.length - 1) {
      return null;
    }

    return this.steps[currentIndex + 1];
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    const requiredSteps = this.steps.filter(s => s.required);
    const completedRequired = requiredSteps.filter(s => this.completedSteps.has(s.id));
    
    if (requiredSteps.length === 0) return 100;
    return Math.round((completedRequired.length / requiredSteps.length) * 100);
  }

  /**
   * Get validation warnings for current data
   */
  getWarnings(): Record<string, string> {
    const warnings: Record<string, string> = {};

    // Check for common issues that aren't errors but could be improved
    if (this.formData.dates) {
      const startDate = new Date(this.formData.dates.startDate);
      const endDate = new Date(this.formData.dates.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      
      if (daysDiff > 30) {
        warnings.duration = 'Long trips (>30 days) may require more planning time';
      } else if (daysDiff < 3) {
        warnings.duration = 'Short trips may have limited itinerary options';
      }
    }

    if (this.formData.preferences?.budgetTotal) {
      const budget = this.formData.preferences.budgetTotal;
      const travelers = this.formData.preferences?.travelers || 1;
      const perPerson = budget / travelers;
      
      if (perPerson < 500) {
        warnings.budget = 'Low budget may limit accommodation and activity options';
      }
    }

    return warnings;
  }

  /**
   * Reset validator state
   */
  reset(): void {
    this.completedSteps.clear();
    this.formData = {};
  }

  /**
   * Get current form data
   */
  getData(): Record<string, any> {
    return { ...this.formData };
  }

  /**
   * Get completion status
   */
  getCompletionStatus(): { completed: string[]; remaining: string[] } {
    const completed = Array.from(this.completedSteps);
    const remaining = this.steps
      .filter(s => s.required && !this.completedSteps.has(s.id))
      .map(s => s.id);

    return { completed, remaining };
  }
}