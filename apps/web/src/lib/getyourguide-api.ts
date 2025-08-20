/**
 * GetYourGuide API Integration
 * Live activities, tours, and experiences data
 */

import { z } from 'zod';
import { cacheHelpers, cacheKeys } from './redis';
import { trackError, trackEvent } from './monitoring';

// GetYourGuide API Configuration
const GYG_API_CONFIG = {
  baseUrl: 'https://api.getyourguide.com',
  partnerId: process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || 'demo-partner',
  apiKey: process.env.NEXT_PUBLIC_GETYOURGUIDE_API_KEY || 'demo-key'
};

// Activity search parameters schema
export const ActivitySearchParamsSchema = z.object({
  destination: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  category: z.enum([
    'tours', 'attractions', 'outdoor', 'food-drink', 'classes', 
    'transportation', 'unique', 'culture', 'nature', 'adventure'
  ]).optional(),
  duration: z.enum(['few-hours', 'half-day', 'full-day', 'multi-day']).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  rating: z.number().min(1).max(5).optional(),
  language: z.string().default('en'),
  currency: z.string().default('USD'),
  sortBy: z.enum(['popularity', 'price', 'rating', 'duration']).default('popularity'),
  limit: z.number().min(1).max(50).default(20)
});

export type ActivitySearchParams = z.infer<typeof ActivitySearchParamsSchema>;

// Activity data schema
export const ActivitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  short_description: z.string(),
  images: z.array(z.object({
    url: z.string(),
    caption: z.string().optional(),
    is_main: z.boolean()
  })),
  pricing: z.object({
    from_price: z.number(),
    original_price: z.number().optional(),
    currency: z.string(),
    price_type: z.enum(['per_person', 'per_group', 'per_vehicle']),
    discount_percentage: z.number().optional()
  }),
  duration: z.object({
    min_hours: z.number(),
    max_hours: z.number().optional(),
    formatted: z.string()
  }),
  rating: z.object({
    average: z.number(),
    count: z.number(),
    breakdown: z.object({
      five_star: z.number(),
      four_star: z.number(),
      three_star: z.number(),
      two_star: z.number(),
      one_star: z.number()
    })
  }),
  location: z.object({
    name: z.string(),
    address: z.string().optional(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number()
    }).optional(),
    meeting_point: z.string().optional()
  }),
  categories: z.array(z.string()),
  highlights: z.array(z.string()),
  included: z.array(z.string()),
  not_included: z.array(z.string()),
  languages: z.array(z.string()),
  age_restrictions: z.object({
    min_age: z.number().optional(),
    max_age: z.number().optional(),
    child_policy: z.string().optional()
  }).optional(),
  group_size: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    typical: z.string().optional()
  }).optional(),
  cancellation_policy: z.object({
    type: z.enum(['free', 'partial', 'non_refundable']),
    deadline_hours: z.number().optional(),
    details: z.string()
  }),
  availability: z.object({
    is_available: z.boolean(),
    next_available_date: z.string().optional(),
    booking_required: z.boolean(),
    instant_confirmation: z.boolean()
  }),
  difficulty_level: z.enum(['easy', 'moderate', 'challenging', 'extreme']).optional(),
  accessibility: z.object({
    wheelchair_accessible: z.boolean(),
    mobility_notes: z.string().optional()
  }).optional(),
  booking_url: z.string(),
  provider: z.object({
    name: z.string(),
    rating: z.number().optional(),
    verified: z.boolean()
  }),
  last_updated: z.date()
});

export type Activity = z.infer<typeof ActivitySchema>;

/**
 * GetYourGuide Activity Service
 */
