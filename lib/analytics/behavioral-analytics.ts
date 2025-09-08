/**
 * Behavioral Analytics Service - Phase 4.3.2
 * 
 * Real-time user behavior tracking and analysis for personalization
 * Integrates with the preference learning system to provide behavioral insights
 */

import { withDatabase } from '@/lib/db';
import { userInteractions, userPreferences } from '@/lib/database/schema';
import { eq, and, sql, desc, gte } from 'drizzle-orm';

// ==================== TYPES ====================

export interface BehaviorSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  interactions: BehaviorEvent[];
  context: SessionContext;
}

export interface BehaviorEvent {
  eventId: string;
  sessionId: string;
  timestamp: Date;
  eventType: InteractionType;
  targetType: string;
  targetId: string;
  eventData: Record<string, any>;
  duration?: number;
  sequence: number;
}

export interface SessionContext {
  device: string;
  userAgent: string;
  viewport: { width: number; height: number };
  timezone: string;
  referrer?: string;
  utm?: Record<string, string>;
}

export interface BehaviorPattern {
  userId: string;
  patternType: 'search' | 'browse' | 'decision' | 'abandonment' | 'completion';
  frequency: number;
  confidence: number;
  characteristics: Record<string, any>;
  detectedAt: Date;
  expires: Date;
}

export interface BehaviorInsights {
  userId: string;
  preferences: UserBehaviorPreferences;
  patterns: BehaviorPattern[];
  recommendedActions: string[];
  riskFactors: string[];
  engagementScore: number;
  personalizationOpportunities: string[];
}

export interface UserBehaviorPreferences {
  searchStyle: 'explorative' | 'focused' | 'comparative';
  decisionSpeed: 'quick' | 'moderate' | 'deliberate';
  contentPreference: 'visual' | 'detailed' | 'minimal';
  interactionPattern: 'mobile' | 'desktop' | 'mixed';
  travelPhase: 'inspiration' | 'planning' | 'booking' | 'traveling';
  engagementLevel: 'high' | 'medium' | 'low';
}

type InteractionType = 
  | 'search' | 'view' | 'like' | 'dislike' | 'book' | 'share' 
  | 'save' | 'skip' | 'time_spent' | 'click_through' | 'comparison' | 'filter_apply';

// ==================== BEHAVIORAL ANALYTICS SERVICE ====================

