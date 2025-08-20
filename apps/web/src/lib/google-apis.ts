/**
 * Google APIs Integration Layer
 * Provides Google Places, Maps, and Reviews data for enhanced travel planning
 */

import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI for review analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false
});

// Google API Configuration
const GOOGLE_CONFIG = {
  places: {
    baseUrl: 'https://maps.googleapis.com/maps/api/place',
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key',
    endpoints: {
      search: '/textsearch/json',
      details: '/details/json',
      photos: '/photo',
      nearby: '/nearbysearch/json',
      autocomplete: '/autocomplete/json'
    }
  },
  geocoding: {
    baseUrl: 'https://maps.googleapis.com/maps/api/geocode',
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key'
  },
  directions: {
    baseUrl: 'https://maps.googleapis.com/maps/api/directions',
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key'
  },
  streetview: {
    baseUrl: 'https://maps.googleapis.com/maps/api/streetview',
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key'
  }
};

// Validation Schemas
const GooglePlaceSchema = z.object({
  place_id: z.string(),
  name: z.string(),
  formatted_address: z.string(),
  geometry: z.object({
    location: z.object({
      lat: z.number(),
      lng: z.number()
    })
  }),
  rating: z.number().optional(),
  user_ratings_total: z.number().optional(),
  price_level: z.number().optional(),
  types: z.array(z.string()),
  photos: z.array(z.object({
    photo_reference: z.string(),
    height: z.number(),
    width: z.number()
  })).optional(),
  reviews: z.array(z.object({
    author_name: z.string(),
    author_url: z.string().optional(),
    language: z.string(),
    profile_photo_url: z.string().optional(),
    rating: z.number(),
    relative_time_description: z.string(),
    text: z.string(),
    time: z.number()
  })).optional(),
  opening_hours: z.object({
    open_now: z.boolean().optional(),
    weekday_text: z.array(z.string()).optional()
  }).optional(),
  formatted_phone_number: z.string().optional(),
  website: z.string().optional()
});

export type GooglePlace = z.infer<typeof GooglePlaceSchema>;

const ReviewSentimentSchema = z.object({
  overall_sentiment: z.enum(['positive', 'neutral', 'negative']),
  sentiment_score: z.number().min(0).max(1),
  key_themes: z.array(z.string()),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  summary: z.string(),
  recommendation: z.string()
});

export type ReviewSentiment = z.infer<typeof ReviewSentimentSchema>;

/**
 * Google Places API Service
 */
export class GooglePlacesService {
  private static apiKey = GOOGLE_CONFIG.places.key;

