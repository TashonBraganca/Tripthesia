'use client';

// Real-time Collaboration System - Phase 10 Advanced Features
// WebSocket-based synchronization for collaborative trip planning

interface CollaboratorInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  lastSeen: Date;
  cursor?: {
    x: number;
    y: number;
    section?: string;
  };
}

interface TripCollaboration {
  tripId: string;
  collaborators: CollaboratorInfo[];
  activeUsers: string[];
  permissions: {
    canEdit: string[];
    canComment: string[];
    canInvite: string[];
  };
  version: number;
  lastModified: Date;
  conflictResolution: 'last-write-wins' | 'operational-transform';
}

interface CollaborationEvent {
  type: 'user-join' | 'user-leave' | 'cursor-move' | 'content-change' | 'comment-add' | 'permission-change';
  userId: string;
  tripId: string;
  timestamp: Date;
  data: any;
  version: number;
}

interface OperationalTransform {
  operation: 'insert' | 'delete' | 'retain';
  position: number;
  content?: any;
  length?: number;
  author: string;
  timestamp: Date;
}

interface ConflictResolution {
  conflictId: string;
  conflictType: 'concurrent-edit' | 'deletion-conflict' | 'permission-conflict';
  participants: string[];
  changes: OperationalTransform[];
  resolution: 'merge' | 'reject' | 'manual';
  resolvedBy?: string;
  resolvedAt?: Date;
}

class RealTimeCollaborationEngine {
  private ws: WebSocket | null = null;
  private tripId: string | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private operationQueue: OperationalTransform[] = [];
  private versionVector: Map<string, number> = new Map();
  private conflictResolver = new ConflictResolver();
  
  // Event handlers
  private onCollaboratorJoin?: (collaborator: CollaboratorInfo) => void;
  private onCollaboratorLeave?: (userId: string) => void;
  private onCursorMove?: (userId: string, cursor: { x: number; y: number; section?: string }) => void;
  private onContentChange?: (change: OperationalTransform) => void;
  private onConflictDetected?: (conflict: ConflictResolution) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  init() {
    console.log('🤝 Initializing Real-time Collaboration Engine');
  }

  // Connect to collaborative session
  async joinTrip(tripId: string, userId: string, userInfo: Partial<CollaboratorInfo>): Promise<boolean> {
    try {
      this.tripId = tripId;
      this.userId = userId;
      
      // Establish WebSocket connection
      await this.connectWebSocket();
      
      // Send join event
      this.sendEvent({
        type: 'user-join',
        userId,
        tripId,
        timestamp: new Date(),
        data: userInfo,
        version: 0,
      });

      console.log(`👥 Joined collaborative trip: ${tripId}`);
      return true;
    } catch (error) {
      console.error('Failed to join collaborative trip:', error);
      return false;
    }
  }

  // Leave collaborative session
  async leaveTrip(): Promise<void> {
    if (this.ws && this.tripId && this.userId) {
      this.sendEvent({
        type: 'user-leave',
        userId: this.userId,
        tripId: this.tripId,
        timestamp: new Date(),
        data: {},
        version: 0,
      });
    }
    
    this.disconnect();
    console.log('👋 Left collaborative session');
  }

  // WebSocket connection management
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://api.tripthesia.com/ws/collaboration'
        : 'ws://localhost:3000/api/ws/collaboration';

      this.ws = new WebSocket(`${wsUrl}?tripId=${this.tripId}&userId=${this.userId}`);
      
