// Real-time Collaboration WebSocket API - Phase 10 Advanced Features
// WebSocket endpoint for collaborative trip planning

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// In-memory storage for development (use Redis/database in production)
const activeConnections = new Map<string, WebSocket>();
const tripSessions = new Map<string, Set<string>>();
const userSessions = new Map<string, { tripId: string; userInfo: any }>();

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(request.url);
    const tripId = url.searchParams.get('tripId');
    const userIdParam = url.searchParams.get('userId');

    if (!tripId || !userIdParam || userIdParam !== userId) {
      return new Response('Invalid parameters', { status: 400 });
    }

    // Check if WebSocket upgrade is requested
    const upgradeHeader = request.headers.get('upgrade');
    if (upgradeHeader?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    // In a real implementation, you'd use a WebSocket library like 'ws'
    // For now, we'll return a mock response indicating WebSocket support
    return new Response(
      JSON.stringify({
        message: 'WebSocket endpoint ready',
        tripId,
        userId: userIdParam,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Upgrade': 'websocket',
          'Connection': 'Upgrade',
        },
      }
    );
  } catch (error) {
    console.error('WebSocket connection error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Handle WebSocket connection (pseudo-implementation)
function handleWebSocketConnection(ws: WebSocket, tripId: string, userId: string) {
  // Add connection to active sessions
  const connectionId = `${userId}-${Date.now()}`;
  activeConnections.set(connectionId, ws);
  
  // Add user to trip session
  if (!tripSessions.has(tripId)) {
    tripSessions.set(tripId, new Set());
  }
  tripSessions.get(tripId)?.add(userId);
  
  // Store user session info
  userSessions.set(userId, { tripId, userInfo: {} });

  console.log(`👥 User ${userId} joined trip ${tripId}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection-established',
    data: {
      connectionId,
      tripId,
      userId,
      timestamp: new Date().toISOString(),
    },
  }));

  // Notify other users in the trip
  broadcastToTrip(tripId, userId, {
    type: 'collaborator-joined',
    data: {
      userId,
      name: 'User', // Would get from user profile
      timestamp: new Date().toISOString(),
    },
  });

  // Handle incoming messages
  ws.addEventListener('message', (event) => {
    handleMessage(ws, tripId, userId, JSON.parse(event.data));
  });

  // Handle connection close
  ws.addEventListener('close', () => {
    handleDisconnection(connectionId, tripId, userId);
  });

  // Handle connection errors
  ws.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
    handleDisconnection(connectionId, tripId, userId);
  });
}

function handleMessage(ws: WebSocket, tripId: string, userId: string, message: any) {
  console.log('📨 Received message:', message.type, 'from', userId);

  switch (message.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
      
    case 'cursor-move':
      broadcastToTrip(tripId, userId, {
        type: 'cursor-moved',
        data: {
          userId,
          cursor: message.data.cursor,
          timestamp: new Date().toISOString(),
        },
      });
      break;
      
    case 'content-change':
      // Validate and transform the operation
      const operation = message.data;
      
      // Broadcast to other collaborators
      broadcastToTrip(tripId, userId, {
        type: 'content-changed',
        data: {
          ...operation,
          author: userId,
          timestamp: new Date().toISOString(),
        },
      });
      
      // Could save to database here
      console.log('💾 Content change:', operation.operation, 'by', userId);
      break;
      
    case 'user-join':
      // Update user info
      userSessions.set(userId, {
        tripId,
        userInfo: message.data,
      });
      break;
      
    case 'user-leave':
      // Handle explicit leave
      handleUserLeave(tripId, userId);
      break;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
}

function broadcastToTrip(tripId: string, excludeUserId: string, message: any) {
  const tripUsers = tripSessions.get(tripId);
  if (!tripUsers) return;

  tripUsers.forEach(userId => {
    if (userId === excludeUserId) return;
    
    // Find active connections for this user
    activeConnections.forEach((ws, connectionId) => {
      if (connectionId.startsWith(userId)) {
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to send message to', userId, error);
          // Remove dead connection
          activeConnections.delete(connectionId);
        }
      }
    });
  });
}

function handleDisconnection(connectionId: string, tripId: string, userId: string) {
  console.log(`👋 User ${userId} disconnected from trip ${tripId}`);
  
  // Remove connection
  activeConnections.delete(connectionId);
  
  // Check if user has other active connections
  const hasOtherConnections = Array.from(activeConnections.keys()).some(id => 
    id.startsWith(userId)
  );
  
  if (!hasOtherConnections) {
    // Remove user from trip session
    tripSessions.get(tripId)?.delete(userId);
    userSessions.delete(userId);
    
    // Notify other users
    broadcastToTrip(tripId, userId, {
      type: 'collaborator-left',
      data: {
        userId,
        name: 'User', // Would get from stored user info
        timestamp: new Date().toISOString(),
      },
    });
  }
}

function handleUserLeave(tripId: string, userId: string) {
  // Remove user from all sessions
  const userConnections = Array.from(activeConnections.entries()).filter(([id]) => 
    id.startsWith(userId)
  );
  
  userConnections.forEach(([connectionId, ws]) => {
    ws.close();
    activeConnections.delete(connectionId);
  });
  
  tripSessions.get(tripId)?.delete(userId);
  userSessions.delete(userId);
  
  console.log(`🚪 User ${userId} left trip ${tripId}`);
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { action, tripId, data } = body;

    switch (action) {
      case 'get-active-users':
        const activeUsers = Array.from(tripSessions.get(tripId) || []).map(id => {
          const session = userSessions.get(id);
          return {
            id,
            ...session?.userInfo,
            isOnline: true,
            lastSeen: new Date().toISOString(),
          };
        });
        
        return Response.json({ activeUsers });
        
      case 'send-notification':
        if (data.targetUserId && data.message) {
          broadcastToTrip(tripId, userId, {
            type: 'notification',
            data: {
              from: userId,
              to: data.targetUserId,
              message: data.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        return Response.json({ success: true });
        
      case 'get-trip-stats':
        const stats = {
          activeUsers: tripSessions.get(tripId)?.size || 0,
          totalConnections: Array.from(activeConnections.keys()).filter(id =>
            userSessions.get(id.split('-')[0])?.tripId === tripId
          ).length,
          sessionStartTime: new Date().toISOString(), // Would track actual session start
        };
        return Response.json(stats);
        
      default:
        return new Response('Invalid action', { status: 400 });
    }
  } catch (error) {
    console.error('Collaboration API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Cleanup inactive connections periodically
setInterval(() => {
  const now = Date.now();
  const staleConnections: string[] = [];
  
  activeConnections.forEach((ws, connectionId) => {
    // Check if connection is still alive (would implement ping/pong)
    if (ws.readyState !== WebSocket.OPEN) {
      staleConnections.push(connectionId);
    }
  });
  
  staleConnections.forEach(connectionId => {
    const userId = connectionId.split('-')[0];
    const session = userSessions.get(userId);
    if (session) {
      handleDisconnection(connectionId, session.tripId, userId);
    } else {
      activeConnections.delete(connectionId);
    }
  });
  
  if (staleConnections.length > 0) {
    console.log(`🧹 Cleaned up ${staleConnections.length} stale connections`);
  }
}, 30000); // Every 30 seconds