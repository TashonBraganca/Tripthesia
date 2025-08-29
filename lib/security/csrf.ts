import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { setInCache, getFromCache } from '@/lib/redis';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds

// Generate a random CSRF token
function generateCSRFToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < CSRF_TOKEN_LENGTH; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Get or create CSRF token for a user
export async function getCSRFToken(userId: string): Promise<string> {
  const cacheKey = `csrf:${userId}`;
  
  try {
    // Try to get existing token
    let token = await getFromCache<string>(cacheKey);
    
    if (!token) {
      // Generate new token
      token = generateCSRFToken();
      await setInCache(cacheKey, token, CSRF_TOKEN_EXPIRY);
    }
    
    return token;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    // Return a new token on error
    return generateCSRFToken();
  }
}

// Validate CSRF token
export async function validateCSRFToken(
  userId: string, 
  providedToken: string
): Promise<boolean> {
  if (!providedToken || !userId) {
    return false;
  }

  try {
    const cacheKey = `csrf:${userId}`;
    const storedToken = await getFromCache<string>(cacheKey);
    
    return storedToken === providedToken;
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}

// CSRF middleware for API routes
export async function validateCSRF(
  request: NextRequest,
  requireToken: boolean = true
): Promise<NextResponse | null> {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null;
  }

  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!requireToken) {
      return null; // Skip CSRF validation
    }

    const csrfToken = request.headers.get('X-CSRF-Token') || 
                     request.headers.get('x-csrf-token');

    if (!csrfToken) {
      return NextResponse.json(
        { 
          error: 'CSRF token missing',
          details: 'Include X-CSRF-Token header'
        },
        { status: 403 }
      );
    }

    const isValid = await validateCSRFToken(userId, csrfToken);
    
    if (!isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid CSRF token',
          details: 'CSRF token is invalid or expired'
        },
        { status: 403 }
      );
    }

    return null; // Valid CSRF token
  } catch (error) {
    console.error('CSRF validation error:', error);
    return NextResponse.json(
      { error: 'CSRF validation failed' },
      { status: 500 }
    );
  }
}

// API route to get CSRF token
export async function generateCSRFTokenResponse(): Promise<NextResponse> {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = await getCSRFToken(userId);
    
    return NextResponse.json({
      csrfToken: token,
      expiresIn: CSRF_TOKEN_EXPIRY,
    });
  } catch (error) {
    console.error('CSRF token generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}