/**
 * Phase 4.3.5: Feedback Collection Hook
 * 
 * React hook for collecting user feedback and managing learning interactions
 * throughout the application with seamless UX integration.
 */

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

// ==================== TYPES ====================

export interface FeedbackItem {
  feedbackType: 'itinerary_rating' | 'activity_feedback' | 'recommendation_feedback' | 
                'preference_correction' | 'experience_report' | 'suggestion_acceptance' | 
                'booking_completion' | 'trip_completion';
  targetType: 'itinerary' | 'activity' | 'recommendation' | 'preference' | 'overall';
  targetId: string;
  rating?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  feedback?: string;
  details?: Record<string, any>;
}

export interface FeedbackOptions {
  immediate?: boolean; // Submit immediately vs batch
  generateInsights?: boolean;
  updatePreferences?: boolean;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export interface BatchFeedbackOptions {
  batchId?: string;
  autoSubmitDelay?: number; // Auto-submit after N milliseconds of inactivity
  maxBatchSize?: number;
}

// ==================== HOOK IMPLEMENTATION ====================

export function useFeedbackCollection(options: BatchFeedbackOptions = {}) {
  const { userId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackQueue, setFeedbackQueue] = useState<FeedbackItem[]>([]);
  const [lastSubmission, setLastSubmission] = useState<Date | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Auto-submit timer
  const autoSubmitTimer = useRef<NodeJS.Timeout | null>(null);
  const sessionId = useRef(generateSessionId());
  
  const {
    autoSubmitDelay = 5000, // 5 seconds default
    maxBatchSize = 10,
    batchId = `batch_${Date.now()}`
  } = options;

  /**
   * Add feedback to the queue
   */
  const addFeedback = useCallback(async (
    feedback: FeedbackItem,
    feedbackOptions: FeedbackOptions = {}
  ) => {
    if (!userId) {
      console.warn('User not authenticated, feedback not collected');
      return;
    }

    const enhancedFeedback = {
      ...feedback,
      userId,
      sessionId: sessionId.current,
      timestamp: new Date(),
      source: 'explicit' as const
    };

    if (feedbackOptions.immediate) {
      // Submit immediately
      try {
        setIsSubmitting(true);
        const result = await submitSingleFeedback(enhancedFeedback, feedbackOptions);
        
        if (result.success) {
          setLastSubmission(new Date());
          if (result.insights) {
            setInsights(prev => [...prev, ...result.insights]);
          }
          feedbackOptions.onSuccess?.(result);
        } else {
          setErrors(prev => [...prev, result.error || 'Submission failed']);
          feedbackOptions.onError?.(result.error || 'Submission failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setErrors(prev => [...prev, errorMessage]);
        feedbackOptions.onError?.(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Add to batch queue
      setFeedbackQueue(prev => {
        const newQueue = [...prev, enhancedFeedback];
        
        // Auto-submit if queue reaches max size
        if (newQueue.length >= maxBatchSize) {
          submitBatchFeedback(newQueue, feedbackOptions);
          return [];
        }
        
        // Set auto-submit timer
        if (autoSubmitTimer.current) {
          clearTimeout(autoSubmitTimer.current);
        }
        
        autoSubmitTimer.current = setTimeout(() => {
          if (newQueue.length > 0) {
            submitBatchFeedback(newQueue, feedbackOptions);
            setFeedbackQueue([]);
          }
        }, autoSubmitDelay);
        
        return newQueue;
      });
    }
  }, [userId, autoSubmitDelay, maxBatchSize]);

  /**
   * Submit queued feedback manually
   */
  const submitQueuedFeedback = useCallback(async (feedbackOptions: FeedbackOptions = {}) => {
    if (feedbackQueue.length === 0) return;
    
    try {
      setIsSubmitting(true);
      const result = await submitBatchFeedback(feedbackQueue, feedbackOptions);
      
      if (result.success) {
        setFeedbackQueue([]);
        setLastSubmission(new Date());
        if (result.insights) {
          setInsights(prev => [...prev, ...result.insights]);
        }
        feedbackOptions.onSuccess?.(result);
      } else {
        setErrors(prev => [...prev, result.error || 'Batch submission failed']);
        feedbackOptions.onError?.(result.error || 'Batch submission failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => [...prev, errorMessage]);
      feedbackOptions.onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [feedbackQueue]);

  /**
   * Quick feedback helpers for common scenarios
   */
  const quickFeedback = {
    // Rate an itinerary
    rateItinerary: (itineraryId: string, rating: number, feedback?: string) => 
      addFeedback({
        feedbackType: 'itinerary_rating',
        targetType: 'itinerary',
        targetId: itineraryId,
        rating,
        feedback,
        sentiment: rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative'
      }),

    // Rate an activity
    rateActivity: (activityId: string, rating: number, details?: Record<string, any>) =>
      addFeedback({
        feedbackType: 'activity_feedback',
        targetType: 'activity',
        targetId: activityId,
        rating,
        sentiment: rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative',
        details
      }),

    // Feedback on a recommendation
    recommendationFeedback: (recommendationId: string, action: string, relevance?: number) =>
      addFeedback({
        feedbackType: 'recommendation_feedback',
        targetType: 'recommendation',
        targetId: recommendationId,
        details: {
          actionTaken: action,
          relevance
        },
        sentiment: ['booked', 'saved', 'shared'].includes(action) ? 'positive' : 
                  ['ignored', 'disliked'].includes(action) ? 'negative' : 'neutral'
      }),

    // Correct a preference
    correctPreference: (preferenceType: string, newValue: string, confidence: number = 0.9) =>
      addFeedback({
        feedbackType: 'preference_correction',
        targetType: 'preference',
        targetId: preferenceType,
        details: {
          correctedValue: newValue,
          confidence
        }
      }, { immediate: true }), // Preference corrections should be immediate

    // Report trip completion
    tripCompleted: (tripId: string, overallRating: number, highlights: string[]) =>
      addFeedback({
        feedbackType: 'trip_completion',
        targetType: 'overall',
        targetId: tripId,
        rating: overallRating,
        sentiment: overallRating >= 4 ? 'positive' : overallRating >= 3 ? 'neutral' : 'negative',
        details: {
          highlights,
          completionDate: new Date().toISOString()
        }
      }, { immediate: true }),

    // Accept or reject a suggestion
    suggestionResponse: (suggestionId: string, accepted: boolean, reason?: string) =>
      addFeedback({
        feedbackType: 'suggestion_acceptance',
        targetType: 'recommendation',
        targetId: suggestionId,
        sentiment: accepted ? 'positive' : 'negative',
        feedback: reason,
        details: {
          accepted,
          responseTime: Date.now()
        }
      })
  };

  /**
   * Get user insights
   */
  const getUserInsights = useCallback(async () => {
    if (!userId) return null;
    
    try {
      const response = await fetch('/api/ai/feedback/insights', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
        return data;
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
    
    return null;
  }, [userId]);

  /**
   * Predict satisfaction for an itinerary
   */
  const predictSatisfaction = useCallback(async (itinerary: any) => {
    if (!userId) return null;
    
    try {
      const response = await fetch('/api/ai/feedback/predict-satisfaction', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itinerary })
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error predicting satisfaction:', error);
    }
    
    return null;
  }, [userId]);

  /**
   * Clear errors
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  /**
   * Get feedback statistics
   */
  const getStats = useCallback(() => ({
    queuedFeedback: feedbackQueue.length,
    lastSubmission,
    totalInsights: insights.length,
    errors: errors.length,
    isSubmitting
  }), [feedbackQueue.length, lastSubmission, insights.length, errors.length, isSubmitting]);

  return {
    // Core functions
    addFeedback,
    submitQueuedFeedback,
    
    // Quick feedback helpers
    quickFeedback,
    
    // Insights and predictions
    getUserInsights,
    predictSatisfaction,
    
    // State
    isSubmitting,
    queuedFeedback: feedbackQueue.length,
    insights,
    errors,
    
    // Utilities
    clearErrors,
    getStats
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Submit single feedback item
 */
async function submitSingleFeedback(feedback: any, options: FeedbackOptions) {
  const response = await fetch('/api/ai/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...feedback,
      processingOptions: {
        generateInsights: options.generateInsights !== false,
        updatePreferences: options.updatePreferences !== false,
        recordBehavior: true
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit feedback');
  }

  return response.json();
}

/**
 * Submit batch feedback
 */
async function submitBatchFeedback(feedbackList: any[], options: FeedbackOptions) {
  const response = await fetch('/api/ai/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      feedback: feedbackList,
      batchId: `batch_${Date.now()}`,
      processingOptions: {
        generateInsights: options.generateInsights !== false,
        updatePreferences: options.updatePreferences !== false,
        recordBehavior: true
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit batch feedback');
  }

  return response.json();
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== FEEDBACK COLLECTION UTILITIES ====================

/**
 * Auto-track implicit feedback based on user interactions
 */
export function useImplicitFeedbackTracking() {
  const { addFeedback } = useFeedbackCollection({ autoSubmitDelay: 10000 });

  const trackTimeSpent = useCallback((targetId: string, targetType: string, timeMs: number) => {
    if (timeMs > 30000) { // Only track if user spent more than 30 seconds
      addFeedback({
        feedbackType: 'experience_report',
        targetType: targetType as any,
        targetId,
        details: {
          timeSpent: timeMs,
          engagement: timeMs > 120000 ? 'high' : timeMs > 60000 ? 'medium' : 'low'
        }
      });
    }
  }, [addFeedback]);

  const trackInteraction = useCallback((targetId: string, interactionType: string) => {
    addFeedback({
      feedbackType: 'experience_report',
      targetType: 'overall',
      targetId,
      details: {
        interactionType,
        timestamp: Date.now()
      }
    });
  }, [addFeedback]);

  return {
    trackTimeSpent,
    trackInteraction
  };
}

export default useFeedbackCollection;