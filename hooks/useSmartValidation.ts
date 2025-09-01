'use client';

import { useState, useEffect, useCallback } from 'react';
import { ValidationResult, validateTripForm, useFieldValidation, TripFormData } from '@/lib/validation/formValidation';
import { debounce } from 'lodash';

export interface SmartValidationState {
  formValidation: ValidationResult;
  fieldValidations: Record<string, ValidationResult>;
  isFormValid: boolean;
  completedFields: number;
  totalFields: number;
  lastValidatedAt: Date | null;
}

export const useSmartValidation = (formData: TripFormData) => {
  const [validationState, setValidationState] = useState<SmartValidationState>({
    formValidation: { isValid: true, errors: [], warnings: [], suggestions: [] },
    fieldValidations: {},
    isFormValid: false,
    completedFields: 0,
    totalFields: 6, // from, to, dates, tripType, travelers, budget
    lastValidatedAt: null
  });

  const { validateField } = useFieldValidation();

  // Debounced validation function
  const debouncedValidation = useCallback(
    debounce((data: TripFormData) => {
      const formValidation = validateTripForm(data);
      
      // Validate individual fields
      const fieldValidations: Record<string, ValidationResult> = {};
      
      if (data.from) {
        fieldValidations.from = validateField('from', data.from);
      }
      
      if (data.to) {
        fieldValidations.to = validateField('to', data.to);
      }
      
      if (data.startDate && data.endDate) {
        fieldValidations.dateRange = validateField('dateRange', null, data);
      }
      
      if (data.tripType) {
        fieldValidations.tripType = validateField('tripType', data.tripType);
      }
      
      if (data.travelers) {
        fieldValidations.travelers = validateField('travelers', data.travelers);
      }
      
      if (data.budget) {
        fieldValidations.budget = validateField('budget', data.budget, data);
      }

      // Calculate completed fields
      const completed = [
        data.from ? 1 : 0,
        data.to ? 1 : 0,
        (data.startDate && data.endDate) ? 1 : 0,
        data.tripType ? 1 : 0,
        data.travelers ? 1 : 0,
        data.budget ? 1 : 0
      ].reduce((sum, val) => sum + val, 0);

      setValidationState({
        formValidation,
        fieldValidations,
        isFormValid: formValidation.isValid && Object.values(fieldValidations).every(v => v.isValid),
        completedFields: completed,
        totalFields: 6,
        lastValidatedAt: new Date()
      });
    }, 300),
    [validateField]
  );

  // Trigger validation when form data changes
  useEffect(() => {
    debouncedValidation(formData);
    
    // Cleanup on unmount
    return () => {
      debouncedValidation.cancel();
    };
  }, [formData, debouncedValidation]);

  // Validate specific field immediately (for blur events)
  const validateFieldImmediate = useCallback((fieldName: string, value: any) => {
    const validation = validateField(fieldName, value, formData);
    
    setValidationState(prev => ({
      ...prev,
      fieldValidations: {
        ...prev.fieldValidations,
        [fieldName]: validation
      }
    }));
    
    return validation;
  }, [validateField, formData]);

  // Get validation for specific field
  const getFieldValidation = useCallback((fieldName: string): ValidationResult => {
    return validationState.fieldValidations[fieldName] || 
           { isValid: true, errors: [], warnings: [], suggestions: [] };
  }, [validationState.fieldValidations]);

  // Check if field has any validation messages
  const hasFieldMessages = useCallback((fieldName: string): boolean => {
    const validation = getFieldValidation(fieldName);
    return validation.errors.length > 0 || 
           validation.warnings.length > 0 || 
           validation.suggestions.length > 0;
  }, [getFieldValidation]);

  // Get field status (valid, error, warning)
  const getFieldStatus = useCallback((fieldName: string): 'valid' | 'error' | 'warning' | 'neutral' => {
    const validation = getFieldValidation(fieldName);
    
    if (validation.errors.length > 0) return 'error';
    if (validation.warnings.length > 0) return 'warning';
    if (!validation.isValid) return 'error';
    
    // Check if field has value and is valid
    const hasValue = Boolean(formData[fieldName as keyof TripFormData]);
    return hasValue && validation.isValid ? 'valid' : 'neutral';
  }, [getFieldValidation, formData]);

  // Get form completion percentage
  const getCompletionPercentage = useCallback((): number => {
    return Math.round((validationState.completedFields / validationState.totalFields) * 100);
  }, [validationState.completedFields, validationState.totalFields]);

  // Get all form suggestions combined
  const getAllSuggestions = useCallback((): string[] => {
    const allSuggestions: string[] = [];
    
    // Add form-level suggestions
    allSuggestions.push(...validationState.formValidation.suggestions);
    
    // Add field-level suggestions
    Object.values(validationState.fieldValidations).forEach(validation => {
      allSuggestions.push(...validation.suggestions);
    });
    
    // Remove duplicates
    return Array.from(new Set(allSuggestions));
  }, [validationState]);

  // Reset validation state
  const resetValidation = useCallback(() => {
    setValidationState({
      formValidation: { isValid: true, errors: [], warnings: [], suggestions: [] },
      fieldValidations: {},
      isFormValid: false,
      completedFields: 0,
      totalFields: 6,
      lastValidatedAt: null
    });
  }, []);

  return {
    validationState,
    validateFieldImmediate,
    getFieldValidation,
    hasFieldMessages,
    getFieldStatus,
    getCompletionPercentage,
    getAllSuggestions,
    resetValidation,
    
    // Computed values for easy access
    isFormValid: validationState.isFormValid,
    hasErrors: validationState.formValidation.errors.length > 0,
    hasWarnings: validationState.formValidation.warnings.length > 0,
    hasSuggestions: getAllSuggestions().length > 0,
    completionPercentage: getCompletionPercentage()
  };
};