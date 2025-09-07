import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { withAISubscriptionCheck, getAIAccess } from '@/lib/subscription/ai-restrictions';
import { AdvancedAIService, TripPreferencesSchema, TripPreferences } from '@/lib/ai/advanced-ai-service';

// Legacy input schema for backward compatibility
const generateTripSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  duration: z.number().min(1).max(30, 'Duration must be between 1-30 days'),
  budget: z.number().min(0, 'Budget must be positive'),
  currency: z.enum(['USD', 'INR']),
  interests: z.array(z.string()).optional(),
  travelStyle: z.enum(['budget', 'mid-range', 'luxury']).optional(),
  groupSize: z.number().min(1).max(20).optional(),
  accommodation: z.enum(['hostel', 'hotel', 'resort', 'apartment']).optional(),
  transportation: z.enum(['flight', 'train', 'bus', 'car']).optional(),
  specialRequests: z.string().optional(),
});

// Enhanced schema using AdvancedAIService types
const enhancedTripSchema = z.union([
  generateTripSchema,
  TripPreferencesSchema
]);

type TripGenerationInput = z.infer<typeof generateTripSchema>;

interface GeneratedTrip {
  title: string;
  overview: string;
  dailyItinerary: DailyItinerary[];
  budgetBreakdown: BudgetBreakdown;
  recommendations: Recommendations;
  localInsights: string[];
  hiddenGems: string[];
}

interface DailyItinerary {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
  estimatedCost: number;
  transportation: string[];
}

interface Activity {
  time: string;
  title: string;
  description: string;
  location: string;
  duration: number; // minutes
  category: 'sightseeing' | 'dining' | 'entertainment' | 'shopping' | 'transport' | 'accommodation';
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  tips: string[];
}

interface BudgetBreakdown {
  accommodation: number;
  food: number;
  activities: number;
  transportation: number;
  shopping: number;
  miscellaneous: number;
  total: number;
  currency: string;
}

interface Recommendations {
  bestTimeToVisit: string;
  weatherTips: string[];
  culturalTips: string[];
  safetyTips: string[];
  packingTips: string[];
}

// Initialize AI Service
let aiService: AdvancedAIService;
try {
  aiService = new AdvancedAIService();
} catch (error) {
  console.error('Failed to initialize AI service:', error);
}

// Convert legacy input to TripPreferences
function convertLegacyInput(input: TripGenerationInput): TripPreferences {
  const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Start in 7 days
  const endDate = new Date(startDate.getTime() + (input.duration - 1) * 24 * 60 * 60 * 1000);

  return {
    destination: input.destination,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    travelers: {
      adults: input.groupSize || 1,
      children: 0
    },
    budget: {
      total: input.budget,
      currency: input.currency
    },
    preferences: {
      tripType: getTripTypeFromInterests(input.interests),
      pace: 'moderate',
      accommodationType: mapAccommodationType(input.accommodation),
      transportMode: mapTransportMode(input.transportation),
      interests: input.interests || [],
      dietaryRestrictions: [],
      accessibility: false,
      groupDynamics: (input.groupSize || 1) === 1 ? 'solo' : 'friends'
    },
    constraints: {
      mustInclude: input.specialRequests ? [input.specialRequests] : [],
      mustAvoid: [],
      timeConstraints: [],
      weatherPreferences: 'any'
    }
  };
}

function getTripTypeFromInterests(interests?: string[]): 'leisure' | 'business' | 'adventure' | 'cultural' | 'family' | 'romantic' | 'backpacking' {
  if (!interests || interests.length === 0) return 'leisure';
  
  const adventureKeywords = ['adventure', 'hiking', 'trekking', 'outdoor', 'sports'];
  const culturalKeywords = ['culture', 'history', 'museum', 'art', 'heritage'];
  const familyKeywords = ['family', 'kids', 'children'];
  
  if (interests.some(i => adventureKeywords.some(k => i.toLowerCase().includes(k)))) return 'adventure';
  if (interests.some(i => culturalKeywords.some(k => i.toLowerCase().includes(k)))) return 'cultural';
  if (interests.some(i => familyKeywords.some(k => i.toLowerCase().includes(k)))) return 'family';
  
  return 'leisure';
}

function mapAccommodationType(accommodation?: string): 'budget' | 'mid-range' | 'luxury' | 'mixed' {
  switch (accommodation) {
    case 'hostel': return 'budget';
    case 'hotel': return 'mid-range';
    case 'resort': return 'luxury';
    case 'apartment': return 'mid-range';
    default: return 'mid-range';
  }
}

function mapTransportMode(transportation?: string): 'flights' | 'trains' | 'buses' | 'car' | 'mixed' {
  switch (transportation) {
    case 'flight': return 'flights';
    case 'train': return 'trains';
    case 'bus': return 'buses';
    case 'car': return 'car';
    default: return 'mixed';
  }
}

