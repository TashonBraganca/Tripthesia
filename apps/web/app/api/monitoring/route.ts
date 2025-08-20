import { NextRequest, NextResponse } from "next/server";
import { trackEvent, trackError, trackPerformance } from "@/lib/monitoring";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";

export const runtime = 'edge';

// Validation schemas
const eventSchema = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.any()).optional(),
});

const errorSchema = z.object({
  error: z.string().min(1),
  context: z.record(z.any()).optional(),
});

const performanceSchema = z.object({
  operation: z.string().min(1).max(100),
  startTime: z.number(),
  metadata: z.record(z.any()).optional(),
});

// POST /api/monitoring/event
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    const body = await request.json();
    
    switch (type) {
      case 'event': {
        const { event, properties } = eventSchema.parse(body);
        trackEvent(event, properties, userId || undefined);
        break;
      }
      
      case 'error': {
        const { error, context } = errorSchema.parse(body);
        trackError(error, context);
        break;
      }
      
      case 'performance': {
        const { operation, startTime, metadata } = performanceSchema.parse(body);
        trackPerformance(operation, startTime, metadata);
        break;
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid monitoring type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Monitoring API error:', error);
    
    // Don't track monitoring errors to avoid infinite loops
    return NextResponse.json(
      { error: 'Failed to process monitoring request' },
      { status: 500 }
    );
  }
}

// GET /api/monitoring/health - Simple health check endpoint
export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}