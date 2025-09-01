/**
 * Smart Form Validation & User Guidance System
 * Provides real-time validation with helpful suggestions and contextual help
 */

import { LocationData } from '@/lib/data/locations';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  helpText?: string;
}

// Trip form data interface
export interface TripFormData {
  from?: LocationData | null;
  to?: LocationData | null;
  startDate?: string;
  endDate?: string;
  tripType?: string;
  budget?: number;
  currency?: string;
  travelers?: number;
}

// Validation rules
export const ValidationRules = {
  // Location validation
  validateLocation: (location: LocationData | null | undefined, fieldName: string): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!location) {
      result.isValid = false;
      result.errors.push(`${fieldName} is required`);
      result.helpText = `Please select a ${fieldName.toLowerCase()} from the dropdown`;
      return result;
    }

    // Check for valid coordinates
    if (!location.coordinates || location.coordinates.length !== 2) {
      result.warnings.push(`Location data may be incomplete for ${location.name}`);
    }

    // Suggest popular alternatives for less common destinations
    if (location.popularity && location.popularity < 30) {
      result.suggestions.push(`${location.name} is a unique destination! Consider checking travel requirements.`);
    }

    return result;
  },

  // Date validation
  validateDateRange: (startDate: string | undefined, endDate: string | undefined): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!startDate) {
      result.isValid = false;
      result.errors.push('Start date is required');
      return result;
    }

    if (!endDate) {
      result.isValid = false;
      result.errors.push('End date is required');
      return result;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      result.isValid = false;
      result.errors.push('Please enter valid dates');
      return result;
    }

    // Check if start date is in the past
    if (start < today) {
      result.isValid = false;
      result.errors.push('Start date cannot be in the past');
      return result;
    }

    // Check if end date is before start date
    if (end < start) {
      result.isValid = false;
      result.errors.push('End date must be after start date');
      return result;
    }

    // Check if dates are too close (less than 3 days notice)
    if (start < threeDaysFromNow) {
      result.warnings.push('Booking with less than 3 days notice may limit availability');
      result.suggestions.push('Consider flexible dates for better deals');
    }

    // Check trip duration
    const durationMs = end.getTime() - start.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    if (durationDays < 1) {
      result.warnings.push('Very short trip duration');
    } else if (durationDays > 30) {
      result.warnings.push('Long trip duration - consider breaking into multiple bookings');
    } else if (durationDays >= 7) {
      result.suggestions.push('Week-long trips often have better package deals available');
    }

    return result;
  },

  // Budget validation
  validateBudget: (budget: number | undefined, currency: string = 'INR'): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!budget || budget <= 0) {
      result.isValid = false;
      result.errors.push('Please enter a valid budget amount');
      return result;
    }

    // Budget recommendations based on currency
    const minBudgets = {
      INR: 5000,
      USD: 100,
      EUR: 90,
      GBP: 80
    };

    const recommendedBudgets = {
      INR: 25000,
      USD: 500,
      EUR: 450,
      GBP: 400
    };

    const minBudget = minBudgets[currency as keyof typeof minBudgets] || minBudgets.INR;
    const recommendedBudget = recommendedBudgets[currency as keyof typeof recommendedBudgets] || recommendedBudgets.INR;

    if (budget < minBudget) {
      result.warnings.push(`Budget seems low for international travel in ${currency}`);
      result.suggestions.push(`Consider a budget of at least ${minBudget} ${currency} for a comfortable trip`);
    } else if (budget >= recommendedBudget) {
      result.suggestions.push('Great budget! You\'ll have plenty of options for premium experiences');
    }

    return result;
  },

  // Trip type validation
  validateTripType: (tripType: string | undefined): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!tripType) {
      result.isValid = false;
      result.errors.push('Please select a trip type');
      result.helpText = 'Trip type helps us customize your itinerary';
      return result;
    }

    // Provide contextual tips based on trip type
    const tripTypeTips = {
      adventure: 'Adventure trips work best with flexible dates and good travel insurance',
      business: 'Business travel benefits from airport lounges and reliable transport',
      culture: 'Cultural trips are enhanced by local guides and heritage site passes',
      beach: 'Beach destinations have seasonal variations - check weather patterns',
      family: 'Family trips require kid-friendly accommodations and activities',
      foodie: 'Food tours and cooking classes enhance culinary experiences',
      mixed: 'Mixed trips offer variety but may require more planning time'
    };

    const tip = tripTypeTips[tripType as keyof typeof tripTypeTips];
    if (tip) {
      result.suggestions.push(tip);
    }

    return result;
  },

  // Travelers validation
  validateTravelers: (travelers: number | undefined): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!travelers || travelers < 1) {
      result.isValid = false;
      result.errors.push('Please specify number of travelers');
      return result;
    }

    if (travelers > 10) {
      result.warnings.push('Large group travel may require special arrangements');
      result.suggestions.push('Consider contacting us directly for groups over 10 people');
    } else if (travelers > 6) {
      result.suggestions.push('Group bookings often qualify for discounts');
    } else if (travelers === 1) {
      result.suggestions.push('Solo travel tip: Consider joining group tours for better experiences');
    }

    return result;
  }
};