      this.ws.onopen = () => {
        console.log('🔗 WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.reason);
        this.stopHeartbeat();
        
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      setTimeout(() => reject(new Error('WebSocket connection timeout')), 10000);
    });
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.tripId && this.userId) {
        this.connectWebSocket().catch(console.error);
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }
    this.tripId = null;
    this.userId = null;
  }

  // Message handling
  private handleMessage(message: any): void {
    try {
      switch (message.type) {
        case 'collaborator-joined':
          this.handleCollaboratorJoined(message.data);
          break;
        case 'collaborator-left':
          this.handleCollaboratorLeft(message.data);
          break;
        case 'cursor-moved':
          this.handleCursorMoved(message.data);
          break;
        case 'content-changed':
          this.handleContentChanged(message.data);
          break;
        case 'conflict-detected':
          this.handleConflictDetected(message.data);
          break;
        case 'permission-updated':
          this.handlePermissionUpdated(message.data);
          break;
        case 'pong':
          // Heartbeat response
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error, message);
    }
  }

  private handleCollaboratorJoined(collaborator: CollaboratorInfo): void {
    console.log(`👤 Collaborator joined: ${collaborator.name}`);
    this.onCollaboratorJoin?.(collaborator);
  }

  private handleCollaboratorLeft(data: { userId: string; name: string }): void {
    console.log(`👤 Collaborator left: ${data.name}`);
    this.onCollaboratorLeave?.(data.userId);
  }

  private handleCursorMoved(data: { userId: string; cursor: { x: number; y: number; section?: string } }): void {
    this.onCursorMove?.(data.userId, data.cursor);
  }

  private handleContentChanged(change: OperationalTransform): void {
    // Apply operational transformation
    const transformedChange = this.conflictResolver.transformOperation(change, this.operationQueue);
    
    // Update version vector
    this.versionVector.set(change.author, (this.versionVector.get(change.author) || 0) + 1);
    
    // Apply change to local state
    this.onContentChange?.(transformedChange);
    
    console.log('📝 Content change applied:', transformedChange);
  }

  private handleConflictDetected(conflict: ConflictResolution): void {
    console.warn('⚠️ Conflict detected:', conflict);
    this.onConflictDetected?.(conflict);
  }

  private handlePermissionUpdated(data: { permissions: any }): void {
    console.log('🔐 Permissions updated:', data.permissions);
  }

  // Send events to other collaborators
  private sendEvent(event: CollaborationEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket not connected, queuing event');
      // Could implement event queuing here
    }
  }

  // Public methods for collaboration actions
  updateCursor(x: number, y: number, section?: string): void {
    if (!this.userId || !this.tripId) return;

    this.sendEvent({
      type: 'cursor-move',
      userId: this.userId,
      tripId: this.tripId,
      timestamp: new Date(),
      data: { cursor: { x, y, section } },
      version: 0,
    });
  }

  applyContentChange(operation: OperationalTransform): void {
    if (!this.userId || !this.tripId) return;

    // Add to operation queue for conflict resolution
    this.operationQueue.push(operation);
    
    // Send to other collaborators
    this.sendEvent({
      type: 'content-change',
      userId: this.userId,
      tripId: this.tripId,
      timestamp: new Date(),
      data: operation,
      version: this.versionVector.get(this.userId) || 0,
    });

    console.log('📤 Sent content change:', operation);
  }

  // Event handlers setup
  setEventHandlers(handlers: {
    onCollaboratorJoin?: (collaborator: CollaboratorInfo) => void;
    onCollaboratorLeave?: (userId: string) => void;
    onCursorMove?: (userId: string, cursor: { x: number; y: number; section?: string }) => void;
    onContentChange?: (change: OperationalTransform) => void;
    onConflictDetected?: (conflict: ConflictResolution) => void;
  }): void {
    this.onCollaboratorJoin = handlers.onCollaboratorJoin;
    this.onCollaboratorLeave = handlers.onCollaboratorLeave;
    this.onCursorMove = handlers.onCursorMove;
    this.onContentChange = handlers.onContentChange;
    this.onConflictDetected = handlers.onConflictDetected;
  }

  // Get current collaboration state
  getCollaborationState(): {
    isConnected: boolean;
    tripId: string | null;
    userId: string | null;
    operationQueueLength: number;
    versionVector: Record<string, number>;
  } {
    return {
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      tripId: this.tripId,
      userId: this.userId,
      operationQueueLength: this.operationQueue.length,
      versionVector: Object.fromEntries(this.versionVector),
    };
  }
}

