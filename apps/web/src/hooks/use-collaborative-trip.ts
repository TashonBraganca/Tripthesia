'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseCollaborativeTripReturn {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  toggleActivityLock: (activityId: string, lock: boolean) => void;
  lastMessage: WebSocketMessage | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  users: Array<{
    id: string;
    name: string;
    cursor?: { x: number; y: number; elementId?: string };
  }>;
  comments: Array<{
    id: string;
    content: string;
    userId: string;
    userName: string;
    timestamp: string;
  }>;
}

export function useCollaborativeTrip(tripId: string): UseCollaborativeTripReturn {
  const { user } = useUser();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string; cursor?: { x: number; y: number; elementId?: string } }>>([]);
  const [comments, setComments] = useState<Array<{ id: string; content: string; userId: string; userName: string; timestamp: string }>>([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (!user) {
      console.warn('Cannot connect: user not authenticated');
      return;
    }

    setConnectionStatus('connecting');

    try {
      // In production, you'll need to determine the correct WebSocket URL
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/ws`
        : 'ws://localhost:8080';

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Join the trip room
        ws.send(JSON.stringify({
          type: 'join',
          tripId,
          userId: user.id,
          userName: user.fullName || user.firstName || 'Anonymous',
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          handleIncomingMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Attempt to reconnect if it wasn't a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000; // Exponential backoff
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [tripId, user]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        tripId,
        userId: user?.id,
        userName: user?.fullName || user?.firstName || 'Anonymous',
      }));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, [tripId, user]);

  const toggleActivityLock = useCallback((activityId: string, lock: boolean) => {
    sendMessage({
      type: 'lock',
      activityId,
      lock,
    });
  }, [sendMessage]);

  const handleIncomingMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'room_state':
        if (message.users) {
          setUsers(message.users);
        }
        break;

      case 'user_joined':
        if (message.user) {
          setUsers(prev => {
            const existing = prev.find(u => u.id === message.user.id);
            if (existing) return prev;
            return [...prev, message.user];
          });
        }
        break;

      case 'user_left':
        if (message.user) {
          setUsers(prev => prev.filter(u => u.id !== message.user.id));
        }
        break;

      case 'cursor_update':
        if (message.user && message.position) {
          setUsers(prev => prev.map(u => 
            u.id === message.user.id 
              ? { ...u, cursor: message.position }
              : u
          ));
        }
        break;

      case 'comment_added':
        if (message.comment) {
          setComments(prev => [...prev, message.comment]);
        }
        break;

      case 'edit_event':
        // Handle collaborative editing events
        // You can emit custom events here for your components to listen to
        window.dispatchEvent(new CustomEvent('trip-edit', { 
          detail: message.editEvent 
        }));
        break;

      case 'activity_lock':
        // Handle activity locking
        window.dispatchEvent(new CustomEvent('activity-lock', {
          detail: {
            activityId: message.activityId,
            lock: message.lock,
            user: message.user,
          }
        }));
        break;

      case 'error':
        console.error('WebSocket error:', message.message);
        break;

      default:
        console.log('Unhandled message type:', message.type);
    }
  }, []);

  // Track mouse movement for cursor sharing
  useEffect(() => {
    if (!isConnected) return;

    let throttleTimeout: NodeJS.Timeout;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle cursor updates to avoid overwhelming the WebSocket
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        sendMessage({
          type: 'cursor',
          position: {
            x: e.clientX,
            y: e.clientY,
            elementId: (e.target as Element)?.id || undefined,
          },
        });
        throttleTimeout = null as any;
      }, 100); // Update every 100ms maximum
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [isConnected, sendMessage]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    toggleActivityLock,
    lastMessage,
    connectionStatus,
    users,
    comments,
  };
}