// Smart validation suggestions based on form context
export const SmartSuggestions = {
  // Suggest improvements based on from/to combination
  getRouteSuggestions: (from: LocationData | null, to: LocationData | null): string[] => {
    const suggestions: string[] = [];

    if (!from || !to) return suggestions;

    // Same location warning
    if (from.name === to.name) {
      suggestions.push('🔄 Departure and destination are the same - did you mean to select a different location?');
      return suggestions;
    }

    // International travel suggestions
    if (from.countryCode !== to.countryCode) {
      suggestions.push('✈️ International travel detected - check visa requirements');
      suggestions.push('💱 Consider currency exchange options');
    }

    // Popular route suggestions
    const popularRoutes = [
      { from: 'Delhi', to: 'Dubai', tip: 'This route often has great deals on Emirates and Air India' },
      { from: 'Mumbai', to: 'London', tip: 'Direct flights available with British Airways and Virgin Atlantic' },
      { from: 'Bangalore', to: 'Singapore', tip: 'Short flight with excellent connectivity options' },
      { from: 'India', to: 'Thailand', tip: 'Visa on arrival available for Indian passport holders' }
    ];

    for (const route of popularRoutes) {
      if (from.name.includes(route.from) && to.name.includes(route.to)) {
        suggestions.push(`💡 ${route.tip}`);
        break;
      }
    }

    return suggestions;
  },

  // Date-based suggestions
  getDateSuggestions: (startDate: string | undefined, to: LocationData | null): string[] => {
    const suggestions: string[] = [];

    if (!startDate || !to) return suggestions;

    const start = new Date(startDate);
    const month = start.getMonth() + 1;

    // Seasonal suggestions for popular destinations
    const seasonalTips: Record<string, Record<number, string>> = {
      'Goa': {
        12: '🌴 Perfect time! Peak season with ideal weather',
        1: '🌴 Excellent weather but expect crowds',
        2: '🌴 Great weather, slightly less crowded',
        6: '🌧️ Monsoon season - consider rescheduling for better experience'
      },
      'Kerala': {
        12: '🌿 Post-monsoon freshness, ideal for backwaters',
        10: '🌿 Excellent weather after monsoons',
        6: '🌧️ Monsoon season - beautiful but travel may be challenging'
      },
      'Dubai': {
        12: '🏜️ Perfect weather for sightseeing',
        1: '🏜️ Ideal temperature for outdoor activities',
        7: '🌡️ Very hot - consider indoor attractions and evening activities'
      },
      'Thailand': {
        12: '🏝️ Cool and dry season - perfect timing',
        4: '🌡️ Hot season but fewer crowds',
        9: '🌧️ Rainy season - check weather forecasts'
      }
    };

    // Check if destination matches any seasonal destination
    for (const [destination, monthlyTips] of Object.entries(seasonalTips)) {
      if (to.name.includes(destination) || to.displayName.includes(destination)) {
        const tip = monthlyTips[month];
        if (tip) {
          suggestions.push(`🗓️ ${tip}`);
        }
        break;
      }
    }

    // General seasonal suggestions
    if (month >= 6 && month <= 9) {
      suggestions.push('🌧️ Monsoon season in many Asian destinations - pack accordingly');
    } else if (month >= 12 || month <= 2) {
      suggestions.push('❄️ Winter season - great for tropical destinations');
    }

    return suggestions;
  },

  // Budget optimization suggestions
  getBudgetSuggestions: (budget: number | undefined, currency: string, to: LocationData | null): string[] => {
    const suggestions: string[] = [];

    if (!budget || !to) return suggestions;

    // Cost level suggestions based on destination
    const costLevels = {
      'Singapore': 'high',
      'Dubai': 'high',
      'London': 'high',
      'Tokyo': 'high',
      'Thailand': 'low',
      'Vietnam': 'low',
      'India': 'low',
      'Nepal': 'low'
    };

    let costLevel = 'medium';
    for (const [destination, level] of Object.entries(costLevels)) {
      if (to.name.includes(destination) || to.displayName.includes(destination)) {
        costLevel = level;
        break;
      }
    }

    // Budget optimization tips
    if (costLevel === 'high') {
      suggestions.push('💰 High-cost destination - consider booking accommodations early for better rates');
      suggestions.push('🍽️ Look for local eateries to balance restaurant expenses');
    } else if (costLevel === 'low') {
      suggestions.push('💡 Budget-friendly destination - your money will go far!');
      suggestions.push('🏨 Consider upgrading accommodations for better comfort');
    }

    return suggestions;
  }
};

