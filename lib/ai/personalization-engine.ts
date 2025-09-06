'use client';

// Personalization Engine - Phase 10 Platform Evolution
// User preference learning and recommendation refinement with ML-inspired algorithms

export interface UserProfile {
  id: string;
  createdAt: Date;
  lastActive: Date;
  demographics: {
    ageRange?: '18-25' | '26-35' | '36-45' | '46-55' | '55+';
    location?: {
      country: string;
      region: string;
      timezone: string;
    };
    income?: 'low' | 'medium' | 'high' | 'luxury';
    travelFrequency?: 'rare' | 'occasional' | 'frequent' | 'nomad';
  };
  preferences: UserPreferences;
  behaviorHistory: BehaviorEvent[];
  tripHistory: TripSummary[];
  personalityProfile: PersonalityProfile;
  satisfactionScores: SatisfactionScore[];
}

export interface UserPreferences {
  destinations: {
    preferred: string[];
    avoided: string[];
    bucket_list: string[];
  };
  accommodations: {
    preferred_types: string[];
    amenity_priorities: string[];
    location_preference: 'city_center' | 'quiet' | 'transport_hub' | 'scenic';
  };
  activities: {
    interests: InterestProfile[];
    activity_level: 'low' | 'moderate' | 'high' | 'extreme';
    cultural_openness: number; // 0-1
    adventure_tolerance: number; // 0-1
  };
  budget: {
    typical_range: [number, number];
    splurge_categories: string[];
    saving_priorities: string[];
    payment_preferences: string[];
  };
  travel_style: {
    planning_preference: 'detailed' | 'flexible' | 'spontaneous';
    group_preferences: string[];
    pace: 'slow' | 'moderate' | 'fast' | 'packed';
    luxury_vs_authenticity: number; // 0 (authentic) - 1 (luxury)
  };
  accessibility: {
    mobility_requirements: string[];
    dietary_restrictions: string[];
    language_preferences: string[];
  };
}

export interface InterestProfile {
  category: string;
  strength: number; // 0-1
  subcategories: { [key: string]: number };
  seasonal_variations: { [key: string]: number };
  last_updated: Date;
}

export interface BehaviorEvent {
  id: string;
  timestamp: Date;
  type: 'view' | 'click' | 'save' | 'book' | 'search' | 'share' | 'rate';
  context: {
    page: string;
    item_id?: string;
    item_type?: string;
    search_query?: string;
    filters_applied?: Record<string, any>;
  };
  duration?: number; // seconds
  outcome?: 'completed' | 'abandoned' | 'converted';
}

export interface TripSummary {
  id: string;
  destinations: string[];
  dates: { start: Date; end: Date };
  budget: { planned: number; actual: number };
  group_size: number;
  group_type: string;
  satisfaction_rating: number; // 1-5
  highlights: string[];
  pain_points: string[];
  recommendations_followed: number;
  ai_suggestions_rating: number;
}

export interface PersonalityProfile {
  openness: number; // 0-1
  conscientiousness: number; // 0-1
  extraversion: number; // 0-1
  agreeableness: number; // 0-1
  neuroticism: number; // 0-1
  risk_tolerance: number; // 0-1
  spontaneity: number; // 0-1
  cultural_curiosity: number; // 0-1
}

export interface SatisfactionScore {
  trip_id: string;
  overall_score: number;
  category_scores: {
    recommendations: number;
    planning_process: number;
    cost_accuracy: number;
    experience_quality: number;
  };
  feedback: string;
  timestamp: Date;
}

export interface PersonalizedRecommendation {
  id: string;
  type: 'destination' | 'activity' | 'accommodation' | 'restaurant' | 'experience';
  item: any;
  confidence_score: number; // 0-1
  reasoning: string[];
  personalization_factors: string[];
  similar_users_data: SimilarUserInsight[];
  seasonal_relevance: number; // 0-1
  urgency: 'low' | 'medium' | 'high';
  expected_satisfaction: number; // 0-1
}

