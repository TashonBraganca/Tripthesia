import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/test',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/health',
  '/shared/(.*)',
  '/pricing',
  '/about',
  '/privacy',
  '/terms',
]);

// Define routes that require Pro subscription
const isProRoute = createRouteMatcher([
  '/dashboard/analytics',
  '/api/ai/advanced',
  '/api/export/advanced',
]);

export default clerkMiddleware((auth, req) => {
  const path = req.nextUrl.pathname;
  
  // Allow all Clerk-related routes without interference
  if (path.startsWith('/sign-in') || path.startsWith('/sign-up') || path.startsWith('/_clerk')) {
    return NextResponse.next();
  }
  
  // Always allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For protected routes, let client-side handle auth redirects
  // We'll let the trips page handle its own authentication
  if (path === '/trips') {
    return NextResponse.next();
  }

  // Only check auth for truly protected routes (future admin/API routes)
  try {
    // Additional Pro subscription check for premium routes
    if (isProRoute(req)) {
      const { userId } = auth();
      if (!userId) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
      const response = NextResponse.next();
      response.headers.set('x-require-pro', 'true');
      return response;
    }
    
    return NextResponse.next();
  } catch (error) {
    // Only log error, don't redirect
    console.warn('Auth middleware warning:', error);
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};