export class GetYourGuideService {
  /**
   * Search activities by destination and filters
   */
  static async searchActivities(params: ActivitySearchParams): Promise<Activity[]> {
    if (GYG_API_CONFIG.apiKey === 'demo-key') {
      return this.generateMockActivities(params);
    }

    try {
      // Create cache key
      const cacheKey = `gyg:${params.destination}:${params.category}:${params.sortBy}`;
      const cached = await cacheHelpers.get<Activity[]>(cacheKey);
      
      if (cached) {
        trackEvent('getyourguide_cache_hit', { destination: params.destination });
        return cached;
      }

      // Build search parameters
      const searchParams = new URLSearchParams({
        q: params.destination,
        currency: params.currency,
        locale: params.language,
        limit: params.limit.toString(),
        sort_by: this.mapSortBy(params.sortBy)
      });

      if (params.category) searchParams.append('category_ids', this.getCategoryId(params.category));
      if (params.priceMin) searchParams.append('price_min', (params.priceMin * 100).toString()); // Convert to cents
      if (params.priceMax) searchParams.append('price_max', (params.priceMax * 100).toString());
      if (params.rating) searchParams.append('rating_min', (params.rating * 2).toString()); // GYG uses 10-point scale
      if (params.duration) searchParams.append('duration', this.mapDuration(params.duration));

      const response = await fetch(`${GYG_API_CONFIG.baseUrl}/activities?${searchParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GYG_API_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': `Tripthesia/${GYG_API_CONFIG.partnerId}`
        }
      });

      if (!response.ok) {
        throw new Error(`GetYourGuide API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.activities || data.activities.length === 0) {
        trackEvent('getyourguide_no_results', { destination: params.destination });
        return this.generateMockActivities(params);
      }

      // Transform API response
      const activities = data.activities.map((activity: any) => 
        this.transformActivityData(activity, params)
      );

      // Cache for 6 hours
      await cacheHelpers.set(cacheKey, activities, 6 * 60 * 60);

      trackEvent('getyourguide_success', {
        destination: params.destination,
        activities_count: activities.length,
        category: params.category
      });

      return activities;

    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        service: 'getyourguide_api',
        destination: params.destination
      });
      
