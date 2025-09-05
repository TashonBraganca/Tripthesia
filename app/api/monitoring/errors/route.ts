import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ErrorContextSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
  timestamp: z.string(),
  environment: z.enum(['development', 'staging', 'production']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['client', 'server', 'database', 'api', 'auth', 'payment']),
  additionalData: z.record(z.any()).optional()
});

const ErrorReportSchema = z.object({
  id: z.string().optional(),
  error: z.string(),
  message: z.string().optional(), 
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  errorId: z.string(),
  timestamp: z.string(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
  userId: z.string().optional(),
  type: z.string().optional(),
  severity: z.string().optional(),
  context: ErrorContextSchema.optional(),
  fingerprint: z.string(),
  occurrenceCount: z.number(),
  firstOccurred: z.string(),
  lastOccurred: z.string()
});

const ErrorBatchSchema = z.object({
  errors: z.array(ErrorReportSchema),
  timestamp: z.string(),
  batchId: z.string()
});

// In-memory storage for development/testing
// In production, this would be sent to a proper monitoring service
const errorStore = new Map<string, any>();
const alertThresholds = {
  critical: 1,     // Alert immediately
  high: 5,         // Alert after 5 occurrences
  medium: 20,      // Alert after 20 occurrences
  low: 100         // Alert after 100 occurrences
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ErrorBatchSchema.parse(body);

    console.log(`📊 Processing error batch: ${validatedData.batchId}`);

    for (const error of validatedData.errors) {
      // Store error with aggregation
      const existingError = errorStore.get(error.fingerprint);
      if (existingError) {
        existingError.occurrenceCount += error.occurrenceCount;
        existingError.lastOccurred = error.lastOccurred;
      } else {
        errorStore.set(error.fingerprint, { ...error });
      }

      // Check alert thresholds
      const totalOccurrences = existingError 
        ? existingError.occurrenceCount 
        : error.occurrenceCount;

      if (error.context && shouldAlert(error.context.severity, totalOccurrences)) {
        await sendAlert(error, totalOccurrences);
      }

      // Log error based on severity
      logError(error);
    }

    return NextResponse.json({
      success: true,
      processed: validatedData.errors.length,
      batchId: validatedData.batchId
    });

  } catch (error) {
    console.error('Error processing error batch:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process error batch',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}

function shouldAlert(severity: string, occurrenceCount: number): boolean {
  const threshold = alertThresholds[severity as keyof typeof alertThresholds] || 100;
  return occurrenceCount >= threshold;
}

async function sendAlert(error: any, totalOccurrences: number): Promise<void> {
  const alertData = {
    timestamp: new Date().toISOString(),
    severity: error.context.severity,
    message: error.message,
    occurrenceCount: totalOccurrences,
    environment: error.context.environment,
    category: error.context.category,
    fingerprint: error.fingerprint,
    url: error.context.url,
    userId: error.context.userId,
    stack: error.stack,
    additionalData: error.context.additionalData
  };

  // In production, send to monitoring service
  console.error('🚨 ALERT:', alertData);

  // Could integrate with:
  // - Slack/Discord webhooks
  // - Email notifications
  // - PagerDuty
  // - Sentry
  // - DataDog
  
  try {
    // Example: Send to a webhook or monitoring service
    if (process.env.MONITORING_WEBHOOK_URL) {
      await fetch(process.env.MONITORING_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🚨 Critical Error Alert: ${error.message}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Severity:* ${error.context.severity.toUpperCase()}\n*Environment:* ${error.context.environment}\n*Category:* ${error.context.category}\n*Occurrences:* ${totalOccurrences}`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Message:* ${error.message}\n*URL:* ${error.context.url || 'Unknown'}`
              }
            }
          ]
        })
      });
    }
  } catch (webhookError) {
    console.error('Failed to send webhook alert:', webhookError);
  }
}

function logError(error: any): void {
  const logLevels: Record<string, 'info' | 'warn' | 'error'> = {
    low: 'info',
    medium: 'warn', 
    high: 'error',
    critical: 'error'
  };
  
  const logLevel = logLevels[error.context.severity] || 'info';

  const logData = {
    id: error.id,
    message: error.message,
    severity: error.context.severity,
    category: error.context.category,
    environment: error.context.environment,
    occurrenceCount: error.occurrenceCount,
    url: error.context.url,
    userId: error.context.userId,
    timestamp: error.context.timestamp
  };

  const logFunction = console[logLevel] as (message?: any, ...optionalParams: any[]) => void;
  logFunction(`[${error.context.category.toUpperCase()}] ${error.message}`, logData);
}

// Health check endpoint
export async function GET() {
  const stats = {
    totalErrors: errorStore.size,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  };

  return NextResponse.json(stats);
}