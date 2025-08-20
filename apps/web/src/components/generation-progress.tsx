"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTripGeneration, useGenerationStatus } from "@/hooks/use-trip-generation";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Play, 
  Square,
  Sparkles,
  MapPin,
  Route,
  Calendar,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationProgressProps {
  tripId: string;
  onComplete?: (data: any) => void;
  className?: string;
}

const PHASE_ICONS = {
  initialize: Sparkles,
  places: MapPin,
  routing: Route,
  scheduling: Calendar,
  pricing: DollarSign,
  finalizing: CheckCircle,
};

const PHASE_DESCRIPTIONS = {
  initialize: "Setting up your perfect trip",
  places: "Discovering amazing destinations",
  routing: "Planning optimal routes",
  scheduling: "Creating your timeline",
  pricing: "Finding the best deals",
  finalizing: "Adding finishing touches",
};

export function GenerationProgress({ 
  tripId, 
  onComplete,
  className 
}: GenerationProgressProps) {
  const [preferences, setPreferences] = useState({});
  
  const {
    isGenerating,
    progress,
    currentPhase,
    error,
    updates,
    startGeneration,
    cancelGeneration,
  } = useTripGeneration({
    tripId,
    enabled: true,
    onComplete,
    onError: (error) => console.error("Generation error:", error),
  });

  const { statusMessage, statusType } = useGenerationStatus(updates);

  const handleStart = () => {
    startGeneration(preferences);
  };

  const getPhaseIcon = (phase: string) => {
    const Icon = PHASE_ICONS[phase as keyof typeof PHASE_ICONS] || Sparkles;
    return Icon;
  };

  const getPhaseDescription = (phase: string) => {
    return PHASE_DESCRIPTIONS[phase as keyof typeof PHASE_DESCRIPTIONS] || "Processing...";
  };

  const completedPhases = updates
    .filter(update => update.type === "phase")
    .map(update => update.phase!)
    .filter((phase, index, arr) => arr.indexOf(phase) === index);

  const allPhases = Object.keys(PHASE_ICONS);

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Trip Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Control Buttons */}
        <div className="flex items-center gap-3">
          {!isGenerating ? (
            <Button onClick={handleStart} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Generate Trip
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={cancelGeneration}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Cancel
            </Button>
          )}
          
          {error && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Error
            </Badge>
          )}
          
          {progress === 100 && !error && (
            <Badge variant="default" className="flex items-center gap-1 bg-green-500">
              <CheckCircle className="h-3 w-3" />
              Complete
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Current Status */}
        {(isGenerating || error) && (
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            {error ? (
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            ) : (
              <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
            )}
            <div>
              <p className={cn(
                "font-medium",
                error ? "text-red-700" : "text-foreground"
              )}>
                {error ? "Generation Failed" : getPhaseDescription(currentPhase)}
              </p>
              <p className={cn(
                "text-sm",
                error ? "text-red-600" : "text-muted-foreground"
              )}>
                {statusMessage}
              </p>
            </div>
          </div>
        )}

        {/* Phase Progress */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Generation Phases</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {allPhases.map((phase) => {
              const Icon = getPhaseIcon(phase);
              const isCompleted = completedPhases.includes(phase);
              const isCurrent = currentPhase === phase;
              
              return (
                <div
                  key={phase}
                  className={cn(
                    "flex items-center gap-2 p-3 border rounded-lg transition-all",
                    isCompleted && "bg-green-50 border-green-200",
                    isCurrent && "bg-blue-50 border-blue-200 ring-2 ring-blue-100",
                    !isCompleted && !isCurrent && "bg-gray-50 border-gray-200"
                  )}
                >
                  <Icon 
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isCompleted && "text-green-600",
                      isCurrent && "text-blue-600",
                      !isCompleted && !isCurrent && "text-gray-400"
                    )} 
                  />
                  <span className={cn(
                    "text-xs font-medium capitalize",
                    isCompleted && "text-green-700",
                    isCurrent && "text-blue-700",
                    !isCompleted && !isCurrent && "text-gray-500"
                  )}>
                    {phase}
                  </span>
                  {isCompleted && (
                    <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />
                  )}
                  {isCurrent && (
                    <Loader2 className="h-3 w-3 text-blue-600 animate-spin ml-auto" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Updates Log */}
        {updates.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Updates</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {updates.slice(-5).reverse().map((update, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 text-xs border rounded"
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0 mt-1",
                    update.type === "completed" && "bg-green-500",
                    update.type === "error" && "bg-red-500",
                    update.type === "phase" && "bg-blue-500",
                    update.type === "partial_result" && "bg-yellow-500",
                    update.type === "connected" && "bg-gray-500"
                  )} />
                  <div className="flex-grow">
                    <p className="text-gray-900">{update.message}</p>
                    {update.timestamp && (
                      <p className="text-gray-500 text-xs">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  {update.progress !== undefined && (
                    <span className="text-gray-500 text-xs flex-shrink-0">
                      {update.progress}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generation Options */}
        {!isGenerating && (
          <details className="border rounded-lg p-4">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
              Advanced Options
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Generation Focus
                </label>
                <div className="mt-1 flex gap-2 flex-wrap">
                  {["culture", "food", "nature", "nightlife", "shopping"].map((focus) => (
                    <Button
                      key={focus}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setPreferences(prev => ({
                        ...prev,
                        focusAreas: prev.focusAreas?.includes(focus) 
                          ? prev.focusAreas.filter(f => f !== focus)
                          : [...(prev.focusAreas || []), focus]
                      }))}
                    >
                      {focus.charAt(0).toUpperCase() + focus.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}