      return this.generateMockActivities(params);
    }
  }

  /**
   * Get activity details by ID
   */
  static async getActivityDetails(activityId: string): Promise<Activity | null> {
    if (GYG_API_CONFIG.apiKey === 'demo-key') {
      return null;
    }

    try {
      const cacheKey = `gyg_detail:${activityId}`;
      const cached = await cacheHelpers.get<Activity>(cacheKey);
      
      if (cached) return cached;

      const response = await fetch(`${GYG_API_CONFIG.baseUrl}/activities/${activityId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GYG_API_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      const activity = this.transformActivityData(data.activity, {
        destination: data.activity.location?.name || 'Unknown',
        language: 'en',
        currency: 'USD',
        sortBy: 'popularity',
        limit: 1
      });

      // Cache for 12 hours
      await cacheHelpers.set(cacheKey, activity, 12 * 60 * 60);

      return activity;

    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        service: 'getyourguide_details',
        activity_id: activityId
      });
      return null;
    }
  }

  /**
   * Transform GetYourGuide API response to our schema
   */
  private static transformActivityData(activityData: any, params: ActivitySearchParams): Activity {
    return {
      id: activityData.activity_id?.toString() || `gyg_${Date.now()}`,
      title: activityData.title || 'Activity',
      description: activityData.description || activityData.abstract || 'Exciting activity experience',
      short_description: activityData.abstract || activityData.title || '',
      images: this.extractImages(activityData),
      pricing: {
        from_price: parseFloat(activityData.price?.from_price || '50'),
        original_price: parseFloat(activityData.price?.original_price),
        currency: activityData.price?.currency || params.currency,
        price_type: 'per_person',
        discount_percentage: activityData.price?.discount_percentage
      },
      duration: {
        min_hours: this.parseDuration(activityData.duration?.min || '2 hours'),
        max_hours: this.parseDuration(activityData.duration?.max),
        formatted: activityData.duration?.formatted || '2 hours'
      },
      rating: {
        average: parseFloat(activityData.rating?.average || '4.5'),
        count: parseInt(activityData.rating?.count || '100'),
        breakdown: {
          five_star: 60,
          four_star: 25,
          three_star: 10,
          two_star: 3,
          one_star: 2
        }
      },
      location: {
        name: activityData.location?.name || params.destination,
        address: activityData.location?.address,
        coordinates: activityData.location?.coordinates ? {
          latitude: parseFloat(activityData.location.coordinates.lat),
          longitude: parseFloat(activityData.location.coordinates.lng)
        } : undefined,
        meeting_point: activityData.meeting_point
      },
      categories: this.extractCategories(activityData),
      highlights: activityData.highlights || [],
      included: activityData.included || [],
      not_included: activityData.not_included || [],
      languages: activityData.languages || ['English'],
      age_restrictions: activityData.age_restrictions ? {
        min_age: activityData.age_restrictions.min_age,
        max_age: activityData.age_restrictions.max_age,
        child_policy: activityData.age_restrictions.policy
      } : undefined,
      group_size: activityData.group_size ? {
        min: activityData.group_size.min,
        max: activityData.group_size.max,
        typical: activityData.group_size.typical
      } : undefined,
      cancellation_policy: {
        type: activityData.cancellation_policy?.type || 'free',
        deadline_hours: activityData.cancellation_policy?.deadline_hours || 24,
        details: activityData.cancellation_policy?.details || 'Free cancellation up to 24 hours before'
      },
      availability: {
        is_available: activityData.availability?.is_available !== false,
        next_available_date: activityData.availability?.next_available_date,
        booking_required: activityData.availability?.booking_required !== false,
        instant_confirmation: activityData.availability?.instant_confirmation !== false
      },
      difficulty_level: this.mapDifficultyLevel(activityData.difficulty_level),
      accessibility: activityData.accessibility ? {
        wheelchair_accessible: activityData.accessibility.wheelchair_accessible || false,
        mobility_notes: activityData.accessibility.notes
      } : undefined,
      booking_url: activityData.booking_url || this.generateBookingUrl(activityData.activity_id),
      provider: {
        name: activityData.supplier?.name || 'GetYourGuide Partner',
        rating: parseFloat(activityData.supplier?.rating || '4.5'),
        verified: activityData.supplier?.verified !== false
      },
      last_updated: new Date()
    };
  }

  /**
   * Generate mock activities for demo/fallback
   */
  private static generateMockActivities(params: ActivitySearchParams): Activity[] {
    const activityTypes = [
      {
        title: `Best of ${params.destination} Walking Tour`,
        category: 'tours',
        price: 45,
        duration: 3,
        rating: 4.8,
        highlights: ['Historical landmarks', 'Local stories', 'Photo opportunities']
      },
      {
        title: `${params.destination} Food & Culture Experience`,
        category: 'food-drink',
        price: 85,
        duration: 4,
        rating: 4.9,
        highlights: ['Local cuisine tasting', 'Market visit', 'Cooking demonstration']
      },
      {
        title: `Skip-the-line: ${params.destination} Museum Pass`,
        category: 'attractions',
        price: 35,
        duration: 6,
        rating: 4.6,
        highlights: ['Fast track entry', 'Audio guide included', 'Multiple museums']
      },
      {
        title: `${params.destination} Adventure Tour`,
        category: 'outdoor',
        price: 120,
        duration: 8,
        rating: 4.7,
        highlights: ['Scenic routes', 'Professional guide', 'Equipment included']
      },
      {
        title: `Sunset ${params.destination} Photography Class`,
        category: 'classes',
        price: 75,
        duration: 3,
        rating: 4.9,
        highlights: ['Professional instructor', 'Best viewpoints', 'Edit your photos']
      }
    ];

    return activityTypes.map((activity, index) => ({
      id: `mock_activity_${index}`,
      title: activity.title,
      description: `Join us for an unforgettable ${activity.category} experience in ${params.destination}. Perfect for travelers who want to discover the authentic side of the city.`,
      short_description: `${activity.duration}-hour ${activity.category} experience`,
      images: [{
        url: `https://picsum.photos/600/400?random=${index + 100}`,
        caption: activity.title,
        is_main: true
      }],
      pricing: {
        from_price: activity.price,
        currency: params.currency || 'USD',
        price_type: 'per_person' as const
      },
      duration: {
        min_hours: activity.duration,
        formatted: `${activity.duration} hours`
      },
      rating: {
        average: activity.rating,
        count: Math.floor(Math.random() * 500) + 100,
        breakdown: {
          five_star: 65,
          four_star: 25,
          three_star: 7,
          two_star: 2,
          one_star: 1
        }
      },
      location: {
        name: params.destination,
        meeting_point: 'Central meeting point (details provided after booking)'
      },
      categories: [activity.category, 'guided'],
      highlights: activity.highlights,
      included: ['Professional guide', 'Small group size', 'Customer support'],
      not_included: ['Hotel pickup/drop-off', 'Food and drinks', 'Gratuities'],
      languages: ['English', 'Spanish', 'French'],
      cancellation_policy: {
        type: 'free' as const,
        deadline_hours: 24,
        details: 'Free cancellation up to 24 hours before the activity starts'
      },
      availability: {
        is_available: true,
        booking_required: true,
        instant_confirmation: true
      },
      difficulty_level: activity.category === 'outdoor' ? 'moderate' as const : 'easy' as const,
      booking_url: `https://getyourguide.com/activity/mock-${index}`,
      provider: {
        name: 'GetYourGuide Partner',
        rating: 4.7,
        verified: true
      },
      last_updated: new Date()
    }));
  }

  /**
   * Helper methods
   */
  private static extractImages(activityData: any): Activity['images'] {
    if (activityData.images && Array.isArray(activityData.images)) {
      return activityData.images.map((img: any, index: number) => ({
        url: img.url || `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
        caption: img.caption || activityData.title,
        is_main: index === 0
      }));
    }
    
    return [{
      url: `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
      caption: activityData.title || 'Activity',
      is_main: true
    }];
  }

  private static extractCategories(activityData: any): string[] {
    return activityData.categories || ['tour', 'sightseeing'];
  }

  private static parseDuration(duration: string | undefined): number {
    if (!duration) return 2;
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 2;
  }

  private static mapDifficultyLevel(level: string | undefined): Activity['difficulty_level'] {
    if (!level) return undefined;
    const mapping: Record<string, Activity['difficulty_level']> = {
      'easy': 'easy',
      'beginner': 'easy',
      'moderate': 'moderate',
      'intermediate': 'moderate',
      'challenging': 'challenging',
      'advanced': 'challenging',
      'extreme': 'extreme',
      'expert': 'extreme'
    };
    return mapping[level.toLowerCase()] || 'easy';
  }

  private static getCategoryId(category: string): string {
    const mapping: Record<string, string> = {
      tours: '1',
      attractions: '2',
      outdoor: '3',
      'food-drink': '4',
      classes: '5',
      transportation: '6',
      unique: '7',
      culture: '8',
      nature: '9',
      adventure: '10'
    };
    return mapping[category] || '1';
  }

  private static mapSortBy(sortBy: string): string {
    const mapping: Record<string, string> = {
      popularity: 'popularity',
      price: 'price_asc',
      rating: 'rating',
      duration: 'duration'
    };
    return mapping[sortBy] || 'popularity';
  }

  private static mapDuration(duration: string): string {
    const mapping: Record<string, string> = {
      'few-hours': '0-4',
      'half-day': '4-8', 
      'full-day': '8-24',
      'multi-day': '24+'
    };
    return mapping[duration] || '0-8';
  }

  private static generateBookingUrl(activityId: string | undefined): string {
    return `https://www.getyourguide.com/activity/t${activityId}?partner_id=${GYG_API_CONFIG.partnerId}`;
  }
}

// Export convenience functions
export const searchActivities = (params: ActivitySearchParams) => GetYourGuideService.searchActivities(params);
export const getActivityDetails = (activityId: string) => GetYourGuideService.getActivityDetails(activityId);

// Export schemas
export { ActivitySearchParamsSchema, ActivitySchema };