'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, Lightbulb, HelpCircle } from 'lucide-react';
import { ValidationResult } from '@/lib/validation/formValidation';

interface SmartValidationProps {
  validation: ValidationResult;
  showSuggestions?: boolean;
  className?: string;
}

export const SmartValidation: React.FC<SmartValidationProps> = ({
  validation,
  showSuggestions = true,
  className = ''
}) => {
  const hasContent = validation.errors.length > 0 || 
                    validation.warnings.length > 0 || 
                    (showSuggestions && validation.suggestions.length > 0) ||
                    validation.helpText;

  if (!hasContent) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`space-y-2 ${className}`}
      >
        {/* Errors */}
        {validation.errors.map((error, index) => (
          <motion.div
            key={`error-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-2 p-3 bg-red-400/10 border border-red-400/20 rounded-lg backdrop-blur-sm"
          >
            <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-red-300 font-medium">{error}</span>
          </motion.div>
        ))}

        {/* Warnings */}
        {validation.warnings.map((warning, index) => (
          <motion.div
            key={`warning-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (validation.errors.length + index) * 0.1 }}
            className="flex items-start space-x-2 p-3 bg-amber-400/10 border border-amber-400/20 rounded-lg backdrop-blur-sm"
          >
            <AlertCircle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-amber-300">{warning}</span>
          </motion.div>
        ))}

        {/* Help Text */}
        {validation.helpText && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (validation.errors.length + validation.warnings.length) * 0.1 }}
            className="flex items-start space-x-2 p-3 bg-sky-400/10 border border-sky-400/20 rounded-lg backdrop-blur-sm"
          >
            <HelpCircle size={16} className="text-sky-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-sky-300">{validation.helpText}</span>
          </motion.div>
        )}

        {/* Suggestions */}
        {showSuggestions && validation.suggestions.length > 0 && (
          <div className="space-y-1.5">
            {validation.suggestions.map((suggestion, index) => (
              <motion.div
                key={`suggestion-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: (validation.errors.length + validation.warnings.length + (validation.helpText ? 1 : 0) + index) * 0.1 
                }}
                className="flex items-start space-x-2 p-2.5 bg-teal-400/5 border border-teal-400/10 rounded-lg backdrop-blur-sm"
              >
                <Lightbulb size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-teal-300">{suggestion}</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Success indicator component
interface ValidationSuccessProps {
  message?: string;
  className?: string;
}

export const ValidationSuccess: React.FC<ValidationSuccessProps> = ({
  message = 'Looks good!',
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center space-x-2 p-2 bg-teal-400/10 border border-teal-400/20 rounded-lg backdrop-blur-sm ${className}`}
    >
      <CheckCircle size={14} className="text-teal-400" />
      <span className="text-sm text-teal-300 font-medium">{message}</span>
    </motion.div>
  );
};

// Form progress indicator
interface FormProgressProps {
  completedFields: number;
  totalFields: number;
  className?: string;
}

export const FormProgress: React.FC<FormProgressProps> = ({
  completedFields,
  totalFields,
  className = ''
}) => {
  const percentage = Math.round((completedFields / totalFields) * 100);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm text-navy-300">Form Progress</span>
        <span className="text-sm text-teal-400 font-medium">{percentage}%</span>
      </div>
      
      <div className="w-full bg-navy-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      
      <p className="text-xs text-navy-400">
        {completedFields} of {totalFields} fields completed
      </p>
    </div>
  );
};

// Contextual help tooltip
interface ContextualHelpProps {
  title: string;
  description: string;
  tips?: string[];
  className?: string;
  children: React.ReactNode;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  title,
  description,
  tips,
  className = '',
  children
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={`relative ${className}`}>
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-72 p-4 bg-navy-800/95 backdrop-blur-md border border-navy-600/50 rounded-xl shadow-2xl -top-2 left-full ml-2"
          >
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-navy-100">{title}</h4>
                <p className="text-xs text-navy-300 mt-1">{description}</p>
              </div>
              
              {tips && tips.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-teal-400">Tips:</p>
                  {tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-xs text-navy-400">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Tooltip arrow */}
            <div className="absolute top-4 -left-2 w-4 h-4 bg-navy-800/95 border-l border-t border-navy-600/50 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartValidation;