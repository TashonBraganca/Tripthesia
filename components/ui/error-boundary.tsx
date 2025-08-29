"use client";

import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  eventId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

/**
 * Enhanced Error Boundary with recovery options and error reporting
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Generate unique error ID for tracking
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In a real app, you might want to log this to an error reporting service
    this.logErrorToService(error, errorInfo, eventId);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      // Reset if resetKeys changed
      if (resetKeys && prevProps.resetKeys) {
        const hasResetKeyChanged = resetKeys.some((key, idx) => key !== prevProps.resetKeys![idx]);
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }

      // Reset if props changed (and resetOnPropsChange is true)
      if (resetOnPropsChange && prevProps !== this.props) {
        this.resetErrorBoundary();
      }
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo, eventId: string) => {
    // In a real application, send this to your error monitoring service
    const errorData = {
      eventId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      level: this.props.level || 'component',
    };

    // Example: Send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      console.log('Would send to error service:', errorData);
      // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorData) });
    }
  };

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        eventId: undefined,
      });
    }, 100);
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleReportBug = () => {
    const { error, errorInfo, eventId } = this.state;
    
    if (typeof window !== 'undefined' && error) {
      const bugReportData = {
        error: error.message,
        stack: error.stack,
        eventId,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };

      // Create a pre-filled bug report
      const subject = `Bug Report: ${error.message}`;
      const body = `
Error Details:
- Event ID: ${eventId}
- Error: ${error.message}
- URL: ${window.location.href}
- Timestamp: ${new Date().toISOString()}

Additional Context:
- Please describe what you were doing when this error occurred
- Include any steps to reproduce the issue

Technical Details:
${JSON.stringify(bugReportData, null, 2)}
      `.trim();

      // Open email client or bug reporting system
      const mailtoLink = `mailto:support@tripthesia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      const { fallback, level = 'component' } = this.props;
      const { error, eventId } = this.state;

      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Different UI based on error level
      const isCritical = level === 'critical' || level === 'page';
      const errorTitle = isCritical 
        ? 'Something went wrong'
        : 'Component Error';

      return (
        <div className={`flex items-center justify-center p-8 ${isCritical ? 'min-h-screen bg-gray-50' : 'min-h-[300px]'}`}>
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <AlertCircle 
                className={`mx-auto ${isCritical ? 'h-16 w-16 text-red-500' : 'h-12 w-12 text-orange-500'}`} 
              />
            </div>
            
            <h2 className={`${isCritical ? 'text-2xl' : 'text-xl'} font-semibold text-gray-900 mb-2`}>
              {errorTitle}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {isCritical 
                ? "We're sorry, but something unexpected happened. Our team has been notified."
                : "This component encountered an error. You can try refreshing or continue using other parts of the app."
              }
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mb-6 text-left bg-gray-100 p-4 rounded-lg">
                <summary className="cursor-pointer font-medium text-red-600 mb-2">
                  Error Details (Development)
                </summary>
                <div className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-all">
                  {error.message}
                  {error.stack && (
                    <div className="mt-2 text-xs text-gray-600">
                      {error.stack}
                    </div>
                  )}
                </div>
              </details>
            )}

            {eventId && (
              <p className="text-xs text-gray-500 mb-6">
                Error ID: <code className="bg-gray-200 px-1 py-0.5 rounded">{eventId}</code>
              </p>
            )}

            <div className="flex flex-col gap-3">
              <Button 
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>

              {isCritical && (
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              )}

              <Button 
                onClick={this.handleReportBug}
                variant="ghost"
                size="sm"
                className="flex items-center justify-center gap-2 text-gray-600"
              >
                <Bug className="h-4 w-4" />
                Report Bug
              </Button>
            </div>

            {!isCritical && (
              <div className="mt-6 text-xs text-gray-500">
                If this issue persists, please refresh the page or contact support.
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('useErrorHandler caught:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithErrorBoundary;
}

/**
 * Async error boundary for handling promise rejections
 */
export function AsyncErrorBoundary({ children, onError }: { 
  children: ReactNode; 
  onError?: (error: Error) => void; 
}) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      if (onError) {
        onError(error);
      }
      
      // Prevent the default browser behavior
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  return <>{children}</>;
}