/**
 * Collaborative Editing System
 * Real-time trip sharing and editing with WebSocket support
 */

import { z } from 'zod';
import { trackEvent, trackError } from './monitoring';

// Collaboration event schemas
export const CollaborationEventSchema = z.object({
  type: z.enum(['join', 'leave', 'edit', 'lock', 'unlock', 'comment', 'cursor']),
  tripId: z.string(),
  userId: z.string(),
  userName: z.string(),
  timestamp: z.date(),
  data: z.any().optional()
});

export const TripEditEventSchema = z.object({
  type: z.literal('edit'),
  tripId: z.string(),
  userId: z.string(),
  userName: z.string(),
  editType: z.enum(['add_activity', 'remove_activity', 'move_activity', 'edit_activity', 'edit_trip_details']),
  targetId: z.string().optional(), // ID of item being edited
  before: z.any().optional(),
  after: z.any().optional(),
  timestamp: z.date()
});

export const ActivityLockEventSchema = z.object({
  type: z.enum(['lock', 'unlock']),
  tripId: z.string(),
  userId: z.string(),
  userName: z.string(),
  activityId: z.string(),
  timestamp: z.date()
});

export const CommentEventSchema = z.object({
  type: z.literal('comment'),
  tripId: z.string(),
  userId: z.string(),
  userName: z.string(),
  commentId: z.string(),
  content: z.string(),
  targetType: z.enum(['activity', 'trip', 'general']),
  targetId: z.string().optional(),
  timestamp: z.date()
});

export const CursorEventSchema = z.object({
  type: z.literal('cursor'),
  tripId: z.string(),
  userId: z.string(),
  userName: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    elementId: z.string().optional()
  }),
  timestamp: z.date()
});

export type CollaborationEvent = z.infer<typeof CollaborationEventSchema>;
export type TripEditEvent = z.infer<typeof TripEditEventSchema>;
export type ActivityLockEvent = z.infer<typeof ActivityLockEventSchema>;
export type CommentEvent = z.infer<typeof CommentEventSchema>;
export type CursorEvent = z.infer<typeof CursorEventSchema>;

// Collaborator information
export const CollaboratorSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  avatar: z.string().optional(),
  color: z.string(), // Unique color for this collaborator
  isOnline: z.boolean(),
  lastSeen: z.date(),
  role: z.enum(['owner', 'editor', 'viewer']),
  cursor: z.object({
    x: z.number(),
    y: z.number(),
    elementId: z.string().optional()
  }).optional()
});

export type Collaborator = z.infer<typeof CollaboratorSchema>;

/**
 * Collaborative Trip Editing Service
 */
