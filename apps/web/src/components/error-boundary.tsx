"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RotateCcw, Home, MessageCircle } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Log to error tracking service (Sentry, etc.)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "exception", {
        description: error.message,
        fatal: false,
      });
    }
    
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === "development";
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-xl text-red-700">
            Oops! Something went wrong
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            We encountered an unexpected error. Don't worry, your data is safe.
          </p>
          
          {isDevelopment && error && (
            <details className="bg-gray-100 p-3 rounded text-xs">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="whitespace-pre-wrap text-red-600">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col gap-2">
            <Button onClick={resetError} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/"}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                const subject = encodeURIComponent("Trip Planning Error Report");
                const body = encodeURIComponent(
                  `I encountered an error while using Tripthesia:\n\n` +
                  `Error: ${error?.message || "Unknown error"}\n` +
                  `URL: ${window.location.href}\n` +
                  `Time: ${new Date().toISOString()}\n\n` +
                  `Additional details:\n`
                );
                window.open(`mailto:support@tripthesia.com?subject=${subject}&body=${body}`);
              }}
              className="w-full text-xs"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specific error fallbacks for different contexts
export function TripGenerationErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Card className="border-red-200">
      <CardContent className="p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Trip Generation Failed
        </h3>
        <p className="text-gray-600 mb-4">
          We couldn't generate your trip itinerary. This might be due to network issues or high demand.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={resetError} size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry Generation
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function MapErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="h-full w-full bg-gray-100 border rounded-lg flex items-center justify-center">
      <div className="text-center p-6">
        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Map Unavailable
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          The interactive map couldn't load. You can still view your itinerary in the timeline.
        </p>
        <Button onClick={resetError} size="sm" variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry Map
        </Button>
      </div>
    </div>
  );
}

// Hook for functional error boundaries
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error("Error caught by useErrorHandler:", error, errorInfo);
    
    // Report to error tracking service
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "exception", {
        description: error.message,
        fatal: false,
      });
    }
  };
}