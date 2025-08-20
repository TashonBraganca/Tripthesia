/**
 * WebSocket API Route for Real-time Collaborative Editing
 * Handles WebSocket connections for trip collaboration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { trackEvent, trackError } from '@/lib/monitoring';

// Collaboration event schemas (shared with client)
const CollaborationEventSchema = z.object({
  type: z.enum(['join', 'leave', 'edit', 'lock', 'unlock', 'comment', 'cursor', 'ping', 'pong']),
  tripId: z.string(),
  userId: z.string(),
  userName: z.string().optional(),
  timestamp: z.date().optional(),
  data: z.any().optional()
});

const TripEditEventSchema = z.object({
  type: z.literal('edit'),
  tripId: z.string(),
  userId: z.string(),
  userName: z.string(),
  editType: z.enum(['add_activity', 'remove_activity', 'move_activity', 'edit_activity', 'edit_trip_details']),
  targetId: z.string().optional(),
  before: z.any().optional(),
  after: z.any().optional(),
  timestamp: z.date()
});

// In-memory storage for WebSocket connections (production should use Redis)
const connections = new Map<string, Set<WebSocket & { userId: string; userName: string }>>();
const userConnections = new Map<string, WebSocket & { tripId: string }>();

export async function GET(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const { userId } = getAuth(req);
    const { tripId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });
    }

    // Check if this is a WebSocket upgrade request
    const upgrade = req.headers.get('upgrade');
    if (upgrade !== 'websocket') {
      return NextResponse.json({ error: 'WebSocket upgrade required' }, { status: 400 });
    }

    // For development, we'll use Server-Sent Events as WebSocket fallback
    // In production with proper WebSocket support, this would handle the upgrade
    return handleSSEConnection(req, tripId, userId);

  } catch (error) {
    trackError(error instanceof Error ? error : new Error(String(error)), {
      service: 'websocket_api',
      endpoint: 'collaborate'
    });
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Fallback to Server-Sent Events for development
async function handleSSEConnection(req: NextRequest, tripId: string, userId: string) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectMessage = {
        type: 'system',
        message: 'Connected to collaborative session',
        tripId,
        userId,
        timestamp: new Date().toISOString()
      };
      
      const data = `data: ${JSON.stringify(connectMessage)}\n\n`;
      controller.enqueue(encoder.encode(data));

      // Store connection for broadcasting
      if (!connections.has(tripId)) {
        connections.set(tripId, new Set());
      }
      
      // Mock WebSocket-like connection for SSE
      const mockConnection = {
        userId,
        tripId,
        send: (data: string) => {
          try {
            const sseData = `data: ${data}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          } catch (e) {
            // Connection closed
          }
        },
        close: () => {
          controller.close();
        }
      } as any;

      connections.get(tripId)?.add(mockConnection);
      
      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          const heartbeatMessage = {
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          };
          const data = `data: ${JSON.stringify(heartbeatMessage)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (e) {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      const cleanup = () => {
        clearInterval(heartbeat);
        const tripConnections = connections.get(tripId);
        if (tripConnections) {
          tripConnections.delete(mockConnection);
          if (tripConnections.size === 0) {
            connections.delete(tripId);
          }
        }
        
        // Broadcast leave event to remaining connections
        broadcastToTrip(tripId, {
          type: 'leave',
          tripId,
          userId,
          timestamp: new Date().toISOString()
        }, userId);

        trackEvent('collaboration_disconnected', {
          trip_id: tripId,
          user_id: userId,
          connection_type: 'sse'
        });
      };

      // Handle client disconnect
      req.signal.addEventListener('abort', cleanup);
      
      trackEvent('collaboration_connected', {
        trip_id: tripId,
        user_id: userId,
        connection_type: 'sse'
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    },
  });
}

// Handle WebSocket messages (for when proper WebSocket support is available)
export async function POST(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const { userId } = getAuth(req);
    const { tripId } = params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const event = CollaborationEventSchema.parse({
      ...body,
      tripId,
      userId,
      timestamp: new Date()
    });

    // Handle different event types
    switch (event.type) {
      case 'join':
        await handleJoinEvent(event);
        break;
      case 'leave':
        await handleLeaveEvent(event);
        break;
      case 'edit':
        await handleEditEvent(event as z.infer<typeof TripEditEventSchema>);
        break;
      case 'lock':
      case 'unlock':
        await handleLockEvent(event);
        break;
      case 'comment':
        await handleCommentEvent(event);
        break;
      case 'cursor':
        await handleCursorEvent(event);
        break;
      default:
        break;
    }

    // Broadcast event to all connected clients in the trip
    broadcastToTrip(tripId, event, userId);

    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid event format' }, { status: 400 });
    }
    
    trackError(error instanceof Error ? error : new Error(String(error)), {
      service: 'websocket_api',
      endpoint: 'collaborate_post'
    });
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Event handlers
async function handleJoinEvent(event: any) {
  trackEvent('collaboration_join', {
    trip_id: event.tripId,
    user_id: event.userId
  });
}

async function handleLeaveEvent(event: any) {
  trackEvent('collaboration_leave', {
    trip_id: event.tripId,
    user_id: event.userId
  });
}

async function handleEditEvent(event: z.infer<typeof TripEditEventSchema>) {
  // Store edit in database for persistence
  // This would integrate with your trip database schema
  
  trackEvent('collaboration_edit', {
    trip_id: event.tripId,
    user_id: event.userId,
    edit_type: event.editType
  });
}

async function handleLockEvent(event: any) {
  // Store lock state in database/Redis for persistence
  
  trackEvent('collaboration_lock', {
    trip_id: event.tripId,
    user_id: event.userId,
    lock_type: event.type,
    target_id: event.data?.activityId
  });
}

async function handleCommentEvent(event: any) {
  // Store comment in database
  
  trackEvent('collaboration_comment', {
    trip_id: event.tripId,
    user_id: event.userId,
    comment_id: event.data?.commentId
  });
}

async function handleCursorEvent(event: any) {
  // Cursor events are ephemeral, no storage needed
  // Just broadcast to other users
}

// Broadcast message to all connections in a trip
function broadcastToTrip(tripId: string, message: any, excludeUserId?: string) {
  const tripConnections = connections.get(tripId);
  if (!tripConnections) return;

  const messageStr = JSON.stringify({
    ...message,
    timestamp: new Date().toISOString()
  });

  tripConnections.forEach((connection) => {
    // Don't send message back to sender
    if (excludeUserId && connection.userId === excludeUserId) return;
    
    try {
      connection.send(messageStr);
    } catch (error) {
      // Connection is closed, remove it
      tripConnections.delete(connection);
    }
  });

  // Clean up empty trip connections
  if (tripConnections.size === 0) {
    connections.delete(tripId);
  }
}

// Get active collaborators for a trip
export async function GET_collaborators(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const { userId } = getAuth(req);
    const { tripId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tripConnections = connections.get(tripId);
    const collaborators = tripConnections ? 
      Array.from(tripConnections).map(conn => ({
        userId: conn.userId,
        userName: conn.userName || 'Anonymous',
        isOnline: true,
        lastSeen: new Date(),
        color: generateUserColor(conn.userId)
      })) : [];

    return NextResponse.json({ collaborators });

  } catch (error) {
    trackError(error instanceof Error ? error : new Error(String(error)), {
      service: 'websocket_api',
      endpoint: 'get_collaborators'
    });
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Utility function to generate consistent user colors
function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}