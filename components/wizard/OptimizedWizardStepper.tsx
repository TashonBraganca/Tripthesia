'use client';

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { useTripWizard, WIZARD_STEPS, type WizardStep } from '@/contexts/TripWizardContext';

interface OptimizedWizardStepperProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  showProgress?: boolean;
}

const StepIndicator = memo<{
  step: WizardStep;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isAccessible: boolean;
  onClick: () => void;
}>(({ step, index, isActive, isCompleted, isAccessible, onClick }) => {
  const stepConfig = WIZARD_STEPS[step];

  return (
    <motion.div
      className={`
        relative flex items-center justify-center w-10 h-10 rounded-full
        transition-all duration-300 cursor-pointer
        ${isActive 
          ? 'bg-teal-400 text-navy-900 ring-4 ring-teal-400/30 scale-110' 
          : isCompleted
            ? 'bg-green-500 text-white'
            : isAccessible
              ? 'bg-navy-700 text-navy-300 hover:bg-navy-600 hover:text-navy-200'
              : 'bg-navy-800 text-navy-500 cursor-not-allowed'
        }
      `}
      onClick={isAccessible ? onClick : undefined}
      whileHover={isAccessible ? { scale: 1.05 } : undefined}
      whileTap={isAccessible ? { scale: 0.95 } : undefined}
      layout
    >
      <AnimatePresence mode="wait">
        {isCompleted ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <Check size={16} />
          </motion.div>
        ) : !isAccessible && !isActive ? (
          <motion.div
            key="lock"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Lock size={14} />
          </motion.div>
        ) : (
          <motion.span
            key="number"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-sm font-semibold"
          >
            {stepConfig.icon}
          </motion.span>
        )}
      </AnimatePresence>
      
      {/* Step label */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center">
        <div className={`
          text-xs font-medium whitespace-nowrap
          ${isActive ? 'text-teal-300' : 'text-navy-400'}
        `}>
          {stepConfig.title}
        </div>
        {stepConfig.isRequired && (
          <div className="text-xs text-teal-400 mt-1">*</div>
        )}
      </div>
    </motion.div>
  );
});

StepIndicator.displayName = 'StepIndicator';

const StepConnector = memo<{
  isCompleted: boolean;
  isActive: boolean;
  orientation: 'horizontal' | 'vertical';
}>(({ isCompleted, isActive, orientation }) => (
  <div className={`
    ${orientation === 'horizontal' 
      ? 'w-12 h-0.5 mx-2' 
      : 'h-12 w-0.5 my-2 ml-5'
    }
    relative overflow-hidden bg-navy-700 rounded-full
  `}>
    <motion.div
      className={`
        absolute inset-0 rounded-full
        ${isCompleted 
          ? 'bg-green-500' 
          : isActive 
            ? 'bg-gradient-to-r from-teal-400 to-transparent' 
            : 'bg-navy-600'
        }
      `}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: isCompleted || isActive ? 1 : 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      style={{ transformOrigin: 'left' }}
    />
  </div>
));

StepConnector.displayName = 'StepConnector';

export const OptimizedWizardStepper = memo<OptimizedWizardStepperProps>(({
  className = '',
  orientation = 'horizontal',
  showLabels = true,
  showProgress = true
}) => {
  const { state, goToStep, canProceedToStep, getStepProgress } = useTripWizard();
  
  const stepEntries = Object.entries(WIZARD_STEPS) as [WizardStep, typeof WIZARD_STEPS[WizardStep]][];
  const progressPercentage = getStepProgress();

  return (
    <div className={`relative ${className}`}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-navy-200">
              Trip Planning Progress
            </span>
            <span className="text-sm text-teal-400 font-semibold">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-navy-800 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-400 via-teal-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          </div>
        </div>
      )}

      {/* Step Indicators */}
      <div className={`
        flex items-start
        ${orientation === 'horizontal' 
          ? 'flex-row overflow-x-auto pb-16' 
          : 'flex-col space-y-4'
        }
      `}>
        {stepEntries.map(([stepId, stepConfig], index) => {
          const isActive = state.currentStep === stepId;
          const isCompleted = state.completedSteps.has(stepId);
          const isAccessible = canProceedToStep(stepId);
          const isLast = index === stepEntries.length - 1;

          return (
            <React.Fragment key={stepId}>
              <div className="relative flex-shrink-0">
                <StepIndicator
                  step={stepId}
                  index={index}
                  isActive={isActive}
                  isCompleted={isCompleted}
                  isAccessible={isAccessible}
                  onClick={() => goToStep(stepId)}
                />
              </div>
              
              {!isLast && (
                <StepConnector
                  isCompleted={isCompleted}
                  isActive={isActive}
                  orientation={orientation}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current Step Description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-6 text-center"
        >
          <h3 className="text-lg font-semibold text-navy-100 mb-2">
            {WIZARD_STEPS[state.currentStep].title}
          </h3>
          <p className="text-sm text-navy-400">
            {WIZARD_STEPS[state.currentStep].description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Validation Errors Summary */}
      {Object.keys(state.validationErrors).length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 p-3 bg-red-400/10 border border-red-400/20 rounded-lg"
        >
          <div className="text-sm text-red-400">
            <div className="font-medium mb-1">Please fix the following issues:</div>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(state.validationErrors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Auto-save Status */}
      {state.lastSaved && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center text-xs text-navy-500">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Last saved: {state.lastSaved.toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
});

OptimizedWizardStepper.displayName = 'OptimizedWizardStepper';

export default OptimizedWizardStepper;