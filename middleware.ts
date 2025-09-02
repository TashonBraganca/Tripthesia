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
  
  // Allow all Clerk-related routes and static assets without interference
  if (path.startsWith('/sign-in') || path.startsWith('/sign-up') || 
      path.startsWith('/_clerk') || path.startsWith('/_next') ||
      path.startsWith('/api/webhooks/') || path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
    return NextResponse.next();
  }
  
  // Always allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Enhanced error handling for protected routes
  try {
    // Protected routes require authentication
    const protectedRoutes = ['/trips', '/new', '/upgrade', '/dashboard'];
    if (protectedRoutes.some(route => path.startsWith(route))) {
      try {
        const { userId } = auth();
        if (!userId) {
          // Create more robust redirect with fallback
          const redirectUrl = new URL('/sign-in', req.url);
          redirectUrl.searchParams.set('redirectTo', path);
          return NextResponse.redirect(redirectUrl);
        }
      } catch (authError) {
        console.error('Authentication error:', authError);
        // Fallback to sign-in on auth errors
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
    }

    // Additional Pro subscription check for premium routes
    if (isProRoute(req)) {
      try {
        const { userId } = auth();
        if (!userId) {
          return NextResponse.redirect(new URL('/sign-in', req.url));
        }
        const response = NextResponse.next();
        response.headers.set('x-require-pro', 'true');
        return response;
      } catch (proError) {
        console.error('Pro route auth error:', proError);
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    // Enhanced error logging with path context
    console.error(`Middleware error for path ${path}:`, error);
    
    // For critical paths, redirect to home instead of breaking
    if (path.startsWith('/new') || path.startsWith('/trips')) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
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