export class BehavioralAnalyticsService {
  private activeSessions = new Map<string, BehaviorSession>();
  private eventQueue: BehaviorEvent[] = [];
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startEventProcessor();
  }

  // ==================== EVENT TRACKING ====================

  /**
   * Start a new behavior tracking session
   */
  async startSession(sessionId: string, userId: string, context: SessionContext): Promise<void> {
    const session: BehaviorSession = {
      sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      interactions: [],
      context
    };

    this.activeSessions.set(sessionId, session);
    
    // Track session start event
    await this.trackEvent({
      eventId: `session_start_${Date.now()}`,
      sessionId,
      timestamp: new Date(),
      eventType: 'view',
      targetType: 'session',
      targetId: sessionId,
      eventData: { action: 'session_start', context },
      sequence: 0
    });
  }

  /**
   * Track a user interaction event
   */
  async trackEvent(event: BehaviorEvent): Promise<void> {
    // Add to queue for batch processing
    this.eventQueue.push(event);
    
    // Update active session
    const session = this.activeSessions.get(event.sessionId);
    if (session) {
      session.interactions.push(event);
      session.lastActivity = new Date();
    }

    // Process high-priority events immediately
    if (this.isHighPriorityEvent(event)) {
      await this.processEvent(event);
    }
  }

  /**
   * End a behavior tracking session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Track session end event
    await this.trackEvent({
      eventId: `session_end_${Date.now()}`,
      sessionId,
      timestamp: new Date(),
      eventType: 'view',
      targetType: 'session',
      targetId: sessionId,
      eventData: { 
        action: 'session_end',
        duration: Date.now() - session.startTime.getTime(),
        totalInteractions: session.interactions.length
      },
      sequence: session.interactions.length + 1
    });

    // Process session patterns
    await this.analyzeSessionPatterns(session);
    
    // Remove from active sessions
    this.activeSessions.delete(sessionId);
  }

  // ==================== PATTERN ANALYSIS ====================

  /**
   * Analyze user behavior patterns from recent interactions
   */
  async analyzeBehaviorPatterns(userId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];
    const timeframeMs = this.getTimeframeMs(timeframe);
    const since = new Date(Date.now() - timeframeMs);

    try {
      // Get recent interactions
      const interactions = await withDatabase(async (db) => 
        await db
          .select()
          .from(userInteractions)
          .where(
            and(
              eq(userInteractions.userId, userId),
              gte(userInteractions.timestamp, since)
            )
          )
          .orderBy(desc(userInteractions.timestamp))
      );

      if (!interactions || interactions.length === 0) {
        return patterns;
      }

      // Analyze search patterns
      const searchPattern = this.analyzeSearchPattern(interactions);
      if (searchPattern) patterns.push(searchPattern);

      // Analyze decision patterns
      const decisionPattern = this.analyzeDecisionPattern(interactions);
      if (decisionPattern) patterns.push(decisionPattern);

      // Analyze browsing patterns
      const browsingPattern = this.analyzeBrowsingPattern(interactions);
      if (browsingPattern) patterns.push(browsingPattern);

      // Analyze abandonment patterns
      const abandonmentPattern = this.analyzeAbandonmentPattern(interactions);
      if (abandonmentPattern) patterns.push(abandonmentPattern);

      return patterns;

    } catch (error) {
      console.error('Error analyzing behavior patterns:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive behavior insights for a user
   */
  async generateBehaviorInsights(userId: string): Promise<BehaviorInsights | null> {
    try {
      const patterns = await this.analyzeBehaviorPatterns(userId, 'month');
      const preferences = await this.inferBehaviorPreferences(userId);
      const engagementScore = await this.calculateEngagementScore(userId);

      const insights: BehaviorInsights = {
        userId,
        preferences,
        patterns,
        recommendedActions: this.generateRecommendedActions(patterns, preferences),
        riskFactors: this.identifyRiskFactors(patterns, preferences),
        engagementScore,
        personalizationOpportunities: this.identifyPersonalizationOpportunities(patterns, preferences)
      };

      return insights;

    } catch (error) {
      console.error('Error generating behavior insights:', error);
      return null;
    }
  }

  // ==================== PREFERENCE INFERENCE ====================

  /**
   * Infer user behavior preferences from interaction patterns
   */
  private async inferBehaviorPreferences(userId: string): Promise<UserBehaviorPreferences> {
    try {
      // Get interactions from last 30 days
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const interactions = await withDatabase(async (db) => 
        await db
          .select()
          .from(userInteractions)
          .where(
            and(
              eq(userInteractions.userId, userId),
              gte(userInteractions.timestamp, since)
            )
          )
      );

      if (!interactions || interactions.length === 0) {
        return {
          searchStyle: 'focused',
          decisionSpeed: 'moderate',
          contentPreference: 'detailed',
          interactionPattern: 'mixed',
          travelPhase: 'planning',
          engagementLevel: 'medium'
        };
      }

      // Analyze search style
      const searchStyle = this.inferSearchStyle(interactions);
      
      // Analyze decision speed
      const decisionSpeed = this.inferDecisionSpeed(interactions);
      
      // Analyze content preference
      const contentPreference = this.inferContentPreference(interactions);
      
      // Analyze interaction pattern
      const interactionPattern = this.inferInteractionPattern(interactions);
      
      // Analyze travel phase
      const travelPhase = this.inferTravelPhase(interactions);
      
      // Calculate engagement level
      const engagementLevel = this.inferEngagementLevel(interactions);

      return {
        searchStyle,
        decisionSpeed,
        contentPreference,
        interactionPattern,
        travelPhase,
        engagementLevel
      };

    } catch (error) {
      console.error('Error inferring behavior preferences:', error);
      return {
        searchStyle: 'focused',
        decisionSpeed: 'moderate',
        contentPreference: 'detailed',
        interactionPattern: 'mixed',
        travelPhase: 'planning',
        engagementLevel: 'medium'
      };
    }
  }

  // ==================== PATTERN ANALYSIS METHODS ====================

  private analyzeSearchPattern(interactions: any[]): BehaviorPattern | null {
    const searchInteractions = interactions.filter(i => i.interactionType === 'search');
    if (searchInteractions.length < 5) return null;

    const frequency = searchInteractions.length / 30; // per day
    const averageSearchesPerSession = this.calculateAverageSearchesPerSession(searchInteractions);
    const searchRefinementRate = this.calculateSearchRefinementRate(searchInteractions);

    return {
      userId: interactions[0]?.userId || '',
      patternType: 'search',
      frequency,
      confidence: Math.min(0.9, frequency / 10),
      characteristics: {
        averageSearchesPerSession,
        searchRefinementRate,
        preferredFilters: this.extractPreferredFilters(searchInteractions)
      },
      detectedAt: new Date(),
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  private analyzeDecisionPattern(interactions: any[]): BehaviorPattern | null {
    const decisionInteractions = interactions.filter(i => 
      ['like', 'dislike', 'save', 'book'].includes(i.interactionType)
    );
    
    if (decisionInteractions.length < 3) return null;

    const frequency = decisionInteractions.length / 30;
    const decisionSpeed = this.calculateDecisionSpeed(interactions);
    const conversionRate = this.calculateConversionRate(interactions);

    return {
      userId: interactions[0]?.userId || '',
      patternType: 'decision',
      frequency,
      confidence: Math.min(0.8, conversionRate),
      characteristics: {
        decisionSpeed,
        conversionRate,
        preferredActions: this.extractPreferredActions(decisionInteractions)
      },
      detectedAt: new Date(),
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  private analyzeBrowsingPattern(interactions: any[]): BehaviorPattern | null {
    const browsingInteractions = interactions.filter(i => 
      ['view', 'time_spent', 'click_through'].includes(i.interactionType)
    );
    
    if (browsingInteractions.length < 10) return null;

    const frequency = browsingInteractions.length / 30;
    const averageTimeSpent = this.calculateAverageTimeSpent(browsingInteractions);
    const browsingDepth = this.calculateBrowsingDepth(browsingInteractions);

    return {
      userId: interactions[0]?.userId || '',
      patternType: 'browse',
      frequency,
      confidence: 0.7,
      characteristics: {
        averageTimeSpent,
        browsingDepth,
        contentTypes: this.extractContentTypePreferences(browsingInteractions)
      },
      detectedAt: new Date(),
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  private analyzeAbandonmentPattern(interactions: any[]): BehaviorPattern | null {
    const abandonmentInteractions = interactions.filter(i => i.interactionType === 'skip');
    if (abandonmentInteractions.length < 5) return null;

    const frequency = abandonmentInteractions.length / 30;
    const abandonmentRate = abandonmentInteractions.length / interactions.length;

    return {
      userId: interactions[0]?.userId || '',
      patternType: 'abandonment',
      frequency,
      confidence: Math.min(0.8, abandonmentRate * 2),
      characteristics: {
        abandonmentRate,
        commonAbandonmentPoints: this.identifyAbandonmentPoints(abandonmentInteractions),
        triggers: this.identifyAbandonmentTriggers(interactions)
      },
      detectedAt: new Date(),
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  // ==================== INFERENCE METHODS ====================

  private inferSearchStyle(interactions: any[]): 'explorative' | 'focused' | 'comparative' {
    const searchInteractions = interactions.filter(i => i.interactionType === 'search');
    const viewInteractions = interactions.filter(i => i.interactionType === 'view');
    const comparisonInteractions = interactions.filter(i => i.interactionType === 'comparison');

    const searchToViewRatio = searchInteractions.length / Math.max(viewInteractions.length, 1);
    const comparisonRate = comparisonInteractions.length / Math.max(interactions.length, 1);

    if (comparisonRate > 0.2) return 'comparative';
    if (searchToViewRatio > 0.5) return 'explorative';
    return 'focused';
  }

  private inferDecisionSpeed(interactions: any[]): 'quick' | 'moderate' | 'deliberate' {
    const decisionInteractions = interactions.filter(i => 
      ['like', 'dislike', 'save', 'book'].includes(i.interactionType)
    );
    
    if (decisionInteractions.length === 0) return 'moderate';

    const averageDecisionTime = this.calculateAverageDecisionTime(interactions);
    
    if (averageDecisionTime < 60) return 'quick';       // < 1 minute
    if (averageDecisionTime < 300) return 'moderate';   // < 5 minutes
    return 'deliberate';                                // > 5 minutes
  }

  private inferContentPreference(interactions: any[]): 'visual' | 'detailed' | 'minimal' {
    const viewInteractions = interactions.filter(i => i.interactionType === 'view');
    const timeSpentInteractions = interactions.filter(i => i.interactionType === 'time_spent');

    const averageTimeSpent = timeSpentInteractions.reduce((sum, i) => 
      sum + (parseInt(i.interactionValue) || 0), 0) / Math.max(timeSpentInteractions.length, 1);

    if (averageTimeSpent > 120) return 'detailed';  // > 2 minutes average
    if (averageTimeSpent > 30) return 'visual';     // 30s - 2m average
    return 'minimal';                               // < 30s average
  }

  private inferInteractionPattern(interactions: any[]): 'mobile' | 'desktop' | 'mixed' {
    // This would require context data from sessions
    // For now, return mixed as default
    return 'mixed';
  }

  private inferTravelPhase(interactions: any[]): 'inspiration' | 'planning' | 'booking' | 'traveling' {
    const searchCount = interactions.filter(i => i.interactionType === 'search').length;
    const viewCount = interactions.filter(i => i.interactionType === 'view').length;
    const saveCount = interactions.filter(i => i.interactionType === 'save').length;
    const bookCount = interactions.filter(i => i.interactionType === 'book').length;

    if (bookCount > 0) return 'booking';
    if (saveCount > searchCount * 0.3) return 'planning';
    if (viewCount > searchCount * 2) return 'inspiration';
    return 'planning';
  }

  private inferEngagementLevel(interactions: any[]): 'high' | 'medium' | 'low' {
    const actionsPerDay = interactions.length / 30;
    
    if (actionsPerDay > 10) return 'high';
    if (actionsPerDay > 3) return 'medium';
    return 'low';
  }

  // ==================== HELPER METHODS ====================

  private isHighPriorityEvent(event: BehaviorEvent): boolean {
    return ['book', 'like', 'dislike', 'save'].includes(event.eventType);
  }

  private async processEvent(event: BehaviorEvent): Promise<void> {
    // Store event in database for real-time processing
    try {
      await withDatabase(async (db) => {
        if (!db) return;
        await db.insert(userInteractions).values({
          userId: this.activeSessions.get(event.sessionId)?.userId || '',
          sessionId: event.sessionId,
          interactionType: event.eventType,
          targetType: event.targetType,
          targetId: event.targetId,
          interactionValue: event.duration?.toString(),
          contextData: event.eventData
        });
      });
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  private async analyzeSessionPatterns(session: BehaviorSession): Promise<void> {
    // Analyze patterns within the session
    // This could trigger real-time personalization updates
    const sessionDuration = Date.now() - session.startTime.getTime();
    const interactionCount = session.interactions.length;
    
    if (interactionCount > 20 || sessionDuration > 30 * 60 * 1000) {
      // High engagement session - trigger preference learning
      // This would call the preference learning API
    }
  }

  private startEventProcessor(): void {
    this.processingInterval = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        const eventsToProcess = this.eventQueue.splice(0, 10); // Process in batches
        for (const event of eventsToProcess) {
          await this.processEvent(event);
        }
      }
    }, 5000); // Process every 5 seconds
  }

  private getTimeframeMs(timeframe: string): number {
    switch (timeframe) {
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }

  // ==================== CALCULATION METHODS ====================

  private calculateAverageSearchesPerSession(interactions: any[]): number {
    // Group by session and calculate average
    const sessions = new Set(interactions.map(i => i.sessionId));
    return interactions.length / Math.max(sessions.size, 1);
  }

  private calculateSearchRefinementRate(interactions: any[]): number {
    // Calculate how often users refine their searches
    return Math.min(1, interactions.length / 10);
  }

  private extractPreferredFilters(interactions: any[]): string[] {
    // Extract commonly used filters from search interactions
    return ['budget', 'destination_type', 'activities'];
  }

  private calculateDecisionSpeed(interactions: any[]): number {
    // Calculate average time between view and decision
    return 120; // placeholder: 2 minutes average
  }

  private calculateConversionRate(interactions: any[]): number {
    const decisionActions = interactions.filter(i => 
      ['like', 'save', 'book'].includes(i.interactionType)
    ).length;
    return decisionActions / Math.max(interactions.length, 1);
  }

  private extractPreferredActions(interactions: any[]): string[] {
    const actionCounts = interactions.reduce((acc, i) => {
      acc[i.interactionType] = (acc[i.interactionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([action]) => action);
  }

  private calculateAverageTimeSpent(interactions: any[]): number {
    const timeSpentInteractions = interactions.filter(i => i.interactionType === 'time_spent');
    if (timeSpentInteractions.length === 0) return 30;

    return timeSpentInteractions.reduce((sum, i) => 
      sum + (parseInt(i.interactionValue) || 0), 0) / timeSpentInteractions.length;
  }

  private calculateBrowsingDepth(interactions: any[]): number {
    const uniqueTargets = new Set(interactions.map(i => i.targetId));
    return uniqueTargets.size / Math.max(interactions.length, 1);
  }

  private extractContentTypePreferences(interactions: any[]): string[] {
    const contentTypes = interactions.reduce((acc, i) => {
      acc[i.targetType] = (acc[i.targetType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(contentTypes)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([type]) => type);
  }

  private identifyAbandonmentPoints(interactions: any[]): string[] {
    // Identify common points where users abandon their flow
    return ['search_results', 'destination_details', 'booking_form'];
  }

  private identifyAbandonmentTriggers(interactions: any[]): string[] {
    // Identify what triggers abandonment behavior
    return ['high_price', 'complex_booking', 'limited_availability'];
  }

  private calculateAverageDecisionTime(interactions: any[]): number {
    // Calculate average time between first interaction and decision
    return 180; // placeholder: 3 minutes
  }

  private async calculateEngagementScore(userId: string): Promise<number> {
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const interactions = await withDatabase(async (db) => {
        if (!db) return [];
        return await db
          .select()
          .from(userInteractions)
          .where(
            and(
              eq(userInteractions.userId, userId),
              gte(userInteractions.timestamp, since)
            )
          );
      });

      if (!interactions || interactions.length === 0) {
        return 50; // Default medium engagement
      }

      const totalInteractions = interactions.length;
      const uniqueDays = new Set(interactions.map((i: any) => 
        new Date(i.timestamp).toDateString()
      )).size;
      
      const highValueActions = interactions.filter((i: any) => 
        ['like', 'save', 'book', 'share'].includes(i.interactionType)
      ).length;

      // Score based on frequency, consistency, and high-value actions
      const frequencyScore = Math.min(100, totalInteractions * 2);
      const consistencyScore = Math.min(100, uniqueDays * 5);
      const qualityScore = Math.min(100, highValueActions * 10);

      return (frequencyScore + consistencyScore + qualityScore) / 3;
    } catch (error) {
      console.error('Error calculating engagement score:', error);
      return 50; // Default medium engagement
    }
  }

  private generateRecommendedActions(patterns: BehaviorPattern[], preferences: UserBehaviorPreferences): string[] {
    const actions: string[] = [];

    if (preferences.engagementLevel === 'low') {
      actions.push('Send personalized destination recommendations');
      actions.push('Offer travel inspiration content');
    }

    if (preferences.decisionSpeed === 'deliberate') {
      actions.push('Provide detailed comparison tools');
      actions.push('Send reminder notifications for saved items');
    }

    if (patterns.some(p => p.patternType === 'abandonment')) {
      actions.push('Implement exit-intent interventions');
      actions.push('Simplify booking flow');
    }

    return actions;
  }

  private identifyRiskFactors(patterns: BehaviorPattern[], preferences: UserBehaviorPreferences): string[] {
    const risks: string[] = [];

    if (preferences.engagementLevel === 'low') {
      risks.push('User may churn without intervention');
    }

    const abandonmentPattern = patterns.find(p => p.patternType === 'abandonment');
    if (abandonmentPattern && abandonmentPattern.confidence > 0.7) {
      risks.push('High abandonment risk detected');
    }

    if (preferences.travelPhase === 'inspiration' && preferences.decisionSpeed === 'deliberate') {
      risks.push('User may be in extended research phase');
    }

    return risks;
  }

  private identifyPersonalizationOpportunities(patterns: BehaviorPattern[], preferences: UserBehaviorPreferences): string[] {
    const opportunities: string[] = [];

    if (preferences.searchStyle === 'explorative') {
      opportunities.push('Curate diverse destination recommendations');
    }

    if (preferences.contentPreference === 'visual') {
      opportunities.push('Prioritize image-rich content');
    }

    if (preferences.decisionSpeed === 'quick') {
      opportunities.push('Highlight limited-time offers');
    }

    const searchPattern = patterns.find(p => p.patternType === 'search');
    if (searchPattern) {
      opportunities.push('Optimize search filters based on usage patterns');
    }

    return opportunities;
  }
}

// ==================== SINGLETON EXPORT ====================

export const behavioralAnalytics = new BehavioralAnalyticsService();