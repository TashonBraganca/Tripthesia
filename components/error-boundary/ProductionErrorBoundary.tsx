'use client';

// Production Error Boundary - Phase 7 Production Excellence
// Comprehensive error handling with monitoring integration

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { AnimatedButton } from '@/components/effects/AnimatedButton';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReportButton?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  eventId?: string;
}

export class ProductionErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      eventId: undefined
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for monitoring
    const errorDetails = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      userId: this.getUserId()
    };

    console.error('ProductionErrorBoundary caught an error:', errorDetails);

    // Send to monitoring service
    this.reportError(errorDetails);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-recovery attempt after 5 seconds
    this.resetTimeoutId = window.setTimeout(() => {
      this.handleReset();
    }, 5000);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && !prevProps.resetKeys && resetKeys) {
      const hasResetKeyChanged = resetKeys.some((resetKey, idx) =>
        prevProps.resetKeys?.[idx] !== resetKey
      );
      
      if (hasResetKeyChanged || resetOnPropsChange) {
        this.handleReset();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private getUserId(): string {
    // Try to get user ID from various sources
    try {
      // From Clerk if available
      const clerkUser = (window as any).__clerk_user;
      if (clerkUser?.id) return clerkUser.id;

      // From localStorage
      const storedUser = localStorage.getItem('user_id') || localStorage.getItem('userId');
      if (storedUser) return storedUser;

      // From sessionStorage
      const sessionUser = sessionStorage.getItem('user_id') || sessionStorage.getItem('userId');
      if (sessionUser) return sessionUser;

      return 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  private async reportError(errorDetails: any) {
    try {
      // Send to internal monitoring endpoint
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...errorDetails,
          type: 'client_error_boundary',
          severity: 'error'
        }),
      });

      // Also send to external monitoring service if configured
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry integration
        if (typeof window !== 'undefined' && (window as any).Sentry) {
          const eventId = (window as any).Sentry.captureException(this.state.error, {
            contexts: {
              errorBoundary: {
                componentStack: errorDetails.componentStack,
                errorId: errorDetails.errorId
              }
            },
            tags: {
              component: 'ErrorBoundary',
              errorId: errorDetails.errorId
            }
          });
          
          this.setState({ eventId });
        }
      }
    } catch (monitoringError) {
      console.error('Failed to report error to monitoring service:', monitoringError);
    }
  }

  private handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorId: '',
      eventId: undefined
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportIssue = () => {
    const { error, errorId } = this.state;
    const subject = `Error Report - ${errorId}`;
    const body = `
Error ID: ${errorId}
Error Message: ${error?.message || 'Unknown error'}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}

Please describe what you were doing when this error occurred:
[Your description here]
    `.trim();

    const mailtoUrl = `mailto:support@tripthesia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  render() {
    if (this.state.hasError) {
      // Show custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mb-8">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-navy-100 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-navy-300 text-sm mb-1">
                We encountered an unexpected error. Don&apos;t worry, we&apos;ve been notified and are working on a fix.
              </p>
              <p className="text-navy-400 text-xs font-mono">
                Error ID: {this.state.errorId}
              </p>
            </div>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-left">
                <h3 className="text-red-300 font-medium mb-2">Error Details:</h3>
                <pre className="text-red-200 text-xs overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-red-300 cursor-pointer text-xs">
                      Stack Trace
                    </summary>
                    <pre className="text-red-200 text-xs mt-1 overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <AnimatedButton
                  onClick={this.handleReset}
                  variant="primary"
                  className="flex-1"
                  particles={false}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </AnimatedButton>
                <AnimatedButton
                  onClick={this.handleGoHome}
                  variant="secondary"
                  className="flex-1"
                  particles={false}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </AnimatedButton>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <AnimatedButton
                  onClick={this.handleReload}
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  particles={false}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </AnimatedButton>
                {this.props.showReportButton && (
                  <AnimatedButton
                    onClick={this.handleReportIssue}
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    particles={false}
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Report Issue
                  </AnimatedButton>
                )}
              </div>
            </div>

            {/* Auto-recovery notice */}
            <div className="mt-8 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-200 text-xs">
                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                This page will automatically retry in a few seconds...
              </p>
            </div>

            {/* Sentry Integration */}
            {this.state.eventId && process.env.NODE_ENV === 'production' && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    if ((window as any).Sentry) {
                      (window as any).Sentry.showReportDialog({
                        eventId: this.state.eventId
                      });
                    }
                  }}
                  className="text-xs text-navy-400 hover:text-navy-300 underline"
                >
                  Report feedback to our team
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function withErrorBoundary<T extends {}>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryComponent(props: T) {
    return (
      <ProductionErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ProductionErrorBoundary>
    );
  };
}

// Specific error boundaries for different sections
export function APIErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ProductionErrorBoundary
      onError={(error, errorInfo) => {
        console.error('API Error Boundary:', error, errorInfo);
      }}
      showReportButton={true}
      fallback={
        <div className="p-6 bg-red-900/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
            <h3 className="text-red-300 font-medium">API Error</h3>
          </div>
          <p className="text-red-200 text-sm mb-4">
            We&apos;re having trouble connecting to our services. Please try again in a moment.
          </p>
          <AnimatedButton
            onClick={() => window.location.reload()}
            variant="primary"
            size="sm"
            particles={false}
          >
            Retry
          </AnimatedButton>
        </div>
      }
    >
      {children}
    </ProductionErrorBoundary>
  );
}

export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ProductionErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Form Error Boundary:', error, errorInfo);
      }}
      resetOnPropsChange={true}
      fallback={
        <div className="p-4 bg-amber-900/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mr-2" />
            <h3 className="text-amber-300 font-medium text-sm">Form Error</h3>
          </div>
          <p className="text-amber-200 text-xs mb-3">
            There was an issue with the form. Please refresh and try again.
          </p>
          <AnimatedButton
            onClick={() => window.location.reload()}
            variant="secondary"
            size="sm"
            particles={false}
          >
            Refresh Form
          </AnimatedButton>
        </div>
      }
    >
      {children}
    </ProductionErrorBoundary>
  );
}

export default ProductionErrorBoundary;