// Complete form validation
export const validateTripForm = (formData: TripFormData): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Validate individual fields
  const fromValidation = ValidationRules.validateLocation(formData.from, 'Departure location');
  const toValidation = ValidationRules.validateLocation(formData.to, 'Destination');
  const dateValidation = ValidationRules.validateDateRange(formData.startDate, formData.endDate);
  const tripTypeValidation = ValidationRules.validateTripType(formData.tripType);
  const travelersValidation = ValidationRules.validateTravelers(formData.travelers);

  // Combine results
  const validations = [fromValidation, toValidation, dateValidation, tripTypeValidation, travelersValidation];
  
  for (const validation of validations) {
    if (!validation.isValid) result.isValid = false;
    result.errors.push(...validation.errors);
    result.warnings.push(...validation.warnings);
    result.suggestions.push(...validation.suggestions);
  }

  // Add smart suggestions
  result.suggestions.push(...SmartSuggestions.getRouteSuggestions(formData.from || null, formData.to || null));
  result.suggestions.push(...SmartSuggestions.getDateSuggestions(formData.startDate, formData.to || null));
  
  if (formData.budget && formData.currency) {
    const budgetValidation = ValidationRules.validateBudget(formData.budget, formData.currency);
    if (!budgetValidation.isValid) result.isValid = false;
    result.errors.push(...budgetValidation.errors);
    result.warnings.push(...budgetValidation.warnings);
    result.suggestions.push(...budgetValidation.suggestions);
    result.suggestions.push(...SmartSuggestions.getBudgetSuggestions(formData.budget, formData.currency, formData.to || null));
  }

  return result;
};

// Real-time field validation hook
export const useFieldValidation = () => {
  const validateField = (fieldName: string, value: any, formData?: Partial<TripFormData>): ValidationResult => {
    switch (fieldName) {
      case 'from':
        return ValidationRules.validateLocation(value, 'Departure location');
      case 'to':
        return ValidationRules.validateLocation(value, 'Destination');
      case 'dateRange':
        return ValidationRules.validateDateRange(formData?.startDate, formData?.endDate);
      case 'tripType':
        return ValidationRules.validateTripType(value);
      case 'travelers':
        return ValidationRules.validateTravelers(value);
      case 'budget':
        return ValidationRules.validateBudget(value, formData?.currency);
      default:
        return { isValid: true, errors: [], warnings: [], suggestions: [] };
    }
  };

  return { validateField };
};

export default {
  ValidationRules,
  SmartSuggestions,
  validateTripForm,
  useFieldValidation
};