/**
 * Intelligent Recommendation Engine - Phase 4.3.3
 * 
 * Advanced recommendation algorithms combining content-based filtering,
 * collaborative filtering, and machine learning for personalized travel suggestions
 */

import { withDatabase } from '@/lib/db';
import { 
  userPreferences, 
  userInteractions, 
  personalizedRecommendations,
  userClusters,
  places,
  trips,
  itineraries
} from '@/lib/database/schema';
import { eq, and, sql, desc, asc, inArray, ne } from 'drizzle-orm';

// ==================== TYPES ====================

export interface RecommendationContext {
  userId: string;
  currentLocation?: { lat: number; lng: number };
  travelDates?: { start: Date; end: Date };
  budget?: { min: number; max: number; currency: string };
  travelStyle?: string;
  groupSize?: number;
  previousBookings?: string[];
  searchQuery?: string;
}

export interface RecommendationItem {
  id: string;
  type: 'destination' | 'activity' | 'hotel' | 'flight' | 'trip' | 'itinerary';
  title: string;
  description: string;
  imageUrl?: string;
  price?: { amount: number; currency: string };
  rating?: number;
  reviewCount?: number;
  location?: { lat: number; lng: number; address: string };
  features: string[];
  metadata: Record<string, any>;
}

export interface ScoredRecommendation {
  item: RecommendationItem;
  score: number;
  confidence: number;
  reasoning: RecommendationReasoning;
  source: 'content_based' | 'collaborative' | 'hybrid' | 'trending' | 'personalized';
}

export interface RecommendationReasoning {
  factors: Array<{
    factor: string;
    weight: number;
    contribution: number;
    explanation: string;
  }>;
  personalizedFactors: string[];
  similarUsers?: string;
  contentSimilarity?: number;
}

export interface UserProfile {
  userId: string;
  preferences: Record<string, number>;
  behaviorVector: number[];
  clusterIds: string[];
  interactionHistory: Array<{
    itemId: string;
    itemType: string;
    interactionType: string;
    weight: number;
    timestamp: Date;
  }>;
}

export interface RecommendationOptions {
  maxResults?: number;
  minScore?: number;
  diversityFactor?: number;
  includeExplanations?: boolean;
  excludeInteracted?: boolean;
  boostFreshContent?: boolean;
  geographicRadius?: number;
}

// ==================== RECOMMENDATION ENGINE CLASS ====================

export class IntelligentRecommendationEngine {
  private contentVectors: Map<string, number[]> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private itemClusters: Map<string, string[]> = new Map();

  // ==================== MAIN RECOMMENDATION METHODS ====================

