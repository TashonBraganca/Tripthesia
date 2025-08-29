/**
 * Advanced API middleware for request/response processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { performanceTracker, PerformanceTimer } from '@/lib/monitoring/performance';
import { createRequestLogger } from '@/lib/monitoring/logging';
import { apiRateLimit } from '@/lib/security/rate-limit';
import { createErrorResponse, ErrorCodes } from '@/lib/api/error-handler';
import { z } from 'zod';

export interface MiddlewareContext {
  requestId: string;
  userId?: string;
  startTime: number;
  logger: ReturnType<typeof createRequestLogger>;
  performanceTimer: PerformanceTimer;
}

export interface MiddlewareOptions {
  auth?: boolean;
  rateLimit?: boolean;
  validation?: {
    body?: z.ZodSchema;
    query?: z.ZodSchema;
    params?: z.ZodSchema;
  };
  roles?: string[];
  subscription?: string[];
}

type MiddlewareHandler = (
  request: NextRequest,
  context: MiddlewareContext
) => Promise<NextResponse> | NextResponse;

/**
 * Enhanced middleware composer with comprehensive request processing
 */
export function withMiddleware(
  handler: MiddlewareHandler,
  options: MiddlewareOptions = {}
) {
  return async (request: NextRequest, routeParams?: any): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    let userId: string | undefined = undefined;
    
    // Create request-scoped logger
    const logger = createRequestLogger(requestId);
    
    // Create performance timer
    const performanceTimer = new PerformanceTimer(
      `api_request_${request.method.toLowerCase()}_${request.nextUrl.pathname.replace(/\//g, '_')}`,
      {
        method: request.method,
        path: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    );

    try {
      logger.info('API request started', {
        method: request.method,
        path: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent'),
        ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      });

      // Rate limiting
      if (options.rateLimit !== false) {
        const rateLimitResult = await apiRateLimit(request);
        if (rateLimitResult) {
          logger.warn('Request rate limited', {
            path: request.nextUrl.pathname,
            ip: request.ip || request.headers.get('x-forwarded-for'),
          });
          return rateLimitResult;
        }
      }

      // Authentication
      if (options.auth) {
        try {
          const authResult = auth();
          userId = authResult.userId || undefined;
          
          if (!userId) {
            logger.warn('Unauthorized API request', {
              path: request.nextUrl.pathname,
            });
            return createErrorResponse(
              ErrorCodes.AUTHENTICATION_REQUIRED,
              'Authentication required',
              401,
              undefined,
              request.nextUrl.pathname
            );
          }
        } catch (error) {
          logger.error('Authentication error', error as Error);
          return createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication failed',
            401,
            undefined,
            request.nextUrl.pathname
          );
        }
      }

      // Role-based authorization
      if (options.roles && options.roles.length > 0 && userId) {
        // In a real implementation, you'd check user roles from database
        // For now, we'll assume admin role checking
        const userRoles = await getUserRoles(userId);
        const hasRequiredRole = options.roles.some(role => userRoles.includes(role));
        
        if (!hasRequiredRole) {
          logger.warn('Insufficient permissions', {
            userId,
            requiredRoles: options.roles,
            userRoles,
          });
          return createErrorResponse(
            ErrorCodes.AUTHORIZATION_FAILED,
            'Insufficient permissions',
            403,
            { requiredRoles: options.roles },
            request.nextUrl.pathname
          );
        }
      }

      // Input validation
      if (options.validation) {
        const validationResult = await validateRequest(request, options.validation, routeParams);
        if (validationResult) {
          logger.warn('Request validation failed', {
            validationErrors: validationResult,
          });
          return validationResult;
        }
      }

      // Create middleware context
      const context: MiddlewareContext = {
        requestId,
        userId,
        startTime,
        logger,
        performanceTimer,
      };

      // Execute handler
      const response = await handler(request, context);
      
      // Log successful completion
      const duration = performanceTimer.end();
      logger.info('API request completed', {
        statusCode: response.status,
        duration,
      });

      // Track performance metrics
      performanceTracker.trackRoute({
        path: request.nextUrl.pathname,
        method: request.method,
        statusCode: response.status,
        duration,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent') || undefined,
        userId,
      });

      // Add response headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${duration}ms`);

      return response;

    } catch (error) {
      const duration = performanceTimer.end();
      
      logger.error('API request failed', error as Error, {
        duration,
        path: request.nextUrl.pathname,
      });

      // Track error metrics
      performanceTracker.trackRoute({
        path: request.nextUrl.pathname,
        method: request.method,
        statusCode: 500,
        duration,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent') || undefined,
        userId,
      });

      // Handle known error types
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Input validation failed',
          400,
          { validationErrors: error.errors },
          request.nextUrl.pathname
        );
      }

      // Default error response
      return createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred',
        500,
        process.env.NODE_ENV === 'development' ? {
          error: error instanceof Error ? error.message : String(error),
          requestId,
        } : { requestId },
        request.nextUrl.pathname
      );
    }
  };
}

/**
 * Validate request inputs against schemas
 */
async function validateRequest(
  request: NextRequest,
  validation: MiddlewareOptions['validation'],
  routeParams?: any
): Promise<NextResponse | null> {
  const errors: Record<string, string> = {};

  // Validate body
  if (validation?.body) {
    try {
      const body = await request.json();
      validation.body.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors[`body.${err.path.join('.')}`] = err.message;
        });
      } else {
        errors.body = 'Invalid JSON body';
      }
    }
  }

  // Validate query parameters
  if (validation?.query) {
    try {
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      validation.query.parse(searchParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors[`query.${err.path.join('.')}`] = err.message;
        });
      }
    }
  }

  // Validate route parameters
  if (validation?.params && routeParams) {
    try {
      validation.params.parse(routeParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors[`params.${err.path.join('.')}`] = err.message;
        });
      }
    }
  }

  // Return validation error if any errors found
  if (Object.keys(errors).length > 0) {
    return createErrorResponse(
      ErrorCodes.VALIDATION_ERROR,
      'Request validation failed',
      400,
      { validationErrors: errors },
      request.nextUrl.pathname
    );
  }

  return null;
}

/**
 * Get user roles (placeholder implementation)
 */
async function getUserRoles(userId: string): Promise<string[]> {
  // In a real implementation, this would query the database
  // For now, return empty array or mock admin role
  try {
    // Check if user is admin (placeholder logic)
    const adminUsers = process.env.ADMIN_USER_IDS?.split(',') || [];
    if (adminUsers.includes(userId)) {
      return ['admin'];
    }
    
    return ['user'];
  } catch {
    return ['user'];
  }
}

/**
 * Request context helper for accessing middleware context in handlers
 */
export function getRequestContext(): MiddlewareContext | null {
  // In Next.js, we'd typically use AsyncLocalStorage for this
  // For now, return null as this is a placeholder
  return null;
}