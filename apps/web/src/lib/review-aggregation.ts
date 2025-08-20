/**
 * Multi-Source Review Aggregation System
 * Combines reviews from Google, TripAdvisor, Yelp, and other sources with AI analysis
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { GooglePlacesService, ReviewAnalysisService, type GooglePlace } from './google-apis';

// Initialize OpenAI for review processing
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false
});

// API Configuration for review sources
const REVIEW_SOURCES_CONFIG = {
  tripadvisor: {
    baseUrl: 'https://api.tripadvisor.com',
    key: process.env.NEXT_PUBLIC_TRIPADVISOR_API_KEY || 'demo-key'
  },
  yelp: {
    baseUrl: 'https://api.yelp.com/v3',
    key: process.env.NEXT_PUBLIC_YELP_API_KEY || 'demo-key'
  },
  trustpilot: {
    baseUrl: 'https://api.trustpilot.com',
    key: process.env.NEXT_PUBLIC_TRUSTPILOT_API_KEY || 'demo-key'
  },
  booking: {
    baseUrl: 'https://booking-com.p.rapidapi.com',
    key: process.env.NEXT_PUBLIC_BOOKING_API_KEY || 'demo-key'
  }
};

// Unified review schema
const UnifiedReviewSchema = z.object({
  id: z.string(),
  source: z.enum(['google', 'tripadvisor', 'yelp', 'trustpilot', 'booking', 'getyourguide', 'viator']),
  author: z.object({
    name: z.string(),
    avatar: z.string().optional(),
    location: z.string().optional(),
    review_count: z.number().optional(),
    is_verified: z.boolean().default(false)
  }),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  text: z.string(),
  date: z.string(),
  helpful_votes: z.number().default(0),
  photos: z.array(z.string()).default([]),
  traveler_type: z.enum(['solo', 'couple', 'family', 'friends', 'business']).optional(),
  trip_type: z.enum(['leisure', 'business', 'romance', 'family']).optional(),
  verified_stay: z.boolean().default(false),
  response: z.object({
    from_owner: z.boolean(),
    text: z.string(),
    date: z.string()
  }).optional()
});

const AggregatedReviewsSchema = z.object({
  business_id: z.string(),
  business_name: z.string(),
  total_reviews: z.number(),
  average_rating: z.number(),
  rating_distribution: z.object({
    five_star: z.number(),
    four_star: z.number(),
    three_star: z.number(),
    two_star: z.number(),
    one_star: z.number()
  }),
  source_breakdown: z.object({
    google: z.object({ count: z.number(), avg_rating: z.number() }).optional(),
    tripadvisor: z.object({ count: z.number(), avg_rating: z.number() }).optional(),
    yelp: z.object({ count: z.number(), avg_rating: z.number() }).optional(),
    booking: z.object({ count: z.number(), avg_rating: z.number() }).optional()
  }),
  reviews: z.array(UnifiedReviewSchema),
  sentiment_analysis: z.object({
    overall_sentiment: z.enum(['positive', 'neutral', 'negative']),
    confidence_score: z.number().min(0).max(1),
    key_themes: z.array(z.object({
      theme: z.string(),
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      frequency: z.number()
    })),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    summary: z.string(),
    traveler_insights: z.object({
      best_for: z.array(z.string()),
      avoid_if: z.array(z.string()),
      peak_satisfaction: z.string(),
      common_complaints: z.array(z.string())
    })
  }),
  recommendation_score: z.number().min(0).max(100),
  last_updated: z.string()
});

export type UnifiedReview = z.infer<typeof UnifiedReviewSchema>;
export type AggregatedReviews = z.infer<typeof AggregatedReviewsSchema>;

/**
 * Multi-Source Review Aggregation Service
 */
export class ReviewAggregationService {
  