export interface SimilarUserInsight {
  demographic_similarity: number;
  preference_similarity: number;
  behavior_similarity: number;
  common_trips: string[];
  divergent_preferences: string[];
}

export interface LearningInsight {
  category: 'preference_evolution' | 'satisfaction_pattern' | 'behavior_change' | 'market_trend';
  title: string;
  description: string;
  confidence: number;
  actionable_suggestion: string;
  impact_estimate: 'low' | 'medium' | 'high';
}

class PersonalizationEngine {
  private userProfiles: Map<string, UserProfile> = new Map();
  private globalPatterns: Map<string, any> = new Map();
  private similarityCache: Map<string, SimilarUserInsight[]> = new Map();

  constructor() {
    this.initializeEngine();
  }

  async analyzeUser(userId: string, behaviorData: BehaviorEvent[]): Promise<UserProfile> {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = await this.createNewProfile(userId);
    }
    
    // Update behavior history
    profile.behaviorHistory.push(...behaviorData);
    profile.lastActive = new Date();
    
    // Analyze recent behavior patterns
    await this.updatePreferencesFromBehavior(profile, behaviorData);
    
    // Update personality profile based on behavior patterns
    await this.updatePersonalityProfile(profile);
    
    // Store updated profile
    this.userProfiles.set(userId, profile);
    
