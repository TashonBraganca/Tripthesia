'use client';

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useCallback, 
  useEffect,
  useMemo,
  ReactNode
} from 'react';
import { LocationData } from '@/lib/data/locations';

// ==================== TYPES ====================

interface DateRange {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
}

interface TripFormData {
  from: LocationData | null;
  to: LocationData | null;
  dates: DateRange;
  tripType: string;
  travelers: number;
  budget: number;
  transport?: any;
  accommodation?: any;
  activities?: any[];
  dining?: any[];
}

type WizardStep = 
  | 'destination' 
  | 'dates' 
  | 'trip-type' 
  | 'transport' 
  | 'accommodation' 
  | 'activities' 
  | 'dining' 
  | 'review';

interface ValidationErrors {
  [key: string]: string | undefined;
}

interface TripWizardState {
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  formData: TripFormData;
  validationErrors: ValidationErrors;
  isLoading: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
}

type TripWizardAction =
  | { type: 'SET_CURRENT_STEP'; payload: WizardStep }
  | { type: 'COMPLETE_STEP'; payload: WizardStep }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<TripFormData> }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationErrors }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'MARK_SAVED'; payload: Date }
  | { type: 'RESET_WIZARD' };

// ==================== REDUCER ====================

const initialState: TripWizardState = {
  currentStep: 'destination',
  completedSteps: new Set(),
  formData: {
    from: null,
    to: null,
    dates: {
      startDate: '',
      endDate: ''
    },
    tripType: '',
    travelers: 2,
    budget: 50000
  },
  validationErrors: {},
  isLoading: false,
  isDirty: false,
  lastSaved: null
};

function tripWizardReducer(
  state: TripWizardState, 
  action: TripWizardAction
): TripWizardState {
  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload
      };

    case 'COMPLETE_STEP':
      const newCompletedSteps = new Set(state.completedSteps);
      newCompletedSteps.add(action.payload);
      return {
        ...state,
        completedSteps: newCompletedSteps
      };

    case 'UPDATE_FORM_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload
        },
        isDirty: true
      };

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_DIRTY':
      return {
        ...state,
        isDirty: action.payload
      };

    case 'MARK_SAVED':
      return {
        ...state,
        lastSaved: action.payload,
        isDirty: false
      };

    case 'RESET_WIZARD':
      return initialState;

    default:
      return state;
  }
}

// ==================== CONTEXT ====================

interface TripWizardContextValue {
  // State
  state: TripWizardState;
  
  // Navigation
  goToStep: (step: WizardStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  completeCurrentStep: () => void;
  
  // Form Management
  updateFormData: (data: Partial<TripFormData>) => void;
  resetWizard: () => void;
  
  // Validation
  validateCurrentStep: () => boolean;
  getStepValidation: (step: WizardStep) => boolean;
  
  // Persistence
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  
  // Computed values
  canProceedToStep: (step: WizardStep) => boolean;
  getStepProgress: () => number;
  getTripDuration: () => number | null;
}

const TripWizardContext = createContext<TripWizardContextValue | null>(null);

// ==================== PROVIDER ====================

interface TripWizardProviderProps {
  children: ReactNode;
}

export const TripWizardProvider: React.FC<TripWizardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(tripWizardReducer, initialState);

  // Step order definition
  const stepOrder: WizardStep[] = useMemo(() => [
    'destination',
    'dates', 
    'trip-type',
    'transport',
    'accommodation',
    'activities',
    'dining',
    'review'
  ], []);

  // ==================== NAVIGATION ====================

