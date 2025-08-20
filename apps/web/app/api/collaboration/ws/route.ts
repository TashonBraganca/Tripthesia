import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
// WebSocket disabled for Vercel deployment
// import { WebSocket, WebSocketServer } from 'ws';
import { z } from 'zod';
import { db } from '@/lib/db';
import { trips, tripCollaborators } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// WebSocket message schemas
const wsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('join'),
    tripId: z.string(),
  }),
  z.object({
    type: z.literal('leave'),
    tripId: z.string(),
  }),
  z.object({
    type: z.literal('edit'),
    tripId: z.string(),
    editEvent: z.object({
      type: z.enum(['activity_moved', 'activity_updated', 'activity_added', 'activity_removed', 'day_reordered']),
      data: z.any(),
      activityId: z.string().optional(),
      dayIndex: z.number().optional(),
    }),
  }),
  z.object({
    type: z.literal('cursor'),
    tripId: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      elementId: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal('lock'),
    tripId: z.string(),
    activityId: z.string(),
    lock: z.boolean(),
  }),
  z.object({
    type: z.literal('comment'),
    tripId: z.string(),
    comment: z.object({
      id: z.string(),
      activityId: z.string().optional(),
      content: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }).optional(),
    }),
  }),
]);

// WebSocket functionality disabled for Vercel deployment
// Vercel doesn't support persistent WebSocket connections
// Consider using Pusher, Ably, or Socket.IO for real-time features

export async function GET(req: NextRequest) {
  return Response.json({ 
    error: 'WebSocket functionality not available on Vercel', 
    message: 'Use Pusher or Socket.IO for real-time features' 
  }, { status: 501 });
}

export async function POST(req: NextRequest) {
  return Response.json({ 
    error: 'WebSocket functionality not available on Vercel', 
    message: 'Use Pusher or Socket.IO for real-time features' 
  }, { status: 501 });
}

/*
interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  userName: string;
  tripId: string;
  lastSeen: Date;
  cursor?: {
    x: number;
    y: number;
    elementId?: string;
  };
}

// In-memory store for WebSocket connections
const clients = new Map<string, ConnectedClient>();
const tripRooms = new Map<string, Set<string>>();

// WebSocket server singleton
let wss: WebSocketServer | null = null;

function getWebSocketServer(): WebSocketServer {
  // WebSocket server code commented out for Vercel deployment
  return null;
}

/*
async function handleJoin(ws: WebSocket, clientId: string, tripId: string, req: any) {
  try {
    // Get user info from request (you might need to adjust this based on your auth setup)
    const userId = req.headers['user-id'];
    const userName = req.headers['user-name'] || 'Anonymous';
    
    if (!userId) {
      throw new Error('Authentication required');
    }

    // Verify user has access to the trip
    const trip = await db.select()
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1);
    
    if (!trip.length) {
      throw new Error('Trip not found');
    }

    // Check if user is owner or collaborator
    const isOwner = trip[0].userId === userId;
    const isCollaborator = await db.select()
      .from(tripCollaborators)
      .where(and(
        eq(tripCollaborators.tripId, tripId),
        eq(tripCollaborators.userId, userId)
      ))
      .limit(1);

    if (!isOwner && !isCollaborator.length) {
      throw new Error('Access denied');
    }

    // Add client to connected clients
    const client: ConnectedClient = {
      ws,
      userId,
      userName,
      tripId,
      lastSeen: new Date(),
    };

    clients.set(clientId, client);

    // Add to trip room
    if (!tripRooms.has(tripId)) {
      tripRooms.set(tripId, new Set());
    }
    tripRooms.get(tripId)!.add(clientId);

    // Notify others in the room
    broadcastToTrip(tripId, {
      type: 'user_joined',
      user: {
        id: userId,
        name: userName,
      },
      timestamp: new Date().toISOString(),
    }, clientId);

    // Send current room state to new user
    const roomUsers = Array.from(tripRooms.get(tripId) || [])
      .map(id => clients.get(id))
      .filter(Boolean)
      .map(client => ({
        id: client!.userId,
        name: client!.userName,
        cursor: client!.cursor,
      }));

    ws.send(JSON.stringify({
      type: 'room_state',
      users: roomUsers,
      timestamp: new Date().toISOString(),
    }));

  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to join room',
    }));
  }
}

function handleLeave(clientId: string) {
  const client = clients.get(clientId);
  if (!client) return;

  const { tripId, userId, userName } = client;

  // Remove from trip room
  const room = tripRooms.get(tripId);
  if (room) {
    room.delete(clientId);
    if (room.size === 0) {
      tripRooms.delete(tripId);
    }
  }

  // Remove from clients
  clients.delete(clientId);

  // Notify others in the room
  broadcastToTrip(tripId, {
    type: 'user_left',
    user: {
      id: userId,
      name: userName,
    },
    timestamp: new Date().toISOString(),
  });
}

async function handleEdit(clientId: string, message: Extract<z.infer<typeof wsMessageSchema>, { type: 'edit' }>) {
  const client = clients.get(clientId);
  if (!client) return;

  const { tripId, editEvent } = message;
  const { userId, userName } = client;

  // Broadcast edit to all other clients in the trip
  broadcastToTrip(tripId, {
    type: 'edit_event',
    editEvent: {
      ...editEvent,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    },
  }, clientId);
}

function handleCursor(clientId: string, message: Extract<z.infer<typeof wsMessageSchema>, { type: 'cursor' }>) {
  const client = clients.get(clientId);
  if (!client) return;

  const { tripId, position } = message;
  const { userId, userName } = client;

  // Update client cursor position
  client.cursor = position;
  client.lastSeen = new Date();

  // Broadcast cursor position to others
  broadcastToTrip(tripId, {
    type: 'cursor_update',
    user: {
      id: userId,
      name: userName,
    },
    position,
    timestamp: new Date().toISOString(),
  }, clientId);
}

async function handleLock(clientId: string, message: Extract<z.infer<typeof wsMessageSchema>, { type: 'lock' }>) {
  const client = clients.get(clientId);
  if (!client) return;

  const { tripId, activityId, lock } = message;
  const { userId, userName } = client;

  // Broadcast lock state to all clients
  broadcastToTrip(tripId, {
    type: 'activity_lock',
    activityId,
    lock,
    user: {
      id: userId,
      name: userName,
    },
    timestamp: new Date().toISOString(),
  });
}

async function handleComment(clientId: string, message: Extract<z.infer<typeof wsMessageSchema>, { type: 'comment' }>) {
  const client = clients.get(clientId);
  if (!client) return;

  const { tripId, comment } = message;
  const { userId, userName } = client;

  // TODO: Save comment to database if needed

  // Broadcast comment to all clients
  broadcastToTrip(tripId, {
    type: 'comment_added',
    comment: {
      ...comment,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    },
  });
}

function broadcastToTrip(tripId: string, message: any, excludeClientId?: string) {
  const room = tripRooms.get(tripId);
  if (!room) return;

  const messageStr = JSON.stringify(message);

  for (const clientId of room) {
    if (clientId === excludeClientId) continue;
    
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(messageStr);
      } catch (error) {
        console.error('Failed to send message to client:', error);
        // Remove failed client
        handleLeave(clientId);
      }
    }
  }
}

function generateClientId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

*/