    return profile;
  }

  async generatePersonalizedRecommendations(
    userId: string,
    context: {
      destination?: string;
      dates?: { start: Date; end: Date };
      budget?: number;
      group_type?: string;
    },
    count: number = 10
  ): Promise<PersonalizedRecommendation[]> {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return await this.generateGenericRecommendations(context, count);
    }
    
    const recommendations: PersonalizedRecommendation[] = [];
    
    // Generate destination recommendations
    const destinationRecs = await this.recommendDestinations(profile, context, count * 0.3);
    recommendations.push(...destinationRecs);
    
    // Generate activity recommendations
    const activityRecs = await this.recommendActivities(profile, context, count * 0.4);
    recommendations.push(...activityRecs);
    
    // Generate accommodation recommendations
    const accommodationRecs = await this.recommendAccommodations(profile, context, count * 0.2);
    recommendations.push(...accommodationRecs);
    
    // Generate experience recommendations
    const experienceRecs = await this.recommendExperiences(profile, context, count * 0.1);
    recommendations.push(...experienceRecs);
    
    // Sort by confidence score and personalization strength
    return recommendations
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, count);
  }

  async learnFromFeedback(
    userId: string,
    tripId: string,
    satisfactionScore: SatisfactionScore
  ): Promise<LearningInsight[]> {
    const profile = this.userProfiles.get(userId);
    if (!profile) return [];
    
    // Add satisfaction score to profile
    profile.satisfactionScores.push(satisfactionScore);
    
    // Analyze satisfaction patterns
    const insights = await this.analyzeSatisfactionPatterns(profile);
    
    // Update preference weights based on satisfaction
    await this.adjustPreferenceWeights(profile, satisfactionScore);
    
    // Update global patterns
    await this.updateGlobalPatterns(satisfactionScore);
    
    return insights;
  }

  async findSimilarUsers(userId: string, limit: number = 10): Promise<SimilarUserInsight[]> {
    const profile = this.userProfiles.get(userId);
    if (!profile) return [];
    
    // Check cache first
    const cacheKey = `${userId}_${profile.lastActive.getTime()}`;
    if (this.similarityCache.has(cacheKey)) {
      return this.similarityCache.get(cacheKey)!;
    }
    
    const similarities: SimilarUserInsight[] = [];
    
    for (const [otherUserId, otherProfile] of this.userProfiles) {
      if (otherUserId === userId) continue;
      
      const similarity = this.calculateUserSimilarity(profile, otherProfile);
      similarities.push(similarity);
    }
    
    const topSimilar = similarities
      .sort((a, b) => b.preference_similarity - a.preference_similarity)
      .slice(0, limit);
    
    // Cache results
    this.similarityCache.set(cacheKey, topSimilar);
    
    return topSimilar;
  }

  async predictUserSatisfaction(
    userId: string,
    proposedTrip: any
  ): Promise<{ satisfaction: number; confidence: number; factors: string[] }> {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return { satisfaction: 0.5, confidence: 0.1, factors: ['No user data available'] };
    }
    
    const factors: string[] = [];
    let satisfaction = 0.5;
    let confidence = 0.5;
    
    // Analyze destination match
    const destinationMatch = this.analyzeDestinationMatch(profile, proposedTrip);
    satisfaction += destinationMatch.score * 0.3;
    factors.push(...destinationMatch.factors);
    
    // Analyze budget alignment
    const budgetMatch = this.analyzeBudgetAlignment(profile, proposedTrip);
    satisfaction += budgetMatch.score * 0.2;
    factors.push(...budgetMatch.factors);
    
    // Analyze activity match
    const activityMatch = this.analyzeActivityMatch(profile, proposedTrip);
    satisfaction += activityMatch.score * 0.3;
    factors.push(...activityMatch.factors);
    
    // Analyze timing and seasonality
    const timingMatch = this.analyzeTimingMatch(profile, proposedTrip);
    satisfaction += timingMatch.score * 0.1;
    factors.push(...timingMatch.factors);
    
    // Analyze past satisfaction patterns
    const historicalMatch = this.analyzeHistoricalPatterns(profile, proposedTrip);
    satisfaction += historicalMatch.score * 0.1;
    factors.push(...historicalMatch.factors);
    
    // Calculate confidence based on data availability
    confidence = this.calculatePredictionConfidence(profile);
    
    return {
      satisfaction: Math.max(0, Math.min(1, satisfaction)),
      confidence,
      factors,
    };
  }

  private async createNewProfile(userId: string): Promise<UserProfile> {
    return {
      id: userId,
      createdAt: new Date(),
      lastActive: new Date(),
      demographics: {},
      preferences: {
        destinations: { preferred: [], avoided: [], bucket_list: [] },
        accommodations: {
          preferred_types: [],
          amenity_priorities: [],
          location_preference: 'city_center',
        },
        activities: {
          interests: [],
          activity_level: 'moderate',
          cultural_openness: 0.5,
          adventure_tolerance: 0.5,
        },
        budget: {
          typical_range: [100, 500],
          splurge_categories: [],
          saving_priorities: [],
          payment_preferences: [],
        },
        travel_style: {
          planning_preference: 'flexible',
          group_preferences: [],
          pace: 'moderate',
          luxury_vs_authenticity: 0.5,
        },
        accessibility: {
          mobility_requirements: [],
          dietary_restrictions: [],
          language_preferences: [],
        },
      },
      behaviorHistory: [],
      tripHistory: [],
      personalityProfile: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
        risk_tolerance: 0.5,
        spontaneity: 0.5,
        cultural_curiosity: 0.5,
      },
      satisfactionScores: [],
    };
  }

  private async updatePreferencesFromBehavior(
    profile: UserProfile,
    behaviorData: BehaviorEvent[]
  ): Promise<void> {
    // Analyze search patterns
    const searches = behaviorData.filter(event => event.type === 'search');
    for (const search of searches) {
      if (search.context.search_query) {
        await this.extractPreferencesFromSearch(profile, search.context.search_query);
      }
    }
    
    // Analyze interaction patterns
    const interactions = behaviorData.filter(event => 
      ['view', 'click', 'save'].includes(event.type)
    );
    for (const interaction of interactions) {
      await this.extractPreferencesFromInteraction(profile, interaction);
    }
    
    // Analyze booking patterns
    const bookings = behaviorData.filter(event => 
      event.type === 'book' && event.outcome === 'completed'
    );
    for (const booking of bookings) {
      await this.extractPreferencesFromBooking(profile, booking);
    }
  }

  private async extractPreferencesFromSearch(
    profile: UserProfile,
    query: string
  ): Promise<void> {
    const keywords = query.toLowerCase().split(' ');
    
    // Extract destination preferences
    // This would use NLP to identify destinations in the query
    
    // Extract activity preferences
    const activityKeywords = [
      'museum', 'beach', 'hiking', 'food', 'nightlife', 'shopping',
      'culture', 'adventure', 'relaxation', 'photography'
    ];
    
    for (const keyword of keywords) {
      if (activityKeywords.includes(keyword)) {
        // Update interest strength
        this.updateInterestStrength(profile, keyword, 0.1);
      }
    }
  }

  private updateInterestStrength(profile: UserProfile, category: string, delta: number): void {
    let interest = profile.preferences.activities.interests.find(i => i.category === category);
    
    if (!interest) {
      interest = {
        category,
        strength: 0.5,
        subcategories: {},
        seasonal_variations: {},
        last_updated: new Date(),
      };
      profile.preferences.activities.interests.push(interest);
    }
    
    interest.strength = Math.max(0, Math.min(1, interest.strength + delta));
    interest.last_updated = new Date();
  }

  private async extractPreferencesFromInteraction(
    profile: UserProfile,
    interaction: BehaviorEvent
  ): Promise<void> {
    // Analyze interaction duration and type to infer preferences
    const engagementScore = this.calculateEngagementScore(interaction);
    
    if (interaction.context.item_type && engagementScore > 0.5) {
      this.updateInterestStrength(profile, interaction.context.item_type, engagementScore * 0.05);
    }
  }

  private calculateEngagementScore(interaction: BehaviorEvent): number {
    let score = 0.5;
    
    // Duration-based scoring
    if (interaction.duration) {
      if (interaction.duration > 60) score += 0.3; // 1+ minute
      if (interaction.duration > 180) score += 0.2; // 3+ minutes
    }
    
    // Outcome-based scoring
    if (interaction.outcome === 'completed') score += 0.3;
    if (interaction.outcome === 'converted') score += 0.5;
    
    // Type-based scoring
    if (interaction.type === 'save') score += 0.4;
    if (interaction.type === 'share') score += 0.3;
    
    return Math.min(1, score);
  }

  private async extractPreferencesFromBooking(
    profile: UserProfile,
    booking: BehaviorEvent
  ): Promise<void> {
    // Strong signal - user actually booked something
    if (booking.context.item_type) {
      this.updateInterestStrength(profile, booking.context.item_type, 0.3);
    }
  }

  private async updatePersonalityProfile(profile: UserProfile): Promise<void> {
    // Analyze behavior patterns to infer personality traits
    const recentBehavior = profile.behaviorHistory.slice(-100); // Last 100 events
    
    // Spontaneity analysis
    const planningBehavior = recentBehavior.filter(b => 
      b.context.page?.includes('plan') || b.type === 'search'
    );
    const bookingSpeed = this.analyzeBookingSpeed(recentBehavior);
    profile.personalityProfile.spontaneity = bookingSpeed;
    
    // Risk tolerance analysis
    const riskIndicators = this.analyzeRiskTolerance(recentBehavior);
    profile.personalityProfile.risk_tolerance = riskIndicators;
    
    // Cultural curiosity analysis
    const culturalEngagement = this.analyzeCulturalEngagement(recentBehavior);
    profile.personalityProfile.cultural_curiosity = culturalEngagement;
  }

  private analyzeBookingSpeed(behavior: BehaviorEvent[]): number {
    // Analyze time between search and booking
    // Higher values indicate more spontaneous behavior
    return 0.5; // Placeholder
  }

  private analyzeRiskTolerance(behavior: BehaviorEvent[]): number {
    // Analyze preferences for adventure activities, remote destinations, etc.
    return 0.5; // Placeholder
  }

  private analyzeCulturalEngagement(behavior: BehaviorEvent[]): number {
    // Analyze interactions with cultural content
    return 0.5; // Placeholder
  }

  private async recommendDestinations(
    profile: UserProfile,
    context: any,
    count: number
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];
    
    // Use collaborative filtering and content-based filtering
    const similarUsers = await this.findSimilarUsers(profile.id, 5);
    
    // Get popular destinations among similar users
    const popularDestinations = this.extractPopularDestinations(similarUsers);
    
    // Score destinations based on user preferences
    for (const destination of popularDestinations.slice(0, count)) {
      const confidence = this.calculateDestinationConfidence(profile, destination);
      
      recommendations.push({
        id: `dest_${destination.id}`,
        type: 'destination',
        item: destination,
        confidence_score: confidence,
        reasoning: this.generateDestinationReasoning(profile, destination),
        personalization_factors: ['similar_users', 'interest_match', 'budget_alignment'],
        similar_users_data: similarUsers,
        seasonal_relevance: this.calculateSeasonalRelevance(destination, context.dates),
        urgency: 'medium',
        expected_satisfaction: confidence * 0.9,
      });
    }
    
    return recommendations;
  }

  private async recommendActivities(
    profile: UserProfile,
    context: any,
    count: number
  ): Promise<PersonalizedRecommendation[]> {
    // Implementation similar to recommendDestinations
    return [];
  }

  private async recommendAccommodations(
    profile: UserProfile,
    context: any,
    count: number
  ): Promise<PersonalizedRecommendation[]> {
    // Implementation similar to recommendDestinations
    return [];
  }

  private async recommendExperiences(
    profile: UserProfile,
    context: any,
    count: number
  ): Promise<PersonalizedRecommendation[]> {
    // Implementation similar to recommendDestinations
    return [];
  }

  // Additional helper methods...
  
  private initializeEngine(): void {
    // Initialize global patterns and model weights
    this.globalPatterns.set('seasonal_trends', new Map());
    this.globalPatterns.set('demographic_preferences', new Map());
  }

  private async generateGenericRecommendations(context: any, count: number): Promise<PersonalizedRecommendation[]> {
    // Fallback recommendations for new users
    return [];
  }

  private calculateUserSimilarity(profile1: UserProfile, profile2: UserProfile): SimilarUserInsight {
    // Calculate similarity metrics
    return {
      demographic_similarity: 0.5,
      preference_similarity: 0.5,
      behavior_similarity: 0.5,
      common_trips: [],
      divergent_preferences: [],
    };
  }

  // More helper methods would be implemented...
  
  private extractPopularDestinations(similarUsers: SimilarUserInsight[]): any[] {
    return [];
  }

  private calculateDestinationConfidence(profile: UserProfile, destination: any): number {
    return 0.7;
  }

  private generateDestinationReasoning(profile: UserProfile, destination: any): string[] {
    return ['Based on your interest in culture', 'Similar users loved this destination'];
  }

  private calculateSeasonalRelevance(destination: any, dates?: any): number {
    return 0.8;
  }

  private async analyzeSatisfactionPatterns(profile: UserProfile): Promise<LearningInsight[]> {
    return [];
  }

  private async adjustPreferenceWeights(profile: UserProfile, satisfaction: SatisfactionScore): Promise<void> {
    // Adjust preference weights based on satisfaction feedback
  }

  private async updateGlobalPatterns(satisfaction: SatisfactionScore): Promise<void> {
    // Update global learning patterns
  }

  private analyzeDestinationMatch(profile: UserProfile, trip: any): { score: number; factors: string[] } {
    return { score: 0.5, factors: [] };
  }

  private analyzeBudgetAlignment(profile: UserProfile, trip: any): { score: number; factors: string[] } {
    return { score: 0.5, factors: [] };
  }

  private analyzeActivityMatch(profile: UserProfile, trip: any): { score: number; factors: string[] } {
    return { score: 0.5, factors: [] };
  }

  private analyzeTimingMatch(profile: UserProfile, trip: any): { score: number; factors: string[] } {
    return { score: 0.5, factors: [] };
  }

  private analyzeHistoricalPatterns(profile: UserProfile, trip: any): { score: number; factors: string[] } {
    return { score: 0.5, factors: [] };
  }

  private calculatePredictionConfidence(profile: UserProfile): number {
    return 0.7;
  }
}

export const personalizationEngine = new PersonalizationEngine();
export default PersonalizationEngine;