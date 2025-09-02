import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'DATABASE_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    // Check Clerk configuration
    let clerkStatus = 'ok';
    if (missingVars.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') || 
        missingVars.includes('CLERK_SECRET_KEY')) {
      clerkStatus = 'missing_keys';
    }
    
    // Basic system checks
    const nodeVersion = process.version;
    const platform = process.platform;
    const arch = process.arch;
    const uptime = process.uptime();
    
    const healthData = {
      status: missingVars.length === 0 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - start,
      system: {
        node_version: nodeVersion,
        platform,
        arch,
        uptime_seconds: Math.floor(uptime)
      },
      services: {
        clerk: clerkStatus,
        database: process.env.DATABASE_URL ? 'configured' : 'missing'
      },
      environment: {
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV,
        vercel_region: process.env.VERCEL_REGION
      },
      missing_env_vars: missingVars,
      deployment: {
        vercel_url: process.env.VERCEL_URL,
        vercel_git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA,
        vercel_git_commit_message: process.env.VERCEL_GIT_COMMIT_MESSAGE
      }
    };
    
    return NextResponse.json(healthData, {
      status: missingVars.length === 0 ? 200 : 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - start
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Health check endpoint - use GET method',
    available_methods: ['GET']
  }, { status: 405 });
}