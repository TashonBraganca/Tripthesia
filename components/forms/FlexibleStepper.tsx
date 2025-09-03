'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plane, Car, Hotel, MapIcon, UtensilsCrossed, Check, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatedButton } from '@/components/effects/AnimatedButton';

interface StepDefinition {
  id: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<any>;
  description: string;
  required: boolean;
  validation?: (data: any) => string | null;
}

interface FlexibleStepperProps {
  steps?: StepDefinition[];
  currentStep: string;
  completedSteps: string[];
  formData: Record<string, any>;
  onStepChange: (stepId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit?: () => void;
  className?: string;
}

const defaultSteps: StepDefinition[] = [
  {
    id: 'destination',
    name: 'Destination',
    shortName: 'Where',
    icon: MapPin,
    description: 'Choose your travel destinations',
    required: true,
    validation: (data) => {
      if (!data.from || !data.to) return 'Departure and destination are required';
      return null;
    }
  },
  {
    id: 'transport',
    name: 'Transport',
    shortName: 'Travel',
    icon: Plane,
    description: 'Select your transportation',
    required: true,
    validation: (data) => {
      if (!data.transport?.mode) return 'Please select a transportation method';
      return null;
    }
  },
  {
    id: 'rental',
    name: 'Local Rides',
    shortName: 'Rides',
    icon: Car,
    description: 'Car rentals and local transport',
    required: false
  },
  {
    id: 'accommodation',
    name: 'Stay',
    shortName: 'Hotels',
    icon: Hotel,
    description: 'Hotels and accommodations',
    required: false
  },
  {
    id: 'activities',
    name: 'Activities',
    shortName: 'Do',
    icon: MapIcon,
    description: 'Things to do and see',
    required: false
  },
  {
    id: 'dining',
    name: 'Dining',
    shortName: 'Eat',
    icon: UtensilsCrossed,
    description: 'Restaurants and local cuisine',
    required: false
  }
];

export const FlexibleStepper: React.FC<FlexibleStepperProps> = ({
  steps = defaultSteps,
  currentStep,
  completedSteps,
  formData,
  onStepChange,
  onNext,
  onPrevious,
  onSubmit,
  className = ''
}) => {
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [showMobileSteps, setShowMobileSteps] = useState(false);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const currentStepData = steps[currentStepIndex];
  
  const getStepStatus = useCallback((stepId: string) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    
    // Check if step has validation errors
    const step = steps.find(s => s.id === stepId);
    if (step?.validation) {
      const error = step.validation(formData);
      if (error) return 'error';
    }
    
    return 'pending';
  }, [completedSteps, currentStep, steps, formData]);

  const canNavigateToStep = useCallback((stepId: string) => {
    // Always allow navigation to any step (flexible stepper)
    return true;
  }, []);

