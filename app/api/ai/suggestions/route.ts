import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Input validation schema
const suggestionsSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  userPreferences: z.object({
    interests: z.array(z.string()).optional(),
    budget: z.number().optional(),
    currency: z.enum(['USD', 'INR']).optional(),
    travelStyle: z.enum(['budget', 'mid-range', 'luxury']).optional(),
    activityTypes: z.array(z.string()).optional(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'any']).optional(),
    duration: z.number().optional(), // in minutes
    groupSize: z.number().optional(),
  }),
  currentActivities: z.array(z.object({
    title: z.string(),
    location: z.string(),
    category: z.string(),
    time: z.string(),
  })).optional(),
  context: z.object({
    season: z.string().optional(),
    weather: z.string().optional(),
    localEvents: z.array(z.string()).optional(),
    currentDate: z.string().optional(),
  }).optional(),
});

type SuggestionsInput = z.infer<typeof suggestionsSchema>;

interface PersonalizedSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  location: {
    name: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  estimatedCost: number;
  currency: string;
  duration: number; // minutes
  bestTimeToVisit: string[];
  difficulty: 'easy' | 'moderate' | 'challenging';
  crowdLevel: 'low' | 'moderate' | 'high';
  personalizedReason: string;
  tips: string[];
  similarActivities: string[];
  bookingInfo?: {
    advanceBooking: boolean;
    bookingUrl?: string;
    contactInfo?: string;
  };
  accessibility: {
    wheelchairAccessible: boolean;
    publicTransport: boolean;
    walkingRequired: boolean;
  };
  ratings: {
    overall: number;
    authenticity: number;
    valueForMoney: number;
    experienceQuality: number;
  };
  hiddenGem: boolean;
  localInsight: string;
}

