'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'section';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  isRetrying: boolean;
  retryCount: number;
  reportSent: boolean;
}

class GlobalErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      isRetrying: false,
      retryCount: 0,
      reportSent: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log error details for debugging
    this.logError(error, errorInfo);
    
    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  logError = (error: Error, errorInfo: ErrorInfo) => {
    const { errorId } = this.state;
    const { level = 'component' } = this.props;
    
    console.group(`🚨 Error Boundary (${level.toUpperCase()}) - ${errorId}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.error('Timestamp:', new Date().toISOString());
    console.error('User Agent:', navigator.userAgent);
    console.error('URL:', window.location.href);
    console.groupEnd();
  };

  reportError = async (error: Error, errorInfo: ErrorInfo) => {
    const { errorId } = this.state;
    const { level = 'component' } = this.props;
    
    try {
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: 'anonymous', // This could be filled from user context
        buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
      };

      // Send to monitoring service (replace with actual service)
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      });

      this.setState({ reportSent: true });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  handleRetry = () => {
    if (this.state.retryCount >= 3) {
      return; // Max retries reached
    }

    this.setState({ 
      isRetrying: true, 
      retryCount: this.state.retryCount + 1 
    });

    // Clear error state after a brief delay
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
      });
    }, 1000);
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  sendFeedback = () => {
    const { error, errorId } = this.state;
    const subject = `Error Report - ${errorId}`;
    const body = `I encountered an error while using Tripthesia:\n\nError ID: ${errorId}\nError: ${error?.message}\nPage: ${window.location.href}\n\nAdditional details:\n`;
    
    window.open(`mailto:support@tripthesia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Show custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId, isRetrying, retryCount, reportSent } = this.state;
      const { level = 'component', showDetails = false } = this.props;
      const maxRetries = 3;

      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center justify-center min-h-[400px] p-6 bg-gradient-to-br from-red-50/50 to-orange-50/50 backdrop-blur-sm rounded-2xl border border-red-200/30"
          >
            <div className="text-center max-w-2xl">
              {/* Error Icon */}
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: isRetrying ? 360 : 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="mx-auto mb-6"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  {isRetrying ? (
                    <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  )}
                </div>
              </motion.div>

              {/* Error Message */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {isRetrying ? 'Attempting Recovery...' : 'Something went wrong'}
                </h2>
                <p className="text-gray-600 mb-4">
                  {isRetrying 
                    ? 'We\'re trying to recover from this error automatically.'
                    : level === 'page' 
                      ? 'This page encountered an unexpected error. Don\'t worry, your data is safe.'
                      : 'This component encountered an issue, but the rest of the page should work normally.'
                  }
                </p>
                
                {/* Error ID */}
                <div className="bg-gray-100 rounded-lg p-3 mb-4 font-mono text-sm text-gray-700">
                  Error ID: {errorId}
                  {reportSent && (
                    <span className="ml-2 text-green-600 text-xs">✓ Reported</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!isRetrying && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
                >
                  {/* Retry Button */}
                  {retryCount < maxRetries && (
                    <button
                      onClick={this.handleRetry}
                      className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again ({maxRetries - retryCount} left)
                    </button>
                  )}

                  {/* Home Button */}
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Homepage
                  </button>

                  {/* Reload Button */}
                  <button
                    onClick={this.handleReload}
                    className="flex items-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </button>
                </motion.div>
              )}

              {/* Additional Actions */}
              {!isRetrying && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {/* Send Feedback */}
                  <button
                    onClick={this.sendFeedback}
                    className="flex items-center text-gray-600 hover:text-gray-800 transition-colors text-sm"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send Feedback
                  </button>

                  {/* Show Details Toggle */}
                  {showDetails && error && (
                    <details className="text-left mt-4 w-full max-w-lg">
                      <summary className="flex items-center cursor-pointer text-gray-600 hover:text-gray-800 text-sm">
                        <Bug className="w-4 h-4 mr-1" />
                        Technical Details
                      </summary>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg text-xs font-mono text-gray-700 overflow-auto max-h-40">
                        <div className="mb-2">
                          <strong>Error:</strong> {error.message}
                        </div>
                        {errorInfo && (
                          <div>
                            <strong>Component Stack:</strong>
                            <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* Recovery Progress */}
              {isRetrying && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
                >
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" />
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;

// Specialized error boundaries for specific use cases
export const AIErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <GlobalErrorBoundary
    level="component"
    onError={(error, errorInfo) => {
      // Specific logging for AI component errors
      console.error('AI Component Error:', { error, errorInfo });
    }}
  >
    {children}
  </GlobalErrorBoundary>
);

export const FormErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <GlobalErrorBoundary
    level="component"
    fallback={
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          This form encountered an issue. Please refresh the page and try again.
        </p>
      </div>
    }
  >
    {children}
  </GlobalErrorBoundary>
);

export const MapErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <GlobalErrorBoundary
    level="component"
    fallback={
      <div className="p-8 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p className="text-blue-800 mb-2">Map component is temporarily unavailable.</p>
        <p className="text-blue-600 text-sm">Please check your internet connection and try again.</p>
      </div>
    }
  >
    {children}
  </GlobalErrorBoundary>
);