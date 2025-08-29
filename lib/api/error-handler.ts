/**
 * Standardized API error handling and response formatting
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
  statusCode: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
    requestId?: string;
    version: string;
  };
}

// Standard error codes
export const ErrorCodes = {
  // Client Errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  MALICIOUS_INPUT: 'MALICIOUS_INPUT',
  
  // Server Errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Create standardized API error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any,
  path?: string
): NextResponse {
  const error: ApiError = {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    path,
    statusCode,
  };

  const response: ApiResponse = {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      version: '2.0',
    },
  };

  // Log error for monitoring
  console.error('API Error:', {
    code,
    message,
    statusCode,
    details,
    path,
    timestamp: error.timestamp,
  });

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Create standardized API success response
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: '2.0',
    },
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: ZodError, path?: string): NextResponse {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    value: err.received || undefined,
  }));

  return createErrorResponse(
    ErrorCodes.VALIDATION_ERROR,
    'Input validation failed',
    400,
    { validationErrors: details },
    path
  );
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: any, path?: string): NextResponse {
  // Don't expose internal database errors to clients
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  let message = 'Database operation failed';
  let details: any = undefined;

  if (isDevelopment) {
    message = error.message || message;
    details = {
      stack: error.stack,
      code: error.code,
    };
  }

  return createErrorResponse(
    ErrorCodes.DATABASE_ERROR,
    message,
    500,
    details,
    path
  );
}

/**
 * Handle external API errors
 */
export function handleExternalApiError(
  service: string,
  error: any,
  path?: string
): NextResponse {
  const message = `External service error: ${service}`;
  const details = {
    service,
    statusCode: error.response?.status,
    timeout: error.code === 'ECONNABORTED',
  };

  return createErrorResponse(
    ErrorCodes.EXTERNAL_API_ERROR,
    message,
    502,
    details,
    path
  );
}

/**
 * Handle authentication errors
 */
export function handleAuthError(message: string = 'Authentication required', path?: string): NextResponse {
  return createErrorResponse(
    ErrorCodes.AUTHENTICATION_REQUIRED,
    message,
    401,
    undefined,
    path
  );
}

/**
 * Handle authorization errors
 */
export function handleAuthorizationError(
  message: string = 'Insufficient permissions',
  path?: string
): NextResponse {
  return createErrorResponse(
    ErrorCodes.AUTHORIZATION_FAILED,
    message,
    403,
    undefined,
    path
  );
}

/**
 * Handle rate limit errors
 */
export function handleRateLimitError(
  retryAfter: number,
  path?: string
): NextResponse {
  const response = createErrorResponse(
    ErrorCodes.RATE_LIMITED,
    'Rate limit exceeded',
    429,
    { retryAfter },
    path
  );

  response.headers.set('Retry-After', retryAfter.toString());
  return response;
}

/**
 * Global error handler wrapper for API routes
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('Unhandled API error:', error);

      // Handle known error types
      if (error instanceof ZodError) {
        return handleValidationError(error);
      }

      // Handle database errors (check for common DB error patterns)
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code?.startsWith('P') || dbError.severity) {
          return handleDatabaseError(dbError);
        }
      }

      // Default to internal server error
      return createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred',
        500,
        process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        } : undefined
      );
    }
  };
}