export class CollaborativeTripService {
  private ws: WebSocket | null = null;
  private tripId: string | null = null;
  private userId: string;
  private userName: string;
  private collaborators: Map<string, Collaborator> = new Map();
  private eventHandlers: Map<string, (event: CollaborationEvent) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName;
  }

  /**
   * Connect to a trip's collaborative session
   */
  async connect(tripId: string): Promise<boolean> {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        await this.disconnect();
      }

      this.tripId = tripId;

      // Create WebSocket connection
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://tripthesia.vercel.app/api/ws/collaborate/${tripId}`
        : `ws://localhost:3000/api/ws/collaborate/${tripId}`;

      this.ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket'));
          return;
        }

        this.ws.onopen = () => {
          console.log(`Connected to collaborative session for trip ${tripId}`);
          
          // Send join event
          this.sendEvent({
            type: 'join',
            tripId,
            userId: this.userId,
            userName: this.userName,
            timestamp: new Date()
          });

          // Start heartbeat
          this.startHeartbeat();
          
          trackEvent('collaboration_connected', {
            trip_id: tripId,
            user_id: this.userId
          });

          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleIncomingEvent(data);
          } catch (error) {
            console.error('Failed to parse collaboration event:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('Collaborative session closed:', event.code, event.reason);
          this.stopHeartbeat();
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }

          trackEvent('collaboration_disconnected', {
            trip_id: tripId,
            user_id: this.userId,
            code: event.code
          });
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          trackError(new Error('WebSocket connection error'), {
            trip_id: tripId,
            user_id: this.userId
          });
          reject(error);
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });

    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        service: 'collaborative_editing',
        trip_id: tripId
      });
      return false;
    }
  }

  /**
   * Disconnect from collaborative session
   */
  async disconnect(): Promise<void> {
    if (this.ws && this.tripId) {
      // Send leave event
      this.sendEvent({
        type: 'leave',
        tripId: this.tripId,
        userId: this.userId,
        userName: this.userName,
        timestamp: new Date()
      });

      this.ws.close(1000, 'User disconnected');
      this.stopHeartbeat();
    }

    this.ws = null;
    this.tripId = null;
    this.collaborators.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * Send an edit event
   */
  sendEditEvent(editEvent: Omit<TripEditEvent, 'tripId' | 'userId' | 'userName' | 'timestamp'>): void {
    if (!this.tripId) return;

    const event: TripEditEvent = {
      ...editEvent,
      tripId: this.tripId,
      userId: this.userId,
      userName: this.userName,
      timestamp: new Date()
    };

    this.sendEvent(event);

    trackEvent('collaboration_edit', {
      trip_id: this.tripId,
      edit_type: editEvent.editType,
      user_id: this.userId
    });
  }

  /**
   * Lock/unlock an activity for editing
   */
  toggleActivityLock(activityId: string, lock: boolean): void {
    if (!this.tripId) return;

    const event: ActivityLockEvent = {
      type: lock ? 'lock' : 'unlock',
      tripId: this.tripId,
      userId: this.userId,
      userName: this.userName,
      activityId,
      timestamp: new Date()
    };

    this.sendEvent(event);
  }

  /**
   * Add a comment
   */
  addComment(content: string, targetType: CommentEvent['targetType'], targetId?: string): void {
    if (!this.tripId) return;

    const event: CommentEvent = {
      type: 'comment',
      tripId: this.tripId,
      userId: this.userId,
      userName: this.userName,
      commentId: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      targetType,
      targetId,
      timestamp: new Date()
    };

    this.sendEvent(event);
  }

  /**
   * Update cursor position
   */
  updateCursor(x: number, y: number, elementId?: string): void {
    if (!this.tripId) return;

    const event: CursorEvent = {
      type: 'cursor',
      tripId: this.tripId,
      userId: this.userId,
      userName: this.userName,
      position: { x, y, elementId },
      timestamp: new Date()
    };

    this.sendEvent(event);
  }

  /**
   * Subscribe to collaboration events
   */
  on(eventType: CollaborationEvent['type'] | 'collaborators_updated', handler: (data: any) => void): void {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Unsubscribe from collaboration events
   */
  off(eventType: CollaborationEvent['type'] | 'collaborators_updated'): void {
    this.eventHandlers.delete(eventType);
  }

  /**
   * Get current collaborators
   */
  getCollaborators(): Collaborator[] {
    return Array.from(this.collaborators.values());
  }

  /**
   * Get collaborator colors for UI
   */
  getCollaboratorColors(): Record<string, string> {
    const colors: Record<string, string> = {};
    this.collaborators.forEach((collaborator, userId) => {
      colors[userId] = collaborator.color;
    });
    return colors;
  }

  /**
   * Check if current user can edit (not just view)
   */
  canEdit(): boolean {
    const currentUser = this.collaborators.get(this.userId);
    return currentUser ? ['owner', 'editor'].includes(currentUser.role) : false;
  }

  /**
   * Private methods
   */
  private sendEvent(event: CollaborationEvent): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(event));
      } catch (error) {
        console.error('Failed to send collaboration event:', error);
      }
    }
  }

  private handleIncomingEvent(event: CollaborationEvent): void {
    try {
      // Validate event
      CollaborationEventSchema.parse(event);

      // Update collaborators list
      this.updateCollaborator(event);

      // Call registered handlers
      const handler = this.eventHandlers.get(event.type);
      if (handler) {
        handler(event);
      }

      // Call general event handler
      const generalHandler = this.eventHandlers.get('collaborators_updated');
      if (generalHandler && ['join', 'leave', 'cursor'].includes(event.type)) {
        generalHandler(this.getCollaborators());
      }

    } catch (error) {
      console.error('Invalid collaboration event received:', error);
    }
  }

  private updateCollaborator(event: CollaborationEvent): void {
    const existingCollaborator = this.collaborators.get(event.userId);

    if (event.type === 'join') {
      this.collaborators.set(event.userId, {
        userId: event.userId,
        userName: event.userName,
        color: this.generateUserColor(event.userId),
        isOnline: true,
        lastSeen: event.timestamp,
        role: event.userId === this.userId ? 'owner' : 'editor' // Simplified role assignment
      });
    } else if (event.type === 'leave') {
      this.collaborators.delete(event.userId);
    } else if (event.type === 'cursor' && existingCollaborator) {
      existingCollaborator.cursor = (event as CursorEvent).position;
      existingCollaborator.lastSeen = event.timestamp;
    } else if (existingCollaborator) {
      existingCollaborator.lastSeen = event.timestamp;
    }
  }

  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
    ];
    
    // Generate consistent color based on userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

    setTimeout(() => {
      if (this.tripId) {
        this.connect(this.tripId).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }
}

// React hook for collaborative editing
export function useCollaborativeEditing(tripId: string, userId: string, userName: string) {
  const [service] = useState(() => new CollaborativeTripService(userId, userName));
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!tripId || !userId) return;

    // Connect to collaborative session
    service.connect(tripId).then(connected => {
      setIsConnected(connected);
    });

    // Listen for collaborator updates
    service.on('collaborators_updated', (updatedCollaborators: Collaborator[]) => {
      setCollaborators(updatedCollaborators);
    });

    // Cleanup on unmount
    return () => {
      service.disconnect();
    };
  }, [tripId, userId, service]);

  return {
    service,
    collaborators,
    isConnected,
    canEdit: service.canEdit()
  };
}