interface SuggestionsResponse {
  suggestions: PersonalizedSuggestion[];
  categories: {
    name: string;
    count: number;
    suggestions: string[];
  }[];
  budgetAnalysis: {
    averageCost: number;
    budgetFriendly: number;
    premium: number;
    currency: string;
  };
  localInsights: string[];
  seasonalTips: string[];
  metadata: {
    generatedAt: string;
    destination: string;
    totalSuggestions: number;
  };
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function createSuggestionsPrompt(input: SuggestionsInput): string {
  const { destination, userPreferences, currentActivities, context } = input;
  
  const preferencesText = userPreferences.interests?.length 
    ? `User is interested in: ${userPreferences.interests.join(', ')}.` 
    : '';
  
  const budgetText = userPreferences.budget 
    ? `Budget per activity: ${userPreferences.budget} ${userPreferences.currency || 'USD'}.` 
    : '';
  
  const currentActivitiesText = currentActivities?.length
    ? `Already planned activities: ${currentActivities.map(a => `${a.title} at ${a.location}`).join(', ')}.`
    : '';

  const contextText = context?.season 
    ? `Current season: ${context.season}. Weather: ${context.weather || 'unknown'}.`
    : '';

  return `As an expert local guide for ${destination}, provide personalized activity suggestions based on user preferences and current context.

User Profile:
${preferencesText}
${budgetText}
Travel style: ${userPreferences.travelStyle || 'mid-range'}
Group size: ${userPreferences.groupSize || 1} people
Preferred time: ${userPreferences.timeOfDay || 'any'}
Duration preference: ${userPreferences.duration || 'flexible'} minutes

Context:
${currentActivitiesText}
${contextText}
Local events: ${context?.localEvents?.join(', ') || 'none specified'}

Please provide 8-12 personalized suggestions in JSON format:

{
  "suggestions": [
    {
      "id": "unique_id",
      "title": "Activity name",
      "description": "Detailed description highlighting why this matches user preferences",
      "category": "sightseeing|dining|entertainment|shopping|nature|cultural|adventure",
      "location": {
        "name": "Specific location name",
        "address": "Full address",
        "coordinates": { "lat": 0.0, "lng": 0.0 }
      },
      "estimatedCost": 25,
      "currency": "${userPreferences.currency || 'USD'}",
      "duration": 120,
      "bestTimeToVisit": ["morning", "afternoon"],
      "difficulty": "easy|moderate|challenging",
      "crowdLevel": "low|moderate|high",
      "personalizedReason": "Why this specifically matches their interests/preferences",
      "tips": ["Practical tip 1", "Practical tip 2", "Local insider tip"],
      "similarActivities": ["Similar option 1", "Similar option 2"],
      "bookingInfo": {
        "advanceBooking": true,
        "bookingUrl": "https://example.com",
        "contactInfo": "+1-234-567-8900"
      },
      "accessibility": {
        "wheelchairAccessible": true,
        "publicTransport": true,
        "walkingRequired": false
      },
      "ratings": {
        "overall": 4.5,
        "authenticity": 4.8,
        "valueForMoney": 4.2,
        "experienceQuality": 4.6
      },
      "hiddenGem": false,
      "localInsight": "Local perspective or insider knowledge"
    }
  ],
  "categories": [
    {
      "name": "Cultural Experiences",
      "count": 3,
      "suggestions": ["Museum visits", "Local festivals", "Traditional crafts"]
    }
  ],
  "budgetAnalysis": {
    "averageCost": 35,
    "budgetFriendly": 5,
    "premium": 2,
    "currency": "${userPreferences.currency || 'USD'}"
  },
  "localInsights": [
    "Best times to avoid crowds",
    "Local customs to be aware of",
    "Hidden local spots"
  ],
  "seasonalTips": [
    "What to expect during this season",
    "Seasonal activities available",
    "Weather considerations"
  ],
  "metadata": {
    "generatedAt": "${new Date().toISOString()}",
    "destination": "${destination}",
    "totalSuggestions": 10
  }
}

Focus on:
1. Matching user's stated interests and preferences
2. Avoiding duplication with current activities
3. Including mix of popular and hidden gems
4. Providing practical, actionable information
5. Highlighting authentic local experiences
6. Considering budget constraints
7. Including accessibility information
8. Providing local insights and insider tips

Make suggestions diverse across categories while staying true to user preferences.`;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if OpenAI is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const input = suggestionsSchema.parse(body);

    // Generate suggestions using OpenAI
    const prompt = createSuggestionsPrompt(input);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert local travel guide with deep knowledge of destinations worldwide. 
          Your expertise includes understanding local culture, hidden gems, authentic experiences, and practical travel advice.
          Provide personalized recommendations that match user preferences while highlighting unique local experiences.
          Always respond with valid JSON that matches the requested structure exactly.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3500,
      response_format: { type: 'json_object' }
    });

    const generatedContent = completion.choices[0]?.message?.content;
    if (!generatedContent) {
      throw new Error('No content generated from AI');
    }

    // Parse and validate AI response
    let suggestions: SuggestionsResponse;
    try {
      suggestions = JSON.parse(generatedContent);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }

    // Add request metadata
    const response = {
      ...suggestions,
      requestMetadata: {
        userId,
        timestamp: new Date().toISOString(),
        destination: input.destination,
        preferences: input.userPreferences,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI suggestions error:', error);
    
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
      { error: 'Failed to generate personalized suggestions' },
      { status: 500 }
    );
  }
}

// GET endpoint for suggestion categories and capabilities
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json({
      available: !!process.env.OPENAI_API_KEY,
      capabilities: {
        categories: [
          'sightseeing', 'dining', 'entertainment', 'shopping', 
          'nature', 'cultural', 'adventure', 'nightlife', 'relaxation'
        ],
        difficulties: ['easy', 'moderate', 'challenging'],
        crowdLevels: ['low', 'moderate', 'high'],
        timeSlots: ['morning', 'afternoon', 'evening', 'any'],
        supportedCurrencies: ['USD', 'INR'],
        maxSuggestions: 15,
        features: [
          'personalized-matching',
          'local-insights',
          'hidden-gems',
          'accessibility-info',
          'booking-assistance',
          'seasonal-recommendations'
        ]
      },
      popularDestinations: [
        'Tokyo, Japan', 'Paris, France', 'New York, USA', 'London, UK',
        'Bangkok, Thailand', 'Singapore', 'Dubai, UAE', 'Sydney, Australia',
        'Rome, Italy', 'Barcelona, Spain', 'Mumbai, India', 'Delhi, India'
      ]
    });

  } catch (error) {
    console.error('Suggestions service info error:', error);
    return NextResponse.json({ 
      available: false, 
      error: 'Service check failed' 
    });
  }
}