  const goToStep = useCallback((step: WizardStep) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  }, []);

  const goToNextStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      dispatch({ type: 'SET_CURRENT_STEP', payload: nextStep });
    }
  }, [state.currentStep, stepOrder]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex > 0) {
      const previousStep = stepOrder[currentIndex - 1];
      dispatch({ type: 'SET_CURRENT_STEP', payload: previousStep });
    }
  }, [state.currentStep, stepOrder]);

  const completeCurrentStep = useCallback(() => {
    if (validateCurrentStep()) {
      dispatch({ type: 'COMPLETE_STEP', payload: state.currentStep });
    }
  }, [state.currentStep]);

  // ==================== FORM MANAGEMENT ====================

  const updateFormData = useCallback((data: Partial<TripFormData>) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: data });
  }, []);

  const resetWizard = useCallback(() => {
    dispatch({ type: 'RESET_WIZARD' });
  }, []);

  // ==================== VALIDATION ====================

  const validateStep = useCallback((step: WizardStep): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    switch (step) {
      case 'destination':
        if (!state.formData.from) {
          errors.from = 'Please select your departure location';
          isValid = false;
        }
        if (!state.formData.to) {
          errors.to = 'Please select your destination';
          isValid = false;
        }
        if (state.formData.from && state.formData.to && state.formData.from.id === state.formData.to.id) {
          errors.destination = 'Departure and destination cannot be the same';
          isValid = false;
        }
        break;

      case 'dates':
        if (!state.formData.dates.startDate) {
          errors.startDate = 'Please select a start date';
          isValid = false;
        }
        if (!state.formData.dates.endDate) {
          errors.endDate = 'Please select an end date';
          isValid = false;
        }
        if (state.formData.dates.startDate && state.formData.dates.endDate) {
          const start = new Date(state.formData.dates.startDate);
          const end = new Date(state.formData.dates.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (start < today) {
            errors.startDate = 'Start date cannot be in the past';
            isValid = false;
          }
          if (end < start) {
            errors.endDate = 'End date cannot be before start date';
            isValid = false;
          }
        }
        break;

      case 'trip-type':
        if (!state.formData.tripType) {
          errors.tripType = 'Please select a trip type';
          isValid = false;
        }
        break;

      case 'transport':
        // Transport is optional for now
        break;

      case 'accommodation':
        // Accommodation is optional for now
        break;

      case 'activities':
        // Activities are optional for now
        break;

      case 'dining':
        // Dining is optional for now
        break;

      case 'review':
        // Review step validation would check all previous steps
        isValid = validateStep('destination') && 
                  validateStep('dates') && 
                  validateStep('trip-type');
        break;

      default:
        break;
    }

    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
    return isValid;
  }, [state.formData]);

  const validateCurrentStep = useCallback(() => {
    return validateStep(state.currentStep);
  }, [state.currentStep, validateStep]);

  const getStepValidation = useCallback((step: WizardStep) => {
    return validateStep(step);
  }, [validateStep]);

  // ==================== COMPUTED VALUES ====================

  const canProceedToStep = useCallback((targetStep: WizardStep): boolean => {
    const targetIndex = stepOrder.indexOf(targetStep);
    const currentIndex = stepOrder.indexOf(state.currentStep);

    // Can always go backward
    if (targetIndex <= currentIndex) return true;

    // Can only go forward if all previous steps are completed and valid
    for (let i = 0; i < targetIndex; i++) {
      const step = stepOrder[i];
      if (!state.completedSteps.has(step) || !validateStep(step)) {
        return false;
      }
    }

    return true;
  }, [state.currentStep, state.completedSteps, stepOrder, validateStep]);

  const getStepProgress = useCallback((): number => {
    const completedCount = state.completedSteps.size;
    const totalSteps = stepOrder.length;
    return Math.round((completedCount / totalSteps) * 100);
  }, [state.completedSteps.size, stepOrder.length]);

  const getTripDuration = useCallback((): number | null => {
    const { startDate, endDate } = state.formData.dates;
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [state.formData.dates]);

  // ==================== PERSISTENCE ====================

  const saveProgress = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Implement API call to save progress
      // const response = await fetch('/api/trips/draft', { ... });
      
      // For now, just simulate saving
      await new Promise(resolve => setTimeout(resolve, 500));
      
      dispatch({ type: 'MARK_SAVED', payload: new Date() });
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.formData, state.currentStep, state.completedSteps]);

  const loadProgress = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Implement API call to load progress
      // const response = await fetch('/api/trips/draft');
      // const data = await response.json();
      
      // For now, just simulate loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (state.isDirty) {
      const saveTimer = setTimeout(() => {
        saveProgress();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(saveTimer);
    }
  }, [state.isDirty, saveProgress]);

  // ==================== CONTEXT VALUE ====================

  const contextValue: TripWizardContextValue = useMemo(() => ({
    state,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    completeCurrentStep,
    updateFormData,
    resetWizard,
    validateCurrentStep,
    getStepValidation,
    saveProgress,
    loadProgress,
    canProceedToStep,
    getStepProgress,
    getTripDuration
  }), [
    state,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    completeCurrentStep,
    updateFormData,
    resetWizard,
    validateCurrentStep,
    getStepValidation,
    saveProgress,
    loadProgress,
    canProceedToStep,
    getStepProgress,
    getTripDuration
  ]);

  return (
    <TripWizardContext.Provider value={contextValue}>
      {children}
    </TripWizardContext.Provider>
  );
};

// ==================== HOOK ====================

export const useTripWizard = (): TripWizardContextValue => {
  const context = useContext(TripWizardContext);
  if (!context) {
    throw new Error('useTripWizard must be used within a TripWizardProvider');
  }
  return context;
};

// ==================== STEP CONFIGURATION ====================

export const WIZARD_STEPS: Record<WizardStep, {
  id: WizardStep;
  title: string;
  description: string;
  icon: string;
  isRequired: boolean;
}> = {
  destination: {
    id: 'destination',
    title: 'Where',
    description: 'Choose your departure and destination',
    icon: '📍',
    isRequired: true
  },
  dates: {
    id: 'dates',
    title: 'When',
    description: 'Select your travel dates',
    icon: '📅',
    isRequired: true
  },
  'trip-type': {
    id: 'trip-type',
    title: 'Type',
    description: 'What kind of trip are you planning?',
    icon: '🎯',
    isRequired: true
  },
  transport: {
    id: 'transport',
    title: 'Transport',
    description: 'How will you get there?',
    icon: '✈️',
    isRequired: false
  },
  accommodation: {
    id: 'accommodation',
    title: 'Stay',
    description: 'Where will you stay?',
    icon: '🏨',
    isRequired: false
  },
  activities: {
    id: 'activities',
    title: 'Do',
    description: 'What activities interest you?',
    icon: '🎉',
    isRequired: false
  },
  dining: {
    id: 'dining',
    title: 'Eat',
    description: 'Dining preferences and restaurants',
    icon: '🍽️',
    isRequired: false
  },
  review: {
    id: 'review',
    title: 'Review',
    description: 'Review and finalize your trip',
    icon: '✅',
    isRequired: true
  }
};

export default TripWizardProvider;