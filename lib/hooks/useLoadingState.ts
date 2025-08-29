/**
 * Advanced loading state management hook for forms and API operations
 */

import { useState, useCallback, useRef } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
  stage?: string;
  retryCount?: number;
}

export interface LoadingStateActions {
  startLoading: (stage?: string, progress?: number) => void;
  updateProgress: (progress: number, stage?: string) => void;
  setError: (error: string) => void;
  clearError: () => void;
  stopLoading: () => void;
  retry: () => void;
}

export interface UseLoadingStateOptions {
  initialStage?: string;
  maxRetries?: number;
  autoRetry?: boolean;
  retryDelay?: number;
}

/**
 * Enhanced loading state hook with progress tracking and retry logic
 */
export function useLoadingState(
  options: UseLoadingStateOptions = {}
): [LoadingState, LoadingStateActions] {
  const {
    initialStage,
    maxRetries = 3,
    autoRetry = false,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    stage: initialStage,
    progress: 0,
    retryCount: 0,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const lastOperationRef = useRef<(() => void) | null>(null);

  const startLoading = useCallback((stage?: string, progress: number = 0) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      stage: stage || prev.stage,
      progress,
    }));
  }, []);

  const updateProgress = useCallback((progress: number, stage?: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
      stage: stage || prev.stage,
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error,
      retryCount: prev.retryCount || 0,
    }));

    // Auto-retry logic
    if (autoRetry && (state.retryCount || 0) < maxRetries && lastOperationRef.current) {
      retryTimeoutRef.current = setTimeout(() => {
        retry();
      }, retryDelay * Math.pow(2, state.retryCount || 0)); // Exponential backoff
    }
  }, [autoRetry, maxRetries, retryDelay, state.retryCount, retry]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
  }, []);

  const stopLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100,
    }));

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
  }, []);

  const retry = useCallback(() => {
    if ((state.retryCount || 0) >= maxRetries) {
      setError(`Maximum retry attempts (${maxRetries}) exceeded`);
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      retryCount: (prev.retryCount || 0) + 1,
    }));

    if (lastOperationRef.current) {
      lastOperationRef.current();
    }
  }, [state.retryCount, maxRetries, setError]);

  // Store the last operation for retry functionality
  const wrappedStartLoading = useCallback((stage?: string, progress?: number) => {
    lastOperationRef.current = () => startLoading(stage, progress);
    startLoading(stage, progress);
  }, [startLoading]);

  const actions: LoadingStateActions = {
    startLoading: wrappedStartLoading,
    updateProgress,
    setError,
    clearError,
    stopLoading,
    retry,
  };

  return [state, actions];
}

/**
 * Hook for managing multiple concurrent loading states
 */
export function useMultiLoadingState() {
  const [states, setStates] = useState<Record<string, LoadingState>>({});

  const updateState = useCallback((key: string, state: LoadingState) => {
    setStates(prev => ({
      ...prev,
      [key]: state,
    }));
  }, []);

  const startLoading = useCallback((key: string, stage?: string, progress: number = 0) => {
    updateState(key, {
      isLoading: true,
      error: null,
      stage,
      progress,
      retryCount: 0,
    });
  }, [updateState]);

  const updateProgress = useCallback((key: string, progress: number, stage?: string) => {
    setStates(prev => {
      const currentState = prev[key] || { isLoading: false, error: null, progress: 0, retryCount: 0 };
      return {
        ...prev,
        [key]: {
          ...currentState,
          progress: Math.max(0, Math.min(100, progress)),
          stage: stage || currentState.stage,
        },
      };
    });
  }, []);

  const setError = useCallback((key: string, error: string) => {
    setStates(prev => {
      const currentState = prev[key] || { isLoading: false, error: null, progress: 0, retryCount: 0 };
      return {
        ...prev,
        [key]: {
          ...currentState,
          isLoading: false,
          error,
          retryCount: (currentState.retryCount || 0) + 1,
        },
      };
    });
  }, []);

  const stopLoading = useCallback((key: string) => {
    setStates(prev => {
      const currentState = prev[key] || { isLoading: false, error: null, progress: 0, retryCount: 0 };
      return {
        ...prev,
        [key]: {
          ...currentState,
          isLoading: false,
          progress: 100,
        },
      };
    });
  }, []);

  const getState = useCallback((key: string): LoadingState => {
    return states[key] || {
      isLoading: false,
      error: null,
      progress: 0,
      retryCount: 0,
    };
  }, [states]);

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(states).some(state => state.isLoading);
  }, [states]);

  const hasAnyError = useCallback((): boolean => {
    return Object.values(states).some(state => state.error !== null);
  }, [states]);

  const getAllErrors = useCallback((): string[] => {
    return Object.values(states)
      .filter(state => state.error !== null)
      .map(state => state.error!);
  }, [states]);

  return {
    startLoading,
    updateProgress,
    setError,
    stopLoading,
    getState,
    isAnyLoading,
    hasAnyError,
    getAllErrors,
    states,
  };
}