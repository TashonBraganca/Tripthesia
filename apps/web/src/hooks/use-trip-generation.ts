import { useState, useEffect, useRef, useCallback } from "react";

export interface GenerationUpdate {
  type: "connected" | "phase" | "partial_result" | "completed" | "error";
  phase?: string;
  message: string;
  progress?: number;
  data?: any;
  error?: string;
  timestamp?: string;
}

export interface UseTripGenerationOptions {
  tripId: string;
  enabled: boolean;
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
  onUpdate?: (update: GenerationUpdate) => void;
}

export function useTripGeneration({
  tripId,
  enabled,
  onComplete,
  onError,
  onUpdate,
}: UseTripGenerationOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [updates, setUpdates] = useState<GenerationUpdate[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startGeneration = useCallback(async (preferences: any = {}) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setCurrentPhase("");
    setError(null);
    setUpdates([]);

    try {
      // First, make the initial request to start generation
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(`/api/trips/${tripId}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferences }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Set up EventSource for real-time updates
      const eventSource = new EventSource(`/api/trips/${tripId}/generate`, {
        withCredentials: true,
      });

      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const update: GenerationUpdate = JSON.parse(event.data);
          
          // Update internal state
          if (update.progress !== undefined) {
            setProgress(update.progress);
          }
          
          if (update.phase) {
            setCurrentPhase(update.phase);
          }

          // Add to updates history
          setUpdates(prev => [...prev, update]);

          // Call callbacks
          onUpdate?.(update);

          // Handle completion
          if (update.type === "completed") {
            setIsGenerating(false);
            eventSource.close();
            onComplete?.(update.data);
          }

          // Handle errors
          if (update.type === "error") {
            setIsGenerating(false);
            setError(update.error || update.message);
            eventSource.close();
            onError?.(update.error || update.message);
          }

        } catch (parseError) {
          console.error("Failed to parse SSE message:", parseError);
        }
      };

      eventSource.onerror = (event) => {
        console.error("EventSource error:", event);
        setIsGenerating(false);
        eventSource.close();
        
        const errorMessage = "Connection lost during generation";
        setError(errorMessage);
        onError?.(errorMessage);
      };

      eventSource.onopen = () => {
        console.log("EventSource connection opened");
      };

    } catch (fetchError) {
      setIsGenerating(false);
      const errorMessage = fetchError instanceof Error ? fetchError.message : "Failed to start generation";
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [tripId, isGenerating, onComplete, onError, onUpdate]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setIsGenerating(false);
    setProgress(0);
    setCurrentPhase("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-cleanup when enabled changes
  useEffect(() => {
    if (!enabled && isGenerating) {
      cancelGeneration();
    }
  }, [enabled, isGenerating, cancelGeneration]);

  return {
    isGenerating,
    progress,
    currentPhase,
    error,
    updates,
    startGeneration,
    cancelGeneration,
  };
}

// Helper hook for displaying generation status
export function useGenerationStatus(updates: GenerationUpdate[]) {
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");

  useEffect(() => {
    const latestUpdate = updates[updates.length - 1];
    if (!latestUpdate) return;

    setStatusMessage(latestUpdate.message);
    
    switch (latestUpdate.type) {
      case "completed":
        setStatusType("success");
        break;
      case "error":
        setStatusType("error");
        break;
      default:
        setStatusType("info");
        break;
    }
  }, [updates]);

  return { statusMessage, statusType };
}