export async function POST(request: NextRequest) {
  return withAISubscriptionCheck('canUseAIGenerator', async (userInfo) => {
    try {
      // Check if AI service is available
      if (!aiService) {
        return NextResponse.json(
          { error: 'AI service not configured' },
          { status: 503 }
        );
      }

      // Parse and validate request body
      const body = await request.json();
      
      // Try to parse with enhanced schema first, fall back to legacy
      let tripPreferences: TripPreferences;
      try {
        // Check if it's new format (TripPreferences)
        const enhanced = enhancedTripSchema.parse(body);
        if ('preferences' in enhanced) {
          tripPreferences = enhanced as TripPreferences;
        } else {
          // Convert legacy format
          tripPreferences = convertLegacyInput(enhanced as TripGenerationInput);
        }
      } catch (error) {
        // Fallback to legacy parsing
        const input = generateTripSchema.parse(body);
        tripPreferences = convertLegacyInput(input);
      }

      // Log request for analytics
      console.log('AI Trip Generation Request:', {
        destination: tripPreferences.destination,
        duration: Math.ceil((new Date(tripPreferences.endDate).getTime() - new Date(tripPreferences.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        budget: tripPreferences.budget.total,
        tier: userInfo.tier,
        userId: userInfo.tier, // Don't expose actual userId
      });

      // Generate trip using AdvancedAIService
      const startTime = Date.now();
      const response = await aiService.generateTrip(tripPreferences);
      const generationTime = Date.now() - startTime;

      if (!response.success) {
        return NextResponse.json({
          error: response.error || 'Failed to generate trip',
          code: 'GENERATION_FAILED'
        }, { status: 500 });
      }

      // Convert to legacy format for backward compatibility
      const legacyResponse = convertToLegacyFormat(response.data!);

      // Add enhanced metadata
      const enhancedResponse = {
        ...legacyResponse,
        metadata: {
          generatedAt: new Date().toISOString(),
          generationTime,
          provider: response.provider,
          usage: response.usage,
          cost: response.cost,
          tier: userInfo.tier,
          remainingGenerations: userInfo.limits.aiGenerationsPerTrip - 1,
          upgradeAvailable: userInfo.tier !== 'pro',
          version: '4.2.0',
          enhanced: true // Indicates use of AdvancedAIService
        },
        // Include original AdvancedAI response for enhanced clients
        enhanced: {
          fullItinerary: response.data,
          aiMetadata: {
            provider: response.provider,
            confidence: response.data?.metadata.confidence,
            sources: response.data?.metadata.sources
          }
        }
      };

      return NextResponse.json(enhancedResponse);

    } catch (error) {
      console.error('AI trip generation error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Invalid input parameters',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to generate trip itinerary' },
        { status: 500 }
      );
    }
  });
}

// Convert AdvancedAI response to legacy format for backward compatibility
function convertToLegacyFormat(itinerary: any): GeneratedTrip {
  return {
    title: itinerary.title,
    overview: itinerary.description,
    dailyItinerary: itinerary.days.map((day: any, index: number) => ({
      day: index + 1,
      date: day.date,
      theme: day.title,
      activities: day.activities.map((activity: any) => ({
        time: activity.time,
        title: activity.title,
        description: activity.description,
        location: activity.location.address,
        duration: activity.duration,
        category: activity.category,
        estimatedCost: activity.estimatedCost,
        priority: activity.priority === 'must-do' ? 'high' : activity.priority === 'recommended' ? 'medium' : 'low',
        tips: activity.notes ? [activity.notes] : []
      })),
      estimatedCost: day.totalCost,
      transportation: day.transportation.map((t: any) => t.mode)
    })),
    budgetBreakdown: {
      accommodation: itinerary.estimatedCost.breakdown.accommodation,
      food: itinerary.estimatedCost.breakdown.dining,
      activities: itinerary.estimatedCost.breakdown.activities,
      transportation: itinerary.estimatedCost.breakdown.transportation,
      shopping: itinerary.estimatedCost.breakdown.other / 2,
      miscellaneous: itinerary.estimatedCost.breakdown.other / 2,
      total: itinerary.estimatedCost.total,
      currency: itinerary.estimatedCost.currency
    },
    recommendations: {
      bestTimeToVisit: itinerary.recommendations.bestTimeToVisit,
      weatherTips: [],
      culturalTips: itinerary.recommendations.localEtiquette,
      safetyTips: [],
      packingTips: itinerary.recommendations.packingTips
    },
    localInsights: itinerary.recommendations.budgetTips,
    hiddenGems: itinerary.recommendations.hiddenGems.map((gem: any) => gem.name)
  };
}

// GET endpoint for testing AI service health
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!aiService) {
      return NextResponse.json({ 
        available: false, 
        reason: 'AI service not initialized',
        version: '4.2.0'
      });
    }

    return NextResponse.json({
      available: true,
      version: '4.2.0',
      service: 'AdvancedAIService',
      providers: {
        openai: !!process.env.OPENAI_API_KEY,
        gemini: !!process.env.GOOGLE_GEMINI_API_KEY
      },
      features: [
        'intelligent-trip-generation',
        'multi-provider-support',
        'personalized-recommendations',
        'budget-optimization',
        'structured-output',
        'fallback-handling',
        'cost-tracking'
      ],
      capabilities: {
        maxDays: 30,
        supportedCurrencies: ['USD', 'INR'],
        supportedTripTypes: ['leisure', 'business', 'adventure', 'cultural', 'family', 'romantic', 'backpacking'],
        supportedPaces: ['relaxed', 'moderate', 'fast'],
        accommodationTypes: ['budget', 'mid-range', 'luxury', 'mixed'],
        transportModes: ['flights', 'trains', 'buses', 'car', 'mixed']
      },
      enhancements: {
        legacyCompatibility: true,
        enhancedSchema: true,
        intelligentRouting: true,
        structuredValidation: true,
        costOptimization: true
      }
    });

  } catch (error) {
    console.error('AI service health check error:', error);
    return NextResponse.json({ 
      available: false, 
      reason: 'Service check failed',
      version: '4.2.0'
    });
  }
}