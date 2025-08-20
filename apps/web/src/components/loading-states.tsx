"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Loader2, Plane, MapPin, Calendar } from "lucide-react";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Generic Loading Spinner
export function LoadingSpinner({ className, size = "md" }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
  };

  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  );
}

// Skeleton Loading Components
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}

// Trip Timeline Loading
export function TimelineLoading() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-4">
          {/* Day Header */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          {/* Activities */}
          <div className="space-y-3 ml-6">
            {Array.from({ length: 4 }, (_, j) => (
              <Card key={j} className="border-l-4 border-l-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                    <div className="flex-grow space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-64" />
                      <div className="flex gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Map Loading
export function MapLoading() {
  return (
    <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto" />
          <LoadingSpinner className="absolute -top-1 -right-1 h-6 w-6 text-blue-500" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Loading Interactive Map</p>
          <p className="text-xs text-gray-500">Preparing your route visualization...</p>
        </div>
      </div>
    </div>
  );
}

// Trip Generation Loading
export function TripGenerationLoading({ 
  currentPhase, 
  progress = 0 
}: { 
  currentPhase?: string; 
  progress?: number; 
}) {
  const phases = [
    { key: "initialize", label: "Initializing", icon: Plane },
    { key: "places", label: "Finding Places", icon: MapPin },
    { key: "routing", label: "Planning Routes", icon: MapPin },
    { key: "scheduling", label: "Creating Schedule", icon: Calendar },
    { key: "pricing", label: "Getting Prices", icon: MapPin },
    { key: "finalizing", label: "Finalizing", icon: Plane },
  ];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          {/* Main Animation */}
          <div className="relative">
            <div className="h-16 w-16 mx-auto relative">
              <Plane className="h-16 w-16 text-blue-500 animate-pulse" />
              <div className="absolute inset-0 border-2 border-blue-200 rounded-full animate-spin"></div>
            </div>
          </div>

          {/* Progress Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Generating Your Perfect Trip</h3>
            <p className="text-sm text-gray-600">
              {currentPhase ? 
                phases.find(p => p.key === currentPhase)?.label || "Processing..." :
                "Starting trip generation..."
              }
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{progress}% Complete</p>
          </div>

          {/* Phase Indicators */}
          <div className="grid grid-cols-3 gap-2">
            {phases.map((phase, index) => {
              const Icon = phase.icon;
              const isActive = phase.key === currentPhase;
              const isComplete = phases.findIndex(p => p.key === currentPhase) > index;
              
              return (
                <div
                  key={phase.key}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                    isActive && "bg-blue-50 text-blue-600",
                    isComplete && "text-green-600",
                    !isActive && !isComplete && "text-gray-400"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{phase.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Page Loading
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Loading Tripthesia</h3>
          <p className="text-sm text-gray-600">Getting everything ready for you...</p>
        </div>
      </div>
    </div>
  );
}

// Button Loading
export function ButtonLoading({ 
  children, 
  isLoading, 
  loadingText,
  ...props 
}: {
  children: React.ReactNode;
  isLoading: boolean;
  loadingText?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} disabled={isLoading || props.disabled}>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          {loadingText || "Loading..."}
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Data Loading States
export function DataLoading({ 
  message = "Loading data...",
  className 
}: { 
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="text-center space-y-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// Content Skeleton for cards and lists
export function ContentSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}

// Search/Filter Loading
export function SearchLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-grow space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}