  /**
   * Generate personalized recommendations using hybrid approach
   */
  async generateRecommendations(
    context: RecommendationContext,
    options: RecommendationOptions = {}
  ): Promise<ScoredRecommendation[]> {
    const {
      maxResults = 20,
      minScore = 0.1,
      diversityFactor = 0.3,
      includeExplanations = true,
      excludeInteracted = true,
      boostFreshContent = true,
      geographicRadius = 50000 // 50km in meters
    } = options;

    try {
      // Build user profile
      const userProfile = await this.buildUserProfile(context.userId);
      
      // Get candidate items
      const candidates = await this.getCandidateItems(context, geographicRadius);
      
      // Generate recommendations using different algorithms
      const contentBasedRecs = await this.generateContentBasedRecommendations(
        userProfile, candidates, context
      );
      
      const collaborativeRecs = await this.generateCollaborativeRecommendations(
        userProfile, candidates, context
      );
      
      const trendingRecs = await this.generateTrendingRecommendations(
        candidates, context
      );

      // Combine and score recommendations using hybrid approach
      const hybridRecs = this.combineRecommendations([
        { recommendations: contentBasedRecs, weight: 0.4, source: 'content_based' as const },
        { recommendations: collaborativeRecs, weight: 0.4, source: 'collaborative' as const },
        { recommendations: trendingRecs, weight: 0.2, source: 'trending' as const }
      ]);

      // Apply personalization boost
      const personalizedRecs = await this.applyPersonalizationBoost(hybridRecs, userProfile, context);

      // Filter out already interacted items if requested
      let filteredRecs = excludeInteracted 
        ? personalizedRecs.filter(rec => !this.hasUserInteractedWith(userProfile, rec.item.id))
        : personalizedRecs;

      // Apply diversity and freshness
      filteredRecs = this.applyDiversityFilter(filteredRecs, diversityFactor);
      
      if (boostFreshContent) {
        filteredRecs = this.boostFreshContent(filteredRecs);
      }

      // Filter by minimum score and limit results
      const finalRecs = filteredRecs
        .filter(rec => rec.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

      // Add explanations if requested
      if (includeExplanations) {
        finalRecs.forEach(rec => {
          rec.reasoning = this.generateExplanation(rec, userProfile, context);
        });
      }

      // Cache recommendations
      await this.cacheRecommendations(context.userId, finalRecs);

      return finalRecs;

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  // ==================== CONTENT-BASED FILTERING ====================

  /**
   * Generate content-based recommendations
   */
  private async generateContentBasedRecommendations(
    userProfile: UserProfile,
    candidates: RecommendationItem[],
    context: RecommendationContext
  ): Promise<ScoredRecommendation[]> {
    const recommendations: ScoredRecommendation[] = [];

    for (const item of candidates) {
      const score = this.calculateContentBasedScore(item, userProfile, context);
      
      if (score > 0.1) {
        recommendations.push({
          item,
          score,
          confidence: this.calculateConfidence('content_based', score, userProfile),
          reasoning: {
            factors: [],
            personalizedFactors: []
          },
          source: 'content_based'
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate content-based similarity score
   */
  private calculateContentBasedScore(
    item: RecommendationItem,
    userProfile: UserProfile,
    context: RecommendationContext
  ): number {
    let score = 0;
    let totalWeight = 0;

    // Feature-based scoring
    const itemVector = this.extractItemFeatures(item);
    const userVector = this.createUserFeatureVector(userProfile);
    const featureSimilarity = this.cosineSimilarity(itemVector, userVector);
    
    score += featureSimilarity * 0.4;
    totalWeight += 0.4;

    // Category preference scoring
    const categoryScore = this.calculateCategoryScore(item, userProfile);
    score += categoryScore * 0.3;
    totalWeight += 0.3;

    // Location preference scoring
    if (context.currentLocation && item.location) {
      const locationScore = this.calculateLocationScore(item.location, context);
      score += locationScore * 0.2;
      totalWeight += 0.2;
    }

    // Budget compatibility scoring
    if (context.budget && item.price) {
      const budgetScore = this.calculateBudgetScore(item.price, context.budget);
      score += budgetScore * 0.1;
      totalWeight += 0.1;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  // ==================== COLLABORATIVE FILTERING ====================

  /**
   * Generate collaborative filtering recommendations
   */
  private async generateCollaborativeRecommendations(
    userProfile: UserProfile,
    candidates: RecommendationItem[],
    context: RecommendationContext
  ): Promise<ScoredRecommendation[]> {
    const recommendations: ScoredRecommendation[] = [];

    // Find similar users
    const similarUsers = await this.findSimilarUsers(userProfile);
    
    if (similarUsers.length === 0) {
      return recommendations;
    }

    // Get items liked by similar users
    const collaborativeScores = await this.calculateCollaborativeScores(
      similarUsers, candidates, context
    );

    for (const [itemId, score] of collaborativeScores.entries()) {
      const item = candidates.find(c => c.id === itemId);
      if (item && score > 0.1) {
        recommendations.push({
          item,
          score,
          confidence: this.calculateConfidence('collaborative', score, userProfile),
          reasoning: {
            factors: [],
            personalizedFactors: [],
            similarUsers: `Based on ${similarUsers.length} similar users`
          },
          source: 'collaborative'
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Find users with similar preferences and behavior
   */
  private async findSimilarUsers(userProfile: UserProfile): Promise<string[]> {
    try {
      // Find users in the same clusters
      const clusterUsers = await withDatabase(async (db) => {
        if (!db) return [];
        return await db
          .select({ userId: userClusters.userId })
          .from(userClusters)
          .where(inArray(userClusters.clusterId, userProfile.clusterIds));
      });

      if (!clusterUsers || clusterUsers.length === 0) {
        return [];
      }

      // Calculate similarity scores
      const similarityScores = new Map<string, number>();

      for (const clusterUser of clusterUsers) {
        if (clusterUser.userId === userProfile.userId) continue;

        const otherProfile = await this.buildUserProfile(clusterUser.userId);
        const similarity = this.calculateUserSimilarity(userProfile, otherProfile);
        
        if (similarity > 0.3) {
          similarityScores.set(clusterUser.userId, similarity);
        }
      }

      // Return top similar users
      return Array.from(similarityScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId]) => userId);

    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Calculate collaborative filtering scores
   */
  private async calculateCollaborativeScores(
    similarUsers: string[],
    candidates: RecommendationItem[],
    context: RecommendationContext
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>();

    try {
      // Get interactions from similar users
      const similarUserInteractions = await withDatabase(async (db) => {
        if (!db) return [];
        return await db
          .select()
          .from(userInteractions)
          .where(
            and(
              inArray(userInteractions.userId, similarUsers),
              inArray(userInteractions.interactionType, ['like', 'save', 'book', 'share'])
            )
          )
          .orderBy(desc(userInteractions.timestamp));
      });

      if (!similarUserInteractions || similarUserInteractions.length === 0) {
        return scores;
      }

      // Calculate item scores based on similar user preferences
      for (const interaction of similarUserInteractions) {
        const weight = this.getInteractionWeight(interaction.interactionType);
        const currentScore = scores.get(interaction.targetId) || 0;
        scores.set(interaction.targetId, currentScore + weight);
      }

      // Normalize scores
      const maxScore = Math.max(...scores.values());
      if (maxScore > 0) {
        for (const [itemId, score] of scores.entries()) {
          scores.set(itemId, score / maxScore);
        }
      }

    } catch (error) {
      console.error('Error calculating collaborative scores:', error);
    }

    return scores;
  }

  // ==================== TRENDING RECOMMENDATIONS ====================

  /**
   * Generate trending/popular recommendations
   */
  private async generateTrendingRecommendations(
    candidates: RecommendationItem[],
    context: RecommendationContext
  ): Promise<ScoredRecommendation[]> {
    const recommendations: ScoredRecommendation[] = [];

    try {
      // Get trending items based on recent interactions
      const trendingScores = await this.calculateTrendingScores(candidates);

      for (const [itemId, score] of trendingScores.entries()) {
        const item = candidates.find(c => c.id === itemId);
        if (item && score > 0.1) {
          recommendations.push({
            item,
            score,
            confidence: 0.7, // Medium confidence for trending items
            reasoning: {
              factors: [
                {
                  factor: 'trending',
                  weight: 1.0,
                  contribution: score,
                  explanation: 'Popular among users recently'
                }
              ],
              personalizedFactors: []
            },
            source: 'trending'
          });
        }
      }

    } catch (error) {
      console.error('Error generating trending recommendations:', error);
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate trending scores based on recent activity
   */
  private async calculateTrendingScores(candidates: RecommendationItem[]): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    
    try {
      // Get interactions from last 7 days
      const recentInteractions = await withDatabase(async (db) => {
        if (!db) return [];
        return await db
          .select({
            targetId: userInteractions.targetId,
            interactionType: userInteractions.interactionType,
            count: sql<number>`count(*)`.as('count')
          })
          .from(userInteractions)
          .where(
            and(
              sql`${userInteractions.timestamp} >= NOW() - INTERVAL '7 days'`,
              inArray(userInteractions.interactionType, ['view', 'like', 'save', 'book', 'share'])
            )
          )
          .groupBy(userInteractions.targetId, userInteractions.interactionType);
      });

      if (!recentInteractions || recentInteractions.length === 0) {
        return scores;
      }

      // Calculate weighted trending scores
      for (const interaction of recentInteractions) {
        const weight = this.getInteractionWeight(interaction.interactionType);
        const trendingScore = interaction.count * weight;
        const currentScore = scores.get(interaction.targetId) || 0;
        scores.set(interaction.targetId, currentScore + trendingScore);
      }

      // Apply decay factor for time sensitivity
      const now = new Date();
      for (const [itemId, score] of scores.entries()) {
        const timeDecay = 0.8; // Reduce score by 20% for older content
        scores.set(itemId, score * timeDecay);
      }

      // Normalize scores
      const maxScore = Math.max(...scores.values());
      if (maxScore > 0) {
        for (const [itemId, score] of scores.entries()) {
          scores.set(itemId, Math.min(1.0, score / maxScore));
        }
      }

    } catch (error) {
      console.error('Error calculating trending scores:', error);
    }

    return scores;
  }

  // ==================== USER PROFILE BUILDING ====================

  /**
   * Build comprehensive user profile for recommendations
   */
  private async buildUserProfile(userId: string): Promise<UserProfile> {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    try {
      // Get user preferences
      const preferences = await withDatabase(async (db) => {
        if (!db) return [];
        return await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, userId))
          .orderBy(desc(userPreferences.confidenceScore));
      });

      // Get user interactions
      const interactions = await withDatabase(async (db) => {
        if (!db) return [];
        return await db
          .select()
          .from(userInteractions)
          .where(eq(userInteractions.userId, userId))
          .orderBy(desc(userInteractions.timestamp))
          .limit(100);
      });

      // Get user clusters
      const clusters = await withDatabase(async (db) => {
        if (!db) return [];
        return await db
          .select()
          .from(userClusters)
          .where(eq(userClusters.userId, userId));
      });

      if (!preferences || !interactions || !clusters) {
        // Return default profile if database queries failed
        const profile: UserProfile = {
          userId,
          preferences: {},
          behaviorVector: [],
          clusterIds: [],
          interactionHistory: []
        };
        this.userProfiles.set(userId, profile);
        return profile;
      }

      // Build preference vector
      const preferenceVector: Record<string, number> = {};
      for (const pref of preferences) {
        const key = `${pref.preferenceType}:${pref.preferenceValue}`;
        preferenceVector[key] = parseFloat(pref.confidenceScore);
      }

      // Build behavior vector
      const behaviorVector = this.createBehaviorVector(interactions);

      // Build interaction history
      const interactionHistory = interactions.map(interaction => ({
        itemId: interaction.targetId,
        itemType: interaction.targetType,
        interactionType: interaction.interactionType,
        weight: this.getInteractionWeight(interaction.interactionType),
        timestamp: interaction.timestamp
      }));

      const profile: UserProfile = {
        userId,
        preferences: preferenceVector,
        behaviorVector,
        clusterIds: clusters.map(c => c.clusterId),
        interactionHistory
      };

      this.userProfiles.set(userId, profile);
      return profile;

    } catch (error) {
      console.error('Error building user profile:', error);
      return {
        userId,
        preferences: {},
        behaviorVector: [],
        clusterIds: [],
        interactionHistory: []
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Extract feature vector from item
   */
  private extractItemFeatures(item: RecommendationItem): number[] {
    const features: number[] = [];
    
    // Type encoding
    const typeMap = { destination: 0, activity: 1, hotel: 2, flight: 3, trip: 4, itinerary: 5 };
    features.push(typeMap[item.type] || 0);

    // Price range encoding
    if (item.price) {
      features.push(Math.log(item.price.amount + 1) / 10); // Log-scaled price
    } else {
      features.push(0);
    }

    // Rating encoding
    features.push(item.rating || 0);

    // Feature encoding
    const commonFeatures = ['beach', 'mountain', 'city', 'culture', 'adventure', 'food', 'nature', 'luxury'];
    for (const feature of commonFeatures) {
      features.push(item.features.includes(feature) ? 1 : 0);
    }

    return features;
  }

  /**
   * Create user feature vector from preferences
   */
  private createUserFeatureVector(userProfile: UserProfile): number[] {
    const vector: number[] = new Array(15).fill(0); // Adjust size based on extractItemFeatures
    
    // Encode user preferences into feature space
    for (const [prefKey, score] of Object.entries(userProfile.preferences)) {
      const [type, value] = prefKey.split(':');
      
      // Map preferences to feature vector indices
      if (type === 'destination_category') {
        const categoryMap: Record<string, number> = {
          beach: 3, mountain: 4, city: 5, cultural: 6, adventure: 7, 
          food: 8, nature: 9, luxury: 10
        };
        const index = categoryMap[value];
        if (index !== undefined) {
          vector[index] = Math.max(vector[index], score);
        }
      }
    }

    return vector;
  }

  /**
   * Create behavior vector from interactions
   */
  private createBehaviorVector(interactions: any[]): number[] {
    const vector = new Array(10).fill(0);
    
    // Interaction type frequencies
    const interactionCounts = interactions.reduce((acc, int) => {
      acc[int.interactionType] = (acc[int.interactionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const types = ['view', 'like', 'save', 'book', 'share', 'search', 'skip'];
    types.forEach((type, index) => {
      vector[index] = (interactionCounts[type] || 0) / interactions.length;
    });

    return vector;
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude ? dotProduct / magnitude : 0;
  }

  /**
   * Calculate category-based preference score
   */
  private calculateCategoryScore(item: RecommendationItem, userProfile: UserProfile): number {
    let score = 0;
    let matches = 0;

    for (const feature of item.features) {
      const prefKey = `destination_category:${feature}`;
      if (userProfile.preferences[prefKey]) {
        score += userProfile.preferences[prefKey];
        matches++;
      }
    }

    return matches > 0 ? score / matches : 0.5; // Default neutral score
  }

  /**
   * Calculate location preference score
   */
  private calculateLocationScore(
    itemLocation: { lat: number; lng: number; address: string },
    context: RecommendationContext
  ): number {
    if (!context.currentLocation) return 0.5;

    const distance = this.calculateDistance(
      context.currentLocation.lat,
      context.currentLocation.lng,
      itemLocation.lat,
      itemLocation.lng
    );

    // Score inversely proportional to distance (closer = better)
    return Math.max(0, 1 - distance / 100000); // 100km max distance for full score
  }

  /**
   * Calculate budget compatibility score
   */
  private calculateBudgetScore(
    itemPrice: { amount: number; currency: string },
    budget: { min: number; max: number; currency: string }
  ): number {
    if (itemPrice.currency !== budget.currency) return 0.5; // Currency mismatch

    if (itemPrice.amount >= budget.min && itemPrice.amount <= budget.max) {
      return 1.0; // Perfect fit
    }

    if (itemPrice.amount < budget.min) {
      return 0.8; // Under budget is good but not perfect
    }

    // Over budget - score decreases with distance
    const overBudget = itemPrice.amount - budget.max;
    const budgetRange = budget.max - budget.min;
    return Math.max(0, 1 - overBudget / budgetRange);
  }

  /**
   * Calculate user similarity
   */
  private calculateUserSimilarity(profile1: UserProfile, profile2: UserProfile): number {
    // Combine preference similarity and behavior similarity
    const prefSimilarity = this.calculatePreferenceSimilarity(profile1.preferences, profile2.preferences);
    const behaviorSimilarity = this.cosineSimilarity(profile1.behaviorVector, profile2.behaviorVector);
    
    return (prefSimilarity * 0.6) + (behaviorSimilarity * 0.4);
  }

  /**
   * Calculate preference similarity between users
   */
  private calculatePreferenceSimilarity(prefs1: Record<string, number>, prefs2: Record<string, number>): number {
    const allKeys = new Set([...Object.keys(prefs1), ...Object.keys(prefs2)]);
    if (allKeys.size === 0) return 0;

    let similarity = 0;
    let commonPrefs = 0;

    for (const key of allKeys) {
      const val1 = prefs1[key] || 0;
      const val2 = prefs2[key] || 0;
      
      if (val1 > 0 && val2 > 0) {
        similarity += Math.min(val1, val2) / Math.max(val1, val2);
        commonPrefs++;
      }
    }

    return commonPrefs > 0 ? similarity / commonPrefs : 0;
  }

  /**
   * Get interaction weight for scoring
   */
  private getInteractionWeight(interactionType: string): number {
    const weights: Record<string, number> = {
      view: 0.1,
      like: 0.8,
      dislike: -0.8,
      save: 0.9,
      book: 1.0,
      share: 0.7,
      skip: -0.3,
      search: 0.2
    };
    return weights[interactionType] || 0.1;
  }

  /**
   * Calculate confidence score for recommendations
   */
  private calculateConfidence(
    source: 'content_based' | 'collaborative' | 'hybrid',
    score: number,
    userProfile: UserProfile
  ): number {
    const baseConfidence = Math.min(0.9, score);
    
    // Adjust confidence based on user profile completeness
    const profileCompleteness = Object.keys(userProfile.preferences).length / 20;
    const historyRichness = Math.min(1, userProfile.interactionHistory.length / 50);
    
    const adjustedConfidence = baseConfidence * (0.5 + profileCompleteness * 0.3 + historyRichness * 0.2);
    
    return Math.max(0.1, Math.min(1.0, adjustedConfidence));
  }

  /**
   * Check if user has interacted with item
   */
  private hasUserInteractedWith(userProfile: UserProfile, itemId: string): boolean {
    return userProfile.interactionHistory.some(interaction => 
      interaction.itemId === itemId && 
      ['view', 'like', 'save', 'book'].includes(interaction.interactionType)
    );
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // ==================== HYBRID AND OPTIMIZATION METHODS ====================

  /**
   * Combine multiple recommendation sources using weighted approach
   */
  private combineRecommendations(sources: Array<{
    recommendations: ScoredRecommendation[];
    weight: number;
    source: 'content_based' | 'collaborative' | 'trending';
  }>): ScoredRecommendation[] {
    const combinedScores = new Map<string, ScoredRecommendation>();

    for (const { recommendations, weight, source } of sources) {
      for (const rec of recommendations) {
        const existing = combinedScores.get(rec.item.id);
        
        if (existing) {
          // Combine scores with weighted average
          const totalWeight = existing.score + (rec.score * weight);
          existing.score = totalWeight;
          existing.source = 'hybrid';
          existing.reasoning.factors.push(...rec.reasoning.factors.map(f => ({
            ...f,
            weight: f.weight * weight
          })));
        } else {
          combinedScores.set(rec.item.id, {
            ...rec,
            score: rec.score * weight,
            source: 'hybrid'
          });
        }
      }
    }

    return Array.from(combinedScores.values());
  }

  /**
   * Apply personalization boost based on user profile
   */
  private async applyPersonalizationBoost(
    recommendations: ScoredRecommendation[],
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<ScoredRecommendation[]> {
    return recommendations.map(rec => {
      let boostFactor = 1.0;

      // Boost based on user's historical preferences
      const personalizedScore = this.calculatePersonalizedScore(rec.item, userProfile);
      boostFactor *= (1 + personalizedScore * 0.2);

      // Boost based on context
      if (context.travelStyle && rec.item.features.includes(context.travelStyle)) {
        boostFactor *= 1.15;
      }

      return {
        ...rec,
        score: rec.score * boostFactor,
        source: 'personalized' as const
      };
    });
  }

  /**
   * Calculate personalized score boost
   */
  private calculatePersonalizedScore(item: RecommendationItem, userProfile: UserProfile): number {
    let score = 0;
    let factors = 0;

    // Check feature alignment with user preferences
    for (const feature of item.features) {
      const prefKeys = [
        `destination_category:${feature}`,
        `activity_type:${feature}`,
        `travel_style:${feature}`
      ];

      for (const key of prefKeys) {
        if (userProfile.preferences[key]) {
          score += userProfile.preferences[key];
          factors++;
        }
      }
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Apply diversity filter to avoid too similar recommendations
   */
  private applyDiversityFilter(
    recommendations: ScoredRecommendation[],
    diversityFactor: number
  ): ScoredRecommendation[] {
    if (diversityFactor === 0) return recommendations;

    const selected: ScoredRecommendation[] = [];
    const remaining = [...recommendations].sort((a, b) => b.score - a.score);

    while (remaining.length > 0 && selected.length < recommendations.length) {
      const next = remaining.shift()!;
      
      // Check diversity with already selected items
      const isDiverse = selected.every(sel => {
        const similarity = this.calculateItemSimilarity(next.item, sel.item);
        return similarity < (1 - diversityFactor);
      });

      if (isDiverse || selected.length === 0) {
        selected.push(next);
      }
    }

    return selected;
  }

  /**
   * Calculate similarity between two items
   */
  private calculateItemSimilarity(item1: RecommendationItem, item2: RecommendationItem): number {
    if (item1.type !== item2.type) return 0.2; // Different types are less similar

    const features1 = new Set(item1.features);
    const features2 = new Set(item2.features);
    const intersection = new Set([...features1].filter(f => features2.has(f)));
    const union = new Set([...features1, ...features2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Boost fresh content
   */
  private boostFreshContent(recommendations: ScoredRecommendation[]): ScoredRecommendation[] {
    const now = new Date();
    
    return recommendations.map(rec => {
      // Boost items that are recently added or trending
      const createdAt = new Date(rec.item.metadata.createdAt || now);
      const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      let boostFactor = 1.0;
      if (daysSinceCreation <= 7) {
        boostFactor = 1.1; // 10% boost for items created in last week
      } else if (daysSinceCreation <= 30) {
        boostFactor = 1.05; // 5% boost for items created in last month
      }

      return {
        ...rec,
        score: rec.score * boostFactor
      };
    });
  }

  /**
   * Generate explanation for recommendation
   */
  private generateExplanation(
    recommendation: ScoredRecommendation,
    userProfile: UserProfile,
    context: RecommendationContext
  ): RecommendationReasoning {
    const factors = [];

    // Analyze factors that contributed to the score
    if (recommendation.source === 'content_based' || recommendation.source === 'hybrid') {
      const matchingPrefs = this.findMatchingPreferences(recommendation.item, userProfile);
      for (const pref of matchingPrefs) {
        factors.push({
          factor: `preference_${pref.type}`,
          weight: 0.4,
          contribution: pref.score,
          explanation: `Matches your preference for ${pref.value}`
        });
      }
    }

    if (recommendation.source === 'collaborative' || recommendation.source === 'hybrid') {
      factors.push({
        factor: 'similar_users',
        weight: 0.4,
        contribution: recommendation.score * 0.4,
        explanation: 'Popular among users with similar preferences'
      });
    }

    if (recommendation.source === 'trending') {
      factors.push({
        factor: 'trending',
        weight: 0.2,
        contribution: recommendation.score * 0.2,
        explanation: 'Currently popular and trending'
      });
    }

    return {
      factors,
      personalizedFactors: this.extractPersonalizedFactors(recommendation.item, userProfile),
      contentSimilarity: this.calculateContentBasedScore(recommendation.item, userProfile, context)
    };
  }

  /**
   * Find matching preferences for explanation
   */
  private findMatchingPreferences(
    item: RecommendationItem,
    userProfile: UserProfile
  ): Array<{ type: string; value: string; score: number }> {
    const matches = [];

    for (const feature of item.features) {
      const prefKey = `destination_category:${feature}`;
      if (userProfile.preferences[prefKey]) {
        matches.push({
          type: 'destination_category',
          value: feature,
          score: userProfile.preferences[prefKey]
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  /**
   * Extract personalized factors for explanation
   */
  private extractPersonalizedFactors(item: RecommendationItem, userProfile: UserProfile): string[] {
    const factors = [];

    // Check for high-confidence preferences
    const highConfidencePrefs = Object.entries(userProfile.preferences)
      .filter(([_, score]) => score > 0.8)
      .map(([key, _]) => key.split(':')[1]);

    for (const feature of item.features) {
      if (highConfidencePrefs.includes(feature)) {
        factors.push(`Strong preference for ${feature}`);
      }
    }

    // Check for behavioral patterns
    const behaviorInsights = this.analyzeBehaviorForItem(item, userProfile);
    factors.push(...behaviorInsights);

    return factors.slice(0, 5);
  }

  /**
   * Analyze user behavior for specific item type
   */
  private analyzeBehaviorForItem(item: RecommendationItem, userProfile: UserProfile): string[] {
    const insights = [];
    const itemTypeInteractions = userProfile.interactionHistory
      .filter(h => h.itemType === item.type)
      .length;

    if (itemTypeInteractions > 5) {
      insights.push(`Frequently engages with ${item.type} content`);
    }

    return insights;
  }

  // ==================== CANDIDATE GENERATION ====================

  /**
   * Get candidate items for recommendation
   */
  private async getCandidateItems(
    context: RecommendationContext,
    geographicRadius: number
  ): Promise<RecommendationItem[]> {
    const candidates: RecommendationItem[] = [];

    try {
      // Get places/destinations
      const placesData = await withDatabase(async (db) => {
        if (!db) return [];
        
        if (context.currentLocation) {
          // Simplified location filtering without PostGIS for now
          return await db.select().from(places).where(
            and(
              sql`${places.latitude} IS NOT NULL`,
              sql`${places.longitude} IS NOT NULL`
            )
          ).limit(100);
        } else {
          return await db.select().from(places).limit(100);
        }
      });

      if (placesData && placesData.length > 0) {
        for (const place of placesData) {
          candidates.push({
            id: place.id,
            type: 'destination',
            title: place.name,
            description: place.description || '',
            imageUrl: place.photoUrl || undefined,
            price: place.priceLevel ? {
              amount: place.priceLevel * 25, // Convert 1-4 scale to approximate USD
              currency: 'USD'
            } : undefined,
            rating: place.rating ? parseFloat(place.rating.toString()) : undefined,
            reviewCount: 0,
            location: place.latitude && place.longitude ? {
              lat: parseFloat(place.latitude.toString()),
              lng: parseFloat(place.longitude.toString()),
              address: place.address || ''
            } : undefined,
            features: place.category ? [place.category] : [],
            metadata: {
              source: place.source,
              verified: place.verified,
              createdAt: place.createdAt
            }
          });
        }
      }

      // Get trips and itineraries
      const tripsData = await withDatabase(async (db) => {
        if (!db) return [];
        return await db
          .select()
          .from(trips)
          .where(eq(trips.status, 'generated'))
          .limit(50);
      });

      if (tripsData && tripsData.length > 0) {
        for (const trip of tripsData) {
          candidates.push({
            id: trip.id,
            type: 'trip',
            title: trip.title,
            description: '', // No description field in schema
            price: trip.budgetTotal ? {
              amount: trip.budgetTotal,
              currency: trip.budgetCurrency
            } : undefined,
            features: trip.tripType ? [trip.tripType] : [],
            metadata: {
              destinations: trip.destinations,
              startDate: trip.startDate,
              endDate: trip.endDate,
              createdAt: trip.createdAt
            }
          });
        }
      }

    } catch (error) {
      console.error('Error getting candidate items:', error);
    }

    return candidates;
  }

  // ==================== CACHING ====================

  /**
   * Cache recommendations for performance
   */
  private async cacheRecommendations(
    userId: string,
    recommendations: ScoredRecommendation[]
  ): Promise<void> {
    try {
      // Cache top recommendations in database with correct schema
      const topRecommendations = recommendations.slice(0, 10);
      const confidenceScores = topRecommendations.map(rec => rec.confidence);
      
      const cacheData = {
        userId,
        recommendationType: 'hybrid',
        contextHash: 'default', // Could hash actual context for better caching
        recommendations: topRecommendations.map(rec => ({
          id: rec.item.id,
          type: rec.item.type,
          title: rec.item.title,
          description: rec.item.description,
          score: rec.score,
          source: rec.source
        })),
        confidenceScores,
        generationAlgorithm: 'intelligent_hybrid_v1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      await withDatabase(async (db) => {
        if (!db) return;
        
        // Clear old recommendations
        await db
          .delete(personalizedRecommendations)
          .where(eq(personalizedRecommendations.userId, userId));

        // Insert new recommendations
        await db.insert(personalizedRecommendations).values(cacheData);
      });

    } catch (error) {
      console.error('Error caching recommendations:', error);
    }
  }
}

// ==================== SINGLETON EXPORT ====================

export const intelligentRecommendationEngine = new IntelligentRecommendationEngine();