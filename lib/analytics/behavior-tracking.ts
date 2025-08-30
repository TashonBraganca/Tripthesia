import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Event types for user behavior tracking
export type UserEventType = 
  | 'page_view'
  | 'trip_created'
  | 'trip_edited'
  | 'trip_shared'
  | 'search_performed'
  | 'ai_request'
  | 'export_trip'
  | 'subscription_upgrade'
  | 'feature_used'
  | 'error_occurred'
  | 'user_engagement'
  | 'conversion'
  | 'retention';

export interface UserEvent {
  eventType: UserEventType;
  userId?: string;
  sessionId: string;
  timestamp: number;
  properties: Record<string, any>;
  context: {
    userAgent: string;
    url: string;
    referrer?: string;
    viewport?: { width: number; height: number };
    device?: 'desktop' | 'tablet' | 'mobile';
    os?: string;
    browser?: string;
  };
  metadata?: Record<string, any>;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: UserEvent[];
  source?: 'organic' | 'direct' | 'social' | 'paid' | 'referral';
  campaign?: string;
  device: 'desktop' | 'tablet' | 'mobile';
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

export interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  retentionRate: {
    day1: number;
    day7: number;
    day30: number;
  };
  topPages: Array<{ page: string; views: number; uniqueViews: number }>;
  topFeatures: Array<{ feature: string; usage: number; users: number }>;
  userJourney: Array<{ step: string; completionRate: number }>;
}

