// Accessible Form Field Components - Phase 8 Accessibility Excellence
// WCAG 2.1 AA+ compliant form components with proper labeling and error handling

'use client';

import React, { ReactNode, forwardRef, useId } from 'react';
import { useFormAnnouncements, useAriaState } from '@/lib/accessibility/hooks';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  children: ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
}

interface FormLabelProps {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export function FormLabel({ htmlFor, children, required, className }: FormLabelProps) {
  return (
    <label 
      htmlFor={htmlFor}
      className={cn(
        'block text-sm font-medium text-navy-200',
        className
      )}
    >
      {children}
      {required && (
        <span 
          className="text-red-400 ml-1" 
          aria-label="required"
        >
          *
        </span>
      )}
    </label>
  );
}

interface FormControlProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label: string;
  required?: boolean;
}

export const FormControl = forwardRef<HTMLInputElement, FormControlProps>(
  ({ error, helperText, label, required, className, id, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id || generatedId;
    const helperId = `${fieldId}-helper`;
    const errorId = `${fieldId}-error`;
    const { getAriaInvalid } = useAriaState();

    const describedBy = [
      helperText && helperId,
      error && errorId
    ].filter(Boolean).join(' ');

    return (
      <FormField>
        <FormLabel htmlFor={fieldId} required={required}>
          {label}
        </FormLabel>
        
        <input
          ref={ref}
          id={fieldId}
          aria-describedby={describedBy || undefined}
          aria-invalid={getAriaInvalid(!!error)}
          aria-required={required}
          className={cn(
            'w-full px-3 py-2 rounded-md border transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
            'bg-navy-800 border-navy-600 text-navy-100 placeholder-navy-400',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />

        {helperText && (
          <p 
            id={helperId} 
            className="text-sm text-navy-400"
          >
            {helperText}
          </p>
        )}

        {error && (
          <p 
            id={errorId} 
            role="alert"
            aria-live="polite"
            className="text-sm text-red-400 flex items-center gap-1"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
      </FormField>
    );
  }
);

FormControl.displayName = 'FormControl';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  helperText?: string;
  label: string;
  required?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ error, helperText, label, required, options, className, id, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id || generatedId;
    const helperId = `${fieldId}-helper`;
    const errorId = `${fieldId}-error`;
    const { getAriaInvalid } = useAriaState();

    const describedBy = [
      helperText && helperId,
      error && errorId
    ].filter(Boolean).join(' ');

    return (
      <FormField>
        <FormLabel htmlFor={fieldId} required={required}>
          {label}
        </FormLabel>
        
        <select
          ref={ref}
          id={fieldId}
          aria-describedby={describedBy || undefined}
          aria-invalid={getAriaInvalid(!!error)}
          aria-required={required}
          className={cn(
            'w-full px-3 py-2 rounded-md border transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
            'bg-navy-800 border-navy-600 text-navy-100',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {helperText && (
          <p 
            id={helperId} 
            className="text-sm text-navy-400"
          >
            {helperText}
          </p>
        )}

        {error && (
          <p 
            id={errorId} 
            role="alert"
            aria-live="polite"
            className="text-sm text-red-400 flex items-center gap-1"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
      </FormField>
    );
  }
);

FormSelect.displayName = 'FormSelect';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helperText?: string;
  label: string;
  required?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ error, helperText, label, required, className, id, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id || generatedId;
    const helperId = `${fieldId}-helper`;
    const errorId = `${fieldId}-error`;
    const { getAriaInvalid } = useAriaState();

    const describedBy = [
      helperText && helperId,
      error && errorId
    ].filter(Boolean).join(' ');

    return (
      <FormField>
        <FormLabel htmlFor={fieldId} required={required}>
          {label}
        </FormLabel>
        
        <textarea
          ref={ref}
          id={fieldId}
          aria-describedby={describedBy || undefined}
          aria-invalid={getAriaInvalid(!!error)}
          aria-required={required}
          className={cn(
            'w-full px-3 py-2 rounded-md border transition-colors resize-vertical',
            'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
            'bg-navy-800 border-navy-600 text-navy-100 placeholder-navy-400',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />

        {helperText && (
          <p 
            id={helperId} 
            className="text-sm text-navy-400"
          >
            {helperText}
          </p>
        )}

        {error && (
          <p 
            id={errorId} 
            role="alert"
            aria-live="polite"
            className="text-sm text-red-400 flex items-center gap-1"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
      </FormField>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id || generatedId;
    const helperId = `${fieldId}-helper`;
    const errorId = `${fieldId}-error`;
    const { getAriaInvalid } = useAriaState();

    const describedBy = [
      helperText && helperId,
      error && errorId
    ].filter(Boolean).join(' ');

    return (
      <FormField>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            type="checkbox"
            id={fieldId}
            aria-describedby={describedBy || undefined}
            aria-invalid={getAriaInvalid(!!error)}
            className={cn(
              'mt-0.5 h-4 w-4 rounded border-navy-600 bg-navy-800',
              'text-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
              error && 'border-red-500',
              className
            )}
            {...props}
          />
          
          <div className="flex-1">
            <FormLabel htmlFor={fieldId} className="mt-0">
              {label}
            </FormLabel>

            {helperText && (
              <p 
                id={helperId} 
                className="text-sm text-navy-400 mt-1"
              >
                {helperText}
              </p>
            )}

            {error && (
              <p 
                id={errorId} 
                role="alert"
                aria-live="polite"
                className="text-sm text-red-400 flex items-center gap-1 mt-1"
              >
                <span aria-hidden="true">⚠</span>
                {error}
              </p>
            )}
          </div>
        </div>
      </FormField>
    );
  }
);

FormCheckbox.displayName = 'FormCheckbox';

interface FormErrorSummaryProps {
  errors: { field: string; message: string }[];
  title?: string;
}

export function FormErrorSummary({ errors, title = 'Please fix the following errors:' }: FormErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div 
      role="alert"
      aria-live="assertive"
      className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-red-400" aria-hidden="true">⚠</span>
        <h2 className="text-red-400 font-medium text-sm">
          {title}
        </h2>
      </div>
      
      <ul className="space-y-1">
        {errors.map((error, index) => (
          <li key={index} className="text-red-300 text-sm">
            <strong>{error.field}:</strong> {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}