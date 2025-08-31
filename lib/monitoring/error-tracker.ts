/**
 * Production Error Tracking System
 * Comprehensive error monitoring and alerting for Tripthesia
 */

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  environment: 'development' | 'staging' | 'production';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'client' | 'server' | 'database' | 'api' | 'auth' | 'payment';
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  fingerprint: string;
  occurrenceCount: number;
  firstOccurred: string;
  lastOccurred: string;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private errorQueue: ErrorReport[] = [];
  private isProcessing = false;
  private maxRetries = 3;
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds

  private constructor() {
    this.initializeErrorHandling();
    this.startBatchProcessor();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private initializeErrorHandling(): void {
    // Global error handler for unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError(event.error || new Error(event.message), {
          environment: process.env.NODE_ENV as any || 'development',
          severity: 'high',
          category: 'client',
          url: event.filename,
          additionalData: {
            lineno: event.lineno,
            colno: event.colno,
            type: 'javascript_error'
          }
        });
      });

      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(
          new Error(event.reason?.message || 'Unhandled Promise Rejection'),
          {
            environment: process.env.NODE_ENV as any || 'development',
            severity: 'high',
            category: 'client',
            additionalData: {
              reason: event.reason,
              type: 'unhandled_rejection'
            }
          }
        );
      });

      // Performance monitoring
      this.initializePerformanceMonitoring();
    }

    // Node.js error handling
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.trackError(error, {
          environment: process.env.NODE_ENV as any || 'development',
          severity: 'critical',
          category: 'server',
          additionalData: {
            type: 'uncaught_exception'
          }
        });
      });

      process.on('unhandledRejection', (reason, promise) => {
        this.trackError(
          new Error(`Unhandled Rejection: ${reason}`),
          {
            environment: process.env.NODE_ENV as any || 'development',
            severity: 'critical',
            category: 'server',
            additionalData: {
              reason,
              promise: promise.toString(),
              type: 'unhandled_rejection'
            }
          }
        );
      });
    }
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Core Web Vitals monitoring
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            const lcp = entry.startTime;
            if (lcp > 4000) { // Poor LCP threshold
              this.trackError(new Error('Poor LCP Performance'), {
                environment: process.env.NODE_ENV as any || 'development',
                severity: 'medium',
                category: 'client',
                additionalData: {
                  type: 'performance',
                  metric: 'LCP',
                  value: lcp,
                  threshold: 4000
                }
              });
            }
          }

          if (entry.entryType === 'first-input') {
            const fid = (entry as any).processingStart - entry.startTime;
            if (fid > 300) { // Poor FID threshold
              this.trackError(new Error('Poor FID Performance'), {
                environment: process.env.NODE_ENV as any || 'development',
                severity: 'medium',
                category: 'client',
                additionalData: {
                  type: 'performance',
                  metric: 'FID',
                  value: fid,
                  threshold: 300
                }
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });

      // CLS monitoring using Layout Shift API
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        if (clsValue > 0.25) { // Poor CLS threshold
          this.trackError(new Error('Poor CLS Performance'), {
            environment: process.env.NODE_ENV as any || 'development',
            severity: 'medium',
            category: 'client',
            additionalData: {
              type: 'performance',
              metric: 'CLS',
              value: clsValue,
              threshold: 0.25
            }
          });
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  trackError(error: Error, context: Partial<ErrorContext> = {}): string {
    const errorId = this.generateErrorId();
    const fingerprint = this.generateFingerprint(error, context);
    
    const fullContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      environment: 'development',
      severity: 'medium',
      category: 'client',
      ...context,
      userId: context.userId || this.getUserId(),
      sessionId: context.sessionId || this.getSessionId(),
      userAgent: context.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : undefined),
      url: context.url || (typeof window !== 'undefined' ? window.location.href : undefined)
    };

    const errorReport: ErrorReport = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      context: fullContext,
      fingerprint,
      occurrenceCount: 1,
      firstOccurred: fullContext.timestamp,
      lastOccurred: fullContext.timestamp
    };

    // Check if we've seen this error before (deduplication)
    const existingError = this.errorQueue.find(e => e.fingerprint === fingerprint);
    if (existingError) {
      existingError.occurrenceCount++;
      existingError.lastOccurred = fullContext.timestamp;
    } else {
      this.errorQueue.push(errorReport);
    }

    // Immediate alert for critical errors
    if (fullContext.severity === 'critical') {
      this.sendImmediateAlert(errorReport);
    }

    console.error('Error tracked:', {
      id: errorId,
      message: error.message,
      severity: fullContext.severity,
      category: fullContext.category
    });

    return errorId;
  }

  trackCustomEvent(eventName: string, data: Record<string, any>, context: Partial<ErrorContext> = {}): void {
    this.trackError(new Error(`Custom Event: ${eventName}`), {
      ...context,
      severity: 'low',
      additionalData: {
        ...context.additionalData,
        eventName,
        eventData: data,
        type: 'custom_event'
      }
    });
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: Error, context: Partial<ErrorContext>): string {
    const key = `${error.message}_${context.category}_${context.url || 'unknown'}`;
    return btoa(key).substr(0, 16);
  }

  private getUserId(): string | undefined {
    // Try to get user ID from various sources
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return user.id || user.userId;
        } catch {
          return undefined;
        }
      }
    }
    return undefined;
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('tripthesia-session-id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('tripthesia-session-id', sessionId);
      }
      return sessionId;
    }
    return `server_${Date.now()}`;
  }

  private async sendImmediateAlert(errorReport: ErrorReport): Promise<void> {
    try {
      // Send to monitoring service (e.g., Sentry, DataDog, or custom endpoint)
      await fetch('/api/monitoring/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert: 'critical_error',
          error: errorReport,
          timestamp: new Date().toISOString()
        })
      });
    } catch (alertError) {
      console.error('Failed to send immediate alert:', alertError);
    }
  }

  private startBatchProcessor(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (this.errorQueue.length > 0 && !this.isProcessing) {
          this.processBatch();
        }
      }, this.flushInterval);
    }
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.errorQueue.splice(0, this.batchSize);

    try {
      await this.sendErrorBatch(batch);
    } catch (error) {
      console.error('Failed to send error batch:', error);
      // Re-queue failed errors (up to max retries)
      batch.forEach(errorReport => {
        if (!errorReport.context.additionalData?.retryCount) {
          errorReport.context.additionalData = {
            ...errorReport.context.additionalData,
            retryCount: 1
          };
          this.errorQueue.unshift(errorReport);
        } else if (errorReport.context.additionalData.retryCount < this.maxRetries) {
          errorReport.context.additionalData.retryCount++;
          this.errorQueue.unshift(errorReport);
        }
      });
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendErrorBatch(errors: ErrorReport[]): Promise<void> {
    const response = await fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        errors,
        timestamp: new Date().toISOString(),
        batchId: `batch_${Date.now()}`
      })
    });

    if (!response.ok) {
      throw new Error(`Error reporting failed: ${response.status}`);
    }
  }

  // Public method to manually flush errors
  async flush(): Promise<void> {
    if (this.errorQueue.length > 0) {
      await this.processBatch();
    }
  }

  // Get error statistics
  getStats(): { queueSize: number; processing: boolean } {
    return {
      queueSize: this.errorQueue.length,
      processing: this.isProcessing
    };
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();

// Convenience functions
export const trackError = (error: Error, context?: Partial<ErrorContext>) => 
  errorTracker.trackError(error, context);

export const trackCustomEvent = (eventName: string, data: Record<string, any>, context?: Partial<ErrorContext>) =>
  errorTracker.trackCustomEvent(eventName, data, context);

export const flushErrors = () => errorTracker.flush();

export const getErrorStats = () => errorTracker.getStats();