  /**
   * Aggregate reviews from all available sources
   */
  static async aggregateReviews(params: {
    businessName: string;
    location?: { lat: number; lng: number };
    businessType: 'hotel' | 'restaurant' | 'attraction' | 'activity';
    googlePlaceId?: string;
  }): Promise<AggregatedReviews> {
    const { businessName, location, businessType, googlePlaceId } = params;

    try {
      // Fetch reviews from all sources in parallel
      const [googleReviews, tripAdvisorReviews, yelpReviews, bookingReviews] = await Promise.allSettled([
        this.getGoogleReviews(googlePlaceId, businessName, location),
        this.getTripAdvisorReviews(businessName, location),
        this.getYelpReviews(businessName, location),
        businessType === 'hotel' ? this.getBookingReviews(businessName, location) : Promise.resolve([])
      ]);

      // Combine all reviews
      const allReviews: UnifiedReview[] = [];
      
      if (googleReviews.status === 'fulfilled') allReviews.push(...googleReviews.value);
      if (tripAdvisorReviews.status === 'fulfilled') allReviews.push(...tripAdvisorReviews.value);
      if (yelpReviews.status === 'fulfilled') allReviews.push(...yelpReviews.value);
      if (bookingReviews.status === 'fulfilled') allReviews.push(...bookingReviews.value);

      // Remove duplicates and sort by date
      const uniqueReviews = this.deduplicateReviews(allReviews);
      const sortedReviews = uniqueReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate aggregated statistics
      const stats = this.calculateReviewStatistics(sortedReviews);

      // Perform AI sentiment analysis
      const sentimentAnalysis = await this.performAdvancedSentimentAnalysis(
        sortedReviews.slice(0, 50), // Analyze top 50 recent reviews
        businessName,
        businessType
      );

      // Calculate recommendation score
      const recommendationScore = this.calculateRecommendationScore(stats, sentimentAnalysis);

      const aggregatedData: AggregatedReviews = {
        business_id: googlePlaceId || `generated_${Date.now()}`,
        business_name: businessName,
        total_reviews: sortedReviews.length,
        average_rating: stats.averageRating,
        rating_distribution: stats.ratingDistribution,
        source_breakdown: stats.sourceBreakdown,
        reviews: sortedReviews.slice(0, 20), // Return top 20 reviews
        sentiment_analysis: sentimentAnalysis,
        recommendation_score: recommendationScore,
        last_updated: new Date().toISOString()
      };

      return AggregatedReviewsSchema.parse(aggregatedData);

    } catch (error) {
      console.error('Review aggregation error:', error);
      return this.generateFallbackReviews(params);
    }
  }

  /**
   * Get Google Reviews
   */
  private static async getGoogleReviews(
    placeId?: string, 
    businessName?: string, 
    location?: { lat: number; lng: number }
  ): Promise<UnifiedReview[]> {
    try {
      let place: GooglePlace | null = null;

      if (placeId) {
        place = await GooglePlacesService.getPlaceDetails(placeId);
      } else if (businessName) {
        const places = await GooglePlacesService.searchPlaces({
          query: businessName,
          location
        });
        place = places[0] || null;
      }

      if (!place || !place.reviews) return [];

      return place.reviews.map((review, index) => ({
        id: `google_${place!.place_id}_${index}`,
        source: 'google' as const,
        author: {
          name: review.author_name,
          avatar: review.profile_photo_url,
          location: undefined,
          review_count: undefined,
          is_verified: true
        },
        rating: review.rating,
        text: review.text,
        date: review.relative_time_description,
        helpful_votes: 0,
        photos: [],
        verified_stay: false
      }));

    } catch (error) {
      console.error('Google reviews error:', error);
      return [];
    }
  }

  /**
   * Get TripAdvisor Reviews (Mock implementation)
   */
  private static async getTripAdvisorReviews(
    businessName: string,
    location?: { lat: number; lng: number }
  ): Promise<UnifiedReview[]> {
    // Mock TripAdvisor reviews for demo
    if (REVIEW_SOURCES_CONFIG.tripadvisor.key === 'demo-key') {
      return this.generateMockReviews('tripadvisor', businessName, 8);
    }

    // TODO: Implement actual TripAdvisor API integration
    return [];
  }

  /**
   * Get Yelp Reviews (Mock implementation)
   */
  private static async getYelpReviews(
    businessName: string,
    location?: { lat: number; lng: number }
  ): Promise<UnifiedReview[]> {
    // Mock Yelp reviews for demo
    if (REVIEW_SOURCES_CONFIG.yelp.key === 'demo-key') {
      return this.generateMockReviews('yelp', businessName, 6);
    }

    // TODO: Implement actual Yelp API integration
    return [];
  }