export class BehaviorTracker {
  private redis: Redis;
  private batchSize: number = 50;
  private flushInterval: number = 30000; // 30 seconds
  private eventQueue: UserEvent[] = [];
  private timer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.redis = redis;
    this.startBatchProcessor();
  }
  
  // Track a single event
  async trackEvent(event: Omit<UserEvent, 'timestamp'>): Promise<void> {
    const fullEvent: UserEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    // Add to queue for batch processing
    this.eventQueue.push(fullEvent);
    
    // Flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      await this.flushEvents();
    }
    
    // Update real-time metrics
    await this.updateRealTimeMetrics(fullEvent);
  }
  
  // Track page view with enhanced context
  async trackPageView(
    url: string,
    userId?: string,
    sessionId?: string,
    referrer?: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'page_view',
      userId,
      sessionId: sessionId || this.generateSessionId(),
      properties: {
        page: url,
        title: typeof document !== 'undefined' ? document.title : undefined
      },
      context: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        url,
        referrer,
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : undefined,
        device: this.detectDevice(),
        os: this.detectOS(),
        browser: this.detectBrowser()
      }
    });
  }
  
  // Track user interaction with features
  async trackFeatureUsage(
    feature: string,
    action: string,
    userId?: string,
    sessionId?: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'feature_used',
      userId,
      sessionId: sessionId || this.generateSessionId(),
      properties: {
        feature,
        action,
        ...properties
      },
      context: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        device: this.detectDevice()
      }
    });
  }
  
  // Track AI usage and performance
  async trackAIRequest(
    requestType: string,
    duration: number,
    success: boolean,
    userId?: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'ai_request',
      userId,
      sessionId: this.generateSessionId(),
      properties: {
        requestType,
        duration,
        success,
        responseTime: duration,
        ...properties
      },
      context: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        device: this.detectDevice()
      }
    });
  }
  
  // Track conversion events
  async trackConversion(
    conversionType: string,
    value?: number,
    userId?: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'conversion',
      userId,
      sessionId: this.generateSessionId(),
      properties: {
        conversionType,
        value,
        ...properties
      },
      context: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        device: this.detectDevice()
      }
    });
  }
  
  // Track errors for debugging
  async trackError(
    error: Error | string,
    context: string,
    userId?: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'error_occurred',
      userId,
      sessionId: this.generateSessionId(),
      properties: {
        errorMessage: typeof error === 'string' ? error : error.message,
        errorStack: typeof error === 'object' ? error.stack : undefined,
        context,
        ...properties
      },
      context: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        device: this.detectDevice()
      }
    });
  }
  
  // Start session tracking
  async startSession(userId?: string, source?: string): Promise<string> {
    const sessionId = this.generateSessionId();
    const session: UserSession = {
      sessionId,
      userId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: [],
      source: source as any,
      device: this.detectDevice()
    };
    
    // Store session in Redis with 24-hour expiry
    await this.redis.setex(`session:${sessionId}`, 86400, JSON.stringify(session));
    
    return sessionId;
  }
  
  // Update session activity
  async updateSession(sessionId: string, event: UserEvent): Promise<void> {
    try {
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (!sessionData) return;
      
      const session: UserSession = JSON.parse(sessionData as string);
      session.lastActivity = Date.now();
      session.events.push(event);
      
      if (event.eventType === 'page_view') {
        session.pageViews++;
      }
      
      await this.redis.setex(`session:${sessionId}`, 86400, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }
  
  // Get analytics metrics
  async getAnalytics(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<AnalyticsMetrics> {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    // Get events from time range
    const events = await this.getEventsInRange(startTime, endTime, userId);
    
    // Calculate metrics
    const metrics = await this.calculateMetrics(events, startTime, endTime);
    
    return metrics;
  }
  
  // Get user journey analytics
  async getUserJourney(userId: string, sessionId?: string): Promise<UserEvent[]> {
    if (sessionId) {
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (sessionData) {
        const session: UserSession = JSON.parse(sessionData as string);
        return session.events.sort((a, b) => a.timestamp - b.timestamp);
      }
    }
    
    // Get all user events from last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return this.getEventsInRange(thirtyDaysAgo, Date.now(), userId);
  }
  
  // A/B Testing support
  async assignToExperiment(
    experimentId: string,
    userId: string,
    variants: string[]
  ): Promise<string> {
    const existingAssignment = await this.redis.get(`experiment:${experimentId}:${userId}`);
    
    if (existingAssignment) {
      return existingAssignment as string;
    }
    
    // Random assignment based on user ID hash
    const userHash = this.hashString(userId);
    const variantIndex = userHash % variants.length;
    const assignedVariant = variants[variantIndex];
    
    // Store assignment with 30-day expiry
    await this.redis.setex(
      `experiment:${experimentId}:${userId}`,
      30 * 24 * 60 * 60,
      assignedVariant
    );
    
    // Track assignment event
    await this.trackEvent({
      eventType: 'user_engagement',
      userId,
      sessionId: this.generateSessionId(),
      properties: {
        experimentId,
        variant: assignedVariant,
        action: 'experiment_assigned'
      },
      context: {
        userAgent: '',
        url: ''
      }
    });
    
    return assignedVariant;
  }
  
  // Performance monitoring
  async trackPerformance(
    metric: string,
    value: number,
    context?: Record<string, any>
  ): Promise<void> {
    const performanceEvent = {
      metric,
      value,
      timestamp: Date.now(),
      context
    };
    
    // Store in time-series for performance monitoring
    await this.redis.zadd(
      `performance:${metric}`,
      { score: Date.now(), member: JSON.stringify(performanceEvent) }
    );
    
    // Keep only last 7 days of performance data
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    await this.redis.zremrangebyscore(`performance:${metric}`, 0, sevenDaysAgo);
  }
  
  // Private methods
  private startBatchProcessor(): void {
    this.timer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.flushInterval);
  }
  
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    
    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      // Store events in Redis with time-based keys for efficient querying
      const pipeline = this.redis.pipeline();
      
      for (const event of eventsToFlush) {
        const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
        const eventKey = `events:${dateKey}`;
        
        pipeline.lpush(eventKey, JSON.stringify(event));
        pipeline.expire(eventKey, 30 * 24 * 60 * 60); // 30 days retention
        
        // Update session if applicable
        if (event.sessionId) {
          this.updateSession(event.sessionId, event);
        }
      }
      
      await pipeline.exec();
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Re-add events to queue for retry
      this.eventQueue = [...eventsToFlush, ...this.eventQueue];
    }
  }
  
  private async updateRealTimeMetrics(event: UserEvent): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Update daily counters
      await this.redis.incr(`metrics:${today}:total_events`);
      await this.redis.incr(`metrics:${today}:${event.eventType}`);
      
      if (event.userId) {
        await this.redis.sadd(`metrics:${today}:active_users`, event.userId);
      }
      
      // Set expiry for daily metrics (7 days)
      await this.redis.expire(`metrics:${today}:total_events`, 7 * 24 * 60 * 60);
      await this.redis.expire(`metrics:${today}:${event.eventType}`, 7 * 24 * 60 * 60);
      await this.redis.expire(`metrics:${today}:active_users`, 7 * 24 * 60 * 60);
    } catch (error) {
      console.error('Failed to update real-time metrics:', error);
    }
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
  
  private detectDevice(): 'desktop' | 'tablet' | 'mobile' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
  
  private detectOS(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'unknown';
  }
  
  private detectBrowser(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'unknown';
  }
  
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  private async getEventsInRange(
    startTime: number,
    endTime: number,
    userId?: string
  ): Promise<UserEvent[]> {
    const events: UserEvent[] = [];
    
    // Generate date keys for the range
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const dates: string[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    // Fetch events from each date
    for (const date of dates) {
      const eventKey = `events:${date}`;
      const dayEvents = await this.redis.lrange(eventKey, 0, -1);
      
      for (const eventData of dayEvents) {
        try {
          const event: UserEvent = JSON.parse(eventData as string);
          
          // Filter by time range and user
          if (event.timestamp >= startTime && 
              event.timestamp <= endTime &&
              (!userId || event.userId === userId)) {
            events.push(event);
          }
        } catch (error) {
          console.error('Failed to parse event:', error);
        }
      }
    }
    
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  private async calculateMetrics(
    events: UserEvent[],
    startTime: number,
    endTime: number
  ): Promise<AnalyticsMetrics> {
    const uniqueUsers = new Set<string>();
    const sessions = new Map<string, UserEvent[]>();
    const pageViews = new Map<string, number>();
    const featureUsage = new Map<string, number>();
    
    // Process events
    events.forEach(event => {
      if (event.userId) uniqueUsers.add(event.userId);
      
      // Group by session
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, []);
      }
      sessions.get(event.sessionId)!.push(event);
      
      // Track page views
      if (event.eventType === 'page_view') {
        const page = event.properties.page || event.context.url;
        pageViews.set(page, (pageViews.get(page) || 0) + 1);
      }
      
      // Track feature usage
      if (event.eventType === 'feature_used') {
        const feature = event.properties.feature;
        featureUsage.set(feature, (featureUsage.get(feature) || 0) + 1);
      }
    });
    
    // Calculate session metrics
    let totalSessionDuration = 0;
    let bouncedSessions = 0;
    
    sessions.forEach(sessionEvents => {
      if (sessionEvents.length === 1) {
        bouncedSessions++;
      } else {
        const firstEvent = sessionEvents[0];
        const lastEvent = sessionEvents[sessionEvents.length - 1];
        totalSessionDuration += lastEvent.timestamp - firstEvent.timestamp;
      }
    });
    
    const averageSessionDuration = sessions.size > 0 
      ? totalSessionDuration / (sessions.size - bouncedSessions) 
      : 0;
    const bounceRate = sessions.size > 0 ? bouncedSessions / sessions.size : 0;
    
    return {
      totalUsers: uniqueUsers.size,
      activeUsers: uniqueUsers.size, // Simplified - would need more complex logic
      newUsers: 0, // Would need user registration tracking
      returningUsers: 0, // Would need user history tracking
      averageSessionDuration: averageSessionDuration / 1000, // Convert to seconds
      bounceRate,
      conversionRate: 0, // Would calculate based on conversion events
      retentionRate: {
        day1: 0, // Would need retention tracking
        day7: 0,
        day30: 0
      },
      topPages: Array.from(pageViews.entries())
        .map(([page, views]) => ({ page, views, uniqueViews: views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10),
      topFeatures: Array.from(featureUsage.entries())
        .map(([feature, usage]) => ({ feature, usage, users: usage }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 10),
      userJourney: [] // Would calculate based on user flow analysis
    };
  }
  
  // Cleanup method
  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Flush remaining events
    if (this.eventQueue.length > 0) {
      this.flushEvents();
    }
  }
}

// Singleton instance
export const behaviorTracker = new BehaviorTracker();

// Hook for client-side tracking
export function useAnalytics() {
  const trackPageView = (url?: string) => {
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    behaviorTracker.trackPageView(currentUrl);
  };
  
  const trackEvent = (eventType: UserEventType, properties?: Record<string, any>) => {
    behaviorTracker.trackEvent({
      eventType,
      sessionId: behaviorTracker['generateSessionId'](),
      properties: properties || {},
      context: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : ''
      }
    });
  };
  
  const trackFeature = (feature: string, action: string, properties?: Record<string, any>) => {
    behaviorTracker.trackFeatureUsage(feature, action, undefined, undefined, properties);
  };
  
  return {
    trackPageView,
    trackEvent,
    trackFeature
  };
}