// Conflict Resolution Engine
class ConflictResolver {
  // Transform operation based on concurrent operations
  transformOperation(operation: OperationalTransform, concurrentOps: OperationalTransform[]): OperationalTransform {
    let transformedOp = { ...operation };
    
    for (const concurrentOp of concurrentOps) {
      if (concurrentOp.timestamp < operation.timestamp) {
        transformedOp = this.transformPair(transformedOp, concurrentOp);
      }
    }
    
    return transformedOp;
  }

  // Transform two operations against each other (Operational Transform)
  private transformPair(op1: OperationalTransform, op2: OperationalTransform): OperationalTransform {
    // Simplified OT implementation
    if (op1.operation === 'insert' && op2.operation === 'insert') {
      if (op1.position <= op2.position) {
        return op1; // No transformation needed
      } else {
        return {
          ...op1,
          position: op1.position + (op2.length || 1),
        };
      }
    } else if (op1.operation === 'delete' && op2.operation === 'insert') {
      if (op1.position < op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: op1.position + (op2.length || 1),
        };
      }
    } else if (op1.operation === 'insert' && op2.operation === 'delete') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: Math.max(0, op1.position - (op2.length || 1)),
        };
      }
    } else if (op1.operation === 'delete' && op2.operation === 'delete') {
      if (op1.position < op2.position) {
        return op1;
      } else if (op1.position >= op2.position + (op2.length || 1)) {
        return {
          ...op1,
          position: op1.position - (op2.length || 1),
        };
      } else {
        // Overlapping deletes - complex case
        return this.resolveOverlappingDeletes(op1, op2);
      }
    }
    
    return op1;
  }

  private resolveOverlappingDeletes(op1: OperationalTransform, op2: OperationalTransform): OperationalTransform {
    // Handle overlapping delete operations
    const op1End = op1.position + (op1.length || 1);
    const op2End = op2.position + (op2.length || 1);
    
    if (op1.position >= op2.position && op1End <= op2End) {
      // op1 is completely contained in op2 - nullify op1
      return {
        ...op1,
        operation: 'retain',
        length: 0,
      };
    } else if (op1.position < op2.position && op1End > op2End) {
      // op1 contains op2 - adjust op1 length
      return {
        ...op1,
        length: (op1.length || 1) - (op2.length || 1),
      };
    } else {
      // Partial overlap - adjust position and length
      const newPosition = Math.min(op1.position, op2.position);
      const newEnd = Math.max(op1End, op2End);
      return {
        ...op1,
        position: newPosition,
        length: newEnd - newPosition,
      };
    }
  }

  // Detect conflicts in operation sequences
  detectConflicts(operations: OperationalTransform[]): ConflictResolution[] {
    const conflicts: ConflictResolution[] = [];
    
    for (let i = 0; i < operations.length; i++) {
      for (let j = i + 1; j < operations.length; j++) {
        const op1 = operations[i];
        const op2 = operations[j];
        
        if (this.operationsConflict(op1, op2)) {
          conflicts.push({
            conflictId: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conflictType: this.getConflictType(op1, op2),
            participants: [op1.author, op2.author],
            changes: [op1, op2],
            resolution: 'merge',
          });
        }
      }
    }
    
    return conflicts;
  }

  private operationsConflict(op1: OperationalTransform, op2: OperationalTransform): boolean {
    // Check if operations affect the same region
    const op1End = op1.position + (op1.length || 1);
    const op2End = op2.position + (op2.length || 1);
    
    return !(op1End <= op2.position || op2End <= op1.position);
  }

  private getConflictType(op1: OperationalTransform, op2: OperationalTransform): ConflictResolution['conflictType'] {
    if (op1.operation === 'delete' && op2.operation === 'delete') {
      return 'deletion-conflict';
    } else if ((op1.operation === 'insert' || op1.operation === 'delete') && 
               (op2.operation === 'insert' || op2.operation === 'delete')) {
      return 'concurrent-edit';
    } else {
      return 'concurrent-edit';
    }
  }
}

// Singleton instance
const collaborationEngine = new RealTimeCollaborationEngine();

export { collaborationEngine, RealTimeCollaborationEngine };
export type { 
  CollaboratorInfo, 
  TripCollaboration, 
  CollaborationEvent, 
  OperationalTransform, 
  ConflictResolution 
};