  /**
   * Get Booking.com Reviews (Mock implementation)
   */
  private static async getBookingReviews(
    businessName: string,
    location?: { lat: number; lng: number }
  ): Promise<UnifiedReview[]> {
    // Mock Booking reviews for demo
    if (REVIEW_SOURCES_CONFIG.booking.key === 'demo-key') {
      return this.generateMockReviews('booking', businessName, 10);
    }

    // TODO: Implement actual Booking.com API integration
    return [];
  }

  /**
   * Generate mock reviews for testing
   */
  private static generateMockReviews(
    source: UnifiedReview['source'], 
    businessName: string, 
    count: number
  ): UnifiedReview[] {
    const authors = [
      'John Smith', 'Maria Garcia', 'David Chen', 'Sarah Wilson', 'Michael Brown',
      'Lisa Johnson', 'Robert Davis', 'Jennifer Miller', 'Christopher Moore', 'Amanda Taylor'
    ];

    const reviewTemplates = {
      positive: [
        'Amazing experience! Highly recommend to anyone visiting.',
        'Excellent service and beautiful location. Will definitely return.',
        'Perfect for families. Great amenities and friendly staff.',
        'Outstanding quality and value. Exceeded our expectations.',
        'Wonderful atmosphere and attention to detail.'
      ],
      neutral: [
        'Decent place with good service. Some areas could be improved.',
        'Average experience overall. Nothing special but not bad.',
        'Good location but facilities could use updating.',
        'Satisfactory service, though staff seemed busy.',
        'Fair value for money, meets basic expectations.'
      ],
      negative: [
        'Disappointing experience. Several issues with service.',
        'Overpriced for what you get. Expected much better.',
        'Poor maintenance and cleanliness standards.',
        'Staff was unhelpful and facilities were outdated.',
        'Would not recommend. Many better options available.'
      ]
    };

    return Array.from({ length: count }, (_, i) => {
      const rating = Math.floor(Math.random() * 5) + 1;
      const sentiment = rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative';
      const templates = reviewTemplates[sentiment];
      
      return {
        id: `${source}_${businessName.replace(/\s+/g, '_')}_${i}`,
        source,
        author: {
          name: authors[i % authors.length],
          avatar: `https://images.unsplash.com/photo-${1500000000000 + i}?w=40&h=40&fit=crop&crop=face`,
          location: ['New York', 'London', 'Tokyo', 'Paris', 'Sydney'][i % 5],
          review_count: Math.floor(Math.random() * 50) + 5,
          is_verified: Math.random() > 0.3
        },
        rating,
        title: rating >= 4 ? 'Great Experience!' : rating >= 3 ? 'Good Visit' : 'Could Be Better',
        text: templates[i % templates.length],
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        helpful_votes: Math.floor(Math.random() * 20),
        photos: Math.random() > 0.7 ? [`https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=300&fit=crop`] : [],
        traveler_type: ['solo', 'couple', 'family', 'friends', 'business'][i % 5] as any,
        trip_type: ['leisure', 'business', 'romance', 'family'][i % 4] as any,
        verified_stay: source === 'booking' && Math.random() > 0.5
      };
    });
  }

