"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { trackError } from '@/lib/monitoring/error-tracker';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // Whether to isolate this boundary from parent boundaries
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track the error
    const errorId = trackError(error, {
      severity: 'high',
      category: 'client',
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        retryCount: this.state.retryCount,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });

    this.setState({
      errorInfo,
      errorId
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to console for debugging
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error ID:', errorId);
    console.groupEnd();
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));

      // Track retry attempt
      trackError(new Error('Error Boundary Retry Attempt'), {
        severity: 'low',
        category: 'client',
        additionalData: {
          retryCount: this.state.retryCount + 1,
          originalError: this.state.error?.message,
          errorId: this.state.errorId
        }
      });
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReportBug = () => {
    const bugReport = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId
    };

    // Open email client with pre-filled bug report
    const subject = encodeURIComponent(`Bug Report: ${this.state.error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(`
Error Details:
- Message: ${bugReport.error}
- URL: ${bugReport.url}
- Error ID: ${bugReport.errorId}
- Timestamp: ${bugReport.timestamp}

Technical Information:
${JSON.stringify(bugReport, null, 2)}

Steps to reproduce:
1. [Please describe what you were doing when this error occurred]
2. 
3. 

Additional context:
[Any additional information that might help us fix this issue]
    `);

    window.open(`mailto:support@tripthesia.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            {/* Error Icon */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-navy-50 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-contrast-medium">
                We&apos;re sorry, but something unexpected happened. Our team has been notified.
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-navy-800/50 border border-navy-400/30 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-red-400 mb-2">
                  Development Error Details
                </h3>
                <div className="text-xs text-contrast-medium font-mono space-y-1">
                  <div><strong>Message:</strong> {this.state.error.message}</div>
                  {this.state.errorId && (
                    <div><strong>Error ID:</strong> {this.state.errorId}</div>
                  )}
                  <div><strong>Retry Count:</strong> {this.state.retryCount}/{this.maxRetries}</div>
                </div>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-contrast-medium cursor-pointer hover:text-teal-400">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-contrast-medium mt-1 whitespace-pre-wrap break-all">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Retry Button (if retries available) */}
              {this.state.retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-900 font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                </button>
              )}

              {/* Action Buttons Row */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-navy-800 hover:bg-navy-700 text-navy-50 border border-navy-400/30 hover:border-teal-400/50 rounded-xl transition-all duration-200"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-navy-800 hover:bg-navy-700 text-navy-50 border border-navy-400/30 hover:border-teal-400/50 rounded-xl transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
              </div>

              {/* Report Bug Button */}
              <button
                onClick={this.handleReportBug}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-contrast-medium hover:text-teal-400 border border-navy-400/30 hover:border-teal-400/50 rounded-xl transition-all duration-200 text-sm"
              >
                <Bug className="w-4 h-4" />
                Report This Issue
              </button>
            </div>

            {/* Error ID for Support */}
            {this.state.errorId && (
              <div className="mt-6 text-center">
                <p className="text-xs text-contrast-medium">
                  Error ID: <span className="font-mono text-teal-400">{this.state.errorId}</span>
                </p>
                <p className="text-xs text-contrast-medium mt-1">
                  Please include this ID when contacting support
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for manual error reporting
export function useErrorHandler() {
  return React.useCallback((error: Error, additionalContext?: Record<string, any>) => {
    trackError(error, {
      severity: 'medium',
      category: 'client',
      additionalData: {
        ...additionalContext,
        manualReport: true,
        timestamp: new Date().toISOString()
      }
    });
  }, []);
}