  const handleStepClick = useCallback((stepId: string) => {
    if (!canNavigateToStep(stepId) || stepId === currentStep) return;
    
    // Check for missing required fields in previous steps
    const requiredSteps = steps.filter(s => s.required);
    const missingRequiredData: string[] = [];
    
    requiredSteps.forEach(step => {
      if (step.validation) {
        const error = step.validation(formData);
        if (error) missingRequiredData.push(step.name);
      }
    });
    
    // Show warnings but still allow navigation
    if (missingRequiredData.length > 0) {
      setWarnings({
        [stepId]: `Missing required information: ${missingRequiredData.join(', ')}`
      });
      
      // Clear warning after 3 seconds
      setTimeout(() => {
        setWarnings(prev => ({ ...prev, [stepId]: '' }));
      }, 3000);
    }
    
    onStepChange(stepId);
    setShowMobileSteps(false);
  }, [canNavigateToStep, currentStep, steps, formData, onStepChange]);

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'teal';
      case 'current': return 'sky';
      case 'error': return 'red';
      default: return 'navy';
    }
  };

  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mobile Step Selector */}
      <div className="md:hidden">
        <AnimatedButton
          variant="outline"
          onClick={() => setShowMobileSteps(!showMobileSteps)}
          className="w-full justify-between"
          particles={false}
        >
          <span className="flex items-center space-x-2">
            <currentStepData.icon size={16} />
            <span>{currentStepData.name}</span>
          </span>
          <motion.div
            animate={{ rotate: showMobileSteps ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={16} />
          </motion.div>
        </AnimatedButton>
        
        <AnimatePresence>
          {showMobileSteps && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 bg-navy-800/50 rounded-xl border border-navy-600 overflow-hidden"
            >
              {steps.map((step) => {
                const status = getStepStatus(step.id);
                const color = getStepColor(status);
                const Icon = step.icon;
                
                return (
                  <motion.button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    className={`
                      w-full p-3 text-left transition-colors duration-200
                      ${status === 'current' ? `bg-${color}-400/10` : 'hover:bg-navy-700/50'}
                      border-b border-navy-700 last:border-b-0
                    `}
                    whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${status === 'completed' ? `bg-${color}-400 text-navy-900` : 
                            status === 'current' ? `bg-${color}-400/20 text-${color}-400` :
                            status === 'error' ? `bg-${color}-400/20 text-${color}-400` :
                            'bg-navy-600 text-navy-400'}
                        `}>
                          {status === 'completed' ? (
                            <Check size={14} />
                          ) : status === 'error' ? (
                            <AlertCircle size={14} />
                          ) : (
                            <Icon size={14} />
                          )}
                        </div>
                        <span className={`
                          font-medium
                          ${status === 'current' ? 'text-navy-100' : 'text-navy-300'}
                        `}>
                          {step.name}
                        </span>
                      </div>
                      {step.required && (
                        <span className="text-xs text-teal-400">Required</span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const color = getStepColor(status);
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center space-y-2 flex-1">
                  <motion.button
                    onClick={() => handleStepClick(step.id)}
                    className={`
                      relative w-12 h-12 rounded-full flex items-center justify-center
                      transition-all duration-300 cursor-pointer
                      ${status === 'completed' ? `bg-${color}-400 text-navy-900 shadow-lg shadow-${color}-400/30` :
                        status === 'current' ? `bg-${color}-400/20 text-${color}-400 ring-2 ring-${color}-400/50` :
                        status === 'error' ? `bg-${color}-400/20 text-${color}-400 ring-2 ring-${color}-400/50` :
                        'bg-navy-700 text-navy-400 hover:bg-navy-600'}
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {status === 'completed' ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <Check size={20} />
                      </motion.div>
                    ) : status === 'error' ? (
                      <motion.div
                        animate={{ 
                          rotate: [0, -10, 10, -10, 10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <AlertCircle size={20} />
                      </motion.div>
                    ) : (
                      <Icon size={20} />
                    )}
                    
                    {/* Step number badge */}
                    <div className={`
                      absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold
                      flex items-center justify-center
                      ${status === 'current' ? `bg-${color}-400 text-navy-900` : 
                        'bg-navy-600 text-navy-300'}
                    `}>
                      {index + 1}
                    </div>
                  </motion.button>
                  
                  <div className="text-center">
                    <p className={`
                      text-sm font-medium transition-colors duration-300
                      ${isActive ? 'text-navy-100' : 'text-navy-400'}
                    `}>
                      {step.shortName}
                    </p>
                    {step.required && (
                      <p className="text-xs text-teal-400">Required</p>
                    )}
                  </div>
                  
                  {/* Warning message */}
                  <AnimatePresence>
                    {warnings[step.id] && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-16 bg-amber-400/10 border border-amber-400/20 rounded-lg p-2 text-xs text-amber-400 max-w-48 text-center"
                      >
                        {warnings[step.id]}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-px mx-4">
                    <motion.div
                      className={`
                        h-full transition-colors duration-500
                        ${completedSteps.includes(step.id) ? 'bg-teal-400' : 'bg-navy-600'}
                      `}
                      initial={{ scaleX: 0 }}
                      animate={{ 
                        scaleX: completedSteps.includes(step.id) ? 1 : 0.3 
                      }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-6 border-t border-navy-700">
        <AnimatedButton
          variant="ghost"
          onClick={onPrevious}
          disabled={isFirstStep}
          className="flex items-center space-x-2"
          particles={false}
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </AnimatedButton>
        
        <div className="text-sm text-navy-400">
          Step {currentStepIndex + 1} of {steps.length}
        </div>
        
        {isLastStep ? (
          <AnimatedButton
            variant="primary"
            onClick={onSubmit}
            className="flex items-center space-x-2"
          >
            <span>Create Trip</span>
          </AnimatedButton>
        ) : (
          <AnimatedButton
            variant="primary"
            onClick={onNext}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </AnimatedButton>
        )}
      </div>
    </div>
  );
};

export default FlexibleStepper;