  static async searchPlaces(params: {
    query: string;
    location?: { lat: number; lng: number };
    radius?: number;
    type?: string;
    minRating?: number;
    priceLevel?: number[];
    openNow?: boolean;
  }): Promise<GooglePlace[]> {
    const { query, location, radius = 50000, type, minRating, priceLevel, openNow } = params;

    if (this.apiKey === 'demo-key') {
      return this.generateMockPlaces(params);
    }

    try {
      const searchParams = new URLSearchParams({
        query,
        key: this.apiKey,
        ...(location && { location: `${location.lat},${location.lng}` }),
        ...(radius && { radius: radius.toString() }),
        ...(type && { type }),
        ...(minRating && { minrating: minRating.toString() }),
        ...(openNow && { opennow: 'true' })
      });

      if (priceLevel && priceLevel.length > 0) {
        searchParams.append('minprice', Math.min(...priceLevel).toString());
        searchParams.append('maxprice', Math.max(...priceLevel).toString());
      }

      const response = await fetch(
        `${GOOGLE_CONFIG.places.baseUrl}${GOOGLE_CONFIG.places.endpoints.search}?${searchParams}`
      );

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google Places API status: ${data.status}`);
      }

      return data.results.map((place: any) => GooglePlaceSchema.parse(place));

    } catch (error) {
      console.error('Google Places search error:', error);
      return this.generateMockPlaces(params);
    }
  }

  static async getPlaceDetails(placeId: string, fields?: string[]): Promise<GooglePlace | null> {
    if (this.apiKey === 'demo-key') {
      return this.generateMockPlaceDetails(placeId);
    }

    try {
      const defaultFields = [
        'place_id', 'name', 'formatted_address', 'geometry', 'rating', 
        'user_ratings_total', 'price_level', 'types', 'photos', 'reviews',
        'opening_hours', 'formatted_phone_number', 'website'
      ];

      const searchParams = new URLSearchParams({
        place_id: placeId,
        fields: (fields || defaultFields).join(','),
        key: this.apiKey
      });

      const response = await fetch(
        `${GOOGLE_CONFIG.places.baseUrl}${GOOGLE_CONFIG.places.endpoints.details}?${searchParams}`
      );

      if (!response.ok) {
        throw new Error(`Google Places Details API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Places Details API status: ${data.status}`);
      }

      return GooglePlaceSchema.parse(data.result);

    } catch (error) {
      console.error('Google Places details error:', error);
      return this.generateMockPlaceDetails(placeId);
    }
  }

  static async getNearbyPlaces(params: {
    location: { lat: number; lng: number };
    radius?: number;
    type?: string;
    keyword?: string;
    minRating?: number;
    maxResults?: number;
  }): Promise<GooglePlace[]> {
    const { location, radius = 5000, type, keyword, minRating, maxResults = 20 } = params;

    if (this.apiKey === 'demo-key') {
      return this.generateMockPlaces({ query: keyword || type || 'places', location });
    }

    try {
      const searchParams = new URLSearchParams({
        location: `${location.lat},${location.lng}`,
        radius: radius.toString(),
        key: this.apiKey,
        ...(type && { type }),
        ...(keyword && { keyword }),
        ...(minRating && { minrating: minRating.toString() })
      });

      const response = await fetch(
        `${GOOGLE_CONFIG.places.baseUrl}${GOOGLE_CONFIG.places.endpoints.nearby}?${searchParams}`
      );

      if (!response.ok) {
        throw new Error(`Google Places Nearby API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Places Nearby API status: ${data.status}`);
      }

      const places = data.results.slice(0, maxResults);
      return places.map((place: any) => GooglePlaceSchema.parse(place));

    } catch (error) {
      console.error('Google Places nearby search error:', error);
      return this.generateMockPlaces({ query: keyword || type || 'places', location });
    }
  }

  static getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    if (this.apiKey === 'demo-key') {
      return `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=${maxWidth}&h=${Math.floor(maxWidth * 0.75)}&fit=crop`;
    }

    return `${GOOGLE_CONFIG.places.baseUrl}${GOOGLE_CONFIG.places.endpoints.photos}?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }

  private static generateMockPlaces(params: any): GooglePlace[] {
    const isHotel = params.query?.toLowerCase().includes('hotel') || params.type === 'lodging';
    const isRestaurant = params.query?.toLowerCase().includes('restaurant') || params.type === 'restaurant';
    const isAttraction = params.query?.toLowerCase().includes('attraction') || params.type === 'tourist_attraction';

    const names = isHotel 
      ? ['Grand Palace Hotel', 'Boutique Resort & Spa', 'Ocean View Lodge', 'City Center Inn', 'Luxury Beach Resort']
      : isRestaurant
      ? ['Local Flavors Restaurant', 'Seaside Bistro', 'Traditional Kitchen', 'Rooftop Dining', 'Street Food Corner']
      : ['Historic Monument', 'Art Gallery', 'Cultural Center', 'Scenic Viewpoint', 'Local Market'];

    const types = isHotel
      ? [['lodging', 'establishment']]
      : isRestaurant 
      ? [['restaurant', 'food', 'establishment']]
      : [['tourist_attraction', 'establishment', 'point_of_interest']];

    return Array.from({ length: Math.min(params.maxResults || 10, 15) }, (_, i) => ({
      place_id: `ChIJ${Math.random().toString(36).substr(2, 27)}`,
      name: names[i % names.length],
      formatted_address: `${Math.floor(Math.random() * 999)} Street Name, City, State`,
      geometry: {
        location: {
          lat: (params.location?.lat || 15.2993) + (Math.random() - 0.5) * 0.1,
          lng: (params.location?.lng || 74.1240) + (Math.random() - 0.5) * 0.1
        }
      },
      rating: 3.5 + Math.random() * 1.5,
      user_ratings_total: Math.floor(Math.random() * 1000) + 50,
      price_level: Math.floor(Math.random() * 4) + 1,
      types: types[0],
      photos: [
        {
          photo_reference: `photo_ref_${i}`,
          height: 400,
          width: 600
        }
      ],
      reviews: this.generateMockReviews(),
      opening_hours: {
        open_now: Math.random() > 0.3,
        weekday_text: [
          'Monday: 9:00 AM – 6:00 PM',
          'Tuesday: 9:00 AM – 6:00 PM',
          'Wednesday: 9:00 AM – 6:00 PM',
          'Thursday: 9:00 AM – 6:00 PM',
          'Friday: 9:00 AM – 9:00 PM',
          'Saturday: 10:00 AM – 9:00 PM',
          'Sunday: 10:00 AM – 6:00 PM'
        ]
      },
      formatted_phone_number: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      website: `https://example-business-${i}.com`
    }));
  }

  private static generateMockPlaceDetails(placeId: string): GooglePlace {
    return {
      place_id: placeId,
      name: 'Sample Business',
      formatted_address: '123 Main Street, City, State',
      geometry: {
        location: {
          lat: 15.2993,
          lng: 74.1240
        }
      },
      rating: 4.2,
      user_ratings_total: 157,
      price_level: 2,
      types: ['restaurant', 'food', 'establishment'],
      photos: [
        {
          photo_reference: 'sample_photo_ref',
          height: 400,
          width: 600
        }
      ],
      reviews: this.generateMockReviews(),
      opening_hours: {
        open_now: true,
        weekday_text: [
          'Monday: 9:00 AM – 6:00 PM',
          'Tuesday: 9:00 AM – 6:00 PM',
          'Wednesday: 9:00 AM – 6:00 PM',
          'Thursday: 9:00 AM – 6:00 PM',
          'Friday: 9:00 AM – 9:00 PM',
          'Saturday: 10:00 AM – 9:00 PM',
          'Sunday: 10:00 AM – 6:00 PM'
        ]
      },
      formatted_phone_number: '+1 (555) 123-4567',
      website: 'https://sample-business.com'
    };
  }

  private static generateMockReviews() {
    const authors = ['John D.', 'Sarah M.', 'Mike R.', 'Emily Chen', 'David Wilson'];
    const reviews = [
      'Great place with excellent service! Highly recommend.',
      'Amazing experience, will definitely come back.',
      'Good value for money, staff was friendly.',
      'Beautiful location and wonderful atmosphere.',
      'Exceeded our expectations in every way.'
    ];

    return Array.from({ length: 5 }, (_, i) => ({
      author_name: authors[i],
      author_url: `https://www.google.com/maps/contrib/${Math.random().toString(36)}`,
      language: 'en',
      profile_photo_url: `https://images.unsplash.com/photo-${1500000000000 + i}?w=40&h=40&fit=crop&crop=face`,
      rating: Math.floor(Math.random() * 2) + 4,
      relative_time_description: `${Math.floor(Math.random() * 30) + 1} days ago`,
      text: reviews[i],
      time: Math.floor(Date.now() / 1000) - (Math.random() * 30 * 24 * 60 * 60)
    }));
  }
}

/**
 * Review Analysis Service using GPT-4o-mini
 */
export class ReviewAnalysisService {
  static async analyzeReviews(reviews: GooglePlace['reviews'], businessName: string): Promise<ReviewSentiment> {
    if (!reviews || reviews.length === 0) {
      return this.getDefaultSentiment();
    }

    try {
      const reviewTexts = reviews.map(r => r.text).join('\n\n');
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      const prompt = `Analyze these ${reviews.length} reviews for "${businessName}":

${reviewTexts}

Provide a JSON analysis with:
1. overall_sentiment: "positive", "neutral", or "negative"
2. sentiment_score: 0-1 (0=very negative, 1=very positive)
3. key_themes: [array of main topics mentioned]
4. pros: [array of positive aspects]
5. cons: [array of negative aspects]  
6. summary: brief summary of overall opinion
7. recommendation: short recommendation for travelers

Be objective and accurate. Focus on actionable insights for travelers.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a travel review analyst. Provide accurate sentiment analysis in valid JSON format only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No analysis generated');

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found');

      const analysis = JSON.parse(jsonMatch[0]);
      return ReviewSentimentSchema.parse(analysis);

    } catch (error) {
      console.error('Review analysis error:', error);
      return this.getDefaultSentiment();
    }
  }

  private static getDefaultSentiment(): ReviewSentiment {
    return {
      overall_sentiment: 'positive',
      sentiment_score: 0.7,
      key_themes: ['service', 'location', 'value'],
      pros: ['Good service', 'Convenient location'],
      cons: ['Minor improvements needed'],
      summary: 'Generally positive reviews with satisfied customers.',
      recommendation: 'Recommended for most travelers.'
    };
  }

  static async getBulkSentiments(places: GooglePlace[]): Promise<Map<string, ReviewSentiment>> {
    const sentiments = new Map<string, ReviewSentiment>();

    // Analyze reviews in parallel with rate limiting
    const promises = places.map(async (place, index) => {
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, index * 200));
      
      try {
        const sentiment = await this.analyzeReviews(place.reviews, place.name);
        sentiments.set(place.place_id, sentiment);
      } catch (error) {
        console.error(`Error analyzing reviews for ${place.name}:`, error);
        sentiments.set(place.place_id, this.getDefaultSentiment());
      }
    });

    await Promise.all(promises);
    return sentiments;
  }
}

/**
 * Google Maps Service for directions and geocoding
 */
export class GoogleMapsService {
  private static apiKey = GOOGLE_CONFIG.geocoding.key;

  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (this.apiKey === 'demo-key') {
      return { lat: 15.2993 + Math.random() * 0.1, lng: 74.1240 + Math.random() * 0.1 };
    }

    try {
      const response = await fetch(
        `${GOOGLE_CONFIG.geocoding.baseUrl}/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK' || data.results.length === 0) {
        return null;
      }

      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };

    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  static async getDirections(params: {
    origin: string | { lat: number; lng: number };
    destination: string | { lat: number; lng: number };
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
    waypoints?: string[];
  }) {
    const { origin, destination, mode = 'driving', waypoints } = params;

    if (this.apiKey === 'demo-key') {
      return this.generateMockDirections(params);
    }

    try {
      const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
      const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;

      const searchParams = new URLSearchParams({
        origin: originStr,
        destination: destStr,
        mode,
        key: this.apiKey,
        ...(waypoints && waypoints.length > 0 && {
          waypoints: waypoints.join('|')
        })
      });

      const response = await fetch(
        `${GOOGLE_CONFIG.directions.baseUrl}/json?${searchParams}`
      );

      if (!response.ok) {
        throw new Error(`Directions API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Directions API status: ${data.status}`);
      }

      return data;

    } catch (error) {
      console.error('Directions error:', error);
      return this.generateMockDirections(params);
    }
  }

  private static generateMockDirections(params: any) {
    return {
      routes: [{
        legs: [{
          distance: { text: '15.2 km', value: 15200 },
          duration: { text: '25 mins', value: 1500 },
          start_address: typeof params.origin === 'string' ? params.origin : 'Start Location',
          end_address: typeof params.destination === 'string' ? params.destination : 'End Location',
          steps: [
            {
              html_instructions: 'Head north on Main St',
              distance: { text: '2.1 km', value: 2100 },
              duration: { text: '3 mins', value: 180 }
            },
            {
              html_instructions: 'Turn right onto Highway 101',
              distance: { text: '10.5 km', value: 10500 },
              duration: { text: '15 mins', value: 900 }
            },
            {
              html_instructions: 'Turn left to destination',
              distance: { text: '2.6 km', value: 2600 },
              duration: { text: '7 mins', value: 420 }
            }
          ]
        }],
        overview_polyline: {
          points: 'mockEncodedPolylineString'
        }
      }]
    };
  }
}

