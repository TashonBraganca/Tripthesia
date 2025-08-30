import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { withAISubscriptionCheck, getAIAccess } from '@/lib/subscription/ai-restrictions';

// Input validation schema
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

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function createTripGenerationPrompt(input: TripGenerationInput): string {
  const interestsText = input.interests?.length 
    ? `with interests in ${input.interests.join(', ')}` 
    : '';
  
  const styleText = input.travelStyle ? `in ${input.travelStyle} style` : '';
  const groupText = input.groupSize && input.groupSize > 1 
    ? `for a group of ${input.groupSize} people` 
    : 'for a solo traveler';

  return `Create a comprehensive ${input.duration}-day travel itinerary for ${input.destination} ${groupText} ${interestsText} ${styleText}.

Budget: ${input.budget} ${input.currency}
${input.accommodation ? `Preferred accommodation: ${input.accommodation}` : ''}
${input.transportation ? `Preferred transportation: ${input.transportation}` : ''}
${input.specialRequests ? `Special requests: ${input.specialRequests}` : ''}

Please provide a detailed JSON response with the following structure:
{
  "title": "Catchy trip title",
  "overview": "Brief trip overview and highlights",
  "dailyItinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD format (start from today + 7 days)",
      "theme": "Day theme (e.g., 'Historical Exploration')",
      "activities": [
        {
          "time": "09:00",
          "title": "Activity name",
          "description": "Detailed description",
          "location": "Specific address or landmark",
          "duration": 120,
          "category": "sightseeing",
          "estimatedCost": 25,
          "priority": "high",
          "tips": ["Practical tip 1", "Practical tip 2"]
        }
      ],
      "estimatedCost": 150,
      "transportation": ["Walking", "Metro"]
    }
  ],
  "budgetBreakdown": {
    "accommodation": 500,
    "food": 300,
    "activities": 200,
    "transportation": 150,
    "shopping": 100,
    "miscellaneous": 50,
    "total": 1300,
    "currency": "${input.currency}"
  },
  "recommendations": {
    "bestTimeToVisit": "Season and months",
    "weatherTips": ["Weather advice"],
    "culturalTips": ["Cultural etiquette"],
    "safetyTips": ["Safety advice"],
    "packingTips": ["What to pack"]
  },
  "localInsights": ["Local insight 1", "Local insight 2"],
  "hiddenGems": ["Hidden gem 1", "Hidden gem 2"]
}

Make the itinerary realistic, well-paced, and include:
- Mix of must-see attractions and local experiences
- Realistic timing and transportation between locations
- Budget-appropriate suggestions
- Local restaurants and food experiences
- Cultural activities and insights
- Practical tips for each activity
- Hidden gems and off-the-beaten-path experiences

Ensure all costs are realistic for ${input.destination} and align with the ${input.budget} ${input.currency} budget.`;
}

export async function POST(request: NextRequest) {
  return withAISubscriptionCheck('canUseAIGenerator', async (userInfo) => {
    try {
      // Check if OpenAI is available
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'AI service not configured' },
          { status: 503 }
        );
      }

      // Parse and validate request body
      const body = await request.json();
      const input = generateTripSchema.parse(body);

      // Get user's AI access settings
      const aiAccess = userInfo.aiAccess;
      
      // Generate trip using OpenAI with appropriate model for user tier
      const prompt = createTripGenerationPrompt(input);
      
      const completion = await openai.chat.completions.create({
        model: aiAccess.aiModel, // Use tier-appropriate model
        messages: [
          {
            role: 'system',
            content: `You are an expert travel planner with deep knowledge of destinations worldwide. 
            Create detailed, realistic, and personalized travel itineraries that provide excellent value 
            within the specified budget. Focus on authentic local experiences alongside must-see attractions.
            Always respond with valid JSON that matches the requested structure exactly.
            
            User tier: ${userInfo.tier} - Adjust response complexity accordingly.
            ${userInfo.tier === 'pro' ? 'Provide premium insights and advanced recommendations.' : ''}
            ${userInfo.tier === 'free' ? 'Keep recommendations concise but helpful.' : ''}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: userInfo.tier === 'pro' ? 0.8 : 0.7, // More creative for Pro users
        max_tokens: userInfo.tier === 'pro' ? 5000 : userInfo.tier === 'starter' ? 4000 : 3000,
        response_format: { type: 'json_object' }
      });

      const generatedContent = completion.choices[0]?.message?.content;
      if (!generatedContent) {
        throw new Error('No content generated from AI');
      }

      // Parse and validate AI response
      let generatedTrip: GeneratedTrip;
      try {
        generatedTrip = JSON.parse(generatedContent);
      } catch (error) {
        console.error('Failed to parse AI response:', error);
        throw new Error('Invalid AI response format');
      }

      // Add metadata
      const response = {
        ...generatedTrip,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: aiAccess.aiModel,
          userId: userInfo.tier, // Don't expose actual userId
          inputParams: input,
          tier: userInfo.tier,
          remainingGenerations: userInfo.limits.aiGenerationsPerTrip - 1,
          upgradeAvailable: userInfo.tier !== 'pro',
        }
      };

      return NextResponse.json(response);

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

    // OpenAI API errors
    if (error instanceof Error && error.name === 'APIError') {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate trip itinerary' },
      { status: 500 }
    );
    }
  });
}

// GET endpoint for testing AI service health
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ available: false, reason: 'API key not configured' });
    }

    // Test OpenAI connection
    const models = await openai.models.list();
    const hasGPT4 = models.data.some(model => model.id.includes('gpt-4'));

    return NextResponse.json({
      available: true,
      model: 'gpt-4o-mini',
      features: ['trip-generation', 'personalization', 'budget-optimization'],
      capabilities: {
        maxDays: 30,
        supportedCurrencies: ['USD', 'INR'],
        supportedStyles: ['budget', 'mid-range', 'luxury']
      }
    });

  } catch (error) {
    console.error('AI service health check error:', error);
    return NextResponse.json({ 
      available: false, 
      reason: 'Service check failed' 
    });
  }
}