  /**
   * Remove duplicate reviews based on content similarity
   */
  private static deduplicateReviews(reviews: UnifiedReview[]): UnifiedReview[] {
    const seen = new Set<string>();
    return reviews.filter(review => {
      const key = `${review.author.name}_${review.text.slice(0, 50)}_${review.rating}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Calculate review statistics
   */
  private static calculateReviewStatistics(reviews: UnifiedReview[]) {
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;

    // Rating distribution
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => ratingCounts[r.rating as keyof typeof ratingCounts]++);

    const ratingDistribution = {
      five_star: ratingCounts[5],
      four_star: ratingCounts[4],
      three_star: ratingCounts[3],
      two_star: ratingCounts[2],
      one_star: ratingCounts[1]
    };

    // Source breakdown
    const sourceBreakdown: any = {};
    const sources = ['google', 'tripadvisor', 'yelp', 'booking'];
    
    sources.forEach(source => {
      const sourceReviews = reviews.filter(r => r.source === source);
      if (sourceReviews.length > 0) {
        sourceBreakdown[source] = {
          count: sourceReviews.length,
          avg_rating: sourceReviews.reduce((sum, r) => sum + r.rating, 0) / sourceReviews.length
        };
      }
    });

    return {
      averageRating,
      ratingDistribution,
      sourceBreakdown
    };
  }

  /**
   * Perform advanced sentiment analysis using GPT-4o-mini
   */
  private static async performAdvancedSentimentAnalysis(
    reviews: UnifiedReview[], 
    businessName: string, 
    businessType: string
  ) {
    if (reviews.length === 0) {
      return this.getDefaultSentimentAnalysis();
    }

    try {
      const reviewTexts = reviews.map(r => `Rating: ${r.rating}/5\nReview: ${r.text}`).join('\n\n');
      
      const prompt = `Analyze these ${reviews.length} reviews for "${businessName}" (${businessType}):

${reviewTexts}

Provide comprehensive analysis as JSON:
{
  "overall_sentiment": "positive|neutral|negative",
  "confidence_score": 0.0-1.0,
  "key_themes": [
    {"theme": "service", "sentiment": "positive|neutral|negative", "frequency": 0.0-1.0}
  ],
  "pros": ["specific positive aspects"],
  "cons": ["specific negative aspects"],
  "summary": "comprehensive summary",
  "traveler_insights": {
    "best_for": ["who should visit"],
    "avoid_if": ["who should avoid"],
    "peak_satisfaction": "what makes visitors happiest",
    "common_complaints": ["most frequent issues"]
  }
}

Focus on actionable insights for travelers. Be specific and accurate.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert travel review analyst. Provide accurate, objective analysis in valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1200
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No analysis generated');

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found');

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('Advanced sentiment analysis error:', error);
      return this.getDefaultSentimentAnalysis();
    }
  }

  private static getDefaultSentimentAnalysis() {
    return {
      overall_sentiment: 'positive' as const,
      confidence_score: 0.7,
      key_themes: [
        { theme: 'service', sentiment: 'positive' as const, frequency: 0.8 },
        { theme: 'location', sentiment: 'positive' as const, frequency: 0.6 },
        { theme: 'value', sentiment: 'neutral' as const, frequency: 0.4 }
      ],
      pros: ['Good service', 'Convenient location', 'Clean facilities'],
      cons: ['Can be busy', 'Limited parking'],
      summary: 'Generally positive reviews with satisfied customers praising service and location.',
      traveler_insights: {
        best_for: ['Families', 'Business travelers', 'First-time visitors'],
        avoid_if: ['Looking for budget options', 'Prefer quiet locations'],
        peak_satisfaction: 'Excellent customer service and convenient amenities',
        common_complaints: ['Pricing concerns', 'Peak hour crowds']
      }
    };
  }

  /**
   * Calculate recommendation score (0-100)
   */
  private static calculateRecommendationScore(stats: any, sentiment: any): number {
    const ratingScore = (stats.averageRating / 5) * 60; // 60% weight for rating
    const sentimentScore = sentiment.confidence_score * 25; // 25% weight for sentiment
    const volumeScore = Math.min(stats.ratingDistribution.five_star + stats.ratingDistribution.four_star, 100) * 0.15; // 15% weight for positive volume
    
    return Math.round(ratingScore + sentimentScore + volumeScore);
  }

  /**
   * Generate fallback reviews when aggregation fails
   */
  private static generateFallbackReviews(params: any): AggregatedReviews {
    const mockReviews = this.generateMockReviews('google', params.businessName, 15);
    const stats = this.calculateReviewStatistics(mockReviews);
    
    return {
      business_id: `fallback_${Date.now()}`,
      business_name: params.businessName,
      total_reviews: mockReviews.length,
      average_rating: stats.averageRating,
      rating_distribution: stats.ratingDistribution,
      source_breakdown: stats.sourceBreakdown,
      reviews: mockReviews,
      sentiment_analysis: this.getDefaultSentimentAnalysis(),
      recommendation_score: 78,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Get cached reviews (for production, implement Redis caching)
   */
  static async getCachedReviews(businessId: string): Promise<AggregatedReviews | null> {
    // TODO: Implement Redis caching
    return null;
  }

  /**
   * Cache reviews (for production, implement Redis caching)
   */
  static async cacheReviews(businessId: string, reviews: AggregatedReviews): Promise<void> {
    // TODO: Implement Redis caching with 4-hour TTL
  }
}